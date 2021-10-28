module.exports = (filename) => {
    const filenameList = filename.split("---");
    const emailAddress = filenameList[1];
    return emailAddress;
}