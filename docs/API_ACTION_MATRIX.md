# ANG HR API ACTION MATRIX

## 任務

P0-2｜建立前後端 API action 對照表。

本文件只盤點，不修改正式程式檔案。調查目標是把前端呼叫、GAS router 已支援 action、缺口、命名不一致與 google.script.run 轉 fetch 風險列清楚，供下一步 P0-3A 人工確認後再修。

## 調查範圍

- 前端主要頁面：index.html、admin.html、employee.html、register.html
- 前端核心：app-core.js、config.js、ang-frontend-api.js
- GAS 後端：GAS/程式碼.js、GAS/Auth.js
- 特別注意：admin.html 內建 GitHub GAS bridge，當 GitHub Pages 沒有 google.script.run 時，會把 google.script.run.someMethod(...) 轉成 POST action=someMethod 到 GAS API。

## 重要發現摘要

1. GAS/程式碼.js 目前有兩段 handleApi_ 定義，後面 v25 整合層的 handleApi_ 會覆蓋前面版本。後續修 router 時必須改最後有效版本，不要只改前面舊版本。
2. 後端已支援公司註冊、Email/Google/LINE 驗證、session 建立、員工啟用、基本打卡、上傳授權、部分系統設定、資料保留與公司試算表路由。
3. 員工端核心 action 多數尚未在有效 handleApi_ 中出現，包含 employeeBootstrap、employeeClock、employeeLeave、employeeClockFix、employeeUpload、employeeMessage、employeePreselect。
4. 管理端因 GitHub GAS bridge 會把 google.script.run 轉成 API action，所以 admin.html 內所有 google.script.run 方法都必須在 handleApi_ 有對應。現在缺口包含 getAdminBootstrapData、getManagerBootstrapData、getCreatorBootstrapData、adminSetReviewStatus、getPeopleManagementData、saveEmployeeProfile 等。
5. 共用權限快照 angGetPermissionSnapshot 被 ang-frontend-api.js、employee.html、admin.html 使用，但有效 handleApi_ 未支援，是 P0。
6. register.html 另有 startFreeUseCompany / startFreeTrial 流程，但有效 handleApi_ 未支援；正式入口應統一到 registerCompany 或新增清楚 alias。
7. Auth.js 使用 requestEmailVerifyCode / confirmEmailVerifyCode / verifyAuthToken 等命名，與主 router 的 requestEmailCode / verifyEmailCode / verifyNativeGoogleIdToken 命名不一致，需先決定保留哪套命名。

## Action 對照表

