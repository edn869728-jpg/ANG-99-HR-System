ANG HR｜APK 免登入組合

用途：
- 包成 Android APK 後，不進登入頁。
- App 開啟後直接以平台 Creator 進入 admin.html。
- 固定身份：
  company_id = PLATFORM
  employee_id = ANG8963
  role = Creator
  token = APK_NO_LOGIN_CREATOR_ANG8963

覆蓋方式：
1. 解壓縮本 ZIP。
2. 將 app 資料夾覆蓋到：
   C:\Users\ChihHao Mi\Desktop\Project\ANG-99-HR\app
3. 如要讓 GAS 後端也接受 APK 免登入 token，請把：
   程式碼_APK免登入.js
   覆蓋到 Apps Script 的 程式碼.js。
4. 在 PowerShell 執行：
   build_install_ANG99HR_APK免登入.ps1

啟動規則：
- MainActivity 載入 file:///android_asset/index.html
- index.html 自動寫入 localStorage
- 然後跳到 admin.html?company_id=PLATFORM&id=ANG8963&role=Creator...

注意：
- 這是你的 APK 直進 Creator 版本。
- 若上傳 程式碼_APK免登入.js 到正式 GAS，任何知道固定 token 的 APK/前端都可用平台 Creator 權限；正式上架前建議改成裝置簽章或 Google Authenticator。
