const pdfReader = require("../../modules/pdfReader/pdfReader");
const getPdfsInFolder = require("../../modules/getPdfsInFolder/getPdfsInFolder");
const moveToFolder = require("../../modules/moveToFolder/moveToFolder");
const writeLog = require("../../modules/writeLog/writeLog");
const twhInfo = require("../../modules/teamsWebhook/twhInfo");
const twhError = require("../../modules/teamsWebhook/twhError");
const getEmailFromFile = require("../../modules/getEmailFromFile/getEmailFromFile");
const emailPrintJobAuthor = require("../../modules/sendEmail/emailPrintjobAuthor");


module.exports = async (dispatchDir, typeFolders) => {
    const listOfPdfs = getPdfsInFolder(dispatchDir);
    writeLog("Found "+listOfPdfs.length+" pdfs in dispatch folder");
    for (pdf of listOfPdfs) {
        writeLog("Checking file: "+pdf);
        const pdfContent = await pdfReader(pdf); //read pdf
        const pdfStrings = pdfContent.textContent.map(ele => ele.str);
        let foundTypes = []
        let visVarsel = false;

        if (pdfStrings.includes("Varsel om fare for manglende vurderingsgrunnlag i fag")) { // Custom documenttype VIS varsel
            visVarsel = true
        }
        for (let i=0; i<pdfStrings.length; i++) { // Note that field description and value is found in the same element (str) in this documentType, where the description field and values are found is dependent on the structure of the pdf
            if (pdfStrings[i].split(":").length === 2) {
                const desc = pdfStrings[i].split(":")[0].trim();
                const value = pdfStrings[i].split(":")[1].trim();
                if (desc === "VIS MAL TYPE") {
                    if (typeFolders[value] !== undefined && !foundTypes.includes(value) && value !== "DELETE" && value !== "UNKNOWN") { // this is a field we are looking for
                        foundTypes.push(value);
                    }
                }
            }
            if (visVarsel) {
                if (pdfStrings[i].includes("Kompetansebyggeren")) {
                    foundTypes.push("VISVarsel")
                    break
                }
            }
        }
        if (foundTypes.length === 1) {
            writeLog("  Found type: "+foundTypes[0]+", moving pdf to "+typeFolders[foundTypes[0]])
            moveToFolder(pdf, typeFolders[foundTypes[0]])
        }
        else {
            writeLog(" Found zero or several types in pdf - not usable, moving to "+typeFolders["DELETE"])
            moveToFolder(pdf, typeFolders["DELETE"])
            const strippedPdfContent = pdfStrings.join(" ").replace(/[0-9]/g, '').substring(0,50);
            // Email user 
            const userEmailAddress = getEmailFromFile(pdf);
            const filenameWithPath = pdf.split("---")[0];
            const filenameList = filenameWithPath.split("/");
            const filename = filenameList.pop();
            if (userEmailAddress.includes("@")) {
                writeLog("found email address: "+userEmailAddress+", will notify user");
                emailPrintJobAuthor(userEmailAddress, filename);
                await twhInfo("Pdf could not be dispatched, could not find document type - will be deleted, and user will be notified per e-mail "+userEmailAddress, "PDF content (stripped for numbers): "+strippedPdfContent, pdf);
            }
            else {
                writeLog("could not find email address: "+userEmailAddress+", cannot notify user");
                await twhError("E-postadresse "+userEmailAddress+" ble ikke funnet i filnavnet, sjekk filnavn og gjør noe...", "Innhold i pdf: "+strippedPdfContent, pdf);
            }
        }
    }
}

