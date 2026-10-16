# CONTEXT.md — tidningssimulator (BLT Framsidebyggare)

**Skolvegg-verktyg för att bygga en tidning förstasida.** Bläddra artiklar,
dra & drop dem på en A4-startsida, spara och skriv ut. Svenskt UI
(Hej! Välkommen — bygg din egen firstäsida för BLT). Projektet avser
tidningslärar-versionen, **inte** BLT:s riktiga system.

## Teknik (verifierat)

- **Flask 3.0.2 + Jinja2** och `flask-limiter` (rate limiting). WeasyPrint togs
  bort i okt 2026: det användes inte, och dess systempaket gjorde att
  Docker-bygget föll på nyare Debian. Utskrift sker i webbläsaren.
- Frontend är en enda beskriven page; JS byggs med **esbuild +
  `tools/bundle.py`** men den resulterande `static/script.js` (934 r) är
  INCHECKAD i repot — en copy av källan.
- **En server behövs** (Flask) — `.fabrik`-server-raden är nu `python3 app.py`
  (korrigerad; tidigare stod det `python3 -m http.server 8000` vilket inte ger
  några /save-route:er).

## Struktur

```
app.py                    — Flask-app (~261 r): GET / (render), POST /save,
                            GET /list-saved. Ingen /pdf-sida!
templates/index.html      — UI (drag & drop-sidorna), 770 r inline CSS/JS-delar
templates/pdf.html        — ORPHANED (renderas inte av någon route)
static/script.js          — DE CHECKADE bundle (esbuild-produkten); INTE källan
src/js/...                — käll-JS-moduler (stubs/naive esbuild-katalog)
data/articles.json        — artikelposter i DICT-format (inte lista) med
                            bullet-array
saved/                    — lagrade forstsidor (json-filer)
tools/bundle.py           — esbuild-wrapper
docs/PRD.md               — produktkrav
Tidningssimulator.py      — tom 0-byte fil (arv)
README.md                 — beskriver demo + weasyprint-PDF (utan att stämma)
```

## Flöden

1. `GET /` renderar UI. Användaren väljer artikel → drar till förstasidesgrid
   (gbgh). Anpassar titel/överskrift.
2. `POST /save` validerar och sparar som `saved/`-JSON.
3. `GET /list-saved` visar sparade nummer. "Skriv ut" = client-print.

## Köra / deploya

```bash
pip install -r requirements.txt
python app.py        # sommart. (dev-server, lokalt)
```

### Live: Firebase (sedan okt 2026)

Live-adress: **https://tidningssimulator.web.app** (Firebase-projekt
`tidningssimulator`, gratisnivån Spark, inget betalkonto).

- `tools/bygg_firebase.py` renderar startsidan med samma Flask-app och mall
  till `public/index.html` och kopierar `static/` till `public/static/`. Enda
  skillnaden mot Flask-HTML:en är en extra rad som laddar
  `static/firebase-lagring.js`.
- `static/firebase-lagring.js` fångar gränssnittets `fetch('/save')` och
  `fetch('/list-saved')` och skickar dem till Firestore (samling `sparade`) via
  REST. Svaren har exakt samma form som Flask-serverns, så `script.js` och
  mallen är oförändrade. Filnamnen får svensk tid.
- `firestore.rules`: alla får läsa och skapa, ingen kan ändra eller ta bort.
  Samma platsnycklar som `ALLOWED_SLOTS` i app.py.
- Deploy: sker automatiskt vid push till main (`.github/workflows/firebase.yml`).
  GitHub loggar in utan nyckel via Workload Identity Federation (pool `github`,
  konto `github-deploy@tidningssimulator.iam.gserviceaccount.com`, bara för det här
  repot). För hand går det också: `firebase deploy` (bygget körs som predeploy och
  kräver Flask, `pip install -r requirements.txt`).
- Ändrar du `app.py` (`/save`, `/list-saved`) eller `ALLOWED_SLOTS`: ändra
  `static/firebase-lagring.js` och `firestore.rules` på samma sätt.
- `public/` är byggresultat och ligger i .gitignore.

### Tidigare: Cloud Run

Docker (python:3.11-slim) → Cloud Run, tjänst `tidningssimulator`, region
`europe-west1`. Gick ner när projektets betalkonto stängdes (Cloud Run kräver
betalkonto). Tjänsten finns kvar i projektet men svarar 503. `Dockerfile` finns
kvar för den som vill köra i Docker.

## Sidopanelen och platshållarna

- Artiklarna i `articles` ligger i gruppen "Nyheter" som fälls ut på plats
  (`static/sidopanel.js`), uppdelad i underteman efter område (category).
  Temapaketen under strecket öppnas i egen vy som förut.
- Platshållartexterna ("Dra en … hit") har samma typsnitt, storlek och stil som
  texten som hamnar där, i grått (sist i style.css). Huvudnyhetens platshållare
  ligger som rubrikplattan på bilden.

## Tidningsväljaren och sidhuvudet

- `static/tidningar.js`: listan över tidningar (Gota Medias dagstidningar enligt
  Mediestudier). Fält: namn, undertitel, farg, webb, pris, bild.
- `static/tidningshuvud.js`: väljaren (överst i sidopanelen) och sidhuvudet. Med
  `bild` visas bilden (BLT). Annars ritas ett övningshuvud: namnet i Anton
  (`static/fonts/anton/`, OFL) i tidningens färg, uppställt som BLT-huvudet med
  dagens datum och vecka. Mått i cqw, så det skalar i miniatyrerna och vid utskrift.
- Valet sparas i webbläsaren (localStorage) och följer med när framsidan sparas
  (`tidning` i JSON/Firestore). Adminvyn ritar huvudet för den sparade tidningen.
- Färger: bara BLT har färg (#37519a, tagen ur header.png). Övriga är mörkgrå tills
  färgen fylls i.

## Rubriker i nedre raden (artikel och notiser)

`anpassaNedreRubriker()` i `static/script.js` (ui.js-delen) sätter storlek och
avstavning för rubrikerna i `mellan1`, `liten1` och `liten2`, även i
adminvyns miniatyrer:

- Ord bryts aldrig utan bindestreck (CSS: `hyphens: manual`, `overflow-wrap: normal`).
- Största storlek upp till grundstorleken i style.css. Krymper först (artikel till
  80 %, notis till 90 %), avstavar sedan i sammansättningsfogar, sist mellan stavelser.
- Avstavningen står i `AVSTAVNING` för orden i artiklarna. Andra ord (t.ex. i
  redigeringsläget) avstavas med `static/vendor/hyphen-sv.min.js` (hyphen, ISC).
  Lägg till nya långa ord i `AVSTAVNING` när artiklarna ändras.
- Siffror med streck (15-18) bryts aldrig. De två notiserna får samma storlek.
- Resultatet sparas per rubrik så att MutationObservern inte hamnar i en slinga.

## Gotchas (verifierat mot kod)

- **Motsägande build-system**: `static/script.js` är en incheckad esbuild-bundle
  medan `src/js/*` finns som separat källkod. Att bara köra `esbuild` på nytt
  från src skulle skriva över de CHECKADE bra bitar som faktiskt kör (src är
  stubbar). Bygg inte om "naivt".
- `data/articles.json`-formatet är en dict; byt inte till lista utan att
  uppdatera `app.py`.
- `Tidningssimulator.py` är tom; `templates/pdf.html` är orphan.

## Notis

Appen är ett verktygspedagogiskt projekt, inte en publicerad tidning.