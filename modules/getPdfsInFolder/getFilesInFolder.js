const fs = require("fs");
const path = require("path");

module.exports = (dir, extension) => {
    let listOfPdfs = [];
    fs.readdirSync(dir).forEach(file => {
        if (path.extname(file).toLowerCase() === "."+extension) {
            listOfPdfs.push(dir+"/"+file);
        }
    });
    return listOfPdfs;
}