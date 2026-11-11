// Builds Apollo's sprite sheet from model.js.
//
//   node tools/apollo-sprite/build.js
//
// Writes assets/mascot/apollo.png (one row of 50x30 cells: every animation
// frame, then the tennis ball and two squirrel frames) and rewrites the frame
// map between the sprite-map markers in mascot-chat.js. No dependencies: the
// PNG is encoded here with Node's zlib.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const model = require('./model.js');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_PNG = path.join(ROOT, 'assets', 'mascot', 'apollo.png');
const CHAT_JS = path.join(ROOT, 'mascot-chat.js');
const CW = model.W, CH = model.H;

// ---- Lay out the cells ------------------------------------------------------
const cells = [];
const map = {};
for (const name of Object.keys(model.FRAMES)) {
    map[name] = model.FRAMES[name].map((rows) => cells.push(rows) - 1);
}
map.toy = [cells.push(model.BALL) - 1];
map.squirrel = model.SQUIRREL.map((rows) => cells.push(rows) - 1);

// ---- Paint RGBA -------------------------------------------------------------
const width = cells.length * CW, height = CH;
const px = Buffer.alloc(width * height * 4);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
cells.forEach((rows, i) => {
    rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === '.') continue;
            const c = model.PAL[ch];
            if (!c) throw new Error('No colour for "' + ch + '"');
            const o = (y * width + i * CW + x) * 4;
            const [r, g, b] = rgb(c);
            px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
        }
    });
});

// ---- Encode PNG -------------------------------------------------------------
const CRC = new Int32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c;
});
function crc32(buf) {
    let c = -1;
    for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
}
function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y++) px.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
]);
fs.mkdirSync(path.dirname(OUT_PNG), { recursive: true });
fs.writeFileSync(OUT_PNG, png);

// ---- Frame map into mascot-chat.js -------------------------------------------
const version = crypto.createHash('sha1').update(png).digest('hex').slice(0, 8);
const block =
    '    // sprite-map:start (written by tools/apollo-sprite/build.js; do not edit)\n' +
    '    var SPRITE = {\n' +
    "        url: 'assets/mascot/apollo.png?v=" + version + "',\n" +
    '        cell: [' + CW + ', ' + CH + '],\n' +
    '        cells: ' + cells.length + ',\n' +
    '        frames: ' + JSON.stringify(map).replace(/,"/g, ', "').replace(/":/g, '": ') + '\n' +
    '    };\n' +
    '    // sprite-map:end';
const js = fs.readFileSync(CHAT_JS, 'utf8');
const re = /    \/\/ sprite-map:start[\s\S]*?\/\/ sprite-map:end/;
if (!re.test(js)) throw new Error('sprite-map markers not found in mascot-chat.js');
fs.writeFileSync(CHAT_JS, js.replace(re, block));

console.log('apollo.png ' + width + 'x' + height + ', ' + png.length + ' bytes, ' + cells.length + ' cells, v=' + version);
