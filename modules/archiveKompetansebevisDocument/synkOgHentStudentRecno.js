const syncPrivatePerson = require("../syncPrivatePerson/syncPrivatePerson");
const meldFeil = require("./meldFeil");

async function synkOgHentStudentRecno(
  studentInfo,
  studentBirthnr,
  archiveMethod,
  pdf,
  p360Options
) {
  const studentData = {
    lastName: studentInfo.navn.etternavn,
    firstName: studentInfo.navn.fornavn,
    streetAddress: studentInfo.bostedsadresse.adresselinje[0],
    zipCode: studentInfo.bostedsadresse.postnummer,
    zipPlace: studentInfo.bostedsadresse.poststed,
    birthnr: studentBirthnr, // TODO: hent fra student-objektet!
  };

  try {
    return syncPrivatePerson(studentData, p360Options, pdf);
  } catch (error) {
    meldFeil(error, "Feilet ved synk av student.", archiveMethod, pdf);
    return null;
  }
}
exports.synkOgHentStudentRecno = synkOgHentStudentRecno;
