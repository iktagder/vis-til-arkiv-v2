const p360 = require("../../modules/nodep360/p360");
const getPdfsInFolder = require("../../modules/getPdfsInFolder/getPdfsInFolder");
const pdfReader = require("../../modules/pdfReader/pdfReader");
const findDocumentData = require("../../modules/archiveVisDocument/findVisDocumentData");
const getBase64 = require("../../modules/getBase64/getBase64");
const getElevmappe = require("../../modules/getElevmappe/getElevmappe");
const createMetadata = require("../../modules/metadataGenerator/createMetadata");
const syncPrivatePerson = require("../../modules/syncPrivatePerson/syncPrivatePerson");
const createElevmappe = require("../../modules/createElevmappe/createElevmappe");
const moveToFolder = require("../../modules/moveToFolder/moveToFolder");
const writeLog = require("../../modules/writeLog/writeLog");
const writeStat = require("../../modules/writeLog/writeStat");
const twhError = require("../../modules/teamsWebhook/twhError");
const twhInfo = require("../../modules/teamsWebhook/twhInfo"); // FOR MANUALLY DISPATCHING
const getEmailFromFile = require("../../modules/getEmailFromFile/getEmailFromFile");
const getElevinfo = require("../fint/getElevinfo");

module.exports = async (archiveMethod, options, test=false) => {
    
    let p360url = options.P360_URL;
    let p360authkey = options.P360_AUTHKEY;
    
    const stats = {
        imported: 0,
        addressBlock: 0,
        dispatched: 0,
        manualDispatch: 0,
        error: 0
        // and whatever you like statistics on, update them wherever suitable in the flow, and finally, write them to statfile with writeStat(archiveMethod.metadataSchema, stats)
    }

    const listOfPdfs = getPdfsInFolder(archiveMethod.inputFolder)

    for (pdf of listOfPdfs) {
        let createElevmappeBool = false; // For control of creating elevmappe
        let sendToParentsBool = false;  // For control of student under 18 years
        let blockedAddress = false; // For control of students blocked address
        let missingDsfParents = false; // For control of student missing parents in DSF
        let documentNumber; // If we need to create internal note - store documentnumber in this variable
        let pdfContent;
        writeLog("--- New file: "+pdf+" ---");
        try {
            pdfContent = await pdfReader(pdf); //read pdf
            writeLog("  Read pdf")
        } catch (error) {
            writeLog("  Error when trying to read pdf, file moved to "+archiveMethod.errorFolder+": "+error);
            moveToFolder(pdf, archiveMethod.errorFolder);
            stats.error++
            await twhError("Error when trying to read pdf", error, pdf);
            continue; // moves to next pdf in listOfPdfs
        }

        let documentData = {};
        try {
            documentData = findDocumentData(archiveMethod, pdfContent);
            writeLog("  Found documentdata");
        } catch (error) {
            await twhError("Error when trying to find data in pdf", error, pdf);
            writeLog("Error when trying to find data in pdf, file moved to "+archiveMethod.errorFolder+": "+error);
            moveToFolder(pdf, archiveMethod.errorFolder);
            stats.error++
            await twhError("Error when trying to find data in pdf", error, pdf);
            continue; // moves to next pdf in listOfPdfs
        }

        // Finn student i VIS
        let visStudent  
        try {
            visStudent = await getElevinfo(documentData.studentBirthnr);
            writeLog("  Fant elev i VIS: " + visStudent.data.navn.fornavn + " " + visStudent.data.navn.etternavn);
        } catch (error) {
            writeLog("  Error when trying to get student from VIS/FINT, filed moved to "+archiveMethod.errorFolder+": "+error);
            moveToFolder(pdf, archiveMethod.errorFolder);
            stats.error++
            await twhError("Error when trying to get student from VIS/FINT", error, pdf);
            continue;
        }

        //blockedAddress = true; // FOR TESTING

        // Update or create private person in p360
        let privatePersonRecno;
        const syncPrivatePersonOptions = {
            url: p360url,
            authkey: p360authkey
        }
        let studentData = {}
        //let nameList = dsfStudent.studentName.split(" ");
        studentData.lastName = visStudent.data.navn.etternavn;
        studentData.firstName = visStudent.data.navn.fornavn;
        studentData.streetAddress = visStudent.data.bostedsadresse.adresselinje[0];
        studentData.zipCode = visStudent.data.bostedsadresse.postnummer;
        studentData.zipPlace = visStudent.data.bostedsadresse.poststed;
        studentData.birthnr = documentData.studentBirthnr;

        try {
            privatePersonRecno = await syncPrivatePerson(studentData, syncPrivatePersonOptions);
            // TODO: Bruker vi blokkerte adresser i P360?
            if (privatePersonRecno == "hemmelig") { // Check if address is blocked in 360
                blockedAddress = true
                documentData.parents = []
            }
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
            studentData.lastName = visStudent.data.navn.etternavn;
            studentData.firstName = visStudent.data.navn.fornavn;
            //studentData.streetAddress = visStudent.data.bostedsadresse.adresselinje[0];
            //studentData.zipCode = visStudent.data.bostedsadresse.postnummer;
            //studentData.zipPlace = visStudent.data.bostedsadresse.poststed;
            studentData.birthnr = documentData.studentBirthnr;

            const createElevmappeOptions = {
                url: p360url,
                authkey: p360authkey
            }
            let elevmappe;
            try {
                elevmappe = await createElevmappe(studentData, createElevmappeOptions);
                documentData.elevmappeCaseNumber = elevmappe;
            } catch (error) {
                writeLog("  Error when trying create elevmappe, file moved to "+archiveMethod.errorFolder+": "+error);
                moveToFolder(pdf, archiveMethod.errorFolder); // MAYBE RETRY HERE
                stats.error++
                await twhError("Error when trying to create elevmappe in p360", error, pdf);
                continue; // moves to next pdf in listOfPdfs
            }
        }

        if (archiveMethod.createDocument){
            if (documentData.elevmappeStatus === 'Avsluttet') {
                writeLog("  Kan ikke arkivere dokument til avsluttet elevmappe: " + documentData.elevmappeCaseNumber);
                moveToFolder(pdf, archiveMethod.errorFolder);
                await twhError("Kan ikke arkivere dokument til avsluttet elevmappe", "Elevmappe: " + documentData.elevmappeCaseNumber, pdf);
                continue;
            }
            // convert file to base64 and add to metadata
            const base64Pdf = getBase64(pdf);
            //console.log(base64Pdf.substring(50,200));
            documentData.pdfFileBase64 = base64Pdf;
            documentData.studentName = visStudent.data.navn.fornavn + " " + visStudent.data.navn.etternavn
            // Create 360 metadata object
            let p360metadata;
            try {
                p360metadata = await createMetadata(documentData);
                if (archiveMethod.sendToParents && sendToParentsBool) { // Add parents to metadata
                    if (!missingDsfParents && !blockedAddress) {
                        for (parent of documentData.parents) {
                            p360metadata.Contacts.push(
                                {
                                    "ReferenceNumber": parent.birthnr,
                                    "Role": "Mottaker",
                                    "IsUnofficial": true
                                }
                            )
                        }
                    }
                    p360metadata.Status = "R"
                }
                if (archiveMethod.sendToStudent) {
                    p360metadata.Status = "R"
                }
            } catch (error) {
                writeLog("  Error when trying create metadata, file moved to "+archiveMethod.errorFolder+": "+error);
                await twhError("Error when trying to create metadata for archiving", error, pdf);
                moveToFolder(pdf, archiveMethod.errorFolder);
                stats.error++
                continue; // moves to next pdf in listOfPdfs
            }

            //archive document to p360
            let archiveRes;
            const archiveOptions = {
                url: p360url,
                authkey: p360authkey,
                service: "DocumentService",
                method: "CreateDocument"
            }

            try {
                // Alle dokumenter til elever med hemmelig adresse arver tilgangsgruppe fra elevmappen
                if (documentData.elevmappeAccessGroup && documentData.elevmappeAccessGroup.startsWith("SPERRET")){
                    p360metadata.AccessGroup = documentData.elevmappeAccessGroup
                }
                archiveRes = await p360(p360metadata, archiveOptions); // FEILIER IKKE NØDVENDIGVIS MED FEIL METADATA
                if (archiveRes.Successful) {
                    documentNumber = archiveRes.DocumentNumber;
                    writeLog("  Document archived with documentNumber "+archiveRes.DocumentNumber);
                    //writeLog(JSON.stringify(p360metadata)); // uncomment when you need to see metadata, spams the log with base64 (maybe just delete base64 if this becomes a problem)
                    if (!archiveMethod.sendToStudent) {
                        moveToFolder(pdf, archiveMethod.importedFolder);
                        stats.imported++
                    }
                }
                else {
                    throw Error(archiveRes.ErrorMessage)
                }
            } catch (error) {
                writeLog("  Error when trying to archive document to P360, file moved to "+archiveMethod.errorFolder+": "+error);
                moveToFolder(pdf, archiveMethod.errorFolder); // MAYBE RETRY HERE?
                stats.error++
                await twhError("Error when trying to archive document to p360", error, pdf);
                //await twhError("Error when trying to archive document to p360", error, pdf);
                continue; // moves to next pdf in listOfPdfs
            }
        }else if (!archiveMethod.sendToStudent){
            moveToFolder(pdf, archiveMethod.importedFolder);
        }

        // Send document to student with SvarUT
        if (archiveMethod.sendToStudent && !blockedAddress && !archiveMethod.manualSendToStudent) {
            const docNumber = archiveRes.DocumentNumber;
            const dispatchPayload = {
                "Documents": [
                    {
                        "DocumentNumber": docNumber
                    }
                ]
            }
            const dispatchOptions = {
                url: p360url,
                authkey: p360authkey,
                service: "DocumentService",
                method: "DispatchDocuments"
            }
            let dispatchRes;
            try {
                dispatchRes = await p360(dispatchPayload, dispatchOptions)
                if (dispatchRes.Successful) {
                    writeLog("  Document dispatch started - success! The rest is handled by public 360 and KS")
                    moveToFolder(pdf, archiveMethod.importedFolder);
                    stats.imported++
                    stats.dispatched++
                }
                else {
                    throw Error(dispatchRes.ErrorMessage);
                }
            } catch (error) {
                writeLog("  Document dispatch failed: "+error)
                moveToFolder(pdf, archiveMethod.errorFolder); // MAYBE RETRY HERE?
                stats.error++;
                await twhError("Document dispatch failed, documentnumber: "+documentNumber, error, pdf);
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