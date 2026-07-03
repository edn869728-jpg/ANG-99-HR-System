# ANG HR API ACTION MATRIX

## 任務

P0-2｜建立前後端 API action 對照表。

本文件只盤點，不修改正式程式檔案。調查目標是把前端呼叫、GAS router 已支援 action、缺口、命名不一致與 google.script.run 轉 fetch 風險列清楚，供下一步 P0-3A 人工確認後再修。

## 調查範圍

- 前端主要頁面：index.html、admin.html、employee.html、register.html
- 前端核心：app-core.js、config.js、ang-frontend-api.js
- GAS 後端：GAS/程式碼.js、GAS/Auth.js
- 特別注意：admin.html 內建 GitHub GAS bridge，當 GitHub Pages 沒有 google.script.run 時，會把 google.script.run.someMethod(...) 轉成 POST action=someMethod 到 GAS API。

## 修正說明

本文件已依 PR review 重新校正：GAS/程式碼.js 後段存在「ANG HR System｜V28 相容補強層」，並重新定義最後有效的 handleApi_。因此本表以最後有效 handleApi_ 為準，不以前段 v25 router 為準。

## 重要發現摘要

1. GAS/程式碼.js 不只 v25 router；後段還有 v28 相容補強層，最後有效 handleApi_ 已支援多數 admin / employee action。
2. getManagerBootstrapData、getAdminBootstrapData、getCreatorBootstrapData、adminSetReviewStatus、generateSalaryDraft、saveSalaryReview、archiveOldRecords、exportArchivedToDrive 等 action 已接 router，不應再列為「未知 action」風險。
3. angGetPermissionSnapshot 已接到 apiPermissionSnapshotV30_，但仍應檢查 session gate、平台權限與公司權限分離、companies / plan / billing_status 回傳是否符合正式上架需求。
4. employeeBootstrap、employeeClock、employeeLeave、employeeClockFix、employeeUpload、employeeMessage、employeePreselect 已接 router；其中 employeeClock 目前會寫入 ClockRecords，但 leave / clockfix / upload / message / preselect 目前多為 generic ok 相容回應，需要補正式資料寫入與審核流程。
5. admin bootstrap 與 review action 已接 router；但 bootstrap 多為最小空資料，adminSetReviewStatus 目前是 generic ok，需要補實際審核資料讀寫。
6. 仍未接主 router 的明確缺口包含 register.html 的 startFreeUseCompany / startFreeTrial、Auth.js 命名的 requestEmailVerifyCode / confirmEmailVerifyCode / verifyAuthToken，以及 admin.html 的 saveClockLocationSettings / saveBrandSettings / savePreselectSettings / saveShiftTypes。
7. activateEmployee 已接 router，但未建立 session；驗證成功後必須建立 session，建議導向 activateEmployeeByVerifiedAuth 或補 session 建立。

## Action 對照表

