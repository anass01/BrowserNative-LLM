const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG data uri, but we'll use a small placeholder PNG
// It's just enough for the browser to parse it as a valid image for PWA specs
const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

const imgBuffer = Buffer.from(b64, 'base64');

fs.writeFileSync(path.join(__dirname, 'public', 'icon-192.png'), imgBuffer);
fs.writeFileSync(path.join(__dirname, 'public', 'icon-512.png'), imgBuffer);
console.log('Icons created');
