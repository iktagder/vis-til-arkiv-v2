const { ROOT_FOLDER } = require("../config");
const archiveVisDocument = require("../modules/archiveVisDocument/archiveVisDocument");

const archiveMethod = { // Variables for this archive method - fill in all fields
    "name": "Karakterutskrift",
    "createdBy": "oleanders",
    "metadataSchema": "KARAKTERUTSKRIFT", // Remember to create a metadata schema for this archive method
    "inputFolder": ROOT_FOLDER + "/Karakterutskrift",
    "importedFolder": ROOT_FOLDER + "/Karakterutskrift/Imported",
    "unregFolder": ROOT_FOLDER + "/Karakterutskrift/Error",
    "errorFolder": ROOT_FOLDER + "/Karakterutskrift/Error",
    "splitPdfPagesIntoSeperateFiles": true,
    "createElevmappe": true,
    "createDocument": true,
    "sendToStudent": false,
    "manualSendToStudent": false,
    "sendToParents": false,
    "manualSendToParents": false,
    "alertTeams": true
}

// archiving method
module.exports = async (options, test=false) => {
    await archiveVisDocument(archiveMethod, options, test);
}