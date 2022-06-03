const getSchools = require("../getSchoolsAgder/getSchoolsAgder");

module.exports = (archiveMethod, pdfContent) => {
  let documentData = {
    documentType: archiveMethod.metadataSchema,
  };
  let pdfFieldDesc = {
    //these are the required documentFields for this documentType.
    Fødselsnummer: "studentBirthnr",
    Skole: "school",
    Dato: "documentDate",
  };
  // TIP: chek out pdfContent to see the structure of the pdf content
  const pdfStrings = pdfContent.textContent.map((ele) => ele.str);

  // TODO: legg til sjekk for å se om eksisterende verdi er det samme som ny verdi for å
  // avdekke dårlig input (altså at et dokument har to forskjellige fnr, dato eller skole)
  for (i = 0; i < pdfStrings.length; i++) {
    if (pdfStrings[i].startsWith("Sted og dato")) {
      documentData.documentDate = konverterDatoTilP360(
        pdfStrings[i].split(", ")[1]
      );
    } else if (pdfStrings[i].startsWith("Fødselsnummer")) {
      documentData.studentBirthnr = pdfStrings[i + 2].replace(" ", "");
    } else if (pdfStrings[i].startsWith("Skole")) {
      documentData.school = pdfStrings[i].split(": ")[1];
    }
  }

  // Check if we found all the values we need
  for (const [_, value] of Object.entries(pdfFieldDesc)) {
    if (!documentData[value] || documentData[value].trim().length === 0) {
      throw Error(
        "Could not find value for " +
          value +
          " in the pdf document, check document"
      );
    }
  }

  // Get school info
  let schoolOptions = {
    fullName: documentData.school,
  };

  const schoolInfo = getSchools(schoolOptions)[0]; // Should only get one school back when searching for full name
  documentData.schoolOrgNr = schoolInfo.organizationNumber360; //add schoolID
  documentData.schoolAccessGroup = schoolInfo.accessGroup; //add schoolAccessGroup

  return documentData;
};

// Convert documentdate to 360 date format (YYYY-MM-DD)
function konverterDatoTilP360(datoString) {
  datoListe = datoString.split(".");
  return datoListe[2] + "-" + datoListe[1] + "-" + datoListe[0];
}
