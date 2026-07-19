# API.md

V1.3.0 adds a Cloudflare Worker API plan and minimal server-side endpoints for dictionary persistence.

## Permission model

Until a full login system is added, write APIs require a parent session header:

```text
x-parent-session: local-parent-session-v1
```

This is a minimal server-side gate for the first D1 integration. It is not a replacement for a full authenticated parent account. Public child UI buttons are not treated as security.

## Endpoints

### GET /api/dictionary/stats

Returns dictionary counts.

Response:

```json
{
  "schemaVersion": 1,
  "zhuyin": 37,
  "characters": 0,
  "words": 0,
  "categories": 0,
  "pending": 0
}
```

### GET /api/dictionary/characters

Returns up to 200 characters ordered by latest update.

### POST /api/dictionary/characters

Creates a character. Requires parent session.

Required fields:

- `han`
- `primary_zhuyin`
- `difficulty`: `beginner` or `advanced`

Validation errors:

- `han_required`
- `primary_zhuyin_required`
- `difficulty_invalid`

### GET /api/dictionary/words

Returns up to 200 words ordered by latest update.

### POST /api/dictionary/words

Creates a word. Requires parent session.

Required fields:

- `word`
- `speech_text`
- `difficulty`: `beginner` or `advanced`

Validation errors:

- `word_required`
- `speech_text_required`
- `difficulty_invalid`

### POST /api/import/document

Accepts the document import flow entry point. V1.3.0 documents that imports must create pending candidates first.

Response status `202` indicates candidates are pending review. Scanned PDF/OCR is explicitly not completed in V1.3.0.

## Error codes

- `parent_session_required`: write request missing parent session.
- `d1_binding_missing`: Worker lacks `DB` binding.
- `not_found`: unsupported endpoint.
