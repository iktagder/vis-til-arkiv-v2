const writeLog = require("../writeLog/writeLog");
const getElevinfo = require("../fint/getElevinfo");
const meldFeil = require("./meldFeil");

async function hentElevinfo(fnr, archiveMethod, pdf) {
  try {
    elevRespons = await getElevinfo(fnr);
    if (elevRespons.response.status === 404) {
      throw elevRespons.message;
    }
    writeLog(
      `Fant elev i FINT: ${elevRespons.data.navn.fornavn} ${elevRespons.data.navn.etternavn}`
    );
    return elevRespons.data;
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
