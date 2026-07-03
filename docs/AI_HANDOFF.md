# ANG HR AI HANDOFF

## 目前任務

P0-2｜建立前後端 API action 對照表

## 本次是否修改檔案

只新增 / 更新文件，不修改正式程式檔案。

## 修改檔案清單

- docs/AI_HANDOFF.md
- docs/API_ACTION_MATRIX.md

## 完成內容

- 建立 docs/API_ACTION_MATRIX.md。
- 盤點前端主要頁面與核心檔案中可能呼叫 GAS API 的 action。
- 對照 GAS/程式碼.js 最後有效 handleApi_ 已支援 action。
- 標出前端有呼叫但有效 handleApi_ 尚未支援的 action。
- 標出後端存在但前端主流程未明確使用的 action。
- 標出 action 命名相似但不一致的項目。
- 標出 admin.html 的 google.script.run 轉 fetch bridge 風險。
- 本次未修改 index.html、admin.html、employee.html、register.html、app-core.js、config.js、ang-frontend-api.js 或 GAS/ 內正式程式檔。

## 發現問題

- P0：angGetPermissionSnapshot 被前端共用 API、employee.html、admin.html 使用，但有效 handleApi_ 尚未支援。
- P0：employeeBootstrap、employeeClock、employeeLeave、employeeClockFix、employeeUpload 是員工端核心流程，但有效 handleApi_ 尚未支援。
- P0：admin.html 在 GitHub Pages 環境會把 google.script.run 方法轉成 API action；getAdminBootstrapData、getManagerBootstrapData、getCreatorBootstrapData、adminSetReviewStatus 等目前有效 handleApi_ 尚未支援。
- P0：register.html 使用 startFreeUseCompany / startFreeTrial，但有效 handleApi_ 尚未支援；正式註冊應統一到 registerCompany 或建立 alias。
- P0：activateEmployee 已存在，但目前沒有建立 session；驗證成功後必須建立 session。
- P1：GAS/程式碼.js 有兩段 handleApi_，後面 v25 整合層會覆蓋前面版本，後續修 router 必須改最後有效版本。
- P1：Auth.js 的 requestEmailVerifyCode / confirmEmailVerifyCode / verifyAuthToken 與主 router 命名不一致。
- P1：People、班別、品牌、定位、選休、薪資管理等 admin action 多數尚未在有效 handleApi_ 中接上。
- P2：資料保留、公司試算表路由與 Drive 設定後端已有 action，但前端主流程使用狀態需另查。

## 需要 Enden 確認

- 是否確認 P0-3A 只處理 angGetPermissionSnapshot，不同時補 employeeBootstrap 或 admin bootstrap。
- 是否確認 employeeClock 作前端主名，後端先 alias 到 clockByButton。
- 是否確認 register.html 的 startFreeUseCompany / startFreeTrial 只作 alias，不再新增第二套註冊流程。
- 是否要將 AGENTS.md 正式加入 repo，讓後續代理直接從 repo 讀規則。

## 下一步建議

P0-3A｜只補 angGetPermissionSnapshot 的最小可用後端 action，不修改前端文案，不處理其他 action。

建議 P0-3A 影響檔案只列為：

- GAS/程式碼.js
- docs/AI_HANDOFF.md

完成後停止，等待 Enden 確認是否進 P0-3B。
