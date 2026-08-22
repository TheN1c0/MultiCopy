/**
 * MultiCopy - Content Script Main Handler
 * Recibe mensajes desde el Popup para iniciar la selección visual o rellenar el formulario.
 */

// Escuchar mensajes desde el popup y background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const actions = typeof ACTIONS !== 'undefined' ? ACTIONS : {
    START_PICKER: 'START_PICKER',
    STOP_PICKER: 'STOP_PICKER',
    FILL_FORM: 'FILL_FORM',
    TRIGGER_FILL_WITH_PROFILE: 'TRIGGER_FILL_WITH_PROFILE',
    TRIGGER_SHORTCUT_FILL: 'TRIGGER_SHORTCUT_FILL',
    GET_PROFILE_FOR_AUTOFILL: 'GET_PROFILE_FOR_AUTOFILL',
    PING: 'PING'
  };

  if (request.action === actions.START_PICKER) {
    ElementPicker.start(request.context);
    sendResponse({ status: 'picker_started' });
    return true;
  }

  if (request.action === actions.STOP_PICKER) {
    ElementPicker.stop();
    sendResponse({ status: 'picker_stopped' });
    return true;
  }

  if (request.action === actions.FILL_FORM) {
    const { fields, columns } = request;
    const results = fillFormFields(fields, columns);
    sendResponse({ status: 'completed', results });
    return true;
  }

  if (request.action === actions.TRIGGER_FILL_WITH_PROFILE) {
    executeAutofillWithProfile(request.profile);
    sendResponse({ status: 'triggered' });
    return true;
  }

  if (request.action === actions.TRIGGER_SHORTCUT_FILL) {
    requestProfileAndAutofill();
    sendResponse({ status: 'triggered' });
    return true;
  }

  if (request.action === actions.PING) {
    sendResponse({ status: 'ready', url: window.location.href, hostname: window.location.hostname });
    return true;
  }
});

/**
 * Solicita el perfil activo al background service worker y ejecuta el autofill
 */
function requestProfileAndAutofill() {
  if (!chrome || !chrome.runtime || !chrome.runtime.id) {
    if (typeof ElementPicker !== 'undefined' && ElementPicker.showToast) {
      ElementPicker.showToast('⚠️ MultiCopy se actualizó. Por favor recarga esta pestaña web (F5) para continuar.', true);
    }
    return;
  }

  try {
    const actionName = typeof ACTIONS !== 'undefined' ? ACTIONS.GET_PROFILE_FOR_AUTOFILL : 'GET_PROFILE_FOR_AUTOFILL';
    chrome.runtime.sendMessage({
      action: actionName,
      url: window.location.href
    }, (response) => {
      if (chrome.runtime.lastError) {
        const errMsg = chrome.runtime.lastError.message || '';
        if (errMsg.includes('Extension context invalidated')) {
          if (typeof ElementPicker !== 'undefined' && ElementPicker.showToast) {
            ElementPicker.showToast('⚠️ MultiCopy se actualizó. Por favor recarga esta página (F5).', true);
          }
        } else {
          console.warn('Error al comunicarse con background:', chrome.runtime.lastError);
        }
        return;
      }
      if (response && response.profile) {
        executeAutofillWithProfile(response.profile);
      } else {
        ElementPicker.showToast('⚠️ MultiCopy: No hay un perfil activo seleccionado. Abre la extensión para elegir uno.', true);
      }
    });
  } catch (err) {
    if (err.message && err.message.includes('Extension context invalidated')) {
      if (typeof ElementPicker !== 'undefined' && ElementPicker.showToast) {
        ElementPicker.showToast('⚠️ MultiCopy se actualizó. Por favor recarga esta página (F5).', true);
      }
    } else {
      console.error('Error al solicitar perfil:', err);
    }
  }
}

/**
 * Ejecuta el rellenado con un perfil dado y la última fila del portapapeles
 */
