const fs = require("fs");

module.exports = (file) => {
    let binaryData = fs.readFileSync(file);
    let buff = Buffer.from(binaryData);
    let base64File = buff.toString("base64");
    return base64File;
}