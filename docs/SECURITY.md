# Säkerhetsanalys – Tidningssimulator

## Vanliga säkerhetsbrister (OWASP Top 10)

| # | Sårbarhet | Risk | Status i denna app |
|---|-----------|------|-------------------|
| 1 | **Injection (SQL/NoSQL/Command)** | Kritisk | ✅ EJ AKTUELLT – Ingen databas, ingen exec() |
| 2 | **Broken Authentication** | Hög | ✅ EJ AKTUELLT – Ingen autentisering |
| 3 | **Sensitive Data Exposure** | Hög | ✅ EJ AKTUELLT – Ingen känslig data |
| 4 | **XML External Entities (XXE)** | Medel | ✅ EJ AKTUELLT – Ingen XML-parsing |
| 5 | **Broken Access Control** | Hög | ⚠️ DELVIS – Se nedan |
| 6 | **Security Misconfiguration** | Medel | ⚠️ DELVIS – Debug mode |
| 7 | **Cross-Site Scripting (XSS)** | Hög | ✅ SKYDDAD – Jinja2 auto-escape |
| 8 | **Insecure Deserialization** | Kritisk | ✅ EJ AKTUELLT – Använder json.load, inte pickle |
| 9 | **Using Components with Known Vulnerabilities** | Medel | ✅ OK – Moderna versioner |
| 10 | **Insufficient Logging & Monitoring** | Medel | ⚠️ SAKNAS – Ingen loggning |

---

## Detaljerad analys

### ✅ SÄKERT: XSS (Cross-Site Scripting)

**Var:** `templates/index.html`, `templates/pdf.html`

**Status:** Jinja2 har automatisk HTML-escape aktiverat som standard.

```html
{{ article.headline }}  <!-- Auto-escaped -->
```

**Undantag att bevaka:**
```javascript
// script.js rad 104-109 - innerHTML används
content.innerHTML = `
    <div class="article-display">
        <h3>${article.headline}</h3>
        ...
    </div>
`;
```

⚠️ **Potentiell risk:** Om artikeldata kommer från användare (inte JSON-fil) kan detta vara en XSS-vektor. 

**Nuvarande status:** Artiklar laddas från `articles.json` som kontrolleras av utvecklare → **SÄKERT**

**Rekommendation för framtiden:** Om artiklar ska kunna matas in av användare, sanitera i backend eller använd `textContent` istället för `innerHTML`.

---

### ⚠️ UPPMÄRKSAMMA: Path Traversal

**Var:** `app.py` rad 72-77

```python
group_name = data.get("groupName", "unknown").strip().replace(" ", "_")
filename = f"{group_name}_{timestamp}.json"
filepath = os.path.join(SAVED_DIR, filename)
```

**Risk:** En illvillig användare kan skicka `groupName: "../../../etc/passwd"` för att försöka skriva utanför `saved/`-mappen.

**Nuvarande skydd:** 
- `os.path.join()` hanterar INTE path traversal automatiskt
- Endast `" "` → `"_"` ersättning görs

**Sannolikhet:** Låg (lokalt nätverk, skolmiljö)

**Rekommenderad fix:**
```python
import re
group_name = re.sub(r'[^a-zA-Z0-9åäöÅÄÖ_-]', '', data.get("groupName", "unknown"))
```

---

### ⚠️ UPPMÄRKSAMMA: Debug Mode i Produktion

**Var:** `app.py` rad 138

```python
app.run(debug=True, host="0.0.0.0", port=5000)
```

**Risk:** Debug-läge exponerar:
- Stack traces till användare
- Interaktiv debugger (kan köra godtycklig kod om PIN gissas)

**Rekommenderad fix för produktion:**
```python
import os
debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
app.run(debug=debug_mode, host="0.0.0.0", port=5000)
```

---

### ✅ SÄKERT: CSRF (Cross-Site Request Forgery)

**Status:** Tekniskt möjligt men låg risk.

**Varför låg risk:**
1. Endast POST-requests till `/save` och `/pdf`
2. Ingen autentisering = ingen session att kapa
3. Lokalt nätverk = begränsad attack-yta

**Rekommendation:** Om appen deployar till internet, lägg till Flask-WTF CSRF-token.

---

### ✅ SÄKERT: Injection

**Status:** Ingen risk.

- Ingen SQL-databas
- Ingen `eval()`, `exec()`, `subprocess` med användarinput
- JSON-parsing med `json.load()` (säkert, till skillnad från `pickle`)

---

### ⚠️ SAKNAS: Rate Limiting

**Risk:** En angripare kan:
1. Spamma `/save` och fylla disk
2. Spamma `/pdf` och överbelasta server

**Rekommenderad fix:**
```python
from flask_limiter import Limiter
limiter = Limiter(app, default_limits=["100 per hour"])

@app.route("/save", methods=["POST"])
@limiter.limit("10 per minute")
def save_frontpage():
    ...
```

---

## Sammanfattning

| Kategori | Status |
|----------|--------|
| **Kritiska sårbarheter** | 0 |
| **Medel-risker** | 2 (Path Traversal, Debug Mode) |
| **Låg-risker** | 2 (Rate Limiting, Logging) |
| **Totalt säker för lokalt bruk** | ✅ JA |
| **Redo för internet-deploy** | ⚠️ Behöver fixes |

---

## Rekommenderade åtgärder innan internet-deploy

1. [ ] Sanitera `groupName` mot path traversal
2. [ ] Stäng av debug mode (eller gör miljövariabel)
3. [ ] Lägg till rate limiting
4. [ ] Lägg till request logging
5. [ ] Lägg till CSRF-skydd om autentisering införs
