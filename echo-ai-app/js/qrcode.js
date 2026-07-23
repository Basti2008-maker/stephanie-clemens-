// Minimal, dependency-free QR code encoder (Version 1, 21x21, alphanumeric
// mode, error correction level L, fixed mask pattern 0). No CDN/network
// dependency — everything (Reed-Solomon tables, BCH format info) is derived
// at runtime instead of relying on transcribed magic-number tables.
//
// Scope note: this covers short payloads only (<=19 alphanumeric chars),
// which is enough for a party join code. If you need to encode longer
// strings, use a full-featured QR library instead.

const QR_ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const QR_SIZE = 21;
const QR_DATA_CODEWORDS = 19;
const QR_EC_CODEWORDS = 7;

function qrBuildGaloisTables() {
  const exp = new Array(256).fill(0);
  const log = new Array(256).fill(0);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  return { exp, log };
}
const QR_GF = qrBuildGaloisTables();

function qrGfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return QR_GF.exp[QR_GF.log[a] + QR_GF.log[b]];
}

function qrMultiplyPoly(p1, p2) {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= qrGfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function qrGeneratorPoly(ecCount) {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    poly = qrMultiplyPoly(poly, [1, QR_GF.exp[i]]);
  }
  return poly;
}

function qrComputeECCodewords(dataBytes, ecCount) {
  const generator = qrGeneratorPoly(ecCount);
  const remainder = dataBytes.concat(new Array(ecCount).fill(0));
  for (let i = 0; i < dataBytes.length; i++) {
    const coef = remainder[i];
    if (coef !== 0) {
      for (let j = 0; j < generator.length; j++) {
        remainder[i + j] ^= qrGfMul(generator[j], coef);
      }
    }
  }
  return remainder.slice(dataBytes.length);
}

function qrEncodeAlphanumericBits(text) {
  const bits = [];
  const pushBits = (value, len) => { for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1); };
  pushBits(0b0010, 4); // mode indicator: alphanumeric
  pushBits(text.length, 9); // character count indicator (versions 1-9)

  for (let i = 0; i < text.length; i += 2) {
    const c1 = QR_ALPHANUMERIC.indexOf(text[i]);
    if (i + 1 < text.length) {
      const c2 = QR_ALPHANUMERIC.indexOf(text[i + 1]);
      pushBits(c1 * 45 + c2, 11);
    } else {
      pushBits(c1, 6);
    }
  }

  const totalDataBits = QR_DATA_CODEWORDS * 8;
  const terminatorLen = Math.min(4, totalDataBits - bits.length);
  for (let i = 0; i < terminatorLen; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0b11101100, 0b00010001];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }
  return bits.slice(0, totalDataBits);
}

function qrBitsToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
    bytes.push(byte);
  }
  return bytes;
}

function qrBchFormatBits(data5) {
  const g = 0b10100110111; // degree-10 BCH generator for format info
  let d = data5 << 10;
  for (let i = 14; i >= 10; i--) {
    if ((d >> i) & 1) d ^= g << (i - 10);
  }
  return ((data5 << 10) | d) ^ 0b101010000010010;
}

/** Builds the 21x21 module matrix (1 = dark, 0 = light) for the given text. */
function qrBuildMatrix(text) {
  const size = QR_SIZE;
  const dark = Array.from({ length: size }, () => new Array(size).fill(0));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const setModule = (r, c, value, isReserved = true) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    dark[r][c] = value ? 1 : 0;
    if (isReserved) reserved[r][c] = true;
  };

  const drawFinder = (baseRow, baseCol) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = baseRow + r, cc = baseCol + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const isDark = (r >= 0 && r <= 6 && c >= 0 && c <= 6) &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setModule(rr, cc, isDark ? 1 : 0);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0 ? 1 : 0);
    setModule(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Reserve the dark module's cell now (value is written last, after format
  // info — it overlaps the same position format copy 2 writes to, and per
  // spec the dark module wins).
  reserved[size - 8][8] = true;

  // ---- Format info (EC level L = 01, mask pattern 0 = 000) ----
  // Placed BEFORE data so `setModule`'s reservation is the single source of
  // truth for which cells are function patterns (no separate, hand-copied
  // reservation ranges that could drift out of sync with the actual writes).
  const formatData5 = (0b01 << 3) | 0b000;
  const formatBits15 = qrBchFormatBits(formatData5);
  const fBit = (i) => (formatBits15 >> i) & 1;

  for (let i = 0; i <= 5; i++) setModule(8, i, fBit(i));
  setModule(8, 7, fBit(6));
  setModule(8, 8, fBit(7));
  setModule(7, 8, fBit(8));
  for (let i = 9; i <= 14; i++) setModule(14 - i, 8, fBit(i));

  // Copy 2, vertical run near the bottom-left finder: bits 0-6 at column 8,
  // rows (size-1) down to (size-7) — deliberately stops at (size-7), leaving
  // (size-8, 8) free for the dark module (no overlap in this layout).
  for (let i = 0; i <= 6; i++) setModule(size - 1 - i, 8, fBit(i));
  // Copy 2, horizontal run near the top-right finder: bits 7-14 at row 8,
  // columns (size-8) through (size-1).
  for (let i = 7; i <= 14; i++) setModule(8, size - 8 + (i - 7), fBit(i));

  // ---- Build data codewords ----
  const dataBits = qrEncodeAlphanumericBits(text);
  const dataBytes = qrBitsToBytes(dataBits);
  const ecBytes = qrComputeECCodewords(dataBytes, QR_EC_CODEWORDS);
  const allBytes = dataBytes.concat(ecBytes);
  const allBits = [];
  allBytes.forEach((b) => { for (let i = 7; i >= 0; i--) allBits.push((b >> i) & 1); });

  // ---- Place data in the zigzag pattern, applying mask 0 ----
  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5;
    for (let vert = 0; vert < size; vert++) {
      const row = upward ? size - 1 - vert : vert;
      for (let cOffset = 0; cOffset < 2; cOffset++) {
        const currentCol = col - cOffset;
        if (reserved[row][currentCol]) continue;
        const bit = bitIndex < allBits.length ? allBits[bitIndex] : 0;
        bitIndex++;
        const maskBit = (row + currentCol) % 2 === 0 ? 1 : 0;
        dark[row][currentCol] = bit ^ maskBit;
      }
    }
    upward = !upward;
  }

  // Fixed dark module wins over whatever format copy 2 wrote at this cell.
  dark[size - 8][8] = 1;

  return dark;
}

/** Renders `text` (uppercase alphanumeric, <=19 chars) as a QR code onto the given canvas. */
function qrRenderToCanvas(canvas, text, moduleSize = 8) {
  const matrix = qrBuildMatrix(text.toUpperCase());
  const quiet = 4;
  const total = QR_SIZE + quiet * 2;
  canvas.width = total * moduleSize;
  canvas.height = total * moduleSize;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + quiet) * moduleSize, (r + quiet) * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}
