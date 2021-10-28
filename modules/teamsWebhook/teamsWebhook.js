module.exports = async (payload) => {
    const axios = require("axios")
    require('dotenv').config()
    const url = process.env.MS_TEAMS_WEBHOOK_URL
    const res = await axios.post(url, payload)
    return res
}