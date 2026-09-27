# CV Studio

En lokal, flerspråklig CV-bygger for GitHub Pages. Alle brukerdata behandles utelukkende i nettleseren. Ingen server eller database er nødvendig.

Link> https://zanzyt.github.io/Cv-creater/

## Prosjektstruktur

```text
.
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── icons/
│   │   └── favicon.svg
│   └── js/
│       ├── app.js
│       └── translations.js
└── README.md
```

## Funksjoner

- Uavhengig valg av språk for brukergrensesnittet og den ferdige CV-en.
- Automatisk skjuling av tomme seksjoner.
- Dynamisk administrasjon av arbeidserfaring og utdanning.
- Lokal opplasting av profilbilde ved hjelp av `FileReader`.
- Tre alternativer for referanser: utelates, «Oppgis på forespørsel» eller manuell utfylling.
- Responsivt redigeringsverktøy med direkte forhåndsvisning i A4-format.
- Utskrift og lagring som PDF direkte fra nettleseren, uten PDF-generering på en server.
- Foreslått PDF-filnavn i formatet `Fornavn_Etternavn_CV_ÅR.pdf`.

## Kilder til CV-strukturen

- [Utdanning.no – Slik skriver du CV](https://utdanning.no/utdanningsvalg_artikkel_slik_skriver_du_cv)
- [Arbeidsplassen NAV – Slik skriv du ein god CV](https://arbeidsplassen.nav.no/slik-skriver-du-en-god-cv)

## Lokal oppstart

Prosjektet bruker ES-moduler og må derfor kjøres via en lokal HTTP-server, ikke åpnes direkte med `file://`.

Start en lokal server med følgende kommando i PowerShell:

```powershell
py -m http.server 4174 --bind 127.0.0.1
```

Åpne deretter følgende adresse i nettleseren:

`http://127.0.0.1:4174/`
