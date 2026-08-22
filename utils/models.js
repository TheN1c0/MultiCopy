/**
 * MultiCopy - Data Models & Validation Module
 * Centraliza la creación, validación y normalización de Perfiles y Campos.
 */

const FieldModel = {
  /**
   * Genera un ID único para un campo
   * @returns {string}
   */
  generateId() {
    return 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  /**
   * Crea y normaliza un objeto Field
   * @param {Object} data 
   * @returns {Object}
   */
  create(data = {}) {
    const rawCol = data.columnIndex !== undefined ? parseInt(data.columnIndex, 10) : 0;
    const columnIndex = isNaN(rawCol) ? 0 : Math.max(0, rawCol);
    const colNumber = columnIndex + 1;

    return {
      id: data.id || this.generateId(),
      name: (data.name && String(data.name).trim()) || `Dato #${colNumber}`,
      columnIndex: columnIndex,
      selector: (data.selector && String(data.selector).trim()) || '',
      webFieldName: (data.webFieldName && String(data.webFieldName).trim()) || (data.name && String(data.name).trim()) || `Dato #${colNumber}`
    };
  },

  /**
   * Normaliza un campo existente asegurando tipos de datos válidos
   * @param {Object} field 
   * @param {number} fallbackIndex 
   * @returns {Object}
   */
  normalize(field, fallbackIndex = 0) {
    if (!field || typeof field !== 'object') {
      return this.create({ columnIndex: fallbackIndex });
    }

    const rawCol = field.columnIndex !== undefined ? parseInt(field.columnIndex, 10) : fallbackIndex;
    const columnIndex = isNaN(rawCol) ? fallbackIndex : Math.max(0, rawCol);
    const colNumber = columnIndex + 1;

    return {
      id: field.id || this.generateId(),
      name: (field.name && String(field.name).trim()) || `Dato #${colNumber}`,
      columnIndex: columnIndex,
      selector: (field.selector && String(field.selector).trim()) || '',
      webFieldName: (field.webFieldName && String(field.webFieldName).trim()) || (field.name && String(field.name).trim()) || `Dato #${colNumber}`
    };
  }
};

const ProfileModel = {
  /**
   * Genera un ID único para un perfil
   * @returns {string}
   */
  generateId() {
    return 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Sanitiza y limpia una cadena de dominio / URL
   * @param {string} domain 
   * @returns {string}
   */
  cleanDomain(domain) {
    if (!domain || typeof domain !== 'string') return '';
    let cleaned = domain.trim().toLowerCase();
    // Remover protocolo (http://, https://)
    cleaned = cleaned.replace(/^https?:\/\//, '');
    // Remover rutas (/path...) y puertos (:8080)
    cleaned = cleaned.replace(/\/.*$/, '').replace(/:.*$/, '');
    return cleaned;
  },

  /**
   * Comprueba si una URL coincide con el dominio asignado al perfil
   * @param {Object} profile 
   * @param {string} url 
   * @returns {boolean}
   */
  matchesDomain(profile, url) {
    if (!profile || !profile.domain || !url) return false;
    const cleanDomain = this.cleanDomain(profile.domain);
    if (!cleanDomain) return false;

    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname.toLowerCase();
      return host === cleanDomain || host.endsWith('.' + cleanDomain) || cleanDomain === host;
    } catch (_) {
      return url.toLowerCase().includes(cleanDomain);
    }
  },

  /**
   * Crea un nuevo perfil normalizado
   * @param {Object} data 
   * @returns {Object}
   */
  create(data = {}) {
    const fields = Array.isArray(data.fields) 
      ? data.fields.map((f, idx) => FieldModel.normalize(f, idx))
      : [];

    return {
      id: data.id || this.generateId(),
      name: (data.name && String(data.name).trim()) || 'Nuevo Perfil',
      domain: this.cleanDomain(data.domain),
      fields: fields,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now()
    };
  },

  /**
   * Normaliza un perfil existente
   * @param {Object} profile 
   * @returns {Object}
   */
  normalize(profile) {
    if (!profile || typeof profile !== 'object') {
      return this.create();
    }

    const fields = Array.isArray(profile.fields)
      ? profile.fields.map((f, idx) => FieldModel.normalize(f, idx))
      : [];

    return {
      id: profile.id || this.generateId(),
      name: (profile.name && String(profile.name).trim()) || 'Perfil sin nombre',
      domain: this.cleanDomain(profile.domain),
      fields: fields,
      createdAt: profile.createdAt || Date.now(),
      updatedAt: profile.updatedAt || Date.now()
    };
  },

  /**
   * Retorna el perfil predeterminado inicial
   * @returns {Object}
   */
  getDefaultProfile() {
    return {
      id: 'prof_default_1',
      name: 'Formulario de Prueba',
      domain: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fields: [
        FieldModel.create({ id: 'f1', name: 'RUT', columnIndex: 0, selector: '#rut', webFieldName: 'RUT' }),
        FieldModel.create({ id: 'f2', name: 'Nombre', columnIndex: 1, selector: '#nombre', webFieldName: 'Nombre' }),
        FieldModel.create({ id: 'f3', name: 'Apellido', columnIndex: 2, selector: '#apellido', webFieldName: 'Apellido' }),
        FieldModel.create({ id: 'f4', name: 'Email', columnIndex: 3, selector: '#email', webFieldName: 'Correo Electrónico' }),
        FieldModel.create({ id: 'f5', name: 'Teléfono', columnIndex: 4, selector: '#telefono', webFieldName: 'Teléfono' }),
        FieldModel.create({ id: 'f6', name: 'Fecha Nacimiento', columnIndex: 5, selector: '#fecha_nacimiento', webFieldName: 'Fecha' }),
        FieldModel.create({ id: 'f7', name: 'Sexo / Género', columnIndex: 6, selector: '#sexo', webFieldName: 'Sexo' }),
        FieldModel.create({ id: 'f8', name: 'Observaciones', columnIndex: 7, selector: '#observaciones', webFieldName: 'Observaciones' }),
        FieldModel.create({ id: 'f9', name: 'Acepta Términos', columnIndex: 8, selector: '#terminos', webFieldName: 'Términos' }),
        FieldModel.create({ id: 'f10', name: 'Tipo Contrato', columnIndex: 9, selector: 'input[name="contrato"]', webFieldName: 'Contrato' })
      ]
    };
  }
};

// Exportación universal
if (typeof globalThis !== 'undefined') {
  globalThis.FieldModel = FieldModel;
  globalThis.ProfileModel = ProfileModel;
  globalThis.MultiCopyModels = { FieldModel, ProfileModel };
}

if (typeof window !== 'undefined') {
  window.FieldModel = FieldModel;
  window.ProfileModel = ProfileModel;
  window.MultiCopyModels = { FieldModel, ProfileModel };
}
