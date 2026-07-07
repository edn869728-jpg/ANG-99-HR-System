ANG HR｜Personal + Creator P0
日期：2026-07-07

本包以 GitHub main 最新基準 eb5a5010368e32d4043cac836a0fd8515c9c266f 製作。

已修改／新增：
1. index.html
   - 修正 iPhone / App 底部「選擇入口」卡片裁切。
   - 新增 Personal 個人／平等團隊入口。
   - 新增 Personal 與資料自管版方案卡。
   - 平台 Creator 驗證成功改進 creator.html。

2. personal.html
   - 個人模式與無老闆平等團隊共用單頁。
   - 今日、班表、打卡、請假紀錄、薪資、記事、提醒、個人設定。
   - 週排／月排、週領／雙週／半月／月領。
   - 個人模組權限跟帳號，不綁整個團隊。

3. creator.html
   - 平台 Creator 總覽。
   - 正式公司、Personal 個人、Personal 團隊、方案模組統計。
   - 品牌 → 經營主體 → 分店 → 使用者分層。
   - 同名店不依名稱合併，一律依 brand_id / organization_id / branch_id / workspace_id 判斷。

4. config.js / app.html / app-core.js
   - App shell 固定使用 GitHub app.html。
   - Personal / Creator 路由。
   - no-cache 版本控制。

5. GAS/程式碼.js
   - 新增 PersonalWorkspaces、Brands、Organizations、Branches 表頭。
   - 新增 getPersonalBootstrapData。
   - 新增 savePersonalWorkspaceState。
   - 新增 getCreatorPlatformOverview。

注意：
- GitHub 前端檔案合併後即可由 GitHub Pages 更新。
- GAS/程式碼.js 合併後仍需 clasp push 或在 Apps Script 重新部署新版 Web App。
- 目前最新 Git 包內沒有 Android / iOS 原生專案，因此本包完成的是 GitHub 前端 App shell 串接，不含重新編譯 APK / IPA。
