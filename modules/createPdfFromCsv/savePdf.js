const PdfPrinter = require('pdfmake');
const fs = require('fs');

module.exports = (template, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            let fonts = {
                Roboto: {
                    normal: 'modules/createPdfFromCsv/fonts/Roboto-Regular.ttf',
                    bold: 'modules/createPdfFromCsv/fonts/Roboto-Medium.ttf',
                    italics: 'modules/createPdfFromCsv/fonts/Roboto-Italic.ttf',
                    bolditalics: 'modules/createPdfFromCsv/fonts/Roboto-MediumItalic.ttf'
                }
            };
            let printer = new PdfPrinter(fonts);
            const pdfTemplate = template;
            const pdfStream = printer.createPdfKitDocument(pdfTemplate);
            let stream = pdfStream.pipe(fs.createWriteStream(filePath));
            pdfStream.end();
            stream.on('finish', function(){
                resolve(filePath);
            })
        } catch (err) {
            reject(err);
        }
    });
};