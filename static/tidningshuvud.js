/*
 * Tidningsväljaren och sidhuvudet (tidningens namn överst på förstasidan).
 *
 * Tidningar med egen bild (bild i static/tidningar.js) visar bilden som förut.
 * Övriga får ett övningshuvud: tidningens namn i typsnittet Anton och i
 * tidningens huvudfärg, uppställt som BLT-huvudet med dagens datum till höger.
 *
 * Allt mäts i containerbredd (cqw), så huvudet ser likadant ut i stor storlek,
 * i miniatyrerna i adminvyn och vid utskrift.
 */
(function () {
  'use strict';

  const STANDARDFARG = '#2b2b2b';
  const MINNESNYCKEL = 'tidningssimulator.tidning';

  // Mått hämtade från BLT-huvudet (2715 x 513 px), i procent av bredden
  const MATT = {
    titelVanster: 3.1, // cqw
    titelBredd: 83.3, // cqw, tillgänglig bredd för namnet
    versalTopp: 5.43, // cqw från överkant till versalernas topp
    versalHojd: 0.859, // Antons versalhöjd i em
    nedstapel: 0.24, // hur långt g, j och p går under baslinjen, i em
    hojd: 18.9, // huvudets höjd i cqw (513/2715)
    titelStorlek: 10.75, // cqw, ger samma versalhöjd som BLT-huvudet
    minstaSkalaX: 0.82, // hur mycket namnet får tryckas ihop innan det krymper
    ascent: 0.9236, // Antons baslinje från radens överkant vid line-height 1
  };

  const VECKODAGAR = ['SÖNDAG', 'MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG', 'LÖRDAG'];
  const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

  function tidningar() {
    return Array.isArray(window.TIDNINGAR) ? window.TIDNINGAR : [];
  }

  function hitta(id) {
    const lista = tidningar();
    return lista.find((t) => t.id === id) || lista[0] || null;
  }

  function veckonummer(datum) {
    const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
    const dag = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dag);
    const arStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - arStart) / 86400000 + 1) / 7);
  }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Bredd på namnet vid 100px, mätt med Anton när typsnittet laddats
  let matare = null;
  const breddMinne = new Map();
  function namnBredd100(namn) {
    if (breddMinne.has(namn)) return breddMinne.get(namn);
    if (!matare) matare = document.createElement('canvas').getContext('2d');
    matare.font = '100px Anton, "Arial Narrow", sans-serif';
    const b = matare.measureText(namn).width;
    if (document.fonts && document.fonts.check && document.fonts.check('100px Anton')) breddMinne.set(namn, b);
    return b;
  }

  // Storlek (cqw) och hoptryckning för namnet så att det fyller sin bredd som BLT-huvudet
  function titelMatt(namn, harUndertitel) {
    const b100 = namnBredd100(namn); // px vid font-size 100px
    // Bredd vid full storlek, uttryckt i cqw: b100/100 * storlek
    // Med undertitel får namnet vara lite lägre så att g och j inte går ner i den
    let storlek = harUndertitel ? Math.min(MATT.titelStorlek, 9.9) : MATT.titelStorlek;
    let skalaX = 1;
    const breddFull = (b100 / 100) * storlek;
    if (breddFull > MATT.titelBredd) {
      skalaX = Math.max(MATT.minstaSkalaX, MATT.titelBredd / breddFull);
      if (breddFull * skalaX > MATT.titelBredd) storlek = Math.min(storlek, (MATT.titelBredd / (b100 / 100)) / skalaX);
    }
    return { storlek, skalaX };
  }

  function idag() {
    const d = new Date();
    return { veckodag: VECKODAGAR[d.getDay()], datum: `${d.getDate()} ${MANADER[d.getMonth()]} ${d.getFullYear()}`, vecka: `Vecka ${veckonummer(d)}` };
  }

  // HTML för ett sidhuvud. Används både i byggaren och i adminvyn.
  function html(id) {
    const t = hitta(id);
    if (!t) return '';
    if (t.bild) {
      return `<img class="masthead-image" src="/static/${esc(t.bild)}" alt="${esc(t.namn)}">`;
    }
    const m = titelMatt(t.namn, !!t.undertitel);
    const d = idag();
    const farg = t.farg || STANDARDFARG;
    const topp = MATT.versalTopp - (MATT.ascent - MATT.versalHojd) * m.storlek;
    const baslinje = MATT.versalTopp + MATT.versalHojd * m.storlek;
    const underTopp = Math.min(baslinje + MATT.nedstapel * m.storlek + 0.15, MATT.hojd - 2.3);
    return `<div class="tidningshuvud" data-tidning="${esc(t.id)}" style="--huvudfarg:${esc(farg)}">
      <div class="th-titel" style="font-size:${m.storlek.toFixed(3)}cqw;top:${topp.toFixed(3)}cqw;transform:scaleX(${m.skalaX.toFixed(4)})">${esc(t.namn)}</div>
      ${t.undertitel ? `<div class="th-undertitel" style="top:${underTopp.toFixed(3)}cqw">${esc(t.undertitel)}</div>` : ''}
      <div class="th-datum">
        <div class="th-veckodag">${esc(d.veckodag)}</div>
        <div class="th-dag">${esc(d.datum)}</div>
        <div class="th-vecka">${esc(d.vecka)}</div>
        ${t.webb ? `<div class="th-webb">${esc(t.webb)}</div>` : ''}
        ${t.pris ? `<div class="th-pris">${esc(t.pris)}</div>` : ''}
      </div>
    </div>`;
  }

  let vald = null;
  try { vald = window.localStorage.getItem(MINNESNYCKEL); } catch (_) { /* privat läge */ }
  if (!hitta(vald) || hitta(vald).id !== vald) vald = (tidningar()[0] || {}).id || null;

  function rita() {
    const masthead = document.querySelector('.newspaper-scale-wrapper .newspaper .masthead');
    if (masthead) masthead.innerHTML = html(vald);
    const lista = document.getElementById('tidningVal');
    if (lista && lista.value !== vald) lista.value = vald;
    window.valdTidning = vald;
  }

  function valj(id) {
    vald = hitta(id) ? hitta(id).id : vald;
    try { window.localStorage.setItem(MINNESNYCKEL, vald); } catch (_) { /* ignorera */ }
    rita();
  }

  function byggValjare() {
    const panel = document.querySelector('.newspaper-side-panel');
    if (!panel || document.getElementById('tidningVal')) return;
    const ruta = document.createElement('div');
    ruta.className = 'tidning-valjare';
    const etikett = document.createElement('label');
    etikett.htmlFor = 'tidningVal';
    etikett.textContent = 'Tidning';
    const lista = document.createElement('select');
    lista.id = 'tidningVal';
    for (const t of tidningar()) {
      const alt = document.createElement('option');
      alt.value = t.id;
      alt.textContent = t.namn;
      lista.append(alt);
    }
    lista.addEventListener('change', () => valj(lista.value));
    ruta.append(etikett, lista);
    panel.prepend(ruta);
  }

  // Ritar om när Anton har laddats, så att namnen mäts med rätt typsnitt
  function nar(typsnittKlart) {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('100px Anton').then(typsnittKlart, typsnittKlart);
    }
  }

  window.Tidningshuvud = { html, valj, hitta, get vald() { return vald; } };
  window.valdTidning = vald;

  function start() {
    byggValjare();
    rita();
    nar(() => { breddMinne.clear(); rita(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
