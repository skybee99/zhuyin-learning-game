# V2.1.0 3D 效能量測

`node scripts/measure-island-3d.cjs --seconds=900 --output=絕對路徑.json` 使用全新的 Chrome 自動化環境與 Windows loopback 靜態伺服器，量測固定頁面時間。輸出包括裝置與瀏覽器版本、畫面比例、requestAnimationFrame 間隔與 FPS 換算、WebGL2 context 事件、CDP JS heap、DOM 節點和錯誤。請把正式輸出放在驗收資料夾，避免把測試機資料寫入 Git。

rAF 衡量瀏覽器回呼間隔，搭配 draw 次數與 context 狀態才有可解釋範圍。使用 SwiftShader 的 Windows headless 結果與 Apple 實體 GPU、Safari 前景渲染、鎖定後喚醒或多人連線長時間運行分開報告。

測試數值與狀態以交付的獨立 JSON 和最新驗收報告為準。
