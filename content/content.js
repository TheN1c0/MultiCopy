/**
 * MultiCopy - Content Script Main Handler
 * Recibe mensajes desde el Popup para iniciar la selección visual o rellenar el formulario.
 */

// Escuchar mensajes desde el popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_PICKER') {
    ElementPicker.start(request.context);
    sendResponse({ status: 'picker_started' });
    return true;
  }

  if (request.action === 'STOP_PICKER') {
    ElementPicker.stop();
    sendResponse({ status: 'picker_stopped' });
    return true;
  }

  if (request.action === 'FILL_FORM') {
    const { fields, columns } = request;
    const results = fillFormFields(fields, columns);
    sendResponse({ status: 'completed', results });
    return true;
  }

  if (request.action === 'PING') {
    sendResponse({ status: 'ready', url: window.location.href, hostname: window.location.hostname });
    return true;
  }
});

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

    if (value === undefined || value === null) {
      errors.push(`Columna ${colIndex + 1} no encontrada en los datos de Excel`);
      return;
    }

    if (!field.selector) {
      errors.push(`Campo "${field.name || 'Sin nombre'}" no tiene selector asignado`);
      return;
    }

    try {
      const element = document.querySelector(field.selector);
      if (!element) {
        errors.push(`No se encontró el elemento en la página con selector: ${field.selector}`);
        return;
      }

      const success = FormFiller.fillElement(element, value);
      if (success) {
        filledCount++;
      } else {
        errors.push(`No se pudo rellenar el campo "${field.name || field.selector}"`);
      }
    } catch (err) {
      errors.push(`Error en campo "${field.name}": ${err.message}`);
    }
  });

  if (filledCount > 0) {
    ElementPicker.showToast(`✓ MultiCopy: Se rellenaron ${filledCount} de ${fields.length} campos`);
  } else {
    ElementPicker.showToast(`⚠️ MultiCopy: No se pudo rellenar ningún campo`, true);
  }

  return {
    filled: filledCount,
    total: fields.length,
    errors
  };
}
