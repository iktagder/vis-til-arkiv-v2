const writeLog = require("../modules/writeLog/writeLog");
const soap = require('strong-soap').soap;

module.exports = async (options, test = false) => {

    // wsdl of the web service this client is going to invoke. For local wsdl you can use, url = './wsdls/stockquote.wsdl'
    const url = options.VIGO_URL;

    var requestArgs = {
        HentDataForArkiveringRequestElm: {
            AntallElevDokument: 1,
            Fylke: 42
        }
    };

    var wsSecurity = new soap.WSSecurity(options.VIGO_AUTH.uname, options.VIGO_AUTH.pwd);

    soap.createClient(url, options, function (err, client) {
        if (err) { throw Error(err) }

        client.setSecurity(wsSecurity);
        var method = client['HentDataForArkivering'];
        method(requestArgs, function (err, result, envelope, soapHeader) {
            if (err) { throw Error(err) }
            
            console.log('Response Envelope: \n' + envelope);
            console.log('Result: \n' + JSON.stringify(result));
        });
    });
}
