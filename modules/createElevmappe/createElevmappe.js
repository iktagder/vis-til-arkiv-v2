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

    // :(
    let vtfkRobotRecno
    if (options.url.includes("test")) {
        vtfkRobotRecno = 200148
    }
    else {
        vtfkRobotRecno = 200326 // TODO: Denne må settes for PROD!!!
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
        "AccessGroup": "Elev - LAO", // TODO: Må denne enres i prod?
        "ResponsibleEnterpriseRecno": 506,
        "ResponsiblePersonRecno": vtfkRobotRecno,
        "Contacts":[
            {
                "Role": "Sakspart",
                "ReferenceNumber": student.birthnr,
                "IsUnofficial": true
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