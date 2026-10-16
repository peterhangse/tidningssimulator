"""
Bygger Firebase-versionen av Tidningssimulatorn i mappen public/.

Startsidan renderas med samma Flask-app och mall som annars (app.py och
templates/index.html), så HTML:en blir exakt den som servern skickar. Det enda
som läggs till är static/firebase-lagring.js, som skickar sparandet till Firestore
i stället för till Flask.

Körs automatiskt av `firebase deploy` (se predeploy i firebase.json), eller för hand:

    python3 tools/bygg_firebase.py
"""

import os
import shutil
import sys

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UT = os.path.join(ROT, "public")
SKRIPT = '<script src="/static/script.js'
LAGRING = '<script src="/static/firebase-lagring.js"></script>\n    '

sys.path.insert(0, ROT)
from app import app  # noqa: E402


def main():
    svar = app.test_client().get("/")
    if svar.status_code != 200:
        sys.exit(f"Startsidan gav {svar.status_code}")
    html = svar.get_data(as_text=True)

    if html.count(SKRIPT) != 1:
        sys.exit("Hittar inte script.js i startsidan, mallen har ändrats")
    html = html.replace(SKRIPT, LAGRING + SKRIPT)

    if os.path.isdir(UT):
        shutil.rmtree(UT)
    shutil.copytree(os.path.join(ROT, "static"), os.path.join(UT, "static"))
    with open(os.path.join(UT, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Byggt: {os.path.relpath(UT, ROT)}/index.html och static/")


if __name__ == "__main__":
    main()
