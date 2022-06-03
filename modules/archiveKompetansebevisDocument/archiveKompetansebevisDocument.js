const getPdfsInFolder = require("../getPdfsInFolder/getPdfsInFolder");
const pdfReader = require("../pdfReader/pdfReader");
const moveToFolder = require("../moveToFolder/moveToFolder");
const writeLog = require("../writeLog/writeLog");
const writeStat = require("../writeLog/writeStat");
const twhError = require("../teamsWebhook/twhError");
const findDocumentData = require("./finnKompetansebevisData");
const getElevinfo = require("../fint/getElevinfo");
const getElevmappe = require("../getElevmappe/getElevmappe");
const syncPrivatePerson = require("../syncPrivatePerson/syncPrivatePerson");
const createMetadata = require("../metadataGenerator/createMetadata");

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

  //mainLoop
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

    // vi skal lage et dokument
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

async function lesPdfInnhold(pdf, archiveMethod) {
  try {
    writeLog("  Leser pdf");
    return await pdfReader(pdf); //read pdf
  } catch (error) {
    meldFeil(error, "Feilet ved lesing av pdf", archiveMethod, pdf);
    return null;
  }
}

async function strukturerPdfInnhold(pdfContent, archiveMethod, pdf) {
  try {
    documentData = findDocumentData(archiveMethod, pdfContent);
    writeLog("  Found documentdata");
    return documentData;
  } catch (error) {
    meldFeil(error, "Feilet ved lesing av innhold i pdf.", archiveMethod, pdf);
    return null;
  }
}

async function hentElevinfo(fnr, archiveMethod, pdf) {
  try {
    student = await getElevinfo(fnr);
    writeLog(
      `Fant elev i FINT: ${student.data.navn.fornavn} ${student.data.navn.etternavn}`
    );
    return student;
  } catch (error) {
    meldFeil(
      error,
      "Feilet ved henting av elevinfo fra FINT",
      archiveMethod,
      pdf
    );
    return null;
  }
}

async function synkOgHentStudentRecno(
  student,
  studentBirthnr,
  archiveMethod,
  pdf,
  p360Options
) {
  const studentData = {
    lastName: student.data.navn.etternavn,
    firstName: student.data.navn.fornavn,
    streetAddress: student.data.bostedsadresse.adresselinje[0],
    zipCode: student.data.bostedsadresse.postnummer,
    zipPlace: student.data.bostedsadresse.poststed,
    birthnr: studentBirthnr, // TODO: hent fra student-objektet!
  };

  try {
    return syncPrivatePerson(studentData, p360Options, pdf);
  } catch (error) {
    meldFeil(error, "Feilet ved synk av student.", archiveMethod, pdf);
    return null;
  }
}

async function hentElevmappe(studentBirthnr, archiveMethod, pdf, p360Options) {
  try {
    const studentFolderRes = await getElevmappe(studentBirthnr, p360Options); // returns false if elevmappe was not found
    if (!studentFolderRes) {
      meldFeil(
        {},
        `Fant ikke elevmappe for ${studentBirthnr}`,
        archiveMethod,
        pdf
      );
      return null;
    } else {
      writeLog(
        "  Found elevmappe with case number: " + studentFolderRes.CaseNumber
      );
      return {
        elevmappeCaseNumber: studentFolderRes.CaseNumber,
        elevmappeAccessGroup: studentFolderRes.AccessGroup,
        elevmappeStatus: studentFolderRes.Status,
      };
    }
  } catch (error) {
    meldFeil(error, "Feilet ved henting av elevmappe.", archiveMethod, pdf);
    return null;
  }
}

async function genererMetadata(documentData, pdf, archiveMethod) {
  const base64Pdf = getBase64(pdf);
  documentData.pdfFileBase64 = base64Pdf;
  try {
    p360metadata = await createMetadata(documentData);
    if (
      documentData.elevmappeAccessGroup &&
      documentData.elevmappeAccessGroup.startsWith("SPERRET")
    ) {
      p360metadata.AccessGroup = documentData.elevmappeAccessGroup;
    }
    if (archiveMethod.sendToStudent) {
      p360metadata.Status = "R";
    }
    return p360metadata;
  } catch (error) {
    meldFeil(
      error,
      `Kunne ikke opprette metadata for ${pdf}`,
      archiveMethod,
      pdf
    );
    return null;
  }
}

async function arkiverDokument(p360metadata, archiveMethod, pdf, p360Options) {
  const archiveOptions = {
    ...p360Options,
    service: "DocumentService",
    method: "CreateDocument",
  };
  try {
    // Alle dokumenter til elever med hemmelig adresse arver tilgangsgruppe fra elevmappen
    const archiveRes = await p360(p360metadata, archiveOptions); // FEILIER IKKE NØDVENDIGVIS MED FEIL METADATA
    if (archiveRes.Successful) {
      documentNumber = archiveRes.DocumentNumber;
      //writeLog(JSON.stringify(p360metadata)); // uncomment when you need to see metadata, spams the log with base64 (maybe just delete base64 if this becomes a problem)
      if (!archiveMethod.sendToStudent) {
        moveToFolder(pdf, archiveMethod.importedFolder);
        stats.imported++;
        return archiveRes.DocumentNumber;
      }
    } else {
      throw Error(archiveRes.ErrorMessage);
    }
  } catch (error) {
    meldFeil(error, "Feilet ved arkivering av dokument", archiveMethod, pdf);
    return null;
  }
}

async function meldFeil(error, errorMsg, archiveMethod, pdf) {
  if (archiveMethod.alertTeams) await twhError(errorMsg, error, pdf);
  writeLog(errorMsg + archiveMethod.errorFolder + ": " + error);
  moveToFolder(pdf, archiveMethod.errorFolder);
  //stats.error++;
}

const hentSkolenavn = (pdfs) => {
  const skolenavn = pdfs.map((pdf) => {
    // fjern ./input/Kompetansebevis/, ta alt som ligger mellom / og -
    const skoleMedSti = pdf.split(" - ")[0].split("/"); // fjerner navn/fødselsnummer og splitter på
    return skoleMedSti[skoleMedSti.length - 1].trim(); // ta siste element
  });
  unikeSkolenavn = [
    ...new Set(skolenavn), // bruker Set for å fjerne duplikater
  ];
  const dokumentOversiktPrSkole = unikeSkolenavn.map((skole) => {
    return {
      navn: skole,
      antallDokumenter: skolenavn.filter((s) => s === skole).length,
    };
  });
  return dokumentOversiktPrSkole;
};
