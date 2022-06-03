const getPdfsInFolder = require("../getPdfsInFolder/getPdfsInFolder");
const pdfReader = require("../pdfReader/pdfReader");
const moveToFolder = require("../moveToFolder/moveToFolder");
const writeLog = require("../writeLog/writeLog");
const writeStat = require("../writeLog/writeStat");
const twhError = require("../teamsWebhook/twhError");
const findDocumentData = require("./finnKompetansebevisData");

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

// 'Skole: Kristiansand katedralskole Gimle'
// 'Fødselsnummer: xxxxxxxxxxx
// 367:{str: 'Fødselsnummer:', dir: 'ltr', width: 66.75333749999999, height: 10.0125, transform: Array(6), …}
// 368:{str: ' ', dir: 'ltr', width: 2.5091724999998632, height: 0, transform: Array(6), …}
// 369:{str: '160459 14201', dir: 'ltr', width: 57.571875000000006, height: 10.0125, transform: Array(6), …}
//

module.exports = async (archiveMethod, config) => {
  const p360url = config.P360_URL;
  const p360authkey = config.P360_AUTHKEY;

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
    let pdfContent;
    writeLog("--- Kompetansebevis, ny fil: " + pdf + " ---");
    try {
      pdfContent = await pdfReader(pdf); //read pdf
      writeLog("  Leser pdf");
    } catch (error) {
      writeLog(
        "  Error when trying to read pdf, file moved to " +
          archiveMethod.errorFolder +
          ": " +
          error
      );
      moveToFolder(pdf, archiveMethod.errorFolder);
      stats.error++;
      //await twhError("Error when trying to read pdf", error, pdf);
      continue; // moves to next pdf in listOfPdfs
    }
    let documentData = {};
    try {
      documentData = findDocumentData(archiveMethod, pdfContent);
      writeLog("  Found documentdata");
    } catch (error) {
      //     await twhError("Error when trying to find data in pdf", error, pdf);
      writeLog(
        "Error when trying to find data in pdf, file moved to " +
          archiveMethod.errorFolder +
          ": " +
          error
      );
      moveToFolder(pdf, archiveMethod.errorFolder);
      stats.error++;
      //await twhError("Error when trying to find data in pdf", error, pdf);
      continue; // moves to next pdf in listOfPdfs
    }
  } // mainLoop
  // getElevinfo(documentData.studentBirthnr)
  // syncPrivatePerson? -> privatePersonRecno (oppdaterer og verifiserer at personen er registrert i p360)
  // getElevmappe(fnr, {p360url, key})
  // if (archiveMethod.createDocument) { // vi skal lage et dokument

  // write statistics
  try {
    await writeStat(archiveMethod.metadataSchema, stats);
  } catch (error) {
    writeLog(error);
  }
};
