const { ROOT_FOLDER } = require("../config");
const archiveVisDocument = require("../modules/archiveVisDocument/archiveVisDocument");

const archiveMethod = { // Variables for this archive method - fill in all fields
    "name": "OpprettElevmapper",
    "createdBy": "oleanders",
    "metadataSchema": "FNR-TIL-ELEVMAPPE", // Remember to create a metadata schema for this archive method
    "inputFolder": ROOT_FOLDER + "/OpprettElevmapper",
    "importedFolder": ROOT_FOLDER + "/OpprettElevmapper/Imported",
    "unregFolder": ROOT_FOLDER + "/OpprettElevmapper/Error",
    "errorFolder": ROOT_FOLDER + "/OpprettElevmapper/Error",
    "createElevmappe": true,
    "createDocument": false,
    "splitPdfPagesIntoSeperateFiles": false,
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