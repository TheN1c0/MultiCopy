/**
 * MultiCopy - Tab & Script Injection Service
 * Centraliza la consulta de pestañas activas y la inyección garantizada de content scripts.
 */

const TabService = {
  CONTENT_SCRIPTS: [
    'utils/constants.js',
    'utils/models.js',
    'utils/storage.js',
    'utils/clipboard.js',
    'utils/selector.js',
    'utils/filler.js',
    'content/picker.js',
    'content/content.js'
  ],

  CONTENT_STYLES: [
    'content/content.css'
  ],

  /**
   * Obtiene la pestaña actualmente activa
   * @returns {Promise<Object|null>}
   */
  async getActiveTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0) return tabs[0];
      
      const lastFocused = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return lastFocused && lastFocused.length > 0 ? lastFocused[0] : null;
    } catch (err) {
      console.warn('TabService: Error al consultar pestaña activa:', err);
      return null;
    }
  },

  /**
   * Determina si una URL permite inyección de scripts
   * @param {string} url 
   * @returns {boolean}
   */
  isInjectableUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const forbiddenPrefixes = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'view-source:',
      'devtools://'
    ];
    return !forbiddenPrefixes.some(prefix => url.startsWith(prefix));
  },

  /**
   * Asegura que los scripts y estilos de MultiCopy estén inyectados y listos en la pestaña
   * @param {number} tabId 
   * @returns {Promise<boolean>} Retorna true si los scripts están listos
   */
  async ensureContentScriptsInjected(tabId) {
    if (!tabId) return false;

    return new Promise((resolve) => {
      const pingAction = typeof ACTIONS !== 'undefined' ? ACTIONS.PING : 'PING';
      
      chrome.tabs.sendMessage(tabId, { action: pingAction }, async (res) => {
        if (chrome.runtime.lastError || !res || res.status !== 'ready') {
          try {
            if (chrome.scripting) {
              await chrome.scripting.insertCSS({
                target: { tabId },
                files: this.CONTENT_STYLES
              });

              await chrome.scripting.executeScript({
                target: { tabId },
                files: this.CONTENT_SCRIPTS
              });

              resolve(true);
              return;
            }
          } catch (err) {
            console.warn('TabService: No se pudo inyectar scripts en la pestaña:', err);
            resolve(false);
            return;
          }
        }
        resolve(true);
      });
    });
  },

  /**
   * Envía un mensaje a la pestaña activa asegurando su inyección previa
   * @param {Object} message 
   * @returns {Promise<any>}
   */
  async sendMessageToActiveTab(message) {
    const tab = await this.getActiveTab();
    if (!tab || !tab.id) {
      throw new Error('No se encontró una pestaña web activa.');
    }

    if (!this.isInjectableUrl(tab.url)) {
      throw new Error('Esta página interna del navegador no permite rellenado de formularios.');
    }

    await this.ensureContentScriptsInjected(tab.id);

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
};

// Exportación universal
if (typeof globalThis !== 'undefined') {
  globalThis.TabService = TabService;
}

if (typeof window !== 'undefined') {
  window.TabService = TabService;
}
