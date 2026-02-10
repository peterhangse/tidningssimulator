import { truncateText, usedArticles, CHAR_LIMITS } from './state.js';

// Exported UI helpers
export function initUI() {
  try {
    window.__kk_cached = window.__kk_cached || {};
    window.__kk_cached.newspaper = document.querySelector('.newspaper');
    window.__kk_cached.mastheadImg = document.querySelector('.masthead-image');
  } catch (_){ /* ignore DOM access errors in non-browser contexts */ }
}

export function adjustTextFit() {
  const elements = document.querySelectorAll('.slot .slot-content h3, .slot .slot-content .subheadline, .slot .slot-content .citat-text, .slot .slot-content .citat-sender, .slot .slot-content .article-page, .slot .slot-content .huvudnyhet-page, .slot .slot-content .texttopp-page, .puff-headline, .puff-page, .puff-category');

  for (const element of elements) {
    // Do not auto-fit elements that the user has explicitly resized
    if (element.dataset && element.dataset.userSize === 'true') continue;
    element.style.whiteSpace = 'normal';
    element.style.hyphens = 'none';
    element.style.wordBreak = 'normal';
    element.style.fontSize = '';
    element.style.lineHeight = '';

    let container = element.closest('.slot-content') || element.parentElement;
    if (!container) container = element.parentElement;

    const maxIterations = 40;
    const minSizePx = 11;
    let style = window.getComputedStyle(element);
    let fontSize = Number.parseFloat(style.fontSize) || 16;
    let iter = 0;

    while ((element.scrollHeight > container.clientHeight || element.scrollWidth > container.clientWidth) && iter < maxIterations && fontSize > minSizePx) {
      fontSize = Math.max(minSizePx, fontSize * 0.94);
      element.style.fontSize = fontSize + 'px';
      element.style.lineHeight = Math.max(1.02, Math.min(1.2, (fontSize / (Number.parseFloat(style.fontSize) || fontSize)))) + '';
      iter++;
    }
  }
}

export function addFontSizeControls(container) {
  const increaseButton = container.querySelector('.font-size-btn.increase');
  const decreaseButton = container.querySelector('.font-size-btn.decrease');
  // Support both headline (h3) and citat text (blockquote)
  const headline = container.querySelector('h3') || container.querySelector('.citat-text');
  if (!headline || (!increaseButton && !decreaseButton)) return;
  const computedStyle = window.getComputedStyle(headline);
  let currentSize = Number.parseFloat(computedStyle.fontSize);
  // Determine type for limits
  const isNotis = !!headline.closest('.notis-large-headline') || !!container.closest('.notis-large-headline');
  const isCitat = !!headline.closest('.citat-display') || headline.classList.contains('citat-text');
  const NOTIS_MAX = 14; // px
  const NOTIS_MIN = 10; // px
  const CITAT_MAX = 20; // px
  const CITAT_MIN = 10; // px

  if (increaseButton) {
    increaseButton.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const max = isNotis ? NOTIS_MAX : (isCitat ? CITAT_MAX : 999);
      if (currentSize < max) {
        currentSize += 1;
        headline.style.fontSize = currentSize + 'px';
        headline.dataset.userSize = 'true';
      }
    });
  }
  if (decreaseButton) {
    decreaseButton.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const min = isNotis ? NOTIS_MIN : (isCitat ? CITAT_MIN : 10);
      if (currentSize > min) {
        currentSize -= 1;
        headline.style.fontSize = currentSize + 'px';
        headline.dataset.userSize = 'true';
      }
    });
  }
}

export function updatePostits() {
  const postits = document.querySelectorAll('.postit');
  for (const p of postits) {
    const target = p.dataset.target;
    if (!target) continue;
    const slots = target.split(',').map(s => s.trim()).filter(Boolean);
    let allFilled = true;
    for (const slotName of slots) {
      const element = document.querySelector(`[data-slot="${slotName}"]`);
      if (!element || !element.dataset.articleId) allFilled = false;
    }
    if (allFilled) p.classList.add('hidden'); else p.classList.remove('hidden');
  }
}

export function makeSlotEditable(slot) {
  if (!document.body.classList.contains('edit-mode')) return;
  setTimeout(() => {
    if (slot.classList.contains('puff-strip')) {
      const headline = slot.querySelector('.puff-headline');
      const category = slot.querySelector('.puff-category');
      if (headline) { headline.contentEditable = 'true'; headline.classList.add('editable'); }
      if (category) { category.contentEditable = 'true'; category.classList.add('editable'); }
    } else {
      for (const element of slot.querySelectorAll('h3, .subheadline, .headline-overlay h3, .citat-text, .citat-sender, .texttopp-page')) {
        element.contentEditable = 'true'; element.classList.add('editable');
      }
    }
  }, 50);
}

export function makeAllSlotsEditable() {
  for (const element of document.querySelectorAll('.puff-strip.has-article .puff-headline')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.puff-strip.has-article .puff-category')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .article-display h3')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .article-display .subheadline')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .headline-overlay h3')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .citat-text')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .citat-sender')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.texttopp.has-article .texttopp-page')) { element.contentEditable = 'true'; element.classList.add('editable'); }
}

export function enableEditMode() {
  document.body.classList.add('edit-mode');
  makeAllSlotsEditable();
  const indicator = document.createElement('div');
  indicator.id = 'editModeIndicator';
  indicator.textContent = '✏️ Redigeringsläge aktivt - klicka på text för att redigera';
  document.body.append(indicator);
}
