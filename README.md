# til-arkiv

Tilpasset variant av [vis-til-arkiv](https://github.com/vtfk/vis-til-arkiv-v2) for bruk i ikt-agder.

Start script med `npm start -- -?` eller `node index.js -?` for å velge operasjon.

- `-v` eller `--vigo` kjører skript for å hente dokumenter fra vigo-køen
- `-o` eller `--opprettElevmapper` kjører skript for å opprette kontakt og mappe i P360 gitt csv-fil med fødselsnummer
- `-k` kjører `--karakterutskrift` skript for å lese karakterutskrift-pdfer fra lokal mappe
- `--kompetansebevis` kjører innlesing og arkivering av kompetansebevis-pdfer
- `--kompetansebevis` kjører innlesing og arkivering av vitnemål-pdfer

## Utvikling og test

Tips, oppsett og triks for utviklere finnes [./docs](./docs/utvikling.md).

## Vigo integrasjon - løsningsbeskrivelse

1. Henter _n_ antall melding fra Vigo webservice
   - _n_ settes i `config.js` (ANTALL_ELEV_DOKUMENTER)
2. for hver melding
   1. Synk av kontakt + elevmappe
   2. Opprett metadata for P360 (unntak for enkelte dokumenttyper)
   3. Arkivering av dokument
   4. Oppdaterer vigo med arkivstatus
3. Scriptet kan kjøres på nytt. Settes opp med Task Scheduler eller manuelt

## karakterutskrift - løsningsbeskrivelse

1. Tar i mot pdf-dokumenter via `input-folder` (se `archiveMethods/karakterutskrift.js`).
2. Leser ut fødselsnummer, skole, dokumentdato fra PDF`n.
3. Gjør oppslag i VIS via FINT for å finne navn og adresse til elev.
4. Arkiverer dokument til P360
   1. Finnes kontakt - opprett kontakt
   2. Finnes ikke kontakt - opprett med navn + adresse
   3. Finnes ikke elevmappe - opprett elevmappe
   4. Lager metadata for dokument ut fra hvilken "DOKUMENTTYPE" det er.
   5. Oppretter dokument i P360.

For hvert dokument det oppstår feil med å arkivere, sendes det en melding til en Teams-kanal (`MS_TEAMS_WEBHOOK_URL` i `.env`)

Elever med hemmelig adresse løses på følgende måte: Hvis tilgangsgruppe på sak starter med teksten "SPERRET", så arver dokument tilgangsgruppe på saken.

### Krav til pdf-dokumentene

Må inneholde følgende tekstelementer:

- `Fødselsnummer: 11111111111` - fødselsnummer til elev
- `Dato: 11.11.2021` - dette er dokumentdato
  - `Skole: Tvedestrand videregående skole` - for å kunne sette riktig tilgangsgruppe/ansvarlig enhet på skole

Om dokumentet skal dispatches til riktig mappe/mal, må `VIS MAL TYPE: MAL001` også være med. Men om man legger dokumentene direkte i mal-mappen, trenger man ikke dette.

## kompetansebevis og vitnemål - løsningsbeskrivelse

Bygger på karkaterutskrift med noen forenklinger og endringer i selve koden for å tilpasse
struktur i pdf.

### Krav til pdf-dokumentene

Må inneholde følgende tekstelementer:

- `Fødselsnummer: \n\n11111111111` - fødselsnummer til elev (dette leses som to separate linjer)
- `Sted og dato: Kristiansand S, 29.03.2022, 11.11.2021` - dette er dokumentdato med dato fraskilt med ','
- `Skole: Tvedestrand videregående skole` - for å kunne sette riktig tilgangsgruppe/ansvarlig enhet på skole

### PDFCreator Server

Dette bruker VTFK for at fagpersoner kan "printe" til mappestrukturen. Ikke avklart om vi trenger dette...?

## opprettElevmapper - løsningsbeskrivelse

- Tar i mot csv via med fødselsnummer, dokumentdato og skole.
- Synk av kontakt + elevmappe, ingen dokumenter som lagres

## Maler

Maler kan konfigureres med følgende:

- "createElevmappe": true, - _Opprette elevmappe om den ikke eksisterer?_
- "createDocument": true, - _Arkivere dokument til P360?_
- "alertTeams": true - _Varsler kanal i Teams ved feil._

Følgende flagg er ikke i bruk, vår variant overlater kommunikasjon med studenter til P360.

- "sendToStudent": false, (NB! ikke satt opp for Agder)
- "manualSendToStudent": false, (NB! ikke satt opp for Agder)
- "sendToParents": false, (NB! ikke satt opp for Agder)
- "manualSendToParents": false, (NB! ikke satt opp for Agder)

I tillegg anngis hvilken mal-type for arkivering av dokument i P360 som skal brukes. Dette finnes i `modules/metadataGenerator/documentTypes.json`.
