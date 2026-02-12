


function safeClear(element) {
  while (element && element.firstChild) element.firstChild.remove();
}

  // Classic static initialization (no dynamic JSON layout)
  // All slot structure is in the HTML template.
  // No dynamic rendering or editor.
  console.log('[Tidningssimulator] initApp start');
  // Optionally, initialize any static JS needed for classic mode here.
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
  const data = { groupName, slots: getSlotConfig(), timestamp: new Date().toISOString() };
  try {
    const response = await fetch('/save', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    const result = await response.json();
    if (result.success) { showToast(`Sparat som ${result.filename.replace('.json','')}`, 'success'); }
    else { showToast('Något gick fel vid sparande', 'error'); }
  } catch (error) { console.error('Save error', error); showToast('Kunde inte spara', 'error'); }
}

function generatePdf() {
  const groupName = document.getElementById('groupName').value.trim();
  if (!groupName) { showToast('Ange ett gruppnamn först!', 'error'); return; }
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
  const saved = localStorage.getItem('blt-design-choice') || 'blt-original';
  select.value = saved;
  applyDesign(saved);
  select.addEventListener('change', () => { const choice = select.value; applyDesign(choice); localStorage.setItem('blt-design-choice', choice); showToast(`${choice} aktiverad`, 'success'); });
}

function applyDesign(design) {
  const newspaper = document.querySelector('.newspaper');
  if (!newspaper) return;
  // Keep single BLT original design mode only
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

export { showToast, getSlotConfig };
