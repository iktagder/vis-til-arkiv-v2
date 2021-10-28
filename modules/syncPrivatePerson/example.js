(async () => {
    const syncPrivatePerson = require("./syncPrivatePerson");
    const config = require("../../config")
    
    student = {
        birthnr: "12345678911",
        firstName: "Klaus",
        lastName: "Klausesss",
        streetAddress: "Veien 2",
        zipCode: "2000",
        zipPlace: "Trondheim"
    }
    
    options = {
        url: config.P360TEST_URL,
        authkey: config.P360TEST_AUTHKEY
    }

    try {
        const res = await syncPrivatePerson(student, options);
        console.log(res);
    } catch (error) {
        console.log(error);
    }
})();