const writeLog = require("../writeLog/writeLog");
const getElevinfo = require("../fint/getElevinfo");
const meldFeil = require("./meldFeil");

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
      "Feilet ved henting av elevinfo fra FINT.",
      archiveMethod,
      pdf
    );
    return null;
  }
}
exports.hentElevinfo = hentElevinfo;
