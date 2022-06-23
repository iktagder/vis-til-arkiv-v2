const getPdfsInFolder = require("../getPdfsInFolder/getPdfsInFolder");
const writeLog = require("../writeLog/writeLog");
const writeStat = require("../writeLog/writeStat");
const { lesPdfInnhold } = require("../archiveFunctions/lesPdfInnhold");
const {
  strukturerPdfInnhold,
} = require("../archiveFunctions/strukturerPdfInnhold");
const { hentElevinfo } = require("../archiveFunctions/hentElevinfo");
const {
  synkOgHentStudentRecno,
} = require("../archiveFunctions/synkOgHentStudentRecno");
const {
  hentEllerOpprettElevmappe,
} = require("../archiveFunctions/hentEllerOpprettElevmappe");
const { genererMetadata } = require("../archiveFunctions/genererMetadata");
const { arkiverDokument } = require("../archiveFunctions/arkiverDokument");
const { hentSkolenavn } = require("../archiveFunctions/hentSkolenavn");
const meldFeil = require("../archiveFunctions/meldFeil");

module.exports = async (archiveMethod, config) => {
  const baseP360Options = {
    url: config.P360_URL,
    authkey: config.P360_AUTHKEY,
  };

  const stats = {
    imported: 0,
    documents: 0,
    error: 0,
    // and whatever you like statistics on, update them wherever suitable in the flow, and finally, write them to statfile with writeStat(archiveMethod.metadataSchema, stats)
  };

  try {
    const listOfPdfs = getPdfsInFolder(archiveMethod.inputFolder);
    if (listOfPdfs.length === 0) {
      meldFeil(
        "Feil ved lesing av inputmappe",
        `Ingen ${archiveMethod.name} i import-mappen ${archiveMethod.inputFolder}`,
        archiveVisDocument,
        null
      );
      return;
    }
    // TODO: velge skole og/eller begrense innlesing til n dokumenter
    const unikeSkolenavn = hentSkolenavn(listOfPdfs);
    if (
      unikeSkolenavn.filter((skole) => skole.navn === archiveMethod.skolenavn)
        .length === 0
    ) {
      meldFeil(
        "Feil ved filtrering av pdf",
        `Finner ikke skolenavnet "${archiveMethod.skolenavn}" i importmappen "${archiveMethod.inputFolder}"`,
        archiveMethod,
        null
      );
      return;
    }

    // TODO, legg til teller og ta i bruk archiveMethod.maksAntallDokumenter
    //mainLoop -- alle funksjonskall returnerer null ved feil
    for (const pdf of listOfPdfs) {
      writeLog(`--- ${archiveMethod.name}, ny fil: " + pdf + " ---`);

      const pdfContent = await lesPdfInnhold(pdf, archiveMethod);
      if (!pdfContent) {
        stats.error++;
        continue;
      }

      const documentData = await strukturerPdfInnhold(
        pdfContent,
        archiveMethod
      );
      if (!documentData) {
        stats.error++;
        continue;
      }

      // Finn student i FINT
      const studentInfo = await hentElevinfo(
        documentData.studentBirthnr,
        archiveMethod,
        pdf
      );
      if (!studentInfo) {
        stats.error++;
        continue;
      } else {
        documentData.studentName = `${studentInfo.navn.fornavn} ${studentInfo.navn.etternavn}`;
      }

      // syncPrivatePerson -> privatePersonRecno (oppdaterer og verifiserer at personen er registrert i p360)
      // TODO: skal adresse i p360 oppdateres med den vi får fra FINT?
      const studentRecno = await synkOgHentStudentRecno(
        studentInfo,
        documentData.studentBirthnr,
        archiveMethod,
        pdf,
        baseP360Options
      );

      if (!studentRecno) {
        stats.error++;
        continue;
      }

      // get elevmappe and add caseNumber to documentData
      const elevmappe = await hentEllerOpprettElevmappe(
        studentInfo,
        documentData.studentBirthnr,
        archiveMethod,
        pdf,
        baseP360Options
      );
      if (!elevmappe) {
        stats.error++;
        continue;
      } else {
        documentData.elevmappeCaseNumber = elevmappe.elevmappeCaseNumber;
        documentData.elevmappeAccessGroup = elevmappe.elevmappeAccessGroup;
        documentData.elevmappeStatus = elevmappe.elevmappeStatus;
      }

      if (documentData.elevmappeStatus === "Avsluttet") {
        meldFeil(
          {},
          `Kan ikke lagre til avsluttet mappe nr ${documentData.elevmappeCaseNumber}`,
          archiveMethod,
          pdf
        );
        stats.error++;
        continue;
      } else {
        const metadata = await genererMetadata(
          documentData,
          pdf,
          archiveMethod
        );
        if (!metadata) {
          stats.error++;
          continue;
        }
        const arkivnummer = await arkiverDokument(
          metadata,
          archiveMethod,
          pdf,
          baseP360Options
        );
        if (arkivnummer) {
          stats.imported++;
          writeLog(
            `Document archived with documentNumber ${archiveRes.DocumentNumber}`
          );
        } else {
          stats.error++;
        }
      }
    }
  } catch (error) {
    writeLog(error);
  } finally {
    await writeStat(archiveMethod.metadataSchema, stats);
  }
};
