const jwt = require('jsonwebtoken')
const config = require('../../config')
const pkg = require('../../package.json')

module.exports = secret => {
  const payload = {
    system: pkg.name,
    version: pkg.version
  }

  const options = {
    expiresIn: '1m',
    issuer: 'https://auth.vtfk.no'
  }

  return jwt.sign(payload, secret || config.DSF_SECRET, options)
}