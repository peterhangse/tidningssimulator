// Gör så att krysset stänger panelen
document.addEventListener('DOMContentLoaded', function() {
  const closePanelBtn = document.getElementById('closePanelBtn');
  const rightPanel = document.getElementById('rightPanel');
  if (closePanelBtn && rightPanel) {
    closePanelBtn.addEventListener('click', function() {
      rightPanel.style.display = 'none';
    });
  }
  
  // Toggle för hjälp-rutan
  const descriptionToggle = document.getElementById('descriptionToggle');
  const descriptionBox = document.getElementById('newspaperDescription');
  if (descriptionToggle && descriptionBox) {
    descriptionToggle.addEventListener('click', function() {
      descriptionBox.classList.toggle('expanded');
    });
  }
  
  // Highlighta tidningsdelar vid hover på hjälptexterna
  const descriptionSections = document.querySelectorAll('.description-section[data-section]');
  descriptionSections.forEach(section => {
    const sectionName = section.dataset.section;
    section.addEventListener('mouseenter', function() {
      // Hitta rätt element att highlighta baserat på section
      let targetSelector = '';
      if (sectionName === 'puffar') {
        targetSelector = '.puffar-section';
      } else if (sectionName === 'texttopp') {
        targetSelector = '.texttopp';
      } else if (sectionName === 'huvudnyhet') {
        targetSelector = '.huvudnyhet';
      } else if (sectionName === 'bottom') {
        targetSelector = '.bottom-section';
      }
      if (targetSelector) {
        const target = document.querySelector(targetSelector);
        if (target) target.classList.add('help-highlight');
      }
    });
    section.addEventListener('mouseleave', function() {
      // Ta bort highlight
      document.querySelectorAll('.help-highlight').forEach(el => el.classList.remove('help-highlight'));
    });
  });
  
  // Package folder navigation
  initPackageFolders();
});

// Package folder initialization
function initPackageFolders() {
  const packages = window.PACKAGES_DATA || [];
  const articleList = document.getElementById('articleList');
  const packageView = document.getElementById('packageArticlesView');
  const packageArticlesList = document.getElementById('packageArticlesList');
  const packageTitle = document.getElementById('packageTitle');
  const backBtn = document.getElementById('packageBackBtn');
  
  if (!packages.length || !articleList || !packageView) return;
  
  // Click handlers for package folders
  document.querySelectorAll('.package-folder').forEach(folder => {
    folder.addEventListener('click', function() {
      const packageId = this.dataset.packageId;
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) return;
      
      // Show package articles view
      articleList.style.display = 'none';
      packageView.style.display = 'block';
      packageTitle.textContent = pkg.icon + ' ' + pkg.name;
      
      // Render package articles
      packageArticlesList.innerHTML = '';
      pkg.articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.draggable = true;
        card.dataset.id = article.id;
        card.innerHTML = `
          <span class="article-category">${(article.category || 'Nyheter').toLowerCase().replace(/^\w/, c => c.toUpperCase())}</span>
          <h3>${article.headline}</h3>
          <p>${article.subheadline}</p>
        `;
        
        // Add drag handlers
        card.addEventListener('dragstart', function(e) {
          e.dataTransfer.setData('text/plain', article.id);
          e.dataTransfer.setData('source', 'sidebar');
          e.dataTransfer.setData('article-data', JSON.stringify(article));
          this.classList.add('dragging');
        });
        card.addEventListener('dragend', function() {
          this.classList.remove('dragging');
        });
        
        // Add click handler for preview
        card.addEventListener('click', function() {
          if (this.classList.contains('dragging')) return;
          if (window.showArticlePreview) {
            window.showArticlePreview(article.id);
          }
        });
        
        packageArticlesList.appendChild(card);
      });
    });
  });
  
  // Back button handler
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      packageView.style.display = 'none';
      articleList.style.display = 'block';
    });
  }
}

