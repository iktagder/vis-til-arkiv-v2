const pdfReader = require("../pdfReader/pdfReader");
const writeLog = require("../writeLog/writeLog");
const meldFeil = require("./meldFeil");

/*=========== Util-funksjoner ===============*/

async function lesPdfInnhold(pdf, archiveMethod) {
  try {
    writeLog("  Leser pdf");
    return await pdfReader(pdf); //read pdf
  } catch (error) {
    meldFeil(error, "Feilet ved lesing av pdf", archiveMethod, pdf);
    return null;
  }
}
exports.lesPdfInnhold = lesPdfInnhold;
