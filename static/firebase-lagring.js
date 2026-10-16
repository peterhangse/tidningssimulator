/*
 * Firebase-lagring för Tidningssimulatorn
 *
 * På Firebase Hosting finns ingen Flask-server. Den här filen tar därför över de två
 * anrop som gränssnittet gör mot servern och skickar dem till Firestore i stället:
 *
 *   POST /save        sparar en förstasida            (app.py: save_frontpage)
 *   GET  /list-saved  listar sparade förstasidor      (app.py: list_saved)
 *
 * Svaren har exakt samma form som Flask-serverns, så static/script.js och
 * templates/index.html fungerar utan ändringar. Filen laddas bara i Firebase-bygget
 * (tools/bygg_firebase.py). Kör man `python app.py` används Flask som vanligt.
 */
(function () {
  'use strict';

  const PROJEKT = 'tidningssimulator';
  // Webbnyckeln för Firebase är publik och identifierar bara projektet.
  // Vad som får läsas och skrivas styrs av firestore.rules.
  const NYCKEL = 'AIzaSyAfrDPS3vqJtRNT777wUU3gTu-L6t_8jgk';
  const SAMLING = 'sparade';
  const BAS = `https://firestore.googleapis.com/v1/projects/${PROJEKT}/databases/(default)/documents`;

  // Samma som ALLOWED_SLOTS i app.py
  const TILLATNA_PLATSER = new Set([
    'puff1', 'puff2', 'puff3', 'texttopp', 'huvudnyhet',
    'mellan1', 'citat', 'liten1', 'liten2',
  ]);

  const vanligFetch = window.fetch.bind(window);

  // Samma som sanitize_filename i app.py
  function saneraFilnamn(namn) {
    const s = String(namn).replace(/[^a-zA-Z0-9åäöÅÄÖ_\-]/g, '');
    return s ? s.slice(0, 50) : 'unknown';
  }

  // Samma format som datetime.now().strftime("%Y%m%d_%H%M%S"), i svensk tid
  function tidsstampel(datum) {
    const delar = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Stockholm',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(datum);
    const del = (typ) => delar.find((d) => d.type === typ).value;
    return `${del('year')}${del('month')}${del('day')}_${del('hour')}${del('minute')}${del('second')}`;
  }

  // JSON <-> Firestores värdeformat
  function tillFirestore(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') {
      return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    }
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(tillFirestore) } };
    const fields = {};
    for (const [k, val] of Object.entries(v)) fields[k] = tillFirestore(val);
    return { mapValue: { fields } };
  }

  function franFirestore(v) {
    if (!v || 'nullValue' in v) return null;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('stringValue' in v) return v.stringValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(franFirestore);
    if ('mapValue' in v) {
      const ut = {};
      for (const [k, val] of Object.entries(v.mapValue.fields || {})) ut[k] = franFirestore(val);
      return ut;
    }
    return null;
  }

  function jsonSvar(objekt, status) {
    return new Response(JSON.stringify(objekt), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async function spara(init) {
    const data = JSON.parse((init && init.body) || '{}') || {};

    // Samma kontroller som app.py
    const slots = data.slots === undefined ? {} : data.slots;
    if (slots === null || typeof slots !== 'object' || Array.isArray(slots)) {
      return jsonSvar({ error: 'Invalid slots format' }, 400);
    }
    if (!Object.keys(slots).every((k) => TILLATNA_PLATSER.has(k))) {
      return jsonSvar({ error: 'Invalid slot key' }, 400);
    }

    const gruppnamn = data.groupName === undefined ? 'unknown' : data.groupName;
    const filnamn = `${saneraFilnamn(gruppnamn)}_${tidsstampel(new Date())}.json`;

    const dokument = {
      fields: {
        filnamn: tillFirestore(filnamn),
        mtime: { doubleValue: Date.now() / 1000 },
        innehall: tillFirestore(data),
      },
    };

    const svar = await vanligFetch(`${BAS}/${SAMLING}?key=${NYCKEL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dokument),
    });
    if (!svar.ok) throw new Error(`Firestore svarade ${svar.status}`);

    return jsonSvar({ success: true, filename: filnamn });
  }

  async function listaSparade() {
    const fraga = {
      structuredQuery: {
        from: [{ collectionId: SAMLING }],
        orderBy: [{ field: { fieldPath: 'mtime' }, direction: 'DESCENDING' }],
      },
    };
    const svar = await vanligFetch(`${BAS}:runQuery?key=${NYCKEL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fraga),
    });
    if (!svar.ok) throw new Error(`Firestore svarade ${svar.status}`);
    const rader = await svar.json();

    // Samma form som list_saved i app.py, nyaste först
    const filer = rader
      .filter((r) => r.document)
      .map((r) => {
        const f = r.document.fields || {};
        const innehall = franFirestore(f.innehall) || {};
        return {
          filename: franFirestore(f.filnamn),
          groupName: 'groupName' in innehall ? innehall.groupName : 'Okänd',
          mtime: franFirestore(f.mtime) || 0,
          slots: 'slots' in innehall ? innehall.slots : {},
        };
      });
    return jsonSvar(filer);
  }

  window.fetch = function (resurs, init) {
    const adress = typeof resurs === 'string' ? resurs : (resurs && resurs.url) || '';
    const url = new URL(adress, window.location.href);
    if (url.origin === window.location.origin) {
      const metod = ((init && init.method) || 'GET').toUpperCase();
      if (url.pathname === '/save' && metod === 'POST') return spara(init);
      if (url.pathname === '/list-saved' && metod === 'GET') return listaSparade();
    }
    return vanligFetch(resurs, init);
  };
})();
