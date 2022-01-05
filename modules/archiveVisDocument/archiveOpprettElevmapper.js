const p360 = require("../nodep360/p360");
const getPdfsInFolder = require("../getPdfsInFolder/getPdfsInFolder");
const pdfReader = require("../pdfReader/pdfReader");
const fs = require('fs');
const findDocumentData = require("./findVisDocumentData");
const getBase64 = require("../getBase64/getBase64");
const getElevmappe = require("../getElevmappe/getElevmappe");
const createMetadata = require("../metadataGenerator/createMetadata");
const syncPrivatePerson = require("../syncPrivatePerson/syncPrivatePerson");
const createElevmappe = require("../createElevmappe/createElevmappe");
const moveToFolder = require("../moveToFolder/moveToFolder");
const writeLog = require("../writeLog/writeLog");
const writeStat = require("../writeLog/writeStat");
const twhError = require("../teamsWebhook/twhError");
const twhInfo = require("../teamsWebhook/twhInfo"); // FOR MANUALLY DISPATCHING
const getEmailFromFile = require("../getEmailFromFile/getEmailFromFile");
const getElevinfo = require("../fint/getElevinfo");
const getFilesInFolder = require("../getPdfsInFolder/getFilesInFolder");

module.exports = async (archiveMethod, options, pdfFieldDesc) => {
    
    let p360url = options.P360_URL;
    let p360authkey = options.P360_AUTHKEY;
    
    const stats = {
        imported: 0,
        opprettetElevmappe: 0,
        addressBlock: 0,
        dispatched: 0,
        manualDispatch: 0,
        error: 0
        // and whatever you like statistics on, update them wherever suitable in the flow, and finally, write them to statfile with writeStat(archiveMethod.metadataSchema, stats)
    }

    const listOfCsvFiles = getFilesInFolder(archiveMethod.inputFolder, "csv")

    var fnrArray;
    if (listOfCsvFiles.length > 0){
        try {
          writeLog(" Leser innhold i CSV: " + listOfCsvFiles[0])
          const data = fs.readFileSync(listOfCsvFiles[0], 'utf8')
          fnrArray = data.split('\r\n')
        } catch (err) {
          writeLog(" Feil med å lese inn CSV: "+listOfCsvFiles[0], "error: " + err)
        }
      }

    for (pdf of fnrArray) {
        let createElevmappeBool = false; // For control of creating elevmappe
        let sendToParentsBool = false;  // For control of student under 18 years
        let blockedAddress = false; // For control of students blocked address
        let missingDsfParents = false; // For control of student missing parents in DSF
        let documentNumber; // If we need to create internal note - store documentnumber in this variable
        let pdfContent;

        writeLog("--- New elev: "+pdf+" ---");
        writeLog("--- Splitter... ---");
        var felter = pdf.split(';')
        let documentData = {
            studentBirthnr: felter[0],
            navn: felter[1],
            gateadresse: felter[2],
            postnummer: felter[3],
            poststed: felter[4]
        };

        
        // Update or create private person in p360
        let privatePersonRecno;
        const syncPrivatePersonOptions = {
            url: p360url,
            authkey: p360authkey
        }
        let studentData = {}
        let nameList = documentData.navn.split(" ");
        studentData.lastName = nameList.pop();
        studentData.firstName = nameList.join(" ");
        studentData.streetAddress = documentData.gateadresse;
        studentData.zipCode = documentData.postnummer;
        studentData.zipPlace = documentData.poststed;
        studentData.birthnr = documentData.studentBirthnr;

        try {
            privatePersonRecno = await syncPrivatePerson(studentData, syncPrivatePersonOptions);
            // TODO: Bruker vi blokkerte adresser i P360?

            writeLog("  Updated or created privatePerson in 360 with fnr: "+documentData.studentBirthnr)
        } catch (error) {
            writeLog("  Error when trying create or update private person for student, file moved to "+archiveMethod.errorFolder+": "+error);
            moveToFolder(pdf, archiveMethod.errorFolder);
            stats.error++
            await twhError("Error when trying create or update privatePerson for student i p360", error, pdf);
            continue; // moves to next pdf in listOfPdfs
        }

        // Create private persons for parents - if needed
        if (archiveMethod.sendToParents && sendToParentsBool && !blockedAddress && !missingDsfParents) {
            // for parent in parents: Create or update privateperson for parent :)
            try {
                for (parent of documentData.parents) {
                    let parentData = {}
                    let pNameList = parent.personName.split(" ");
                    parentData.lastName = pNameList.pop();
                    parentData.firstName = pNameList.join(" ");
                    parentData.streetAddress = parent.streetAddress;
                    parentData.zipCode = parent.zipCode;
                    parentData.zipPlace = parent.zipPlace;
                    parentData.birthnr = parent.birthnr;
                    let parentRecno = await syncPrivatePerson(parentData, syncPrivatePersonOptions);
                    writeLog("  Updated or created privatePerson in 360 for parent with fnr: "+parent.birthnr)
                }
            } catch (error) {
                writeLog("  Error when trying create or update private person for parents, file moved to "+archiveMethod.errorFolder+": "+error);
                moveToFolder(pdf, archiveMethod.errorFolder);
                stats.error++
                await twhError("Error when trying create or update private person for parents in p360", error, pdf);
                continue; // moves to next pdf in listOfPdfs
            }
        }

        // get elevmappe and add caseNumber to documentData
        const studentFolderOptions = {
            url: p360url,
            authkey: p360authkey
        }
        try {
            const studentFolderRes = await getElevmappe(documentData.studentBirthnr, studentFolderOptions); // returns false if elevmappe was not found
            if (!studentFolderRes) {
                if (archiveMethod.createElevmappe) {
                    createElevmappeBool = true;
                    writeLog("  Could not find elevmappe - will try to create new elevmappe");
                }
                else {
                    writeLog("  Could not find elevmappe - do something you want to do");
                    // Set some variable to send to unregistered or something - might never need this
                }
            }
            else {
                documentData.elevmappeCaseNumber = studentFolderRes.CaseNumber; // Found elevmappe for student
                documentData.elevmappeAccessGroup = studentFolderRes.AccessGroup
                documentData.elevmappeStatus = studentFolderRes.Status
                writeLog("  Found elevmappe with case number: "+studentFolderRes.CaseNumber);
            }
        } catch (error) {
            // maybe implement retry function or something here
            writeLog("  Error when trying to find elevmappe, file moved to "+archiveMethod.errorFolder+": "+error);
            moveToFolder(pdf, archiveMethod.errorFolder);
            stats.error++
            await twhError("Error when trying to find elevmappe in p360", error, pdf);
            continue; // moves to next pdf in listOfPdfs
        }

        // Create elevmappe if needed
        if (createElevmappeBool) {
            writeLog("  Trying to create new elevmappe for student: "+documentData.studentBirthnr);
            let studentData = {}
            let nameList = documentData.navn.split(" ");
            studentData.lastName = nameList.pop();
            studentData.firstName = nameList.join(" ");
            studentData.birthnr = documentData.studentBirthnr;
            
            const createElevmappeOptions = {
                url: p360url,
                authkey: p360authkey
            }
            let elevmappe;
            try {
                elevmappe = await createElevmappe(studentData, createElevmappeOptions);
                documentData.elevmappeCaseNumber = elevmappe;
                writeLog("  Created elevmappe: "+elevmappe);
                stats.opprettetElevmappe++
            } catch (error) {
                writeLog("  Error when trying create elevmappe, file moved to "+archiveMethod.errorFolder+": "+error);
                //moveToFolder(pdf, archiveMethod.errorFolder); // MAYBE RETRY HERE
                stats.error++
                await twhError("Error when trying to create elevmappe in p360", error, pdf);
                continue; // moves to next pdf in listOfPdfs
            }
        }


    }
    // write statistics
    try {
        await writeStat(archiveMethod.metadataSchema, stats)
    } catch (error) {
        writeLog(error);
    }
}