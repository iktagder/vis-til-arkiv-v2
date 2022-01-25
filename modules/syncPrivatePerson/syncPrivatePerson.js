const p360 = require("../nodep360/p360");
const writeLog = require("../writeLog/writeLog");

// Check if person exists, if exist, use reference, if not create new private person

module.exports = async (student, options) => {
    if (!student.firstName) {
        throw Error("Missing required parameter: student.firstName");
    }
    if (!student.lastName) {
        throw Error("Missing required parameter: student.lastName");
    }
    if (!student.birthnr) {
        throw Error("Missing required parameter: student.birthnr");
    }
    if (!options.url) {
        throw Error("Missing required parameter: options.url");
    }
    if (!options.authkey) {
        throw Error("Missing required parameter: options.authkey");
    }
    let createNewPrivatePerson = false;
    let updatePrivatePerson = false;
    let privatePersonRecno;
    const getPrivatePersonOptions = {
        url: options.url,
        authkey: options.authkey,
        service: "ContactService",
        method: "GetPrivatePersons"
    }
    const payload = {
        "PersonalIdNumber": String(student.birthnr),
        "Active": "true"
    }
    const privatePersonRes = await p360(payload, getPrivatePersonOptions);
    if (privatePersonRes.Successful) {
        if (privatePersonRes.TotalCount === 0) {
            createNewPrivatePerson = true;
        }
        else if (privatePersonRes.TotalCount === 1) {
            privatePersonRecno = privatePersonRes.PrivatePersons[0].Recno;
            if (privatePersonRes.PrivatePersons[0].PrivateAddress.StreetAddress.toLowerCase().includes("sperret adresse") || privatePersonRes.PrivatePersons[0].PrivateAddress.StreetAddress.toLowerCase().includes("klientadresse")) { // address is blocked in 360 - do NOT update, even though not blocked in DSF
                return "hemmelig"
            }
            else {
                updatePrivatePerson = true
            }
        }
        else {
            throw Error("Found more than one private person with birthnr :"+student.birthnr);
        }
    }
    else {
        throw Error(privatePersonRes.ErrorMessage);
    }
    if (createNewPrivatePerson) {
        if (!student.streetAddress) {
            throw Error("Missing required parameter: student.streetAddress");
        }
        if (!student.zipPlace) {
            throw Error("Missing required parameter: student.zipPlace");
        }
        if (!student.zipCode) {
            throw Error("Missing required parameter: student.zipCode");
        }
        writeLog("  Created privatePerson in 360 with fnr:" + student.birthnr)
        const createPrivatePersonOptions = {
            url: options.url,
            authkey: options.authkey,
            service: "ContactService",
            method: "SynchronizePrivatePerson"
        }
        const payload = {
            "FirstName": student.firstName,
		    "LastName": student.lastName,
		    "PersonalIdNumber": student.birthnr,
		    "Active":"true",
			"PrivateAddress": {
				"StreetAddress": student.streetAddress,
    				"ZipCode": student.zipCode,
    				"ZipPlace": student.zipPlace,
    				"Country": "NOR"
    		}
	    }
        const syncPrivatePersonRes = await p360(payload, createPrivatePersonOptions);
        if (syncPrivatePersonRes.Successful) {
            return syncPrivatePersonRes.Recno;
        }
        else {
            throw Error(syncPrivatePersonRes.ErrorMessage);
        }
    }
    if (updatePrivatePerson && student.streetAddress && student.zipCode && student.zipPlace) {
        writeLog("  Updated privatePerson in 360 with fnr:" + student.birthnr)
        const updatePrivatePersonOptions = {
            url: options.url,
            authkey: options.authkey,
            service: "ContactService",
            method: "UpdatePrivatePerson"
        }
        const payload = {
            "Recno": privatePersonRecno,
            "FirstName": student.firstName,
		    "LastName": student.lastName,
		    "Active":"true",
			"PrivateAddress": {
				"StreetAddress": student.streetAddress,
    				"ZipCode": student.zipCode,
    				"ZipPlace": student.zipPlace,
    				"Country": "NOR"
    		}
	    }
        const updatePrivatePersonRes = await p360(payload, updatePrivatePersonOptions);
        if (updatePrivatePersonRes.Successful) {
            return updatePrivatePersonRes.Recno;
        }
        else {
            throw Error(updatePrivatePersonRes.ErrorMessage);
        }
    }
    return privatePersonRes.Recno;
}