let matches = [];

async function loadConfig() {
  const res = await fetch('/api/config');
  const data = await res.json();
  matches = data.matches;

  const matchSelect = document.getElementById('match');
  data.matches.forEach((m, idx) => {
    const option = document.createElement('option');
    option.value = idx;
    option.textContent = `${m.team1} vs ${m.team2} (${m.league})`;
    matchSelect.appendChild(option);
  });

  const geoSelect = document.getElementById('geos');
  Object.keys(data.geoSettings).forEach((geo) => {
    const option = document.createElement('option');
    option.value = geo;
    option.textContent = geo;
    geoSelect.appendChild(option);
  });

  const categorySelect = document.getElementById('category');
  Object.keys(data.templates).forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function selectedGeos() {
  return Array.from(document.getElementById('geos').selectedOptions).map((o) => o.value);
}

async function generate() {
  const match = matches[Number(document.getElementById('match').value)] || null;
  const category = document.getElementById('category').value;
  const templateId = document.getElementById('template').value.trim() || undefined;
  const geos = selectedGeos();
  const weighted = document.getElementById('weighted').checked;
  const qualityLock = document.getElementById('qualityLock').checked;

  const output = document.getElementById('output');

  if (!match || !geos.length) {
    output.textContent = 'Select a match and at least one GEO.';
    return;
  }

  const endpoint = geos.length > 1 ? '/api/generate-batch' : '/api/generate';
  const payload = geos.length > 1
    ? { match, geos, category, templateId, weighted, qualityLock }
    : { match, geo: geos[0], category, templateId, weighted, qualityLock };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  output.textContent = JSON.stringify(data, null, 2);
}

async function parseCsv() {
  const csv = document.getElementById('csv').value;
  const output = document.getElementById('output');

  const res = await fetch('/api/import/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv })
  });

  const data = await res.json();
  output.textContent = JSON.stringify(data, null, 2);
}

document.getElementById('generate').addEventListener('click', generate);
document.getElementById('parseCsv').addEventListener('click', parseCsv);

loadConfig();
