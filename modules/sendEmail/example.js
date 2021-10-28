const sendEmail = require("./sendEmail");

const mailOptions = {
    from: 'ikkeSvar@vtfk.no',
    to: 'jorgen.thorsnes@vtfk.no',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
}

sendEmail(mailOptions);