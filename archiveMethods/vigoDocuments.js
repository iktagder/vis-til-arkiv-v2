const soap = require('strong-soap').soap;
const archiveVigoDocument = require("../modules/archiveVigoDocument/archiveVigoDocument");
const twhError = require("../modules/teamsWebhook/twhError");
const writeLog = require("../modules/writeLog/writeLog");

module.exports = async (config) => {

    // wsdl of the web service this client is going to invoke. For local wsdl you can use, url = './wsdls/stockquote.wsdl'
    const url = config.VIGO_URL;

    const hentDataArgumenter = {
        HentDataForArkiveringRequestElm: {
            AntallElevDokument: config.ANTALL_ELEV_DOKUMENTER,
            Fylke: config.VIGO_FYLKESKODE
        }
    };


    soap.createClient(url, config, async function (err, client) {
        if (err) { throw Error(err) }

        const wsSecurity = new soap.WSSecurity(config.VIGO_AUTH.uname, config.VIGO_AUTH.pwd);
        client.setSecurity(wsSecurity);

        const hentData = client['HentDataForArkivering'];
        const oppdaterStatus = client['LagreStatusArkiverteData'];

        try {
            const { err, result } = await hentData(hentDataArgumenter);
            if (err) { throw Error(err) }
            if (!result || !result.HentDataForArkiveringResponseElm ||
                result.HentDataForArkiveringResponseElm.Feilmelding.Feiltype === "INGEN DATA") { // sjekk hvorvidt det finnes _noe_ data og arkiver de
                writeLog(`No more data from hentData at ${url}`);
                return;
            } if (!!result.HentDataForArkiveringResponseElm.Feilmelding.Feiltype &&
                result.HentDataForArkiveringResponseElm.Feilmelding.Feiltype.length > 0) {
                writeLog(`ERROR: unknown Feiltype from hentData: ${result.HentDataForArkiveringResponseElm.Feilmelding.Feiltype}`);
                twhError('ERROR: unknown Feiltype from hentData', result.HentDataForArkiveringResponseElm.Feilmelding.Feiltype);
            }

            await archiveVigoDocument(result.HentDataForArkiveringResponseElm.Elevelement, config)
                .then((arkiveringsresultat) => {
                    oppdaterVigoArkiveringsstatus(arkiveringsresultat, oppdaterStatus);
                })
                .catch((errorFromArchiveVigoDocument) => {
                    twhError('Unhandled error in archiveVigoDocument', errorFromArchiveVigoDocument)
                });
        } catch (errorFromHentData) {
            writeLog(`ERROR:\tGot error response from hentData at ${url}`);
            twhError('Unhandled error in hentData WS-call. Check Vigo WS status, application url and credentials.', errorFromHentData);
        }
    });
}

function oppdaterVigoArkiveringsstatus(arkiveringsresultater, oppdaterStatus) {
    for (const arkiveringsresultat of arkiveringsresultater) { // TODO: hva synes vigo om å få mange requester på rappen
        const oppdaterStatusArgumenter = {
            LagreStatusArkiverteDataRequestElm: {
                Fagsystemnavn: arkiveringsresultat.melding,
                Fodselsnummer: arkiveringsresultat.vigoMelding.Fodselsnummer,
                DokumentId: arkiveringsresultat.vigoMelding.Dokumentelement.DokumentId, // dokumnetid vigo
                ArkiveringUtfort: arkiveringsresultat.arkiveringUtfort,
            }
        }
        oppdaterStatus(oppdaterStatusArgumenter, (err, result/*, envelop, soapHeader*/) => {
            if (err) {
                writeLog(`ERROR: =${DokumentId}=\tError during status update. p360 ref: ${oppdaterStatusArgumenter.Fagsystemnavn}.`);
                throw Error(err); // TODO: twh eller kast feil? Tell antall feil og avbryt? Avvent og prøv på nytt?
            }
            const { ArkiveringUtfort, DokumentId, Fagsystemnavn } = result.LagreStatusArkiverteDataResponseElm;
            writeLog(`=${DokumentId}=\tArchived Status set to ${ArkiveringUtfort} in Vigo for p360 document ${Fagsystemnavn}`);
        })
    }
}
