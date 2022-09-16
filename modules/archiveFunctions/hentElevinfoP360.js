const writeLog = require("../writeLog/writeLog");
const getElevinfo = require("../fint/getElevinfo");
const meldFeil = require("./meldFeil");
const p360 = require("../nodep360/p360");

async function hentElevinfoP360(fnr, archiveMethod, options, pdf) {
  try {
    const getPrivatePersonOptions = {
        url: options.url,
        authkey: options.authkey,
        service: "ContactService",
        method: "GetPrivatePersons"
    }
    const payload = {
        "PersonalIdNumber": String(fnr),
        "Active": "true"
    }

    const privatePersonRes = await p360(payload, getPrivatePersonOptions);

    if (privatePersonRes.TotalCount === 0) {
      meldFeil(
        "Fant ikke elev i P360.",
        `${fnr} ikke funnet i P360`,
        archiveMethod,
        pdf
        );
        return null; 
    }
    if (privatePersonRes.ErrorMessage !== null) {
        meldFeil(
            privatePersonRes.ErrorMessage,
            privatePersonRes.ErrorDetails,
            archiveMethod,
            pdf
            );
            return null; 
    }

    const student = privatePersonRes.PrivatePersons[0];

    writeLog(
      `Fant elev i P360: ${student.FirstName} ${student.LastName}`
    );

    // bruker samme modell som studentInfo som leveres av 
    return {
        "recno": student.Recno,
        "navn": {
            "fornavn": student.FirstName,
            "mellomnavn":student.MiddleName,
            "etternavn":student.LastName,
        },
        "bostedsadresse": {
            "adresselinje": [student.PrivateAddress.StreetAddress],
            "postnummer": student.PrivateAddress.ZipCode,
            "poststed": student.PrivateAddress.ZipPlace,
        }
    };
  } catch (error) {
    meldFeil(
      error,
      "Feilet ved henting av elevinfo fra P360.",
      archiveMethod,
      pdf
    );
    return null;
  }
}

exports.hentElevinfoP360 = hentElevinfoP360;
