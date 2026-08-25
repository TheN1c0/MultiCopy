/**
 * MultiCopy - Main View Controller
 * Gestiona el portapapeles, selector de perfil activo, previsualización y acción de rellenar.
 */

const MainViewController = {
  app: null,
  clipboardData: { columns: [], isMultipleRows: false, totalRows: 0 },
  feedbackTimer: null,

  // Referencias DOM
  dom: {},

  init(app) {
    this.app = app;
    this.cacheDom();
    this.bindEvents();
    this.initShortcutDisplay();
  },

  cacheDom() {
    this.dom = {
      selectProfile: document.getElementById('select-profile'),
      btnConfigCurrentProfile: document.getElementById('btn-config-current-profile'),
      btnManageProfiles: document.getElementById('btn-manage-profiles'),
      btnRefreshClipboard: document.getElementById('btn-refresh-clipboard'),
      btnPasteClipboard: document.getElementById('btn-paste-clipboard'),
      clipboardStatusDot: document.getElementById('clipboard-status-dot'),
      clipboardStatusText: document.getElementById('clipboard-status-text'),
      clipboardWarning: document.getElementById('clipboard-warning'),
      clipboardEmptyHint: document.getElementById('clipboard-empty-hint'),
      previewContainer: document.getElementById('preview-container'),
      previewColCount: document.getElementById('preview-col-count'),
      previewList: document.getElementById('preview-list'),
      btnFillForm: document.getElementById('btn-fill-form'),
      fillFeedback: document.getElementById('fill-feedback'),
      shortcutDisplay: document.getElementById('shortcut-display'),
      btnConfigureShortcut: document.getElementById('btn-configure-shortcut')
    };
  },

  bindEvents() {
    // Cambio de perfil en el select principal
    this.dom.selectProfile.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        await Storage.setActiveProfileId(selectedId);
        await this.app.reloadState();
        this.renderPreview();
      }
    });

    this.dom.btnConfigCurrentProfile.addEventListener('click', () => {
      const active = this.app.getActiveProfile();
      if (active) {
        this.app.openFieldsView(active.id);
      } else {
        this.app.openProfilesView();
      }
    });

    this.dom.btnManageProfiles.addEventListener('click', () => {
      this.app.openProfilesView();
    });

    this.dom.btnRefreshClipboard.addEventListener('click', () => this.refreshClipboardState());
    if (this.dom.btnPasteClipboard) {
      this.dom.btnPasteClipboard.addEventListener('click', () => this.refreshClipboardState());
    }

    // Permitir pegar directamente con Ctrl+V
    document.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text) {
        this.handleRawClipboardText(text);
      }
    });

    this.dom.btnFillForm.addEventListener('click', () => this.handleFillForm());

    this.dom.fillFeedback.addEventListener('click', () => {
      if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
      this.dom.fillFeedback.textContent = '';
    });

    if (this.dom.btnConfigureShortcut) {
      this.dom.btnConfigureShortcut.addEventListener('click', () => {
        const isEdge = navigator.userAgent.includes('Edg/');
        const shortcutsUrl = isEdge ? 'edge://extensions/shortcuts' : 'chrome://extensions/shortcuts';
        chrome.tabs.create({ url: shortcutsUrl });
      });
    }
  },

  initShortcutDisplay() {
    const shortcutCmdName = typeof COMMANDS !== 'undefined' ? COMMANDS.FILL_FORM_SHORTCUT : 'fill-form-shortcut';
    if (chrome.commands && chrome.commands.getAll && this.dom.shortcutDisplay) {
      chrome.commands.getAll((commands) => {
        const fillCmd = commands.find(c => c.name === shortcutCmdName);
        if (fillCmd && fillCmd.shortcut) {
          this.dom.shortcutDisplay.textContent = fillCmd.shortcut;
        }
      });
    }
  },

  async refreshClipboardState() {
    this.dom.clipboardStatusDot.className = 'status-dot dot-gray';
    this.dom.clipboardStatusText.textContent = 'Leyendo portapapeles...';

    try {
      const text = await ClipboardParser.readClipboard();
      this.handleRawClipboardText(text);
    } catch (err) {
      console.warn('Error leyendo portapapeles:', err);
      this.dom.clipboardStatusDot.className = 'status-dot dot-gray';
      this.dom.clipboardStatusText.textContent = 'Haz clic en "Actualizar" o pega con Ctrl+V';
    }
  },

  handleRawClipboardText(text) {
    this.clipboardData = ClipboardParser.parseExcelText(text);

    if (this.clipboardData.columns.length === 0) {
      this.dom.clipboardStatusDot.className = 'status-dot dot-gray';
      this.dom.clipboardStatusText.textContent = 'Portapapeles vacío o sin fila de Excel';
      this.dom.clipboardEmptyHint.classList.remove('hidden');
      this.dom.previewContainer.classList.add('hidden');
      this.dom.clipboardWarning.classList.add('hidden');
      this.dom.btnFillForm.disabled = true;
    } else {
      this.dom.clipboardStatusDot.className = 'status-dot dot-green';
      this.dom.clipboardStatusText.textContent = `✓ Fila detectada (${this.clipboardData.columns.length} datos)`;
      this.dom.clipboardEmptyHint.classList.add('hidden');
      this.dom.previewContainer.classList.remove('hidden');
      this.dom.btnFillForm.disabled = false;

      if (this.clipboardData.isMultipleRows) {
        this.dom.clipboardWarning.classList.remove('hidden');
        this.dom.clipboardStatusDot.className = 'status-dot dot-amber';
      } else {
        this.dom.clipboardWarning.classList.add('hidden');
      }

      this.renderPreview();
    }
  },

  renderProfileSelect(profiles, activeProfile) {
    this.dom.selectProfile.innerHTML = '';
    if (!profiles || profiles.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin perfiles creados';
      this.dom.selectProfile.appendChild(opt);
      return;
    }

    profiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.domain ? ` (${p.domain})` : '');
      if (activeProfile && p.id === activeProfile.id) {
        opt.selected = true;
      }
      this.dom.selectProfile.appendChild(opt);
    });
  },

  renderPreview() {
    const activeProfile = this.app.getActiveProfile();
    this.dom.previewColCount.textContent = `${this.clipboardData.columns.length} datos`;
    this.dom.previewList.innerHTML = '';

    const fields = activeProfile ? (activeProfile.fields || []) : [];

    this.clipboardData.columns.forEach((val, idx) => {
      const item = document.createElement('div');
      item.className = 'preview-item';

      const mappedField = fields.find(f => parseInt(f.columnIndex, 10) === idx);
      const colLabel = mappedField ? `${mappedField.name} (Dato #${idx + 1})` : `Dato #${idx + 1}`;

      const colNameSpan = document.createElement('span');
      colNameSpan.className = 'preview-col-name';
      colNameSpan.title = colLabel;
      colNameSpan.textContent = colLabel;

      const colValSpan = document.createElement('span');
      colValSpan.className = 'preview-col-val';
      colValSpan.title = val || '';
      colValSpan.textContent = val || '<vacío>';

      item.appendChild(colNameSpan);
      item.appendChild(colValSpan);
      this.dom.previewList.appendChild(item);
    });
  },

  async handleFillForm() {
    const activeProfile = this.app.getActiveProfile();

    if (!activeProfile) {
      this.showFeedback('Por favor selecciona un perfil primero', true);
      return;
    }

    if (!activeProfile.fields || activeProfile.fields.length === 0) {
      this.showFeedback('Este perfil no tiene campos configurados. Haz clic en "Configurar"', true);
      return;
    }

    if (this.clipboardData.columns.length === 0) {
      this.showFeedback('No hay datos en el portapapeles', true);
      return;
    }

    this.dom.btnFillForm.disabled = true;
    this.dom.btnFillForm.textContent = '⏳ Rellenando...';

    const activeTab = await this.app.getActiveTab();
    if (!activeTab || !activeTab.id) {
      this.showFeedback('No se encontró una pestaña activa para rellenar', true);
      this.resetFillButton();
      return;
    }

    try {
      await this.app.ensureContentScriptsInjected(activeTab.id);

      const fillAction = typeof ACTIONS !== 'undefined' ? ACTIONS.FILL_FORM : 'FILL_FORM';
      chrome.tabs.sendMessage(activeTab.id, {
        action: fillAction,
        fields: activeProfile.fields,
        columns: this.clipboardData.columns
      }, (response) => {
        if (chrome.runtime.lastError) {
          this.showFeedback('Error: La página no permite inyección o necesita ser recargada', true);
        } else if (response && response.results) {
          const { filled, total, errors } = response.results;
          if (errors && errors.length > 0) {
            if (filled > 0) {
              this.showFeedback(`⚠️ ${filled}/${total} rellenos. (${errors[0]})`, true);
            } else {
              this.showFeedback(`⚠️ Error: ${errors[0]}`, true);
            }
          } else {
            this.showFeedback(`✓ ¡Éxito! Se rellenaron los ${filled} campos.`);
          }
        }
        this.resetFillButton();
      });
    } catch (err) {
      this.showFeedback(`Error: ${err.message}`, true);
      this.resetFillButton();
    }
  },

  resetFillButton() {
    this.dom.btnFillForm.disabled = false;
    this.dom.btnFillForm.textContent = 'RELLENAR FORMULARIO';
  },

  showFeedback(msg, isError = false, duration = isError ? 15000 : 7000) {
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.dom.fillFeedback.textContent = msg;
    this.dom.fillFeedback.style.color = isError ? 'var(--accent-stamp, #d46b5a)' : 'var(--accent-green, #5a8a6e)';
    this.dom.fillFeedback.style.cursor = 'pointer';
    this.dom.fillFeedback.title = 'Haz clic para descartar';
    this.feedbackTimer = setTimeout(() => {
      this.dom.fillFeedback.textContent = '';
    }, duration);
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.MainViewController = MainViewController;
}
