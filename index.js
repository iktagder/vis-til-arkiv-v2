const options = require("./config");
const writeLog = require("./modules/writeLog/writeLog");
const twhError = require("./modules/teamsWebhook/twhError");

const dispatchDocuments = require("./modules/dispatchDocuments/dispatchDocuments");
//const svarUTtest = require("./archiveMethods/example/svarUTtest");
const fritakKarakterKroppsoving = require("./archiveMethods/soknader/fritakKarakterKroppsoving");
const fritakOpplaringKroppsoving = require("./archiveMethods/soknader/fritakOpplaringKroppsoving");
const fritakKarakterSidemal = require("./archiveMethods/soknader/fritakKarakterNorskSidemal");
const fritakOpplaringSidemal = require("./archiveMethods/soknader/fritakOpplaringSidemal");
const godkjenningTidligereFag = require("./archiveMethods/soknader/godkjenningTidligereFag");
const tilretteleggingEksamen = require("./archiveMethods/soknader/tilretteleggingEksamen");
const tilretteleggingPrivatistEksamen = require("./archiveMethods/soknader/tilretteleggingPrivatistEksamen");
const VOgodkjenningTidligereFag = require("./archiveMethods/soknader/VOgodkjenningTidligereFag");
const varselVO = require("./archiveMethods/varselVO");
const karakterutskrift = require("./archiveMethods/soknader/karakterutskrift");

//run main program
(async () => {
    // Dispatch documents
    writeLog(" - - - STARTING SCRIPT - - - ");
    
    /*try {
        await dispatchDocuments(options.DISPATCH_FOLDER, options.TYPE_FOLDERS);
    } catch (error) {
        writeLog("Error when dispatching documents: "+error)
        await twhError("Error when dispatching documents", error, options.DISPATCH_FOLDER)
    }*/

    try {
        await karakterutskrift(options, test=true);
    } catch (error) {
        writeLog("Error when running karakterutskrift: "+error);
        await twhError("Error when running karakterutskrift", error, options.DISPATCH_FOLDER)
    }

    /*
    try {
        await svarUTtest(options, test=true);
    } catch (error) {
        writeLog("Error error yada yada: "+error);
        await twhError("Error yadayada", error, options.DISPATCH_FOLDER)
    }*/
    /*
    try {
        await fritakKarakterKroppsoving(options, test=true);
    } catch (error) {
        writeLog("Error when running fritakKarakterKroppsoving: "+error);
        await twhError("Error when running fritakKarakterKroppsoving", error, options.DISPATCH_FOLDER)
    }
    try {
        await fritakOpplaringKroppsoving(options, test=true);
    } catch (error) {
        writeLog("Error when running fritakOpplaringKroppsoving: "+error);
        await twhError("Error when running fritakOpplaringKroppsoving", error, options.DISPATCH_FOLDER)
    }
    try {
        await fritakKarakterSidemal(options, test=true);
    } catch (error) {
        writeLog("Error when running fritakKarakterSidemal: "+error);
        await twhError("Error when running fritakKarakterSidemal", error, options.DISPATCH_FOLDER)
    }
    try {
        await fritakOpplaringSidemal(options, test=true);
    } catch (error) {
        writeLog("Error when running fritakOpplaringSidemal: "+error);
        await twhError("Error when running fritakOpplaringSidemal", error, options.DISPATCH_FOLDER)
    }
    try {
        await godkjenningTidligereFag(options, test=true);
    } catch (error) {
        writeLog("Error when running godkjenningTidligereFag: "+error);
        await twhError("Error when running godkjenningTidligereFag", error, options.DISPATCH_FOLDER)
    }
    try {
        await tilretteleggingEksamen(options, test=true);
    } catch (error) {
        writeLog("Error when running tilretteleggingEksamen: "+error);
        await twhError("Error when running tilretteleggingEksamen", error, options.DISPATCH_FOLDER)
    }
    try {
        await tilretteleggingPrivatistEksamen(options, test=true);
    } catch (error) {
        writeLog("Error when running tilretteleggingEksamenPrivatist: "+error);
        await twhError("Error when running tilretteleggingEksamenPrivatist", error, options.DISPATCH_FOLDER)
    }
    try {
        await VOgodkjenningTidligereFag(options, test=true);
    } catch (error) {
        writeLog("Error when running VOgodkjenningTidligereFag: "+error);
        await twhError("Error when running VOgodkjenningTidligereFag", error, options.DISPATCH_FOLDER)
    }
    
    try {
        await varselVO(options, test=true);
    } catch (error) {
        writeLog("Error when running varselVO: "+error);
        await twhError("Error when running varselVO", error, options.DISPATCH_FOLDER)
    }*/
})();