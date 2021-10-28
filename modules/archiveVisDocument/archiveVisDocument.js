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
const dsfGetElev = require("../../modules/dsf/dsfGetElev");
const getEmailFromFile = require("../../modules/getEmailFromFile/getEmailFromFile");

module.exports = async (archiveMethod, options, test=false) => {
    let p360url;
    let p360authkey;
    if (test) {
        p360url = options.P360TEST_URL;
        p360authkey = options.P360TEST_AUTHKEY;
    }
    else {
        p360url = options.P360_URL;
        p360authkey = options.P360_AUTHKEY;
    }

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

        // Get student and parent data from DSF
        let dsfStudent;
        try {
            dsfStudent = await dsfGetElev(documentData.studentBirthnr, archiveMethod.sendToParents)
            writeLog("  Found student in DSF, birthnr: "+documentData.studentBirthnr)
            documentData.studentName = dsfStudent.studentName
            documentData.streetAddress = dsfStudent.streetAddress
            documentData.zipCode = dsfStudent.zipCode
            documentData.zipPlace = dsfStudent.zipPlace
            if (dsfStudent.age < 18) {
                writeLog("  Student is under 18")
                if (dsfStudent.parents.length < 1) {
                    missingDsfParents = true
                    writeLog("  No parents on same address found in DSF (or archiveMethod.sendToParents is off)")
                }
                sendToParentsBool = true
                documentData.parents = dsfStudent.parents
            }
            if (dsfStudent.blockedAddress) {
                writeLog("  Student has blocked address")
                blockedAddress = true
                documentData.parents = []
            }
        } catch (error) {
            writeLog("  Error when trying to get student from DSF, filed moved to "+archiveMethod.errorFolder+": "+error);
            moveToFolder(pdf, archiveMethod.errorFolder);
            stats.error++
            await twhError("Error when trying to get student from DSF", error, pdf);
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
        let nameList = dsfStudent.studentName.split(" ");
        studentData.lastName = nameList.pop();
        studentData.firstName = nameList.join(" ");
        studentData.streetAddress = dsfStudent.streetAddress;
        studentData.zipCode = dsfStudent.zipCode;
        studentData.zipPlace = dsfStudent.zipPlace;
        studentData.birthnr = documentData.studentBirthnr;

        try {
            privatePersonRecno = await syncPrivatePerson(studentData, syncPrivatePersonOptions);
            if (privatePersonRecno == "hemmelig") { // Check if address is blocked in 360
                blockedAddress = true
                documentData.parents = []
            }
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
            let nameList = dsfStudent.studentName.split(" ");
            studentData.lastName = nameList.pop();
            studentData.firstName = nameList.join(" ");
            studentData.streetAddress = dsfStudent.streetAddress;
            studentData.zipCode = dsfStudent.zipCode;
            studentData.zipPlace = dsfStudent.zipPlace;
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

        // convert file to base64 and add to metadata
        const base64Pdf = getBase64(pdf);
        //console.log(base64Pdf.substring(50,200));
        documentData.pdfFileBase64 = base64Pdf;

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
                //p360metadata.ResponsibleEnterpriseNumber = "15340"; // FOR TESTING
            }
            if (blockedAddress) {
                p360metadata.Status = "J"
                p360metadata.Contacts[1].DispatchChannel = "recno:2"
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
        else if (blockedAddress) {
            writeLog("  Found blocked address, must be handled manually, document is archived in p360")
            // Send internt notat til skolen
            let internalNotemetadata;
            const base64InternalNotePdf = getBase64(options.P360_INTERNAL_NOTES.BLOCKED_ADDRESS); // convert internal note to base64
            const userEmailAddress = getEmailFromFile(pdf);
            const internalNoteData = {
                documentType: "INTERNT_NOTAT_SVARBREV",
                documentNumber: documentNumber,
                studentName: documentData.studentName,
                elevmappeCaseNumber: documentData.elevmappeCaseNumber,
                schoolAccessGroup: documentData.schoolAccessGroup,
                schoolOrgNr: documentData.schoolOrgNr, // HUSK Å SETTE DENNE TIL SKOLENS ORG.NR // Seksjon for arkiv er "15340"
                userEmailAddress: userEmailAddress,
                pdfFileBase64: base64InternalNotePdf
            }
            try {
                internalNotemetadata = await createMetadata(internalNoteData);
            } catch (error) {
                moveToFolder(pdf, archiveMethod.errorFolder);
                writeLog("  Error when trying create internal note metadata, file moved to (prev document IS archived)"+archiveMethod.errorFolder+": "+error);
                await twhError("Error when trying to create metadata for archiving internal note (prev document IS archived)", error, pdf);
                stats.error++
                continue; // moves to next pdf in listOfPdfs
            }
            let internalNoteRes;
            const internalNoteOptions = {
                url: p360url,
                authkey: p360authkey,
                service: "DocumentService",
                method: "CreateDocument"
            }

            try {
                internalNoteRes = await p360(internalNotemetadata, internalNoteOptions);
                if (internalNoteRes.Successful) {
                    writeLog("  Internal note archived with documentNumber "+internalNoteRes.DocumentNumber);
                    //writeLog(JSON.stringify(p360metadata));
                    moveToFolder(pdf, archiveMethod.importedFolder);
                    stats.imported++
                    stats.addressBlock++
                }
                else {
                    throw Error(internalNoteRes.ErrorMessage)
                }
            } catch (error) {
                writeLog("  Error when trying to archive internal note to P360 (document svarbrev IS archived), file moved to "+archiveMethod.errorFolder+": "+error);
                moveToFolder(pdf, archiveMethod.errorFolder); // MAYBE RETRY HERE?
                stats.error++
                await twhError("Error when trying to archive internal note to p360, document svarbrev IS archived", error, pdf);
                continue; // moves to next pdf in listOfPdfs
            }
            // EMAIL USER ?? VIStilArkiv fant ikke adresse på eleven, dokument (dokumentnr) må skrives ut og sendes/leveres til elev manuelt
        }
        else if (archiveMethod.manualSendToStudent) {
            writeLog("  ManualSendToStudent is on - must be dispatched manually in p360");
            // Legg inn teams-varsel når noe skal ekspederes manuelt
            moveToFolder(pdf, archiveMethod.importedFolder);
            stats.imported++
            stats.manualDispatch++
            await twhInfo("Document "+documentNumber+" is ready for dispatching to SvarUT. Make sure it is handled. Geir or Jørgen is responsible for this.", ":)", pdf)
        }
    }
    // write statistics
    try {
        await writeStat(archiveMethod.metadataSchema, stats)
    } catch (error) {
        writeLog(error);
    }
}