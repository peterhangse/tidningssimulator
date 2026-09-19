# AGENTS.md — tidningssimulator

**Läs `CONTEXT.md` först** innan du ändrar något.

## Kontrakt

- Ändrar du routes, build-flöden eller data-format: **uppdatera `CONTEXT.md`
  i samma commit**.
- **Körbar = Flask**: `python app.py`. Rör INTE `.fabrik`/http.server-antagandet.
- **`static/script.js` är den incheckade esbuild-bundlen som faktiskt kör** —
  `src/js/*` är käll-stubbar. Bygg aldrig om på måfå; ändra bundlen varsamt
  eller medvetet via `tools/bundle.py`.
- `data/articles.json` är ett dict-format — spara inte ner det som ren lista
  utan att ändra `app.py`.
- Inga automatiska tester: verifiera manuellt (bygge → save → list-saved →
  print).