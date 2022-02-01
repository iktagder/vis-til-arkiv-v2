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
                if (!result.HentDataForArkiveringResponseElm ||
                    result.HentDataForArkiveringResponseElm.Feilmelding.Feiltype === "INGEN DATA") {
                    break;
                }

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
            Fagsystemnavn: melding.melding, // TODO: Lagrer arkiv-referanse ved vellykket arkivering for å kunne se i vigo hvor i P360 meldingen er lagret, men hva med meldinger uten dokuemnt?
            DokumentId: melding.vigoMelding.Dokumentelement.DokumentId, // dokumnetid vigo
            Fodselsnummer: melding.vigoMelding.Fodselsnummer,
            ArkiveringUtfort: melding.arkiveringUtfort
        }
        oppdaterStatus(oppdaterStatusArgumenter, (err, result/*, envelop, soapHeader*/) => {
            if (err) {
                writeLog(`   Error update status for vigo docId ${oppdaterStatusArgumenter.DokumentId} p360 docId: ${oppdaterStatusArgumenter.Fagsystemnavn}.`);
                throw Error(err); // TODO: twh?
            }
            const { ArkiveringUtfort, DokumentId, Fagsystemnavn } = result.LagreStatusArkiverteDataResponseElm;
            writeLog(`  Archived Status set to ${ArkiveringUtfort} for vigo docId ${DokumentId} p360 docId: ${Fagsystemnavn}`);
        })
    }
}
