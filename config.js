// ANG HR GitHub 前端設定｜正確 GAS URL 版
// 這版重點：關閉 Worker，強制直接打你確認的正確 GAS Web App URL。
window.ANG_HR_CONFIG = {
  plan: "premium",
  frontendMode: "github_pages",
  frontendBaseUrl: "https://edn869728-jpg.github.io/ANG-99-HR-System",
  employeePage: "employee.html",
  adminPage: "admin.html",

  // 正確 GAS Web App URL
  gasApiUrl: "https://script.google.com/macros/s/AKfycbyVD-_tx9wFkggsuSnrL2T6HoyGPYuBQgoClr4GyxISaAeNfLVY32auEZDw2ihrXqJj/exec",

  // 關閉 Worker，避免 Worker 指到舊後端 / 舊試算表
  workerApiUrl: "",

  get apiBaseUrl() {
    return this.gasApiUrl;
  },

  expectedSpreadsheetId: "1qsyDiIj_0DdQx6tB0l_BXE5AYEiRrtSr9RqxdKaxato"
};
