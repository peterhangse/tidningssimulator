/*
 * Sidopanelen: gruppen Nyheter fälls ut och in på plats.
 * Temapaketen under strecket fungerar som förut (öppnas i en egen vy).
 */
(function () {
  'use strict';

  function start() {
    const knapp = document.getElementById('nyhetsgruppKnapp');
    const lista = document.getElementById('nyhetsgruppLista');
    const grupp = document.getElementById('nyhetsgrupp');
    if (!knapp || !lista || !grupp) return;

    const satt = (oppen) => {
      lista.hidden = !oppen;
      knapp.setAttribute('aria-expanded', String(oppen));
      grupp.classList.toggle('oppen', oppen);
    };

    knapp.addEventListener('click', () => satt(lista.hidden));
    satt(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
