// ANG HR GitHub 前端設定｜強制指定資料來源版
// 這版重點：不要先走 Cloudflare Worker，避免 Worker 還指到舊 GAS / 舊試算表。
// 前端實際 API = gasApiUrl
window.ANG_HR_CONFIG = {
  plan: "premium",
  frontendMode: "github_pages",
  frontendBaseUrl: "https://edn869728-jpg.github.io/ANG-99-HR-System",
  employeePage: "employee.html",
  adminPage: "admin.html",

  // 目前指定 HR GAS Web App URL
  gasApiUrl: "https://script.google.com/macros/s/AKfycbyLqYPsz-wcA7fW8KA1OylkJvmiIlwyEpSaKB0ovUxsomRSjKmHTRToK-C5Uf-i3BjSPg/exec",

  // 關閉 Worker，避免讀到不知道哪一支後端
  workerApiUrl: "",

  // 目前強制只用 GAS
  get apiBaseUrl() {
    return this.gasApiUrl;
  },

  // 預期後端試算表
  expectedSpreadsheetId: "1qsyDiIj_0DdQx6tB0l_BXE5AYEiRrtSr9RqxdKaxato"
};
