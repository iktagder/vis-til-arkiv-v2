const createMetadata = require("../metadataGenerator/createMetadata");
const meldFeil = require("./meldFeil");

async function genererMetadata(documentData, pdf, archiveMethod) {
  const base64Pdf = getBase64(pdf);
  documentData.pdfFileBase64 = base64Pdf;
  try {
    p360metadata = await createMetadata(documentData);
    if (
      documentData.elevmappeAccessGroup &&
      documentData.elevmappeAccessGroup.startsWith("SPERRET")
    ) {
      p360metadata.AccessGroup = documentData.elevmappeAccessGroup;
    }
    if (archiveMethod.sendToStudent) {
      p360metadata.Status = "R";
    }
    return p360metadata;
  } catch (error) {
    meldFeil(
      error,
      `Kunne ikke opprette metadata for ${pdf}`,
      archiveMethod,
      pdf
    );
    return null;
  }
}
exports.genererMetadata = genererMetadata;
