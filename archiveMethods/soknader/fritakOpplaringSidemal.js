const archiveVisDocument = require("../../modules/archiveVisDocument/archiveVisDocument");

const archiveMethod = { // Variables for this archive method - fill in all fields
    "name": "Fritak for opplæring i sidemål",
    "createdBy": "jor2901",
    "metadataSchema": "VIS003", // Remember to create a metadata schema for this archive method
    "inputFolder": "path",
    "importedFolder": "path",
    "unregFolder": "path",
    "errorFolder": "path",
    "createElevmappe": true,
    "sendToStudent": true,
    "manualSendToStudent": true,
    "sendToParents": false,
    "manualSendToParents": false,
    "alertTeams": true
}

// archiving method
module.exports = async (options, test=false) => {
    await archiveVisDocument(archiveMethod, options, test);
}