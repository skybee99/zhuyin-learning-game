# 私人房間服務協定與威脅範圍

狀態：開發候選；本機 Wrangler 測試通過，Cloudflare staging **BLOCKED**（本輪未登入可用帳號），正式服務 **NOT_RUN**。此文件為 2026-11-10 檢核，計價與限制可能變動。

## 設定及授權

正式 `wrangler.jsonc` 保持原樣；`wrangler.room-test.jsonc` 僅用於本機隔離測試，包含 `ROOMS`、`ROOM_LIMITS` SQLite Durable Object bindings 與 migrations。無 binding、無 `ROOM_PARENT_KEY` 或金鑰少於 16 字元時，房間 API 回傳 503，單人功能不依賴多人服務。Staging 必須經帳戶與環境確認後，以平台 secret 機制設定隨機高熵 `ROOM_PARENT_KEY`；不得把正式值寫進 repo、網址、報告或本機持久化。僅靠現有兒童防誤觸入口不構成家長身分驗證。

每次建立與加入需要傳入家長鑰匙；它代表持有伺服器設定的共享能力，而非個別身分認證。持鑰者與受邀者都可能轉交秘密，無法提供身分保證、不可否認性或防止已授權者濫用。建議正式啟用前進一步完成安全檢視、金鑰輪替、端點速率／費用防護及家長認證。Origin 必須完全等於請求來源；非 loopback 必須 HTTPS。只允許既定資料欄位與動作，禁止自由文字、媒體、兒童名稱、教材或票券資料。HTTP 回應 `Cache-Control: no-store, private`；憑證保留於瀏覽器記憶體，不能放 URL 或 console。

## HTTP 與房間生命週期

- `POST /api/rooms/create`：JSON `{parentKey}`，成功傳回 `{roomId,inviteToken,sessionId,sessionToken,role,expiresAt,inviteExpiresAt}`；`roomId` 為公開路由用隨機 ID，invite 與 session token 為獨立高熵 bearer secrets。
- `POST /api/rooms/join`：`{parentKey,roomId,inviteToken}`，成功傳回自己的 `{roomId,sessionId,sessionToken,role,expiresAt}`。每房最多三席，第四席 409；鎖房、不正確或過期邀請一律拒絕。
- `POST /api/rooms/status`、`POST /api/rooms/leave`：`{roomId,sessionId,sessionToken}`，使用該席 bearer 授權；房主離開會關閉房間。
- 房間最長 1 小時，邀請最長 15 分鐘；連線中斷座位保留約 60 秒供相同憑證重新連線。惡意猜碼與路由入口由短期 keyed digest 的每來源速率限制器控制，房間最多 8 個含未認證 socket，每個未認證 socket 最多 5 秒。限流是基礎保護，不能替代正式環境邊緣 DDoS／WAF 與帳單限制。
- HTTP body 最多 2048 bytes；錯誤含 400 invalid body、401 unauthorized、403 origin／room unavailable、409 full、429 rate limited、503 rooms unavailable。除模擬 fixture 外，不得紀錄或列出任何秘密。

## WebSocket

同源 `/api/rooms/<roomId>/connect`；`roomId` 是路由識別，不是 token。第一個文字 frame 必須為 `{type:'auth',sessionId,sessionToken}`，否則關閉。`welcome` 包含 `selfId`、`role` 和 `serverTime`；`snapshot`／`welcome` 含 `players`、`locked`、`ride`。每個 player 只包含隨機 `sessionId`、位置 x/z、direction、action、預設限定外觀與 connected；顯示標籤由客戶端使用匿名代號產生。

單席同時只保留一條工作連線：新連線取代舊連線，伺服器持久化連線代次並拒絕舊代次後續訊息。4000 表示關閉／離開、4001 被新連線取代、4003 認證／訊息失敗、4004 被踢除、4008 速率限制；網路異常須區別並在寬限內可重連。`{type:'leave'}`、房主 `{type:'lock',locked}`、`{type:'kick',targetId}`、`{type:'close'}` 為受權限控制的操作。

`move` 為有限範圍數值、允許的四方向及 `idle/walk/wave/joy`；每 socket 最多每秒 15 個移動訊息，全部訊息每秒 30 個；採伺服器時間及有上限的速度額度，使用與 3D 客戶端共同的純世界幾何檢查終點與路徑。`plaza` 是有 5 秒冷卻的顯式中央廣場重置，不是任意座標傳送。外觀僅髮型、四種指定顏色和配件預設值。攻擊者仍可修改自己的客戶端；坐標驗證只保護房間可用性，並非反作弊或身分系統。

已認證玩家可傳送 `{type:'gesture',action:'wave'|'joy'}`，不帶座標或其他身分欄位；服務端立即廣播包含手勢的既有 snapshot，持續約 1.5 秒，期間後續 idle／walk 位置更新不會抹去手勢；到期由 alarm 清除並廣播目前移動狀態。手勢訊息仍受每秒總訊息限制，且有 500 毫秒冷卻；非法動作或額外欄位遭拒絕。舊版 `move` 夾帶 wave／joy 仍相容，手勢同樣到期。實際播放與跨裝置視覺效果仍需客戶端及實機驗證。

