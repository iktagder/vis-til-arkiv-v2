(async () => {
    /*
    const twhError = require("./twhError")
    const err = "BLIblop"
    const msg = "Hei, dette er en test"
    const filename = "filename.file"
    await twhError(msg, err, filename)
    */
    const twhInfo = require("./twhInfo")
    const info = "BLIblop"
    const msg = "Hei, dette er en test for infomelding"
    const filename = "filename.file"
    await twhInfo(msg, info, filename)
})()