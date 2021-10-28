const fs = require('fs');
const options = require("../../config");
const statFile = require(options.STAT_FILE);

module.exports = async (docType, stats) => {
    if (!statFile[docType]) {statFile[docType] = {}}
    for (const [key, value] of Object.entries(stats)) {
        statFile[docType][key] = (statFile[docType][key]) ? statFile[docType][key] + value : value
    }
    /*fs.writeFile(options.STAT_FILE, JSON.stringify(statFile, null, 2), function writeJSON(err) {
    if (err) return console.log(err);
    });*/
    fs.writeFileSync(options.STAT_FILE, JSON.stringify(statFile, null, 2));
}