(function () {
  'use strict';

  var ANG_NATIVE_BRIDGE_VERSION = '2026-06-18-register-flow-authcode-payment';
  if (window.__ANG_NATIVE_BRIDGE_VERSION === ANG_NATIVE_BRIDGE_VERSION) return;
  window.__ANG_NATIVE_BRIDGE_VERSION = ANG_NATIVE_BRIDGE_VERSION;

  var DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec';

  function log() {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ANG Native Bridge]');
      console.log.apply(console, args);
    } catch (e) {}
  }

  function warn() {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ANG Native Bridge]');
      console.warn.apply(console, args);
    } catch (e) {}
  }

  function safeJsonParse(value, fallback) {
    try {
      if (value === null || value === undefined || value === '') return fallback || {};
      if (typeof value === 'object') return value;
      return JSON.parse(String(value));
    } catch (e) {
      return fallback || {};
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {}
  }

  function safeGetStorage(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      if (v === null || v === undefined || v === '') return fallback || '';
      return v;
    } catch (e) {
      return fallback || '';
    }
  }

  function safeSessionSet(key, value) {
    try {
      sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {}
  }


  function safeRemoveLocal(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function safeRemoveSession(key) {
    try { sessionStorage.removeItem(key); } catch (e) {}
  }

  function clearVerificationState(options) {
    options = options || {};

    var keys = [
      'ang_pending_auth',
      'pending_auth',
      'entry_pending_auth',
      'ang_last_native_auth_result',
      'ang_last_native_gas_result',
      'ang_last_gas_payload',
      'ang_last_gas_response',
      'ang_last_auth_raw',
      'ang_auth_state',
      'ang_auth_failed',
      'ang_auth_passed',
      'ang_verify_token',
      'ang_last_verify_token',
      'ang_verified_email',
      'ang_verified_name',
      'ang_verified_plan',
      'ang_verified_provider',
      'ang_gas_verify_status',
      'ang_last_native_auth_provider',
      'ang_native_login_lock_key',
      'ang_native_login_lock_at'
    ];

    keys.forEach(function (key) {
      safeRemoveLocal(key);
      safeRemoveSession(key);
    });

    try { window.__ANG_LAST_NATIVE_AUTH_RESULT = null; } catch (e1) {}
    try { window.__ANG_LAST_GAS_PAYLOAD = null; } catch (e2) {}
    try { window.__ANG_LAST_GAS_RESPONSE = null; } catch (e3) {}
    try { window.__ANG_AUTH_STATE = null; } catch (e4) {}

    if (options.closeOverlay !== false) {
      var overlay = document.getElementById('angRegisterOverlay');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    var debugPanel = document.getElementById('nativeDebugPanel');
    if (debugPanel && debugPanel.parentNode) debugPanel.parentNode.removeChild(debugPanel);
  }

  function restartEntryClean(reason) {
    clearVerificationState({ closeOverlay: true });

    try {
      if (typeof window.setStatus === 'function') {
        window.setStatus('adminLoginStatus', '', '');
        window.setStatus('basicPlanStatus', '', '');
        window.setStatus('plusPlanStatus', '', '');
        window.setStatus('premiumPlanStatus', '', '');
      }
    } catch (e) {}

    var base = window.location.origin + window.location.pathname;
    var url = base + '?auth_reset=1&r=' + encodeURIComponent(reason || 'reset') + '&t=' + Date.now();
    window.location.replace(url);
  }

  function cancelAndRestartAuthFlow(reason, gas) {
    var statusId = resolveStatusId(gas || {});
    setStatusSafe(statusId, 'info', '已取消填寫，正在清除驗證暫存並重新整理。');
    setTimeout(function () {
      restartEntryClean(reason || 'cancel_register');
    }, 180);
  }

  window.ANG_CLEAR_NATIVE_VERIFY_STATE = function () {
    clearVerificationState({ closeOverlay: true });
  };

  window.ANG_RESTART_AUTH_FLOW = function (reason) {
    restartEntryClean(reason || 'manual_reset');
  };

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function getGasUrl() {
    try {
      if (window.ANG_DATA_URLS && window.ANG_DATA_URLS.gasApiUrl) return String(window.ANG_DATA_URLS.gasApiUrl);
      if (window.ANG_CONFIG && window.ANG_CONFIG.gasApiUrl) return String(window.ANG_CONFIG.gasApiUrl);
      if (window.CONFIG && window.CONFIG.gasApiUrl) return String(window.CONFIG.gasApiUrl);
      if (window.APP_CONFIG && window.APP_CONFIG.gasApiUrl) return String(window.APP_CONFIG.gasApiUrl);
      if (window.GAS_API_URL) return String(window.GAS_API_URL);
    } catch (e) {}
    return DEFAULT_GAS_URL;
  }

  function getDeviceId() {
    var saved = safeGetStorage('ang_hr_device_id', '') || safeGetStorage('ang_device_id', '') || safeGetStorage('device_id', '');
    if (saved) return saved;
    var id = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    safeSetStorage('ang_hr_device_id', id);
    safeSetStorage('ang_device_id', id);
    return id;
  }

  function utf8ToBase64(text) {
    text = String(text || '');
    try {
      if (window.TextEncoder) {
        var bytes = new TextEncoder().encode(text);
        var binary = '';
        for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
      return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      return btoa(text);
    }
  }

  window.encodeUtf8Base64Text = window.encodeUtf8Base64Text || utf8ToBase64;

  function decodeJwtPayload(token) {
    try {
      token = String(token || '');
      var parts = token.split('.');
      if (parts.length < 2) return {};
      var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      var json = decodeURIComponent(Array.prototype.map.call(atob(payload), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return safeJsonParse(json, {});
    } catch (e) {
      return {};
    }
  }

  function getToken(raw) {
    raw = raw || {};
    return String(raw.id_token || raw.credential || raw.loginToken || raw.token || raw.google_id_token || raw.line_id_token || '').trim();
  }

  function normalizeProvider(raw) {
    raw = raw || {};
    var p = String(raw.provider || raw.method || raw.auth_provider || raw.type || '').toLowerCase();
    if (p) return p;
    if (raw.line_user_id || raw.line_sub || raw.user_id) return 'line';
    if (raw.google_user_id || raw.google_sub || raw.credential || raw.id_token || raw.loginToken || raw.token) return 'google';
    return 'google';
  }

  function getPendingAuth() {
    return safeJsonParse(
      safeGetStorage('ang_pending_auth', '') || safeGetStorage('pending_auth', '') || safeGetStorage('entry_pending_auth', ''),
      {}
    );
  }

  function resolveStatusId(raw) {
    raw = raw || {};
    var pending = raw.pending_auth || getPendingAuth() || {};
    if (raw.statusId) return raw.statusId;
    if (pending.statusId) return pending.statusId;
    if (pending.flow === 'admin_login') return 'adminLoginStatus';
    if (pending.plan) return String(pending.plan).toLowerCase() + 'PlanStatus';
    if (raw.flow === 'admin_login') return 'adminLoginStatus';
    if (raw.plan) return String(raw.plan).toLowerCase() + 'PlanStatus';
    return 'adminLoginStatus';
  }

  function setStatusSafe(statusId, type, message) {
    try {
      if (typeof window.setStatus === 'function') {
        window.setStatus(statusId, type, message);
        return;
      }
      var box = document.getElementById(statusId);
      if (!box) return;
      box.className = 'status show ' + (type || 'info');
      box.innerText = message || '';
    } catch (e) {}
  }

  function closeDebugPanel() {
    try {
      var panel = document.getElementById('nativeDebugPanel');
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    } catch (e) {}
  }

  function normalizeNativeInput(raw) {
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = { id_token: raw, credential: raw, token: raw, provider: 'google' };
      }
    }
    raw = raw || {};
    var token = getToken(raw);
    var jwt = raw.jwt_payload || decodeJwtPayload(token);
    var provider = normalizeProvider(raw);
    var normalized = {};
    Object.keys(raw).forEach(function (key) { normalized[key] = raw[key]; });
    normalized.ok = raw.ok !== false;
    normalized.provider = provider;
    if (token) {
      normalized.id_token = token;
      normalized.credential = token;
      normalized.loginToken = token;
      normalized.token = token;
    }
    normalized.email = raw.email || jwt.email || '';
    normalized.profile_name = raw.profile_name || raw.displayName || raw.name || jwt.name || '';
    normalized.name = normalized.profile_name;
    normalized.google_user_id = raw.google_user_id || raw.google_sub || (provider === 'google' ? jwt.sub || '' : '');
    normalized.line_user_id = raw.line_user_id || raw.user_id || raw.line_sub || (provider === 'line' ? jwt.sub || '' : '');
    normalized.jwt_payload = jwt || {};
    return normalized;
  }

  function buildGasPayload(raw) {
    raw = normalizeNativeInput(raw || {});
    var pending = raw.pending_auth || getPendingAuth() || {};
    var provider = normalizeProvider(raw);
    var token = getToken(raw);
    var jwt = raw.jwt_payload || decodeJwtPayload(token);
    var payload = {};
    Object.keys(raw).forEach(function (k) {
      if (k === 'gas_response' || k === 'gasResponse') return;
      payload[k] = raw[k];
    });
    payload.provider = provider;
    payload.action = provider === 'line' ? 'verifyNativeLineIdToken' : 'verifyNativeGoogleIdToken';
    if (token) {
      payload.id_token = token;
      payload.credential = token;
      payload.loginToken = token;
      payload.token = token;
    }
    payload.email = raw.email || jwt.email || '';
    payload.profile_name = raw.profile_name || jwt.name || raw.name || '';
    payload.google_user_id = raw.google_user_id || raw.google_sub || (provider === 'google' ? jwt.sub || '' : '');
    payload.line_user_id = raw.line_user_id || raw.line_sub || raw.user_id || (provider === 'line' ? jwt.sub || '' : '');
    payload.flow = raw.flow || pending.flow || 'company_signup';
    payload.plan = raw.plan || pending.plan || '';
    payload.statusId = raw.statusId || pending.statusId || resolveStatusId(raw);
    payload.company_id = raw.company_id || pending.company_id || pending.company || '';
    payload.company = payload.company_id;
    payload.device_id = raw.device_id || getDeviceId();
    payload.user_agent = navigator.userAgent || '';
    payload.source = 'frontend_native_bridge_register_flow';
    payload.bridge_version = ANG_NATIVE_BRIDGE_VERSION;
    return payload;
  }

  function callGasApi(action, payload, timeoutMs) {
    var gasUrl = getGasUrl();
    if (!gasUrl) return Promise.reject(new Error('尚未設定 GAS API URL'));
    return new Promise(function (resolve, reject) {
      var callbackName = 'angGasJsonp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var done = false;
      function cleanup() {
        try { delete window[callbackName]; } catch (err) { window[callbackName] = undefined; }
        try { if (script && script.parentNode) script.parentNode.removeChild(script); } catch (e) {}
      }
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error('GAS 連線逾時'));
      }, timeoutMs || 25000);
      window[callbackName] = function (res) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        resolve(res || {});
      };
      script.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error('無法連線 GAS API'));
      };
      var url = new URL(gasUrl, window.location.href);
      var body = Object.assign({}, payload || {}, { action: action });
      url.searchParams.set('action', action);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('payload', JSON.stringify(body));
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function verifyByAndroidNative(payload) {
    payload = payload || {};
    var b64 = utf8ToBase64(JSON.stringify(payload));
    var bridges = [window.ANGHRApp, window.AndroidBridge, window.AndroidNative, window.WebAppInterface];
    for (var i = 0; i < bridges.length; i++) {
      var bridge = bridges[i];
      if (bridge && typeof bridge.verifyNativeAuthWithGas === 'function') {
        bridge.verifyNativeAuthWithGas(b64);
        return true;
      }
    }
    return false;
  }

  function saveVerifyAuth(gas) {
    gas = gas || {};
    safeSetStorage('ang_last_gas_response', gas);
    safeSetStorage('ang_verify_token', gas.verify_token || '');
    safeSetStorage('ang_last_verify_token', gas.verify_token || '');
    safeSetStorage('ang_verified_email', gas.email || '');
    safeSetStorage('ang_verified_name', gas.profile_name || gas.name || '');
    safeSetStorage('ang_verified_plan', gas.plan || '');
    safeSetStorage('ang_verified_provider', gas.provider || gas.method || '');
    safeSessionSet('ang_verify_token', gas.verify_token || '');
    safeSessionSet('ang_verified_email', gas.email || '');
  }

  function getVerifiedDataFromGasResult(result) {
    result = result || {};
    var gas = result.gas_response || result.gasResponse || result;
    if (gas && gas.gas_response) gas = gas.gas_response;
    if (gas && gas.gasResponse) gas = gas.gasResponse;
    return gas || {};
  }

  function isCompanySignupGas(gas) {
    gas = gas || {};
    var flow = String(gas.flow || '').toLowerCase();
    return !!gas.verify_token && (flow === 'company_signup' || !!gas.plan || !flow);
  }

  function injectRegisterStyle() {
    if (document.getElementById('angRegisterOverlayStyle')) return;
    var style = document.createElement('style');
    style.id = 'angRegisterOverlayStyle';
    style.textContent = [
      '.ang-register-overlay{position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.76);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);display:flex;align-items:flex-end;justify-content:center;padding:16px;box-sizing:border-box;color:#fff;font-family:"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;}',
      '.ang-register-card{width:min(100%,430px);max-height:92vh;overflow:auto;border-radius:28px;background:linear-gradient(180deg,rgba(15,23,42,.98),rgba(15,23,42,.94));border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 70px rgba(0,0,0,.48);padding:20px;box-sizing:border-box;}',
      '.ang-register-title{font-size:24px;line-height:1.2;font-weight:1000;margin:0 0 8px;letter-spacing:.02em;}',
      '.ang-register-sub{font-size:13px;line-height:1.55;color:#cbd5e1;font-weight:800;margin:0 0 14px;}',
      '.ang-register-badge-row{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;}',
      '.ang-register-badge{border-radius:999px;padding:7px 10px;background:rgba(89,221,255,.13);border:1px solid rgba(89,221,255,.22);font-size:12px;font-weight:1000;color:#e0f2fe;}',
      '.ang-register-field{margin:12px 0;}',
      '.ang-register-label{font-size:13px;font-weight:1000;color:#e5e7eb;margin-bottom:7px;}',
      '.ang-register-input{width:100%;min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;padding:12px 14px;box-sizing:border-box;font-size:16px;font-weight:900;outline:none;}',
      '.ang-register-input::placeholder{color:rgba(226,232,240,.55);font-weight:800;}',
      '.ang-register-select{width:100%;min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;padding:12px 14px;box-sizing:border-box;font-size:16px;font-weight:900;outline:none;}',
      '.ang-register-select option{color:#0f172a;background:#fff;}',
      '.ang-register-section-title{margin:18px 0 8px;font-size:15px;line-height:1.25;font-weight:1000;color:#e0f2fe;letter-spacing:.02em;}',
      '.ang-register-note-box{margin:12px 0;padding:12px;border-radius:18px;background:rgba(59,130,246,.14);border:1px solid rgba(59,130,246,.26);color:#bfdbfe;font-size:13px;line-height:1.58;font-weight:900;}',
      '.ang-register-warning-box{margin:12px 0;padding:12px;border-radius:18px;background:rgba(250,204,21,.12);border:1px solid rgba(250,204,21,.24);color:#fde68a;font-size:13px;line-height:1.58;font-weight:900;}',
      '.ang-register-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.ang-register-actions{display:grid;gap:10px;margin-top:16px;}',
      '.ang-register-btn{min-height:54px;border:0;border-radius:18px;padding:13px 16px;font-size:16px;font-weight:1000;cursor:pointer;letter-spacing:.03em;}',
      '.ang-register-btn.primary{background:linear-gradient(90deg,#00d9ff 0%,#7c3cff 58%,#b000ff 100%);color:#fff;box-shadow:0 10px 28px rgba(124,60,255,.28);}',
      '.ang-register-btn.secondary{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.16);}',
      '.ang-register-status{display:none;margin-top:12px;border-radius:16px;padding:11px 12px;font-size:13px;line-height:1.45;font-weight:900;}',
      '.ang-register-status.show{display:block;}',
      '.ang-register-status.info{background:rgba(59,130,246,.18);color:#bfdbfe;border:1px solid rgba(59,130,246,.25);}',
      '.ang-register-status.success{background:rgba(16,185,129,.18);color:#a7f3d0;border:1px solid rgba(16,185,129,.25);}',
      '.ang-register-status.error{background:rgba(239,68,68,.18);color:#fecaca;border:1px solid rgba(239,68,68,.25);}',
      '.ang-register-result{margin-top:14px;padding:14px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:14px;line-height:1.65;font-weight:900;color:#e5e7eb;}',
      '@media (max-width:430px){.ang-register-overlay{padding:10px;align-items:flex-end}.ang-register-card{border-radius:26px 26px 0 0;padding:18px}.ang-register-grid{grid-template-columns:1fr}.ang-register-title{font-size:22px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function setRegisterStatus(type, message) {
    var box = document.getElementById('angRegisterStatus');
    if (!box) return;
    box.className = 'ang-register-status show ' + (type || 'info');
    box.textContent = message || '';
  }

  function setRegisterResult(html) {
    var box = document.getElementById('angRegisterResult');
    if (!box) return;
    box.innerHTML = html || '';
    box.style.display = html ? 'block' : 'none';
  }

  function normalizePlan(plan) {
    plan = String(plan || '').toLowerCase().trim();
    if (plan === 'plus' || plan === 'premium' || plan === 'basic') return plan;
    return 'basic';
  }

  function planLabel(plan) {
    plan = normalizePlan(plan);
    if (plan === 'premium') return 'Premium 完整方案';
    if (plan === 'plus') return 'Plus 推薦方案';
    return 'Basic 實施方案';
  }

  function planMonthlyPrice(plan) {
    plan = normalizePlan(plan);
    if (plan === 'premium') return 699;
    if (plan === 'plus') return 399;
    return 199;
  }


  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function toDateOnly(value) {
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (value) {
      var parsed = new Date(String(value));
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  function addDays(date, days) {
    var d = new Date(toDateOnly(date).getTime());
    d.setDate(d.getDate() + Number(days || 0));
    return d;
  }

  function isoDateOnly(value) {
    var d = toDateOnly(value);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function displayDate(value) {
    var d = toDateOnly(value);
    return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
  }

  function getDefaultTrialInfo(source) {
    source = source || {};
    var days = Number(source.trial_days || source.free_trial_days || source.first_month_free_days || 30);
    if (!isFinite(days) || days <= 0) days = 30;
    var start = toDateOnly(source.trial_started_at || source.trial_start_at || source.trial_start_date || new Date());
    var end = toDateOnly(source.trial_ends_at || source.trial_end_at || source.trial_end_date || addDays(start, days));
    var billingStart = toDateOnly(source.billing_starts_at || source.billing_start_at || source.next_billing_at || addDays(end, 1));
    return {
      trial_days: days,
      trial_started_at: isoDateOnly(start),
      trial_ends_at: isoDateOnly(end),
      billing_starts_at: isoDateOnly(billingStart),
      trial_started_display: displayDate(start),
      trial_ends_display: displayDate(end),
      billing_starts_display: displayDate(billingStart)
    };
  }

  function paymentMethodLabel(value) {
    value = String(value || '').trim();
    if (value === 'test_mode') return '測試授權（不扣款）';
    if (value === 'google_play') return 'Google Play / 信用卡付款（正式串接）';
    if (value === 'credit_card') return '信用卡付款（正式串接）';
    if (value === 'authorization_code') return 'ANG 授權碼';
    if (value === 'privilege_code') return '免付費特權碼';
    if (value === 'later') return '試用期後再設定';
    return value || '未設定';
  }

  function showCompanyRegisterForm(gas) {
    gas = gas || {};
    closeDebugPanel();
    injectRegisterStyle();
    saveVerifyAuth(gas);

    var existing = document.getElementById('angRegisterOverlay');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var plan = normalizePlan(gas.plan || safeGetStorage('ang_verified_plan', 'premium'));
    var email = gas.email || safeGetStorage('ang_verified_email', '');
    var name = gas.profile_name || gas.name || safeGetStorage('ang_verified_name', '');
    var provider = gas.provider || gas.method || safeGetStorage('ang_verified_provider', 'google');
    var trial = getDefaultTrialInfo(gas);

    var overlay = document.createElement('div');
    overlay.id = 'angRegisterOverlay';
    overlay.className = 'ang-register-overlay';
    overlay.innerHTML =
      '<div class="ang-register-card">' +
        '<h2 class="ang-register-title">建立公司資料</h2>' +
        '<p class="ang-register-sub">驗證已完成，請補齊公司與負責人資料。送出後會建立公司帳號與 Creator 管理者。</p>' +
        '<div class="ang-register-badge-row">' +
          '<span class="ang-register-badge">' + escapeHtml(planLabel(plan)) + '</span>' +
          '<span class="ang-register-badge">' + escapeHtml(provider === 'line' ? 'LINE 已驗證' : 'Google 已驗證') + '</span>' +
          '<span class="ang-register-badge">' + escapeHtml(email || '已取得驗證身分') + '</span>' +
        '</div>' +
        '<div class="ang-register-field"><div class="ang-register-label">公司名稱 *</div><input id="angRegCompanyName" class="ang-register-input" type="text" autocomplete="organization" placeholder="例如：矽品精密" /></div>' +
        '<div class="ang-register-field"><div class="ang-register-label">負責人 / 申請人姓名 *</div><input id="angRegAdminName" class="ang-register-input" type="text" autocomplete="name" placeholder="姓名" value="' + escapeHtml(name) + '" /></div>' +
        '<div class="ang-register-grid">' +
          '<div class="ang-register-field"><div class="ang-register-label">電話 *</div><input id="angRegPhone" class="ang-register-input" type="tel" inputmode="tel" autocomplete="tel" placeholder="09xxxxxxxx" /></div>' +
          '<div class="ang-register-field"><div class="ang-register-label">出生年月日 *</div><input id="angRegBirthDate" class="ang-register-input" type="date" /></div>' +
        '</div>' +
        '<div class="ang-register-grid">' +
          '<div class="ang-register-field"><div class="ang-register-label">統一編號</div><input id="angRegTaxId" class="ang-register-input" type="text" inputmode="numeric" placeholder="可空白" /></div>' +
          '<div class="ang-register-field"><div class="ang-register-label">付款 / 授權方式 *</div><select id="angRegPaymentMethod" class="ang-register-select"><option value="test_mode" selected>測試授權（不扣款）</option><option value="google_play">Google Play / 信用卡付款</option><option value="credit_card">信用卡付款</option><option value="authorization_code">我有 ANG 授權碼</option><option value="privilege_code">我有免付費特權碼</option><option value="later">試用期後再設定</option></select></div>' +
        '</div>' +
        '<div class="ang-register-field"><div class="ang-register-label">ANG 授權碼 / 特權碼</div><input id="angRegAuthorizationCode" class="ang-register-input" type="text" placeholder="例如 ANG8963-A、TEST-PREMIUM-30，可空白" /><div style="font-size:12px;color:#cbd5e1;line-height:1.55;font-weight:800;margin-top:6px;">Google 用來確認身份；Google Play / 信用卡用來付款；ANG 授權碼用來開通方案、加購包、測試或免付費特權。</div></div>' +
        '<div class="ang-register-field"><div class="ang-register-label">公司地址</div><input id="angRegAddress" class="ang-register-input" type="text" autocomplete="street-address" placeholder="可空白" /></div>' +
        '<div class="ang-register-section-title">付款、授權與試用資訊</div>' +
        '<div class="ang-register-warning-box">目前測試版不會真的扣款。正式上線後可走 Google Play / 信用卡付款；測試、人工開通與免付費特權先用 ANG 授權碼處理。</div>' +
        '<div class="ang-register-grid">' +
          '<div class="ang-register-field"><div class="ang-register-label">付款聯絡 Email</div><input id="angRegBillingEmail" class="ang-register-input" type="email" inputmode="email" autocomplete="email" placeholder="付款通知 Email" value="' + escapeHtml(email) + '" /></div>' +
        '<div class="ang-register-grid">' +
          '<div class="ang-register-field"><div class="ang-register-label">發票 / 收據抬頭</div><input id="angRegInvoiceTitle" class="ang-register-input" type="text" placeholder="預設同公司名稱，可空白" /></div>' +
          '<div class="ang-register-field"><div class="ang-register-label">付款聯絡人</div><input id="angRegBillingName" class="ang-register-input" type="text" placeholder="預設同申請人，可空白" value="' + escapeHtml(name) + '" /></div>' +
        '</div>' +
        '<div class="ang-register-note-box">首月免費試用：' + escapeHtml(trial.trial_started_display) + ' ～ ' + escapeHtml(trial.trial_ends_display) + '<br>預計開始收費日：' + escapeHtml(trial.billing_starts_display) + '<br>試用後月費 = 方案月費 + 啟用中的加購包月費。取消加購或降級時，啟用中員工數必須小於或等於目標名額。</div>' +
        '<div class="ang-register-actions">' +
          '<button id="angRegSubmitBtn" type="button" class="ang-register-btn primary">建立公司並進入後台</button>' +
          '<button id="angRegCloseBtn" type="button" class="ang-register-btn secondary">先不要填寫／換其他驗證方式</button>' +
        '</div>' +
        '<div id="angRegisterStatus" class="ang-register-status"></div>' +
        '<div id="angRegisterResult" class="ang-register-result" style="display:none;"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    var submitBtn = document.getElementById('angRegSubmitBtn');
    var closeBtn = document.getElementById('angRegCloseBtn');
    if (submitBtn) submitBtn.addEventListener('click', function () { submitCompanyRegister(gas); });
    if (closeBtn) closeBtn.addEventListener('click', function () {
      cancelAndRestartAuthFlow('cancel_register_form', gas);
    });

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        setRegisterStatus('info', '要換 Email / Google / LINE 驗證，請按「先不要填寫／換其他驗證方式」。');
      }
    });

    setRegisterStatus('success', '驗證成功，請填寫公司資料與付款 / 授權方式。測試授權不會扣款。');
    setTimeout(function () {
      var input = document.getElementById('angRegCompanyName');
      if (input) input.focus();
    }, 150);
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return String(el ? el.value || '' : '').trim();
  }

  function submitCompanyRegister(gas) {
    gas = gas || safeJsonParse(safeGetStorage('ang_last_gas_response', ''), {});
    var verifyToken = gas.verify_token || safeGetStorage('ang_verify_token', '') || safeGetStorage('ang_last_verify_token', '');
    var plan = normalizePlan(gas.plan || safeGetStorage('ang_verified_plan', 'premium'));
    var companyName = fieldValue('angRegCompanyName');
    var adminName = fieldValue('angRegAdminName');
    var phone = fieldValue('angRegPhone');
    var birthDate = fieldValue('angRegBirthDate');
    var taxId = fieldValue('angRegTaxId');
    var address = fieldValue('angRegAddress');
    var authorizationCode = fieldValue('angRegAuthorizationCode').toUpperCase().replace(/\s+/g, '');
    var privilegeId = authorizationCode;
    var paymentMethod = fieldValue('angRegPaymentMethod') || 'test_mode';
    var billingEmail = fieldValue('angRegBillingEmail') || (gas.email || safeGetStorage('ang_verified_email', ''));
    var billingName = fieldValue('angRegBillingName') || adminName;
    var invoiceTitle = fieldValue('angRegInvoiceTitle') || companyName;
    var trial = getDefaultTrialInfo(gas);

    if (!verifyToken) { setRegisterStatus('error', '缺少 verify_token，請重新 Google 驗證。'); return; }
    if (!companyName) { setRegisterStatus('error', '請輸入公司名稱。'); return; }
    if (!adminName) { setRegisterStatus('error', '請輸入負責人 / 申請人姓名。'); return; }
    if (!phone) { setRegisterStatus('error', '請輸入電話。'); return; }
    if (!birthDate) { setRegisterStatus('error', '請輸入出生年月日。'); return; }
    if (!paymentMethod) { setRegisterStatus('error', '請選擇付款方式。'); return; }

    var submitBtn = document.getElementById('angRegSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;
    setRegisterResult('');
    setRegisterStatus('info', '正在建立公司資料，請稍候...');

    var payload = {
      action: 'registerCompany',
      verify_token: verifyToken,
      verify_method: gas.provider || gas.method || 'google',
      plan: plan,
      company_name: companyName,
      admin_name: adminName,
      phone: phone,
      birth_date: birthDate,
      tax_id: taxId,
      address: address,
      privilege_id: privilegeId,
      authorization_code: authorizationCode,
      authorization_status: authorizationCode ? 'pending_verify' : 'none',
      payment_method: paymentMethod,
      payment_method_label: paymentMethodLabel(paymentMethod),
      payment_status: (paymentMethod === 'test_mode' ? 'test_authorization_not_charged' : (paymentMethod === 'authorization_code' || paymentMethod === 'privilege_code' ? 'authorization_code_pending' : 'first_month_free_pending_payment')),
      billing_status: 'first_month_free',
      billing_name: billingName,
      billing_email: billingEmail,
      invoice_title: invoiceTitle,
      trial_days: trial.trial_days,
      trial_started_at: trial.trial_started_at,
      trial_ends_at: trial.trial_ends_at,
      billing_starts_at: trial.billing_starts_at,
      charge_starts_at: trial.billing_starts_at,
      email: gas.email || safeGetStorage('ang_verified_email', ''),
      device_id: getDeviceId(),
      source: 'frontend_register_overlay'
    };

    safeSetStorage('ang_register_payload', payload);

    callGasApi('registerCompany', payload, 30000).then(function (res) {
      if (!res || !res.ok) {
        if (submitBtn) submitBtn.disabled = false;
        setRegisterStatus('error', (res && (res.message || res.msg)) || '建立公司失敗');
        return;
      }
      handleCompanyRegisterSuccess(Object.assign({}, payload, res));
    }).catch(function (err) {
      if (submitBtn) submitBtn.disabled = false;
      setRegisterStatus('error', err && err.message ? err.message : '建立公司連線失敗');
    });
  }

  function buildAdminUrl(companyId, employeeId) {
    var base = new URL('admin.html', window.location.href);
    if (companyId) base.searchParams.set('company_id', companyId);
    if (employeeId) base.searchParams.set('id', employeeId);
    base.searchParams.set('source', 'company_register_success');
    return base.toString();
  }

  function handleCompanyRegisterSuccess(res) {
    var companyId = String(res.company_id || '').trim().toUpperCase();
    var employeeId = String(res.employee_id || '').trim().toUpperCase();
    var password = String(res.password || '').trim();
    var companyName = String(res.company_name || '').trim();
    var plan = normalizePlan(res.plan || '');
    var trial = getDefaultTrialInfo(res);
    var paymentMethod = res.payment_method || '';
    var paymentLabel = res.payment_method_label || paymentMethodLabel(paymentMethod);
    var paymentStatus = res.payment_status || (paymentMethod === 'test_mode' ? 'test_authorization_not_charged' : 'first_month_free_pending_payment');
    var authorizationCode = String(res.authorization_code || res.privilege_id || fieldValue('angRegAuthorizationCode') || '').trim().toUpperCase();
    var baseMonthlyPrice = Number(res.base_monthly_price || planMonthlyPrice(plan));
    var addonMonthlyTotal = Number(res.addon_monthly_total || 0);
    var monthlyTotal = Number(res.monthly_total || (baseMonthlyPrice + addonMonthlyTotal));
    var adminUrl = buildAdminUrl(companyId, employeeId);

    safeSetStorage('ang_company_id', companyId);
    safeSetStorage('ang_company_name', companyName);
    safeSetStorage('ang_plan', plan);
    safeSetStorage('ang_payment_method', paymentMethod);
    safeSetStorage('ang_payment_status', paymentStatus);
    safeSetStorage('ang_authorization_code', authorizationCode);
    safeSetStorage('ang_base_monthly_price', String(baseMonthlyPrice));
    safeSetStorage('ang_addon_monthly_total', String(addonMonthlyTotal));
    safeSetStorage('ang_monthly_total', String(monthlyTotal));
    safeSetStorage('ang_trial_started_at', trial.trial_started_at);
    safeSetStorage('ang_trial_ends_at', trial.trial_ends_at);
    safeSetStorage('ang_billing_starts_at', trial.billing_starts_at);
    safeSetStorage('ang_role', res.role || 'Creator');
    safeSetStorage('loginId', employeeId);
    safeSetStorage('emp_logged_in', employeeId);
    safeSetStorage('creator_password', password);
    safeSetStorage('isLoggedIn', 'true');

    setRegisterStatus('success', '公司建立完成。');
    setRegisterResult(
      '<div><strong>公司代碼：</strong>' + escapeHtml(companyId || '-') + '</div>' +
      '<div><strong>公司名稱：</strong>' + escapeHtml(companyName || '-') + '</div>' +
      '<div><strong>方案：</strong>' + escapeHtml(planLabel(plan)) + '</div>' +
      '<div><strong>基本月費：</strong>$' + escapeHtml(String(baseMonthlyPrice)) + ' / 月</div>' +
      '<div><strong>目前加購：</strong>' + escapeHtml(addonMonthlyTotal > 0 ? ('$' + addonMonthlyTotal + ' / 月') : '無') + '</div>' +
      '<div><strong>試用後預估月費：</strong>$' + escapeHtml(String(monthlyTotal)) + ' / 月</div>' +
      '<div><strong>付款 / 授權方式：</strong>' + escapeHtml(paymentLabel || '-') + '</div>' +
      (authorizationCode ? '<div><strong>授權碼：</strong>' + escapeHtml(authorizationCode) + '</div>' : '') +
      '<div><strong>付款狀態：</strong>' + escapeHtml(paymentStatus === 'test_authorization_not_charged' || paymentStatus === 'test_mode_not_charged' ? '測試授權，不會扣款' : (paymentStatus === 'authorization_code_pending' ? '授權碼待後端確認' : '首月免費，待正式付款')) + '</div>' +
      '<div><strong>免費試用：</strong>' + escapeHtml(trial.trial_started_display) + ' ～ ' + escapeHtml(trial.trial_ends_display) + '</div>' +
      '<div><strong>預計開始收費：</strong>' + escapeHtml(trial.billing_starts_display) + '</div>' +
      '<div><strong>管理者帳號：</strong>' + escapeHtml(employeeId || '-') + '</div>' +
      '<div><strong>初始密碼：</strong>' + escapeHtml(password || '-') + '</div>' +
      '<div style="margin-top:10px;color:#bfdbfe;">請先截圖或複製帳號密碼、試用到期與收費日期，再進入企業管理後台。正式付款可接 Google Play / 信用卡；測試與特權可用 ANG 授權碼。</div>' +
      '<div style="margin-top:8px;color:#cbd5e1;font-size:13px;line-height:1.6;">加購包會併入每月月租；取消或降級時，啟用中員工數必須小於或等於調整後名額，避免占用名額。</div>' +
      '<div style="display:grid;gap:10px;margin-top:12px;">' +
        '<button type="button" id="angCopyCompanyResultBtn" class="ang-register-btn secondary">複製公司登入資料</button>' +
        '<button type="button" id="angOpenAdminBtn" class="ang-register-btn primary">進入企業管理後台</button>' +
      '</div>'
    );

    var copyBtn = document.getElementById('angCopyCompanyResultBtn');
    var openBtn = document.getElementById('angOpenAdminBtn');
    var copyText = [
      'ANG HR 公司建立完成',
      '公司代碼：' + (companyId || '-'),
      '公司名稱：' + (companyName || '-'),
      '方案：' + planLabel(plan),
      '基本月費：$' + baseMonthlyPrice + ' / 月',
      '目前加購：' + (addonMonthlyTotal > 0 ? ('$' + addonMonthlyTotal + ' / 月') : '無'),
      '試用後預估月費：$' + monthlyTotal + ' / 月',
      '付款 / 授權方式：' + (paymentLabel || '-'),
      '授權碼：' + (authorizationCode || '-'),
      '付款狀態：' + (paymentStatus === 'test_authorization_not_charged' || paymentStatus === 'test_mode_not_charged' ? '測試授權，不會扣款' : (paymentStatus === 'authorization_code_pending' ? '授權碼待後端確認' : '首月免費，待正式付款')),
      '免費試用：' + trial.trial_started_display + ' ～ ' + trial.trial_ends_display,
      '預計開始收費：' + trial.billing_starts_display,
      '管理者帳號：' + (employeeId || '-'),
      '初始密碼：' + (password || '-')
    ].join('\n');
    if (copyBtn) copyBtn.onclick = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(function () { setRegisterStatus('success', '已複製公司登入資料。'); });
      } else {
        window.prompt('複製以下內容', copyText);
      }
    };
    if (openBtn) openBtn.onclick = function () { window.location.href = adminUrl; };

    try { localStorage.removeItem('ang_pending_auth'); } catch (e) {}
  }

  function receiveGasResult(result) {
    result = result || {};
    safeSetStorage('ang_last_native_gas_result', result);
    window.__ANG_LAST_GAS_RESPONSE = result;
    closeDebugPanel();

    var gas = getVerifiedDataFromGasResult(result);
    if (gas && (gas.ok === true || gas.verify_token)) {
      saveVerifyAuth(gas);
      var statusId = resolveStatusId(gas);
      setStatusSafe(statusId, 'success', (gas.provider === 'line' ? 'LINE' : 'Google') + ' 驗證成功。');
      if (isCompanySignupGas(gas)) {
        showCompanyRegisterForm(gas);
      }
      log('GAS 驗證成功', gas);
      return gas;
    }

    var errMsg = (gas && (gas.message || gas.msg)) || 'GAS 驗證失敗';
    setStatusSafe(resolveStatusId(gas), 'error', errMsg);
    warn('GAS 驗證失敗', gas);
    return gas;
  }

  function verifyNativeAuthWithGas(raw) {
    raw = normalizeNativeInput(raw || {});
    safeSetStorage('ang_last_native_auth_result', raw);
    window.__ANG_LAST_NATIVE_AUTH_RESULT = raw;
    closeDebugPanel();

    var statusId = resolveStatusId(raw);
    if (!raw.ok) {
      setStatusSafe(statusId, 'error', raw.message || 'App 原生驗證失敗');
      return null;
    }

    if (raw.gas_response || raw.gasResponse) return receiveGasResult(raw);

    var token = getToken(raw);
    if (!token) {
      setStatusSafe(statusId, 'error', 'App 有回傳，但 token 是空的');
      return null;
    }

    var payload = buildGasPayload(raw);
    safeSetStorage('ang_last_gas_payload', payload);
    window.__ANG_LAST_GAS_PAYLOAD = payload;
    setStatusSafe(statusId, 'info', '已收到 App 原生 ' + (payload.provider === 'line' ? 'LINE' : 'Google') + ' 回傳，正在送 GAS 驗證...');
    log('準備 GAS 驗證', { provider: payload.provider, action: payload.action, email: payload.email, flow: payload.flow, plan: payload.plan });

    if (verifyByAndroidNative(payload)) {
      setTimeout(function () {
        var latest = safeJsonParse(safeGetStorage('ang_last_native_gas_result', ''), {});
        if (!latest || (!latest.gas_response && !latest.gasResponse && latest.ok !== true && !latest.verify_token)) {
          setStatusSafe(statusId, 'info', '仍在等待 GAS 回傳...');
        }
      }, 12000);
      return null;
    }

    callGasApi(payload.action, payload, 25000).then(function (res) {
      receiveGasResult({ ok: true, provider: payload.provider, action: payload.action, gas_response: res, source: 'frontend_jsonp_gas' });
    }).catch(function (err) {
      setStatusSafe(statusId, 'error', err && err.message ? err.message : 'GAS 驗證通訊失敗');
    });

    return null;
  }

  window.ANG_NATIVE_GAS_RESULT_RECEIVER = function (res) { return receiveGasResult(res || {}); };
  window.ANG_DEEP_LINK_AUTH_RECEIVER = function (auth, raw) { return receiveGasResult(raw || auth || {}); };
  window.ANG_NATIVE_LOGIN_RECEIVER = function (res) { return verifyNativeAuthWithGas(res || {}); };
  window.handleNativeAuthResult = function (res) { return verifyNativeAuthWithGas(res || {}); };
  window.handleNativeGoogleResult = function (payload) { payload = payload || {}; payload.provider = 'google'; return verifyNativeAuthWithGas(payload); };
  window.handleNativeLineResult = function (payload) { payload = payload || {}; payload.provider = 'line'; return verifyNativeAuthWithGas(payload); };
  window.onNativeGoogleLoginSuccess = function (idToken, email) {
    return window.handleNativeGoogleResult({ ok: true, provider: 'google', id_token: idToken, credential: idToken, token: idToken, email: email || '' });
  };
  window.onGoogleSignInSuccess = window.onNativeGoogleLoginSuccess;
  window.handleAppNativeGoogleLogin = window.onNativeGoogleLoginSuccess;
  window.onNativeLineLoginSuccess = function (idToken, userId, displayName) {
    return window.handleNativeLineResult({ ok: true, provider: 'line', id_token: idToken, credential: idToken, token: idToken, line_user_id: userId || '', profile_name: displayName || '' });
  };
  window.handleAppNativeLineLogin = window.onNativeLineLoginSuccess;
  window.onNativeGoogleLoginFailure = function (message) { setStatusSafe(resolveStatusId({}), 'error', message || 'Google 原生驗證失敗'); };
  window.onGoogleSignInError = window.onNativeGoogleLoginFailure;
  window.onNativeLineLoginFailure = function (message) { setStatusSafe(resolveStatusId({}), 'error', message || 'LINE 原生驗證失敗'); };
  window.handleAppNativeLogin = function (idToken) {
    return verifyNativeAuthWithGas({ provider: 'google', id_token: idToken, credential: idToken, token: idToken, source: 'handleAppNativeLogin' });
  };
  window.ANG_VERIFY_NATIVE_AUTH_WITH_GAS = verifyNativeAuthWithGas;

  window.addEventListener('ANG_HR_NATIVE_AUTH', function (event) { verifyNativeAuthWithGas((event && event.detail) || {}); });
  window.addEventListener('ANG_HR_DEEP_LINK_AUTH', function (event) {
    var detail = (event && event.detail) || {};
    receiveGasResult(detail.raw || detail.auth || detail || {});
  });

  setTimeout(function () {
    closeDebugPanel();
    try {
      var resetParams = new URLSearchParams(window.location.search || '');
      if (resetParams.get('auth_reset') === '1') {
        clearVerificationState({ closeOverlay: true });
        return;
      }
    } catch (e) {}
    var lastGas = safeJsonParse(safeGetStorage('ang_last_native_gas_result', ''), {});
    if (lastGas && (lastGas.gas_response || lastGas.gasResponse || lastGas.verify_token)) {
      receiveGasResult(lastGas);
      return;
    }
    var lastNative = safeJsonParse(safeGetStorage('ang_last_native_auth_result', ''), {});
    if (lastNative && (lastNative.credential || lastNative.id_token || lastNative.loginToken || lastNative.token)) {
      if (!lastNative.gas_response && !lastNative.gasResponse) verifyNativeAuthWithGas(lastNative);
    }
  }, 700);

  log('已載入', ANG_NATIVE_BRIDGE_VERSION);
})();
