const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js'); //need the es5 build to work with Node - do not know why...

//takes in a path to a pdf-file, returns object with pdf-metadata and text content
module.exports = async (pdfPath) => {
    let pdfData = {
        metadata: "",
        textContent: [],
        styles: {}
    }
    const loadingTask = await pdfjsLib.getDocument(pdfPath);
    const doc = await loadingTask.promise;
    const numPages = doc.numPages;
    pdfData.metadata = await doc.getMetadata();

    for (let i=1; i<= numPages; i++) { // RUNAR: unwrap pdf into pdfData dict. 
        let page = await doc.getPage(i);
        let txtContent = await page.getTextContent();
        pdfData.textContent = pdfData.textContent.concat(txtContent.items);
        for (const [key, value] of Object.entries(txtContent.styles)) {
            pdfData.styles[key] = value;
        }
    }
    return pdfData;
}