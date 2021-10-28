const fs = require('fs');
const options = require("../../config");

module.exports = (txt) => {
    let timestamp = new Date();
    let timeDate = (timestamp.getDate() > 9) ? timestamp.getDate() : "0"+timestamp.getDate();
    let timeMonth = (timestamp.getMonth() > 9) ? (timestamp.getMonth()+1) : "0"+(timestamp.getMonth()+1);
    let timeHours = (timestamp.getHours() > 9) ? timestamp.getHours() : "0"+timestamp.getHours();
    let timeMinutes = (timestamp.getMinutes() > 9) ? timestamp.getMinutes() : "0"+timestamp.getMinutes();
    let timeSeconds = (timestamp.getSeconds() > 9) ? timestamp.getSeconds() : "0"+timestamp.getSeconds();
    fs.appendFileSync(options.LOG_FILE, timeDate+"."+timeMonth+"."+timestamp.getFullYear()+" kl. "+timeHours+":"+timeMinutes+":"+timeSeconds + "    " + txt+"\r\n", (err) => {
        if (err) console.log(err);
    });
}