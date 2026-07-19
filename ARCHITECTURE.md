# ARCHITECTURE

## Frontend

- `public/index.html` provides the PWA shell and panels for 「注音動物園」.
- `public/src/app.js` contains vanilla JavaScript state, speech, quiz, spelling, parent settings, local dictionary management, zhuyin tone parsing, reviewed media filtering, and Service Worker update prompt logic.
- `public/src/styles.css` contains large touch-first iOS layouts, independent zhuyin tone positioning, answer components, and the shared `storybook-zoo` theme.
- `public/data/*.json` remains built-in seed/offline fallback data.

## PWA

- `public/service-worker.js` uses cache `zhuyin-zoo-v1-3-2`.
- Static app shell excludes `/`, `./`, and navigation requests.
- Navigation strategy: Network First → `/offline.html` fallback; never `cache.put()` navigation responses.
- Activate cleanup only removes this project caches with `zhuyin-bee-*` or `zhuyin-zoo-*` prefixes.

## Zhuyin rendering

- `parseZhuyinSyllable(value)` returns base `symbols`, numeric/light `tone`, and `toneMark`.
- `.zhuyin-symbols` renders base symbols vertically; `.zhuyin-tone` is absolutely positioned for tone 2/3/4/light.
- One-tone syllables render no visible tone mark.

## Dictionary and API

- Local parent dictionary additions are saved in `localStorage` for the current PWA UI.
- Child word questions must use a single reviewed object binding word, target character, speech text, image metadata, and emoji fallback.
- Runtime Google image search, random external images, unknown-license hotlinks, and unreviewed images are not allowed.
- Permanent dictionary persistence is planned through Cloudflare D1 binding `DB` and Worker `src/worker.js`.

## Theme

- `body[data-child-theme="storybook-zoo"]` is shared by Lisa, Jack, and Kyky.
- Function animals: 🐰 注音卡、🦉 認識注音、🐘 聽一聽、🦊 拼一拼、🐼 看圖認字、🦁 獎勵、🐻 家長。
- Themes do not change quiz data, zhuyin rendering semantics, scoring, speech, API, D1 data, or localStorage learning records.
