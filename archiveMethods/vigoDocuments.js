const soap = require('strong-soap').soap;
const archiveVigoDocument = require("../modules/archiveVigoDocument/archiveVigoDocument");

module.exports = async (options) => {

    // wsdl of the web service this client is going to invoke. For local wsdl you can use, url = './wsdls/stockquote.wsdl'
    const url = options.VIGO_URL;

    const hentDataArgumenter = {
        HentDataForArkiveringRequestElm: {
            AntallElevDokument: 20,
            Fylke: options.VIGO_FYLKESKODE
        }
    };

    const wsSecurity = new soap.WSSecurity(options.VIGO_AUTH.uname, options.VIGO_AUTH.pwd);

    soap.createClient(url, options, function (err, client) {
        if (err) { throw Error(err) }

        client.setSecurity(wsSecurity);

        const hentData = client['HentDataForArkivering'];
        const oppdaterStatus = client['LagreStatusArkiverteData'];

        // TODO: loop så lenge vi mottar dokumenter
        hentData(hentDataArgumenter, function (err, result/*, envelope, soapHeader*/) {
            if (err) { throw Error(err) }
            archiveVigoDocument(result.HentDataForArkiveringResponseElm.Elevelement, options)
                .then((arkiveringsresultat) => {
                    oppdaterVigoArkiveringsstatus(arkiveringsresultat, oppdaterStatus);
                }
                ).catch((error) => console.error(error)
                    // TODO ingen stier skal kaste feil i archiveVigoDocuments, men kan vi være 100% sikker
                )
        });
    });
}


function oppdaterVigoArkiveringsstatus(arkiveringsresultat, oppdaterStatus) {
    for (const melding of arkiveringsresultat) {
        const oppdaterStatusArgumenter = {
            Fagsystemnavn: melding.melding, // Lagrer arkiv-referanse ved vellykket arkivering
            DokumentId: melding.vigoMelding.Dokumentelement.DokumentId,
            Fodselsnummer: melding.vigoMelding.Fodselsnummer,
            ArkiveringUtfort: melding.arkiveringUtfort
        }
        oppdaterStatus(oppdaterStatusArgumenter, (err, result/*, envelop, soapHeader*/) => {
            // TODO: valider oppdatert status og informer teams-kanal med dokument-id dersom noe går galt
            if (err) { throw Error(err) }
            console.log(result);
        })
    }
}
