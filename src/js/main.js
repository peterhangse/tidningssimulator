import { initApp } from './app.js';

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => { initApp(); });
  } else {
    // DOM already ready
    initApp();
  }
}
