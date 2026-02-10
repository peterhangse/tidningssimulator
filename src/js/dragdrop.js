import { articles, usedArticles, CHAR_LIMITS, truncateText, clearChildren, capitalize } from './state.js';
import { addFontSizeControls, adjustTextFit, updatePostits, makeSlotEditable } from './ui.js';

export function initDragDrop() {
  try {
    console.log('[Tidningssimulator] initDragDrop start');
    const articleCards = document.querySelectorAll('.article-card');
    const slots = document.querySelectorAll('.slot');
    console.log('[Tidningssimulator] found', articleCards.length, 'articleCards and', slots.length, 'slots');

    for (const card of articleCards) {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.setData('source', 'sidebar');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    }

    for (const slot of slots) {
      slot.setAttribute('draggable', 'true');
      slot.addEventListener('dragstart', (e) => {
        const articleId = slot.dataset.articleId;
        if (!articleId) { e.preventDefault(); return; }
        slot.classList.add('dragging');
        e.dataTransfer.setData('text/plain', articleId);
        e.dataTransfer.setData('source', 'slot');
        e.dataTransfer.setData('sourceSlot', slot.dataset.slot);
      });
      slot.addEventListener('dragend', () => slot.classList.remove('dragging'));
      slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault(); slot.classList.remove('drag-over');
        const articleId = e.dataTransfer.getData('text/plain');
        const source = e.dataTransfer.getData('source');
        const sourceSlotName = e.dataTransfer.getData('sourceSlot');
        if (!articleId) return;

        if (source === 'slot' && sourceSlotName) {
          const sourceSlot = document.querySelector(`[data-slot="${sourceSlotName}"]`);
          if (sourceSlot && sourceSlot !== slot) {
            const targetArticleId = slot.dataset.articleId;
            if (sourceSlot.classList.contains('puff-strip')) {
              clearPuff(sourceSlot);
            } else {
              clearSlot(sourceSlot);
            }
            if (targetArticleId) {
              if (sourceSlot.classList.contains('puff-strip')) setPuffArticle(sourceSlot, targetArticleId);
              else setSlotArticle(sourceSlot, targetArticleId);
            }
          }
        }

        if (slot.classList.contains('puff-strip')) setPuffArticle(slot, articleId);
        else setSlotArticle(slot, articleId);
      });
    }
  } catch (error) {
    console.error('initDragDrop error', error);
  }
}

function updateArticleCardState(articleId, isUsed) {
  const card = document.querySelector(`.article-card[data-id="${articleId}"]`);
  if (card) {
    if (isUsed) card.classList.add('used'); else card.classList.remove('used');
  }
}

export function setPuffArticle(slot, articleId) {
  const article = articles.find(a => String(a.id) === String(articleId));
  if (!article) return;

  const previousId = slot.dataset.articleId;
  if (previousId) { usedArticles.delete(previousId); updateArticleCardState(previousId, false); }

  usedArticles.add(String(articleId));
  updateArticleCardState(articleId, true);

  slot.dataset.articleId = articleId;
  slot.classList.add('has-article');

  const puffContent = slot.querySelector('.puff-content');
  const category = puffContent.querySelector('.puff-category');
  const headline = puffContent.querySelector('.puff-headline');
  const page = puffContent.querySelector('.puff-page');

  // Keep the dot but remove the extra normal space so headline can sit tighter.
  category.textContent = (capitalize(article.category) || '') + '.';
  headline.classList.remove('char-warning');
  headline.textContent = article.headline || '';
  page.textContent = 'Sidan ' + (article.page || (Math.floor(Math.random() * 10) + 2));

  makeSlotEditable(slot);
}

export function clearPuff(slot) {
  const previousId = slot.dataset.articleId;
  if (previousId) { usedArticles.delete(previousId); updateArticleCardState(previousId, false); }
  slot.dataset.articleId = '';
  slot.classList.remove('has-article');
  const puffContent = slot.querySelector('.puff-content');
  const category = puffContent.querySelector('.puff-category');
  const headline = puffContent.querySelector('.puff-headline');
  const page = puffContent.querySelector('.puff-page');
  category.textContent = '';
  const slotNumber = slot.dataset.slot.replace('puff', '');
  headline.textContent = `Dra toppnotis ${slotNumber} hit`;
  headline.classList.remove('char-warning');
  page.textContent = '';
  updatePostits();
  if (typeof adjustTextFit === 'function') adjustTextFit();
}

