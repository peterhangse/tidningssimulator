````markdown

# Tidningssimulator – PRD (Product Requirements Document)

---
## För AI-kodare: Teknisk snabböversikt

**Stack:**
- Python 3.10, Flask-backend (`app.py`)
- HTML/CSS/JS frontend (ingen ramverk, all logik i `static/script.js` och `templates/index.html`)
- Data: Artiklar i `data/articles.json`, sparade framsidor i `saved/*.json`
- Rate limiting via flask-limiter

**API-endpoints:**
- `GET /` – Renderar editorsidan (med artiklar, datum, vecka)
- `POST /save` – Sparar framsidekonfiguration (JSON) till `saved/`
- `GET /list-saved` – Returnerar lista på sparade framsidor

**Dataformat:**
- Artiklar: [{ id, headline, subheadline, body, quote, quoteSender, image, category, byline, page }]
- Spara: { groupName, slots: {puff1, puff2, ...}, timestamp }

**Frontend:**
- Drag-and-drop och UI i `static/script.js` (DOM-manipulation, ingen React/Vue)
- Layout och styling i `static/style.css` (pixel-exakt BLT-design, variabler i :root)
- HTML-mall i `templates/index.html` (Jinja2, auto-escape)

**Kodmönster:**
- Flask render_template för startsida, JSON för API
- All artikeldata och sparade framsidor är filbaserade (ingen databas)
- Ingen autentisering, ingen känslig data
- Spara-funktion validerar slot-nycklar och filnamn

**Säkerhet:**
- Ingen XSS-risk så länge artiklar bara kommer från `articles.json`
- Rate limiting på /save
- Ingen användarautentisering

**Starta lokalt:**
```bash
cd Tidningssimulator
python app.py
# Öppna http://localhost:5000
```

---

## Översikt

**Produktnamn:** Tidningssimulator / BLT Framsidebyggare  
**Version:** 1.0  
**Senast uppdaterad:** 2026-02-03

### Syfte
En interaktiv webbapp för skolworkshops där elever lär sig om tidningsjournalistik genom att bygga en framsida till Blekinge Läns Tidning (BLT). Eleverna väljer vilka artiklar som ska synas och var de placeras – precis som en riktig redaktör.

### Målgrupp
- Gymnasieelever (mediekurser)
- Grundskoleelever (samhällskunskap/svenska)
- Lärare som leder workshops

---

## Funktioner

### 1. Artikelväljare (Sidebar)
- **10 fördefinierade artiklar** med rubrik, underrubrik, brödtext och kategori
- **Drag-and-drop** – dra artikel från sidebar till en plats på framsidan
- **Dropdown-meny** – alternativt sätt att välja artikel per plats
- **Visuell feedback** – använda artiklar tonas ner

### 2. Framsidebyggare (Huvudvy)
Layout som efterliknar BLT:s riktiga framsida:

| Sektion | Beskrivning | Storlek |
|---------|-------------|---------|
| **3 Puffar** | Gula rutor överst till vänster | 1/3 bredd, staplad |
| **Huvudnyhet** | Stor artikel med bild | 2/3 bredd |
| **2 Mellanartiklar** | Under huvudnyheten | 1/3 bredd vardera |
| **2 Småartiklar** | Längst ner till höger | 1/6 bredd vardera |

**Totalt: 8 platser att fylla**

### 3. Spara & Exportera
- **Spara framsida** – sparar konfigurationen som JSON i `/saved/`
- **Skriv ut / Spara som PDF** – använder webbläsarens inbyggda print-funktion
- **Gruppnamn** – varje grupp anger sitt namn för att identifiera sin framsida
- **Teckengräns-validering** – visar varning när text överskrider max

---

## Grafisk Specifikation

### Canvas & Layout
| Egenskap | Värde |
|----------|-------|
| Canvas storlek | 1447 × 2048 px |
| Innehållsbredd | 907 px (62.68%) |
| Logotyp storlek | 792 × 103 px |
| Puff-band höjd | 129 px |
| Hero-bild höjd | 535 px |
| Mellanartikel bredd | 453 px |
| Småartikel bredd | 226 px |

---

## Teknisk arkitektur

### Stack
| Komponent | Teknologi |
|-----------|-----------|
| Backend | Flask (Python 3.10) |
| Frontend | Vanilla JavaScript + HTML/CSS |
| PDF-generering | Webbläsarens Print-funktion |
| Datalagring | JSON-filer |

### Filstruktur
```
Tidningssimulator/
├── app.py                 # Flask-server
├── requirements.txt       # Python-beroenden
├── data/
│   └── articles.json      # 10 artiklar
├── static/
│   ├── style.css          # BLT-styling
│   └── script.js          # Drag-drop + UI-logik
├── templates/
│   ├── index.html         # Huvudsida
│   └── pdf.html           # PDF-mall
├── saved/                 # Sparade framsidor (JSON)
└── docs/
    └── PRD.md             # Detta dokument
```

### API-endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | `/` | Huvudsida med editor |
| POST | `/save` | Spara framsidekonfiguration |
| GET | `/list-saved` | Lista sparade framsidor |

### Request/Response-format

