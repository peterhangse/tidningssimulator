# Tidningssimulator

Interactive newspaper front-page builder designed for school workshops. Originally built for Swedish newspaper BLT. Students drag and drop articles into layout slots to compose a newspaper front page, then export it as a PDF.

## Live Demo
[→ Open Tidningssimulator](https://tidningssimulator-558290029493.europe-west1.run.app/)

## Features
- Drag-and-drop article placement on a newspaper grid
- Articles loaded from JSON data
- PDF export via WeasyPrint
- Saved layouts stored as JSON
- Rate limiting for classroom use

## Tech Stack
- Python 3.10+ / Flask
- WeasyPrint (PDF generation)
- Jinja2 templates / vanilla JavaScript
- Docker / Google Cloud Run

## Running Locally
```bash
pip install -r requirements.txt
python app.py
```
Open `http://localhost:5000` in your browser.

## Deployment
Dockerized and deployed to Google Cloud Run. See `Dockerfile` for config.

See `docs/PRD.md` for full product overview and technical details.