export function setSlotArticle(slot, articleId) {
  const article = articles.find(a => String(a.id) === String(articleId));
  if (!article) return;

  const previousId = slot.dataset.articleId;
  if (previousId) { usedArticles.delete(previousId); updateArticleCardState(previousId, false); }

  usedArticles.add(String(articleId));
  updateArticleCardState(articleId, true);

  slot.dataset.articleId = articleId;
  slot.classList.add('has-article');

  const content = slot.querySelector('.slot-content');
  const isHuvudnyhet = slot.classList.contains('huvudnyhet');
  const isTexttopp = slot.classList.contains('texttopp');
  const isMellan = slot.classList.contains('mellan') || slot.classList.contains('artikel-slot');
  const isLiten = slot.classList.contains('liten') || slot.classList.contains('notis-slot');
  const isCitat = slot.classList.contains('citat') || slot.classList.contains('citat-slot');

  if (isTexttopp) {
  const headlineText = truncateText(article.headline || '', CHAR_LIMITS.headline);
  const ingressText = truncateText(article.subheadline || '', CHAR_LIMITS.ingress);
  const pageNumber = article.page || (Math.floor(Math.random() * 10) + 2);
  const categoryText = article.category ? capitalize(article.category) : '';
  clearChildren(content);
  const adiv = document.createElement('div'); adiv.className = 'article-display';
    const h3 = document.createElement('h3'); h3.textContent = headlineText;
    const p = document.createElement('p'); p.className = 'subheadline'; p.textContent = ingressText + ' ';
    const span = document.createElement('span'); span.className = 'texttopp-page'; span.textContent = categoryText + (categoryText ? ' sidan ' : 'Sidan ') + pageNumber;
    p.append(span);
    adiv.append(h3); adiv.append(p); content.append(adiv);
  } else if (isCitat) {
    const quoteText = article.quote || article.headline;
    const sender = article.quoteSender || article.category || '';
    const pageNumber = article.page || (Math.floor(Math.random() * 10) + 2);
    const categoryText = article.category ? capitalize(article.category) : '';
    clearChildren(content);
    const adiv = document.createElement('div'); adiv.className = 'article-display citat-display';
    const block = document.createElement('blockquote'); block.className = 'citat-text'; block.textContent = `"${quoteText}"`;
    const quoteChar = document.createElement('img'); quoteChar.className = 'citattecken'; quoteChar.src = '/static/images/citattecken.1.jpeg'; quoteChar.alt = '';
    const pSender = document.createElement('p'); pSender.className = 'citat-sender'; pSender.textContent = sender;
    const pPage = document.createElement('p'); pPage.className = 'article-page'; pPage.textContent = categoryText + (categoryText ? ' sidan ' : 'Sidan ') + pageNumber;
    adiv.append(block); adiv.append(quoteChar); adiv.append(pSender); adiv.append(pPage); content.append(adiv);
  } else if (isHuvudnyhet) {
    const headlineText = truncateText(article.headline || '', CHAR_LIMITS.headline);
    const ingressText = article.subheadline || '';
    const pageNumber = article.page || (Math.floor(Math.random() * 10) + 2);
    clearChildren(content);
    const adiv = document.createElement('div'); adiv.className = 'article-display huvudnyhet-display';
    const hero = document.createElement('div'); hero.className = 'hero-image-container';
    const img = document.createElement('img'); img.className = 'hero-image'; if (article.image) img.src = article.image; img.alt = article.headline || '';
    img.addEventListener('error', () => { img.style.display = 'none'; });
    const overlay = document.createElement('div'); overlay.className = 'headline-overlay';
    const h3wrap = document.createElement('h3'); const span = document.createElement('span'); span.textContent = headlineText; h3wrap.append(span);
    const pageSpan = document.createElement('span'); pageSpan.className = 'huvudnyhet-page'; pageSpan.textContent = `Sidan ${pageNumber}`;
    overlay.append(h3wrap); overlay.append(pageSpan);
    hero.append(img); hero.append(overlay);
    const ingressDiv = document.createElement('div'); ingressDiv.className = 'huvudnyhet-ingress'; const pIngress = document.createElement('p'); pIngress.textContent = ingressText; ingressDiv.append(pIngress);
    adiv.append(hero); adiv.append(ingressDiv); content.append(adiv);
  } else if (isMellan) {
    const headlineText = article.headline || '';
    const pageNumber = article.page || (Math.floor(Math.random() * 10) + 2);
    clearChildren(content);
    const adiv = document.createElement('div'); adiv.className = 'article-display artikel-large-headline';
    const controls = document.createElement('div'); controls.className = 'font-size-controls';
    const dec = document.createElement('button'); dec.className = 'font-size-btn decrease'; dec.title = 'Minska textstorlek'; dec.textContent = '-';
    const inc = document.createElement('button'); inc.className = 'font-size-btn increase'; inc.title = 'Öka textstorlek'; inc.textContent = '+';
    controls.append(dec); controls.append(inc);
    const h3 = document.createElement('h3'); h3.textContent = headlineText;
    const p = document.createElement('p'); p.className = 'article-page'; p.textContent = `Sidan ${pageNumber}`;
    adiv.append(controls); adiv.append(h3); adiv.append(p); content.append(adiv);
    addFontSizeControls(content);
  } else if (isLiten) {
    const headlineText = article.headline || '';
    const pageNumber = article.page || (Math.floor(Math.random() * 10) + 2);
    clearChildren(content);
    const adiv = document.createElement('div'); adiv.className = 'article-display notis-large-headline';
    const controls = document.createElement('div'); controls.className = 'font-size-controls';
    const dec = document.createElement('button'); dec.className = 'font-size-btn decrease'; dec.title = 'Minska textstorlek'; dec.textContent = '-';
    const inc = document.createElement('button'); inc.className = 'font-size-btn increase'; inc.title = 'Öka textstorlek'; inc.textContent = '+';
    controls.append(dec); controls.append(inc);
    const h3 = document.createElement('h3'); h3.textContent = headlineText;
    const p = document.createElement('p'); p.className = 'article-page'; p.textContent = `Sidan ${pageNumber}`;
    adiv.append(controls); adiv.append(h3); adiv.append(p); content.append(adiv);
    addFontSizeControls(content);
  }

  makeSlotEditable(slot);
  if (typeof adjustTextFit === 'function') adjustTextFit();
  updatePostits();
  if (typeof adjustTextFit === 'function') adjustTextFit();
}

