const archiveVisDocument = require("../../modules/archiveVisDocument/archiveVisDocument");

const archiveMethod = { // Variables for this archive method - fill in all fields
    "name": "Karakterutskrift",
    "createdBy": "oleanders",
    "metadataSchema": "KARAKTERUTSKRIFT", // Remember to create a metadata schema for this archive method
    "inputFolder": "C:/VIS-P360/Karakterutskrift",
    "importedFolder": "C:/VIS-P360/Karakterutskrift/Imported",
    "unregFolder": "C:/VIS-P360/Karakterutskrift/Error",
    "errorFolder": "C:/VIS-P360/Karakterutskrift/Error",
    "createElevmappe": true,
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