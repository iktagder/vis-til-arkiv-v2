const syncPrivatePerson = require("../syncPrivatePerson/syncPrivatePerson");
const meldFeil = require("./meldFeil");

async function synkOgHentStudentRecno(
  student,
  studentBirthnr,
  archiveMethod,
  pdf,
  p360Options
) {
  const studentData = {
    lastName: student.data.navn.etternavn,
    firstName: student.data.navn.fornavn,
    streetAddress: student.data.bostedsadresse.adresselinje[0],
    zipCode: student.data.bostedsadresse.postnummer,
    zipPlace: student.data.bostedsadresse.poststed,
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
