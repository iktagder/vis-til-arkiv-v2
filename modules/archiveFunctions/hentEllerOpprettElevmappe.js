const writeLog = require("../writeLog/writeLog");
const getElevmappe = require("../getElevmappe/getElevmappe");
const createElevmappe = require("../createElevmappe/createElevmappe");
const meldFeil = require("./meldFeil");
const { P360_CASE_ACCESS_GROUP } = require("../../config");

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
        //streetAddress: studentInfo.bostedsadresse.adresselinje[0]
        //zipCode: studentInfo.bostedsadresse.postnummer,
        //zipPlace: studentInfo.bostedsadresse.poststed,
        birthnr: studentBirthnr,
      };
      // TODO: Skriv om slik at createElevmappe returnerer hele responsen for accessgroup og status
      const nyMappeCaseNummer = await createElevmappe(
        opprettElevmappePayload,
        p360Options
      );

      writeLog(
        "Oppretter elevmappe for student: " + documentData.studentBirthnr
      );

      return {
        elevmappeCaseNumber: nyMappeCaseNummer,
        elevmappeAccessGroup: P360_CASE_ACCESS_GROUP, // Hardkoder verdier fremfor å skrive om createElevmappe-funksjon
        elevmappeStatus: "B",
      };
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
