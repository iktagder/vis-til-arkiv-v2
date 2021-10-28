const dsf = require("./dsf")
const config = require('../../config')
const birthdateFromId = require('birthdate-from-id')

function getAge(birthDateString) {
    let today = new Date();
    let birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    let m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
function capitalizeWords(string) {
    const stringList = string.split(" ")
    let res = []
    for (str of stringList) {
        const dashList = str.split("-")
        let res2 = []
        for (dash of dashList) {
            res2.push(capitalize(dash))
        }
        res.push(res2.join("-"))
    }
    return res.join(" ")
}

module.exports = async (birthnr, getParents, useBirthdate, person) => {
    let options
    if (useBirthdate) {
        options = {
            url: config.DSF_AZF_URL,
            payload: {
                method: "hentDetaljer",
                massLookup: true,
                query: {
                saksref: 'VisTilArkiv',
                foedselsdato: person.birthdate,
                etternavn: person.lastName,
                fornavn: person.firstName
                }
            }
        }
    }
    else {
        options = {
            url: config.DSF_AZF_URL,
            payload: {
                method: "hentDetaljer",
                massLookup: true,
                query: {
                saksref: 'VisTilArkiv',
                foedselsnr: birthnr,
                }
            }
        }
    }
     
    let dsfStudent = {
        birthnr: birthnr,
        studentName: "",
        streetAddress: "",
        zipCode: "",
        zipPlace: "",
        age: "",
        blockedAddress: false,
        parents: []
    }

    const dsfResponse = await dsf(options)
    const data = dsfResponse.RESULT.HOV
    const firstName = capitalizeWords(data["NAVN-F"])
    const middleName = (data["NAVN-M"]) ? " "+capitalizeWords(data["NAVN-M"])+" " : " "
    const lastName = capitalizeWords(data["NAVN-S"])
    dsfStudent.studentName = firstName+middleName+lastName
    dsfStudent.streetAddress = (data.ADR) ? capitalizeWords(data.ADR) : data.ADR
    dsfStudent.zipCode = data.POSTN
    dsfStudent.zipPlace = (data.POSTS) ? capitalizeWords(data.POSTS) : data.POSTS

    if (useBirthdate) {
        dsfStudent.birthnr = data["FODT"]+data["PERS"]
    }

    // Get age
    dsfStudent.age = getAge(birthdateFromId(dsfStudent.birthnr))

    // Check status utvandret
    if (data["STAT"] === "UTVANDRET" && !data.ADR) {
        dsfStudent.streetAddress = "Utvandret"
        dsfStudent.zipCode = "9999"
        dsfStudent.zipPlace = "_ Ukjent"
    }

    // Check address block (IMPORTANT!)
    const addresseSperring = ["4", "6", "7"]
    if (addresseSperring.includes(data["SPES-KD"])) {
        dsfStudent.blockedAddress = true
        dsfStudent.streetAddress = "Sperret adresse"
        dsfStudent.zipCode = "9999"
        dsfStudent.zipPlace = "_ Ukjent"
    }

    if (data["SPES-KD"] === "4") {
        dsfStudent.streetAddress = "Klientadresse"
    }
    if (data["SPES-KD"] === "6") {
        dsfStudent.streetAddress = "Sperret adresse, strengt fortrolig"
    }
    if (data["SPES-KD"] === "7") {
        dsfStudent.streetAddress = "Sperret adresse, fortrolig"
    }

    // Check if we need parent info
    if (dsfStudent.age > 17) {
        return dsfStudent
    }
    else if (dsfStudent.blockedAddress) {
        return dsfStudent
    }
    else if (!getParents) {
        return dsfStudent
    }

    // Get parent info
    let morFnr = false
    let farFnr = false
    if (data["MOR-FODT"]) {morFnr = data["MOR-FODT"]+data["MOR-PERS"]}
    if (data["FAR-FODT"]) {farFnr = data["FAR-FODT"]+data["FAR-PERS"]}
    if (morFnr) {
        const morOptions = {
            url: config.DSF_AZF_URL,
            payload: {
                method: "hentDetaljer",
                massLookup: true,
                query: {
                saksref: 'VisTilArkiv',
                foedselsnr: morFnr,
                }
            }
        }
        let dsfMother = {
            birthnr: morFnr,
            personName: "",
            streetAddress: "",
            zipCode: "",
            zipPlace: "",
        }
        const dsfMotherResponse = await dsf(morOptions)
        const morData = dsfMotherResponse.RESULT.HOV
        const morfirstName = capitalizeWords(morData["NAVN-F"])
        const mormiddleName = (morData["NAVN-M"]) ? " "+capitalizeWords(morData["NAVN-M"])+" " : " "
        const morlastName = capitalizeWords(morData["NAVN-S"])
        dsfMother.personName = morfirstName+mormiddleName+morlastName
        dsfMother.streetAddress = (morData.ADR) ? capitalizeWords(morData.ADR) : morData.ADR
        dsfMother.zipCode = morData.POSTN
        dsfMother.zipPlace = (morData.POSTS) ? capitalizeWords(morData.POSTS) : morData.POSTS

        // Check if same address as student
        if (dsfMother.streetAddress === dsfStudent.streetAddress && dsfMother.zipCode === dsfStudent.zipCode && dsfMother.zipPlace === dsfStudent.zipPlace) {
            dsfStudent.parents.push(dsfMother)
        }
    }
    if (farFnr) {
        const farOptions = {
            url: config.DSF_AZF_URL,
            payload: {
                method: "hentDetaljer",
                massLookup: true,
                query: {
                saksref: 'VisTilArkiv',
                foedselsnr: farFnr,
                }
            }
        }
        let dsfFather = {
            birthnr: farFnr,
            personName: "",
            streetAddress: "",
            zipCode: "",
            zipPlace: "",
        }
        const dsfFatherResponse = await dsf(farOptions)
        const farData = dsfFatherResponse.RESULT.HOV
        const farfirstName = capitalizeWords(farData["NAVN-F"])
        const farmiddleName = (farData["NAVN-M"]) ? " "+capitalizeWords(farData["NAVN-M"])+" " : " "
        const farlastName = capitalizeWords(farData["NAVN-S"])
        dsfFather.personName = farfirstName+farmiddleName+farlastName
        dsfFather.streetAddress = (farData.ADR) ? capitalizeWords(farData.ADR) : farData.ADR
        dsfFather.zipCode = farData.POSTN
        dsfFather.zipPlace = (farData.POSTS) ? capitalizeWords(farData.POSTS) : farData.POSTS

        // Check if same address as student
        if (dsfFather.streetAddress === dsfStudent.streetAddress && dsfFather.zipCode === dsfStudent.zipCode && dsfFather.zipPlace === dsfStudent.zipPlace) {
            dsfStudent.parents.push(dsfFather)
        }
    }
    return dsfStudent
}