// --- TEST: Flytta alltid .article-page till sist i .article-display för mellan1/liten1/liten2 ---
function ensurePageRefPlacement() {
  ["mellan1","liten1","liten2"].forEach(slot => {
    document.querySelectorAll(`.slot[data-slot='${slot}'] .article-display`).forEach(adiv => {
      const page = adiv.querySelector('.article-page');
      if (page && page !== adiv.lastElementChild) adiv.appendChild(page);
    });
  });
}
document.addEventListener('DOMContentLoaded', ensurePageRefPlacement);
// Kör även efter varje render om du har dynamisk rendering
// Ingen flytt av .article-page längre – den ska ligga kvar i .article-display för mellan1/liten1/liten2
(function(){
var __modules = {};
var __cache = {};
function __require(name){
  if(__cache[name]) return __cache[name].exports;
  var module = {exports:{}};
  __cache[name]=module;
  __modules[name](__require,module,module.exports);
  return module.exports;
}
__modules['./app.js'] = function(require,module,exports){
const { initDragDrop, updateSlotPlaceholders } = require("./dragdrop.js");
const { initModal, showArticlePreview } = require("./modal.js");
const { initUI, adjustTextFit, addFontSizeControls, updatePostits, enableEditMode } = require("./ui.js");
const { articles } = require("./state.js");

function safeClear(element) {
  while (element && element.firstChild) element.firstChild.remove();
}

function initApp() {
  console.log('[Tidningssimulator] initApp start');
  initUI();
  initModal();
  initDragDrop();
  initButtons();
  initDesignToggle();
  initFinishButton();
  initStepProgression();
  initEditMode();
  updateSlotPlaceholders();

  // Text fit observer
  adjustTextFit();
  const textObserver = new MutationObserver(() => adjustTextFit());
  textObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

  window.adjustTextFit = adjustTextFit;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function getSlotConfig() {
  const slots = {};
  for (const slot of document.querySelectorAll('.slot')) {
    const slotId = slot.dataset.slot;
    const articleId = slot.dataset.articleId || null;
    slots[slotId] = articleId;
  }
  return slots;
}

async function saveFrontpage() {
  const groupName = document.getElementById('groupName').value.trim();
  if (!groupName) { showToast('Ange ett gruppnamn först!', 'error'); return; }
  
  showToast('Sparar framsida...', 'info');
  
  try {
    const data = { 
      groupName, 
      slots: getSlotConfig(), 
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch('/save', { 
      method: 'POST', 
      headers: {'Content-Type':'application/json'}, 
      body: JSON.stringify(data) 
    });
    const result = await response.json();
    if (result.success) { 
      showToast(`Sparat som ${result.filename.replace('.json','')}`, 'success'); 
    }
    else { showToast('Något gick fel vid sparande', 'error'); }
  } catch (error) { 
    console.error('Save error', error); 
    showToast('Kunde inte spara', 'error'); 
  }
}

function generatePdf() {
  const groupName = document.getElementById('groupName').value.trim();
  if (!groupName) { showToast('Ange ett gruppnamn först!', 'error'); return; }
  
  // Uppdatera grupp-footer med gruppnamnet
  const groupFooter = document.getElementById('groupFooter');
  if (groupFooter) {
    groupFooter.textContent = 'Gjord av ' + groupName;
  }
  
  window.print();
  setTimeout(() => {
    if (!document.body.classList.contains('edit-mode')) {
      showEditModeOffer();
    }
  }, 500);
}

function initButtons() {
  const saveButton = document.getElementById('saveBtn');
  saveButton?.addEventListener('click', saveFrontpage);
}

function initDesignToggle() {
  const select = document.getElementById('designSelect');
  const newspaper = document.querySelector('.newspaper');
  if (!select || !newspaper) return;
  // Sätt grid-botten som default och göm menyn
  const defaultDesign = 'sidref-gridbotten';
  localStorage.setItem('blt-design-choice', defaultDesign);
  select.value = defaultDesign;
  applyDesign(defaultDesign);
  document.querySelector('.design-selector').style.display = 'none';
}

function applyDesign(design) {
  const newspaper = document.querySelector('.newspaper');
  if (!newspaper) return;
  // Ta bort alla sidreferens-varianter
  newspaper.classList.remove(
    'sidref-inline',
    'sidref-absbotten',
    'sidref-flexbotten',
    'sidref-gridbotten',
    'sidref-offset',
    'sidref-dold'
  );
  // Lägg till rätt klass
  if (design.startsWith('sidref-')) {
    newspaper.classList.add(design);
  }
  // Alltid BLT original för övrig styling
  document.body.classList.remove('blt-original');
  document.body.classList.add('blt-original');
}

function setActiveStep(stepNumber) {
  const steps = document.querySelectorAll('.panel-step');
  for (const [index, step] of steps.entries()) {
    const number_ = index + 1;
    step.classList.remove('active','completed');
    if (number_ < stepNumber) step.classList.add('completed');
    else if (number_ === stepNumber) step.classList.add('active');
  }
}

function initFinishButton() {
  const finishButton = document.getElementById('finishBtn');
  const finishContainer = document.getElementById('finishBtnContainer');
  const rightPanel = document.getElementById('rightPanel');
  finishButton?.addEventListener('click', () => {
    // finishContainer.style.setProperty('display','none','important'); // Ta inte bort knappen längre
    rightPanel.style.setProperty('display','flex','important');
    setActiveStep(1);
  });
}

function initStepProgression() {
  const groupNameInput = document.getElementById('groupName');
  const saveButton = document.getElementById('saveBtn');
  saveButton?.addEventListener('click', () => { 
    if (groupNameInput?.value.trim().length>0) {
      setTimeout(() => {
        setActiveStep(2);
        // Show edit mode offer after saving group name
        if (!document.body.classList.contains('edit-mode')) {
          showEditModeOffer();
        }
      }, 100);
    }
  });
}

function initEditMode() {
  const modal = document.getElementById('editModeModal');
  const closeButton = modal?.querySelector('.modal-close');
  const skipButton = document.getElementById('skipEditModeBtn');
  const enableButton = document.getElementById('enableEditModeBtn');
  closeButton?.addEventListener('click', () => modal.classList.remove('show'));
  skipButton?.addEventListener('click', () => { modal.classList.remove('show'); showToast('Bra jobbat! Din framsida är klar.', 'success'); });
  enableButton?.addEventListener('click', () => { modal.classList.remove('show'); enableEditMode(); });
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
}

function showEditModeOffer() {
  const groupName = document.getElementById('groupName').value.trim();
  if (!groupName) { showToast('Fyll i gruppnamn först för att låsa upp redigering!', 'error'); return false; }
  const modal = document.getElementById('editModeModal');
  modal?.classList.add('show');
  return true;
}




// Exports
exports.initApp = initApp;
exports.showToast = showToast;
exports.getSlotConfig = getSlotConfig;

};
__modules['./dragdrop.js'] = function(require,module,exports){
const { articles, usedArticles, CHAR_LIMITS, truncateText, clearChildren, capitalize, findArticle } = require("./state.js");
const { addFontSizeControls, adjustTextFit, updatePostits, makeSlotEditable } = require("./ui.js");

function initDragDrop() {
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

function setPuffArticle(slot, articleId) {
  const article = findArticle(articleId);
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
  headline.textContent = truncateText(article.headline || '', 37);
  page.textContent = 'Sidan ' + (article.page || (Math.floor(Math.random() * 10) + 2));

  makeSlotEditable(slot);
}

function clearPuff(slot) {
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

function setSlotArticle(slot, articleId) {
  const article = findArticle(articleId);
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
    const block = document.createElement('blockquote'); block.className = 'citat-text'; block.textContent = quoteText;
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
    const categoryText = article.category ? capitalize(article.category) : '';
    const pageSpan = document.createElement('span'); pageSpan.className = 'huvudnyhet-page'; pageSpan.textContent = categoryText + (categoryText ? ' sidan ' : 'Sidan ') + pageNumber;
    overlay.append(h3wrap); overlay.append(pageSpan);
    hero.append(img); hero.append(overlay);
    const ingressDiv = document.createElement('div'); ingressDiv.className = 'huvudnyhet-ingress'; const pIngress = document.createElement('p'); pIngress.textContent = ingressText; ingressDiv.append(pIngress);
    adiv.append(hero); adiv.append(ingressDiv); content.append(adiv);
  } else if (isMellan) {
    const headlineText = truncateText(article.headline || '', 37);
    const pageNumber = article.page || (Math.floor(Math.random() * 10) + 2);
    const categoryText = article.category ? capitalize(article.category) : '';
    clearChildren(content);
    const adiv = document.createElement('div'); adiv.className = 'article-display artikel-large-headline';
    const controls = document.createElement('div'); controls.className = 'font-size-controls';
    const dec = document.createElement('button'); dec.className = 'font-size-btn decrease'; dec.title = 'Minska textstorlek'; dec.textContent = '-';
    const inc = document.createElement('button'); inc.className = 'font-size-btn increase'; inc.title = 'Öka textstorlek'; inc.textContent = '+';
    controls.append(dec); controls.append(inc);
    const h3 = document.createElement('h3'); h3.textContent = headlineText;
    const p = document.createElement('p'); p.className = 'article-page'; p.textContent = categoryText + (categoryText ? ' sidan ' : 'Sidan ') + pageNumber;
    adiv.append(controls); adiv.append(h3); adiv.append(p); content.append(adiv);
    addFontSizeControls(content);
  } else if (isLiten) {
    const headlineText = truncateText(article.headline || '', 37);
    const pageNumber = article.page || (Math.floor(Math.random() * 10) + 2);
    const categoryText = article.category ? capitalize(article.category) : '';
    clearChildren(content);
    const adiv = document.createElement('div'); adiv.className = 'article-display notis-large-headline';
    const controls = document.createElement('div'); controls.className = 'font-size-controls';
    const dec = document.createElement('button'); dec.className = 'font-size-btn decrease'; dec.title = 'Minska textstorlek'; dec.textContent = '-';
    const inc = document.createElement('button'); inc.className = 'font-size-btn increase'; inc.title = 'Öka textstorlek'; inc.textContent = '+';
    controls.append(dec); controls.append(inc);
    const h3 = document.createElement('h3'); h3.textContent = headlineText;
    const p = document.createElement('p'); p.className = 'article-page'; p.textContent = categoryText + (categoryText ? ' sidan ' : 'Sidan ') + pageNumber;
    adiv.append(controls); adiv.append(h3); adiv.append(p); content.append(adiv);
    addFontSizeControls(content);
  }

  makeSlotEditable(slot);
  if (typeof adjustTextFit === 'function') adjustTextFit();
  updatePostits();
  if (typeof adjustTextFit === 'function') adjustTextFit();
}

function clearSlot(slot) {
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

function updateSlotPlaceholders() {
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


// Exports
exports.initDragDrop = initDragDrop;
exports.setPuffArticle = setPuffArticle;
exports.clearPuff = clearPuff;
exports.setSlotArticle = setSlotArticle;
exports.clearSlot = clearSlot;
exports.updateSlotPlaceholders = updateSlotPlaceholders;

};
__modules['./main.js'] = function(require,module,exports){
const { initApp } = require("./app.js");

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => { initApp(); });
  } else {
    // DOM already ready
    initApp();
  }
}

};
__modules['./modal.js'] = function(require,module,exports){
const { articles, clearChildren, capitalize, findArticle } = require("./state.js");

function initModal() {
  try {
    const modal = document.getElementById('articleModal');
    if (!modal) return;

    const closeButton = modal.querySelector('.modal-close');
    closeButton?.addEventListener('click', () => modal.classList.remove('show'));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) modal.classList.remove('show');
    });

    // Wire up preview clicks on cards
    for (const card of document.querySelectorAll('.article-card')) {
      card.addEventListener('click', (e) => {
        if (card.classList.contains('dragging')) return;
        const articleId = card.dataset.id;
        showArticlePreview(articleId);
      });
    }
    
    // Expose showArticlePreview to window for package articles
    window.showArticlePreview = showArticlePreview;
  } catch {
    // non-fatal
  }
}

function showArticlePreview(articleId) {
  const article = findArticle(articleId);
  if (!article) return;
  const modal = document.getElementById('articleModal');
  if (!modal) return;

  modal.querySelector('.modal-category').textContent = capitalize(article.category) || '';
  modal.querySelector('.modal-headline').textContent = article.headline || '';
  modal.querySelector('.modal-ingress').textContent = article.subheadline || '';

  const imageContainer = modal.querySelector('.modal-image');
  clearChildren(imageContainer);
  if (article.image) {
    const img = document.createElement('img');
    img.src = article.image;
    img.alt = article.headline || '';
    imageContainer.append(img);
  } else {
    const span = document.createElement('span');
    span.style.display = 'flex';
    span.style.alignItems = 'center';
    span.style.justifyContent = 'center';
    span.style.height = '100%';
    span.style.color = '#999';
    span.textContent = '📷 Ingen bild';
    imageContainer.append(span);
  }

  const quoteElement = modal.querySelector('.modal-quote');
  if (article.quote) {
    quoteElement.textContent = `"${article.quote}"`;
    quoteElement.style.display = 'block';
  } else {
    quoteElement.style.display = 'none';
  }

  modal.classList.add('show');
}


// Exports
exports.initModal = initModal;
exports.showArticlePreview = showArticlePreview;

};
__modules['./state.js'] = function(require,module,exports){
// Shared application state and helpers
const appDataElement = typeof document === 'undefined' ? null : document.getElementById('app-data');
const articles = appDataElement ? JSON.parse(appDataElement.dataset.articles || '[]') : [];
const packages = typeof window !== 'undefined' && window.PACKAGES_DATA ? window.PACKAGES_DATA : [];
const CHAR_LIMITS = appDataElement ? JSON.parse(appDataElement.dataset.charLimits || '{}') : {
  puff: 40,
  headline: 70,
  ingress: 120,
  mellanRubrik: 45,
  mellanIngress: 200,
  litenRubrik: 30,
  litenIngress: 120
};

const usedArticles = new Set();
const cached = {};

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, Math.max(0, maxLength - 1)) + '…';
}

