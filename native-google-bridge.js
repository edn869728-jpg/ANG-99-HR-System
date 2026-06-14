/* ANG HR SYSTEMS｜Native Google Sign-In Bridge
   放法 1：把整段貼進 index.html 原本 <script> 裡，建議放在 init(); 前面。
   放法 2：另存 native-google-bridge.js，並在 index.html </body> 前載入：
   <script src="native-google-bridge.js?v=20260614-free-use"></script>
*/
(function(){
  'use strict';

  const STORAGE_KEY = 'ang_hr_pending_native_google_context';
  const DEFAULT_TIMEOUT_MS = 90000;

  function safeJsonParse(text, fallback){
    try { return JSON.parse(text); } catch(e) { return fallback; }
  }

  function getDeviceId(){
    try {
      if (window.APP_STATE && window.APP_STATE.deviceId) return window.APP_STATE.deviceId;
      const key = 'ang_hr_device_id';
      let id = localStorage.getItem(key);
      if (!id) {
        id = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,10).toUpperCase();
        localStorage.setItem(key, id);
      }
      return id;
    } catch(e) {
      return 'WEBVIEW-' + Date.now().toString(36).toUpperCase();
    }
  }

  function setStatusSafe(id, type, message){
    if (typeof window.setStatus === 'function') {
      window.setStatus(id, type, message);
      return;
    }
    const box = document.getElementById(id);
    if (!box) return;
    box.className = 'status show ' + (type || 'info');
    box.innerText = message || '';
  }

  function buildBaseUrl(){
    if (window.APP_STATE && window.APP_STATE.baseUrl) return window.APP_STATE.baseUrl;
    return window.location.origin + window.location.pathname;
  }

  function buildFallbackUrl(page, params){
    const safePage = String(page || 'login').trim().toLowerCase();
    const map = {
      login:'login.html',
      register:'register.html',
      admin:'admin.html',
      platform_admin:'platform_admin.html',
      nfc_admin:'nfc_admin.html',
      nfc_clock:'nfc_clock.html'
    };
    const file = map[safePage] || (safePage.endsWith('.html') ? safePage : 'login.html');
    const base = buildBaseUrl().replace(/[^\/]*$/, '');
    const url = new URL(file, base);
    Object.keys(params || {}).forEach(function(key){
      if (params[key] === undefined || params[key] === null || params[key] === '') return;
      url.searchParams.set(key, String(params[key]));
    });
    return url.href;
  }

  function savePendingContext(context){
    const data = Object.assign({}, context || {}, {
      createdAt: Date.now(),
      deviceId: getDeviceId()
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
    window.__ANG_NATIVE_GOOGLE_CONTEXT__ = data;
    return data;
  }

  function getPendingContext(payload){
    if (payload && typeof payload === 'object' && payload.mode) return payload;
    if (window.__ANG_NATIVE_GOOGLE_CONTEXT__) return window.__ANG_NATIVE_GOOGLE_CONTEXT__;
    try {
      const data = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
      if (data && data.createdAt && Date.now() - data.createdAt <= DEFAULT_TIMEOUT_MS) return data;
    } catch(e) {}
    return {};
  }

  function clearPendingContext(){
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    window.__ANG_NATIVE_GOOGLE_CONTEXT__ = null;
  }

  function hasNativeBridge(){
    return !!(
      window.AngHrApp ||
      window.AndroidBridge ||
      window.ReactNativeWebView ||
      (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.angHrApp)
    );
  }

  function postToNative(message){
    const payload = Object.assign({ source:'ang_hr_web', type:'google_sign_in' }, message || {});
    const text = JSON.stringify(payload);

    if (window.AngHrApp && typeof window.AngHrApp.postMessage === 'function') {
      window.AngHrApp.postMessage(text);
      return true;
    }
    if (window.AndroidBridge && typeof window.AndroidBridge.postMessage === 'function') {
      window.AndroidBridge.postMessage(text);
      return true;
    }
    if (window.AndroidBridge && typeof window.AndroidBridge.startGoogleLogin === 'function') {
      window.AndroidBridge.startGoogleLogin(text);
      return true;
    }
    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      window.ReactNativeWebView.postMessage(text);
      return true;
    }
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.angHrApp) {
      window.webkit.messageHandlers.angHrApp.postMessage(payload);
      return true;
    }
    return false;
  }

  window.isAngHrNativeApp = hasNativeBridge;

  window.startAppNativeGoogleLogin = function(context){
    const ctx = savePendingContext(context || {});
    const statusId = ctx.statusId || 'adminLoginStatus';
    setStatusSafe(statusId, 'info', '正在開啟 App 原生 Google 登入...');

    const ok = postToNative({
      action:'startGoogleLogin',
      mode:ctx.mode || '',
      plan:ctx.plan || '',
      freeDays:ctx.freeDays || ctx.free_days || '',
      email:ctx.email || '',
      companyCode:ctx.companyCode || '',
      deviceId:ctx.deviceId || getDeviceId(),
      redirectUrl:window.location.href
    });

    if (!ok) {
      setStatusSafe(statusId, 'error', '目前不是 App WebView，請改用網頁 Google 驗證');
      return false;
    }
    return true;
  };

  window.handleAppNativeLogin = function(idToken, payload){
    const ctx = getPendingContext(payload);
    const statusId = ctx.statusId || 'adminLoginStatus';
    const token = String(idToken || '').trim();

    if (!token) {
      setStatusSafe(statusId, 'error', 'App 沒有回傳 Google idToken');
      return;
    }

    const req = {
      idToken:token,
      mode:ctx.mode || 'admin_login',
      plan:ctx.plan || '',
      freeDays:ctx.freeDays || ctx.free_days || '',
      email:ctx.email || '',
      companyCode:ctx.companyCode || '',
      deviceId:ctx.deviceId || getDeviceId(),
      source:'native_webview',
      userAgent:navigator.userAgent || ''
    };

    setStatusSafe(statusId, 'info', '正在驗證 Google 身分...');

    if (window.google && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(function(res){ handleNativeGoogleResult(res, statusId, ctx); })
        .withFailureHandler(function(err){
          setStatusSafe(statusId, 'error', (err && err.message) ? err.message : 'Google 驗證連線失敗');
        })
        .verifyAppNativeGoogleLogin(req);
      return;
    }

    fetch(buildFallbackUrl('api', { action:'verifyAppNativeGoogleLogin' }), {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(req)
    })
    .then(function(r){ return r.json(); })
    .then(function(res){ handleNativeGoogleResult(res, statusId, ctx); })
    .catch(function(err){ setStatusSafe(statusId, 'error', err && err.message ? err.message : 'Google 驗證失敗'); });
  };

  window.handleAppNativeLoginError = function(message, payload){
    const ctx = getPendingContext(payload);
    setStatusSafe(ctx.statusId || 'adminLoginStatus', 'error', message || 'App Google 登入取消或失敗');
  };

  function handleNativeGoogleResult(res, statusId, ctx){
    if (!res || !res.ok) {
      setStatusSafe(statusId, 'error', (res && (res.message || res.msg)) || 'Google 驗證失敗');
      return;
    }

    clearPendingContext();

    if (res.loginToken) localStorage.setItem('admin_login_token', String(res.loginToken));
    if (res.email) localStorage.setItem('verified_email', String(res.email));
    if (res.companyCode) localStorage.setItem('company_code', String(res.companyCode));

    setStatusSafe(statusId, 'success', 'Google 驗證成功');

    const nextUrl = res.nextUrl || res.redirectUrl || res.url || '';
    if (nextUrl) {
      window.location.href = nextUrl;
      return;
    }

    const mode = res.mode || (ctx && ctx.mode) || '';
    if (mode === 'plan_signup') {
      window.location.href = buildFallbackUrl('register', {
        verify:'google',
        plan:res.plan || (ctx && ctx.plan) || '',
        free_days:res.freeDays || res.free_days || (ctx && (ctx.freeDays || ctx.free_days)) || '30',
        billing_status:'first_period_free',
        email:res.email || (ctx && ctx.email) || '',
        google_sub:res.googleSub || res.sub || ''
      });
      return;
    }

    window.location.href = buildFallbackUrl('login', {
      role:'admin',
      verify:'google',
      company:res.companyCode || (ctx && ctx.companyCode) || '',
      token:res.loginToken || ''
    });
  }
})();
