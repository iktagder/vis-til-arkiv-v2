(async () => {
    const findVisVarselData = require("./findVisVarselData")
    const pdfReader = require("../pdfReader/pdfReader")
    const archiveMethod = {
        metadataSchema: "VarselVO"
    }

    const pdfPath = "C:/tempBackups/SamplePDF/3.pdf";
    const pdfContent = await pdfReader(pdfPath)
    const data = findVisVarselData(archiveMethod, pdfContent)
    console.log(data)
})()

