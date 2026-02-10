// Shared application state and helpers
const appDataElement = typeof document === 'undefined' ? null : document.getElementById('app-data');
export const articles = appDataElement ? JSON.parse(appDataElement.dataset.articles || '[]') : [];
export const CHAR_LIMITS = appDataElement ? JSON.parse(appDataElement.dataset.charLimits || '{}') : {
  puff: 40,
  headline: 70,
  ingress: 120,
  mellanRubrik: 45,
  mellanIngress: 200,
  litenRubrik: 30,
  litenIngress: 120
};

export const usedArticles = new Set();
export const cached = {};

export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, Math.max(0, maxLength - 1)) + '…';
}

export function isOverLimit(text, maxLength) {
  return text && text.length > maxLength;
}

export function clearChildren(element) {
  while (element && element.firstChild) element.firstChild.remove();
}

export function capitalize(str) {
  if (!str) return '';
  const s = String(str).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
