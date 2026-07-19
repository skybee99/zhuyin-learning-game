# ARCHITECTURE

## Frontend

- `public/index.html` provides the PWA shell and panels.
- `public/src/app.js` contains vanilla JavaScript state, speech, quiz, spelling, parent settings, local dictionary management, and Service Worker update prompt logic.
- `public/src/styles.css` contains large touch-first iOS layouts, vertical zhuyin components, answer components, and child themes.
- `public/data/*.json` remains built-in seed/offline fallback data.

## PWA

- `public/service-worker.js` uses cache `zhuyin-bee-v1-3-0`.
- Static app shell excludes `/`, `./`, and navigation requests.
- Navigation strategy: Network First → `/offline.html` fallback; never `cache.put()` navigation responses.
- Static strategy: Cache First for same-origin, basic, ok, non-redirect, non-navigation responses.

## Dictionary and API

- Local parent dictionary additions are saved in `localStorage` for the current PWA UI.
- Permanent dictionary persistence is planned through Cloudflare D1 binding `DB` and Worker `src/worker.js`.
- D1 schema is in `migrations/0001_dictionary.sql`.
- API documentation is in `API.md`; database operations and safety rules are in `DATABASE.md`.

## Themes

- `body[data-child-theme]` changes only backgrounds, colors, cards, borders, light decorations, and answer feel.
- Themes do not change quiz data, zhuyin rendering semantics, scoring, speech, API, or D1 data.