function isOverLimit(text, maxLength) {
  return text && text.length > maxLength;
}

function clearChildren(element) {
  while (element && element.firstChild) element.firstChild.remove();
}

function capitalize(str) {
  if (!str) return '';
  const s = String(str).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Find article in main list or packages
function findArticle(articleId) {
  // First check main articles
  let article = articles.find(a => String(a.id) === String(articleId));
  if (article) return article;
  
  // Then check packages
  for (const pkg of packages) {
    article = (pkg.articles || []).find(a => String(a.id) === String(articleId));
    if (article) return article;
  }
  
  return null;
}


// Exports
exports.truncateText = truncateText;
exports.isOverLimit = isOverLimit;
exports.clearChildren = clearChildren;
exports.capitalize = capitalize;
exports.articles = articles;
exports.packages = packages;
exports.findArticle = findArticle;
exports.CHAR_LIMITS = CHAR_LIMITS;
exports.usedArticles = usedArticles;
exports.cached = cached;

};
__modules['./ui.js'] = function(require,module,exports){
const { truncateText, usedArticles, CHAR_LIMITS } = require("./state.js");

// Exported UI helpers
function initUI() {
  try {
    window.__kk_cached = window.__kk_cached || {};
    window.__kk_cached.newspaper = document.querySelector('.newspaper');
    window.__kk_cached.mastheadImg = document.querySelector('.masthead-image');
  } catch (_){ /* ignore DOM access errors in non-browser contexts */ }
}

function adjustTextFit() {
  adjustTextFitInner();
  anpassaNedreRubriker();
}

function adjustTextFitInner() {
  const elements = document.querySelectorAll('.slot .slot-content h3, .slot .slot-content .subheadline, .slot .slot-content .citat-text, .slot .slot-content .citat-sender, .slot .slot-content .article-page, .slot .slot-content .huvudnyhet-page, .slot .slot-content .texttopp-page, .puff-headline, .puff-page, .puff-category');

  for (const element of elements) {
    // Rubrikerna i nedre raden sköts av anpassaNedreRubriker()
    if (element.matches(NEDRE_RUBRIKER)) continue;
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

/* ─────────────────────────────────────────────────────────────────────────────
   Rubriker i nedre raden (artikeln och de två notiserna)

   Reglerna, som i en riktig tidning:
   1. Ett ord bryts aldrig mitt i utan bindestreck.
   2. Rubriken är så stor som rutan tillåter, upp till grundstorleken i style.css.
   3. Hellre lite mindre rubrik än avstavning. Räcker inte det avstavas långa ord,
      i första hand i sammansättningsfogen (Hembygds-föreningen), annars mellan
      stavelser. Minst två bokstäver före och tre efter bindestrecket.
   4. De två notiserna får samma rubrikstorlek.
   ───────────────────────────────────────────────────────────────────────────── */

const NEDRE_RUBRIKER = '.bottom-section .artikel-slot .article-display h3, .bottom-section .notis-slot .article-display h3';

// Hur långt rubriken får krympa innan den hellre avstavas, och minsta storlek
const RUBRIKREGLER = {
  artikel: { utanAvstavning: 0.8, minstaPx: 14 },
  notis: { utanAvstavning: 0.9, minstaPx: 9 },
};
// Hur långt rubriken får krympa för att avstavas i en fog i stället för mellan stavelser
const BARA_FOGAR = 0.85;

// Avstavning för orden i artiklarna. | = sammansättningsfog (bäst), · = stavelse.
// Ord som inte finns här avstavas med svenska avstavningsmönster (static/vendor).
const AVSTAVNING = {
  'allsvenska': 'all|sven·ska', 'atlantic': 'at·lan·tic', 'bengtsson': 'bengts|son',
  'besökare': 'be·sö·ka·re', 'bibliotek': 'bib·lio·tek', 'biblioteket': 'bib·lio·te·ket',
  'biljetter': 'bil·jet·ter', 'blekinge': 'ble·kin·ge', 'bostadspriser': 'bo·stads|pri·ser',
  'bygdemuseet': 'byg·de|mu·se·et', 'cupmatchen': 'cup|mat·chen', 'cykelled': 'cy·kel|led',
  'deltävlingen': 'del|täv·ling·en', 'digilabb': 'di·gi|labb', 'februari': 'feb·ru·a·ri',
  'finalen': 'fi·na·len', 'frisbeegolf': 'fris·bee|golf', 'företag': 'fö·re|tag',
  'författarbesök': 'för·fat·tar|be·sök', 'göteborg': 'gö·te|borg',
  'hembygdsföreningen': 'hem|bygds|fö·re·ning·en', 'hittade': 'hit·ta·de', 'hoglands': 'hog|lands',
  'huvudtränare': 'hu·vud|trä·na·re', 'inskickade': 'in|skic·ka·de', 'inspirerar': 'in·spi·re·rar',
  'invigda': 'in|vig·da', 'karlshamn': 'karls|hamn', 'karlskrona': 'karls|kro·na',
  'klimatsmart': 'kli·mat|smart', 'konfirmation': 'kon·fir·ma·tion', 'konsert': 'kon·sert',
  'lanserat': 'lan·se·rat', 'lekplats': 'lek|plats', 'medlemskap': 'med·lem|skap',
  'medlemskväll': 'med·lems|kväll', 'meröppet': 'mer|öp·pet', 'mjällby': 'mjäll|by',
  'pensionär': 'pen·sio·när', 'portugal': 'por·tu·gal', 'presenterad': 'pre·sen·te·rad',
  'publikomröstningen': 'pu·blik|om·röst·ning·en', 'regionträning': 're·gion|trä·ning',
  'revolutionerande': 're·vo·lu·tio·ne·ran·de', 'ronneby': 'ron·ne|by', 'scendesign': 'scen|de·sign',
  'skolmaten': 'skol|ma·ten', 'slutsålda': 'slut|sål·da', 'slöjdworkshop': 'slöjd|work|shop',
  'sommaren': 'som·ma·ren', 'spelordningen': 'spel|ord·ning·en', 'startar': 'star·tar',
  'stenbacka': 'sten|back·a', 'stockholm': 'stock|holm', 'talanger': 'ta·lang·er',
  'tillbaka': 'till|ba·ka', 'trädgården': 'träd|går·den', 'ungdomar': 'ung|do·mar',
  'årskort': 'års|kort', 'årskortsdesignen': 'års|korts|de·sig·nen', 'åttonde': 'åt·ton·de',
  'östersjöfestivalen': 'ös·ter|sjö|fes·ti·va·len', 'galan': 'ga·lan',
};

const MJUKT = '\u00AD';
const ORDFOG = '\u2060'; // hindrar radbrytning, t.ex. efter strecket i 15-18
let matCanvas = null;

function ordBredd(ord, stil, storlek) {
  if (!matCanvas) matCanvas = document.createElement('canvas').getContext('2d');
  matCanvas.font = `${stil.fontStyle} ${stil.fontWeight} ${storlek}px ${stil.fontFamily}`;
  const ls = Number.parseFloat(stil.letterSpacing);
  const extra = Number.isFinite(ls) ? ls * (storlek / stil.basStorlek) * ord.length : 0;
  return matCanvas.measureText(ord).width + extra;
}

// Möjliga brytpunkter i ett ord: [{pos, niva}] där niva 1 = fog, 2 = stavelse
function brytpunkter(ord) {
  const nyckel = ord.toLowerCase();
  let markerat = AVSTAVNING[nyckel];
  if (!markerat && typeof window.svAvstavning === 'function' && /^[a-zåäöéü]+$/i.test(ord)) {
    markerat = window.svAvstavning(nyckel, { hyphenChar: '·' });
  }
  if (!markerat) return [];
  const punkter = [];
  let pos = 0;
  for (const tecken of markerat) {
    if (tecken === '|' || tecken === '·') punkter.push({ pos, niva: tecken === '|' ? 1 : 2 });
    else pos++;
  }
  if (pos !== ord.length) return [];
  // minst två bokstäver före och tre efter bindestrecket
  return punkter.filter((p) => p.pos >= 2 && ord.length - p.pos >= 3);
}

// Lägger in mjuka bindestreck i ett ord så att varje del ryms på en rad
// niva 1 = bara i sammansättningsfogar, 2 = även mellan stavelser
function avstavaOrd(ord, bredd, stil, storlek, niva) {
  if (ordBredd(ord, stil, storlek) <= bredd) return ord;
  const punkter = brytpunkter(ord);
  const delarRyms = (valda) => {
    const pos = [0, ...valda, ord.length];
    for (let i = 1; i < pos.length; i++) {
      const del = ord.slice(pos[i - 1], pos[i]) + (i < pos.length - 1 ? '-' : '');
      if (ordBredd(del, stil, storlek) > bredd) return false;
    }
    return true;
  };
  const fogar = punkter.filter((p) => p.niva === 1).map((p) => p.pos);
  const alla = punkter.map((p) => p.pos);
  let valda = null;
  if (fogar.length && delarRyms(fogar)) valda = fogar;
  else if (niva >= 2 && alla.length && delarRyms(alla)) valda = alla;
  if (!valda) return null;
  let ut = '';
  let forra = 0;
  for (const p of valda) { ut += ord.slice(forra, p) + MJUKT; forra = p; }
  return ut + ord.slice(forra);
}

// Bygger rubriktexten för en viss storlek. avstavning: 0 = ingen, 1 = fogar, 2 = fogar och stavelser.
// null = går inte på den nivån.
function rubrikText(original, bredd, stil, storlek, avstavning) {
  let ok = true;
  const ut = original.split(/(\s+)/).map((bit) => {
    if (!bit || /^\s+$/.test(bit)) return bit;
    // Siffror med streck (15-18, 2025-2026) bryts aldrig
    if (/\d-\d/.test(bit)) {
      if (ordBredd(bit, stil, storlek) > bredd) ok = false;
      return bit.replace(/(\d)-(\d)/g, `$1-${ORDFOG}$2`);
    }
    // ord med bindestreck kan redan brytas efter strecket
    return bit.split(/(-)/).map((del) => {
      if (!del || del === '-') return del;
      const medStreck = bit.includes('-') ? del + '-' : del;
      if (ordBredd(medStreck, stil, storlek) <= bredd) return del;
      if (!avstavning) { ok = false; return del; }
      const avstavat = avstavaOrd(del, bredd, stil, storlek, avstavning);
      if (avstavat === null) { ok = false; return del; }
      return avstavat;
    }).join('');
  }).join('');
  return ok ? ut : null;
}

function rubrikRyms(h3) {
  // Sidhänvisningen ligger absolut i rutans nederkant, så gränsen är rutan (.slot)
  const ruta = h3.closest('.slot') || h3.closest('.slot-content');
  if (!ruta) return true;
  const ram = ruta.getBoundingClientRect();
  const r = h3.getBoundingClientRect();
  const sida = ruta.querySelector('.article-page');
  if (h3.scrollWidth > h3.clientWidth + 1) return false;
  if (r.bottom > ram.bottom + 0.5) return false;
  if (sida) {
    const s = sida.getBoundingClientRect();
    if (s.height && r.bottom > s.top - 2) return false;
    if (s.height && s.bottom > ram.bottom + 0.5) return false;
  }
  return true;
}

function sattStorlek(h3, storlek) {
  h3.style.setProperty('font-size', storlek + 'px', 'important');
}

function sattText(h3, text) {
  if (h3.textContent !== text) h3.textContent = text;
}

// Största storlek i [min, max] där provet går igenom, eller null
function storstaStorlek(min, max, prov) {
  if (min > max) return null;
  if (prov(max)) return max;
  if (!prov(min)) return null;
  let lag = min, hog = max;
  while (hog - lag > 0.25) {
    const mitt = (lag + hog) / 2;
    if (prov(mitt)) lag = mitt; else hog = mitt;
  }
  return Math.floor(lag * 4) / 4;
}

// Resultaten sparas per rubrik. Då ändrar en ny körning ingenting när inget har
// ändrats, och MutationObservern i app.js (som anropar adjustTextFit vid varje
// ändring i sidan) hamnar inte i en slinga.
const rubrikMinne = new WeakMap();

function rubrikNyckel(h3, original, fastStorlek) {
  const ruta = h3.closest('.slot');
  return [original, h3.clientWidth, ruta ? ruta.clientHeight : 0, h3.dataset.userSize === 'true' ? h3.dataset.userSizePx : '', fastStorlek || ''].join('|');
}

// Räknar ut storlek och text. Ändrar rubriken medan den provar, men sätter inte slutresultatet.
function beraknaRubrik(h3, fastStorlek) {
  const typ = h3.closest('.notis-slot') ? 'notis' : 'artikel';
  const regel = RUBRIKREGLER[typ];
  const original = h3.textContent.replaceAll(MJUKT, '').replaceAll(ORDFOG, '');
  const nyckel = rubrikNyckel(h3, original, fastStorlek);
  let minne = rubrikMinne.get(h3);
  if (!minne) { minne = new Map(); rubrikMinne.set(h3, minne); }
  if (minne.has(nyckel)) return minne.get(nyckel);

  const iFokus = document.activeElement === h3;
  const fore = { text: h3.textContent, storlek: h3.style.getPropertyValue('font-size'), prio: h3.style.getPropertyPriority('font-size') };

  // Grundstorleken från style.css
  h3.style.removeProperty('font-size');
  h3.style.removeProperty('line-height');
  const cs = window.getComputedStyle(h3);
  const bas = Number.parseFloat(cs.fontSize) || 16;
  const stil = { fontStyle: cs.fontStyle, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily, letterSpacing: cs.letterSpacing, basStorlek: bas };
  const bredd = h3.clientWidth - 0.5;

  const prov = (storlek, avstava) => {
    const text = rubrikText(original, bredd, stil, storlek, avstava);
    if (text === null) return false;
    if (!iFokus) sattText(h3, text);
    sattStorlek(h3, storlek);
    return rubrikRyms(h3);
  };

  let storlek;
  if (bredd <= 0) {
    storlek = bas;
  } else if (fastStorlek) {
    storlek = fastStorlek;
  } else if (h3.dataset.userSize === 'true') {
    storlek = Number.parseFloat(h3.dataset.userSizePx) || bas;
  } else {
    storlek = storstaStorlek(bas * regel.utanAvstavning, bas, (st) => prov(st, 0));
    if (storlek === null) storlek = storstaStorlek(Math.max(bas * BARA_FOGAR, Math.min(regel.minstaPx, bas)), bas, (st) => prov(st, 1));
    if (storlek === null) storlek = storstaStorlek(Math.min(regel.minstaPx, bas), bas, (st) => prov(st, 2));
    if (storlek === null) storlek = Math.min(regel.minstaPx, bas);
  }

  // Avstava bara om det behövs vid den valda storleken
  let text = bredd > 0 ? rubrikText(original, bredd, stil, storlek, 0) : original;
  if (text === null) text = rubrikText(original, bredd, stil, storlek, 1);
  if (text === null) text = rubrikText(original, bredd, stil, storlek, 2);
  if (text === null) text = original;

  // Återställ, så att bara tillampaRubrik ändrar det som syns
  if (!iFokus) sattText(h3, fore.text);
  if (fore.storlek) h3.style.setProperty('font-size', fore.storlek, fore.prio); else h3.style.removeProperty('font-size');

  const res = { typ, storlek, text: iFokus ? null : text };
  if (!iFokus) minne.set(nyckel, res);
  return res;
}

function tillampaRubrik(h3, res) {
  if (res.text !== null) sattText(h3, res.text);
  if (h3.style.getPropertyValue('font-size') !== res.storlek + 'px' || h3.style.getPropertyPriority('font-size') !== 'important') sattStorlek(h3, res.storlek);
}

function anpassaNedreRubriker() {
  for (const tidning of document.querySelectorAll('.newspaper')) {
    const rubriker = [...tidning.querySelectorAll(NEDRE_RUBRIKER)];
    const resultat = rubriker.map((h3) => ({ h3, res: beraknaRubrik(h3) }));
    // Notiserna får samma storlek, den minsta av de två
    const notiser = resultat.filter((r) => r.res.typ === 'notis' && r.h3.dataset.userSize !== 'true');
    if (notiser.length > 1) {
      const gemensam = Math.min(...notiser.map((n) => n.res.storlek));
      for (const n of notiser) if (n.res.storlek !== gemensam) n.res = beraknaRubrik(n.h3, gemensam);
    }
    for (const r of resultat) tillampaRubrik(r.h3, r.res);
  }
}

function addFontSizeControls(container) {
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
      currentSize = Number.parseFloat(window.getComputedStyle(headline).fontSize) || currentSize;
      const max = isNotis ? NOTIS_MAX : (isCitat ? CITAT_MAX : 999);
      if (currentSize < max) {
        currentSize += 1;
        headline.style.fontSize = currentSize + 'px';
        headline.dataset.userSize = 'true';
        headline.dataset.userSizePx = String(currentSize);
        if (typeof adjustTextFit === 'function') adjustTextFit();
      }
    });
  }
  if (decreaseButton) {
    decreaseButton.addEventListener('click', (ev) => {
      ev.stopPropagation();
      currentSize = Number.parseFloat(window.getComputedStyle(headline).fontSize) || currentSize;
      const min = isNotis ? NOTIS_MIN : (isCitat ? CITAT_MIN : 10);
      if (currentSize > min) {
        currentSize -= 1;
        headline.style.fontSize = currentSize + 'px';
        headline.dataset.userSize = 'true';
        headline.dataset.userSizePx = String(currentSize);
        if (typeof adjustTextFit === 'function') adjustTextFit();
      }
    });
  }
}

