const createElevmappe = require("../createElevmappe/createElevmappe");
const getElevmappe = require("../getElevmappe/getElevmappe");
const createMetadata = require("../metadataGenerator/createMetadata");
const p360 = require("../nodep360/p360");
const syncPrivatePerson = require("../syncPrivatePerson/syncPrivatePerson");
const twhError = require("../teamsWebhook/twhError");
const writeLog = require("../writeLog/writeLog");

module.exports = async (vigoData, options) => {

    const p360DefaultOptions = {
        url: options.P360_URL,
        authkey: options.P360_AUTHKEY
    }

    const arkiveringsresultat = [];
    
    const stats = {
        imported: 0,
        addressBlock: 0,
        dispatched: 0,
        manualDispatch: 0,
        error: 0
        // and whatever you like statistics on, update them wherever suitable in the flow, and finally, write them to statfile with writeStat(archiveMethod.metadataSchema, stats)
    }

    for (const vigoMelding of vigoData) {
        writeLog("--- Ny melding: " + vigoMelding.Dokumentelement.DokumentId + " " + vigoMelding.Dokumentelement.Dokumenttype + " ---");
        
        let createElevmappeBool = false; // For control of creating elevmappe
        let blockedAddress = false; // For control of students blocked address

        const arkiveringStatusData = {
            vigoMelding: vigoMelding,
            arkiveringUtfort: false,
            melding: ""
        }

        const documentData = {
            studentBirthnr: vigoMelding.Fodselsnummer,
            documentType: vigoMelding.Dokumentelement.Dokumenttype,
            documentDate: formaterDokumentDato(vigoMelding.Dokumentelement.Dokumentdato),
            schoolAccessGroup: options.P360_CASE_ACCESS_GROUP,
            schoolOrgNr: "506" // Agder
        };

        // TODO: Dersom adresse ikke er med i vigo-dokument, finn i vis
        /*let visStudent
        try {
            visStudent = await getElevinfo(documentData.studentBirthnr);
            writeLog("  Fant elev i VIS: " + visStudent.data.navn.fornavn + " " + visStudent.data.navn.etternavn);
        } catch (error) {
            const feilmelding = `   Error when trying to get student from VIS/FINT for documentid ${vigoMelding.Dokumentelement.DokumentId}`;
            registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, error, stats);
            continue;
        }*/

        // Update or create private person in p360
        const studentData = {
            lastName: vigoMelding.Etternavn,
            firstName: vigoMelding.Fornavn,
            streetAddress: settSammenAdresse(vigoMelding.FolkeRegisterAdresse),
            zipCode: vigoMelding.FolkeRegisterAdresse.Postnummmer,
            zipPlace: vigoMelding.FolkeRegisterAdresse.Poststed,
            birthnr: documentData.studentBirthnr
        }

        try {
            const privatePersonRecno = await syncPrivatePerson(studentData, p360DefaultOptions);
            // TODO: Bruker vi blokkerte adresser i P360?
            if (privatePersonRecno == "hemmelig") { // Check if address is blocked in 360
                blockedAddress = true;
                documentData.parents = [];
            }
            writeLog(`  Updated or created privatePerson in 360 with fnr: ${documentData.studentBirthnr}`);
        } catch (error) {
            const feilmelding = `   Error when trying create or update private person for student for documentid ${vigoMelding.Dokumentelement.DokumentId}`;
            registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, error, stats);
            continue; // gå til neste melding fra vigokøen
        }
        // get elevmappe and add caseNumber to documentData
        try {
            const studentFolderRes = await getElevmappe(documentData.studentBirthnr, p360DefaultOptions); // returns false if elevmappe was not found
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
            const feilmelding = `   Error when trying to find elevmappe for documentid ${vigoMelding.Dokumentelement.DokumentId}`;
            registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, error, stats);
            continue; // gå til neste melding fra vigokøen
        }

        // Create elevmappe if needed
        if (createElevmappeBool) {
            writeLog("  Trying to create new elevmappe for student: " + documentData.studentBirthnr);
            
            try {
                documentData.elevmappeCaseNumber = await createElevmappe(studentData, p360DefaultOptions);
            } catch (error) {
                const feilmelding = ` Error when trying create elevmappe for documentid ${vigoMelding.Dokumentelement.DokumentId}`;
                registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, error, stats);
                continue; // gå til neste melding fra vigokøen
            }
        }

        if (vigoMelding.Dokumentelement.Dokumenttype !== "SOKERE_N") {
            if (documentData.elevmappeStatus === 'Avsluttet') {
                const feilmelding = `  Kan ikke arkivere dokument til avsluttet elevmappe: ${documentData.elevmappeCaseNumber}`;
                const feil = `Elevmappe: ${documentData.elevmappeCaseNumber}`;
                registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, feil, stats);
                continue; // gå til neste melding fra vigokøen
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
                const feilmelding = `Error when trying create metadata for documentid ${vigoMelding.Dokumentelement.DokumentId}`;
                registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, error, stats);
                continue; // gå til neste melding fra vigokøen
            }

            //archive document to p360
            const archiveOptions = {
                ...p360DefaultOptions,
                service: "DocumentService",
                method: "CreateDocument"
            }

            try {
                // Alle dokumenter til elever med hemmelig adresse arver tilgangsgruppe fra elevmappen
                if (documentData.elevmappeAccessGroup && documentData.elevmappeAccessGroup.startsWith("SPERRET")) {
                    p360metadata.AccessGroup = documentData.elevmappeAccessGroup
                }

                const archiveRes = await p360(p360metadata, archiveOptions); // FEILIER IKKE NØDVENDIGVIS MED FEIL METADATA

                if (archiveRes.Successful) {
                    writeLog(`  Document archived with documentNumber ${archiveRes.DocumentNumber}`);
                    arkiveringStatusData.arkiveringUtfort = true;
                    arkiveringStatusData.melding = `ARKIV-${archiveRes.DocumentNumber}`; // referanse til P360 arkiv slik at det kan verifiseres manuelt om nødvendig
                    stats.imported++;
                    arkiveringsresultat.push(arkiveringStatusData);
                }
                else {
                    const feilmelding = `   Error returned from archive for dockumentid ${vigoMelding.Dokumentelement.DokumentId}`;
                    registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, archiveRes.ErrorMessage, stats);
                    continue;
                }
            } catch (error) {
                const feilmelding = `  Error when trying to archive Vigo documentid ${vigoMelding.Dokumentelement.DokumentId}  to P360`;
                registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilmelding, error, stats)
                continue; // gå til neste melding fra vigokøen
            }
        }
    }
    return arkiveringsresultat;
}

// P360 vil ha YYYY-MM-DD
function formaterDokumentDato(datostreng) {
    const d = new Date(Date.parse(datostreng));
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function settSammenAdresse(folkeRegisterAdresse) {
    return (folkeRegisterAdresse.Adresselinje2 && folkeRegisterAdresse.Adresselinje2.length > 0 ?
        (folkeRegisterAdresse.Adresselinje1 + "\n" + folkeRegisterAdresse.Adresselinje2) :
        folkeRegisterAdresse.Adresselinje1);
}

async function registrerFeilVedArkivering(arkiveringStatusData, arkiveringsresultat, feilBeskrivelse, error, stats) {
    stats.error++;
    arkiveringStatusData.melding = error;

    arkiveringsresultat.push(arkiveringStatusData);

    writeLog(`${feilBeskrivelse} ${error}`);
    await twhError(feilBeskrivelse, error); // TODO: sjekke resultat? Hvis ikke trenger vi ikke await
}
