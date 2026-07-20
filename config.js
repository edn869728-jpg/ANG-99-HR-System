//=============================================================================
// 檔案：config.js
// 說明：ANG HR GitHub 前端設定檔（v0.6.0）
//=============================================================================
(function(window){
  'use strict';

  var FRONTEND_BASE_URL = 'https://edn869728-jpg.github.io/ANG-99-HR-System';
  var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec';
  var GOOGLE_CLIENT_ID = '660707205594-74rvsq9s1h87v1s5pi9nvtms1e4qipat.apps.googleusercontent.com';
  var LINE_CHANNEL_ID = '2010402308';

  function cleanBase(url){ return String(url || '').trim().replace(/\/+$/, ''); }
  function joinUrl(base, file){ return cleanBase(base || FRONTEND_BASE_URL) + '/' + String(file || '').replace(/^\/+/, ''); }

  var frontendBaseUrl = cleanBase(FRONTEND_BASE_URL);

  window.ANG_HR_CONFIG = {
    appName: 'ANG HR System',
    version: '0.6.0',
    contactEmail: 'ang0603.system@gmail.com',
    gasApiUrl: GAS_API_URL,
    apiBaseUrl: GAS_API_URL,
    workerApiUrl: '',
    frontendBaseUrl: frontendBaseUrl,
    githubBaseUrl: frontendBaseUrl,
    indexPage: 'index.html',
    employeePage: 'employee.html',
    adminPage: 'admin.html',
    indexPageUrl: joinUrl(frontendBaseUrl, 'index.html'),
    employeePageUrl: joinUrl(frontendBaseUrl, 'employee.html'),
    adminPageUrl: joinUrl(frontendBaseUrl, 'admin.html'),
    webAppUrl: joinUrl(frontendBaseUrl, 'employee.html'),
    googleClientId: GOOGLE_CLIENT_ID,
    googleWebClientId: GOOGLE_CLIENT_ID,
    lineChannelId: LINE_CHANNEL_ID,
    themeColors: ['#FF87E0', '#CCA4FF', '#8089FF', '#59DDFF'],
    defaultCompanyId: '',
    defaultEmployeeId: '',
    platformCreatorEmployeeId: 'ANG8963',
    freePrivilegeOwnerId: 'ANG8963'
  };

  // v0.6.0 共用功能：管理端＋員工端同步載入。
  var featureScript = document.createElement('script');
  featureScript.src = joinUrl(frontendBaseUrl, 'ang-hr-v0.6.0.js') + '?v=0.6.0';
  featureScript.defer = true;
  document.head.appendChild(featureScript);
})(window);