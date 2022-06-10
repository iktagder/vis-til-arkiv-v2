const { ROOT_FOLDER } = require("../config");
const archiveKompetansebevisDocument = require("../modules/archiveKompetansebevisDocument/archiveKompetansebevisDocument");

const archiveMethod = {
  // Variables for this archive method - fill in all fields
  name: "Kompetansebevis",
  createdBy: "oleanders",
  metadataSchema: "KOMPETANSEBEVIS", // Remember to create a metadata schema for this archive method
  inputFolder: ROOT_FOLDER + "/Kompetansebevis",
  importedFolder: ROOT_FOLDER + "/Kompetansebevis/Imported",
  unregFolder: ROOT_FOLDER + "/Kompetansebevis/Error",
  errorFolder: ROOT_FOLDER + "/Kompetansebevis/Error",
  createElevmappe: true,
  createDocument: true,
  sendToStudent: false,
  manualSendToStudent: false,
  sendToParents: false,
  manualSendToParents: false,
  alertTeams: false,
  skolenavn: "Kristiansand katedralskole Gimle",
  maksAntallDokumenter: 1,
};

// archiving method
module.exports = async (options) => {
  await archiveKompetansebevisDocument(archiveMethod, options);
};
