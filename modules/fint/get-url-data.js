const axios = require('axios').default

module.exports = async (accessToken, url) => {
//  logger('info', ['get-url-data', url])

  const options = {
    headers: {
      Authorization: `Bearer: ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  //const instance = axios.create({
  //  timeout: 10000
  //})

  try {
    const data = await axios.get(url, options)
    return data
  } catch (error) {
  //  logger('error', ['get-url-data', error])
    //if (isNetworkTimeout(error.message)) {
    //  return new HTTPError(500, networkTimeoutMessage(timeout)).toJSON()
    //} else return new HTTPError(404, error.message).toJSON()
    return "error"
  }
}