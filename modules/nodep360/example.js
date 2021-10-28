const p360 = require("./p360");

(async () => {
    const payload = {
        "Name": "Name Namesen"
    }
    const options = {
        url: "url",
        authkey: "authkey",
        service: "ContactService",
        method: "GetPrivatePersons"
    }
    try {
        const response = await p360(payload, options);
        console.log(response);
    } catch (error) {
        console.log(error);
    }
})();