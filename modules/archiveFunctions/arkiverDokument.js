const moveToFolder = require("../moveToFolder/moveToFolder");
const meldFeil = require("../archiveKompetansebevisDocument/meldFeil");

async function arkiverDokument(p360metadata, archiveMethod, pdf, p360Options) {
  const archiveOptions = {
    ...p360Options,
    service: "DocumentService",
    method: "CreateDocument",
  };
  try {
    // Alle dokumenter til elever med hemmelig adresse arver tilgangsgruppe fra elevmappen
    const archiveRes = await p360(p360metadata, archiveOptions); // FEILIER IKKE NØDVENDIGVIS MED FEIL METADATA
    if (archiveRes.Successful) {
      documentNumber = archiveRes.DocumentNumber;
      //writeLog(JSON.stringify(p360metadata)); // uncomment when you need to see metadata, spams the log with base64 (maybe just delete base64 if this becomes a problem)
      if (!archiveMethod.sendToStudent) {
        moveToFolder(pdf, archiveMethod.importedFolder);
        stats.imported++;
        return archiveRes.DocumentNumber;
      }
    } else {
      throw Error(archiveRes.ErrorMessage);
    }
  } catch (error) {
    meldFeil(error, "Feilet ved arkivering av dokument", archiveMethod, pdf);
    return null;
  }
}
exports.arkiverDokument = arkiverDokument;
