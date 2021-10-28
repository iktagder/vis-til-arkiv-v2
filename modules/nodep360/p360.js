const axios = require("axios");

module.exports = async (payload, options) => {
    if (!options.url) {
        throw Error("Missing required parameter options.url");
    }
    if (!options.authkey) {
        throw Error("Missing required parameter options.authkey");
    }
    if (!options.service) {
        throw Error("Missing required parameter options.service");
    }
    if (!options.method) {
        throw Error("Missing required parameter options.method");
    }
    if (!payload) {
        throw Error("Missing required parameter payload");
    }
    //construct url
    let url = (options.url.slice(options.url.length-1) === "/") ? options.url : options.url+"/"; //check for slash, add if missing
    url = url + options.service + "/" + options.method + "?authkey=" + options.authkey;
    
    //post payload to url
    const response = await axios.post(url, {
        parameter: payload
    });
    return response.data;
}