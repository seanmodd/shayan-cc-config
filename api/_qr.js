'use strict';
// _qr.js — dependency-free QR code encoder (byte mode, error-correction level M).
//
// Exports:
//   qrMatrix(text) -> { size, modules, version, mask }
//     modules: array of `size` rows, each an array of 0/1 (1 = dark module).
//   qrSvg(text, opts) -> standalone SVG string with a 4-module quiet zone.
//     opts.dark  — colour of dark modules (default 'currentColor')
//     opts.light — background colour (default '#fff'; pass 'none' for transparent)
//     opts.scale — pixels per module for the width/height attributes (default 4)
//
// Implementation follows ISO/IEC 18004: UTF-8 byte mode, EC level M, automatic
// smallest-version selection (1..40), Reed-Solomon over GF(256) with the 0x11d
// generator, standard block interleaving, all 8 masks scored with the standard
// 4-rule penalty evaluation, BCH-protected format info (mask 0x5412) and
// version info for versions >= 7.

// ---------------------------------------------------------------------------
// Tables for error-correction level M (index by version 1..40; index 0 unused)
// ---------------------------------------------------------------------------

var ECC_PER_BLOCK_M = [0,
  10, 16, 26, 18, 24, 16, 18, 22, 22, 26,
  30, 22, 22, 24, 24, 28, 28, 26, 26, 26,
  26, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28];

var NUM_BLOCKS_M = [0,
  1, 1, 1, 2, 2, 4, 4, 4, 5, 5,
  5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
  17, 17, 18, 20, 21, 23, 25, 26, 28, 29,
  31, 33, 35, 37, 38, 40, 43, 45, 47, 49];

// Total number of data modules (before codeword packing) for a version.
function rawDataModules(version) {
  var result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    var numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36; // two 3x6 version-info blocks
  }
  return result;
}

function totalCodewords(version) {
  return Math.floor(rawDataModules(version) / 8);
}

function dataCodewords(version) {
  return totalCodewords(version) - ECC_PER_BLOCK_M[version] * NUM_BLOCKS_M[version];
}

function charCountBits(version) {
  return version <= 9 ? 8 : 16; // byte mode
}

// ---------------------------------------------------------------------------
// UTF-8
// ---------------------------------------------------------------------------

function utf8Bytes(str) {
  var out = [];
  for (var i = 0; i < str.length; i++) {
    var cp = str.codePointAt(i);
    if (cp > 0xFFFF) i++; // surrogate pair consumed
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F));
    } else if (cp < 0x10000) {
      out.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
    } else {
      out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F),
               0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reed-Solomon over GF(256), generator polynomial 0x11d
// ---------------------------------------------------------------------------

