const getElevmappe = require("./getElevmappe");

(async () => {
    const options = {
        url: "url",
        authkey: "authkey"
    }
    try {
        const elevmappeRes = await getElevmappe("12345678910", options);
        console.log(elevmappeRes);
    } catch (error) {
        console.log(error);
    }
})();