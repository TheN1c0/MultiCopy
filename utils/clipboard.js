/**
 * MultiCopy - Clipboard Module
 * Parsea y procesa los datos copiados desde Excel (separados por tabulaciones \t)
 */

const ClipboardParser = {
  /**
   * Lee el texto del portapapeles de manera segura
   * @returns {Promise<string>}
   */
  async readClipboard() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        return text || '';
      }
    } catch (err) {
      // Document is not focused yet or user gesture needed
      // Intentar método alternativo mediante input temporal si es necesario
      try {
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        const success = document.execCommand('paste');
        const val = textarea.value;
        textarea.remove();
        if (success && val) return val;
      } catch (_) {}
    }
    return '';
  },

  /**
   * Parsea el texto copiado de Excel (TSV)
   * @param {string} text - Contenido en bruto del portapapeles
   * @returns {Object} { columns: string[], isMultipleRows: boolean, totalRows: number, rawRows: string[] }
   */
  parseExcelText(text) {
    if (!text || typeof text !== 'string') {
      return {
        columns: [],
        isMultipleRows: false,
        totalRows: 0,
        rawRows: []
      };
    }

    // Normalizar saltos de línea (\r\n -> \n)
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Filtrar líneas no vacías
    const rawRows = normalized.split('\n').filter(line => line.length > 0);

    if (rawRows.length === 0) {
      return {
        columns: [],
        isMultipleRows: false,
        totalRows: 0,
        rawRows: []
      };
    }

    const isMultipleRows = rawRows.length > 1;
    const firstRow = rawRows[0];

    // Excel separa celdas copiadas con tabulación '\t'
    // Limpiamos comillas envolventes típicas de exportaciones de Excel si aplican
    const columns = firstRow.split('\t').map(cell => {
      let val = cell.trim();
      // Quitar comillas si el valor está envuelto en "valor"
      if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      return val;
    });

    return {
      columns,
      isMultipleRows,
      totalRows: rawRows.length,
      rawRows
    };
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ClipboardParser = ClipboardParser;
}