| 編號 | action 名稱 | 前端呼叫位置 | 後端是否存在 | 後端位置 | 功能用途 | 影響角色 | 嚴重程度 | 建議處理方式 | 是否建議第一批修 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | ping | 診斷或手動測試 | 是 | GAS/程式碼.js handleApi_ | API 存活測試 | 全部 | P3 | 保留 | 否 |
| 2 | requestEmailCode | index/register 驗證流程可能使用 | 是 | GAS/程式碼.js handleApi_ | 寄 Email 驗證碼 | 企業主、管理員、員工 | P1 | 保留為主命名 | 是 |
| 3 | verifyEmailCode | index/register 驗證流程可能使用 | 是 | GAS/程式碼.js handleApi_ | 驗證 Email code 並產生 verify_token | 企業主、管理員、員工 | P1 | 保留為主命名 | 是 |
| 4 | verifyGoogleCredential | Web Google credential 流程 | 是 | GAS/程式碼.js handleApi_ | 驗證 Google Web credential | 企業主、管理員 | P2 | 確認是否仍使用，若不用標成 legacy | 否 |
| 5 | verifyNativeGoogleIdToken | native bridge / App OAuth 流程 | 是 | GAS/程式碼.js handleApi_ | 驗證 Android/iOS Google id_token | 企業主、管理員、員工 | P1 | 保留，但 native-google-bridge.js 必須先解 conflict | 是 |
| 6 | verifyNativeLineIdToken | native bridge / App OAuth 流程 | 是 | GAS/程式碼.js handleApi_ | 驗證 LINE id_token | 企業主、管理員、員工 | P1 | 保留，並統一 response 格式 | 是 |
| 7 | registerCompany | 正式公司註冊流程 | 是 | GAS/程式碼.js handleApi_ | 建立公司、Owner、方案與付款狀態 | 企業主、Owner | P0 | 保留為唯一正式註冊 action | 是 |
| 8 | startFreeUseCompany | register.html | 否 | 無 | 免費使用註冊舊流程 | 企業主 | P0 | 併回 registerCompany 或建立 alias 到 registerCompany | 是 |
| 9 | startFreeTrial | register.html fallback | 否 | 無 | 免費試用舊流程 | 企業主 | P0 | 不建議新增第二套，建議轉 alias | 是 |
| 10 | adminLogin | 後台帳密登入流程 | 是 | GAS/程式碼.js handleApi_ | 管理員帳密登入並建立 session | 管理員、Owner、Creator | P1 | 保留，但回傳需補 permissions/plan/billing 完整資料 | 是 |
| 11 | adminLoginByVerifiedAuth | 第三方驗證後後台登入 | 是 | GAS/程式碼.js handleApi_ | Email/Google/LINE 驗證後登入後台 | 管理員、Owner、Creator | P0 | 保留，並確保檢查公司/角色/權限/方案/啟用狀態 | 是 |
| 12 | activateEmployee | 員工一次性開通舊流程 | 是 | GAS/程式碼.js handleApi_ | 使用一次性開通碼啟用員工 | 員工 | P0 | 目前回傳未建立 session，需補或改導到 activateEmployeeByVerifiedAuth | 是 |
| 13 | activateEmployeeByVerifiedAuth | 員工第三方驗證開通 | 是 | GAS/程式碼.js handleApi_ | 驗證後綁定裝置並建立 session | 員工 | P0 | 保留為主流程 | 是 |
| 14 | employeeActivateByVerifiedAuth | alias | 是 | GAS/程式碼.js handleApi_ | activateEmployeeByVerifiedAuth alias | 員工 | P1 | 保留 alias，文件註明 | 是 |
| 15 | getEmployeeCompaniesByVerifiedAuth | 驗證後列出可登入公司 | 是 | GAS/程式碼.js handleApi_ | 同一身分查最多 3 間公司 | 員工、管理員 | P1 | 保留 | 是 |
| 16 | addEmployee / createEmployee / registerEmployee | 舊新增員工流程或測試 | 是 | GAS/程式碼.js handleApi_ | 新增員工與一次性 token | 管理員、Owner | P1 | 與 saveEmployeeProfile 決定主從，避免重複 | 是 |
| 17 | clockByButton | 可能由舊打卡/捷徑使用 | 是 | GAS/程式碼.js handleApi_ | 基本打卡 | 員工 | P1 | 可作 employeeClock 的內部實作或 alias | 是 |
| 18 | nfcClock | nfc_clock.html 或 NFC 流程 | 是 | GAS/程式碼.js handleApi_ | NFC 打卡 | 員工 | P1 | 保留，後續與 App 權限一起測 | 是 |
| 19 | employeeHeaderData | employee.html apiPost | 否 | 無 | 員工端 Header / Logo / 品牌資料 | 員工 | P1 | 補 action 或併入 employeeBootstrap | 是 |
| 20 | employeeBootstrap | employee.html apiPost | 否 | 無 | 員工端首頁、薪資、排班、留言、請假、上傳資料一次載入 | 員工 | P0 | 第一批補最小可用 response | 是 |
| 21 | getEmployeeBootstrapData | employee.html google.script.run | 否 | 無有效 handleApi_ 對應 | GAS HTML 版員工資料載入 | 員工 | P1 | 若正式前端只走 GitHub，可改為 employeeBootstrap alias | 是 |
| 22 | getPublishedScheduleForCalendar | employee.html apiPost / google.script.run | 否 | 無 | 載入已發布排班到日曆 | 員工 | P1 | 補 action 或併入 employeeBootstrap | 是 |
| 23 | employeePreselect | employee.html apiPost | 否 | 無 | 員工預選休日期 | 員工 | P1 | 補 action，需驗 session 與開放期限 | 是 |
| 24 | employeeClockFix | employee.html apiPost | 否 | 無 | 補打卡申請 | 員工 | P0 | 補 action，資料進待審核 | 是 |
| 25 | employeeUpload | employee.html apiPost | 否 | 無 | 員工端檔案/報銷/外勤回報 | 員工 | P0 | 補 action 或改用 uploadCompanyDataByToken 需釐清權限 | 是 |
| 26 | generateIosShortcutJson | employee.html apiPost | 否 | 無 | 產生 iOS 捷徑 JSON | 員工 | P2 | 非上架首要，可後補 | 否 |
| 27 | employeeClock | employee.html apiPost | 否 | 無 | Web/App/捷徑打卡 | 員工 | P0 | 建議做 alias 到 clockByButton，並補 company_id/session/device | 是 |
| 28 | employeeMessage | employee.html apiPost | 否 | 無 | 員工留言 | 員工 | P1 | 補 action，資料進 Message/Review 流程 | 是 |
| 29 | employeeLeave | employee.html apiPost | 否 | 無 | 員工請假申請 | 員工 | P0 | 補 action，資料進請假審核流程 | 是 |
| 30 | getTodayStatus | employee.html google.script.run only | 否 | 無 | 今日狀態提示 | 員工 | P2 | 若併入 employeeBootstrap 可不獨立補 | 否 |
| 31 | getRecentActivities | employee.html google.script.run only | 否 | 無 | 最近動態 | 員工 | P2 | 併入 employeeBootstrap 或暫不顯示 | 否 |
| 32 | getNoticesForEmployee | employee.html google.script.run only | 否 | 無 | 員工公告通知 | 員工 | P2 | 併入 employeeBootstrap 或獨立補 | 否 |
| 33 | isPreselectOpen | employee.html google.script.run only | 否 | 無 | 判斷預選休是否開放 | 員工 | P1 | 補到 employeeBootstrap 或 employeePreselect 前置檢查 | 是 |
| 34 | getSettingsHash | employee.html google.script.run only | 否 | 無 | 偵測設定變更自動刷新 | 員工 | P3 | 暫不列第一批 | 否 |
| 35 | downloadSalarySlip | employee.html google.script.run only | 否 | 無 | 員工查薪資單 | 員工 | P2 | 薪資上線前補 | 否 |
| 36 | angGetPermissionSnapshot | ang-frontend-api.js、employee.html、admin.html | 否 | 無 | 取得 role、permissions、company memberships | 全部 | P0 | 第一批最先補，回傳平台權限與公司權限分離 | 是 |
| 37 | getManagerBootstrapData | admin.html google.script.run，GitHub bridge 會轉 action | 否 | 無 | Manager 發布/審核資料載入 | Manager | P0 | 第一批補最小可用 bootstrap | 是 |
| 38 | getAdminBootstrapData | admin.html google.script.run，GitHub bridge 會轉 action | 否 | 無 | Admin 審核中心資料載入 | Admin、Owner | P0 | 第一批補最小可用 bootstrap | 是 |
| 39 | getCreatorBootstrapData | admin.html google.script.run，GitHub bridge 會轉 action | 否 | 無 | Creator/Owner 系統設定資料載入 | Creator、Owner | P0 | 第一批補最小可用 bootstrap | 是 |
| 40 | adminSetReviewStatus | admin.html google.script.run，GitHub bridge 會轉 action | 否 | 無 | 審核通過/退回 | Manager、Admin、Owner | P0 | 補 action，需檢查權限與審核流程 | 是 |
| 41 | generateSalaryDraft | admin.html google.script.run | 否 | 無 | 產生薪資草稿 | Admin、Owner | P1 | 可第二批，但若薪資頁要上線需補 | 否 |
| 42 | saveSalaryReview | admin.html google.script.run | 否 | 無 | 送出薪資審核/發布 | Admin、Owner | P1 | 薪資模組第一批後再補 | 否 |
| 43 | saveSystemSettings | admin.html google.script.run / handleApi_ | 是 | GAS/程式碼.js handleApi_ | 儲存寬限等系統設定 | Creator、Owner、Admin | P1 | 保留，但需補 session/permission gate | 是 |
| 44 | saveClockLocationSettings | admin.html google.script.run | 否 | 無 | 打卡定位/分店地點設定 | Creator、Owner | P1 | 補 action 或併入 saveSystemSettings | 是 |
| 45 | saveBrandSettings | admin.html google.script.run | 否 | 無 | 品牌 Logo / 公司標題 | Creator、Owner | P1 | 補 action 或併入 saveSystemSettings | 是 |
| 46 | archiveOldRecords | admin.html google.script.run | 否 | 無 | 歸檔舊資料 | Creator、Owner | P2 | 資料保留模組再處理 | 否 |
| 47 | exportArchivedToDrive | admin.html google.script.run | 否 | 無 | 匯出歸檔到 Drive | Creator、Owner | P2 | 資料保留模組再處理 | 否 |
| 48 | savePreselectSettings | admin.html google.script.run | 否 | 無 | 選休週/月規則設定 | Creator、Owner | P1 | 補 action，可併入 saveSystemSettings 但名稱需接 router | 是 |
| 49 | saveApproverSettings | admin.html google.script.run / handleApi_ | 是 | GAS/程式碼.js handleApi_ | 審核流程設定 | Creator、Owner | P1 | 保留，補權限驗證 | 是 |
| 50 | saveShiftTypes | admin.html google.script.run | 否 | 無 | 班別設定 | Creator、Owner | P1 | 補 action 或併入 saveSystemSettings | 是 |
| 51 | getPeopleManagementData | admin.html google.script.run | 否 | 無有效 handleApi_ 對應 | People 人員列表 | Admin、Owner | P1 | 補 action 或改前端用 addEmployee/createEmployee 主流程 | 是 |
| 52 | saveEmployeeProfile | admin.html google.script.run | 否 | 無 | 新增/編輯員工資料 | Admin、Owner | P1 | 與 addEmployee 整合，避免兩套員工新增 | 是 |
| 53 | generateEmployeeBindLink | admin.html google.script.run | 否 | 無 | 產生手機綁定連結 | Admin、Owner | P1 | 補 action，須產生一次性 token | 是 |
| 54 | resetEmployeeDeviceBinding | admin.html google.script.run | 否 | 無 | 重設員工裝置綁定 | Admin、Owner | P1 | 補 action，需 audit log | 是 |
| 55 | saveSalaryManagement | admin.html google.script.run | 否 | 無 | 薪資規則設定 | Admin、Owner | P1 | 薪資模組補齊時處理 | 否 |
| 56 | getCompanyUploadDriveSettings | 設定/診斷頁可能使用 | 是 | GAS/程式碼.js handleApi_ | 公司上傳 Drive 設定 | Creator、Owner | P2 | 保留 | 否 |
| 57 | saveCompanyUploadDriveSettings | 設定/診斷頁可能使用 | 是 | GAS/程式碼.js handleApi_ | 儲存公司上傳 Drive 設定 | Creator、Owner | P2 | 保留 | 否 |
| 58 | getCompanySpreadsheetInfo | 設定/診斷頁可能使用 | 是 | GAS/程式碼.js handleApi_ | 公司試算表路由資訊 | Creator、Owner | P2 | 保留 | 否 |
| 59 | getCompanyRetentionSettings / getCompanyRetentionSettingsV26 | 資料保留頁可能使用 | 是 | GAS/程式碼.js handleApi_ | 取得資料保留設定 | Creator、Owner | P2 | 保留 | 否 |
| 60 | saveCompanyRetentionSettings / saveCompanyRetentionSettingsV26 | 資料保留頁可能使用 | 是 | GAS/程式碼.js handleApi_ | 儲存資料保留設定 | Creator、Owner | P2 | 保留 | 否 |
| 61 | cleanupOldData / cleanupOldDataRetention / cleanupOldDataRetentionV26 | 資料保留工具 | 是 | GAS/程式碼.js handleApi_ | 清理舊資料 | Creator、Owner | P2 | 保留，但需要雙確認 UI | 否 |
| 62 | setupDataRetentionTrigger / deleteDataRetentionTrigger | 資料保留工具 | 是 | GAS/程式碼.js handleApi_ | 建立/刪除定時清理 trigger | Creator、Owner | P2 | 保留 | 否 |
| 63 | setupCompanySpreadsheetRouting / backfillCompanySpreadsheets | 手動工具/遷移 | 是 | GAS/程式碼.js handleApi_ | 一公司一表路由與補資料 | Creator | P2 | 僅工具頁可用，不給一般管理員 | 否 |
| 64 | issueFreePrivilegeCode | 平台 Creator 工具 | 是 | GAS/程式碼.js handleApi_ | ANG8963 發免付費特權 ID | Creator ANG8963 | P1 | 保留，嚴格限制 ANG8963 與 owner key | 是 |
| 65 | requestGoogleAuth | GAS/Auth.js | 未接主 handleApi_ | GAS/Auth.js handleAuthAction_ | Web Google OAuth 開始 | 企業主、管理員 | P2 | 若保留 Auth.js，主 doGet/doPost 需明確導到 handleAuthAction_ | 否 |
| 66 | requestLineAuth | GAS/Auth.js | 未接主 handleApi_ | GAS/Auth.js handleAuthAction_ | Web LINE OAuth 開始 | 企業主、管理員 | P2 | 同上 | 否 |
| 67 | requestEmailVerifyCode | GAS/Auth.js | 命名不一致 | GAS/Auth.js handleAuthAction_ | 寄 Email code | 企業主、管理員 | P1 | 改 alias 到 requestEmailCode 或淘汰 | 是 |
| 68 | confirmEmailVerifyCode | GAS/Auth.js | 命名不一致 | GAS/Auth.js handleAuthAction_ | 驗證 Email code | 企業主、管理員 | P1 | 改 alias 到 verifyEmailCode 或淘汰 | 是 |
| 69 | verifyAuthToken | GAS/Auth.js | 未接主 handleApi_ | GAS/Auth.js handleAuthAction_ | 驗證 verify_token | 全部 | P1 | 可併入 angGetPermissionSnapshot/session 驗證 | 是 |

