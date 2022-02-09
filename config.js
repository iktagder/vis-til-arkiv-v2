require('dotenv').config();

module.exports = {
    ANTALL_ELEV_DOKUMENTER: 20,

    TEST_ENV: process.env.TEST_ENV === "true",
    P360_URL: process.env.P360_URL,
    P360_AUTHKEY: process.env.P360_AUTHKEY,
    P360_CASE_ACCESS_GROUP: process.env.P360_CASE_ACCESS_GROUP,
    DSF_SECRET: process.env.DSF_SECRET,
    DSF_AZF_URL: process.env.DSF_AZF_URL,
    DISPATCH_FOLDER: "C:/samplePdfs/VIS",
    TYPE_FOLDERS: {
        "VISFOTBALL": "C:/samplePdfs/VIS/visFotball",
        "VISTEST": "C:/samplePdfs/VIS/vistest",
        "VIS001": "C:/samplePdfs/VIS/vis001",
        "VIS002": "C:/samplePdfs/VIS/vis002",
        "VIS003": "path",
        "VIS004": "path",
        "VIS005": "path",
        "UNKNOWN": "path",
        "DELETE": "C:/samplePdfs/VIS/delete"
    },
    ROOT_FOLDER: process.env.ROOT_FOLDER,
    LOG_FILE: process.env.LOG_FILE,
    STAT_FILE: process.env.STAT_FILE,
    P360_INTERNAL_NOTES: {
        "BLOCKED_ADDRESS": "C:/gitRepositories/vis-til-arkiv/data/internalNote/blockedAddress.pdf",
        "VARSEL_BLOCKED_ADDRESS": "C:/gitRepositories/vis-til-arkiv/data/internalNote/varselBlockedAddress.pdf"
    },

    OAUTH: {
        clientId: process.env.FINT_CLIENTID,
        clientSecret: process.env.FINT_OPENIDSECRET,
        accessTokenUri: process.env.OAUTH_IDP_URL,
        scopes: process.env.FINT_SCOPE
    },
    TOKEN_PARAMS: {
        username: process.env.FINT_USERNAME,
        password: process.env.FINT_PASSWORD
    },
    FINT_DOMAIN: process.env.FINT_DOMAIN,
    VIGO_URL: process.env.VIGO_URL,
    VIGO_FYLKESKODE: process.env.VIGO_FYLKESKODE,
    VIGO_AUTH: {
        uname: process.env.VIGO_WSSECURITY_USERNAME,
        pwd: process.env.VIGO_WSSECURITY_PASSWORD
    }
}