const options = require("./config");
const writeLog = require("./modules/writeLog/writeLog");
const twhError = require("./modules/teamsWebhook/twhError");

const karakterutskrift = require("./archiveMethods/karakterutskrift");
const opprettElevmapper = require("./archiveMethods/opprettElevmapper");
const { TEST_ENV } = require("./config");
const vigoDocuments = require("./archiveMethods/vigoDocuments");

//run main program
(async () => {
    // Dispatch documents
    writeLog(" - - - STARTING SCRIPT - - - ");

    const argumenter = process.argv.slice(2); // det første argumentene er script-navn og 
    if (argumenter.length === 0) {
        console.error("Ingen argumenter gitt. Mulige valg:\n'-v': kjører arkivering av vigo-dokumenter\n'-k': arkiverer pdf-karakterutskrifter\n'-o': oppretter elevmappe og kontakt basert på innhold i csv-mappe");
        return;
    }


    if (argumenter.includes('-v')) {
        console.log("Kjører vigo");
        try {
            await vigoDocuments(options, TEST_ENV);
        } catch (error) {
            writeLog("Error when running vigoDocuments: " + error);
            // twhError("Error when running vigoDocuments", error, options.DISPATCH_FOLDER)
        }
    }
    if (argumenter.includes('-k')) {
        writeLog("Kjører karakterutskrift");
        try {
            await karakterutskrift(options, TEST_ENV);
        } catch (error) {
            writeLog("Error when running karakterutskrift: " + error);
            await twhError("Error when running karakterutskrift", error, options.DISPATCH_FOLDER)
        }
    }
    if (argumenter.includes('-o')) {
        console.log("Oppretter kontakt og elevmappe ");
        try { // Synkroniserer kun kontakt og elevmappe. Arkiverer ikke dokument. Leser fnr, navn, adresse fra CSV-fil.
            await opprettElevmapper(options, TEST_ENV);
        } catch (error) {
            writeLog("Error when running opprettElevmapper: " + error);
            await twhError("Error when running opprettElevmapper", error, options.DISPATCH_FOLDER)
        }
    }
})();
