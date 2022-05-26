const standardPageSizes = require("pdfmake/src/standardPageSizes");

const hentSkolenavn = (pdfs) => {
  const skolenavn = pdfs.map((pdf) => {
    // fjern ./input/Kompetansebevis/, ta alt som ligger mellom / og -
    const skoleMedSti = pdf.split("-")[0].split("/"); // fjerner navn/fødselsnummer og splitter på
    return skoleMedSti[skoleMedSti.length - 1].trim(); // ta siste element
  });
  unikeSkolenavn = [
    ...new Set(skolenavn), // bruker Set for å fjerne duplikater
  ];

  return unikeSkolenavn.forEach((skole) => {
    return {
      navn: skole,
      antallDokumenter: skolenavn.filter((s) => s === skole).count(),
    };
  });
};

module.exports = async (archiveMethod, config) => {
  const p360url = config.P360_URL;
  const p360authkey = config.P360_AUTHKEY;

  const stats = {
    imported: 0,
    documents: 0,
    error: 0,
    // and whatever you like statistics on, update them wherever suitable in the flow, and finally, write them to statfile with writeStat(archiveMethod.metadataSchema, stats)
  };
  const listOfPdfs = getPdfsInFolder(archiveMethod.inputFolder);
  const unikeSkolenavn = hentSkolenavn(listOfPdfs);
  unikeSkolenavn.forEach((skole, index) =>
    console.log(
      `${index} ${skole.navn} - Antall dokuemnter ${skole.antallDokumenter}`
    )
  );
};
