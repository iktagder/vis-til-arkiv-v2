const fs = require("fs")
const path = require("path");

module.exports = (pdfPath, destinationPath) => {
    // if folder does not exist - create
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath);
    }
    fs.renameSync(pdfPath, destinationPath+"/"+path.basename(pdfPath), function (err) {
        if (err) throw Error(err);
    });
}