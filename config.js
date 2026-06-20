//=============================================================================
// 檔案：config.js
// 說明：ANG HR GitHub 前端設定檔
// 重點：GAS 只當 API；頁面切換一律走 GitHub 前端 admin.html / employee.html。
//=============================================================================
(function(window){
  'use strict';

  var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyVD-_tx9wFkggsuSnrL2T6HoyGPYuBQgoClr4GyxISaAeNfLVY32auEZDw2ihrXqJj/exec';
  var GOOGLE_CLIENT_ID = '466961332869-icjvb1i9b6q9ghiei0oslhffpcgp57v1.apps.googleusercontent.com';

  function getFrontendBase(){
    try {
      var href = String(window.location.href || '').split('#')[0].split('?')[0];
      return href.replace(/\/[^\/]*$/, '');
    } catch (err) {
      return '.';
    }
  }

  function joinUrl(base, file){
    base = String(base || '.').replace(/\/+$/, '');
    file = String(file || '').replace(/^\/+/, '');
    return base + '/' + file;
  }

  var frontendBaseUrl = getFrontendBase();

  window.ANG_HR_CONFIG = {
    appName: 'ANG HR System',

    // API：只用來 fetch / google.script.run bridge 呼叫，不拿來跳頁。
    gasApiUrl: GAS_API_URL,
    apiBaseUrl: GAS_API_URL,
    workerApiUrl: '',

    // GitHub 前端：員工 / 管理模式切換都走這裡。
    frontendBaseUrl: frontendBaseUrl,
    githubBaseUrl: frontendBaseUrl,
    employeePage: 'employee.html',
    adminPage: 'admin.html',
    employeePageUrl: joinUrl(frontendBaseUrl, 'employee.html'),
    adminPageUrl: joinUrl(frontendBaseUrl, 'admin.html'),

    // 注意：webAppUrl 已改成 GitHub 前端，不再是 GAS。
    webAppUrl: joinUrl(frontendBaseUrl, 'employee.html'),

    googleClientId: GOOGLE_CLIENT_ID,
    themeColors: ['#FF87E0', '#CCA4FF', '#8089FF', '#59DDFF'],
    defaultCompanyId: '',
    defaultEmployeeId: ''
  };
})(window);
