const fs = require('fs');
const path = require('path');

function readJson(relativePath) {
  const fullPath = path.join(__dirname, '..', '..', relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

module.exports = { readJson };