| 編號 | action 名稱 | 前端呼叫位置 | 後端是否存在 | 後端位置 | 功能用途 | 影響角色 | 嚴重程度 | 建議處理方式 | 是否建議第一批修 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | ping | 診斷或手動測試 | 是 | V28 handleApi_ | API 存活測試 | 全部 | P3 | 保留 | 否 |
| 2 | getPlans | 方案入口 / 註冊流程 | 是 | V28 handleApi_ | 取得方案清單 | 企業主 | P1 | 後續改接 planConfig / feature flags | 是 |
| 3 | requestEmailCode | index/register 驗證流程 | 是 | V28 handleApi_ | 寄 Email 驗證碼 | 企業主、管理員、員工 | P1 | 保留為主命名 | 是 |
| 4 | requestCompanySignupEmailVerification | index 新註冊流程可能使用 | 是 | V28 handleApi_ → apiRequestCompanySignupEmailVerificationV28_ | 公司註冊 Email 寄碼 | 企業主 | P1 | 保留 alias，但文件化 | 是 |
| 5 | requestAdminLoginEmailVerification | admin 登入 Email 流程可能使用 | 是 | V28 handleApi_ → apiRequestAdminLoginEmailVerificationV28_ | 管理員登入 Email 寄碼 | 管理員 | P1 | 保留 alias，但文件化 | 是 |
| 6 | verifyEmailCode | index/register 驗證流程 | 是 | V28 handleApi_ | 驗證 Email code 並產生 verify_token | 企業主、管理員、員工 | P1 | 保留為主命名 | 是 |
| 7 | verifyAdminEmailCodeAndLogin | admin 登入 Email 流程可能使用 | 是 | V28 handleApi_ → apiVerifyAdminEmailCodeAndLoginV28_ | Email 驗證後登入後台 | 管理員 | P0 | 檢查是否建立正式 session；避免只把 verify_token 當 session | 是 |
| 8 | verifyGoogleCredential | Web Google credential 流程 | 是 | V28 handleApi_ | 驗證 Google Web credential | 企業主、管理員 | P2 | 確認是否仍使用，若不用標成 legacy | 否 |
| 9 | verifyNativeGoogleIdToken | native bridge / App OAuth 流程 | 是 | V28 handleApi_ | 驗證 Android/iOS Google id_token | 企業主、管理員、員工 | P1 | 保留，但 native-google-bridge.js 必須先解 conflict | 是 |
| 10 | verifyNativeLineIdToken | native bridge / App OAuth 流程 | 是 | V28 handleApi_ | 驗證 LINE id_token | 企業主、管理員、員工 | P1 | 保留，並統一 response 格式 | 是 |
| 11 | registerCompany | 正式公司註冊流程 | 是 | V28 handleApi_ | 建立公司、Owner、方案與付款狀態 | 企業主、Owner | P0 | 保留為唯一正式註冊 action | 是 |
| 12 | startFreeUseCompany | register.html | 否 | 無 | 免費使用註冊舊流程 | 企業主 | P0 | 併回 registerCompany 或建立 alias 到 registerCompany | 是 |
| 13 | startFreeTrial | register.html fallback | 否 | 無 | 免費試用舊流程 | 企業主 | P0 | 不建議新增第二套，建議轉 alias | 是 |
| 14 | adminLogin | 後台帳密登入流程 | 是 | V28 handleApi_ | 管理員帳密登入並建立 session | 管理員、Owner、Creator | P1 | 保留，確認 permissions / plan / billing 是否完整 | 是 |
| 15 | adminLoginByVerifiedAuth | 第三方驗證後後台登入 | 是 | V28 handleApi_ → apiAdminLoginByVerifiedAuthV28_ | Email/Google/LINE 驗證後登入後台 | 管理員、Owner、Creator | P0 | 需確認第三方驗證成功後仍檢查公司、角色、權限、方案、啟用狀態 | 是 |
| 16 | activateEmployee | 員工一次性開通舊流程 | 是 | V28 handleApi_ | 使用一次性開通碼啟用員工 | 員工 | P0 | 目前未建立 session，需補或改走 activateEmployeeByVerifiedAuth | 是 |
| 17 | activateEmployeeByVerifiedAuth | 員工第三方驗證開通 | 是 | V28 handleApi_ | 驗證後綁定裝置並建立 session | 員工 | P0 | 保留為主流程 | 是 |
| 18 | employeeActivateByVerifiedAuth | alias | 是 | V28 handleApi_ | activateEmployeeByVerifiedAuth alias | 員工 | P1 | 保留 alias，文件註明主名 | 是 |
| 19 | verifyEmployeeSession | 前端 session 驗證 | 是 | V28 handleApi_ / V30 override | 驗證 session、device、role、companies | 員工、管理員 | P0 | 檢查 session gate 不可放寬 | 是 |
| 20 | angGetPermissionSnapshot | ang-frontend-api.js、employee.html、admin.html | 是 | V28 handleApi_ → apiPermissionSnapshotV30_ | 取得 role、permissions、company memberships | 全部 | P0 | 已接 router；下一步應強化權限與回傳資料，不是補 case | 是 |
| 21 | employeeQuickLoginByCompanyCode | App / 多公司 quick login | 是 | V28 handleApi_ | 公司代碼快速登入 | 員工 | P1 | 保留，需測多公司切換 | 是 |
| 22 | getEmployeeCompanyMemberships / getEmployeeCompanies | 公司切換 / 多公司 | 是 | V28 handleApi_ | 取得員工可登入公司 | 員工、管理員 | P1 | 保留 | 是 |
| 23 | getEmployeeCompaniesByVerifiedAuth | 驗證後列出可登入公司 | 未見於 V28 最後 router | 早期 router 曾有 | 同一身分查最多 3 間公司 | 員工、管理員 | P1 | 建議補 alias 到 getEmployeeCompanyMemberships 或確認前端是否仍呼叫 | 是 |
| 24 | addEmployee / createEmployee / registerEmployee | 舊新增員工流程或測試 | 是 | V28 handleApi_ | 新增員工與一次性 token | 管理員、Owner | P1 | 與 saveEmployeeProfile 決定主從，避免重複 | 是 |
| 25 | saveEmployeeProfile | admin.html People | 是 | V28 handleApi_ → apiSaveEmployeeProfileV28_ | 新增/編輯員工資料 | Admin、Owner | P1 | 已接 router；需補權限測試與欄位完整性 | 是 |
| 26 | getPeopleManagementData | admin.html People | 是 | V28 handleApi_ → apiGetPeopleManagementDataV28_ / V31 override | People 人員列表 | Admin、Owner | P1 | 已接 router；需測公司人員資料來源與權限 | 是 |
| 27 | generateEmployeeBindLink | admin.html People | 是 | V28 handleApi_ → apiGenerateEmployeeBindLinkV28_ | 產生手機綁定連結 | Admin、Owner | P1 | 已接 router；需測一次性 token 與連結入口 | 是 |
| 28 | resetEmployeeDeviceBinding | admin.html People | 是 | V28 handleApi_ → apiResetEmployeeDeviceBindingV28_ | 重設員工裝置綁定 | Admin、Owner | P1 | 已接 router；需補 audit log / 權限測試 | 是 |
| 29 | employeeHeaderData | employee.html apiPost | 是 | V28 handleApi_ → apiEmployeeHeaderDataV28_ | 員工端 Header / Logo / 品牌資料 | 員工 | P1 | 已接 router；需補真實品牌設定來源 | 是 |
| 30 | employeeBootstrap / getEmployeeBootstrapData | employee.html apiPost / google.script.run | 是 | V28 handleApi_ → apiEmployeeBootstrapV28_ | 員工端資料一次載入 | 員工 | P0 | 已接 router，但多為空陣列/最小資料，需補正式資料來源 | 是 |
| 31 | getPublishedScheduleForCalendar | employee.html apiPost / google.script.run | 否 | 無 | 載入已發布排班到日曆 | 員工 | P1 | 補 action 或併入 employeeBootstrap | 是 |
| 32 | employeeClock | employee.html apiPost | 是 | V28 handleApi_ → apiEmployeeClockV28_ | Web/App/捷徑打卡 | 員工 | P0 | 已接 router且會寫 ClockRecords；需補 session/device/location/班表計算驗證 | 是 |
| 33 | clockByButton | 舊打卡/捷徑使用 | 是 | V28 handleApi_ | 基本打卡 | 員工 | P1 | 保留，確認 employeeClock 與 clockByButton 主從 | 是 |
| 34 | nfcClock | nfc_clock.html 或 NFC 流程 | 是 | V28 handleApi_ | NFC 打卡 | 員工 | P1 | 保留，後續與 App 權限一起測 | 是 |
| 35 | employeeLeave | employee.html apiPost | 是 | V28 handleApi_ → apiGenericOkV28_ | 員工請假申請 | 員工 | P0 | 已接 router但目前疑似只回 ok，需補正式請假資料寫入與審核 | 是 |
| 36 | employeeClockFix | employee.html apiPost | 是 | V28 handleApi_ → apiGenericOkV28_ | 補打卡申請 | 員工 | P0 | 已接 router但目前疑似只回 ok，需補資料寫入與審核 | 是 |
| 37 | employeeUpload | employee.html apiPost | 是 | V28 handleApi_ → apiGenericOkV28_ | 員工端檔案/報銷/外勤回報 | 員工 | P0 | 已接 router但目前疑似只回 ok，需補 Drive/審核流程 | 是 |
| 38 | employeeMessage | employee.html apiPost | 是 | V28 handleApi_ → apiGenericOkV28_ | 員工留言 | 員工 | P1 | 已接 router但目前疑似只回 ok，需補留言資料寫入 | 是 |
| 39 | employeePreselect | employee.html apiPost | 是 | V28 handleApi_ → apiGenericOkV28_ | 員工預選休日期 | 員工 | P1 | 已接 router但目前疑似只回 ok，需補開放期限與正式資料寫入 | 是 |
| 40 | getTodayStatus | employee.html google.script.run | 是 | V28 handleApi_ | 今日狀態提示 | 員工 | P2 | 已接最小回應，後續併入正式 bootstrap | 否 |
| 41 | getRecentActivities | employee.html google.script.run | 是 | V28 handleApi_ | 最近動態 | 員工 | P2 | 已接空陣列，後續補資料來源 | 否 |
| 42 | getNoticesForEmployee | employee.html google.script.run | 是 | V28 handleApi_ | 員工公告通知 | 員工 | P2 | 已接空陣列，後續補公告來源 | 否 |
| 43 | isPreselectOpen | employee.html google.script.run | 是 | V28 handleApi_ | 判斷預選休是否開放 | 員工 | P1 | 已接固定 open，需補規則判斷 | 是 |
| 44 | getSettingsHash | employee.html google.script.run | 是 | V28 handleApi_ | 偵測設定變更自動刷新 | 員工 | P3 | 已接最小回應 | 否 |
| 45 | generateIosShortcutJson | employee.html apiPost | 否 | 無 | 產生 iOS 捷徑 JSON | 員工 | P2 | 非上架首要，可後補 | 否 |
| 46 | downloadSalarySlip | employee.html google.script.run only | 否 | 無 | 員工查薪資單 | 員工 | P2 | 薪資上線前補 | 否 |
| 47 | getManagerBootstrapData | admin.html google.script.run，GitHub bridge 會轉 action | 是 | V28 handleApi_ → apiManagerBootstrapV28_ | Manager 發布/審核資料載入 | Manager | P0 | 已接 router但為最小空資料，需補正式資料來源 | 是 |
| 48 | getAdminBootstrapData | admin.html google.script.run，GitHub bridge 會轉 action | 是 | V28 handleApi_ → apiAdminBootstrapV28_ | Admin 審核中心資料載入 | Admin、Owner | P0 | 已接 router但為最小空資料，需補正式資料來源 | 是 |
| 49 | getCreatorBootstrapData | admin.html google.script.run，GitHub bridge 會轉 action | 是 | V28 handleApi_ → apiCreatorBootstrapV28_ | Creator/Owner 系統設定資料載入 | Creator、Owner | P0 | 已接 router但為最小資料，需補正式設定來源 | 是 |
| 50 | adminSetReviewStatus | admin.html google.script.run，GitHub bridge 會轉 action | 是 | V28 handleApi_ → apiGenericOkV28_ | 審核通過/退回 | Manager、Admin、Owner | P0 | 已接 router但目前疑似只回 ok，需補實際審核狀態寫入 | 是 |
| 51 | generateSalaryDraft | admin.html google.script.run | 是 | V28 handleApi_ → apiGenerateSalaryDraftV28_ | 產生薪資草稿 | Admin、Owner | P1 | 已接最小 draft，需補正式計算 | 否 |
| 52 | saveSalaryReview | admin.html google.script.run | 是 | V28 handleApi_ → apiGenericOkV28_ | 送出薪資審核/發布 | Admin、Owner | P1 | 已接 router但需補資料寫入 | 否 |
| 53 | saveSalaryManagement | admin.html google.script.run | 是 | V28 handleApi_ → apiGenericOkV28_ | 薪資規則設定 | Admin、Owner | P1 | 已接 router但需補資料寫入 | 否 |
| 54 | saveSystemSettings | admin.html google.script.run / handleApi_ | 是 | V28 handleApi_ | 儲存寬限等系統設定 | Creator、Owner、Admin | P1 | 保留，補 session/permission gate | 是 |
| 55 | loadSystemSettings | admin/core | 是 | V28 handleApi_ | 讀取系統設定 | Creator、Owner、Admin | P1 | 保留，補 permission gate | 是 |
| 56 | saveApproverSettings | admin.html google.script.run / handleApi_ | 是 | V28 handleApi_ | 審核流程設定 | Creator、Owner | P1 | 保留，補權限驗證 | 是 |
| 57 | saveMixedModeSetting | admin/core | 是 | V28 handleApi_ | 混合班設定 | Creator、Owner | P2 | 保留 | 否 |
| 58 | saveClockLocationSettings | admin.html google.script.run | 否 | 無 | 打卡定位/分店地點設定 | Creator、Owner | P1 | 補 action 或併入 saveSystemSettings alias | 是 |
| 59 | saveBrandSettings | admin.html google.script.run | 否 | 無 | 品牌 Logo / 公司標題 | Creator、Owner | P1 | 補 action 或併入 saveSystemSettings alias | 是 |
| 60 | savePreselectSettings | admin.html google.script.run | 否 | 無 | 選休週/月規則設定 | Creator、Owner | P1 | 補 action 或併入 saveSystemSettings alias | 是 |
| 61 | saveShiftTypes | admin.html google.script.run | 否 | 無 | 班別設定 | Creator、Owner | P1 | 補 action 或併入 saveSystemSettings alias | 是 |
| 62 | archiveOldRecords | admin.html google.script.run | 是 | V28 handleApi_ → apiGenericOkV28_ | 歸檔舊資料 | Creator、Owner | P2 | 已接 router但需補實際歸檔 | 否 |
| 63 | exportArchivedToDrive | admin.html google.script.run | 是 | V28 handleApi_ | 匯出歸檔到 Drive | Creator、Owner | P2 | 已接 router但回傳 fileUrl 空值，需補實作 | 否 |
| 64 | getCompanyUploadDriveSettings | 設定/診斷頁可能使用 | 是 | V28 handleApi_ | 公司上傳 Drive 設定 | Creator、Owner | P2 | 保留 | 否 |
| 65 | saveCompanyUploadDriveSettings | 設定/診斷頁可能使用 | 是 | V28 handleApi_ | 儲存公司上傳 Drive 設定 | Creator、Owner | P2 | 保留 | 否 |
| 66 | getCompanySpreadsheetInfo | 設定/診斷頁可能使用 | 是 | V28 handleApi_ | 公司試算表路由資訊 | Creator、Owner | P2 | 保留 | 否 |
| 67 | getCompanyRetentionSettings / getCompanyRetentionSettingsV26 | 資料保留頁可能使用 | 是 | V28 handleApi_ | 取得資料保留設定 | Creator、Owner | P2 | 保留 | 否 |
| 68 | saveCompanyRetentionSettings / saveCompanyRetentionSettingsV26 | 資料保留頁可能使用 | 是 | V28 handleApi_ | 儲存資料保留設定 | Creator、Owner | P2 | 保留 | 否 |
| 69 | cleanupOldData / cleanupOldDataRetention / cleanupOldDataRetentionV26 | 資料保留工具 | 是 | V28 handleApi_ | 清理舊資料 | Creator、Owner | P2 | 保留，但需要雙確認 UI | 否 |
| 70 | setupDataRetentionTrigger / deleteDataRetentionTrigger | 資料保留工具 | 是 | V28 handleApi_ | 建立/刪除定時清理 trigger | Creator、Owner | P2 | 保留 | 否 |
| 71 | setupCompanySpreadsheetRouting / backfillCompanySpreadsheets | 手動工具/遷移 | 是 | V28 handleApi_ | 一公司一表路由與補資料 | Creator | P2 | 僅工具頁可用，不給一般管理員 | 否 |
| 72 | issueFreePrivilegeCode | 平台 Creator 工具 | 是 | V28 handleApi_ | ANG8963 發免付費特權 ID | Creator ANG8963 | P1 | 保留，嚴格限制 ANG8963 與 owner key | 是 |
| 73 | getEmployeeDashboard / submitClock / submitLeave / getAdminDashboard / processReview / angFrontendVerifySession | ang-frontend-api.js 或新前端共用 API | 是 | V28 handleApi_ → V29 frontend API layer | 新版前端安全串接 | 員工、管理員 | P1 | 後續確認是否取代舊 employee/admin action | 是 |
| 74 | requestGoogleAuth | GAS/Auth.js | 未接主 handleApi_ | GAS/Auth.js handleAuthAction_ | Web Google OAuth 開始 | 企業主、管理員 | P2 | 若保留 Auth.js，主 doGet/doPost 需明確導到 handleAuthAction_ | 否 |
| 75 | requestLineAuth | GAS/Auth.js | 未接主 handleApi_ | GAS/Auth.js handleAuthAction_ | Web LINE OAuth 開始 | 企業主、管理員 | P2 | 同上 | 否 |
| 76 | requestEmailVerifyCode | GAS/Auth.js / 舊命名 | 否 | 無主 router case | 寄 Email code | 企業主、管理員 | P1 | 改 alias 到 requestEmailCode 或淘汰 | 是 |
| 77 | confirmEmailVerifyCode | GAS/Auth.js / 舊命名 | 否 | 無主 router case | 驗證 Email code | 企業主、管理員 | P1 | 改 alias 到 verifyEmailCode 或淘汰 | 是 |
| 78 | verifyAuthToken | GAS/Auth.js / deep link patch | 否 | 無主 router case | 驗證 verify_token | 全部 | P1 | 可併入 angGetPermissionSnapshot / verifyEmployeeSession | 是 |

