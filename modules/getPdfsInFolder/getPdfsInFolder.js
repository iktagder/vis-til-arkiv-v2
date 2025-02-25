const fs = require("fs");
const path = require("path");

module.exports = (dir) => {
    let listOfPdfs = [];
    fs.readdirSync(dir).forEach(file => {
        if (path.extname(file).toLowerCase() === ".pdf") {
            listOfPdfs.push(dir+"/"+file);
        }
    });
    return listOfPdfs;
}