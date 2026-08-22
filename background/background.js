/**
 * MultiCopy - Background Service Worker
 * Gestiona eventos de fondo, atajos de teclado y reapertura automática del popup
 */

importScripts('../utils/constants.js', '../utils/models.js', '../utils/storage.js', '../utils/tabs.js');

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
  if (message.action === ACTIONS.REOPEN_POPUP || message.action === ACTIONS.OPEN_POPUP) {
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

  if (message.action === ACTIONS.GET_PROFILE_FOR_AUTOFILL) {
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
  if (command === COMMANDS.FILL_FORM_SHORTCUT) {
    try {
      const tab = typeof TabService !== 'undefined'
        ? await TabService.getActiveTab()
        : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

      if (tab && tab.id) {
        const profile = await getProfileForUrlOrActive(tab.url);

        chrome.tabs.sendMessage(tab.id, {
          action: ACTIONS.TRIGGER_FILL_WITH_PROFILE,
          profile: profile
        }, async () => {
          if (chrome.runtime.lastError) {
            // Si la pestaña estaba desincronizada, inyectar con TabService y reintentar
            if (typeof TabService !== 'undefined') {
              const injected = await TabService.ensureContentScriptsInjected(tab.id);
              if (injected) {
                chrome.tabs.sendMessage(tab.id, {
                  action: ACTIONS.TRIGGER_FILL_WITH_PROFILE,
                  profile: profile
                });
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('Error al enviar comando de atajo a la pestaña activa:', err);
    }
  }
});
