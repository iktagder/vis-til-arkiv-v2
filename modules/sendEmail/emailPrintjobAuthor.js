const sendEmail = require("./sendEmail");

module.exports = (emailAddress, filename) => {

    const htmlText = "<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360) kunne ikke håndtere ditt dokument: <em>"+filename+"</em> siden løsningen ikke kunne gjenkjenne dokumenttypen. Ditt dokument vil <strong>ikke</strong> bli behandlet, og slettes automatisk. <br><br>"+
        "<strong>Husk å bruke Adobe Acrobat Reader til å åpne dokumentet før du printer det ut.</strong> Om Adobe Acrobat Reader ikke er satt som standard-program på din pc, <a href='https://helpx.adobe.com/no/acrobat/kb/not-default-pdf-owner-windows10.html'>les her hvordan du setter det som standard</a>, eller kontakt IT-brukerstøtte.<br><br>"+
        "Godkjente svarbrev du kan sende til printeren fra VIS er som følger: <br>"+
        "<ul><li>Fritak for vurdering med karakter i kroppsøving</li><li>Fritak for opplæring i kroppsøving</li><li>Fritak for vurdering med karakter i sidemål</li><li>Fritak for opplæring i sidemål</li><li>Godkjenning av tidligere beståtte fag</li><li>Godkjenning av tidligere beståtte fag - Voksenopplæring</li><li>Tilrettelegging av eksamen og prøver</li><li>Tilrettelegging ved privatisteksamen</li><li>Varsel om fare for manglende vurderingsgrunnlag i fag - Kompetansebyggeren/Voksenopplæring</li></ul><br><br>"+
        "Dersom du har sendt et slikt dokument fra VIS - vennligst forsikre deg om at du sender det til printeren fra Adobe Acrobat Reader, da dette er et krav for at pdf-en skal bli lesbar."+
        "<br><br>--<br> Mvh Seksjon for arkiv og dokumenthåndtering";
    const mailOptions = {
        from: "ikkeSvar@vtfk.no",
        to: emailAddress,
        subject: "VIS til Arkiv - ditt dokument "+filename+" ble ikke gjenkjent som et gyldig svarbrev fra VIS og vil bli slettet",
        //text: "Hei! Arkiveringsløsningen VIS til Arkiv (Public 360), er ikke skrudd på da den fortsatt er under testing. Ditt dokument vil ikke bli behandlet - du vil få informasjon når du kan begynne å bruke løsningen. Mvh BDK-TEK"
        html: htmlText
    }

    sendEmail(mailOptions);
}