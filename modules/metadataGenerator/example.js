const createMetadata = require("./createMetadata");

(async () => {
    const documentData = {
        "documentType": "VIS003", // Specify a schema you want to test
        "schoolYear": "Halloi",
        "studentName": "Jørgen mann",
        "documentDate": "2021-05-03",
        "elevmappeCaseNumber": "20/20909",
        "schoolAccessGroup": "Elev Færder vgs",
        "schoolOrgNr": "202123234423",
        "studentBirthnr": "34345545454",
        "pdfFileBase64": "24345dfgdjkflds",
        "versionFormat": "A"
    }
    const res = createMetadata(documentData);
    console.log(res);
})();