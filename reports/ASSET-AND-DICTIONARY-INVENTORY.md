# V2.1.0 資產與字庫清冊

字庫基準為 main `ad2e057cf0ae18f0f19067517a25fd74057133e6`。本輪不更新學習內容，原有 `public/data/` 保留。靜態檢查讀到 37 個注音符號、15 筆國字、14 筆詞語、14 筆既有看圖題及 17 種分類。歷史 360／240 待審資料仍按原流程隔離。南一《國語首冊》《國語 1 上》《國語 3 上》均為 WAITING_FOR_SOURCE，正式內頁、課次與生字表待授權來源。

| 資產 | 原始檔 | 來源與授權處理 |
| --- | --- | --- |
| 島嶼地形、樹、橋、學習建物、噴水池、鐘塔、設施入口 | `public/src/island-3d.js`、`island-world-3d.js` | 本輪以程式生成原創低多邊形幾何與材質 |
| 角色髮型、服色、配件、動物 NPC | `public/src/island-3d.js` | 本輪原創幾何與物件動畫 |
| 六座設施、列車導覽、小卡與貼紙 | `public/src/island-rides-3d.js` | 本輪程式生成幾何、Web Audio 音效與 UI，語音沿用裝置朗讀 |
| WebGL2 引擎 | `public/src/three.vendor.js` | Three.js 0.187.0，MIT，保留原始 `public/assets/THREE-LICENSE.txt`；由固定版 esbuild 生成 |
| 舊字庫媒體及 2D 圖示 | `public/assets/` 既有檔案與字庫媒體清冊 | 本輪沿用，新增模型沒有取用參考網站內容 |

[專案 MASTER 原檔](https://drive.google.com/file/d/1AJdmEp8CYI1mQZ13jQ6TfRkMWPZvco6Z/view)