function gfMultiply(x, y) {
  var z = 0;
  for (var i = 7; i >= 0; i--) {
    z = ((z << 1) ^ ((z >>> 7) * 0x11D)) & 0xFF;
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsComputeDivisor(degree) {
  // Monic polynomial (x - a^0)(x - a^1)...(x - a^{degree-1}), leading coef dropped.
  var result = [];
  for (var i = 0; i < degree - 1; i++) result.push(0);
  result.push(1);
  var root = 1;
  for (var d = 0; d < degree; d++) {
    for (var j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsComputeRemainder(data, divisor) {
  var result = divisor.map(function () { return 0; });
  for (var i = 0; i < data.length; i++) {
    var factor = data[i] ^ result.shift();
    result.push(0);
    for (var j = 0; j < divisor.length; j++) {
      result[j] ^= gfMultiply(divisor[j], factor);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Bit assembly
// ---------------------------------------------------------------------------

function appendBits(bits, value, length) {
  for (var i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
}

// Build the final interleaved codeword sequence for the given data bytes.
function buildCodewords(dataBytes, version) {
  var capacityBits = dataCodewords(version) * 8;
  var bits = [];
  appendBits(bits, 0x4, 4); // byte-mode indicator
  appendBits(bits, dataBytes.length, charCountBits(version));
  for (var i = 0; i < dataBytes.length; i++) appendBits(bits, dataBytes[i], 8);
  if (bits.length > capacityBits) throw new Error('QR internal: data overflow');

  // Terminator and bit padding.
  appendBits(bits, 0, Math.min(4, capacityBits - bits.length));
  appendBits(bits, 0, (8 - bits.length % 8) % 8);
  // Pad codewords.
  for (var pad = 0xEC; bits.length < capacityBits; pad ^= 0xEC ^ 0x11) {
    appendBits(bits, pad, 8);
  }

  var data = [];
  for (var b = 0; b < bits.length; b += 8) {
    var v = 0;
    for (var k = 0; k < 8; k++) v = (v << 1) | bits[b + k];
    data.push(v);
  }

  // Split into blocks, append ECC, interleave.
  var numBlocks = NUM_BLOCKS_M[version];
  var eccLen = ECC_PER_BLOCK_M[version];
  var raw = totalCodewords(version);
  var numShortBlocks = numBlocks - raw % numBlocks;
  var shortBlockLen = Math.floor(raw / numBlocks);

  var blocks = [];
  var divisor = rsComputeDivisor(eccLen);
  for (var bi = 0, off = 0; bi < numBlocks; bi++) {
    var datLen = shortBlockLen - eccLen + (bi < numShortBlocks ? 0 : 1);
    var dat = data.slice(off, off + datLen);
    off += datLen;
    var ecc = rsComputeRemainder(dat, divisor);
    if (bi < numShortBlocks) dat.push(-1); // placeholder, skipped in interleave
    blocks.push(dat.concat(ecc));
  }

  var result = [];
  for (var pos = 0; pos < blocks[0].length; pos++) {
    for (var bj = 0; bj < blocks.length; bj++) {
      if (pos !== shortBlockLen - eccLen || bj >= numShortBlocks) {
        result.push(blocks[bj][pos]);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Matrix construction
// ---------------------------------------------------------------------------

function makeGrid(size, fill) {
  var g = [];
  for (var y = 0; y < size; y++) {
    var row = [];
    for (var x = 0; x < size; x++) row.push(fill);
    g.push(row);
  }
  return g;
}

function alignmentPositions(version) {
  if (version === 1) return [];
  var numAlign = Math.floor(version / 7) + 2;
  var size = version * 4 + 17;
  var step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
  var result = [6];
  for (var pos = size - 7; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

function QrBuilder(version) {
  this.version = version;
  this.size = version * 4 + 17;
  this.modules = makeGrid(this.size, 0);
  this.isFunction = makeGrid(this.size, false);
}

QrBuilder.prototype.setFunctionModule = function (x, y, isDark) {
  this.modules[y][x] = isDark ? 1 : 0;
  this.isFunction[y][x] = true;
};

QrBuilder.prototype.drawFinderPattern = function (cx, cy) {
  for (var dy = -4; dy <= 4; dy++) {
    for (var dx = -4; dx <= 4; dx++) {
      var dist = Math.max(Math.abs(dx), Math.abs(dy));
      var x = cx + dx, y = cy + dy;
      if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
        this.setFunctionModule(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
};

QrBuilder.prototype.drawAlignmentPattern = function (cx, cy) {
  for (var dy = -2; dy <= 2; dy++) {
    for (var dx = -2; dx <= 2; dx++) {
      this.setFunctionModule(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
};

QrBuilder.prototype.drawFormatBits = function (mask) {
  // EC level M format bits = 0b00, then 3 mask bits; BCH(15,5); XOR 0x5412.
  var data = (0x0 << 3) | mask;
  var rem = data;
  for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  var bits = ((data << 10) | rem) ^ 0x5412;

  function bit(n) { return ((bits >>> n) & 1) === 1; }

  // First copy (around the top-left finder).
  for (var a = 0; a <= 5; a++) this.setFunctionModule(8, a, bit(a));
  this.setFunctionModule(8, 7, bit(6));
  this.setFunctionModule(8, 8, bit(7));
  this.setFunctionModule(7, 8, bit(8));
  for (var b = 9; b < 15; b++) this.setFunctionModule(14 - b, 8, bit(b));

  // Second copy (split between top-right and bottom-left).
  for (var c = 0; c < 8; c++) this.setFunctionModule(this.size - 1 - c, 8, bit(c));
  for (var d = 8; d < 15; d++) this.setFunctionModule(8, this.size - 15 + d, bit(d));
  this.setFunctionModule(8, this.size - 8, true); // always-dark module
};

QrBuilder.prototype.drawVersionInfo = function () {
  if (this.version < 7) return;
  // BCH(18,6) with generator 0x1F25.
  var rem = this.version;
  for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
  var bits = (this.version << 12) | rem;
  for (var n = 0; n < 18; n++) {
    var isDark = ((bits >>> n) & 1) === 1;
    var a = this.size - 11 + n % 3;
    var b = Math.floor(n / 3);
    this.setFunctionModule(a, b, isDark);
    this.setFunctionModule(b, a, isDark);
  }
};

QrBuilder.prototype.drawFunctionPatterns = function () {
  // Timing patterns.
  for (var i = 0; i < this.size; i++) {
    this.setFunctionModule(6, i, i % 2 === 0);
    this.setFunctionModule(i, 6, i % 2 === 0);
  }
  // Finder patterns (with separators via clipping).
  this.drawFinderPattern(3, 3);
  this.drawFinderPattern(this.size - 4, 3);
  this.drawFinderPattern(3, this.size - 4);
  // Alignment patterns (skip the three finder corners).
  var pos = alignmentPositions(this.version);
  var n = pos.length;
  for (var a = 0; a < n; a++) {
    for (var b = 0; b < n; b++) {
      if ((a === 0 && b === 0) || (a === 0 && b === n - 1) || (a === n - 1 && b === 0)) continue;
      this.drawAlignmentPattern(pos[a], pos[b]);
    }
  }
  this.drawFormatBits(0); // reserve; real mask drawn later
  this.drawVersionInfo();
};

QrBuilder.prototype.drawCodewords = function (data) {
  var size = this.size;
  var i = 0; // bit index into data
  for (var right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (var vert = 0; vert < size; vert++) {
      for (var j = 0; j < 2; j++) {
        var x = right - j;
        var upward = ((right + 1) & 2) === 0;
        var y = upward ? size - 1 - vert : vert;
        if (!this.isFunction[y][x] && i < data.length * 8) {
          this.modules[y][x] = (data[i >>> 3] >>> (7 - (i & 7))) & 1;
          i++;
        }
        // Remaining (remainder) bits stay light, per the spec.
      }
    }
  }
};

QrBuilder.prototype.applyMask = function (mask) {
  for (var y = 0; y < this.size; y++) {
    for (var x = 0; x < this.size; x++) {
      var invert;
      switch (mask) {
        case 0: invert = (x + y) % 2 === 0; break;
        case 1: invert = y % 2 === 0; break;
        case 2: invert = x % 3 === 0; break;
        case 3: invert = (x + y) % 3 === 0; break;
        case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: invert = (x * y) % 2 + (x * y) % 3 === 0; break;
        case 6: invert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
        default: invert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
      }
      if (!this.isFunction[y][x] && invert) this.modules[y][x] ^= 1;
    }
  }
};

// --- Penalty scoring (the standard four rules; N1=3, N2=3, N3=40, N4=10) ---

QrBuilder.prototype.finderPenaltyCountPatterns = function (runHistory) {
  var n = runHistory[1];
  var core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 &&
             runHistory[4] === n && runHistory[5] === n;
  return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
         (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
};

QrBuilder.prototype.finderPenaltyAddHistory = function (currentRunLength, runHistory) {
  if (runHistory[0] === 0) currentRunLength += this.size; // light border
  runHistory.pop();
  runHistory.unshift(currentRunLength);
};

QrBuilder.prototype.finderPenaltyTerminateAndCount = function (currentRunColor, currentRunLength, runHistory) {
  if (currentRunColor) { // terminate dark run
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    currentRunLength = 0;
  }
  currentRunLength += this.size; // light border
  this.finderPenaltyAddHistory(currentRunLength, runHistory);
  return this.finderPenaltyCountPatterns(runHistory);
};

QrBuilder.prototype.getPenaltyScore = function () {
  var N1 = 3, N2 = 3, N3 = 40, N4 = 10;
  var result = 0;
  var size = this.size;
  var modules = this.modules;
  var x, y;

  // Rule 1 (rows) + rule 3 (rows).
  for (y = 0; y < size; y++) {
    var runColor = 0, runX = 0;
    var runHistory = [0, 0, 0, 0, 0, 0, 0];
    for (x = 0; x < size; x++) {
      if (modules[y][x] === runColor) {
        runX++;
        if (runX === 5) result += N1;
        else if (runX > 5) result++;
      } else {
        this.finderPenaltyAddHistory(runX, runHistory);
        if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * N3;
        runColor = modules[y][x];
        runX = 1;
      }
    }
    result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * N3;
  }
  // Rule 1 (columns) + rule 3 (columns).
  for (x = 0; x < size; x++) {
    var runColorC = 0, runY = 0;
    var runHistoryC = [0, 0, 0, 0, 0, 0, 0];
    for (y = 0; y < size; y++) {
      if (modules[y][x] === runColorC) {
        runY++;
        if (runY === 5) result += N1;
        else if (runY > 5) result++;
      } else {
        this.finderPenaltyAddHistory(runY, runHistoryC);
        if (!runColorC) result += this.finderPenaltyCountPatterns(runHistoryC) * N3;
        runColorC = modules[y][x];
        runY = 1;
      }
    }
    result += this.finderPenaltyTerminateAndCount(runColorC, runY, runHistoryC) * N3;
  }

  // Rule 2: 2x2 blocks of the same colour.
  for (y = 0; y < size - 1; y++) {
    for (x = 0; x < size - 1; x++) {
      var c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        result += N2;
      }
    }
  }

  // Rule 4: dark-module proportion.
  var dark = 0;
  for (y = 0; y < size; y++) {
    for (x = 0; x < size; x++) dark += modules[y][x];
  }
  var total = size * size;
  var k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  result += k * N4;
  return result;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function qrMatrix(text) {
  if (typeof text !== 'string') throw new TypeError('qrMatrix: text must be a string');
  var bytes = utf8Bytes(text);

  // Smallest version that fits (byte mode, EC level M).
  var version = -1;
  for (var v = 1; v <= 40; v++) {
    var needed = 4 + charCountBits(v) + bytes.length * 8;
    if (needed <= dataCodewords(v) * 8) { version = v; break; }
  }
  if (version === -1) {
    throw new Error('qrMatrix: data too long (' + bytes.length +
      ' bytes; max 2331 bytes at EC level M)');
  }

  var qr = new QrBuilder(version);
  qr.drawFunctionPatterns();
  qr.drawCodewords(buildCodewords(bytes, version));

  // Choose the mask with the lowest penalty score.
  var bestMask = 0, bestScore = Infinity;
  for (var m = 0; m < 8; m++) {
    qr.applyMask(m);
    qr.drawFormatBits(m);
    var score = qr.getPenaltyScore();
    if (score < bestScore) { bestScore = score; bestMask = m; }
    qr.applyMask(m); // XOR is involutive: undo
  }
  qr.applyMask(bestMask);
  qr.drawFormatBits(bestMask);

  return { size: qr.size, modules: qr.modules, version: version, mask: bestMask };
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function qrSvg(text, opts) {
  opts = opts || {};
  var dark = opts.dark != null ? opts.dark : 'currentColor';
  var light = opts.light != null ? opts.light : '#fff';
  var scale = opts.scale != null ? opts.scale : 4;
  var quiet = 4;

  var qr = qrMatrix(text);
  var dim = qr.size + quiet * 2;

  var path = '';
  for (var y = 0; y < qr.size; y++) {
    var row = qr.modules[y];
    for (var x = 0; x < qr.size; x++) {
      if (row[x]) path += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h1v1h-1z';
    }
  }

  var px = dim * scale;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px +
    '" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges" role="img">';
  if (light !== 'none') {
    svg += '<rect width="' + dim + '" height="' + dim + '" fill="' + escapeAttr(light) + '"/>';
  }
  svg += '<path d="' + path + '" fill="' + escapeAttr(dark) + '"/></svg>';
  return svg;
}

module.exports = { qrMatrix: qrMatrix, qrSvg: qrSvg };
