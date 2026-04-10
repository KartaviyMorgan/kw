const express = require('express');
const path = require('path');
const { readJson } = require('./src/utils/fileStore');
const { generatePrompt, generateMultiGeo, REQUIRED_MATCH_FIELDS } = require('./src/services/promptGenerator');
const { parseCsv } = require('./src/services/csvService');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/config', (_req, res) => {
  res.json({
    geoSettings: readJson('data/geo_settings.json'),
    templates: readJson('data/prompt_templates.json'),
    matches: readJson('data/prompts.json').matches,
    requiredFields: REQUIRED_MATCH_FIELDS
  });
});

app.post('/api/generate', (req, res) => {
  try {
    const result = generatePrompt(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/generate-batch', (req, res) => {
  try {
    const result = generateMultiGeo(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/import/csv', (req, res) => {
  try {
    const csvText = req.body.csv || '';
    const result = parseCsv(csvText);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Prompt generator running on http://localhost:${port}`);
});
