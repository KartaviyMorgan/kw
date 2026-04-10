const { readJson } = require('../utils/fileStore');

const GEO_SETTINGS = readJson('data/geo_settings.json');
const TEMPLATE_CATALOG = readJson('data/prompt_templates.json');

const REQUIRED_MATCH_FIELDS = ['team1', 'team2', 'league', 'country', 'sport', 'date'];

const QUALITY_LOCK_BLOCK = [
  'TEXT RULE — FINAL / NON-NEGOTIABLE',
  'Use exact headline text and exact spelling; do not rewrite.',
  'FORMAT LOCK',
  'Output in one final production layout, no alternates.',
  'no crop / no border / no resize',
  'Preserve exact text placement and legibility.'
].join('\n');

function normalizeMatch(match) {
  return {
    team1: String(match.team1 || '').trim(),
    team2: String(match.team2 || '').trim(),
    league: String(match.league || '').trim(),
    country: String(match.country || '').trim(),
    sport: String(match.sport || '').trim(),
    date: String(match.date || '').trim(),
    match_name: `${String(match.team1 || '').trim()} vs ${String(match.team2 || '').trim()}`
  };
}

function validateMatch(match) {
  const missing = REQUIRED_MATCH_FIELDS.filter((field) => !match[field]);
  return { valid: missing.length === 0, missing };
}

function mulberry32(seed) {
  let t = seed;
  return function random() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(text) {
  return text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1;
}

function selectTemplate({ category, templateId, weighted = true, deterministicKey }) {
  const templates = TEMPLATE_CATALOG[category] || [];
  if (!templates.length) {
    throw new Error(`Template category '${category}' not found`);
  }

  if (templateId) {
    const exact = templates.find((entry) => entry.id === templateId);
    if (!exact) {
      throw new Error(`Template id '${templateId}' not found in category '${category}'`);
    }
    return exact;
  }

  const seed = hashSeed(deterministicKey || `${category}-${templates.length}`);
  const random = mulberry32(seed);

  if (!weighted) {
    return templates[Math.floor(random() * templates.length) % templates.length];
  }

  const total = templates.reduce((sum, tpl) => sum + (tpl.weight || 1), 0);
  const ticket = random() * total;
  let cursor = 0;
  for (const tpl of templates) {
    cursor += tpl.weight || 1;
    if (ticket <= cursor) return tpl;
  }

  return templates[0];
}

function hydrateTemplate(template, context) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => context[key] ?? '');
}

function generatePrompt({ match, geo, category, templateId, weighted, qualityLock }) {
  const normalizedMatch = normalizeMatch(match);
  const validation = validateMatch(normalizedMatch);
  if (!validation.valid) {
    throw new Error(`Match is missing required fields: ${validation.missing.join(', ')}`);
  }

  const geoSetting = GEO_SETTINGS[geo];
  if (!geoSetting) {
    throw new Error(`Unsupported GEO: ${geo}`);
  }

  const template = selectTemplate({
    category,
    templateId,
    weighted,
    deterministicKey: `${normalizedMatch.match_name}-${normalizedMatch.date}-${geo}-${category}`
  });

  const context = {
    ...normalizedMatch,
    geo,
    ...geoSetting
  };

  const body = hydrateTemplate(template.template, context).trim();

  return {
    geo,
    category,
    template_id: template.id,
    prompt: qualityLock ? `${body}\n\n${QUALITY_LOCK_BLOCK}` : body
  };
}

function generateMultiGeo({ match, geos, category, templateId, weighted = true, qualityLock = false }) {
  const results = geos.map((geo) =>
    generatePrompt({ match, geo, category, templateId, weighted, qualityLock })
  );
  return { count: results.length, prompts: results };
}

module.exports = {
  normalizeMatch,
  validateMatch,
  generatePrompt,
  generateMultiGeo,
  selectTemplate,
  hydrateTemplate,
  REQUIRED_MATCH_FIELDS
};