**POST /save**
```json
{
  "groupName": "Grupp 1",
  "slots": {
    "puff1": "3",
    "puff2": "5",
    "huvudnyhet": "1",
    "mellan1": "2",
    "mellan2": "7",
    "liten1": "4",
    "liten2": "8"
  },
  "timestamp": "2026-02-03T14:30:00.000Z"
}
```

---

## Användargränssnitt

### Layout
```
┌─────────────────┬────────────────────────────────────────┐
│   SIDEBAR       │           TIDNING                      │
│                 │  ┌─────────────────────────────────┐   │
│  [Artikel 1]    │  │  BLT HEADER                     │   │
│  [Artikel 2]    │  ├────────┬────────────────────────┤   │
│  [Artikel 3]    │  │ PUFF 1 │                        │   │
│  ...            │  ├────────┤    HUVUDNYHET          │   │
│                 │  │ PUFF 2 │                        │   │
│                 │  ├────────┤                        │   │
│                 │  │ PUFF 3 │                        │   │
│                 │  ├────────┴────────┬───────┬───────┤   │
│  [Gruppnamn]    │  │ MELLAN 1│MELLAN 2│LITEN 1│LITEN 2│   │
│  [💾 Spara]     │  └─────────┴───────┴───────┴───────┘   │
│  [📄 PDF]       │                                        │
└─────────────────┴────────────────────────────────────────┘
```

### Färgpalett (BLT - Pixel-exakt)
| Användning | Hex |
|------------|-----|
| BLT-blå (logotyp) | `#025ECC` |
| Puff-gul | `#FBD644` |
| Vit (bakgrund) | `#FFFFFF` |
| Text svart | `#020202` |
| Sekundärgrå | `#666666` |
| Ram mörk | `#494238` |

### Teckengränser per slot
| Slot | Max tecken |
|------|-----------|
| Puff | 40 |
| Huvudnyhet rubrik | 70 |
| Huvudnyhet ingress | 120 |
| Mellanartikel rubrik | 45 |
| Mellanartikel ingress | 90 |
| Liten rubrik | 30 |
| Liten ingress | 60 |

---

## Krav för körning

### Minimikrav
- Python 3.8+
- Flask
- Modern webbläsare (Chrome, Firefox, Edge)

### Starta appen
```bash
cd Tidningssimulator
python app.py
# Öppna http://localhost:5000
```

### PDF-export
Använd webbläsarens inbyggda print-funktion (Cmd+P / Ctrl+P) och välj "Spara som PDF".

### Dela med elever (lokalt nätverk)
1. Hitta din IP: `ifconfig | grep "inet "`
2. Elever går till: `http://DIN_IP:5000`

---

## Framtida förbättringar

- [ ] Riktiga BLT-artiklar (RSS/API-integration)
- [ ] Bilduppladdning
- [ ] Lärarvy för att se alla gruppers framsidor
- [ ] Cloud-deploy (Google Cloud Run)
- [ ] Bildplatshållare med faktiska bilder
- [ ] Autentisering för lärare

---

## Säkerhetsnoteringar

Se separat säkerhetsanalys i detta dokument eller i koden.

## Senaste ändringar (2026-02-07)

- **Frontend (CSS):** Uppdaterade `static/style.css` för att åtgärda notis-överspill i `liten1`/`liten2`, göra bottom-row slots oberoende (ingen equal-height stretching), flytta `mellan1`-textkanten åt vänster, och låsa sidreferenser till nedre vänster. Justerade också hyphenation/word-break så rubriker bryts bättre.
- **Frontend (JS):** Uppdaterade `src/js/ui.js` så att användarjusterade fontstorlekar respekteras (`dataset.userSize`) och så att notis-fontstorlekar har rimliga gränser. En tidigare regress för drag-and-drop åtgärdades.
- **Data:** Rensade och skrev om `data/articles.json` så att rådata följer begränsningarna (rubriker ≤ 37 tecken, ingresser ≤ 122 tecken). Backups skapades som `data/articles.json.bak.*`. En manuell kortning av artikel id=5:s underrubrik genomfördes.

## Rekommendation: peka på PRD tidigt för snabbare onboarding

För att minska overhead vid varje ärende rekommenderas följande enkla repo-ändringar så att PRD automatiskt blir första stället att läsa:

- **Lägg till en länk till PRD i repo-root README.** På första raden i `README.md` skrivs en kort länk och sammanfattning: "Se `docs/PRD.md` för produktöversikt och teknisk snabbguide".
- **Lägg till en enkel pointer-fil `PRD_POINTER.md` i repo-roten** med en enda rad: `docs/PRD.md`.
- **Infoga en kort kommentar högst upp i `app.py`** med en länk till `docs/PRD.md` (en rad). Exempel: `# PRD: docs/PRD.md — läs innan du ändrar layout/slots`.
- **(Valfritt)** Lägg in ett litet hjälpskript `tools/print_prd.sh` som skriver ut sökvägen till PRD — praktiskt för automatiserade körningar.

Dessa förändringar är icke-invasiva och gör att nästa gång någon (eller en AI-assistent) öppnar repot så hittar PRD omedelbart.

## Nästa steg

- Vill du att jag också lägger till en länk i `README.md` och en kommentar i `app.py` nu?
- Vill du att jag genererar en kort diff (original → uppdaterad) för `data/articles.json` så du kan granska exakt vad som ändrats?

````