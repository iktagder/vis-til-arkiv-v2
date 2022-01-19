# til-arkiv

Start script med `npm start -- -?` eller `node index.js -?`  for å velge operasjon.

* `-v` eller `--vigo` kjører skript for å hente dokumenter fra vigo-køen
* `-o` eller `--opprettElevmapper` kjører skript for å opprette kontakt og mappe i P360 gitt csv-fil med fødselsnummer
* `-k` kjører `--karakterutskrift` skript for å lese karakterutskrift-pdfer fra lokal mappe

## .env
Se `example.env` for liste av miljøvariabler. Disse settes i `.env` og leses inn ved kjøring.

Lokale mapper for csv og pdf-filer, samt url og auth for Vigo og P360 defineres her.

## Utvikling og test
SoapUI er nyttig for å mocke Vigo. Eksempel på oppsett finnes i [./docs](./docs/utvikling.md).

## Løsningen inneholder

1. Tar i mot dokumenter i "dispatch-mappe", og fordeler til den enkelte "mal-mappe" ut fra innholdet i tekstfelt "VIS MAL TYPE" i PDF.
2. Leser ut fødselsnummer, skole, dokumentdato fra PDF`n.
3. Gjør oppslag i VIS via FINT for å finne navn og adresse til elev.
4. Arkiverer dokument til P360
    1. Finnes kontakt - opprett kontakt
    2. Finnes ikke kontakt - uppdater navn + adresse
    3. Finnes ikke elevmappe - opprett elevmappe
    4. Lager metadata for dokument ut fra hvilken "VIS MAL TYPE" det er.
    5. Oppretter dokument i P360.

For hvert dokument det oppstår feil med å arkivere, sendes det en melding til en Teams-kanal.

Elever med hemmelig adresse løses på følgende måte: Hvis tilgangsgruppe på sak starter med teksten "SPERRET", så arver dokument tilgangsgruppe på saken.

## Dispatch
Mulig å samle alle dokumentene i en innboks, slik at det er en dispatch-jobb som videreformidler filene til riktig mal-mappe.

## Mottak av CSV-fil med fødselsnummer
* Tar i mot CSV-fil (kun en kolonne) med fødselsnummer på hver linje. 
* Oppretter pdf i mal "OpprettElevmappe" for synk av kontakt og elevmappe

## Maler

Maler kan konfigureres med følgende:   
* "createElevmappe": true, - *Opprette elevmappe om den ikke eksisterer?*
* "createDocument": true, - *Arkivere dokument til P360?*
* "sendToStudent": false, (NB! ikke satt opp for Agder)
* "manualSendToStudent": false, (NB! ikke satt opp for Agder)
* "sendToParents": false, (NB! ikke satt opp for Agder)
* "manualSendToParents": false, (NB! ikke satt opp for Agder)
* "alertTeams": true - *Varsler kanal i Teams ved feil.*

I tillegg anngis hvilken mal-type for arkivering av dokument i P360 som skal brukes. Dette finnes i `modules/metadataGenerator/documentTypes.json`.

### Vigo meldingskø
* Henter _n_ antall melding fra Vigo webservice
* Synk av kontakt + elevmappe
* Arkivering av dokument
* Oppdaterer vigo med arkivstatus

### Karakterutskrift
* Tar i mot PDF med fødselsnummer, dokumentdato og skole.
* Synk av kontakt + elevmappe
* Arkivering av dokument 

### OpprettElevmappe
* Tar i mot PDF med fødselsnummer, dokumentdato (hardkodet til hva som helst) og skole (må være: Dummy).
* Synk av kontakt + elevmappe (arkiverer ikke dokument!)

## Krav til pdf-dokumentene

Må inneholde følgende tekstelementer: 

* `Fødselsnummer: 11111111111` - fødselsnummer til elev
* `Dato: 11.11.2021` - dette er dokumentdato
* `Skole: Tvedestrand videregående skole` - for å kunne sette riktig tilgangsgruppe/ansvarlig enhet på skole

Om dokumentet skal dispatches til riktig mappe/mal, må `VIS MAL TYPE: MAL001` også være med. Men om man legger dokumentene direkte i mal-mappen, trenger man ikke dette.

## PDFCreator Server

Dette bruker VTFK for at fagpersoner kan "printe" til mappestrukturen. Ikke avklart om vi trenger dette...?

