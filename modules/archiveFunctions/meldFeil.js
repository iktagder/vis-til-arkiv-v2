const moveToFolder = require("../moveToFolder/moveToFolder");
const writeLog = require("../writeLog/writeLog");
const twhError = require("../teamsWebhook/twhError");

async function meldFeil(error, errorMsg, archiveMethod, pdf) {
  if (archiveMethod.alertTeams) await twhError(errorMsg, error, pdf);
  writeLog(`${error}:
  ${errorMsg}`);
  if (pdf) {
    moveToFolder(pdf, archiveMethod.errorFolder);
  }
}
module.exports = meldFeil;
