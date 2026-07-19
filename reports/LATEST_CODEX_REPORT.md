# LATEST CODEX REPORT — V1.3.2

## 修正檔案

- `public/src/app.js`：資料載入、已驗證題池、功能卡、家長備份中心、匯入摘要與版本資訊。
- `public/src/styles.css`：手機直式、功能卡、看圖認字卡片、注音與聲調尺寸。
- `public/data/characters.json`：人工審核核心國字資料。
- `public/data/words.json`：人工審核核心詞語資料。
- `public/data/media-map.json`：圖片/Emoji 與字詞關聯資料。
- `public/data/questions.json`：正式模式可用題庫題目。
- `public/service-worker.js`、`public/manifest.json`、`public/index.html`：V1.3.2 與離線資料快取。
- `tests/validate-app.js`：更新 V1.3.2 與新資料檔驗證。
- 專案管理文件：`PROGRESS.md`、`TASKS.md`、`DECISIONS.md`、`CHANGELOG.md`。

## 看圖認字資料一致性

- 一題對應一筆 `questions.json` 題目，題目以 `correctAnswerId` 反查 `words.json`。
- 詞語需通過 `validWordQuestion()`：approved/reviewed/verified、speechText 等於詞語、targetCharacter 對應 targetIndex、逐字注音存在，且有已驗證媒體或 Emoji。
- `media-map.json` 預留 source、license、author、verified 欄位；目前使用內建 Emoji，不抓隨機外部圖片。

## 注音與聲調顯示

- 持續使用自訂直排注音元件，聲調由 `.zhuyin-tone` 獨立定位。
- V1.3.2 加大 `.bopomofo-vertical` 與 `.zhuyin-tone`，避免聲調太小或貼近其他字。

## 手機版面

- 主容器縮至更適合直式閱讀的寬度。
- 首頁功能卡保持 2 欄、降低卡片高度與文字壓力。
- 看圖認字圖片、提示文字與答案區加大間距，手機保留清楚觸控區。

## 主題卡

- 功能卡只顯示：🐶 注音卡、🦉 認識注音、🐘 聽一聽、🦊 拼一拼、🐼 看圖認字、🐻 家長。
- 移除「兔子花園」「狐狸拼圖屋」「大象音樂池」等長副標題。
- Lisa、Jack、Kyky 維持相同 `storybook-zoo` 視覺風格。

## 字庫與備份

- 家長字庫管理保留查看搜尋、新增國字、新增詞語、文件匯入、資料檢查、清除 App 快取。
- 新增備份中心：匯出全部資料、字庫、圖片關聯、小孩成績、使用紀錄。
- JSON 匯入會顯示版本、備份日期與各類筆數，並先自動備份目前資料；合併/覆蓋寫入仍列為後續待辦。

## 測試結果

- `node --check public/src/app.js`：通過。
- `node --check public/service-worker.js`：通過。
- `node tests/validate-app.js`：通過。
- `node tests/validate-zhuyin-tones.js`：通過。
- `node tests/validate-dictionary-media.js`：通過。

## 已知限制

- 本環境無法執行實體 iPhone Safari、iPhone Chrome、Zalo WebView、iPad Safari 驗收。
- 匯入目前完成安全摘要與自動備份，尚未直接覆寫正式資料。
- 正式本地圖片與真人錄音仍待後續補檔。
