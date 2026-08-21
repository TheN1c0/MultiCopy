/**
 * MultiCopy - Visual Element Picker
 * Permite seleccionar visualmente cualquier campo web sin necesidad de inspeccionar HTML.
 */

const ElementPicker = {
  isActive: false,
  currentContext: null,
  highlightedElement: null,
  bannerEl: null,
  tooltipEl: null,

  /**
   * Inicia el modo de selección visual
   * @param {Object} context { profileId, fieldId, fieldName, columnIndex }
   */
  start(context) {
    if (this.isActive) this.stop();

    this.isActive = true;
    this.currentContext = context;

    this.createBanner();
    this.createTooltip();

    // Event listeners con captura para interceptar antes que la página
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnClick = this.onClick.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    document.addEventListener('mousemove', this.boundOnMouseMove, true);
    document.addEventListener('click', this.boundOnClick, true);
    document.addEventListener('keydown', this.boundOnKeyDown, true);
  },

  /**
   * Detiene el modo de selección y limpia el DOM
   */
  stop() {
    this.isActive = false;
    this.currentContext = null;

    if (this.highlightedElement) {
      this.highlightedElement.classList.remove('multicopy-highlight-hover');
      this.highlightedElement = null;
    }

    if (this.bannerEl) {
      this.bannerEl.remove();
      this.bannerEl = null;
    }

    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }

    document.removeEventListener('mousemove', this.boundOnMouseMove, true);
    document.removeEventListener('click', this.boundOnClick, true);
    document.removeEventListener('keydown', this.boundOnKeyDown, true);
  },

  createBanner() {
    this.bannerEl = document.createElement('div');
    this.bannerEl.id = 'multicopy-picker-banner';
    
    const label = this.currentContext?.fieldName || `Columna ${this.currentContext?.columnIndex + 1 || ''}`;
    
    this.bannerEl.innerHTML = `
      <span class="multicopy-badge">MultiCopy</span>
      <span>Haz clic en el campo que quieres rellenar: <span class="multicopy-target-info">${label}</span></span>
      <button class="multicopy-cancel-btn" id="multicopy-cancel-pick">Cancelar (ESC)</button>
    `;

    document.body.appendChild(this.bannerEl);

    document.getElementById('multicopy-cancel-pick')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stop();
      this.showToast('Elección de campo cancelada');
      this.requestReopenPopup();
    });
  },

  createTooltip() {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.id = 'multicopy-element-tooltip';
    document.body.appendChild(this.tooltipEl);
  },

  onMouseMove(e) {
    if (!this.isActive) return;

    // Ignorar si el cursor está sobre el banner o tooltip
    if (this.bannerEl && this.bannerEl.contains(e.target)) return;

    let target = e.target;

    // Si el usuario pasa sobre un label, intentar encontrar el input correspondiente
    if (target.tagName.toLowerCase() === 'label') {
      if (target.htmlFor) {
        const linked = document.getElementById(target.htmlFor);
        if (linked) target = linked;
      } else {
        const inner = target.querySelector('input, select, textarea');
        if (inner) target = inner;
      }
    }

    if (this.highlightedElement !== target) {
      if (this.highlightedElement) {
        this.highlightedElement.classList.remove('multicopy-highlight-hover');
      }
      this.highlightedElement = target;
      this.highlightedElement.classList.add('multicopy-highlight-hover');
    }

    // Actualizar tooltip con indicación clara
    if (this.tooltipEl) {
      const friendlyName = SelectorGenerator.getFriendlyName(target);
      this.tooltipEl.innerText = `👉 Haz clic para elegir: "${friendlyName}"`;
      this.tooltipEl.style.display = 'block';
      this.tooltipEl.style.left = `${Math.min(e.clientX + 15, window.innerWidth - 220)}px`;
      this.tooltipEl.style.top = `${e.clientY + 15}px`;
    }
  },

  async onClick(e) {
    if (!this.isActive) return;

    // Si hace clic en el botón de cancelar del banner
    if (this.bannerEl && this.bannerEl.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    let target = e.target;

    // Si hizo clic en un label con for o que envuelve a un input
    if (target.tagName.toLowerCase() === 'label') {
      if (target.htmlFor) {
        const linked = document.getElementById(target.htmlFor);
        if (linked) target = linked;
      } else {
        const inner = target.querySelector('input, select, textarea');
        if (inner) target = inner;
      }
    }

    // Generar selector y nombre amigable
    const selector = SelectorGenerator.getSelector(target);
    const webFieldName = SelectorGenerator.getFriendlyName(target);

    if (!selector) {
      this.showToast('No se pudo identificar este elemento en la página', true);
      this.stop();
      this.requestReopenPopup();
      return;
    }

    // Guardar en el perfil
    const ctx = this.currentContext;
    if (ctx && ctx.profileId) {
      await this.saveSelectedField(ctx.profileId, ctx.fieldId, {
        name: ctx.fieldName || webFieldName,
        webFieldName: webFieldName,
        columnIndex: ctx.columnIndex,
        selector: selector
      });

      this.showToast(`✓ Campo elegido: "${webFieldName}" vinculado a "${ctx.fieldName || 'Columna ' + (ctx.columnIndex + 1)}"`);
    }

    this.stop();
    this.requestReopenPopup();
  },

  onKeyDown(e) {
    if (e.key === 'Escape') {
      this.stop();
      this.showToast('Elección de campo cancelada');
      this.requestReopenPopup();
    }
  },

  /**
   * Solicita al background service worker reabrir el popup de la extensión
   */
  requestReopenPopup() {
    try {
      chrome.runtime.sendMessage({ action: 'REOPEN_POPUP' });
    } catch (err) {
      console.warn('MultiCopy: No se pudo enviar mensaje para reabrir popup:', err);
    }
  },

  /**
   * Guarda o actualiza el campo en el perfil correspondiente
   */
  async saveSelectedField(profileId, fieldId, fieldData) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['multicopy_profiles'], (res) => {
        let profiles = res.multicopy_profiles || [];
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex !== -1) {
          const profile = profiles[profileIndex];
          profile.fields = profile.fields || [];

          if (fieldId) {
            // Actualizar campo existente
            const fieldIdx = profile.fields.findIndex(f => f.id === fieldId);
            if (fieldIdx !== -1) {
              profile.fields[fieldIdx] = {
                ...profile.fields[fieldIdx],
                ...fieldData
              };
            } else {
              profile.fields.push({ id: fieldId, ...fieldData });
            }
          } else {
            // Nuevo campo
            profile.fields.push({
              id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              ...fieldData
            });
          }

          chrome.storage.local.set({ multicopy_profiles: profiles }, resolve);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Muestra un mensaje Toast en la página web
   */
  showToast(message, isError = false, duration = isError ? 15000 : 7000) {
    const existing = document.getElementById('multicopy-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'multicopy-toast';
    if (isError) toast.classList.add('error');
    toast.style.cursor = 'pointer';
    toast.title = 'Haz clic para cerrar';
    toast.innerText = message;

    toast.addEventListener('click', () => {
      toast.remove();
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.parentElement) {
        toast.remove();
      }
    }, duration);
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ElementPicker = ElementPicker;
}
