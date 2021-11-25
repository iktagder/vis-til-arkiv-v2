const PdfPrinter = require('pdfmake');
const fs = require('fs');
const getFilesInFolder = require('../getPdfsInFolder/getFilesInFolder');
const twhError = require('../teamsWebhook/twhError');
const writeLog = require('../writeLog/writeLog');
const savePdf = require('./savePdf');
const { ROOT_FOLDER } = require('../../config');


module.exports = async (csvImportFolder) => {
    var listOfCsvFiles = getFilesInFolder(csvImportFolder, "csv")

    if (listOfCsvFiles.length > 0){
      try {
        writeLog(" Starter oppretting av PDF fra CSV: " + listOfCsvFiles[0])
        const data = fs.readFileSync(listOfCsvFiles[0], 'utf8')
        var fnrArray = data.split('\r\n')
        for (const fnr of fnrArray) {

            var docDefinition = {
                content: [
                    'PDF generert fra: ' + listOfCsvFiles[0],
                    'Fødselsnummer: '+ fnr,
                    'Skole: Dummy',
                    'Dato: 01.01.2020'
                ]
            }; 

            const filnavn = ROOT_FOLDER + '/OpprettElevmapper' + '/generated-'+fnr+'.pdf'
            
            var x = await savePdf(docDefinition, filnavn)
            y = x // feilhåndtering her!😁
            
            writeLog(" Opprettet PDF-dokument: "+filnavn)
            
        } 

      } catch (err) {
        writeLog(" Feil med å lese inn CSV: "+listOfCsvFiles[0], "error: " + err)
      }
    }
    
    
}