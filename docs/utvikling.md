# Utviklingsoppsett

Prosjektet bruker [eslint](https://eslint.org/) for linting. [vscode plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), eller [finn en for din favoritt-editor](https://eslint.org/docs/user-guide/integrations).

Prosjektet bruker commonjs konvensjoner og er utviklet og testet med [nodejs 16](https://nodejs.org/dist/latest-v16.x/). 
## .env
Se `example.env` for liste av miljøvariabler. Disse settes i `.env` og leses inn ved kjøring.

Rot-mappe for prosjektet, url og auth for Vigo og P360 defineres her. Sti til pdf og csv defineres i 
`archiveMethods/opprettElevmapper.js` og `archiveMethods/opprettElevmapper.js`

## Deployment
Det som skiller "prod" og "test" er konfigurasjon, altså hvilke instanser av P360, Vigo og andre eksterne miljøer og hvilke kataloger som benyttes for å importere karakterutskrift-pdfer eller csv-filer.

### Test
Azure devops benyttes for å deploye til "test"-miljø. Dette utføres når en commit gjøres til `main`-grenen. Se `azure-pipelines.yml` for nøyaktig plassering av kode.

### Prod
Etter at test er verifisert flyttes script over til prod-mappe. Påse at config (`.env`) ikke overskrives. Kopier av oppsett ligger i mappen over.

Task scheduler settes opp for de oppgavene som gjøres jevnlig.

## SopaUI for Vigo dokumenter

Et [nyttig verktøy](https://www.soapui.org/) når en jobber med Vigos webservice. Her kan en mocke respons og sjekke at requester er i henhold til wdsl.

* Lag et nytt SOAP-prosjekt og les WDSL'en.

![Nytt prosjekt](./img/new-soap-project.png)

* Høyreklikk på prosjektet for å opprette mock-service

![Mock service](./img/generate-mock-service.png)

* Legg til respons-data for hver service

![Response data](./img/add-mock-response.png)

* Åpne mock-servicen med dobbelklik. Kjør mock med play-knapp, åpne options med tannhjulet
    * options eksempel path: `/`, port: `8088`, host: `localhost`

![Response data](./img/run-mock-service.png)

* Sjekke request og response under kjøring ved å dobbelklikke på forespørsel loggen i bunnen av mock-vindu

![Examine request](./img/request-inspection.png)

## Typiske feil

> Uncaught Error: Error: Unexpected root element of WSDL or include

Kjører mocken? Sjekk at innstillinger og .env er i overenstemmelse.
