# domiciles.json schema

Each domicile object should use this shape:

- `slug` — stable URL/file slug
- `name`
- `summary`
- `jurisdiction`
- `legislation`
- `min_capital`
- `tax_notes`
- `contact_name` (optional)
- `contact_email` (optional)
- `last_verified` (optional, `YYYY-MM-DD`)
- `source_urls` (optional array)

Notes:
- `slug` is now the source of truth for generated filenames.
- Do not infer filenames from `name` during generation.
- Keep `source_urls` to official pages where possible.
