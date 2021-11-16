const getAccessToken = require('./get-fint-access-token')
const getData = require('./get-url-data')

module.exports = async (fnr) => {
  const accessToken = await getAccessToken()
  const url = "https://api.felleskomponent.no/utdanning/elev/person/fodselsnummer/" + fnr
  return await getData(accessToken, url)
}