## 命名相似但不一致

| 群組 | 前端/舊命名 | 後端/新命名 | 建議 |
|---|---|---|---|
| Email 寄碼 | requestEmailVerifyCode | requestEmailCode | 保留 requestEmailCode，建立短期 alias |
| Email 驗碼 | confirmEmailVerifyCode | verifyEmailCode | 保留 verifyEmailCode，建立短期 alias |
| 員工開通 | employeeActivateByVerifiedAuth | activateEmployeeByVerifiedAuth | 保留兩者 alias，文件標記主名 |
| 員工打卡 | employeeClock | clockByButton / nfcClock | 建議 employeeClock 作前端主名，內部導 clockByButton |
| 員工資料載入 | getEmployeeBootstrapData | employeeBootstrap | 建議 employeeBootstrap 作 GitHub Pages 主名 |
| 註冊免費試用 | startFreeUseCompany / startFreeTrial | registerCompany | 建議全部導向 registerCompany，不拆三套 |
| 人員新增 | addEmployee / createEmployee / registerEmployee | saveEmployeeProfile | 建議 saveEmployeeProfile 做編輯主名，addEmployee 只作新增 alias |

## google.script.run 轉 fetch 風險

admin.html 的 GitHub bridge 會在 GitHub Pages 環境下攔截 google.script.run.someMethod(...)，然後 POST 到 GAS，payload.action 會等於 someMethod。因此 admin.html 裡每個 google.script.run 方法都必須在有效 handleApi_ 內存在，否則 GitHub Pages 版後台會得到「未知 action」。

