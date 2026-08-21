/**
 * MultiCopy - Popup Controller
 * Controla la interacción del usuario, navegación de vistas, portapapeles y comunicación con la pestaña.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Estado local
  let currentProfiles = [];
  let currentActiveProfile = null;
  let clipboardData = { columns: [], isMultipleRows: false, totalRows: 0 };
  let currentEditingProfileId = null;

  // Elementos DOM - Navegación de Vistas
  const viewMain = document.getElementById('view-main');
  const viewProfiles = document.getElementById('view-profiles');
  const viewFields = document.getElementById('view-fields');

  // Elementos DOM - Vista Principal
  const selectProfile = document.getElementById('select-profile');
  const btnConfigCurrentProfile = document.getElementById('btn-config-current-profile');
  const btnManageProfiles = document.getElementById('btn-manage-profiles');
  const btnRefreshClipboard = document.getElementById('btn-refresh-clipboard');
  const btnPasteClipboard = document.getElementById('btn-paste-clipboard');
  const clipboardStatusDot = document.getElementById('clipboard-status-dot');
  const clipboardStatusText = document.getElementById('clipboard-status-text');
  const clipboardWarning = document.getElementById('clipboard-warning');
  const clipboardEmptyHint = document.getElementById('clipboard-empty-hint');
  const previewContainer = document.getElementById('preview-container');
  const previewColCount = document.getElementById('preview-col-count');
  const previewList = document.getElementById('preview-list');
  const btnFillForm = document.getElementById('btn-fill-form');
  const fillFeedback = document.getElementById('fill-feedback');

  // Elementos DOM - Gestión de Perfiles
  const btnBackFromProfiles = document.getElementById('btn-back-from-profiles');
  const inputNewProfileName = document.getElementById('input-new-profile-name');
  const btnCreateProfile = document.getElementById('btn-create-profile');
  const profilesList = document.getElementById('profiles-list');

  // Elementos DOM - Configuración de Campos
  const btnBackFromFields = document.getElementById('btn-back-from-fields');
  const fieldsViewTitle = document.getElementById('fields-view-title');
  const inputProfileDomain = document.getElementById('input-profile-domain');
  const btnSaveDomain = document.getElementById('btn-save-domain');
  const fieldFormTitle = document.getElementById('field-form-title');
  const editFieldId = document.getElementById('edit-field-id');
  const inputFieldName = document.getElementById('input-field-name');
  const inputColumnIndex = document.getElementById('input-column-index');
  const btnStartPickElement = document.getElementById('btn-start-pick-element');
  const inputFieldSelector = document.getElementById('input-field-selector');
  const btnCancelEditField = document.getElementById('btn-cancel-edit-field');
  const btnSaveField = document.getElementById('btn-save-field');
  const fieldsCountBadge = document.getElementById('fields-count-badge');
  const fieldsList = document.getElementById('fields-list');

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  await initializeApp();

  async function initializeApp() {
    await ensureDefaultProfiles();
    await loadProfilesAndMatchDomain();
    await refreshClipboardState();
    setupEventListeners();
  }

  /**
   * Crea un perfil inicial de ejemplo si no existe ninguno
   */
  async function ensureDefaultProfiles() {
    const profiles = await Storage.getProfiles();
    if (profiles.length === 0) {
      const defaultProfile = {
        id: 'prof_default_1',
        name: 'Formulario de Prueba',
        domain: '',
        fields: [
          { id: 'f1', name: 'RUT', columnIndex: 0, selector: '#rut', webFieldName: 'RUT' },
          { id: 'f2', name: 'Nombre', columnIndex: 1, selector: '#nombre', webFieldName: 'Nombre' },
          { id: 'f3', name: 'Apellido', columnIndex: 2, selector: '#apellido', webFieldName: 'Apellido' },
          { id: 'f4', name: 'Email', columnIndex: 3, selector: '#email', webFieldName: 'Correo Electrónico' },
          { id: 'f5', name: 'Teléfono', columnIndex: 4, selector: '#telefono', webFieldName: 'Teléfono' },
          { id: 'f6', name: 'Fecha Nacimiento', columnIndex: 5, selector: '#fecha_nacimiento', webFieldName: 'Fecha' },
          { id: 'f7', name: 'Sexo / Género', columnIndex: 6, selector: '#sexo', webFieldName: 'Sexo' },
          { id: 'f8', name: 'Observaciones', columnIndex: 7, selector: '#observaciones', webFieldName: 'Observaciones' },
          { id: 'f9', name: 'Acepta Términos', columnIndex: 8, selector: '#terminos', webFieldName: 'Términos' },
          { id: 'f10', name: 'Tipo Contrato', columnIndex: 9, selector: 'input[name="contrato"]', webFieldName: 'Contrato' }
        ]
      };
      await Storage.saveProfile(defaultProfile);
    }
  }

  /**
   * Carga los perfiles y detecta si el dominio actual coincide con alguno
   */
  async function loadProfilesAndMatchDomain() {
    currentProfiles = await Storage.getProfiles();
    
    // Obtener información de la pestaña activa
    const activeTab = await getActiveTab();
    if (activeTab && activeTab.url) {
      try {
        const urlObj = new URL(activeTab.url);
        const matchingProfile = currentProfiles.find(p => p.domain && (urlObj.hostname.includes(p.domain) || activeTab.url.includes(p.domain)));
        if (matchingProfile) {
          await Storage.setActiveProfileId(matchingProfile.id);
        }
      } catch (e) {
        // url especial o file
      }
    }

    currentActiveProfile = await Storage.getActiveProfile();
    renderProfileSelect();
  }

  function renderProfileSelect() {
    selectProfile.innerHTML = '';
    if (currentProfiles.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin perfiles creados';
      selectProfile.appendChild(opt);
      return;
    }

    currentProfiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.domain ? ` (${p.domain})` : '');
      if (currentActiveProfile && p.id === currentActiveProfile.id) {
        opt.selected = true;
      }
      selectProfile.appendChild(opt);
    });
  }

  // ==========================================
  // MANEJO DE PORTAPAPELES
  // ==========================================
  async function refreshClipboardState() {
    clipboardStatusDot.className = 'status-dot dot-gray';
    clipboardStatusText.textContent = 'Leyendo portapapeles...';

    try {
      const text = await ClipboardParser.readClipboard();
      handleRawClipboardText(text);
    } catch (err) {
      console.warn('Error leyendo portapapeles:', err);
      clipboardStatusDot.className = 'status-dot dot-gray';
      clipboardStatusText.textContent = 'Haz clic en "Actualizar" o pega con Ctrl+V';
    }
  }

  function handleRawClipboardText(text) {
    clipboardData = ClipboardParser.parseExcelText(text);

    if (clipboardData.columns.length === 0) {
      clipboardStatusDot.className = 'status-dot dot-gray';
      clipboardStatusText.textContent = 'Portapapeles vacío o sin fila de Excel';
      clipboardEmptyHint.classList.remove('hidden');
      previewContainer.classList.add('hidden');
      clipboardWarning.classList.add('hidden');
      btnFillForm.disabled = true;
    } else {
      clipboardStatusDot.className = 'status-dot dot-green';
      clipboardStatusText.textContent = `✓ Fila detectada (${clipboardData.columns.length} columnas)`;
      clipboardEmptyHint.classList.add('hidden');
      previewContainer.classList.remove('hidden');
      btnFillForm.disabled = false;

      if (clipboardData.isMultipleRows) {
        clipboardWarning.classList.remove('hidden');
        clipboardStatusDot.className = 'status-dot dot-amber';
      } else {
        clipboardWarning.classList.add('hidden');
      }

      renderPreview();
    }
  }

  function renderPreview() {
    previewColCount.textContent = `${clipboardData.columns.length} columnas`;
    previewList.innerHTML = '';

    const fields = currentActiveProfile ? (currentActiveProfile.fields || []) : [];

    clipboardData.columns.forEach((val, idx) => {
      const item = document.createElement('div');
      item.className = 'preview-item';

      // Buscar si este índice de columna está configurado en el perfil activo
      const mappedField = fields.find(f => parseInt(f.columnIndex, 10) === idx);
      const colLabel = mappedField ? `${mappedField.name} (Col ${idx + 1})` : `Columna ${idx + 1}`;

      item.innerHTML = `
        <span class="preview-col-name" title="${colLabel}">${colLabel}</span>
        <span class="preview-col-val" title="${val}">${val || '<vacío>'}</span>
      `;
      previewList.appendChild(item);
    });
  }

  // ==========================================
  // RELLENAR FORMULARIO
  // ==========================================
  async function handleFillForm() {
    if (!currentActiveProfile) {
      showFeedback('Por favor selecciona un perfil primero', true);
      return;
    }

    if (!currentActiveProfile.fields || currentActiveProfile.fields.length === 0) {
      showFeedback('Este perfil no tiene campos configurados. Haz clic en "Configurar"', true);
      return;
    }

    if (clipboardData.columns.length === 0) {
      showFeedback('No hay datos en el portapapeles', true);
      return;
    }

    btnFillForm.disabled = true;
    btnFillForm.innerHTML = '⏳ Rellenando...';

    const activeTab = await getActiveTab();
    if (!activeTab || !activeTab.id) {
      showFeedback('No se encontró una pestaña activa para rellenar', true);
      resetFillButton();
      return;
    }

    try {
      // Asegurar que los content scripts estén inyectados
      await ensureContentScriptsInjected(activeTab.id);

      // Enviar mensaje para rellenar formulario
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'FILL_FORM',
        fields: currentActiveProfile.fields,
        columns: clipboardData.columns
      }, (response) => {
        if (chrome.runtime.lastError) {
          showFeedback('Error: La página no permite inyección o necesita ser recargada', true);
        } else if (response && response.results) {
          const { filled, total } = response.results;
          showFeedback(`✓ ¡Éxito! Se rellenaron ${filled} de ${total} campos.`);
        }
        resetFillButton();
      });
    } catch (err) {
      showFeedback(`Error: ${err.message}`, true);
      resetFillButton();
    }
  }

  function resetFillButton() {
    btnFillForm.disabled = false;
    btnFillForm.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> RELLENAR FORMULARIO';
  }

  function showFeedback(msg, isError = false) {
    fillFeedback.textContent = msg;
    fillFeedback.style.color = isError ? 'var(--danger)' : 'var(--success)';
    setTimeout(() => {
      fillFeedback.textContent = '';
    }, 4500);
  }

  // ==========================================
  // GESTIÓN DE VISTAS Y PERFILES
  // ==========================================
  function showView(viewName) {
    [viewMain, viewProfiles, viewFields].forEach(v => v.classList.remove('active'));
    if (viewName === 'main') viewMain.classList.add('active');
    if (viewName === 'profiles') viewProfiles.classList.add('active');
    if (viewName === 'fields') viewFields.classList.add('active');
  }

  async function openProfilesView() {
    currentProfiles = await Storage.getProfiles();
    renderProfilesList();
    showView('profiles');
  }

  function renderProfilesList() {
    profilesList.innerHTML = '';
    if (currentProfiles.length === 0) {
      profilesList.innerHTML = '<p class="hint-box">No hay perfiles creados</p>';
      return;
    }

    currentProfiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'list-item-card';

      const fieldCount = p.fields ? p.fields.length : 0;
      const isActive = currentActiveProfile && p.id === currentActiveProfile.id;

      card.innerHTML = `
        <div class="list-item-info">
          <span class="list-item-title">${p.name} ${isActive ? '<span class="badge" style="margin-left: 6px;">Activo</span>' : ''}</span>
          <span class="list-item-sub">${fieldCount} campos configurados ${p.domain ? `• ${p.domain}` : ''}</span>
        </div>
        <div class="list-item-actions">
          <button class="btn-secondary btn-sm btn-pill btn-edit-profile" data-id="${p.id}" title="Configurar campos">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Campos
          </button>
          <button class="btn-danger-ghost btn-sm btn-delete-profile" data-id="${p.id}" title="Eliminar perfil">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      card.querySelector('.btn-edit-profile').addEventListener('click', () => openFieldsView(p.id));
      card.querySelector('.btn-delete-profile').addEventListener('click', async () => {
        if (confirm(`¿Eliminar el perfil "${p.name}"?`)) {
          await Storage.deleteProfile(p.id);
          currentProfiles = await Storage.getProfiles();
          currentActiveProfile = await Storage.getActiveProfile();
          renderProfilesList();
          renderProfileSelect();
        }
      });

      profilesList.appendChild(card);
    });
  }

  async function handleCreateProfile() {
    const name = inputNewProfileName.value.trim();
    if (!name) return;

    const newProfile = await Storage.saveProfile({
      name: name,
      domain: '',
      fields: []
    });

    inputNewProfileName.value = '';
    currentProfiles = await Storage.getProfiles();
    currentActiveProfile = newProfile;
    renderProfilesList();
    renderProfileSelect();
    openFieldsView(newProfile.id);
  }

  // ==========================================
  // CONFIGURACIÓN DE CAMPOS
  // ==========================================
  async function openFieldsView(profileId) {
    currentEditingProfileId = profileId;
    const profile = currentProfiles.find(p => p.id === profileId);
    if (!profile) return;

    fieldsViewTitle.textContent = `Campos: ${profile.name}`;
    inputProfileDomain.value = profile.domain || '';
    resetFieldEditorForm();
    renderFieldsList(profile);
    showView('fields');
  }

  function renderFieldsList(profile) {
    const fields = profile.fields || [];
    fieldsCountBadge.textContent = `${fields.length} campos`;
    fieldsList.innerHTML = '';

    if (fields.length === 0) {
      fieldsList.innerHTML = '<p class="hint-box">Aún no hay campos configurados para este perfil.</p>';
      return;
    }

    fields.forEach((field, idx) => {
      const card = document.createElement('div');
      card.className = 'list-item-card';

      const colNum = (parseInt(field.columnIndex, 10) || 0) + 1;
      const statusBadge = field.selector 
        ? '<span style="color:var(--success); font-weight: 600;">✓ Asignado</span>' 
        : '<span style="color:var(--warning); font-weight: 600;">Sin selector</span>';

      card.innerHTML = `
        <div class="list-item-info">
          <span class="list-item-title">${field.name || `Campo ${idx + 1}`}</span>
          <span class="list-item-sub">Columna Excel: <strong>${colNum}</strong> • ${statusBadge}</span>
          <span class="list-item-sub" style="font-family: monospace; font-size: 10px; color: var(--text-muted);">${field.selector || 'Ninguno'}</span>
        </div>
        <div class="list-item-actions">
          <button class="btn-accent btn-sm btn-pill btn-pick-row" data-id="${field.id}" title="Seleccionar en la página">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          </button>
          <button class="btn-secondary btn-sm btn-pill btn-edit-field" data-id="${field.id}" title="Editar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-danger-ghost btn-sm btn-delete-field" data-id="${field.id}" title="Eliminar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      card.querySelector('.btn-pick-row').addEventListener('click', () => {
        triggerVisualPicker(profile.id, field.id, field.name, field.columnIndex);
      });

      card.querySelector('.btn-edit-field').addEventListener('click', () => {
        editFieldId.value = field.id;
        inputFieldName.value = field.name || '';
        inputColumnIndex.value = (parseInt(field.columnIndex, 10) || 0) + 1;
        inputFieldSelector.value = field.selector || '';
        fieldFormTitle.textContent = 'Editar campo';
        btnCancelEditField.classList.remove('hidden');
      });

      card.querySelector('.btn-delete-field').addEventListener('click', async () => {
        profile.fields = profile.fields.filter(f => f.id !== field.id);
        await Storage.saveProfile(profile);
        currentProfiles = await Storage.getProfiles();
        renderFieldsList(profile);
      });

      fieldsList.appendChild(card);
    });
  }

  function resetFieldEditorForm() {
    editFieldId.value = '';
    inputFieldName.value = '';
    // Sugerir la siguiente columna disponible
    const profile = currentProfiles.find(p => p.id === currentEditingProfileId);
    const nextCol = (profile?.fields?.length || 0) + 1;
    inputColumnIndex.value = nextCol;
    inputFieldSelector.value = '';
    fieldFormTitle.textContent = 'Agregar nuevo campo';
    btnCancelEditField.classList.add('hidden');
  }

  async function handleSaveField() {
    const profile = currentProfiles.find(p => p.id === currentEditingProfileId);
    if (!profile) return;

    const name = inputFieldName.value.trim() || `Columna ${inputColumnIndex.value}`;
    const colIdx = Math.max(0, (parseInt(inputColumnIndex.value, 10) || 1) - 1);
    const selector = inputFieldSelector.value.trim();
    const fieldId = editFieldId.value;

    profile.fields = profile.fields || [];

    if (fieldId) {
      const idx = profile.fields.findIndex(f => f.id === fieldId);
      if (idx !== -1) {
        profile.fields[idx] = { ...profile.fields[idx], name, columnIndex: colIdx, selector };
      }
    } else {
      profile.fields.push({
        id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name,
        columnIndex: colIdx,
        selector
      });
    }

    await Storage.saveProfile(profile);
    currentProfiles = await Storage.getProfiles();
    resetFieldEditorForm();
    renderFieldsList(profile);
  }

  /**
   * Inicia el modo de selección visual en la pestaña activa
   */
  async function triggerVisualPicker(profileId, fieldId, fieldName, columnIndex) {
    const activeTab = await getActiveTab();
    if (!activeTab || !activeTab.id) {
      alert('No se detectó una pestaña web activa.');
      return;
    }

    try {
      await ensureContentScriptsInjected(activeTab.id);

      chrome.tabs.sendMessage(activeTab.id, {
        action: 'START_PICKER',
        context: {
          profileId,
          fieldId,
          fieldName: fieldName || inputFieldName.value.trim() || `Columna ${inputColumnIndex.value}`,
          columnIndex: columnIndex !== undefined ? columnIndex : Math.max(0, (parseInt(inputColumnIndex.value, 10) || 1) - 1)
        }
      }, () => {
        // Cerrar el popup para que el usuario pueda hacer clic en el formulario
        window.close();
      });
    } catch (e) {
      alert('Error al iniciar el selector en la página: ' + e.message);
    }
  }

  // ==========================================
  // HELPERS Y EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Cambio de perfil activo en select
    selectProfile.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        await Storage.setActiveProfileId(selectedId);
        currentActiveProfile = await Storage.getActiveProfile();
        renderPreview();
      }
    });

    btnConfigCurrentProfile.addEventListener('click', () => {
      if (currentActiveProfile) {
        openFieldsView(currentActiveProfile.id);
      } else {
        openProfilesView();
      }
    });

    btnManageProfiles.addEventListener('click', openProfilesView);
    btnBackFromProfiles.addEventListener('click', async () => {
      await loadProfilesAndMatchDomain();
      renderPreview();
      showView('main');
    });

    btnBackFromFields.addEventListener('click', async () => {
      await loadProfilesAndMatchDomain();
      renderPreview();
      showView('main');
    });

    btnRefreshClipboard.addEventListener('click', refreshClipboardState);
    if (btnPasteClipboard) {
      btnPasteClipboard.addEventListener('click', refreshClipboardState);
    }
    
    // Permitir pegar directamente con Ctrl+V en el popup
    document.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text) {
        handleRawClipboardText(text);
      }
    });

    btnFillForm.addEventListener('click', handleFillForm);
    btnCreateProfile.addEventListener('click', handleCreateProfile);

    btnSaveDomain.addEventListener('click', async () => {
      const profile = currentProfiles.find(p => p.id === currentEditingProfileId);
      if (profile) {
        profile.domain = inputProfileDomain.value.trim();
        await Storage.saveProfile(profile);
        currentProfiles = await Storage.getProfiles();
        alert('✓ Dominio guardado');
      }
    });

    btnSaveField.addEventListener('click', handleSaveField);
    btnCancelEditField.addEventListener('click', resetFieldEditorForm);

    btnStartPickElement.addEventListener('click', () => {
      const colIdx = Math.max(0, (parseInt(inputColumnIndex.value, 10) || 1) - 1);
      const name = inputFieldName.value.trim() || `Columna ${colIdx + 1}`;
      triggerVisualPicker(currentEditingProfileId, editFieldId.value || null, name, colIdx);
    });
  }

  async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  }

  async function ensureContentScriptsInjected(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'PING' }, async (res) => {
        if (chrome.runtime.lastError || !res) {
          // Inyectar manualmente si no estaba cargado
          try {
            await chrome.scripting.insertCSS({
              target: { tabId },
              files: ['content/content.css']
            });
            await chrome.scripting.executeScript({
              target: { tabId },
              files: [
                'utils/selector.js',
                'utils/filler.js',
                'content/picker.js',
                'content/content.js'
              ]
            });
          } catch (err) {
            console.warn('Inyección de script:', err);
          }
        }
        resolve();
      });
    });
  }
});
