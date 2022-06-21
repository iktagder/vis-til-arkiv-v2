const writeLog = require("../writeLog/writeLog");
const findDocumentData = require("./finnKompetansebevisData");
const meldFeil = require("./meldFeil");

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
exports.strukturerPdfInnhold = strukturerPdfInnhold;
