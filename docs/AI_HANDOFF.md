# ANG HR AI HANDOFF

## 目前任務

P1｜入口員工登入改為「先鎖定公司／開通碼，再做 Email 快速驗證」＋方向判斷手勢

## 本次是否修改檔案

有。只修改入口登入前端、GAS 登入 action 與交接文件；未修改 admin.html、employee.html、register.html、Auth.js、Company.js 或其他正式流程。

## 修改檔案清單

- index.html
- GAS/程式碼.js
- docs/AI_HANDOFF.md

## 完成內容

- 移除員工登入畫面的「員工編號」輸入欄位。
- 員工登入第一階段只輸入「公司代碼／開通碼」。
- 按「確認」或在員工卡片往上拉時，呼叫 `prepareEmployeeEmailLogin`，先鎖定公司或開通資料。
- 鎖定成功後才展開 Email 驗證區，並提供「重新輸入」。
- 公司代碼登入改用「公司 + Email」尋找唯一人員資料；不再要求使用者手動輸入員工編號。
- 開通碼登入先鎖定對應員工，但仍要求輸入人員資料 Email 完成驗證。
- 新增 `login_context_id` 與 `pending_login_id`，以 CacheService 暫存 10 分鐘，驗證時不再重掃公司與人員範圍。
- Email 驗證碼改為快速登入專用快取；同一公司與 Email 60 秒內不可重寄，一天最多 5 次。
- 驗證成功後才建立 session；首次開通在驗證成功後才消耗開通碼並綁定裝置。
- `prepareEmployeeEmailLogin`、`requestEmployeeEmailLoginCode`、`verifyEmployeeEmailCodeAndLogin` 不再每次重跑 `initializeSystem_()`，降低登入前置等待。
- 一次性連結會自動帶入開通碼並執行第一階段鎖定；若連結帶 Email 也會自動填入。
- 修正卡片垂直手勢方向：收合時往上拉才展開；展開後繼續往上改為捲動卡片內內容，不再誤判成關閉。
- 展開後若內容尚未回到頂端，往下只會先捲回頂端；必須在內容頂端再次往下拉，才會收回卡片。
- 左右手勢仍固定一次只切換一張卡片，不會因為內文上下捲動而跳頁。
- 已完成 index 內嵌 JavaScript 與 GAS JavaScript 語法檢查。

## 發現問題

- 目前主要登入資料仍來自平台 `Companies` / `Employees`，舊資料不存在平台表時會回退查公司人員表，回退路徑仍可能較慢。
- 同一公司若有兩筆人員共用同一 Email，系統會拒絕登入並要求管理員整理資料，避免登入到錯誤員工。
- 一般公司代碼登入仍受裝置綁定限制；未完成首次開通者必須使用開通碼。
- `native-google-bridge.js` 仍是 safe-isolation 版本，本次沒有恢復原生 Google / LINE bridge。
- P0-2 盤點中列出的正式寫入、權限快照、註冊 alias 等問題仍未在本次處理。

## 需要 Enden 確認

- 員工登入是否固定只保留 Email 驗證，不再提供 Google / LINE。
- 同一 Email 對應多名員工時，是否一律由管理員整理，不在前端再顯示人員選單。
- 鎖定公司後顯示的公司名稱、方案與付款狀態是否要再縮減，只保留公司名稱。

## 下一步建議

先部署 GAS/程式碼.js，再上傳 index.html 測試以下四條路徑：

1. 公司代碼 → Email → 驗證碼 → 已綁定裝置登入。
2. 開通碼 → Email → 驗證碼 → 首次綁定裝置。
3. 一次性連結 → 自動鎖定 → Email 驗證。
4. 錯誤公司、錯誤 Email、重複 Email、已使用開通碼的錯誤提示。
5. 收合卡片往上展開；展開後連續往上可滑到註冊／底部內容且不會關閉。
6. 內文不在頂端時往下只回捲；回到頂端後再往下才收回卡片。
7. 左右各滑一次只切換一張卡片。

完成測試後停止，不自行進入下一個 P0 / P1 任務。

## 補充盤點（不改程式）：左右留白 / 頁面邊界

依 @copilot 最新指示，已盤點：

- index.html
- admin.html
- employee.html
- register.html
- 共用 CSS（app-admin.css、app-employee.css）
- 會動態改 class / style 的 JS（index/admin/employee inline script、app-core.js）

