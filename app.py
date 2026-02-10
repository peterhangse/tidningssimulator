"""
Tidningssimulator - BLT Framsidebyggare
Flask-app för skolworkshop där elever bygger en tidningsframsida.

# PRD: docs/PRD.md — läs detta dokument först för produktöversikt och teknisk snabbguide
"""

import json
import os
import re
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)

# Rate limiting - tillåter 100 användare samtidigt
# 200 requests/minut per IP (räcker för normal användning)
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per minute", "1000 per hour"],
    storage_uri="memory://"
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SAVED_DIR = os.path.join(BASE_DIR, "saved")
os.makedirs(SAVED_DIR, exist_ok=True)

# Tillåtna slot-nycklar (för input-validering)
ALLOWED_SLOTS = {"puff1", "puff2", "puff3", "texttopp", "huvudnyhet", "mellan1", "citat", "liten1", "liten2"}

# Allowed article categories (only these will be used/displayed)
ALLOWED_CATEGORIES = {
    "NÖJE",
    "ÅSIKT",
    "KARLSHAMN",
    "RONNEBY",
    "SÖLVESBORG",
    "KARLSKRONA",
    "OLOFSTRÖM",
    "REGION",
    "NÄRINGSLIV",
    "SPORT",
}


def load_articles():
    """Load articles and packages from JSON file."""
    path = os.path.join(DATA_DIR, "articles.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Handle both old format (list) and new format (dict with articles and packages)
    if isinstance(data, list):
        articles = data
        packages = []
    else:
        articles = data.get("articles", [])
        packages = data.get("packages", [])
    
    def infer_category(article: dict) -> str:
        """Infer a category from headline/subheadline/body using simple heuristics.

        Returns one of ALLOWED_CATEGORIES, defaulting to 'REGION'.
        """
        text_parts = [
            (article.get("headline") or ""),
            (article.get("subheadline") or ""),
            (article.get("body") or ""),
        ]
        text = "\n".join(text_parts).lower()

        # Town-specific matches (prefer exact town mentions)
        town_map = {
            "karlshamn": "KARLSHAMN",
            "karlskrona": "KARLSKRONA",
            "ronneby": "RONNEBY",
            "sölvesborg": "SÖLVESBORG",
            "solvesborg": "SÖLVESBORG",
            "olofström": "OLOFSTRÖM",
            "olofstrom": "OLOFSTRÖM",
        }
        for k, v in town_map.items():
            if k in text:
                return v

        # Business / economy
        business_kw = ["företag", "näringsliv", "ekonomi", "investering", "arbets", "priser", "omsättning"]
        if any(w in text for w in business_kw):
            return "NÄRINGSLIV"

        # Opinion
        opinion_kw = ["åsikt", "debatt", "insändare", "tycker", "menar", "ledare", "åsikter"]
        if any(w in text for w in opinion_kw):
            return "ÅSIKT"

        # Entertainment / culture
        entertainment_kw = ["konsert", "teater", "kultur", "festival", "nöje", "premiär", "recension"]
        if any(w in text for w in entertainment_kw):
            return "NÖJE"

        # Sports often mention HK, IF, match, mål — try to map to town if possible
        sports_kw = ["match", "mål", "cupen", "serie", "hanlde", "hockey", "fotboll", "hk "]
        if any(w in text for w in sports_kw):
            # attempt to find a town in the text (e.g., team name includes town)
            for k, v in town_map.items():
                if k in text:
                    return v
            return "REGION"

        # If original category already matches an allowed one, keep it
        orig = (article.get("category") or "").strip().upper()
        if orig in ALLOWED_CATEGORIES:
            return orig

        # Fallback
        return "REGION"

    # Apply inference to each article and set normalized category
    for a in articles:
        a["category"] = infer_category(a)
    
    # Also apply inference to package articles
    for pkg in packages:
        for a in pkg.get("articles", []):
            a["category"] = infer_category(a)

    return articles, packages


# Date/week meta removed — no server-side date text is generated for the header


@app.route("/")
def index():
    """Main page with sidebar and frontpage builder."""
    articles, packages = load_articles()
    # No header meta (date/week) is generated — removed per user request
    # Compute a static file version key based on CSS mtime so browsers refetch when files change
    static_v = None
    try:
        css_path = os.path.join(BASE_DIR, "static", "style.css")
        js_path = os.path.join(BASE_DIR, "static", "script.js")
        css_mtime = int(os.path.getmtime(css_path)) if os.path.exists(css_path) else None
        js_mtime = int(os.path.getmtime(js_path)) if os.path.exists(js_path) else None
        # Use the newer of the two mtimes (so edits to either file force reload)
        mtimes = [t for t in (css_mtime, js_mtime) if t]
        static_v = str(max(mtimes)) if mtimes else str(int(datetime.utcnow().timestamp()))
    except Exception:
        static_v = str(int(datetime.utcnow().timestamp()))

    # Choose header image: prefer custom header.png, fallback to bundled blt_background.jpg
    header_img_path = os.path.join(BASE_DIR, "static", "images", "header.png")
    if os.path.exists(header_img_path):
        header_image = "images/header.png"
    else:
        header_image = "images/blt_background.jpg"

    return render_template(
        "index.html",
        articles=articles,
        packages=packages,
        static_v=static_v,
        header_image=header_image,
    )


def sanitize_filename(name: str) -> str:
    """Remove dangerous characters from filename to prevent path traversal."""
    # Only allow alphanumeric, Swedish chars, dash, underscore
    sanitized = re.sub(r'[^a-zA-Z0-9åäöÅÄÖ_\-]', '', name)
    return sanitized[:50] if sanitized else "unknown"  # Limit length


@app.route("/save", methods=["POST"])
@limiter.limit("30 per minute")  # Begränsa sparande per IP
def save_frontpage():
    """Save the frontpage configuration to a JSON file."""
    data = request.json
    
    # Validera slots-data
    slots = data.get("slots", {})
    if not isinstance(slots, dict):
        return jsonify({"error": "Invalid slots format"}), 400
    if not all(k in ALLOWED_SLOTS for k in slots.keys()):
        return jsonify({"error": "Invalid slot key"}), 400
    
    group_name = sanitize_filename(data.get("groupName", "unknown"))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_filename = f"{group_name}_{timestamp}.json"
    json_filepath = os.path.join(SAVED_DIR, json_filename)
    
    # Save JSON data
    with open(json_filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return jsonify({"success": True, "filename": json_filename})


@app.route("/list-saved")
def list_saved():
    """List all saved frontpages with slot data for rendering, sorted by date (newest first)."""
    files = []
    for f in os.listdir(SAVED_DIR):
        if f.endswith(".json"):
            filepath = os.path.join(SAVED_DIR, f)
            try:
                mtime = os.path.getmtime(filepath)
                with open(filepath, 'r', encoding='utf-8') as fp:
                    data = json.load(fp)
                    group_name = data.get("groupName", "Okänd")
                    slots = data.get("slots", {})
                files.append({
                    "filename": f,
                    "groupName": group_name,
                    "mtime": mtime,
                    "slots": slots
                })
            except (json.JSONDecodeError, IOError):
                files.append({"filename": f, "groupName": "Okänd", "mtime": 0, "slots": {}})
    # Sort by modification time, newest first
    files.sort(key=lambda x: x["mtime"], reverse=True)
    return jsonify(files)


@app.route("/get-saved/<filename>")
def get_saved(filename):
    """Get a specific saved frontpage."""
    # Sanitize filename to prevent directory traversal
    safe_filename = sanitize_filename(filename.replace(".json", "")) + ".json"
    filepath = os.path.join(SAVED_DIR, safe_filename)
    
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except (json.JSONDecodeError, IOError) as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    import os
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    
    print("=" * 50)
    print("🗞️  Tidningssimulator - BLT Framsidebyggare")
    print("=" * 50)
    print("Öppna i webbläsaren: http://localhost:5000")
    print("Dela denna länk med eleverna (om de är på samma nätverk)")
    if debug_mode:
        print("⚠️  Debug-läge aktiverat (FLASK_DEBUG=true)")
    print("=" * 50)
    app.run(debug=debug_mode, host="0.0.0.0", port=5000, threaded=True)
