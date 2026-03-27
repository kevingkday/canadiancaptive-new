const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'domiciles.json');
const QUEUE_FILE = path.join(ROOT, 'data', 'domicile-research-queue.json');
const CONFIG_FILE = path.join(ROOT, 'scripts', 'domicile-update-config.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_FILE = path.join(REPORT_DIR, 'domicile-update-review.md');
const GENERATOR = path.join(ROOT, 'scripts', 'generate-domiciles.js');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function validateQueueItem(item, config) {
  const errors = [];
  if (!item || typeof item !== 'object') errors.push('item must be an object');
  if (!item.domicile) errors.push('missing domicile');
  if (!item.proposedChanges || typeof item.proposedChanges !== 'object') errors.push('missing proposedChanges');
  if (config.requireSourceUrls) {
    if (!Array.isArray(item.sources) || item.sources.length === 0) {
      errors.push('sources required');
    } else {
      const bad = item.sources.find(s => !s || !s.url || !s.type || !s.title);
      if (bad) errors.push('each source needs title, type, url');
    }
  }
  return errors;
}

function isAllowedField(field, config) {
  return config.autoUpdateFields.includes(field) || config.manualReviewFields.includes(field);
}

function buildReport(results, config) {
  const lines = [];
  lines.push('# Domicile Update Review');
  lines.push('');
  lines.push(`Mode: ${config.mode}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  if (results.length === 0) {
    lines.push('No queued updates found.');
    return lines.join('\n') + '\n';
  }

  for (const result of results) {
    lines.push(`## ${result.domicile}`);
    lines.push('');
    lines.push(`Status: ${result.status}`);
    if (result.errors.length) {
      lines.push('Errors:');
      for (const err of result.errors) lines.push(`- ${err}`);
    }
    if (result.applied.length) {
      lines.push('Applied changes:');
      for (const change of result.applied) lines.push(`- ${change.field}`);
    }
    if (result.skipped.length) {
      lines.push('Skipped changes:');
      for (const change of result.skipped) lines.push(`- ${change.field}: ${change.reason}`);
    }
    if (result.sources.length) {
      lines.push('Sources:');
      for (const source of result.sources) lines.push(`- [${source.title}](${source.url}) (${source.type})`);
    }
    if (result.notes) {
      lines.push('Notes:');
      lines.push(result.notes);
    }
    lines.push('');
  }

  return lines.join('\n') + '\n';
}

function main() {
  const config = loadJson(CONFIG_FILE);
  const domiciles = loadJson(DATA_FILE);
  const queue = loadJson(QUEUE_FILE);
  const byName = new Map(domiciles.map(d => [normalizeName(d.name), d]));
  const results = [];
  let changed = false;

  for (const item of (queue.items || [])) {
    const result = {
      domicile: item?.domicile || '(unknown)',
      status: 'pending',
      errors: [],
      applied: [],
      skipped: [],
      sources: Array.isArray(item?.sources) ? item.sources : [],
      notes: item?.notes || ''
    };

    const errors = validateQueueItem(item, config);
    if (errors.length) {
      result.status = 'invalid';
      result.errors.push(...errors);
      results.push(result);
      continue;
    }

    const target = byName.get(normalizeName(item.domicile));
    if (!target) {
      result.status = 'not_found';
      result.errors.push('domicile not found in domiciles.json');
      results.push(result);
      continue;
    }

    const proposed = item.proposedChanges || {};
    for (const [field, newValue] of Object.entries(proposed)) {
      if (!isAllowedField(field, config)) {
        result.skipped.push({ field, reason: 'field not configured for update workflow' });
        continue;
      }

      if (config.manualReviewFields.includes(field)) {
        result.skipped.push({ field, reason: 'manual review field' });
        continue;
      }

      const oldValue = target[field];
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        result.skipped.push({ field, reason: 'no change' });
        continue;
      }

      if (config.mode === 'draft') {
        result.skipped.push({ field, reason: 'draft mode' });
        continue;
      }

      target[field] = newValue;
      result.applied.push({ field, oldValue, newValue });
      changed = true;
    }

    result.status = result.applied.length ? 'applied' : 'review';
    results.push(result);
  }

  ensureDir(REPORT_DIR);
  fs.writeFileSync(REPORT_FILE, buildReport(results, config), 'utf8');

  if (changed) {
    saveJson(DATA_FILE, domiciles);
    if (config.generatePagesAfterUpdate) {
      execFileSync(process.execPath, [GENERATOR], { stdio: 'inherit' });
    }
  }

  queue.updatedAt = new Date().toISOString();
  saveJson(QUEUE_FILE, queue);

  console.log(`Review report written to ${REPORT_FILE}`);
  console.log(changed ? 'Changes applied.' : 'No changes applied.');
}

main();