### 1) 各頁最外層主要內容容器 selector

- index：`main.phone#phone`（內容主體另由 `.panel` 承載）
- admin：`div.safe`
- employee：`div.safe`
- register：`main.screen > div.wrap`

### 2) 桌機 / 手機 width、max-width、margin、padding（主容器）

#### index.html

- `main.phone#phone`（index.html:84-94, 1142）
  - 桌機：`width:100%`, `max-width:400px`, `height:100vh`, `min-height:100vh`, `margin:0`（未設 margin）
  - 手機（<=430）：`max-width:none`, `height:100vh`, `border-radius:0`（index.html:447-449）
  - padding：未設（0）
- `.panel`（index.html:197-212, 488-491, 952-955, 1051-1054）
  - 桌機：`padding:26px 24px calc(24px + env(safe-area-inset-bottom))`
  - 手機（<=430）：`padding:26px 22px calc(24px + env(safe-area-inset-bottom))`
  - 矮螢幕（<=700 高）：`padding:22px 22px calc(20px + env(safe-area-inset-bottom))`
  - width / max-width / margin：未設（依父層）

#### admin.html

- `div.safe`（admin.html:34, 399）
  - 桌機：`width:auto`, `max-width:none`, `margin:0`, `padding:8px 8px 0`
  - 手機（<=390）：`padding:6px 6px 0`（admin.html:180）

#### employee.html

- `div.safe`（employee.html:36, 549）
  - 基準：`width:100%`, `max-width:none`, `margin:0`, `padding:8px 8px 0`
  - 手機（<=390）：`padding:6px 6px 0`（employee.html:196）
  - 桌機（>=768）：`padding:12px 14px 0`（employee.html:197）

#### register.html

- `main.screen`（register.html:42-49, 81）
  - 桌機 / 手機共用：`width:100%`, `max-width:430px`, `min-height:100vh`, `margin:0`, `padding:0`
- `div.wrap`（register.html:54, 82）
  - 桌機 / 手機共用：`padding:calc(22px + env(safe-area-inset-top)) 18px calc(22px + env(safe-area-inset-bottom))`
  - width / max-width / margin：未設（依父層）

### 3) 左右留白不一致頁面

- index：主內容 `.panel` 左右 22~24px
- register：主內容 `.wrap` 左右 18px
- employee：主內容 `.safe` 左右 6/8/14px（依斷點）
- admin：主內容 `.safe` 左右 6/8px（缺少 >=768 放大）

結論：四頁左右留白明顯不一致，且 admin / employee 在桌機寬度下不對齊。

### 4) 指定風險檢查結果

- `width:100vw`
  - 主容器未使用。
  - 但有 `calc(100vw - 20px/16px)` 用於公司切換浮層（admin.html:190,206；employee.html:380,516）。
- `padding:0`
  - 主容器未看到直接把左右 padding 設為 0（register 的 `.screen` 本身為 0，但實際內容在 `.wrap` 有左右 18px）。
- `margin-left / margin-right` 負值
  - 未發現。
- `position: fixed / absolute` 撐滿畫面
  - 有：`index .view{position:absolute;inset:0}`（index.html:182），
    `admin/employee` 的 `nav`、toggle、company-switcher/backdrop 為 fixed（admin.html:188,190,237；employee.html:176,369,377）。
  - 這些多為浮層/導覽，非主內容容器，但會影響視覺邊界感。
- `calc()` 超出容器
  - 風險點：`index .sheet-carousel` 使用 `calc((100% - 358px)/2)`、手機版 `calc((100% - 342px)/2)`（index.html:312,452）。
  - 當 viewport 小於卡片寬時會出現負值，易造成水平偏移/視覺不對齊。
- safe-area 設定不一致
  - index/register 主要只吃 top/bottom safe-area（index.html:95-98；register.html:54）。
  - admin/employee 額外在固定導覽/切換器吃 safe-area（admin.html:128,190,238；employee.html:176,244,378）。
  - 左右 safe-area（left/right）未統一處理。
- media query 覆蓋桌機設定
  - index 在 `@media (max-width:430px)` 直接改成 `body{align-items:stretch}`、`.phone{max-width:none;border-radius:0}`（index.html:447-449）。
  - employee 有 `@media(min-width:768px)` 放大左右 padding（employee.html:197），admin 無對應桌機放大。
