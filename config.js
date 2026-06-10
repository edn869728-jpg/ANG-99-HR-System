// ANG HR GitHub 前端設定｜公司登入 / Google / 免費體驗版
window.ANG_HR_CONFIG = {
  plan: "premium",
  frontendMode: "github_pages",
  frontendBaseUrl: "https://edn869728-jpg.github.io/ANG-99-HR-System",
  indexPage: "index.html",
  employeePage: "employee.html",
  adminPage: "admin.html",
  loginPage: "login.html",
  trialPage: "trial.html",
  nfcClockPage: "nfc_clock.html",

  // 正確 GAS Web App URL
  gasApiUrl: "https://script.google.com/macros/s/AKfycbyVD-_tx9wFkggsuSnrL2T6HoyGPYuBQgoClr4GyxISaAeNfLVY32auEZDw2ihrXqJj/exec",

  // 關閉 Worker，避免 Worker 指到舊後端 / 舊試算表
  workerApiUrl: "",

  // Google Identity Services Client ID
  // 正式使用 Google 登入前，請到 Google Cloud Console 建立 OAuth Web Client ID 後填入。
  googleClientId: "466961332869-icjvb1i9b6q9ghiei0oslhffpcgp57v1.apps.googleusercontent.com",

  defaultCompanyCode: "ang_99",
  defaultCompanyId: "ang_99",
  expectedSpreadsheetId: "1qsyDiIj_0DdQx6tB0l_BXE5AYEiRrtSr9RqxdKaxato",

  get apiBaseUrl() {
    return this.gasApiUrl;
  }
};