async function executeAutofillWithProfile(profile) {
  try {
    if (!profile) {
      ElementPicker.showToast('⚠️ MultiCopy: No hay un perfil activo seleccionado. Abre la extensión para elegir uno.', true);
      return;
    }

    if (!profile.fields || profile.fields.length === 0) {
      ElementPicker.showToast(`⚠️ MultiCopy: El perfil "${profile.name}" no tiene campos configurados.`, true);
      return;
    }

    // 1. Leer el portapapeles
    let rawText = '';
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        rawText = await navigator.clipboard.readText();
      }
    } catch (_) {}

    if (!rawText && typeof ClipboardParser !== 'undefined' && ClipboardParser.readClipboard) {
      try {
        rawText = await ClipboardParser.readClipboard();
      } catch (_) {}
    }

    if (!rawText || rawText.trim() === '') {
      ElementPicker.showToast('⚠️ MultiCopy: El portapapeles está vacío. Copia una fila en Excel primero.', true);
      return;
    }

    // 2. Parsear fila
    let columns = [];
    if (typeof ClipboardParser !== 'undefined' && ClipboardParser.parseExcelText) {
      const parsed = ClipboardParser.parseExcelText(rawText);
      columns = parsed.columns || [];
    } else {
      const line = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')[0] || '';
      columns = line.split('\t');
    }

    if (!columns || columns.length === 0) {
      ElementPicker.showToast('⚠️ MultiCopy: No se detectaron datos en la fila copiada.', true);
      return;
    }

    // 3. Rellenar formulario
    fillFormFields(profile.fields, columns);

  } catch (err) {
    console.error('MultiCopy autofill error:', err);
    ElementPicker.showToast(`⚠️ Error al rellenar: ${err.message}`, true);
  }
}

// Listener de teclado directo en la ventana activa (Ctrl+Shift+Y o Cmd+Shift+Y)
window.addEventListener('keydown', (e) => {
  if (window.ElementPicker && window.ElementPicker.isActive) return;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  // Atajo: Ctrl + Shift + Y
  if (modifier && e.shiftKey && (e.key === 'Y' || e.key === 'y' || e.code === 'KeyY')) {
    e.preventDefault();
    requestProfileAndAutofill();
  }
}, true);

/**
 * Rellena los campos de la página web según la configuración del perfil
 * @param {Array} fields Lista de configuraciones de campos del perfil
 * @param {Array} columns Valores de la fila de Excel
 */
function fillFormFields(fields, columns) {
  if (!fields || !columns) {
    ElementPicker.showToast('No hay datos o campos para rellenar', true);
    return { filled: 0, total: 0, errors: [] };
  }

  let filledCount = 0;
  const errors = [];

  fields.forEach(field => {
    const colIndex = parseInt(field.columnIndex, 10);
    const value = columns[colIndex];
    const fieldName = field.name || `Dato #${colIndex + 1}`;

    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`"${fieldName}": El dato #${colIndex + 1} de la fila está vacío`);
      return;
    }

    if (!field.selector) {
      errors.push(`"${fieldName}": No tiene campo vinculado en la página`);
      return;
    }

    try {
      const element = document.querySelector(field.selector);
      if (!element) {
        errors.push(`"${fieldName}": No se encontró en la página (selector: ${field.selector})`);
        return;
      }

      const success = FormFiller.fillElement(element, value);
      if (success) {
        filledCount++;
      } else {
        errors.push(`"${fieldName}": No se pudo rellenar con el valor "${value}"`);
      }
    } catch (err) {
      errors.push(`"${fieldName}": ${err.message}`);
    }
  });

  if (filledCount === fields.length) {
    ElementPicker.showToast(`✓ MultiCopy: Se rellenaron los ${filledCount} campos con éxito`);
  } else if (filledCount > 0) {
    const firstError = errors[0] || '';
    ElementPicker.showToast(`⚠️ MultiCopy: Se rellenaron ${filledCount} de ${fields.length} campos. (${firstError})`, true);
  } else {
    const firstError = errors[0] || 'Revisa la correspondencia de los datos de la fila con el formulario';
    ElementPicker.showToast(`⚠️ MultiCopy: ${firstError}`, true);
  }

  return {
    filled: filledCount,
    total: fields.length,
    errors
  };
}
