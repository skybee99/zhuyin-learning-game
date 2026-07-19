## V1.3.1 目標

修正 V1.3.0 使用後發現的注音聲調排版、字詞圖片錯配、文字污染與兒童主題不一致問題，並將品牌統一為「注音動物園」。

## Phase 狀態

- Phase 1 注音聲調：完成 `parseZhuyinSyllable()`，聲調與注音本體分離，CSS 獨立定位二聲、三聲、四聲與輕聲。
- Phase 2 字詞圖片：完成詞語題庫審核欄位、同筆資料綁定圖片/Emoji、targetCharacter、targetIndex 與 speechText 檢查。
- Phase 3 37 注音：完成 37 筆例字審核欄位；ㄢ 改「山」⛰️，ㄣ 改「門」🚪。
- Phase 4 UI 品牌：完成「注音動物園」品牌、童話動物園共用主題與功能動物配對。
- Phase 5 PWA：完成 V1.3.1 manifest 與 Service Worker cache `zhuyin-zoo-v1-3-1`。

## 後續版本方向

- 使用實體 iPhone／iPad Safari 與加入主畫面 PWA 驗收聲調位置。
- 製作正式原創動物插圖、本地授權圖片與真人錄音。
- 補完整 D1 正式部署、OCR 與圖片授權後台流程。
