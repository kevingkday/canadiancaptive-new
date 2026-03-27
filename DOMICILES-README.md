# Domicile Page Generator

Automated system for generating and maintaining 60+ domicile detail pages from a single JSON data source.

## Quick Start

```bash
node scripts/generate-domiciles.js
```

This reads `data/domiciles.json` and generates:
- **67 individual pages** in `/domiciles/` (e.g. `domiciles/bermuda.html`)
- **`domiciles.html`** — directory page with all domiciles grouped by region

## Monthly Update Workflow

1. Edit `data/domiciles.json` with updated information
2. Run `node scripts/generate-domiciles.js`
3. Commit and deploy

## JSON Data Structure

Each domicile entry in `data/domiciles.json` supports these fields:

```json
{
  "name": "British Columbia",
  "summary": "A brief overview of the domicile and its captive framework.",
  "jurisdiction": "Onshore (Canada)",
  "legislation": "Insurance (Captive Company) Act (ICCA)",
  "min_capital": {
    "Pure Captive": "$200,000",
    "Association Captive": "$500,000"
  },
  "tax_notes": "2% premium tax on net premiums written",
  "contact_name": "Jane Smith",
  "contact_email": "jane@example.com"
}
```

### Required Fields

| Field | Description |
|-------|-------------|
| `name` | Display name of the domicile |
| `summary` | Overview paragraph shown on the detail page |
| `jurisdiction` | Used for categorization and badge color (e.g. `Onshore (Canada)`, `Onshore (USA)`, `Offshore`, `EU/EEA`) |
| `legislation` | Primary regulatory framework or act |
| `min_capital` | Object with structure type → minimum capital amount pairs |
| `tax_notes` | Summary of the tax environment |

### Optional Fields

| Field | Description |
|-------|-------------|
| `contact_name` | Regulatory contact name (appears in Quick Facts sidebar) |
| `contact_email` | Contact email (renders as a mailto link) |

> **Tip:** Optional fields are skipped gracefully — domiciles without them simply won't show those sections.

## Adding a New Domicile

1. Add a new entry to the array in `data/domiciles.json`
2. Run the generator: `node scripts/generate-domiciles.js`
3. The new page is created automatically and the directory page updates

## Adding a New Field

To add a new data field (e.g. `website_url`):

1. Add the field to entries in `data/domiciles.json`
2. Edit `scripts/generate-domiciles.js` — find the Quick Facts sidebar in the `generateDomicilePage` function and add a conditional block:
   ```javascript
   ${domicile.website_url ? `<div class="border-t border-outline-variant/10 pt-5">
       <div class="text-xs font-label uppercase tracking-widest text-secondary mb-1">Website</div>
       <a href="${domicile.website_url}" target="_blank" class="text-primary hover:underline">${domicile.website_url}</a>
   </div>` : ''}
   ```
3. Re-run the generator

## Generated Page Features

Each domicile page includes:
- **Hero** with jurisdiction badge, summary, and CTA button
- **Quick Facts sidebar** — jurisdiction, legislation, tax environment, contact (if provided)
- **Capital requirements table** — all structure types and minimums
- **Prev/Next navigation** — browse between domiciles sequentially
- **CTA section** — consultation prompt

## File Structure

```
canadiancaptive-new/
├── data/
│   └── domiciles.json          # Source data (edit this)
├── scripts/
│   └── generate-domiciles.js   # Generator script
├── domiciles/
│   ├── abu-dhabi.html          # Generated pages
│   ├── alabama.html
│   ├── ...
│   └── virginia.html
└── domiciles.html              # Generated directory page
```
