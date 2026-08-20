/**
 * MultiCopy - Selector Generator
 * Genera selectores CSS estables, únicos y resistentes a cambios menores en el DOM,
 * y extrae nombres amigables para los campos web seleccionados.
 */

const SelectorGenerator = {
  /**
   * Genera un selector CSS único y confiable para un elemento HTML
   * @param {HTMLElement} element 
   * @returns {string} Selector CSS
   */
  getSelector(element) {
    if (!element || !(element instanceof Element)) return '';

    // 1. ID único (verificando que no sea dinámico/aleatorio)
    if (element.id && this.isValidId(element.id)) {
      const idSelector = `#${CSS.escape(element.id)}`;
      if (this.isUnique(idSelector)) {
        return idSelector;
      }
    }

    const tag = element.tagName.toLowerCase();

    // 2. data-testid o atributos de testing
    const testAttrs = ['data-testid', 'data-test', 'data-cy', 'data-qa', 'data-id'];
    for (const attr of testAttrs) {
      const val = element.getAttribute(attr);
      if (val) {
        const sel = `${tag}[${attr}="${CSS.escape(val)}"]`;
        if (this.isUnique(sel)) return sel;
      }
    }

    // 3. Atributo 'name' (muy común y estable en formularios)
    const name = element.getAttribute('name');
    if (name) {
      const nameSel = `${tag}[name="${CSS.escape(name)}"]`;
      if (this.isUnique(nameSel)) return nameSel;

      // Si es radio button, combinar con su valor
      if (tag === 'input' && element.type === 'radio' && element.value) {
        const radioSel = `input[name="${CSS.escape(name)}"][value="${CSS.escape(element.value)}"]`;
        if (this.isUnique(radioSel)) return radioSel;
      }
    }

    // 4. aria-label o placeholder
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const ariaSel = `${tag}[aria-label="${CSS.escape(ariaLabel)}"]`;
      if (this.isUnique(ariaSel)) return ariaSel;
    }

    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
      const placeSel = `${tag}[placeholder="${CSS.escape(placeholder)}"]`;
      if (this.isUnique(placeSel)) return placeSel;
    }

    // 5. Tipo de input específico + clases estables
    if (tag === 'input' && element.type) {
      const typeSel = `input[type="${element.type}"]`;
      if (this.isUnique(typeSel)) return typeSel;
    }

    // 6. Construir ruta jerárquica corta
    return this.buildHierarchicalPath(element);
  },

  /**
   * Construye una ruta jerárquica hacia el elemento
   */
  buildHierarchicalPath(element) {
    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();

      // Si el elemento actual tiene un ID válido, anclar la ruta aquí
      if (current.id && this.isValidId(current.id)) {
        selector = `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      if (current.getAttribute('name')) {
        selector += `[name="${CSS.escape(current.getAttribute('name'))}"]`;
      } else if (current.getAttribute('type')) {
        selector += `[type="${CSS.escape(current.getAttribute('type'))}"]`;
      } else {
        // Usar nth-of-type si hay hermanos del mismo tag
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-of-type(${index})`;
          }
        }
      }

      path.unshift(selector);
      current = current.parentElement;

      // Probar si el selector acumulado ya es único
      const testSelector = path.join(' > ');
      if (this.isUnique(testSelector)) {
        return testSelector;
      }
    }

    return path.join(' > ');
  },

  /**
   * Determina si un ID es estable o generado aleatoriamente
   */
  isValidId(id) {
    if (!id || typeof id !== 'string') return false;
    // Ignorar IDs que parecen hashes o autogenerados (ej: react-1234, ember987, :r1:)
    if (/^[0-9]+$/.test(id)) return false;
    if (/^ember[0-9]+$/i.test(id)) return false;
    if (/^react-[a-z0-9-]+$/i.test(id)) return false;
    if (/^:r[0-9a-z]+:$/i.test(id)) return false;
    if (id.length > 50) return false;
    return true;
  },

  /**
   * Comprueba si el selector devuelve exactamente un único elemento en el DOM
   */
  isUnique(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  },

  /**
   * Extrae una etiqueta o nombre descriptivo legible para humanos de un campo
   * @param {HTMLElement} element 
   * @returns {string} Nombre amigable
   */
  getFriendlyName(element) {
    if (!element) return 'Campo web';

    // 1. Si está asociado a un <label for="id">
    if (element.id) {
      const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (label && label.innerText.trim()) {
        return label.innerText.trim();
      }
    }

    // 2. Si está contenido dentro de un <label>
    const parentLabel = element.closest('label');
    if (parentLabel) {
      // Obtener el texto del label excluyendo el valor de inputs
      const clone = parentLabel.cloneNode(true);
      const inputs = clone.querySelectorAll('input, select, textarea');
      inputs.forEach(i => i.remove());
      const labelText = clone.innerText.trim();
      if (labelText) return labelText;
    }

    // 3. aria-label
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label').trim();
    }

    // 4. placeholder
    if (element.getAttribute('placeholder')) {
      return element.getAttribute('placeholder').trim();
    }

    // 5. name o id
    if (element.getAttribute('name')) {
      return this.formatIdentifier(element.getAttribute('name'));
    }

    if (element.id) {
      return this.formatIdentifier(element.id);
    }

    // 6. Texto de un elemento <label> o <span> anterior en el mismo contenedor
    const prevElem = element.previousElementSibling;
    if (prevElem && (prevElem.tagName === 'LABEL' || prevElem.tagName === 'SPAN' || prevElem.tagName === 'P')) {
      const text = prevElem.innerText.trim();
      if (text && text.length < 50) return text;
    }

    return `${element.tagName.toLowerCase()}${element.type ? ` [${element.type}]` : ''}`;
  },

  /**
   * Formatea un identificador (ej: 'worker_first_name' -> 'Worker First Name')
   */
  formatIdentifier(str) {
    return str
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.SelectorGenerator = SelectorGenerator;
}
