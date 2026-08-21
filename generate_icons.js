const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Generador de PNG con estética BravoBytes (Navy Blue #101c2c + Cyan #00b4d8)
function createPNG(size) {
  const width = size;
  const height = size;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth: 8
  ihdr.writeUInt8(6, 9);  // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdr);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const outerRadius = width * 0.46;
      const innerRadius = width * 0.38;

      if (dist <= outerRadius) {
        if (dist > innerRadius) {
          // Borde exterior cyan brillante
          rawData[pxOffset] = 0;       // R
          rawData[pxOffset + 1] = 180; // G
          rawData[pxOffset + 2] = 216; // B
          rawData[pxOffset + 3] = 255; // A
        } else {
          // Fondo Navy BravoBytes (#101c2c -> #19273b)
          const t = (x + y) / (width * 2);
          rawData[pxOffset] = Math.floor(16 + 20 * t);
          rawData[pxOffset + 1] = Math.floor(28 + 25 * t);
          rawData[pxOffset + 2] = Math.floor(44 + 30 * t);
          rawData[pxOffset + 3] = 255;
        }

        // Dibujo de marca central (rayo / capas)
        if (Math.abs(dx) < width * 0.22 && Math.abs(dy) < height * 0.22) {
          rawData[pxOffset] = 72;      // R
          rawData[pxOffset + 1] = 202; // G
          rawData[pxOffset + 2] = 228; // B
          rawData[pxOffset + 3] = 255;
        }
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuf = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuf);
  console.log(`Icono BravoBytes generado: icon${size}.png (${size}x${size})`);
});