function updatePostits() {
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

function makeSlotEditable(slot) {
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

function makeAllSlotsEditable() {
  for (const element of document.querySelectorAll('.puff-strip.has-article .puff-headline')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.puff-strip.has-article .puff-category')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .article-display h3')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .article-display .subheadline')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .headline-overlay h3')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .citat-text')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.slot.has-article .citat-sender')) { element.contentEditable = 'true'; element.classList.add('editable'); }
  for (const element of document.querySelectorAll('.texttopp.has-article .texttopp-page')) { element.contentEditable = 'true'; element.classList.add('editable'); }
}

function enableEditMode() {
  document.body.classList.add('edit-mode');
  makeAllSlotsEditable();
  const indicator = document.createElement('div');
  indicator.id = 'editModeIndicator';
  indicator.textContent = '✏️ Redigeringsläge aktivt - klicka på text för att redigera';
  document.body.append(indicator);
}


// Exports
exports.initUI = initUI;
exports.adjustTextFit = adjustTextFit;
exports.addFontSizeControls = addFontSizeControls;
exports.updatePostits = updatePostits;
exports.makeSlotEditable = makeSlotEditable;
exports.makeAllSlotsEditable = makeAllSlotsEditable;
exports.enableEditMode = enableEditMode;

};
__require('./main.js');
})();