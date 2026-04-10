const { normalizeMatch, validateMatch } = require('./promptGenerator');

function parseCsv(csvText) {
  const rows = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    return { rows: [], errors: [{ row: 0, error: 'CSV must include header and at least one row' }] };
  }

  const headers = rows[0].split(',').map((h) => h.trim());
  const parsedRows = [];
  const errors = [];

  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i].split(',').map((v) => v.trim());
    const obj = headers.reduce((acc, header, idx) => {
      acc[header] = values[idx] || '';
      return acc;
    }, {});

    const normalized = normalizeMatch(obj);
    const validation = validateMatch(normalized);

    if (!validation.valid) {
      errors.push({ row: i + 1, error: `Missing fields: ${validation.missing.join(', ')}` });
      continue;
    }

    parsedRows.push(normalized);
  }

  return { rows: parsedRows, errors };
}

module.exports = { parseCsv };