## 命名相似但不一致

| 群組 | 前端/舊命名 | 後端/新命名 | 建議 |
|---|---|---|---|
| Email 寄碼 | requestEmailVerifyCode | requestEmailCode / requestCompanySignupEmailVerification / requestAdminLoginEmailVerification | 保留主命名 requestEmailCode；短期補 alias 或淘汰 Auth.js 舊入口 |
| Email 驗碼 | confirmEmailVerifyCode | verifyEmailCode / verifyAdminEmailCodeAndLogin | 保留主命名 verifyEmailCode；短期補 alias 或淘汰 Auth.js 舊入口 |
| 員工開通 | employeeActivateByVerifiedAuth | activateEmployeeByVerifiedAuth | 已有 alias，保留主名 activateEmployeeByVerifiedAuth |
| 員工打卡 | employeeClock | clockByButton / nfcClock | employeeClock 已接 router；需決定是否為前端主名 |
| 員工資料載入 | getEmployeeBootstrapData | employeeBootstrap | 已有同 router alias，保留 employeeBootstrap 作 GitHub Pages 主名 |
| 註冊免費試用 | startFreeUseCompany / startFreeTrial | registerCompany | 仍未接 router；建議全部導向 registerCompany，不拆三套 |
| 人員新增 | addEmployee / createEmployee / registerEmployee | saveEmployeeProfile | 兩者都已接 router；需決定新增/編輯主從 |

