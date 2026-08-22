/**
 * MultiCopy - Background Service Worker
 * Gestiona eventos de fondo, atajos de teclado y reapertura automática del popup
 */

importScripts('../utils/storage.js');

/**
 * Obtiene el perfil asociado al dominio de la URL o el perfil activo
 */
async function getProfileForUrlOrActive(url) {
  try {
    let profile = null;
    if (url && typeof Storage !== 'undefined' && typeof Storage.getProfileForUrl === 'function') {
      profile = await Storage.getProfileForUrl(url);
    }
    if (!profile && typeof Storage !== 'undefined' && typeof Storage.getActiveProfile === 'function') {
      profile = await Storage.getActiveProfile();
    }
    return profile;
  } catch (err) {
    console.error('Error al obtener perfil en background:', err);
    return null;
  }
}

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

  if (message.action === 'GET_PROFILE_FOR_AUTOFILL') {
    getProfileForUrlOrActive(message.url)
      .then((profile) => {
        sendResponse({ status: 'ok', profile });
      })
      .catch((err) => {
        sendResponse({ status: 'error', message: err.message });
      });
    return true;
  }
});

// Listener para el atajo de teclado global (por defecto Ctrl + Shift + Y)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-form-shortcut') {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0] && tabs[0].id) {
        const profile = await getProfileForUrlOrActive(tabs[0].url);
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'TRIGGER_FILL_WITH_PROFILE',
          profile: profile
        });
      }
    } catch (err) {
      console.error('Error al enviar comando de atajo a la pestaña activa:', err);
    }
  }
});
