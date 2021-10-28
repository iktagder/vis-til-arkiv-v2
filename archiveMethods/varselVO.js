const archiveVisVarsel = require("../modules/archiveVisDocument/archiveVisVarsel");

const archiveMethod = { // Variables for this archive method - fill in all fields
    "name": "Varsel om fare for manglende vurderingsgrunnlag i fag  - VO (voksenopplæring)",
    "createdBy": "jor2901",
    "metadataSchema": "VISVarsel", // Remember to create a metadata schema for this archive method
    "inputFolder": "C:/tempBackups/SamplePDF/test",
    "importedFolder": "C:/tempBackups/SamplePDF/test/imported",
    "unregFolder": "C:/tempBackups/SamplePDF/test/error",
    "errorFolder": "C:/tempBackups/SamplePDF/test/error",
    "createElevmappe": true,
    "sendToStudent": false,
    "manualSendToStudent": false,
    "sendToParents": false,
    "manualSendToParents": false,
    "alertTeams": true
}

// archiving method
module.exports = async (options, test=false) => {
    await archiveVisVarsel(archiveMethod, options, test);
}