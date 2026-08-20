# MultiCopy - Extensión Chrome / Edge para Autocompletar Formularios desde Excel

MultiCopy es una extensión para navegadores basados en Chromium (Google Chrome, Microsoft Edge, Brave, Opera, etc.) bajo **Manifest V3** que permite copiar una fila desde Excel y rellenar automáticamente cualquier formulario web mediante un sistema de **perfiles y mapeo visual de campos**.

---

## 🚀 Características Principales

1. **Sin configuración manual de código o inspectores**: Selector visual interactivo para vincular columnas de Excel a campos de la web con un solo clic.
2. **Soporte para múltiples perfiles**: Crea y gestiona perfiles independientes (ej: *Formulario Trabajadores*, *Postulación Laboral*, *Empresa XYZ*).
3. **Compatible con Frameworks Modernos (React, Vue, Angular)**: Modifica los valores mediante setters del prototipo nativo (`HTMLInputElement.prototype`, `HTMLTextAreaElement.prototype`, `HTMLSelectElement.prototype`) y dispara eventos sintéticos (`focus`, `input`, `change`, `blur`) para asegurar reactividad completa.
4. **Soporte de tipos de entrada variados**:
   - `input` (text, email, number, tel, search, date)
   - `textarea`
   - `select` (búsqueda y coincidencia inteligente de opciones por valor o texto, ignorando mayúsculas y tildes)
   - `checkbox` (detección de valores como si/no, true/false, 1/0, x, activo)
   - `radio buttons` (búsqueda por valor o etiqueta)
   - Formatos de fecha (`DD/MM/YYYY` -> `YYYY-MM-DD` para inputs tipo fecha)
5. **100% Local y Privado**: No requiere backend, ni servidores externos, ni APIs de terceros. Todo se almacena localmente en `chrome.storage.local`.

---

## 📁 Estructura del Proyecto

```text
MultiCopy/
├── manifest.json            # Configuración Manifest V3 de la extensión
├── generate_icons.js        # Script utilitario generador de iconos
├── icons/                   # Iconos de la extensión (16x16, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── utils/                   # Módulos y lógica desacoplada
│   ├── storage.js           # Capa de persistencia con chrome.storage.local
│   ├── clipboard.js         # Lector y parseador TSV de filas de Excel
│   ├── selector.js          # Generador de selectores CSS estables y nombres amigables
│   └── filler.js            # Rellenador DOM compatible con React/Vue/Angular
├── popup/                   # Interfaz de usuario del Popup
│   ├── popup.html           # Estructura del popup (Vistas: Principal, Perfiles, Campos)
│   ├── popup.css            # Estilos modernos y responsivos
│   └── popup.js             # Controlador de eventos y vistas del popup
├── content/                 # Scripts inyectados en las páginas web
│   ├── content.js           # Escuchador y coordinador de mensajes
│   ├── picker.js            # Inspector visual flotante para selección de campos
│   └── content.css          # Estilos del banner flotante y resaltador
└── test/                    # Entorno de pruebas local
    └── test-form.html       # Formulario de prueba completo con log de eventos
```

---

## 🔧 Instalación en Chrome / Microsoft Edge

1. Abre tu navegador (Chrome o Edge).
2. Ve a la sección de extensiones:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
3. Activa el **Modo de desarrollador** (switch en la esquina superior derecha en Chrome, o lateral en Edge).
4. Haz clic en el botón **Cargar descomprimida** (o *Load unpacked*).
5. Selecciona la carpeta raíz del proyecto (`MultiCopy`).
6. La extensión aparecerá instalada con el nombre **MultiCopy - Excel Form Autofill**.
7. *(Recomendado)* Haz clic en el icono del rompecabezas en la barra de extensiones y fija (pin) **MultiCopy** para tener acceso rápido.

---

## 🧪 Cómo Probar la Extensión con la Página de Prueba

1. Abre el archivo local `test/test-form.html` en una pestaña de tu navegador (puedes arrastrarlo a la ventana de Chrome/Edge o abrir `file:///c:/Users/nico_/Desktop/Trabajo/ProyectosRandom/Multicopy/test/test-form.html`).
2. En la página de prueba, haz clic en el botón **📋 Copiar Fila Ejemplo 1 (Juan Pérez)**. Esto cargará en tu portapapeles una fila idéntica a la que generaría Excel al presionar `Ctrl + C`.
3. Abre la extensión MultiCopy desde la barra de herramientas.
4. Verás la fila detectada con sus 10 columnas y la vista previa de datos.
5. Haz clic en **⚡ RELLENAR FORMULARIO**.
6. Observa cómo se rellenan automáticamente todos los campos (RUT, Nombre, Apellido, Email, Teléfono, Fecha, Sexo, Observaciones, Términos y Contrato), y cómo el recuadro inferior de *Registro de eventos* confirma los eventos `input` y `change` disparados.

---

## 🎯 Guía de Uso Paso a Paso

### 1. Crear un Nuevo Perfil
1. Abre el popup de MultiCopy.
2. Haz clic en el icono de usuario o **⚙️ Configurar**.
3. En la sección **Perfiles**, escribe el nombre del perfil (ej: `Postulación Empleo`) y presiona **+ Crear**.

### 2. Configurar Campos Visualmente (Sin código)
1. Con la pestaña del formulario abierta, abre MultiCopy y entra a configurar el perfil.
2. En la sección de campos, haz clic en **🎯 Seleccionar en web** (o en el botón con la diana 🎯 junto a un campo existente).
3. El popup se cerrará y en la página web aparecerá una barra superior:
   > 🎯 *MultiCopy: Haz clic en el campo para: [Nombre del campo] (ESC para cancelar)*
4. Mueve el cursor sobre el formulario; el campo bajo el cursor se resaltará en azul con una etiqueta identificadora.
5. Haz clic sobre el input o control deseado.
6. Se generará y guardará automáticamente un selector CSS robusto y el nombre del campo.
7. Un mensaje flotante (*Toast*) confirmará: `✓ Campo vinculado: [Nombre] → Selector guardado`.

### 3. Copiar desde Excel y Rellenar
1. En tu hoja de cálculo Excel, selecciona la fila con los datos y presiona `Ctrl + C`.
2. Ve a la página del formulario.
3. Abre MultiCopy.
4. Verifica la vista previa de las columnas detectadas.
5. Presiona **⚡ RELLENAR FORMULARIO**.
6. ¡Listo! El formulario se rellenará en un instante respetando validaciones y reactividad.

### 4. Modificar o Reasignar Campos
- En la vista de configuración del perfil, puedes:
  - Presionar **✏️ (Editar)** para cambiar el número de columna de Excel o nombre.
  - Presionar **🎯 (Re-vincular)** para volver a elegir el campo web si el diseño de la página cambió.
  - Presionar **🗑️ (Eliminar)** para quitar campos o perfiles que ya no uses.

---

## 🛡️ Privacidad y Seguridad

- No se realiza ninguna petición de red externa.
- No se envían datos a servidores ni analíticas.
- Todo permanece estrictamente en la máquina local del usuario a través de la API `chrome.storage.local`.
