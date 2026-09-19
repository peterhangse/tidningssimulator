# CONTEXT.md — tidningssimulator (BLT Framsidebyggare)

**Skolvegg-verktyg för att bygga en tidning förstasida.** Bläddra artiklar,
dra & drop dem på en A4-startsida, spara och skriv ut. Svenskt UI
(Hej! Välkommen — bygg din egen firstäsida för BLT). Projektet avser
tidningslärar-versionen, **inte** BLT:s riktiga system.

## Teknik (verifierat)

- **Flask 3.0.2 + Jinja2**, `flask-limiter` (rate limiting) och **WeasyPrint
  INDEKLARERAD i requirements men OANVÄND i `app.py`** (svaret genereras
  klientsidan och skrivs ut via webbläsarens print).
- Frontend är en enda beskriven page; JS byggs med **esbuild +
  `tools/bundle.py`** men den resulterande `static/script.js` (934 r) är
  INCHECKAD i repot — en copy av källan.
- **En server behövs** (Flask) — `.fabrik`-raden säger `python3 -m http.server
  8000` är FEL för den här (statisk server ger inga /save-route:er).

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

Deploy tänkt: Docker (python:3.11-slim) → Cloud Run port 8080. READMEs live-
URL `https://tidningssimulator-558290029493.europe-west1.run.app/` verkar nere
(HTTP 500).

## Gotchas (verifierat mot kod)

- **Motsägande build-system**: `static/script.js` är en incheckad esbuild-bundle
  medan `src/js/*` finns som separat källkod. Att bara köra `esbuild` på nytt
  från src skulle skriva över de CHECKADE bra bitar som faktiskt kör (src är
  stubbar). Bygg inte om "naivt".
- WeasyPrint i requirements men ingen kod använder det — onödigt krav.
- README-demo-länken är död (service nere).
- `data/articles.json`-formatet är en dict; byt inte till lista utan att
  uppdatera `app.py`.
- `Tidningssimulator.py` är tom; `templates/pdf.html` är orphan.

## Notis

Appen är ett verktygspedagogiskt projekt, inte en publicerad tidning.