/**
 * MultiCopy - DOM Form Filler Module
 * Rellena campos HTML de manera compatible con frameworks modernos (React, Vue, Angular)
 * disparando eventos y utilizando setters nativos, con manejo amigable de errores.
 */

const FormFiller = {
  /**
   * Rellena un elemento DOM con un valor dado
   * @param {HTMLElement} element - Elemento a rellenar
   * @param {string} value - Valor proveniente de Excel
   * @returns {boolean} True si se rellenó con éxito
   */
  fillElement(element, value) {
    if (!element || value === undefined || value === null) return false;

    const tag = element.tagName.toLowerCase();
    const type = (element.type || '').toLowerCase();
    const strVal = String(value).trim();

    // 1. SELECT
    if (tag === 'select') {
      return this.fillSelect(element, strVal);
    }

    // 2. CHECKBOX
    if (tag === 'input' && type === 'checkbox') {
      return this.fillCheckbox(element, strVal);
    }

    // 3. RADIO BUTTON
    if (tag === 'input' && type === 'radio') {
      return this.fillRadio(element, strVal);
    }

    // 4. DATE INPUT
    if (tag === 'input' && type === 'date') {
      const formattedDate = this.formatDateForInput(strVal);
      if (!formattedDate) {
        throw new Error(`El campo es de tipo fecha, pero en Excel dice "${strVal}". Verifica que la columna corresponda a una fecha.`);
      }
      return this.setNativeValue(element, formattedDate);
    }

    // 5. TEXTAREA
    if (tag === 'textarea') {
      return this.setNativeValue(element, strVal);
    }

    // 6. INPUT (text, email, number, tel, url, search, password, etc.)
    if (tag === 'input') {
      return this.setNativeValue(element, strVal);
    }

    // 7. CONTENEDOR (DIV, FIELDSET, etc.) que envuelve radios o inputs
    if (tag === 'div' || tag === 'fieldset' || tag === 'section') {
      // Si contiene radio buttons
      const radios = element.querySelectorAll('input[type="radio"]');
      if (radios.length > 0) {
        return this.fillRadioInGroup(radios, strVal);
      }

      // Si contiene un select
      const select = element.querySelector('select');
      if (select) {
        return this.fillSelect(select, strVal);
      }

      // Si contiene un checkbox
      const checkbox = element.querySelector('input[type="checkbox"]');
      if (checkbox) {
        return this.fillCheckbox(checkbox, strVal);
      }

      // Si contiene un input estándar
      const input = element.querySelector('input, textarea');
      if (input) {
        return this.fillElement(input, strVal);
      }

      // Si es un div editable (contenteditable)
      if (element.isContentEditable) {
        element.innerText = strVal;
        this.dispatchEvents(element);
        return true;
      }
    }

    // 8. Elemento contenteditable directo
    if (element.isContentEditable) {
      element.innerText = strVal;
      this.dispatchEvents(element);
      return true;
    }

    return false;
  },

  /**
   * Establece el valor de un input o textarea usando los setters del prototipo nativo
   * para asegurar que React / Vue / Angular detecten el cambio.
   */
  setNativeValue(element, value) {
    try {
      const proto = element.tagName.toLowerCase() === 'textarea' 
        ? window.HTMLTextAreaElement.prototype 
        : window.HTMLInputElement.prototype;

      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
      } else {
        element.value = value;
      }

      this.dispatchEvents(element);
      return true;
    } catch (err) {
      throw new Error(`No se pudo asignar el valor "${value}": ${err.message}`);
    }
  },

  /**
   * Dispara los eventos necesarios en orden para frameworks modernos
   */
  dispatchEvents(element) {
    try {
      element.dispatchEvent(new Event('focus', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
    } catch (e) {
      // Ignorar errores menores de dispatch si el elemento fue desmontado
    }
  },

  // Grupos de sinónimos comunes para formularios
  SYNONYMS: [
    ['male', 'masculino', 'hombre', 'varon', 'm'],
    ['female', 'femenino', 'mujer', 'f'],
    ['other', 'otro', 'otra', 'no binario', 'non-binary', 'nb', 'otro/a'],
    ['si', 'yes', 'true', '1', 'v', 'verdadero', 'ok', 'activo'],
    ['no', 'false', '0', 'f', 'falso', 'inactivo']
  ],

  /**
   * Comprueba si dos valores coinciden considerando sinónimos de género y valores booleanos
   */
  areSynonyms(val1, val2) {
    if (!val1 || !val2) return false;
    const n1 = this.normalizeText(val1);
    const n2 = this.normalizeText(val2);
    if (n1 === n2) return true;

    for (const group of this.SYNONYMS) {
      if (group.includes(n1) && group.includes(n2)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Maneja el rellenado de elementos <select>
   */
  fillSelect(selectElement, value) {
    if (!selectElement.options || selectElement.options.length === 0) {
      throw new Error('El menú desplegable no contiene opciones.');
    }

    const targetNormalized = this.normalizeText(value);
    let matchedOption = null;

    // Pase 1: Coincidencia exacta de valor o texto
    for (const opt of selectElement.options) {
      const valNorm = this.normalizeText(opt.value);
      const textNorm = this.normalizeText(opt.text);
      if (valNorm === targetNormalized || textNorm === targetNormalized || opt.value === value || opt.text.trim() === value) {
        matchedOption = opt;
        break;
      }
    }

    // Pase 2: Coincidencia por sinónimos (ej: "Masculino" <-> "Male", "Femenino" <-> "Female")
    if (!matchedOption) {
      for (const opt of selectElement.options) {
        const valNorm = this.normalizeText(opt.value);
        const textNorm = this.normalizeText(opt.text);
        if (this.areSynonyms(targetNormalized, valNorm) || this.areSynonyms(targetNormalized, textNorm)) {
          matchedOption = opt;
          break;
        }
      }
    }

    // Pase 3: La opción de la web contiene el texto buscado como palabra completa o subcadena
    if (!matchedOption && targetNormalized.length > 2) {
      for (const opt of selectElement.options) {
        const textNorm = this.normalizeText(opt.text);
        const valNorm = this.normalizeText(opt.value);
        if (textNorm.includes(targetNormalized) || valNorm.includes(targetNormalized)) {
          matchedOption = opt;
          break;
        }
      }
    }

    if (matchedOption) {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(selectElement, matchedOption.value);
      } else {
        selectElement.value = matchedOption.value;
      }
      matchedOption.selected = true;
      this.dispatchEvents(selectElement);
      return true;
    }

    const previewOpts = Array.from(selectElement.options)
      .map(o => `"${o.text.trim()}"`)
      .filter(t => t.length > 2)
      .slice(0, 3)
      .join(', ');

    throw new Error(`En Excel dice "${value}", pero esa opción no existe en el selector web (Opciones válidas: ${previewOpts}...)`);
  },

  /**
   * Maneja checkboxes según valores comunes de verdad/falsedad
   */
  fillCheckbox(checkboxElement, value) {
    const norm = this.normalizeText(value);
    const truthyValues = ['si', 'yes', 'true', '1', 'x', 'on', 'activo', 'v', 'ok', 'verdadero'];
    const falsyValues = ['no', 'false', '0', 'off', 'inactivo', 'f', 'falso'];

    let shouldCheck = null;
    if (truthyValues.includes(norm)) shouldCheck = true;
    if (falsyValues.includes(norm)) shouldCheck = false;

    if (shouldCheck !== null) {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked');
      if (descriptor && descriptor.set) {
        descriptor.set.call(checkboxElement, shouldCheck);
      } else {
        checkboxElement.checked = shouldCheck;
      }
      this.dispatchEvents(checkboxElement);
      return true;
    }

    throw new Error(`En Excel dice "${value}", que no es reconocible como Sí/No para la casilla.`);
  },

  /**
   * Maneja radio buttons desde un elemento <input type="radio">
   */
  fillRadio(radioElement, value) {
    const radioName = radioElement.name;
    if (radioName) {
      const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(radioName)}"]`);
      return this.fillRadioInGroup(group, value);
    } else {
      // Radio individual sin nombre de grupo
      const norm = this.normalizeText(value);
      const valNorm = this.normalizeText(radioElement.value);
      if (valNorm === norm || this.areSynonyms(norm, valNorm)) {
        radioElement.checked = true;
        this.dispatchEvents(radioElement);
        return true;
      }
      throw new Error(`No se encontró la opción "${value}" en el radio button.`);
    }
  },

  /**
   * Busca y selecciona la opción correspondiente dentro de un grupo de radio buttons
   */
  fillRadioInGroup(radios, value) {
    const targetNorm = this.normalizeText(value);
    const candidates = [];

    for (const radio of radios) {
      const valNorm = this.normalizeText(radio.value);
      let labelText = '';
      if (radio.id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(radio.id)}"]`);
        if (lbl) labelText = lbl.innerText.trim();
      }
      const parentLabel = radio.closest('label');
      if (parentLabel && !labelText) {
        labelText = parentLabel.innerText.trim();
      }

      const labelNorm = this.normalizeText(labelText);
      candidates.push({ radio, valNorm, labelNorm, labelText });
    }

    let matchedRadio = null;

    // Pase 1: Coincidencia exacta de valor o texto de etiqueta
    for (const c of candidates) {
      if (c.valNorm === targetNorm || c.labelNorm === targetNorm) {
        matchedRadio = c.radio;
        break;
      }
    }

    // Pase 2: Coincidencia por sinónimos (ej: "Female" <-> "Femenino" <-> "Mujer", "Male" <-> "Masculino")
    if (!matchedRadio) {
      for (const c of candidates) {
        if (this.areSynonyms(targetNorm, c.valNorm) || this.areSynonyms(targetNorm, c.labelNorm)) {
          matchedRadio = c.radio;
          break;
        }
      }
    }

    // Pase 3: La etiqueta contiene el texto buscado (pero NO al revés para evitar que "female" active "male")
    if (!matchedRadio && targetNorm.length > 2) {
      for (const c of candidates) {
        if (c.labelNorm && c.labelNorm.includes(targetNorm)) {
          matchedRadio = c.radio;
          break;
        }
      }
    }

    if (matchedRadio) {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked');
      if (descriptor && descriptor.set) {
        descriptor.set.call(matchedRadio, true);
      } else {
        matchedRadio.checked = true;
      }
      this.dispatchEvents(matchedRadio);
      return true;
    }

    const available = candidates.map(c => `"${c.labelText || c.valNorm}"`).filter(Boolean).slice(0, 3).join(', ');
    throw new Error(`En Excel dice "${value}", pero no coincide con ninguna opción de radio (Opciones: ${available || 'ninguna'})`);
  },

  /**
   * Normaliza fechas para inputs <input type="date"> (espera formato YYYY-MM-DD)
   * Si no es una fecha válida, retorna null para no causar errores de formato en el DOM.
   */
  formatDateForInput(strVal) {
    if (!strVal) return null;

    // Si ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
      return strVal;
    }

    // Formato DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
    const dmyMatch = strVal.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Formato YYYY/MM/DD o YYYY.MM.DD
    const ymdMatch = strVal.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Si es un string que no representa una fecha (ej: "Masculino", "Juan")
    return null;
  },

  /**
   * Normaliza texto: minúsculas, elimina tildes y espacios redundantes
   */
  normalizeText(text) {
    if (!text) return '';
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina acentos/tildes
      .trim();
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.FormFiller = FormFiller;
}
