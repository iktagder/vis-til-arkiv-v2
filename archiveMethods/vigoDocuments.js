const soap = require('strong-soap').soap;
const archiveVigoDocument = require("../modules/archiveVigoDocument/archiveVigoDocument");
const twhError = require("../modules/teamsWebhook/twhError");
const writeLog = require("../modules/writeLog/writeLog");

module.exports = async (config) => {

    // wsdl of the web service this client is going to invoke. For local wsdl you can use, url = './wsdls/stockquote.wsdl'
    const url = config.VIGO_URL;

    const hentDataArgumenter = {
        HentDataForArkiveringRequestElm: {
            AntallElevDokument: 20,
            Fylke: config.VIGO_FYLKESKODE
        }
    };


    soap.createClient(url, config, async function (err, client) {
        if (err) { throw Error(err) }

        const wsSecurity = new soap.WSSecurity(config.VIGO_AUTH.uname, config.VIGO_AUTH.pwd);
        client.setSecurity(wsSecurity);

        const hentData = client['HentDataForArkivering'];
        const oppdaterStatus = client['LagreStatusArkiverteData'];
        let lesVidere = true;

        while (lesVidere) {
            try {
                const { err, result } = await hentData(hentDataArgumenter);
                if (err) { throw Error(err) }
                if (result.HentDataForArkiveringResponseElm.Feilmelding.Feiltype === "INGEN DATA") { break; }

                await archiveVigoDocument(result.HentDataForArkiveringResponseElm.Elevelement, config)
                    .then((arkiveringsresultat) => {
                        oppdaterVigoArkiveringsstatus(arkiveringsresultat, oppdaterStatus);
                    })
                    .catch((error) => {
                        twhError('   Unhandled error in archiveVigoDocument', error)
                    });
            } catch (err) {
                twhError('   Unhandled error in hentData WS-call', err);
            }
        }
    });
}

function oppdaterVigoArkiveringsstatus(arkiveringsresultat, oppdaterStatus) {
    for (const melding of arkiveringsresultat) { // TODO: hva synes vigo om å få mange requester på rappen
        const oppdaterStatusArgumenter = {
            Fagsystemnavn: melding.melding,
            DokumentId: melding.vigoMelding.Dokumentelement.DokumentId, // dokumnetid vigo
            Fodselsnummer: melding.vigoMelding.Fodselsnummer,
            ArkiveringUtfort: melding.arkiveringUtfort
        }
        oppdaterStatus(oppdaterStatusArgumenter, (err, result/*, envelop, soapHeader*/) => {
            if (err) {
                writeLog(`=${DokumentId}=\tError during status update. p360 ref: ${oppdaterStatusArgumenter.Fagsystemnavn}.`);
                throw Error(err); // TODO: twh eller kast feil? Tell antall feil og avbryt? Avvent og prøv på nytt?
            }
            const { ArkiveringUtfort, DokumentId, Fagsystemnavn } = result.LagreStatusArkiverteDataResponseElm;
            writeLog(`=${DokumentId}=\tArchived Status set to ${ArkiveringUtfort} for p360: ${Fagsystemnavn}`);
        })
    }
}
