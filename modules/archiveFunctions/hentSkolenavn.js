function hentSkolenavn(pdfs) {
  const skolenavn = pdfs.map((pdf) => {
    // fjern ./input/Kompetansebevis/, ta alt som ligger mellom / og -
    const skoleMedSti = pdf.split(" - ")[0].split("/"); // fjerner navn/fødselsnummer og splitter på
    return skoleMedSti[skoleMedSti.length - 1].trim(); // ta siste element
  });
  unikeSkolenavn = [
    ...new Set(skolenavn), // bruker Set for å fjerne duplikater
  ];
  const dokumentOversiktPrSkole = unikeSkolenavn.map((skole) => {
    return {
      navn: skole,
      antallDokumenter: skolenavn.filter((s) => s === skole).length,
    };
  });
  return dokumentOversiktPrSkole;
}
exports.hentSkolenavn = hentSkolenavn;
