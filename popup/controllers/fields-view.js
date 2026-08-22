/**
 * MultiCopy - Fields View Controller
 * Gestiona la configuración, vinculación visual, edición y eliminación de campos del perfil.
 * Soporta conversión de columnas entre letras (A, B, C...) y números (1, 2, 3...).
 */

const FieldsViewController = {
  app: null,
  currentProfileId: null,
  currentColumnIndex: 0,
  useColumnLetters: true,
  dom: {},

  init(app) {
    this.app = app;
    this.cacheDom();
    this.bindEvents();
  },

  cacheDom() {
    this.dom = {
      btnBackFromFields: document.getElementById('btn-back-from-fields'),
      fieldsViewTitle: document.getElementById('fields-view-title'),
      inputProfileDomain: document.getElementById('input-profile-domain'),
      btnSaveDomain: document.getElementById('btn-save-domain'),
      fieldFormTitle: document.getElementById('field-form-title'),
      editFieldId: document.getElementById('edit-field-id'),
      inputFieldName: document.getElementById('input-field-name'),
      inputColumnDisplay: document.getElementById('input-column-display'),
      inputColumnIndex: document.getElementById('input-column-index'),
      btnStepColUp: document.getElementById('btn-step-col-up'),
      btnStepColDown: document.getElementById('btn-step-col-down'),
      chkUseColumnLetters: document.getElementById('chk-use-column-letters'),
      btnStartPickElement: document.getElementById('btn-start-pick-element'),
      inputFieldSelector: document.getElementById('input-field-selector'),
      btnCancelEditField: document.getElementById('btn-cancel-edit-field'),
      btnSaveField: document.getElementById('btn-save-field'),
      fieldsCountBadge: document.getElementById('fields-count-badge'),
      fieldsList: document.getElementById('fields-list')
    };
  },

  bindEvents() {
    this.dom.btnBackFromFields.addEventListener('click', async () => {
      await Storage.clearLastViewState();
      await this.app.reloadState();
      this.app.showView('main');
    });

    this.dom.btnSaveDomain.addEventListener('click', () => this.handleSaveDomain());
    this.dom.btnSaveField.addEventListener('click', () => this.handleSaveField());

    this.dom.btnCancelEditField.addEventListener('click', () => {
      const profile = this.getCurrentProfile();
      this.resetFieldEditorForm(profile);
    });

    // Steppers de columna ▲ / ▼
    if (this.dom.btnStepColUp) {
      this.dom.btnStepColUp.addEventListener('click', () => this.stepColumn(1));
    }
    if (this.dom.btnStepColDown) {
      this.dom.btnStepColDown.addEventListener('click', () => this.stepColumn(-1));
    }

    // Input directo de columna
    if (this.dom.inputColumnDisplay) {
      this.dom.inputColumnDisplay.addEventListener('input', (e) => {
        this.handleColumnInput(e.target.value);
      });

      this.dom.inputColumnDisplay.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.stepColumn(1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.stepColumn(-1);
        }
      });
    }

    // Checkbox de conversión de columnas a letras
    if (this.dom.chkUseColumnLetters) {
      this.dom.chkUseColumnLetters.addEventListener('change', (e) => {
        this.useColumnLetters = e.target.checked;
        this.updateColumnDisplay();
        const profile = this.getCurrentProfile();
        if (profile) this.renderFieldsList(profile);
      });
    }

    // Botón Elegir campo (Inicia selector visual con la columna y nombre configurados)
    this.dom.btnStartPickElement.addEventListener('click', () => {
      const colIdx = this.currentColumnIndex;
      const colLabel = this.useColumnLetters 
        ? `Columna ${FieldModel.indexToLetter(colIdx)}`
        : `Dato #${colIdx + 1}`;

      const name = this.dom.inputFieldName.value.trim() || colLabel;
      this.triggerVisualPicker(this.currentProfileId, this.dom.editFieldId.value || null, name, colIdx);
    });
  },

  getCurrentProfile() {
    const profiles = this.app.getProfiles();
    return profiles.find(p => p.id === this.currentProfileId) || null;
  },

  /**
   * Actualiza el valor mostrado en el input de columna según el modo (letras o números)
   */
  updateColumnDisplay() {
    if (!this.dom.inputColumnDisplay) return;

    if (this.useColumnLetters) {
      const letter = typeof FieldModel !== 'undefined' 
        ? FieldModel.indexToLetter(this.currentColumnIndex)
        : String.fromCharCode(65 + this.currentColumnIndex);
      this.dom.inputColumnDisplay.value = letter;
    } else {
      this.dom.inputColumnDisplay.value = String(this.currentColumnIndex + 1);
    }

    if (this.dom.inputColumnIndex) {
      this.dom.inputColumnIndex.value = this.currentColumnIndex;
    }
  },

  /**
   * Maneja el cambio manual de texto en el input de columna
   */
  handleColumnInput(rawVal) {
    if (!rawVal || rawVal.trim() === '') {
      this.currentColumnIndex = 0;
      this.updateColumnDisplay();
      return;
    }

    if (this.useColumnLetters) {
      if (typeof FieldModel !== 'undefined') {
        this.currentColumnIndex = FieldModel.letterToIndex(rawVal);
      } else {
        this.currentColumnIndex = Math.max(0, rawVal.toUpperCase().charCodeAt(0) - 65);
      }
    } else {
      const num = parseInt(rawVal, 10);
      this.currentColumnIndex = isNaN(num) ? 0 : Math.max(0, num - 1);
    }

    if (this.dom.inputColumnIndex) {
      this.dom.inputColumnIndex.value = this.currentColumnIndex;
    }
  },

  /**
   * Incrementa o disminuye el índice de columna
   */
  stepColumn(delta) {
    this.currentColumnIndex = Math.max(0, this.currentColumnIndex + delta);
    this.updateColumnDisplay();
  },

  async render(profileId) {
    this.currentProfileId = profileId;
    const profile = this.getCurrentProfile();
    if (!profile) return;

    await Storage.saveLastViewState({ view: 'fields', profileId });

    this.dom.fieldsViewTitle.textContent = `Campos: ${profile.name}`;
    this.dom.inputProfileDomain.value = profile.domain || '';
    this.resetFieldEditorForm(profile);
    this.renderFieldsList(profile);
  },

  renderFieldsList(profile) {
    const fields = profile.fields || [];
    this.dom.fieldsCountBadge.textContent = `${fields.length} campos`;
    this.dom.fieldsList.innerHTML = '';

    if (fields.length === 0) {
      this.dom.fieldsList.innerHTML = '<p class="hint-box">Aún no hay campos configurados para este perfil.</p>';
      return;
    }

    fields.forEach((field, idx) => {
      const card = document.createElement('div');
      card.className = 'list-item-card';

      const colIdx = parseInt(field.columnIndex, 10) || 0;
      const colDisplay = this.useColumnLetters && typeof FieldModel !== 'undefined'
        ? FieldModel.indexToLetter(colIdx)
        : (colIdx + 1);

      const statusBadge = field.selector 
        ? '<span style="color:var(--success); font-weight: 600;">✓ Vinculado</span>' 
        : '<span style="color:var(--warning); font-weight: 600;">Sin vincular</span>';

      card.innerHTML = `
        <div class="list-item-info">
          <span class="list-item-title">${field.name || `Campo ${idx + 1}`}</span>
          <span class="list-item-sub">Dato de la fila: <strong>${colDisplay}</strong> · ${statusBadge}</span>
        </div>
        <div class="list-item-actions">
          <button class="btn-accent btn-sm btn-pill btn-pick-row" data-id="${field.id}" title="Volver a vincular" aria-label="Volver a vincular">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          </button>
          <button class="btn-secondary btn-sm btn-pill btn-edit-field" data-id="${field.id}" title="Editar" aria-label="Editar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-danger-ghost btn-sm btn-delete-field" data-id="${field.id}" title="Eliminar" aria-label="Eliminar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      card.querySelector('.btn-pick-row').addEventListener('click', () => {
        this.triggerVisualPicker(profile.id, field.id, field.name, field.columnIndex);
      });

      card.querySelector('.btn-edit-field').addEventListener('click', () => {
        this.dom.editFieldId.value = field.id;
        this.dom.inputFieldName.value = field.name || '';
        this.currentColumnIndex = parseInt(field.columnIndex, 10) || 0;
        this.updateColumnDisplay();
        if (this.dom.inputFieldSelector) {
          this.dom.inputFieldSelector.value = field.selector || '';
        }
        this.dom.fieldFormTitle.textContent = 'Editar campo';
        this.dom.btnCancelEditField.classList.remove('hidden');
      });

      card.querySelector('.btn-delete-field').addEventListener('click', async () => {
        profile.fields = profile.fields.filter(f => f.id !== field.id);
        await Storage.saveProfile(profile);
        await this.app.reloadState();
        this.renderFieldsList(profile);
      });

      this.dom.fieldsList.appendChild(card);
    });
  },

  resetFieldEditorForm(profile) {
    this.dom.editFieldId.value = '';
    this.dom.inputFieldName.value = '';
    // Sugerir la siguiente posición disponible
    this.currentColumnIndex = profile?.fields?.length || 0;
    this.updateColumnDisplay();
    if (this.dom.inputFieldSelector) {
      this.dom.inputFieldSelector.value = '';
    }
    this.dom.fieldFormTitle.textContent = 'Agregar nuevo campo';
    this.dom.btnCancelEditField.classList.add('hidden');
  },

  async handleSaveField() {
    const profile = this.getCurrentProfile();
    if (!profile) return;

    const colIdx = this.currentColumnIndex;
    const defaultLabel = this.useColumnLetters && typeof FieldModel !== 'undefined'
      ? `Columna ${FieldModel.indexToLetter(colIdx)}`
      : `Dato #${colIdx + 1}`;

    const name = this.dom.inputFieldName.value.trim() || defaultLabel;
    const selector = this.dom.inputFieldSelector ? this.dom.inputFieldSelector.value.trim() : '';
    const fieldId = this.dom.editFieldId.value;

    const fieldData = typeof FieldModel !== 'undefined'
      ? FieldModel.create({ id: fieldId || undefined, name, columnIndex: colIdx, selector })
      : { id: fieldId || ('f_' + Date.now()), name, columnIndex: colIdx, selector };

    profile.fields = profile.fields || [];

    if (fieldId) {
      const idx = profile.fields.findIndex(f => f.id === fieldId);
      if (idx !== -1) {
        profile.fields[idx] = { ...profile.fields[idx], ...fieldData };
      }
    } else {
      profile.fields.push(fieldData);
    }

    await Storage.saveProfile(profile);
    await this.app.reloadState();
    this.resetFieldEditorForm(profile);
    this.renderFieldsList(profile);
  },

  async handleSaveDomain() {
    const profile = this.getCurrentProfile();
    if (!profile) return;

    profile.domain = this.dom.inputProfileDomain.value.trim();
    await Storage.saveProfile(profile);
    await this.app.reloadState();
    alert('✓ Dominio guardado');
  },

  async triggerVisualPicker(profileId, fieldId, fieldName, columnIndex) {
    const activeTab = await this.app.getActiveTab();
    if (!activeTab || !activeTab.id) {
      alert('No se detectó una pestaña web activa.');
      return;
    }

    try {
      await Storage.saveLastViewState({
        view: 'fields',
        profileId: profileId
      });

      await this.app.ensureContentScriptsInjected(activeTab.id);

      const colIdx = columnIndex !== undefined ? columnIndex : this.currentColumnIndex;
      const defaultLabel = this.useColumnLetters && typeof FieldModel !== 'undefined'
        ? `Columna ${FieldModel.indexToLetter(colIdx)}`
        : `Dato #${colIdx + 1}`;

      const startPickAction = typeof ACTIONS !== 'undefined' ? ACTIONS.START_PICKER : 'START_PICKER';
      chrome.tabs.sendMessage(activeTab.id, {
        action: startPickAction,
        context: {
          profileId,
          fieldId,
          fieldName: fieldName || this.dom.inputFieldName.value.trim() || defaultLabel,
          columnIndex: colIdx
        }
      }, () => {
        window.close();
      });
    } catch (e) {
      alert('Error al iniciar el selector en la página: ' + e.message);
    }
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.FieldsViewController = FieldsViewController;
}