## 同乘與本機帳本

房主 `ride_offer` 包含六種白名單 ride；snapshot 的 `ride` 含 `rideId`、類型、hostId、30 秒 deadline、participants 的 sessionId／ready、status 與開始時間。每人自己選擇並在自己裝置預留帳本操作後才送 `ride_ready`；房主 `ride_start` 要求至少兩名目前在線的參與者均 ready，服務端廣播 `ride_started` 與未來約 1 秒開始時間。房主可在開始前 `ride_cancel`；等待時成員離線／踢除或超時亦會廣播 `ride_cancelled`，各客戶端必須自行取消未啟動的本機預留。服務端不接收或證明玩家券數、預留及扣款成功，因此不承諾跨裝置原子交易或防竄改資產；提交時間、中斷及實際畫面確認的殘餘窗口需另列驗收。

每位參與者結束／跳過送 `ride_done`；無法開始或主動中止可送 `ride_abort`，服務端以 `done` 和 `aborted` 區別狀態，不推斷本機票券收付。等待中房主 abort 會取消提議，客人 abort 會退出提議；開始後全部參與者進入終態才廣播 `ride_ended`，未完成則在啟動後約 45 秒清除。小火車第一次 `ride_done` 可附 `exitId` 為 `plaza/village/garden`，只允許已參與者及固定安全座標；重放不能再傳送。碰碰車僅有效參與者可送有限範圍、限速的 `bumper_move`，服務端廣播 `bumper_state`；每次依房間席次重新初始化三車位置，不含任何帳本資料。

## 檢查與限制

- **PASS（本機、合成資料，限當次程式）**：`node tests/test-multiplayer-runner.cjs` 使用獨立臨時目錄、Wrangler 4.159.0、SQLite DO 與真實 loopback WebSocket。最近執行 30 項檢查，包含三席／第四席、Origin、家長鑰匙、邀請、巨型 HTTP、錯誤／假冒 frame、動作與外觀、手勢傳送與逾時、重連、限流、共乘、碰碰車、火車出口、取消、踢人與房主結束；另外測試同一 SQLite 目錄下強制停止本機 Worker 行程、重新啟動後幽靈座位清除及兩席重連。一次先前環境啟動逾時記錄保留，後續重試通過。這是受測程式當下的結果，後續修改需重新執行。
- **NOT_RUN：** Cloudflare staging／正式帳號操作、跨實體裝置與跨網路房間、Apple 真機、Cloudflare 生產 WAF、正式金鑰輪替，以及 Cloudflare 真實環境額度／成本。
- **NOT_RUN：** 真正 DO eviction 後既有 socket 存活的測試。本機 `wrangler dev` 雖提供 hibernation handler，但官方文件指出本機 DO 不會自然 eviction；需 Cloudflare Vitest 的 `evictDurableObject()` 或經授權 staging 驗證。參考 [Cloudflare WebSocket hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) 與 [eviction testing](https://developers.cloudflare.com/durable-objects/examples/testing-with-durable-objects/)。
- 多個 SQLite 寫入失敗、quota 耗盡、惡意分散來源流量及完整網路封包遺失的韌性尚未證明；不可將本機測試視為安全審計或真機驗收。

## Cloudflare 額度與成本（2026-11-10 官方文件）

[Durable Objects 定價](https://developers.cloudflare.com/durable-objects/platform/pricing/) 表示 SQLite DO 可用於 Workers Free 與 Paid；Free 每日包含 100,000 DO requests、13,000 GB-s、500 萬 rows read、100,000 rows written，儲存總額度 5 GB。WebSocket 收到的訊息與 alarm 算 DO requests；`get`／`put`／`delete` 和 `setAlarm` 會涉及 SQLite 計費。Free 超過任一每日額度時，相應操作會失敗；每日 UTC 00:00 重設。Paid 官方表列每月含 100 萬 DO requests，之後每百萬 US$0.15；SQLite 每月含 5,000 萬 rows written，之後每百萬 US$1；另計其他資源及 Workers 方案費，確切費率以帳戶及官方頁面為準。[Workers 價格](https://developers.cloudflare.com/workers/platform/pricing/) 另列其服務額度與費率。

純量級示例：3 人若各持續每秒傳 10 次位置、持續 30 分鐘，僅位置訊息約 **54,000 次 DO requests**；本實作每筆有效位置也會持久化房間狀態。再加連線、驗證、alarms、讀寫及其他功能，一天兩次半小時可能超過免費 DO request／寫入額度。這不是實測用量或免費保證；須在受控 staging 計量 CPU、rows 與日流量，減頻、批次或調整持久化策略後再評估付費。避免把臨時房間付費資源直接啟用到正式站。
