const fs = require("fs");
const path = require("path");

module.exports = (dir) => {
    let listOfPdfs = [];
    fs.readdirSync(dir).forEach(file => {
        if ((path.extname(file) === ".pdf") || (path.extname(file) === ".PDF")) {
            listOfPdfs.push(dir+"/"+file);
        }
    });
    return listOfPdfs;
}