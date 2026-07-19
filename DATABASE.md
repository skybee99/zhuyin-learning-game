# DATABASE.md

## Cloudflare D1 binding

V1.3.0 introduces the planned permanent dictionary database through Cloudflare D1.

- Worker binding: `DB`
- Wrangler database name: `zhuyin-learning-game-dictionary`
- Migration directory: `migrations/`
- Schema version: `DICTIONARY_SCHEMA_VERSION = 1`
- Static JSON files in `public/data/` remain seed and offline fallback data.

## Schema

Migration `migrations/0001_dictionary.sql` creates:

- `migration_versions`
- `categories`
- `characters`
- `words`
- `word_characters`
- `pronunciations`
- `import_sources`
- `import_jobs`
- `import_candidates`
- `change_logs`

The schema keeps stable IDs, zhuyin, per-word pronunciation context, category, difficulty, emoji/image metadata, enabled flags, source book/lesson metadata, created and updated timestamps, and change logs.

## Migration and seed

- `public/data/*.json` is the seed source and offline fallback.
- Migration version `1` must be recorded once in `migration_versions`.
- Seed import must use stable IDs and `INSERT OR IGNORE` or equivalent idempotent logic.
- Migration must not duplicate built-in 37 zhuyin, 300+ characters, or 200+ words.

## Backup and restore

- Export D1 before production schema changes.
- Restore only into the intended Cloudflare account and database.
- Keep parent-uploaded textbook files private; do not commit full textbook content or generated full text to Git.

## Data safety rules

- Do not directly delete production dictionary rows from the app.
- Prefer `enabled = 0` for disable operations.
- Record create, update, disable, import confirm, and import cancel actions in `change_logs`.
- D1 migration and dictionary changes must not clear Lisa, Jack, or Kyky localStorage learning records.
