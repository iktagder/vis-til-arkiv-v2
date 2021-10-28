const options = require("./config");
const writeLog = require("./modules/writeLog/writeLog");
const twhError = require("./modules/teamsWebhook/twhError");

const deleteDocuments = require("./modules/dispatchDocuments/deleteDocuments");

//run main program
(async () => {
    // Dispatch documents
    writeLog(" - - - STARTING SCRIPT - - - ");
    try {
        await deleteDocuments(options.DISPATCH_FOLDER, options.TYPE_FOLDERS);
    } catch (error) {
        writeLog("Error when deleting documents: "+error)
        await twhError("Noe gikk galt ved flytting av pdf-er, sjekk feilmelding", error, options.DISPATCH_FOLDER)
    }

    // Run archiving methods // ADD METHODS HERE
    /*
    await soknadFotballEM(options, test=true);
    */
})();