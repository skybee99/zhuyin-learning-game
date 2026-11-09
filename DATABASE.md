# DATABASE.md

## Cloudflare D1 binding

A Cloudflare D1 dictionary schema is planned; the checked-in Worker configuration has no DB binding, and this does not establish a provisioned or deployed database.

- Proposed Worker binding: `DB` (not configured in the checked-in Wrangler file)
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
- The current built-in files contain 37 zhuyin, 15 characters and 14 words; historical larger files are separately staged for review. Do not import or deduplicate them into an active database without review.

## Backup and restore

- Export D1 before production schema changes.
- Restore only into the intended Cloudflare account and database.
- Keep parent-uploaded textbook files private; do not commit full textbook content or generated full text to Git.

## Data safety rules

- Do not directly delete production dictionary rows from the app.
- Prefer `enabled = 0` for disable operations.
- Record create, update, disable, import confirm, and import cancel actions in `change_logs`.
- D1 migration and dictionary changes must not clear child-1, child-2, or child-3 localStorage learning records.

## V2.0.0 candidate local data

Anonymous profiles and local dictionary use a separate localStorage document while the legacy values are retained. Quiz and ride transactions use IndexedDB; staged curriculum uses another localStorage key. Exported ledger and curriculum snapshots are not restored by the scoped profile/dictionary importer. Actual persistence and backups require separate verification on each device.
