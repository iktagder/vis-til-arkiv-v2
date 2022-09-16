const writeLog = require("../writeLog/writeLog");
const getElevinfo = require("../fint/getElevinfo");
const meldFeil = require("./meldFeil");

async function hentElevinfo(fnr, archiveMethod, pdf) {
  try {
    elevRespons = await getElevinfo(fnr);
    if (!!elevRespons.response && elevRespons.response.status === 404) {
      meldFeil(
        elevRespons.response.status,
        "Fant ikke elev i FINT.",
        archiveMethod,
        pdf
      );
      return null;
    }
    if (!!elevRespons.response && elevRespons.response.status >= 500) {
      throw Error("FINT responderer med feil " + elevRespons.response.status)
    } // TODO sjekk retur (number eller string?) og avbryt kjøring om 5xx

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
