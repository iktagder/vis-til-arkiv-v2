const { ROOT_FOLDER } = require("../config");

const archiveMethod = {
  // Variables for this archive method - fill in all fields
  name: "Kompetansebevis",
  createdBy: "oleanders",
  metadataSchema: "Kompetansebevis", // Remember to create a metadata schema for this archive method
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
  alertTeams: true,
};

// archiving method
module.exports = async (options, test = false) => {
  await archiveKompetansebevisDocument(archiveMethod, options, test);
};
