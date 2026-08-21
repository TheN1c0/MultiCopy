const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Datos realistas para pruebas con MultiCopy
const data = [
  {
    "RUT": "12.345.678-9",
    "Nombre": "Juan",
    "Apellido": "Pérez",
    "Email": "juan.perez@empresa.cl",
    "Teléfono": "912345678",
    "Fecha Nacimiento": "20/08/1990",
    "Sexo": "Masculino",
    "Observaciones": "Ingeniero de Software Senior con experiencia en arquitectura cloud.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Indefinido"
  },
  {
    "RUT": "18.765.432-1",
    "Nombre": "María",
    "Apellido": "Soto",
    "Email": "maria.soto@empresa.cl",
    "Teléfono": "987654321",
    "Fecha Nacimiento": "15/03/1995",
    "Sexo": "Femenino",
    "Observaciones": "Diseñadora UX/UI especialista en Design Systems y Figma.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Plazo Fijo"
  },
  {
    "RUT": "15.987.654-3",
    "Nombre": "Carlos",
    "Apellido": "González",
    "Email": "carlos.gonzalez@consultora.cl",
    "Teléfono": "955512345",
    "Fecha Nacimiento": "10/11/1988",
    "Sexo": "Masculino",
    "Observaciones": "Consultor DevOps y especialista en Docker y Kubernetes.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Honorarios"
  },
  {
    "RUT": "19.456.789-0",
    "Nombre": "Camila",
    "Apellido": "Rojas",
    "Email": "camila.rojas@techcorp.com",
    "Teléfono": "977788990",
    "Fecha Nacimiento": "05/07/1997",
    "Sexo": "Femenino",
    "Observaciones": "Desarrolladora Frontend React y Vue con 4 años de experiencia.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Indefinido"
  },
  {
    "RUT": "11.223.344-5",
    "Nombre": "Roberto",
    "Apellido": "Muñoz",
    "Email": "roberto.munoz@innovacion.cl",
    "Teléfono": "944433221",
    "Fecha Nacimiento": "12/01/1982",
    "Sexo": "Masculino",
    "Observaciones": "Project Manager certificado PMP con manejo de metodologías ágiles Scrum.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Indefinido"
  },
  {
    "RUT": "17.332.114-K",
    "Nombre": "Valentina",
    "Apellido": "Morales",
    "Email": "v.morales@analytics.cl",
    "Teléfono": "966677889",
    "Fecha Nacimiento": "28/09/1993",
    "Sexo": "Femenino",
    "Observaciones": "Científica de Datos con dominio en Python, Pandas y Machine Learning.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Plazo Fijo"
  },
  {
    "RUT": "16.889.900-2",
    "Nombre": "Ignacio",
    "Apellido": "Bravo",
    "Email": "ignacio.bravo@bravobytes.cl",
    "Teléfono": "933322110",
    "Fecha Nacimiento": "14/04/1991",
    "Sexo": "Masculino",
    "Observaciones": "Analista Programador Fullstack y creador de soluciones web a medida.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Indefinido"
  },
  {
    "RUT": "20.112.233-4",
    "Nombre": "Francisca",
    "Apellido": "Vargas",
    "Email": "fran.vargas@marketing.com",
    "Teléfono": "988899001",
    "Fecha Nacimiento": "03/12/1999",
    "Sexo": "Femenino",
    "Observaciones": "Especialista en Growth Marketing y optimización de conversiones.",
    "Acepta Términos": "si",
    "Tipo Contrato": "Honorarios"
  }
];

const testDir = path.join(__dirname, 'test');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 1. Crear archivo Excel nativo (.xlsx)
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Personas");

const xlsxPath = path.join(testDir, 'datos_prueba.xlsx');
XLSX.writeFile(workbook, xlsxPath);
console.log(`✓ Archivo Excel generado: ${xlsxPath}`);

// 2. Crear archivo CSV con BOM (abre perfecto en cualquier Excel con doble clic)
const headers = Object.keys(data[0]);
const csvRows = [headers.join('\t')];

data.forEach(row => {
  const values = headers.map(header => {
    let val = row[header] || '';
    if (val.includes('\t') || val.includes('\n') || val.includes('"')) {
      val = `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  });
  csvRows.push(values.join('\t'));
});

const csvPath = path.join(testDir, 'datos_prueba.csv');
const bom = '\uFEFF'; // UTF-8 BOM para soporte de tildes en Excel
fs.writeFileSync(csvPath, bom + csvRows.join('\r\n'), 'utf8');
console.log(`✓ Archivo CSV TSV generado: ${csvPath}`);