## google.script.run 轉 fetch 風險

admin.html 的 GitHub bridge 會在 GitHub Pages 環境下攔截 google.script.run.someMethod(...)，然後 POST 到 GAS，payload.action 會等於 someMethod。

已接 router、但仍需補實作或權限檢查的方法：

- getManagerBootstrapData
- getAdminBootstrapData
- getCreatorBootstrapData
- adminSetReviewStatus
- generateSalaryDraft
- saveSalaryReview
- saveSalaryManagement
- archiveOldRecords
- exportArchivedToDrive
- getPeopleManagementData
- saveEmployeeProfile
- generateEmployeeBindLink
- resetEmployeeDeviceBinding

仍可能造成未知 action 的方法：

- saveClockLocationSettings
- saveBrandSettings
- savePreselectSettings
- saveShiftTypes

## P0 / P1 第一批建議修正清單

1. P0-3A：強化 angGetPermissionSnapshot / apiPermissionSnapshotV30_，不是新增 router case。
2. P0-3B：補 employeeLeave / employeeClockFix / employeeUpload / employeeMessage / employeePreselect 的正式資料寫入，不再只 generic ok。
3. P0-3C：補 getAdminBootstrapData / getManagerBootstrapData / getCreatorBootstrapData 真實資料來源。
4. P0-3D：補 adminSetReviewStatus 真正審核寫入。
5. P0-3E：補 register.html 的 startFreeUseCompany / startFreeTrial alias，統一導向 registerCompany。
6. P0-3F：activateEmployee 補 session 或正式改走 activateEmployeeByVerifiedAuth。
7. P1：補 saveClockLocationSettings / saveBrandSettings / savePreselectSettings / saveShiftTypes router alias。
8. P1：整理 Auth.js 舊命名與主 handleApi_ 命名衝突。

## 下一步建議

P0-3A 只處理一件事：強化 angGetPermissionSnapshot / apiPermissionSnapshotV30_ 的正式權限快照。

建議 P0-3A 範圍：

- 修改 GAS/程式碼.js 最後有效層相關函式。
- 不新增第二個 handleApi_。
- 不修改前端文案。
- 驗證 company_id、id/employee_id、session_token/token、device_id。
- 回傳 role、permissions、permission_source、companies、plan、billing_status、is_platform_creator、is_company_owner。
- 明確分開平台 Creator 與公司 Owner。
- 避免只因 findEmployee_ 有資料就視為 authenticated。
- 不處理 employeeBootstrap 或 admin bootstrap，避免一次大改。
