# 注音動物島 V2.1.0 3D 與私人同樂候選

2026-11-10，Windows 本機。基準 `ad2e057cf0ae18f0f19067517a25fd74057133e6`（PR #13 合併後）。資料相容性 V2.0.0，資產修訂 V2.1.0-3d.1。獨立分支 `codex/zhuyin-island-3d-six-rides-private-multiplayer-20261110`。

## 交付範圍

- 原創 WebGL2 島嶼與 3D 人偶、五位動物朋友、11 個可達入口、地圖、相機、畫質選項及 2D 備援。
- 六座設施在原有 IndexedDB 遊樂券帳本上預留、繪製確認、扣券與退款。家長可檢視交易並審核仍在預留中的未開始交易。
- 私人房間由家長共享通行憑證授權。伺服器採短期邀請、匿名席位、同源 WebSocket、限流及基本移動碰撞驗證。學習、帳本、裝扮仍各自儲存在裝置。
- 保留字庫、五種學習、三個本機角色與教材待來源狀態。部署設定仍沿用現行 Worker。隔離房間設定供開發及 staging 審核。

## 已驗證的 Windows 候選

提交 `5f041d4a54e1a4b9213b75418c7659d7684a78d1` 的 Windows 完整測試通過 48 項真實 IndexedDB、28 項本機 Durable Object（另強制重啟後回復）和 60 個瀏覽器情境。Chrome 與 Edge 在同一台 Windows 上透過本機網路端點，完成兩人共乘與第三人旁觀、三人逐座共乘、第四人拒絕、移動與揮手和各自獨立扣券。先前的連線中斷、碰碰車初始座標驗證及高負載逾時均留存；已修正的兩項問題和同版本成功結果分別記錄。隨後把設施與房間新增程式排版，語法樹一致。最終 PR／CI SHA 與 Drive 原檔核對在交付回執。

15 分鐘低畫質 Chrome headless 主島量測記錄 0 context loss、rAF 中位換算 59.88 FPS、p95 間隔換算 54.05 FPS，另有 1 筆未定位 URL 的 console 404。完整條件與 JS heap 數值在交付的效能報告。

[GitHub Draft PR #14](https://github.com/skybee99/zhuyin-learning-game/pull/14)

## 驗收分層

| MASTER | 目前可證明範圍 | 保留的驗收 |
| --- | --- | --- |
| A | **PASS** 原始碼 PRE 72 檔、Git blobs 與解壓回讀；原版本自動化基準 34 項帳本及 32 項瀏覽器通過 | 三台正式裝置資料原始備份 **NOT_RUN** |
| B | **PASS** WebGL2、深度緩衝、原創幾何、11 入口與障礙採樣的技術測試 | 視覺與實機表現另驗 |
| C | **PARTIAL** 瀏覽器地圖和控制有測試。相機避障及裝置手勢仍有限 | Windows 原生視窗與 iPad 操作分開驗收 |
| D | **PARTIAL** 六座皆有可玩 3D 場景。火車與摩天輪使用簡化景觀 | 完整主島軌道與全島眺望待驗，見設施矩陣 |
| E | **PASS** 既有帳本單人路徑及開始前回滾的隔離測試 | 已開始後的當機由家長核對帳本，無自動補券 |
| F | **PARTIAL** Windows Chrome／Edge 經本機真 WebSocket 兩人／三人互見，另驗三席、授權、超量拒絕和房間控制 | 兩／三實體裝置實際 Wi-Fi 與跨網路 **NOT_RUN** |
| G | **PARTIAL** 同機兩個瀏覽器安裝的三個隔離環境，已完成六座共乘及獨立券額 | 跨實體裝置及全部設施使用體驗 **NOT_RUN** |
| H | **PARTIAL** 存取、容量、速度、訊息與生命週期已有本機負向檢查 | 正式邊緣防護、安全審核、實際 Durable Object 休眠重啟 **NOT_RUN** |
| I | **PARTIAL** 核心 JSON 未更動，舊資料與 PWA 的模擬回歸另附測試日誌 | 真實裝置資料與教材來源仍待驗 |
| J | **PARTIAL** Windows 安裝版瀏覽器的自動化與裝置尺寸模擬 | Apple 真機、耗電與觸控操作 **NOT_RUN** |
| K | **PARTIAL** 本機隔離分支、備份、測試與雲端交付回執分開保存 | Cloudflare staging **BLOCKED**，Wrangler 4.159.0 本機未登入。正式部署 **NOT_RUN** |

資料、測試、PR、CI 與 Drive 驗收請搭配交付的版本化回執核對，該回執記錄實際 Git SHA、各測試結果及原檔校驗。此頁不把程式功能、瀏覽器自動化或本機 DO 代作正式設備驗收。

## 報告與回復

- 3D 世界、來源及畫質策略見 `reports/3D-ARCHITECTURE.md`。
- 六座設施、退款限制及個別遊玩見 `reports/RIDE-MATRIX.md`。
- 後端協定、威脅及計價見 `reports/MULTIPLAYER-ROOM.md`。
- 字庫、模型來源及 Three.js 授權見 `reports/ASSET-AND-DICTIONARY-INVENTORY.md`。
- 效能測法與量測界線見 `reports/PERFORMANCE-3D.md`。

回復候選應先在隔離 checkout 驗證基準 SHA。現行單人入口可切回 2D。若後續有發布，回復靜態資產／Worker 時保留現有瀏覽器 localStorage 與 IndexedDB，先留存設備最新匯出，再驗證 PWA 更新及本機學習紀錄。原有 PRE 與舊版報告維持獨立。

[MASTER 原始規格](https://drive.google.com/file/d/1AJdmEp8CYI1mQZ13jQ6TfRkMWPZvco6Z/view)
