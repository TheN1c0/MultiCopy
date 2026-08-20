/**
 * MultiCopy - DOM Form Filler Module
 * Rellena campos HTML de manera compatible con frameworks modernos (React, Vue, Angular)
 * disparando eventos y utilizando setters nativos.
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

    try {
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

      // Si es un div contenteditable
      if (element.isContentEditable) {
        element.innerText = strVal;
        this.dispatchEvents(element);
        return true;
      }

      return false;
    } catch (err) {
      console.error('MultiCopy: Error al rellenar elemento:', err, element);
      return false;
    }
  },

  /**
   * Establece el valor de un input o textarea usando los setters del prototipo nativo
   * para asegurar que React / Vue / Angular detecten el cambio.
   */
  setNativeValue(element, value) {
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
  },

  /**
   * Dispara los eventos necesarios en orden para frameworks modernos
   */
  dispatchEvents(element) {
    element.dispatchEvent(new Event('focus', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  },

  /**
   * Maneja el rellenado de elementos <select>
   */
  fillSelect(selectElement, value) {
    if (!selectElement.options || selectElement.options.length === 0) return false;

    const targetNormalized = this.normalizeText(value);
    let matchedOption = null;

    // Estrategia 1: Coincidencia exacta de valor o texto visible
    for (const opt of selectElement.options) {
      if (opt.value === value || opt.text.trim() === value) {
        matchedOption = opt;
        break;
      }
    }

    // Estrategia 2: Coincidencia normalizada (sin tildes, minúsculas, espacios)
    if (!matchedOption) {
      for (const opt of selectElement.options) {
        const valNorm = this.normalizeText(opt.value);
        const textNorm = this.normalizeText(opt.text);

        if (valNorm === targetNormalized || textNorm === targetNormalized) {
          matchedOption = opt;
          break;
        }
      }
    }

    // Estrategia 3: Contiene el texto (subcadena)
    if (!matchedOption && targetNormalized.length > 2) {
      for (const opt of selectElement.options) {
        const textNorm = this.normalizeText(opt.text);
        if (textNorm.includes(targetNormalized) || targetNormalized.includes(textNorm)) {
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

    return false;
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

    return false;
  },

  /**
   * Maneja radio buttons
   */
  fillRadio(radioElement, value) {
    const norm = this.normalizeText(value);
    const radioName = radioElement.name;

    if (radioName) {
      const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(radioName)}"]`);
      for (const radio of group) {
        const valNorm = this.normalizeText(radio.value);
        let labelNorm = '';
        if (radio.id) {
          const lbl = document.querySelector(`label[for="${CSS.escape(radio.id)}"]`);
          if (lbl) labelNorm = this.normalizeText(lbl.innerText);
        }
        const parentLabel = radio.closest('label');
        if (parentLabel) labelNorm = this.normalizeText(parentLabel.innerText);

        if (valNorm === norm || (labelNorm && (labelNorm === norm || labelNorm.includes(norm)))) {
          const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked');
          if (descriptor && descriptor.set) {
            descriptor.set.call(radio, true);
          } else {
            radio.checked = true;
          }
          this.dispatchEvents(radio);
          return true;
        }
      }
    } else {
      // Radio individual
      const valNorm = this.normalizeText(radioElement.value);
      if (valNorm === norm) {
        radioElement.checked = true;
        this.dispatchEvents(radioElement);
        return true;
      }
    }

    return false;
  },

  /**
   * Normaliza fechas para inputs <input type="date"> (espera formato YYYY-MM-DD)
   */
  formatDateForInput(strVal) {
    if (!strVal) return '';

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

    return strVal;
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
