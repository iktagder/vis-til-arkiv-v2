const p360 = require("../nodep360/p360");

module.exports = async (birthnr, options) => {
    // Legg inn throw error når parameter mangeler
    const elevmappeOptions = {
        url: options.url,
        authkey: options.authkey,
        service: "CaseService",
        method: "GetCases"
    }
    const payload = {
        "ArchiveCode": "B31",
        "ContactReferenceNumber": String(birthnr)
    }
    const elevmappeRes = await p360(payload, elevmappeOptions); // Returns false if elevmappe does not exist
    var student_cases = "";
    if (elevmappeRes.Successful) {
        if (elevmappeRes.TotalCount === 0) {
            return false;
        }
        else {
            let activeCases = [];
            for (const elevmappe of elevmappeRes.Cases) {
                let statusP360 = elevmappe.Status;
                statusP360 = statusP360.toLowerCase();

                if (statusP360 === 'under behandling')
                {
                    activeCases.push(elevmappe);
                    student_cases = student_cases + "-" + elevmappe.CaseNumber
                }
                // if (elevmappe.Status !== "Utgår" || elevmappe.Status !== "Avsluttet") {
                //     activeCases.push(elevmappe);
                // }
            }
            if (activeCases.length === 1) {
                return activeCases[0]; // success here, else Error
            }
            else if (activeCases.length === 0) {
                return false; // Has only deactived elevmapper
            }
            else {
                throw Error(`Student (${birthnr}) has several active elevmapper #(${activeCases.length}), cases(${student_cases})`);
            }
        }
    }
    else {
        throw Error(elevmappeRes.ErrorMessage);
    }
}