export function clearSlot(slot) {
  const previousId = slot.dataset.articleId;
  if (previousId) { usedArticles.delete(previousId); updateArticleCardState(previousId, false); }
  slot.dataset.articleId = '';
  slot.classList.remove('has-article');
  const select = slot.querySelector('.slot-select'); if (select) select.value = '';
  const content = slot.querySelector('.slot-content');

  if (slot.classList.contains('huvudnyhet')) {
    clearChildren(content);
    const placeholder = document.createElement('div'); placeholder.className = 'image-placeholder';
    const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en huvudnyhet hit';
    const span = document.createElement('span'); span.textContent = '📷 Bildyta';
    placeholder.append(p); placeholder.append(span); content.append(placeholder);
  } else if (slot.classList.contains('texttopp')) {
    clearChildren(content);
    const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en texttopp hit'; content.append(p);
  } else if (slot.classList.contains('citat') || slot.classList.contains('citat-slot')) {
    clearChildren(content);
    const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra ett citat hit'; content.append(p);
  } else if (slot.classList.contains('liten') || slot.classList.contains('notis-slot')) {
    clearChildren(content);
    const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en notis hit'; content.append(p);
  } else if (slot.classList.contains('puff')) {
    clearChildren(content);
    const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en puff hit'; content.append(p);
  } else {
    clearChildren(content);
    const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en artikel hit'; content.append(p);
  }
  updatePostits();
}

export function updateSlotPlaceholders() {
  const slots = document.querySelectorAll('.slot:not(.puff-strip)');
  for (const slot of slots) {
    if (!slot.dataset.articleId) {
      const content = slot.querySelector('.slot-content');
      if (slot.classList.contains('huvudnyhet')) {
        clearChildren(content);
        const placeholder = document.createElement('div'); placeholder.className = 'image-placeholder';
        const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en huvudnyhet hit';
        const span = document.createElement('span'); span.textContent = '📷 Bildyta'; placeholder.append(p); placeholder.append(span); content.append(placeholder);
      } else if (slot.classList.contains('texttopp')) {
        clearChildren(content);
        const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en texttopp hit'; content.append(p);
      } else if (slot.classList.contains('citat') || slot.classList.contains('citat-slot')) {
        clearChildren(content);
        const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra ett citat hit'; content.append(p);
      } else if (slot.classList.contains('liten') || slot.classList.contains('notis-slot')) {
        clearChildren(content);
        const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en notis hit'; content.append(p);
      } else if (slot.classList.contains('puff')) {
        clearChildren(content);
        const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en puff hit'; content.append(p);
      } else if (slot.classList.contains('artikel-slot') || slot.classList.contains('mellan')) {
        clearChildren(content);
        const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en artikel hit'; content.append(p);
      } else {
        clearChildren(content);
        const p = document.createElement('p'); p.className = 'placeholder-text'; p.textContent = 'Dra en artikel hit'; content.append(p);
      }
    }
  }
}
