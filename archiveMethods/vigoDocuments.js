const writeLog = require("../modules/writeLog/writeLog");
const soap = require('strong-soap').soap;
const archiveVigoDocument = require("../modules/archiveVigoDocument/archiveVigoDocument");

module.exports = async (options, test = false) => {

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
        const oppdaterStatus = client['LagreStatusArkiverteData '];

        hentData(hentDataArgumenter, function (err, result, envelope, soapHeader) {
            if (err) { throw Error(err) }
            archiveVigoDocument(result.HentDataForArkiveringResponseElm.Elevelement, options)
                .then((arkiveringsresultat) => {
                    oppdaterVigoArkiveringsstatus(arkiveringsresultat, oppdaterStatus);
                }
                ).catch((error)
                    // TODO full kræsj, hva gjør vi da?
                )
        });
    });
}


function oppdaterVigoArkiveringsstatus(arkiveringsresultat, oppdaterStatus) {
    for (melding of arkiveringsresultat) {
        const oppdaterStatusArgumenter = {
            LagreStatusArkiverteDataRequestElm: {
                Fagsystemnavn: melding.vigoMelding.Fagsystemnavn,
                DokumentId: melding.vigoMelding.DokumentId,
                Fodselsnummer: melding.vigoMelding.Fodselsnummer,
                ArkiveringUtfort: melding.arkiveringUtfort
            }
        }
        // oppdater vigo ws med «ARKIVERT»
        oppdaterStatus(oppdaterStatusArgumenter, (err, result, envelop, soapHeader) => {
            // TODO: valider oppdatert status og informer teams-kanal med dokument-id dersom noe går galt
            if (err) { throw Error(err) }
        })
    }
}