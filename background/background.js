/**
 * MultiCopy - Background Service Worker
 * Gestiona eventos de fondo y reapertura automática del popup tras selección visual
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'REOPEN_POPUP' || message.action === 'OPEN_POPUP') {
    if (chrome.action && typeof chrome.action.openPopup === 'function') {
      chrome.action.openPopup()
        .then(() => {
          sendResponse({ status: 'popup_opened' });
        })
        .catch((err) => {
          console.warn('No se pudo reabrir el popup automáticamente:', err);
          sendResponse({ status: 'error', message: err.message });
        });
      return true; // Respuesta asíncrona
    } else {
      sendResponse({ status: 'unsupported' });
    }
  }
});
