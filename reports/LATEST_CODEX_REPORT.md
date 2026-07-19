# Codex Report — V1.3.1 注音動物園

- 日期：2026-07-19 19:37 Asia/Ho_Chi_Minh
- 分支：codex/v1.3.1-zhuyin-tone-and-zoo-theme-fixes
- 版本：V1.3.1
- Service Worker cache：`zhuyin-zoo-v1-3-1`

## 修改摘要

### 注音聲調

- 建立 `parseZhuyinSyllable()`，回傳 `symbols`、`tone`、`toneMark`。
- DOM 改為 `.zhuyin-group`、`.zhuyin-symbols`、`.zhuyin-tone`。
- CSS 獨立定位二聲、三聲、四聲與輕聲；一聲不顯示符號。

### 字詞與圖片

- 詞語資料補 `targetCharacter`、`targetIndex`、`speechText`、`image`、`emojiFallback`、`reviewed`、`validationStatus`、`enabled`。
- 出題池只使用審核與驗證通過資料。
- 明確禁止兒童題目即時 Google 搜圖、隨機外部圖片與不明授權 hotlink。

### 37 注音例字

- 37/37 筆補上 reviewed/status/imageDescription。
- ㄢ 最終資料：山｜ㄕㄢ｜⛰️｜一座山。
- ㄣ 最終資料：門｜ㄇㄣˊ｜🚪｜一扇門。

### 注音動物園 UI

- 正式品牌：「注音動物園」。
- Lisa、Jack、Kyky 共用 `storybook-zoo`。
- 功能配對：🐰 注音卡、🦉 認識注音、🐘 聽一聽、🦊 拼一拼、🐼 看圖認字、🦁 獎勵、🐻 家長。

## 資料檢查結果

| 項目 | 結果 |
|---|---:|
| 37 注音通過數量 | 37 |
| 圖片詞語一致數量 | 240 |
| 修正的錯配/污染數量 | 240 |
| 缺圖數量 | 0 |
| 未審核數量 | 0 |

## 測試

- 通過：`node --check public/src/app.js`
- 通過：`node --check public/service-worker.js`
- 通過：`node --check src/worker.js`
- 通過：`node tests/validate-app.js`
- 通過：`node tests/validate-zhuyin-tones.js`
- 通過：`node tests/validate-dictionary-media.js`

## 尚未完成

- 實體 iPhone／iPad Safari、Chrome、PWA 驗收未執行。
- 正式原創動物插圖尚未完成。
- 圖片授權來源補登尚未完成。
- 真人錄音、OCR、完整 D1 正式部署尚未完成。
