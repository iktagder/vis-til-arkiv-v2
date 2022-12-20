const { P360_CASE_ACCESS_GROUP } = require("../../config");
const p360 = require("../nodep360/p360");

module.exports = async (student, options) => {
    if (!student.firstName) {
        throw Error("Missing required parameter: student.firstName");
    }
    if (!student.lastName) {
        throw Error("Missing required parameter: student.lastName");
    }
    if (!student.birthnr) {
        throw Error("Missing required parameter: student.birthnr");
    }
    if (!options.url) {
        throw Error("Missing required parameter: options.url");
    }
    if (!options.authkey) {
        throw Error("Missing required parameter: options.authkey");
    }

    const createElevmappeOptions = {
        url: options.url,
        authkey: options.authkey,
        service: "CaseService",
        method: "CreateCase"
    }
    const payload = {
        "CaseType": "Sak",
        "Title": "Elevmappe",
        "UnofficialTitle": "Elevmappe - "+student.firstName+" "+student.lastName,
        "Status": "B",
        "JournalUnit": "Agder fk",
        "SubArchive":"Elev 2020 -",
        "ArchiveCodes":[
            {
                "ArchiveCode": student.birthnr,
                "ArchiveType": "FNR",
                "Sort":1,
                "IsManualText":true
            },
            { 
                "ArchiveCode":"B31",
                "ArchiveType":"FAGKLASSE PRINSIPP",
                "Sort":2,
                "IsManualText":true
            }
        ],
        "FiledOnPaper":false,
        "AccessCode":"UO",
        "Paragraph": "Offl. § 13 jf. fvl. § 13 (1) nr.1",
        "AccessGroup": P360_CASE_ACCESS_GROUP,
        "ResponsibleEnterpriseRecno": 506, // Agder fylkeskommune
        "ResponsiblePersonRecno": 200148, // RIM RIM - lik recno i test og prod   RUNAR: QUESTION: Is this a code for the RIM project? ref comment before RUNAR
        "Contacts":[
            {
                "Role": "Sakspart",
                "ReferenceNumber": student.birthnr,
                "IsUnofficial": false
            }
        ]
    }
    const createElevmappeRes = await p360(payload, createElevmappeOptions);
    if (createElevmappeRes.Successful) {
        return createElevmappeRes.CaseNumber;
    }
    else {
        throw Error(createElevmappeRes.ErrorMessage);
    }
}