高風險方法：

- getManagerBootstrapData
- getAdminBootstrapData
- getCreatorBootstrapData
- adminSetReviewStatus
- generateSalaryDraft
- saveSalaryReview
- saveClockLocationSettings
- saveBrandSettings
- archiveOldRecords
- exportArchivedToDrive
- savePreselectSettings
- saveShiftTypes
- getPeopleManagementData
- saveEmployeeProfile
- generateEmployeeBindLink
- resetEmployeeDeviceBinding
- saveSalaryManagement

## P0 第一批建議修正清單

1. angGetPermissionSnapshot
2. employeeBootstrap
3. employeeClock alias 到 clockByButton，並補 session/company/device 驗證
4. employeeLeave
5. employeeClockFix
6. employeeUpload
7. getAdminBootstrapData
8. getManagerBootstrapData
9. getCreatorBootstrapData
10. adminSetReviewStatus
11. startFreeUseCompany / startFreeTrial alias 到 registerCompany 或移除 register.html 正式入口
12. activateEmployee 補 session 或改走 activateEmployeeByVerifiedAuth

## 下一步建議

P0-3A 只處理一件事：補 angGetPermissionSnapshot 的最小可用後端 action。

建議 P0-3A 範圍：

- 修改 GAS/程式碼.js 的最後有效 handleApi_。
- 新增 case 'angGetPermissionSnapshot'。
- 新增最小函式，驗證 company_id、id/employee_id、session_token/token、device_id。
- 回傳 role、permissions、company permissions、platform flag、companies、plan、billing_status。
- 不修改前端文案。
- 不處理 employeeBootstrap 或 admin bootstrap，避免一次大改。
