const getPdfsInFolder = require("../../modules/getPdfsInFolder/getPdfsInFolder");
const moveToFolder = require("../../modules/moveToFolder/moveToFolder");
const writeLog = require("../../modules/writeLog/writeLog");
const twhInfo = require("../../modules/teamsWebhook/twhInfo");
const getEmailFromFile = require("../../modules/getEmailFromFile/getEmailFromFile");
const printerDisabledEmail = require("../../modules/sendEmail/printerDisabledEmail");


module.exports = async (dispatchDir, typeFolders) => {
    const listOfPdfs = getPdfsInFolder(dispatchDir);
    writeLog("Found "+listOfPdfs.length+" pdfs in dispatch folder");
    for (pdf of listOfPdfs) {
        const userEmailAddress = getEmailFromFile(pdf);
        const filenameWithPath = pdf.split("---")[0];
        const filenameList = filenameWithPath.split("/");
        const filename = filenameList.pop();
        writeLog("Solution is not active yet, "+pdf+" will be deleted");
        moveToFolder(pdf, typeFolders["DELETE"]);

        if (userEmailAddress.includes("@")) {
            writeLog("found email address: "+userEmailAddress+", will notify user");
            printerDisabledEmail(userEmailAddress, filename);
            await twhInfo(userEmailAddress + " har sendt en pdf til VIStilArkiv, løsningen er ikke klar, e-post er sendt til brukeren", "uinteressant", pdf);
        }
        else {
            writeLog("could not find email address: "+userEmailAddress+", cannot notify user");
            await twhInfo("E-postadresse bli ikke funnet i filnavnet, sjekk filnavn og gjør noe...", "uinteressant", pdf);
        }
    }
}