const writeLog = require("../writeLog/writeLog");
const getElevmappe = require("../getElevmappe/getElevmappe");
const createElevmappe = require("../createElevmappe/createElevmappe");
const meldFeil = require("./meldFeil");

async function hentEllerOpprettElevmappe(
  studentInfo,
  studentBirthnr,
  archiveMethod,
  pdf,
  p360Options
) {
  try {
    const studentFolderRes = await getElevmappe(studentBirthnr, p360Options);
    if (!studentFolderRes) {
      const opprettElevmappePayload = {
        lastName: studentInfo.navn.etternavn,
        firstName: studentInfo.navn.fornavn,
        //streetAddress: studentInfo.bostedsadresse.adresselinje[0], <- hele addressen om vi skal ha den
        //zipCode: studentInfo.bostedsadresse.postnummer,
        //zipPlace: studentInfo.bostedsadresse.poststed,
        birthnr: studentBirthnr,
      };
      const nyMappeCaseNummer = await createElevmappe(
        opprettElevmappePayload,
        p360Options
      );

      writeLog(
        "Oppretter elevmappe for student: " + documentData.studentBirthnr
      );

      return { elevmappeCaseNumber: nyMappeCaseNummer };
    } else {
      writeLog(
        "  Found elevmappe with case number: " + studentFolderRes.CaseNumber
      );
      return {
        elevmappeCaseNumber: studentFolderRes.CaseNumber,
        elevmappeAccessGroup: studentFolderRes.AccessGroup,
        elevmappeStatus: studentFolderRes.Status,
      };
    }
  } catch (error) {
    meldFeil(
      error,
      "Feilet ved henting/opprettelse av elevmappe.",
      archiveMethod,
      pdf
    );
    return null;
  }
}
exports.hentEllerOpprettElevmappe = hentEllerOpprettElevmappe;
