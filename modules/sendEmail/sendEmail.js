const nodemailer = require('nodemailer');
require('dotenv').config();

module.exports = (mailOptions) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
    });

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          throw Error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

}