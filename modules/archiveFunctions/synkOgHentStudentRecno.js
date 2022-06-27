const syncPrivatePerson = require("../syncPrivatePerson/syncPrivatePerson");
const meldFeil = require("./meldFeil");

async function synkOgHentStudentRecno(
  studentInfo,
  studentBirthnr,
  archiveMethod,
  pdf,
  p360Options
) {
  const fornavnInkludertMellomnavn =
    studentInfo.navn.mellomnavn.length > 0
      ? `${studentInfo.navn.fornavn} ${studentInfo.navn.mellomnavn}`
      : studentInfo.navn.fornavn;
  const studentData = {
    lastName: studentInfo.navn.etternavn,
    firstName: fornavnInkludertMellomnavn,
    streetAddress: settSammenAdresse(studentInfo.bostedsadresse.adresselinje),
    zipCode: studentInfo.bostedsadresse.postnummer,
    zipPlace: studentInfo.bostedsadresse.poststed,
    birthnr: studentBirthnr, // TODO: hent fra student-objektet?
  };

  try {
    return syncPrivatePerson(studentData, p360Options, pdf);
  } catch (error) {
    meldFeil(error, "Feilet ved synk av student.", archiveMethod, pdf);
    return null;
  }
}

function settSammenAdresse(adresselinjer) {
  return adresselinjer.reduce(
    (akkumulator, linje) => akkumulator + "\n" + linje
  );
}

exports.synkOgHentStudentRecno = synkOgHentStudentRecno;