- body / 主容器 overflow 造成水平位移
  - index：`html,body{overflow:hidden}`（index.html:69），會隱藏溢出且把問題視覺化為「貼邊」。
  - admin/employee：`overflow-x:hidden`（admin.html:18；employee.html:23），可能掩蓋橫向位移來源。

### 5) 「上下貼邊」與「左右貼邊」分別由誰控制

- 上下貼邊（index 最明顯）
  - `html,body{height:100%;overflow:hidden}`（index.html:69）
  - `.phone{height:100vh;min-height:100vh}`（index.html:84-89）
  - 手機斷點 `.phone{border-radius:0}` + `body{align-items:stretch}`（index.html:448-449）
  - `.view{position:absolute;inset:0}`（index.html:182）
- 左右貼邊（各頁實際由內容容器 padding 決定）
  - index：`.panel`（index.html:488-491, 953-955）
  - admin：`.safe`（admin.html:34,180）
  - employee：`.safe`（employee.html:36,196,197）
  - register：`.wrap`（register.html:54）

### 6) 統一左右留白建議值（先提案，不修改）

- 建議統一主內容水平留白 token：
  - 手機（<=390）：`12px`
  - 一般手機（391~767）：`16px`
  - 平板以上（>=768）：`20px`
- 建議值來源（供人工審核）：
  - 取目前已存在值的中位區間（admin/employee 6~14、register 18、index 22~24），先收斂成 12/16/20 三段，避免一次跳到極窄或極寬。
  - 16px 作為跨頁基準，手機小螢幕下保留 12px 避免內容擠壓；平板以上用 20px 提升可讀性並接近現有 index/register 視覺密度。
- 對應套用目標：
  - index：`.panel`
  - admin/employee：`.safe`
  - register：`.wrap`

### 7) 實際修改前需人工確認

- 是否接受 index 在手機仍維持全高（`100vh`）但只統一左右留白，不動目前上下全版框架。
- 是否要把 admin 補上與 employee 相同的桌機斷點（>=768）左右留白放大規則。
- 是否要把 index 的 carousel `calc((100% - 固定卡寬)/2)` 改為 `max(0px, calc(...))` 或改成不依賴固定卡寬，避免窄機負值。
- 是否要納入 left/right safe-area（例如橫向瀏海）統一策略。
- 本輪依規則只盤點；正式修法需待 Enden 確認後再進入下一階段。

## P0-3B 實作（獨立 PR）：admin / employee 左右留白統一

### 本次實作範圍

- 只修改：
  - `admin.html`
  - `employee.html`
  - `docs/AI_HANDOFF.md`
- 未修改：
  - `index.html`
  - `register.html`
  - `GAS/`
  - API router / 功能邏輯 / 頁面文案 / 主題與導覽規則

### 目標與對應 selector

- 目標 selector：`admin .safe`、`employee .safe`
- 套用規則：
  - `<=390px`：`padding: 6px 12px 0`
  - `391px~767px`：`padding: 8px 16px 0`
  - `>=768px`：`padding: 12px 20px 0`
- 保留項目：
  - `employee.html` 既有 `@media (min-width:768px)` 的 desktop grid / nav 規則維持不變（僅調整同段 `.safe` 左右值）。
  - `admin.html` 補上 `@media (min-width:768px)` 的 `.safe` 規則。

### 驗證結果（360 / 390 / 430 / 768）

驗證方式：Playwright 以 `http://127.0.0.1:8000` 載入頁面，逐一調整 viewport，檢查：

- `document.documentElement.scrollWidth > window.innerWidth`（水平捲動）
- `.card` 邊界是否超出 viewport
- `.safe` 計算後 padding 是否符合規格

結果：

- `admin.html`：360 / 390 / 430 / 768 全部無水平捲動、無卡片超出，`.safe` padding 分別符合 12 / 16 / 20（top 6 / 8 / 12）。
- `employee.html`：360 / 390 / 430 / 768 全部無水平捲動、無卡片超出，`.safe` padding 分別符合 12 / 16 / 20（top 6 / 8 / 12）。

### 目前不處理（依指示保留）

- carousel
- safe-area left/right
- company switcher
- 其他盤點項目
