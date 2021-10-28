const archiveVisDocument = require("../../modules/archiveVisDocument/archiveVisDocument");

const archiveMethod = { // Variables for this archive method - fill in all fields
    "name": "eksempel",
    "createdBy": "jor2901",
    "metadataSchema": "VISTEST", // Remember to create a metadata schema for this archive method
    "inputFolder": "C:/samplePdfs/VIS/vistest",
    "importedFolder": "C:/samplePdfs/VIS/vistest/imported",
    "unregFolder": "C:/samplePdfs/VIS/vistest/unreg",
    "errorFolder": "C:/samplePdfs/VIS/vistest/error",
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