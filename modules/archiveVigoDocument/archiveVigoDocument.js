const createElevmappe = require("../createElevmappe/createElevmappe");
const getElevmappe = require("../getElevmappe/getElevmappe");
const createMetadata = require("../metadataGenerator/createMetadata");
const p360 = require("../nodep360/p360");
const syncPrivatePerson = require("../syncPrivatePerson/syncPrivatePerson");
const twhError = require("../teamsWebhook/twhError");
const writeLog = require("../writeLog/writeLog");

module.exports = async (vigoData, options) => {

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

    for (vigoMelding of vigoData) {
        let createElevmappeBool = false; // For control of creating elevmappe
        let blockedAddress = false; // For control of students blocked address
        
        writeLog("--- New document: " + vigoMelding.Dokumentelement.DokumentId + " " + vigoMelding.Dokumentelement.Dokumenttype + " ---");

        const documentData = {
            studentBirthnr: vigoMelding.Fodselsnummer,
            documentType: vigoMelding.Dokumentelement.Dokumenttype,
            documentDate: formaterDokumentDato(vigoMelding.Dokumentelement.Dokumentdato), // TODO: (YYYY-MM-DD)
            schoolAccessGroup: options.P360_CASE_ACCESS_GROUP,
            schoolOrgNr: "506"
        };

        // TODO: Dersom adresse ikke er med i vigo-dokument, finn i vis
        /*let visStudent
        try {
            visStudent = await getElevinfo(documentData.studentBirthnr);
            writeLog("  Fant elev i VIS: " + visStudent.data.navn.fornavn + " " + visStudent.data.navn.etternavn);
        } catch (error) {
            writeLog("  Error when trying to get student from VIS/FINT, filed moved to " + archiveMethod.errorFolder + ": " + error);
            moveToFolder(pdf, archiveMethod.errorFolder);
            stats.error++
            await twhError("Error when trying to get student from VIS/FINT", error, pdf);
            continue;
        }*/

        // Update or create private person in p360
        let privatePersonRecno;
        const syncPrivatePersonOptions = {
            url: p360url,
            authkey: p360authkey
        }
        let studentData = {}
        studentData.lastName = vigoMelding.Etternavn;
        studentData.firstName = vigoMelding.Fornavn;
        studentData.streetAddress = vigoMelding.FolkeRegisterAdresse.Adresselinje1; // TODO: adresslinje 2
        studentData.zipCode = vigoMelding.FolkeRegisterAdresse.Postnummmer;
        studentData.zipPlace = vigoMelding.FolkeRegisterAdresse.Poststed;
        studentData.birthnr = documentData.studentBirthnr;

        try {
            privatePersonRecno = await syncPrivatePerson(studentData, syncPrivatePersonOptions);
            // TODO: Bruker vi blokkerte adresser i P360?
            if (privatePersonRecno == "hemmelig") { // Check if address is blocked in 360
                blockedAddress = true
                documentData.parents = []
            }
            writeLog("  Updated or created privatePerson in 360 with fnr: " + documentData.studentBirthnr)
        } catch (error) {
            writeLog("  Error when trying create or update private person for student, file moved to " + ": " + error);
            stats.error++
            await twhError("Error when trying create or update privatePerson for student i p360", error, pdf);
            continue; // moves to next pdf in listOfPdfs
        }

        // get elevmappe and add caseNumber to documentData
        const studentFolderOptions = {
            url: p360url,
            authkey: p360authkey
        }
        try {
            const studentFolderRes = await getElevmappe(documentData.studentBirthnr, studentFolderOptions); // returns false if elevmappe was not found
            if (!studentFolderRes) {
                createElevmappeBool = true;
                writeLog("  Could not find elevmappe - will try to create new elevmappe");
            }
            else {
                documentData.elevmappeCaseNumber = studentFolderRes.CaseNumber; // Found elevmappe for student
                documentData.elevmappeAccessGroup = studentFolderRes.AccessGroup
                documentData.elevmappeStatus = studentFolderRes.Status
                writeLog("  Found elevmappe with case number: " + studentFolderRes.CaseNumber);
            }
        } catch (error) {
            // maybe implement retry function or something here
            writeLog("  Error when trying to find elevmappe, file moved to : " + error);
            stats.error++
            await twhError("Error when trying to find elevmappe in p360", error, pdf);
            continue; // moves to next pdf in listOfPdfs
        }

        // Create elevmappe if needed
        if (createElevmappeBool) {
            writeLog("  Trying to create new elevmappe for student: " + documentData.studentBirthnr);
            const createElevmappeOptions = {
                url: p360url,
                authkey: p360authkey
            }
            
            let elevmappe;
            try {
                elevmappe = await createElevmappe(studentData, createElevmappeOptions);
                documentData.elevmappeCaseNumber = elevmappe;
            } catch (error) {
                writeLog("  Error when trying create elevmappe, file moved to: " + error);
                stats.error++
                await twhError("Error when trying to create elevmappe in p360", error, pdf);
                continue; // moves to next pdf in listOfPdfs
            }
        }

        if (vigoMelding.Dokumentelement.Dokumenttype !== "SOKER_N") {
            if (documentData.elevmappeStatus === 'Avsluttet') {
                writeLog("  Kan ikke arkivere dokument til avsluttet elevmappe: " + documentData.elevmappeCaseNumber);
                await twhError("Kan ikke arkivere dokument til avsluttet elevmappe", "Elevmappe: " + documentData.elevmappeCaseNumber, pdf);
                continue;
            }

            documentData.pdfFileBase64 = vigoMelding.Dokumentelement.Dokumentfil;
            documentData.studentName = vigoMelding.Fornavn + " " + vigoMelding.Etternavn
            // Create 360 metadata object
            let p360metadata;
            try {
                p360metadata = await createMetadata(documentData);

                if (blockedAddress) {
                    p360metadata.Status = "J"
                    p360metadata.Contacts[1].DispatchChannel = "recno:2"
                }
            } catch (error) {
                writeLog("  Error when trying create metadata, file moved to: " + error);
                await twhError("Error when trying to create metadata for archiving", error, pdf);
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
                if (documentData.elevmappeAccessGroup && documentData.elevmappeAccessGroup.startsWith("SPERRET")) {
                    p360metadata.AccessGroup = documentData.elevmappeAccessGroup
                }
                archiveRes = await p360(p360metadata, archiveOptions); // FEILIER IKKE NØDVENDIGVIS MED FEIL METADATA
                if (archiveRes.Successful) {
                    documentNumber = archiveRes.DocumentNumber;
                    writeLog("  Document archived with documentNumber " + archiveRes.DocumentNumber);
                    stats.imported++
                }
                else {
                    throw Error(archiveRes.ErrorMessage)
                }
            } catch (error) {
                writeLog("  Error when trying to archive document to P360, file moved to: " + error);
                stats.error++
                await twhError("Error when trying to archive document to p360", error, pdf);
                continue; // moves to next pdf in listOfPdfs
            }
        }
    };
}

// P360 vil ha YYYY-MM-DD
function formaterDokumentDato(datostreng) {
    const d = new Date(Date.parse(datostreng));
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
  }