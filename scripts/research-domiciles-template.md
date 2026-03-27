# Domicile Research Workflow

Use this process before changing `data/domiciles.json`.

## Source priority

1. Official regulator page
2. Official domicile/government page
3. Official legislation or rules page
4. Reputable captive industry source for context only

## Update rules

- Auto-update only:
  - `legislation`
  - `min_capital`
  - `tax_notes`
- Manual review:
  - `summary`
  - `jurisdiction`
  - contacts
- If sources conflict, do not change the JSON.
- Every proposed change must include source URLs.

## Queue item shape

```json
{
  "domicile": "British Columbia",
  "proposedChanges": {
    "legislation": "Insurance (Captive Company) Act",
    "min_capital": {
      "Minimum Capital and Reserve": "300,000 CAD"
    },
    "tax_notes": "Premium taxes depend on where the risk is located"
  },
  "sources": [
    {
      "title": "BCFSA Captive Insurance",
      "type": "official_regulator",
      "url": "https://..."
    }
  ],
  "notes": "Only change fields directly supported by sources."
}
```

## Apply step

- Put proposed updates into `data/domicile-research-queue.json`
- Run:

```bash
node scripts/apply-domicile-updates.js
```

- Review `reports/domicile-update-review.md`
- If config mode is `live`, regenerate pages and commit the result
