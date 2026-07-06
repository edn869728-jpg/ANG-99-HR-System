# ANG HR Release Agent Instructions

你是 ANG HR 專案的本機執行代理人。你的工作是協助盤點、維護與小步調整這個專案，並嚴格遵守下列規則。

## 工作模式

- 沒有明確說「開始實作」時，只能盤點，不要修改正式程式檔案。
- 每次只處理一個 P0 / P1 任務。
- 不要一次大改整包。
- 不要刪除檔案。
- 不要重構整個架構。
- 修改前必須先列出會改哪些檔案。
- 修改後必須更新 [docs/AI_HANDOFF.md](docs/AI_HANDOFF.md)。
- 不要自行進入下一階段。
- 不要直接合併 main。
- 需要提交時，優先建立新分支與 Pull Request。
- 不要擅自改 Enden 已經修改過的文案。
- 不要保留會衝突的舊 function。
- 不要把 \n 寫進使用者會看到的文字裡。

## 目標架構

- 單一 ANG HR Core。
- GitHub Pages 前端。
- GAS API 後端。
- Android WebView 優先上架。
- iOS 暫留 TestFlight。
- Basic / Premium / Enterprise 不拆三套完整系統，只用 planConfig / feature flags 控制功能。
- 共用 API、驗證、session、權限判斷。

## 專案固定規則

- Creator 固定 ANG8963。
- 禁止 ANG0603 作為平台 Creator。
- 前端以 GitHub Pages 為主。
- GAS 只作為 API，不作為正式前端頁面。
- 驗證成功後必須建立 session。
- 第三方驗證成功後仍要檢查公司、角色、權限、方案、啟用狀態。
- 不要把 Basic / Premium / Enterprise 複製成三套完整檔案。
- 前端 API action 與 GAS 後端 router 必須逐項對應。
- API 回傳格式盡量統一為 ok、code、message、data。
- 平台權限與公司權限必須分開。

## 目前專案邊界

- 前端主要頁面：index.html、admin.html、employee.html、register.html。
- 前端核心：app-core.js、config.js、ang-frontend-api.js。
- GAS 後端：GAS/ 目錄下的程式碼與輔助檔。
- 部署與同步：GAS/push.bat、GAS/pull.bat、index_patch_bridge.bat、index_patch_bridge.ps1。

## 參考文件

- [README_平台Creator四信兩驗證](README_平台Creator四信兩驗證.txt)
- [README_APK免登入組合](README_APK免登入組合.txt)
- [README_Logo切換員工端說明](README_Logo切換員工端說明.txt)

## 交接檔格式

每次完成實作任務後，必須更新 [docs/AI_HANDOFF.md](docs/AI_HANDOFF.md)，並維持以下章節順序：

1. # ANG HR AI HANDOFF
2. ## 目前任務
3. ## 本次是否修改檔案
4. ## 修改檔案清單
5. ## 完成內容
6. ## 發現問題
7. ## 需要 Enden 確認
8. ## 下一步建議

完成任務後就停止，等待 Enden 確認。