# ANG HR AI HANDOFF

## 目前任務

P0-2｜建立前後端 API action 對照表｜依 PR review 修正 V28 router 判定

## 本次是否修改檔案

只新增 / 更新文件，不修改正式程式檔案。

## 修改檔案清單

- docs/AI_HANDOFF.md
- docs/API_ACTION_MATRIX.md

## 完成內容

- 依 Copilot review 重新檢查 GAS/程式碼.js 後段。
- 確認 GAS/程式碼.js 後段存在「ANG HR System｜V28 相容補強層」，且最後有效 handleApi_ 已支援多數 admin / employee action。
- 修正 docs/API_ACTION_MATRIX.md：不再把 getAdminBootstrapData、getManagerBootstrapData、getCreatorBootstrapData、adminSetReviewStatus、employeeBootstrap、employeeClock、employeeLeave、employeeClockFix、employeeUpload、angGetPermissionSnapshot 等誤列為未接 router。
- 將問題分類改為：已接 router 但需補正式資料寫入 / 權限檢查 / 真實資料來源，以及仍未接 router 的 action。
- 更新 google.script.run 轉 fetch 風險段落，只把真正未接 router 的方法列為未知 action 風險。
- 本次未修改 index.html、admin.html、employee.html、register.html、app-core.js、config.js、ang-frontend-api.js 或 GAS/ 內正式程式檔。

## 發現問題

- P0：angGetPermissionSnapshot 已接 router，但 apiPermissionSnapshotV30_ 仍需檢查 session gate、device gate、平台 Creator 與公司 Owner 分離、companies / plan / billing_status 回傳完整性。
- P0：employeeLeave、employeeClockFix、employeeUpload、employeeMessage、employeePreselect 已接 router，但目前疑似多為 generic ok，相容但尚未正式寫入請假、補打卡、上傳、留言、預選休資料。
- P0：getAdminBootstrapData、getManagerBootstrapData、getCreatorBootstrapData 已接 router，但目前多為最小空資料，需要補正式審核、發布、設定資料來源。
- P0：adminSetReviewStatus 已接 router，但目前疑似 generic ok，需要補真正審核狀態寫入。
- P0：register.html 使用 startFreeUseCompany / startFreeTrial，但最後有效 handleApi_ 尚未支援；正式註冊應統一到 registerCompany 或建立 alias。
- P0：activateEmployee 已存在，但目前沒有建立 session；驗證成功後必須建立 session。
- P1：saveClockLocationSettings、saveBrandSettings、savePreselectSettings、saveShiftTypes 被 admin.html 呼叫，但最後有效 handleApi_ 尚未支援。
- P1：Auth.js 的 requestEmailVerifyCode / confirmEmailVerifyCode / verifyAuthToken 與主 router 命名不一致。

## 需要 Enden 確認

- 是否確認 P0-3A 改為「強化 angGetPermissionSnapshot / apiPermissionSnapshotV30_」，不是新增 router case。
- 是否確認 employeeClock 作前端主名，後端保留 clockByButton / nfcClock 作相容入口。
- 是否確認 register.html 的 startFreeUseCompany / startFreeTrial 只作 alias，不新增第二套註冊流程。
- 是否要將 AGENTS.md 正式加入 repo，讓後續代理直接從 repo 讀規則。

## 下一步建議

P0-3A｜只強化 angGetPermissionSnapshot / apiPermissionSnapshotV30_ 的正式權限快照。

建議 P0-3A 影響檔案只列為：

- GAS/程式碼.js
- docs/AI_HANDOFF.md

P0-3A 不處理 employeeBootstrap、admin bootstrap、employeeLeave、employeeUpload、審核寫入或方案設定，避免一次大改。

完成後停止，等待 Enden 確認是否進 P0-3B。
