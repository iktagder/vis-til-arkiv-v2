const createElevmappe = require("./createElevmappe");
const config = require('../../config');

(async () => {
    student = {
        birthnr: "fnr",
        firstName: "Huhuhu",
        lastName: "Test"
    }
    options = {
        url: config.P360_URL,
        authkey: config.P360_AUTHKEY
    }

    try {
        const res = await createElevmappe(student, options);
        console.log(res);
    } catch (error) {
        console.log(error);
    }
})();