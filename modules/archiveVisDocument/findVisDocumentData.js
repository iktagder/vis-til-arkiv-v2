const getSchools = require('../getSchoolsAgder/getSchoolsAgder');


module.exports = (archiveMethod, pdfContent) => {
    let documentData = {
        documentType: archiveMethod.metadataSchema
    };
    let pdfFieldDesc = { //these are the required documentFields for this documentType.
        "Fødselsnummer": "studentBirthnr",
        "Skole": "school",
        "Dato": "documentDate"
    };
    // TIP: chek out pdfContent to see the structure of the pdf content
    let pdfStringsX = pdfContent.textContent.map(ele => ele.str);
    
    // Fiks for mal som inneholder "Description: Value" i forskjellige tekstelement som ligger etterhverandre.
    let pdfStrings = pdfStringsX.map(function (value, index, elements) {
        if (value.endsWith(": ")) {
            return '' + value + elements[index+1];
        }else 
            return value;
    })

    for (let i=0; i<pdfStrings.length; i++) { // Note that field description and value is found in the same element (str) in this documentType, where the description field and values are found is dependent on the structure of the pdf
        if (pdfStrings[i].split(":").length === 2) {
            let desc = pdfStrings[i].split(":")[0].trim();
            let value = pdfStrings[i].split(":")[1].trim();
            if (pdfFieldDesc[desc] !== undefined) { // this is a field we are looking for
                if (documentData[pdfFieldDesc[desc]] !== undefined && documentData[pdfFieldDesc[desc]] !== value) { // Check if this field is already found, if so, throw error
                    throw Error("Found duplicate description field with different values: "+desc+", pdf is not set up correctly in VIS, contact school VIS administrator");
                }
                else {
                    documentData[pdfFieldDesc[desc]] = value;
                }
            }
        }
    }
    
    // Check if we found all the values we need
    for (const [key, value] of Object.entries(pdfFieldDesc)) {
        if (!documentData[value]) {
            throw Error("Could not find value for "+value+" in the pdf document, check document")
        }
    }

    // Convert documentdate to 360 date format (YYYY-MM-DD)
    documentDateList = documentData.documentDate.split(".");
    documentData.documentDate = documentDateList[2]+"-"+documentDateList[1]+"-"+documentDateList[0];

    // Get school info
    if (documentData.documentType === "VIS007") { // svar på søknad om tilrettelegging ved privatisteksamen
        documentData.schoolOrgNr = "62000";
        documentData.schoolAccessGroup = "Eksamen";
    }
    else if (documentData.documentType === "VIS009") { // svar på søknad om godkjenning av tidligere beståtte fag VOKSENOPPLÆRING
        documentData.schoolOrgNr = "994309153";
        documentData.schoolAccessGroup = "Elev Kompetansebyggeren";
    }
    else {
        let schoolOptions = {
            "fullName": documentData.school
        }
        if (documentData.school === "Kompetansebyggeren Vestfold") {
            schoolOptions["fullName"] = "Kompetansebyggeren"
        }
        const schoolInfo = getSchools(schoolOptions)[0] // Should only get one school back when searching for full name
        documentData.schoolOrgNr = schoolInfo.organizationNumber360; //add schoolID
        documentData.schoolAccessGroup = schoolInfo.accessGroup; //add schoolAccessGroup
    }
    return documentData;
}