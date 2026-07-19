# 注音小蜜蜂

小學生注音、認字與語音學習遊戲第一版。這是一個以 HTML、CSS、JavaScript 建立的靜態 PWA，主要支援 Apple iPhone 與 Apple iPad，可加入主畫面並離線使用。

## 第一版功能

- 首頁與大型觸控模式入口
- 注音符號學習卡
- 點擊播放注音聲音
- 聽聲音選注音
- 看圖認字
- 答對獲得星星
- 學習紀錄保存在本機 `localStorage`
- 家長模式入口、隱私說明與重置紀錄
- `manifest.json` 與 Service Worker 離線快取

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

第一版會先嘗試播放 `assets/audio/*.mp3` 真人錄音檔。如果檔案不存在或播放失敗，會改用瀏覽器 Web Speech API，以 `zh-TW` 語音合成朗讀。

未來要替換真人錄音時，可依 `src/app.js` 中每個注音資料的 `audio` 路徑加入對應檔案，例如：

- `assets/audio/bo.mp3`
- `assets/audio/po.mp3`
- `assets/audio/mo.mp3`

## 隱私

- 不放廣告。
- 不加入第三方追蹤。
- 不收集兒童個人資料。
- 星星、答題數與最後練習時間只儲存在使用者裝置本機。

## 已知限制

- 第一版尚未內建真人錄音檔，主要依賴瀏覽器語音合成。
- iOS / iPadOS Safari 通常需要使用者點擊後才允許播放聲音。
- PWA icon 目前使用 SVG；部分舊版 iOS 可能偏好 PNG icon。
- 實體裝置上的加入主畫面與長時間離線體驗仍需進一步驗證。

## 測試

```bash
node tests/validate-app.js
```
