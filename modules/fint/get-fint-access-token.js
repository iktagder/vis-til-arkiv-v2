const NodeCache = require('node-cache')
const ClientOAuth2 = require('client-oauth2')
const { OAUTH, TOKEN_PARAMS: { username, password } } = require('../../config')

const cache = new NodeCache({ stdTTL: 3000 })
const cacheKey = 'fintToken'

module.exports = () => {
  return new Promise((resolve, reject) => {
    if (cache.get(cacheKey)) {
      resolve(cache.get(cacheKey))
    } else {
      new ClientOAuth2(OAUTH).owner.getToken(username, password)
        .then(({ accessToken, data }) => {
          cache.set(cacheKey, accessToken, data.expires_in)
          resolve(accessToken)
        })
        .catch(error => reject(error))
    }
  })
}