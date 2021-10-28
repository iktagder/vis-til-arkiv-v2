const sendEmail = require("./sendEmail");

module.exports = (emailAddress, filename) => {

    const htmlText = "<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360), er ikke skrudd på da den fortsatt er under testing. Ditt dokument, <em>"+filename+"</em>, vil <strong>ikke</strong> bli behandlet - du kan begynne å bruke løsningen fra og med 1. september. <br><br>---<br> Mvh BDK-TEK"
    const mailOptions = {
        from: "ikkeSvar@vtfk.no",
        to: emailAddress,
        subject: "VIS til Arkiv - løsningen er ikke aktiv enda, dokumentet du har sendt til printeren vil ikke bli behandlet",
        //text: "Hei! Arkiveringsløsningen VIS til Arkiv (Public 360), er ikke skrudd på da den fortsatt er under testing. Ditt dokument vil ikke bli behandlet - du vil få informasjon når du kan begynne å bruke løsningen. Mvh BDK-TEK"
        html: htmlText
    }

    sendEmail(mailOptions);
}