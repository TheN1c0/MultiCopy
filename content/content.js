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
