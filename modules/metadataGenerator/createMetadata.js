const documentTypes = require("./documentTypes.json");
// REMARK: This method only supports metadata-generation if you know how many files will be included in the journalpost

function findTokens(key, value, tokenList) {
    if (typeof value === "string") {
        let reqTok = value.split("<<<");
        reqTok = reqTok.slice(1);
        reqTok = reqTok.map(ele => ele.split(">>>"));
        if (reqTok.length > 0) {
            for (tok of reqTok) {
                let currentToken = tok[0];
                tokenList.push([key, currentToken]);
            }
        }
    }
    else if (Array.isArray(value)) {
        for (let i=0; i<value.length; i++) {
            findTokens(key + "%%%"+i, value[i], tokenList);
        }
    }
    else if (typeof value === "object") {
        for (const [key2, value2] of Object.entries(value)) {
            findTokens(key +"%%%"+ key2, value2, tokenList);
        }
    }
}

function replaceTokens(p360metadata, tokenList, documentData) { // REMARK: method only supports nested objects of arrays and objects of depth 5
    for (token of tokenList) {
        let fieldName = token[0].split("%%%");
        fieldName = fieldName.map(ele => (isNaN(ele) ? ele : parseInt(ele))); //need this to access lists in p360metadata object
        if (fieldName.length === 1) {
            p360metadata[fieldName[0]] =  p360metadata[fieldName[0]].replace("<<<"+token[1]+">>>", documentData[token[1]]);
        }
        if (fieldName.length === 2) {
            p360metadata[fieldName[0]][fieldName[1]] =  p360metadata[fieldName[0]][fieldName[1]].replace("<<<"+token[1]+">>>", documentData[token[1]]);
        }
        if (fieldName.length === 3) {
            p360metadata[fieldName[0]][fieldName[1]][fieldName[2]] =  p360metadata[fieldName[0]][fieldName[1]][fieldName[2]].replace("<<<"+token[1]+">>>", documentData[token[1]]);
        }
        if (fieldName.length === 4) {
            p360metadata[fieldName[0]][fieldName[1]][fieldName[2]][fieldName[3]] =  p360metadata[fieldName[0]][fieldName[1]][fieldName[2]][fieldName[3]].replace("<<<"+token[1]+">>>", documentData[token[1]]);
        }
        if (fieldName.length === 5) {
            p360metadata[fieldName[0]][fieldName[1]][fieldName[2]][fieldName[3]][fieldName[4]] =  p360metadata[fieldName[0]][fieldName[1]][fieldName[2]][fieldName[3]][fieldName[4]].replace("<<<"+token[1]+">>>", documentData[token[1]]);
        }
    }
}

function verifyData(tokenList, documentData) {
    for (token of tokenList) {
        if (documentData[token[1]] === undefined) {
            throw Error("Missing required schemavalue in parameter 'documentData'. This schema, "+documentData.documentType+", requires 'documentData."+token[1]+"' in 360 schema field: '"+token[0]+"'");
        }
    }
}

module.exports = async (documentData) => {
    if (!documentData.documentType) {
        throw Error("Missing required parameter documentData.documentType");
    }
    if (!documentTypes[documentData.documentType]) {
        throw Error("No schema definition available for documentType: "+documentData.documentType+". Create schema definition before trying to use it");
    }

    let p360metadata = JSON.parse(JSON.stringify(documentTypes[documentData.documentType].p360metadata)); // creates a new object, based on the schema for this documenttype REMARK: Do not use infinity or functions as values in schema-object!!! They will become null

    let requiredTokens = [];
    for (const [key, value] of Object.entries(p360metadata)) {
        findTokens(key, value, requiredTokens);
    }
    verifyData(requiredTokens, documentData);
    replaceTokens(p360metadata, requiredTokens, documentData);
    return p360metadata;
}