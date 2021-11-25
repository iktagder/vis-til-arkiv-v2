const config = require('../../config')
const getAccessToken = require('./get-fint-access-token')
const getData = require('./get-url-data')

module.exports = async (fnr) => {
  const accessToken = await getAccessToken()
  const url = config.FINT_DOMAIN + "/utdanning/elev/person/fodselsnummer/" + fnr
  return await getData(accessToken, url)
}