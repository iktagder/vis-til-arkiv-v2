const axios = require("axios")
const generateSystemJwt = require('./generate-system-jwt')

module.exports = async options => {
    const {data} = await axios.post(options.url, options.payload, { headers: { Authorization: generateSystemJwt() } })
    return data
}