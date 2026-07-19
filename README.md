# 注音小蜜蜂

小學生注音、認字與語音學習遊戲第一版。這是一個以 HTML、CSS、JavaScript 建立的靜態 PWA，主要支援 Apple iPhone 與 Apple iPad，可加入主畫面並離線使用。

## 第一版功能

- 首頁與大型觸控模式入口
- 完整 37 個台灣常用注音符號學習卡
- 每個注音都有例字與 emoji 暫代圖像資料
- 點擊播放聲音：真人錄音優先，缺檔時明確標示語音合成備援
- 聽聲音選注音
- 看圖認字
- 答對獲得星星
- 學習紀錄保存在本機 `localStorage`
- 家長模式入口、隱私說明與重置紀錄
- `manifest.json`、SVG icon 與 Service Worker 離線快取
- GitHub Actions 自動執行靜態與 JavaScript 檢查

## 使用方式

直接用靜態伺服器開啟專案根目錄，例如：

```bash
python3 -m http.server 4173
```

接著在瀏覽器開啟 `http://localhost:4173`。

## iPhone / iPad 使用建議

1. 使用 Safari 開啟網站。
2. 點選分享按鈕。
3. 選擇「加入主畫面」。
4. 從主畫面開啟「注音小蜜蜂」。

介面以 iPhone 直式單題畫面為主，iPad 直式與橫式會自動調整版面。

## 聲音與真人錄音替換機制

音訊資料統一記錄於 `assets/audio/audio-manifest.json`。只有當某個注音項目的 `status` 設為 `recorded` 時，App 才會播放對應真人錄音檔。若真人錄音不存在或尚未標示完成，App 會清楚顯示目前使用瀏覽器語音合成唸例字作為備援，且不宣稱為標準單一注音發音。

新增真人錄音時：

1. 將音檔放入 `assets/audio/`。
2. 更新 `assets/audio/audio-manifest.json` 中對應項目的 `file` 與 `status`。
3. 若音檔需要離線快取，更新 `service-worker.js` 的 `APP_SHELL` 與 `CACHE_VERSION`。
4. 執行測試命令。

## 測試

```bash
node tests/validate-app.js
node --check src/app.js
node --check service-worker.js
```

## 隱私

- 不放廣告。
- 不加入第三方追蹤。
- 不收集兒童個人資料。
- 星星、答題數與最後練習時間只儲存在使用者裝置本機。

## 已知限制

- 第一版尚未內建真人錄音檔。
- iOS / iPadOS Safari 通常需要使用者點擊後才允許播放聲音。
- emoji 尚非正式美術素材；PNG icon 改列下一階段待辦。
- 實體裝置上的加入主畫面與長時間離線體驗仍需進一步驗證。
