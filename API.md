# Cloudflare Worker API — V2.0.0 候選

App 使用 Cloudflare Workers Assets 提供 `public/`。前端學習、票券、教材待審和匯入還原都在本機，沒有把兒童資料送到 API。

- `GET /api/dictionary/{stats,characters,words}`：須另行配置並驗證 D1，未配置時回傳 503 `d1_binding_missing`。本分支沒有 D1 binding。
- 字庫寫入：沒有可使用的遠端寫入流程；有 D1 時仍回傳 501，直到獨立驗證真正的家長認證與權限。移除歷史固定標頭。
- `POST /api/import/document`：回傳 501 `document_import_not_implemented`，不會宣稱已建立或儲存候選項。教材頁的本機待審 JSON 與此 API 無關。
- 其他 `/api/*`：404；一般網站請求交由 `ASSETS`。
