const options = require("./config");
const writeLog = require("./modules/writeLog/writeLog");
const twhError = require("./modules/teamsWebhook/twhError");

const karakterutskrift = require("./archiveMethods/karakterutskrift");
const opprettElevmapper = require("./archiveMethods/opprettElevmapper");
const { TEST_ENV } = require("./config");


//run main program
(async () => {
    // Dispatch documents
    writeLog(" - - - STARTING SCRIPT - - - ");

    try { // Synkroniserer kun kontakt og elevmappe. Arkiverer ikke dokument. Leser fnr, navn, adresse fra CSV-fil.
        await opprettElevmapper(options, TEST_ENV);
    } catch (error) {
        writeLog("Error when running opprettElevmapper: "+error);
        await twhError("Error when running opprettElevmapper", error, options.DISPATCH_FOLDER)
    } 

    try {
        await karakterutskrift(options, TEST_ENV);
    } catch (error) {
        writeLog("Error when running karakterutskrift: "+error);
        await twhError("Error when running karakterutskrift", error, options.DISPATCH_FOLDER)
    }
})();