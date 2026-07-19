## V1.2.0 目標

建立三位小孩獨立學習檔案、全面系統語音、認識注音、台灣課本式直排注音與更大的本機字庫，並修正 Safari Service Worker redirect 快取問題。

## 設計原則

- 使用 HTML、CSS、JavaScript，不加入框架。
- 兒童介面使用繁體中文、台灣常用注音、大按鈕與單指觸控。
- V1.2.0 正式語音固定 `AUDIO_MODE = system`，所有注音、國字、詞語、按鈕與提示走 `speakSystemText()`。
- 保留 `audio-manifest.json`、`audioKey` 與預定錄音路徑，但不嘗試載入不存在 MP3。
- localStorage 以三位小孩獨立 key 保存，V1.1.0 舊資料一次遷移到 Lisa。
- Service Worker 不預快取 `./`，導覽使用 Network First，不快取 redirect、opaque、跨來源或非成功回應。

## 後續版本方向

- 補齊真人錄音檔並切換 `recorded`／`auto` 模式。
- 製作正式圖片素材與 PNG PWA icons。
- 在實體 iPhone／iPad Safari 驗收直排注音、離線、加入主畫面與音訊。
- 補真人錄音逐字時間戳以支援精準同步。
