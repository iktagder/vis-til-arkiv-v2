const writeLog = require("../writeLog/writeLog");
const getElevmappe = require("../getElevmappe/getElevmappe");
const meldFeil = require("./meldFeil");

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
exports.hentElevmappe = hentElevmappe;
