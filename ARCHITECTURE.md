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

- `body[data-child-theme="storybook-zoo"]` is shared by child-1, child-2, and child-3.
- Function animals: 🐰 注音卡、🦉 認識注音、🐘 聽一聽、🦊 拼一拼、🐼 看圖認字、🦁 獎勵、🐻 家長。
- Themes do not change quiz data, zhuyin rendering semantics, scoring, speech, API, D1 data, or localStorage learning records.

## V2.0.0 candidate architecture

`public/src/version.js` holds the candidate version. `storage.js` reads legacy slots without deleting or overwriting their original values, and writes anonymous profiles and local dictionary to a separate localStorage document. `ticket-ledger.js` uses IndexedDB transactions for quiz rounds, ticket balances, and rides. `curriculum.js` stores staged lesson records separately, with missing textbook sources marked WAITING_FOR_SOURCE; staged entries are not active questions.

Import is scoped to supported profile and local-dictionary data after preview, confirmed action, and a read-back PRE snapshot. Ledger and curriculum snapshots can be exported but are not restored by that import. Their completeness and actual browser persistence must be verified separately. The PWA cache name and static assets follow the current service worker; older cache details above describe the previous release.

## V2.0.0 自由探索架構

`island-world.js` 是純世界資料、障礙物、步進碰撞與 A*。`island-explore.js` 負責 CSS viewport、相機、SVG 分件、鍵盤與單指搖桿、點擊尋路、NPC 對話及生命週期。每個匿名角色持有獨立探索鍵。匯出包含位置與外觀。既有匯入仍限學習資料與字庫。原版地圖及直接捷徑可在探索外操作。

`island.js` 將地圖入口交給既有設施面板。唯一扣款來源仍為 `ticket-ledger.js`。新版預留需可見畫面確認才能正式開始，分頁中斷後在租期到期並再次讀取帳本時恢復未開始的預留。背景時停止音效及更新。起始畫面、學習資料模型和 PWA 保持 V2.0.0 相容，靜態資產依獨立 revision 進入離線清冊。
