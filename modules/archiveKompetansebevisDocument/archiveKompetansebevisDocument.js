const getPdfsInFolder = require("../getPdfsInFolder/getPdfsInFolder");
const writeLog = require("../writeLog/writeLog");
const writeStat = require("../writeLog/writeStat");
const { lesPdfInnhold } = require("./lesPdfInnhold");
const { strukturerPdfInnhold } = require("./strukturerPdfInnhold");
const { hentElevinfo } = require("./hentElevinfo");
const { synkOgHentStudentRecno } = require("./synkOgHentStudentRecno");
const { hentElevmappe } = require("./hentElevmappe");
const { genererMetadata } = require("./genererMetadata");
const { arkiverDokument } = require("./arkiverDokument");
const { hentSkolenavn } = require("./hentSkolenavn");
const meldFeil = require("./meldFeil");

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
  const listOfPdfs = getPdfsInFolder(archiveMethod.inputFolder);
  const unikeSkolenavn = hentSkolenavn(listOfPdfs);
  unikeSkolenavn.forEach((skole) => console.table(skole));
  // TODO: velge skole og/eller begrense innlesing til n dokumenter

  //mainLoop -- alle funksjonskall returnerer null ved feil
  for (const pdf of listOfPdfs) {
    writeLog("--- Kompetansebevis, ny fil: " + pdf + " ---");

    const pdfContent = await lesPdfInnhold(pdf, archiveMethod);
    if (!pdfContent) continue;

    const documentData = await strukturerPdfInnhold(pdfContent, archiveMethod);
    if (!documentData) continue;

    // Finn student i FINT
    const studentInfo = await hentElevinfo(
      documentData.studentBirthnr,
      archiveMethod,
      pdf
    );
    if (!studentInfo) continue;
    else {
      documentData.studentName = `${studentInfo.data.navn.fornavn} ${studentInfo.data.navn.etternavn}`;
    }

    // syncPrivatePerson -> privatePersonRecno (oppdaterer og verifiserer at personen er registrert i p360)
    const studentRecno = await synkOgHentStudentRecno(
      studentInfo,
      documentData.studentBirthnr,
      archiveMethod,
      pdf,
      baseP360Options
    );
    if (!studentRecno) continue;

    // get elevmappe and add caseNumber to documentData
    const elevmappe = await hentElevmappe(
      documentData.studentBirthnr,
      archiveMethod,
      pdf,
      baseP360Options
    );
    if (!elevmappe) continue; // TODO: opprette mappe om aktuelt

    documentData.elevmappeCaseNumber = elevmappe.elevmappeCaseNumber;
    documentData.elevmappeAccessGroup = elevmappe.elevmappeAccessGroup;
    documentData.elevmappeStatus = elevmappeAccessGroup.elevmappeStatus;

    if (archiveMethod.createDocument) {
      if (documentData.elevmappeStatus === "Avsluttet") {
        meldFeil(
          {},
          `Kan ikke lagre til avsluttet mappe nr ${documentData.elevmappeCaseNumber}`,
          archiveMethod,
          pdf
        );
        continue;
      }

      const metadata = genererMetadata(documentData, pdf, archiveMethod);
      if (!metadata) continue;
      const arkivnummer = arkiverDokument(
        metadata,
        archiveMethod,
        pdf,
        baseP360Options
      );
      if (arkivnummer) {
        writeLog(
          `Document archived with documentNumber ${archiveRes.DocumentNumber}`
        );
      }
    }
  } //

  // write statistics
  try {
    await writeStat(archiveMethod.metadataSchema, stats);
  } catch (error) {
    writeLog(error);
  }
};
