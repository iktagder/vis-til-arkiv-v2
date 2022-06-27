const { ROOT_FOLDER } = require("../config");
const arkiveringFagdokumentasjon = require("../modules/arkiveringFagdokumentasjon/arkiveringFagdokumentasjon");

const archiveMethod = {
  // Variables for this archive method - fill in all fields
  name: "Vitnemål",
  createdBy: "rim2022",
  metadataSchema: "VITNEMÅL", // Remember to create a metadata schema for this archive method
  inputFolder: ROOT_FOLDER + "/Vitnemål",
  importedFolder: ROOT_FOLDER + "/Vitnemål/Imported",
  unregFolder: ROOT_FOLDER + "/Vitnemål/Error",
  errorFolder: ROOT_FOLDER + "/Vitnemål/Error",
  createElevmappe: true,
  createDocument: true,
  sendToStudent: false,
  manualSendToStudent: false,
  sendToParents: false,
  manualSendToParents: false,
  alertTeams: false,
  skolenavn: "Dahlske videregående skole",
  maksAntallDokumenter: 1,
};

// archiving method
module.exports = async (options) => {
  await arkiveringFagdokumentasjon(archiveMethod, options);
};
