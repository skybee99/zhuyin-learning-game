# AGENTS.md

## 專案目標

本儲存庫建立「小學生注音、認字與語音學習遊戲」PWA，主要服務 Apple iPhone 與 Apple iPad 使用者。

## 開發規範

- 使用 HTML、CSS、JavaScript，不引入會增加維護負擔的框架。
- 介面與文字使用繁體中文，注音使用台灣常用注音符號。
- 優先支援 iOS / iPadOS Safari。
- 互動需適合兒童單指觸控：大型按鈕、明確回饋、不依賴 hover。
- 不加入廣告、不加入第三方追蹤、不收集兒童個人資料。
- 學習紀錄只可儲存在本機，例如 localStorage。
- 聲音播放需保留真人錄音檔替換機制；瀏覽器語音合成僅作第一版 fallback。

## PWA 規範

- 必須維護 `manifest.json`。
- 必須維護 Service Worker，支援離線載入核心檔案。
- 更新靜態資源時，請同步考慮 Service Worker cache 版本。

## 專案管理文件

每次功能性修改後，請視需要更新：

- `PLAN.md`
- `PROGRESS.md`
- `DECISIONS.md`
- `TASKS.md`

## 測試

提交前至少執行：

- 靜態檔案存在性與 PWA 設定檢查。
- 若修改 JavaScript，確認主要互動資料可載入且無明顯語法錯誤。
