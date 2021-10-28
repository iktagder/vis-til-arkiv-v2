const getSchools = require('vtfk-schools-info');

module.exports = (archiveMethod, pdfContent) => {
    let documentData = {
        documentType: archiveMethod.metadataSchema
    };
    let pdfFieldDesc = { //these are the required documentFields for this documentType.
        "Fødselsdato": "studentBirthdate",
        "Elev": "studentName",
        "Dato": "documentDate",
        "Fag": "course"
    };
    // TIP: chek out pdfContent to see the structure of the pdf content
    let pdfStrings = pdfContent.textContent.map(ele => ele.str);
    let infoString = false
    let dateInfoString = false;
    for (const str of pdfStrings) {
        console.log(str)
        if (str.includes("Elev:") && str.includes("Klasse:") && str.includes("Fødselsdato:")) {
            infoString = str
        }
        else if (str.includes("Sted:") && str.includes("Dato:")) {
            dateInfoString = str
        }
        else if (str.includes("Fag:")) {
            documentData.course = str.split("Fag:")[1].trim()
        }
    }
    if (!infoString || !dateInfoString) {
        throw Error("Mangler info i pdf-teksten, sjekk pdf...")
    }
    let infoStringList = infoString.split("Elev:")[1].split("Klasse:")
    documentData.studentName = infoStringList[0].trim()
    documentData.studentBirthdate = infoStringList[1].split("Fødselsdato:")[1].trim()
    documentData.schoolOrgNr = "994309153"
    documentData.schoolAccessGroup = "Elev Kompetansebyggeren"
    documentData.documentDate = dateInfoString.split("Dato:")[1].trim()

    // Convert documentdate to 360 date format (YYYY-MM-DD)
    documentDateList = documentData.documentDate.split(".");
    documentData.documentDate = documentDateList[2]+"-"+documentDateList[1]+"-"+documentDateList[0];

    // Check if we found all the values we need
    for (const [key, value] of Object.entries(pdfFieldDesc)) {
        if (!documentData[value]) {
            throw Error("Could not find value for "+value+" in the pdf document, check document")
        }
    }
    return documentData;
}