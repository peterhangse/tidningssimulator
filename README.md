# Tidningssimulator

Interactive newspaper front-page builder designed for school workshops. Originally built for Swedish newspaper BLT. Students drag and drop articles into layout slots to compose a newspaper front page, then print it or save it as a PDF.

## Live Demo
[→ Open Tidningssimulator](https://tidningssimulator.web.app)

## Features
- Drag-and-drop article placement on a newspaper grid
- Articles loaded from JSON data
- Print or save as PDF from the browser
- Saved layouts stored as JSON (locally) or in Firestore (on Firebase)
- Rate limiting for classroom use (Flask version)

## Tech Stack
- Python 3.10+ / Flask
- Jinja2 templates / vanilla JavaScript
- Firebase Hosting + Firestore (live), Docker (optional)

## Running Locally
```bash
pip install -r requirements.txt
python app.py
```
Open `http://localhost:5000` in your browser.

## Deployment
Live on Firebase Hosting with Firestore for saved front pages:

```bash
pip install -r requirements.txt   # the build step renders the page with Flask
firebase deploy                   # runs tools/bygg_firebase.py first
```

See `CONTEXT.md` for how the Firebase version works.

See `docs/PRD.md` for full product overview and technical details.
