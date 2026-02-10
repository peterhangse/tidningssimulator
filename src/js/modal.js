import { articles, clearChildren, capitalize } from './state.js';

export function initModal() {
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
  } catch {
    // non-fatal
  }
}

export function showArticlePreview(articleId) {
  const article = articles.find(a => String(a.id) === String(articleId));
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
    span.style.color = '#3c3c3c'; // BLT sekundärgrå
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
