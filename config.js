// ANG HR｜GitHub 前端設定
// 使用方式：
// 1. GitHub Pages 上傳本資料夾所有檔案。
// 2. 若直接呼叫 GAS 遇到 CORS，請先部署 cloudflare_worker_optional/worker.js，然後把 workerApiUrl 填入 Worker 網址。
// 3. apiBaseUrl 會優先使用 workerApiUrl，其次使用 gasApiUrl。
window.ANG_HR_CONFIG = {
  plan: "premium",
  frontendMode: "github_pages",
  frontendBaseUrl: "https://edn869728-jpg.github.io/ANG-99-HR-System",
  employeePage: "employee.html",
  adminPage: "admin.html",

  // 後端 GAS Web App URL
  gasApiUrl: "https://script.google.com/macros/s/AKfycbyVD-_tx9wFkggsuSnrL2T6HoyGPYuBQgoClr4GyxISaAeNfLVY32auEZDw2ihrXqJj/exec",

  // 建議正式上架填 Worker URL，例如：https://ang-hr-api.xxxx.workers.dev
  workerApiUrl: "https://ang-99-hr.edn869728.workers.dev/",

  get apiBaseUrl() {
    return this.workerApiUrl || this.gasApiUrl;
  }
};
