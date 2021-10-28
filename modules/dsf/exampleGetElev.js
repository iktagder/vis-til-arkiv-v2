
(async () => {
    const dsfGetElev = require("./dsfGetElev")
    try {
      let birthnr = "Heihei"
      const dsfElevRes = await dsfGetElev(birthnr)
      console.log(dsfElevRes)
    } catch (error) {
      console.log(error)
    }
})()