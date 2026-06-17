(function () {
  'use strict';

  var ANG_NATIVE_BRIDGE_VERSION = '2026-06-18-native-gas-ui-wrapper';

  if (window.__ANG_NATIVE_BRIDGE_VERSION === ANG_NATIVE_BRIDGE_VERSION) {
    return;
  }

  var PREV_NATIVE_LOGIN_RECEIVER = window.ANG_NATIVE_LOGIN_RECEIVER;
  var PREV_NATIVE_GAS_RESULT_RECEIVER = window.ANG_NATIVE_GAS_RESULT_RECEIVER;
  var PREV_HANDLE_NATIVE_AUTH_RESULT = window.handleNativeAuthResult;
  var PREV_HANDLE_APP_NATIVE_LOGIN = window.handleAppNativeLogin;

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
    var saved =
      safeGetStorage('ang_hr_device_id', '') ||
      safeGetStorage('ang_device_id', '') ||
      safeGetStorage('device_id', '');

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

  function normalizeProvider(raw) {
    raw = raw || {};
    var p = String(raw.provider || raw.method || raw.auth_provider || raw.type || '').toLowerCase();
    if (p) return p;

    if (raw.line_user_id || raw.line_sub || raw.user_id) return 'line';
    if (raw.google_user_id || raw.google_sub || raw.credential || raw.id_token || raw.loginToken || raw.token) return 'google';

    return 'google';
  }

  function getToken(raw) {
    raw = raw || {};
    return String(
      raw.id_token ||
      raw.credential ||
      raw.loginToken ||
      raw.token ||
      raw.google_id_token ||
      raw.line_id_token ||
      ''
    ).trim();
  }

  function getPendingAuth() {
    return safeJsonParse(
      safeGetStorage('ang_pending_auth', '') ||
      safeGetStorage('pending_auth', '') ||
      safeGetStorage('entry_pending_auth', ''),
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

  function showNativePanelSafe(nativeRaw, gasResponse) {
    try {
      if (typeof window.showNativeCapturePanel === 'function') {
        window.showNativeCapturePanel(nativeRaw || window.__ANG_LAST_NATIVE_AUTH_RESULT || {}, gasResponse || null);
      }
    } catch (e) {}
  }

  function callPreviousNativeReceiver(raw) {
    try {
      if (
        typeof PREV_NATIVE_LOGIN_RECEIVER === 'function' &&
        PREV_NATIVE_LOGIN_RECEIVER !== window.ANG_NATIVE_LOGIN_RECEIVER
      ) {
        PREV_NATIVE_LOGIN_RECEIVER(raw);
      }
    } catch (e) {
      warn('原本 ANG_NATIVE_LOGIN_RECEIVER 執行失敗', e);
    }

    try {
      if (
        typeof PREV_HANDLE_NATIVE_AUTH_RESULT === 'function' &&
        PREV_HANDLE_NATIVE_AUTH_RESULT !== PREV_NATIVE_LOGIN_RECEIVER &&
        PREV_HANDLE_NATIVE_AUTH_RESULT !== window.handleNativeAuthResult
      ) {
        PREV_HANDLE_NATIVE_AUTH_RESULT(raw);
      }
    } catch (e2) {}
  }

  function callPreviousGasReceiver(result) {
    try {
      if (
        typeof PREV_NATIVE_GAS_RESULT_RECEIVER === 'function' &&
        PREV_NATIVE_GAS_RESULT_RECEIVER !== window.ANG_NATIVE_GAS_RESULT_RECEIVER
      ) {
        PREV_NATIVE_GAS_RESULT_RECEIVER(result);
      }
    } catch (e) {
      warn('原本 ANG_NATIVE_GAS_RESULT_RECEIVER 執行失敗', e);
    }
  }

  function normalizeNativeInput(raw) {
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = { id_token: raw, token: raw, credential: raw, provider: 'google' };
      }
    }

    raw = raw || {};

    var token = getToken(raw);
    var jwt = raw.jwt_payload || decodeJwtPayload(token);
    var provider = normalizeProvider(raw);

    var normalized = {};
    Object.keys(raw).forEach(function (key) {
      normalized[key] = raw[key];
    });

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
      if (k === 'gas_response') return;
      if (k === 'gasResponse') return;
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
    payload.source = 'frontend_native_google_bridge_auto_verify';
    payload.bridge_version = ANG_NATIVE_BRIDGE_VERSION;

    return payload;
  }

  function normalizeAuthFromGas(raw) {
    raw = raw || {};

    var gas = raw.gas_response || raw.gasResponse || raw.auth || raw.data || raw;
    if (gas && gas.gas_response) gas = gas.gas_response;
    if (gas && gas.gasResponse) gas = gas.gasResponse;

    var auth = {};
    Object.keys(gas || {}).forEach(function (k) {
      auth[k] = gas[k];
    });

    auth.ok = auth.ok === true || auth.success === true || auth.status === 'verified' || auth.status === 'success' || !!auth.verify_token;
    auth.auth_passed =
      auth.auth_passed === true ||
      auth.verified === true ||
      auth.status === 'verified' ||
      auth.ok === true ||
      !!auth.verify_token;

    auth.provider = auth.provider || raw.provider || '';
    auth.email = auth.email || raw.email || '';
    auth.profile_name = auth.profile_name || auth.name || raw.profile_name || raw.name || '';
    auth.name = auth.name || auth.profile_name || '';
    auth.company_id = auth.company_id || auth.company || '';
    auth.employee_id = auth.employee_id || auth.emp_id || auth.id || '';
    auth.role = auth.role || '';

    return auth;
  }

  function saveAuthState(auth, raw) {
    auth = auth || {};
    raw = raw || {};

    safeSetStorage('ang_last_gas_response', raw);
    safeSetStorage('ang_last_auth_raw', raw);

    if (auth.ok !== true && auth.auth_passed !== true) {
      safeSetStorage('ang_auth_failed', auth);
      return false;
    }

    safeSetStorage('ang_auth_state', auth);
    safeSetStorage('isLoggedIn', 'true');
    safeSetStorage('ang_auth_passed', '1');

    if (auth.verify_token) {
      safeSetStorage('ang_verify_token', String(auth.verify_token));
      safeSetStorage('ang_last_verify_token', String(auth.verify_token));
      try {
        sessionStorage.setItem('ang_verify_token', String(auth.verify_token));
      } catch (e) {}
    }

    if (auth.provider) safeSetStorage('ang_auth_provider', auth.provider);
    if (auth.email) {
      safeSetStorage('loginEmail', auth.email);
      try {
        sessionStorage.setItem('ang_verified_email', String(auth.email));
      } catch (e2) {}
    }
    if (auth.company_id) safeSetStorage('ang_company_id', auth.company_id);
    if (auth.role) safeSetStorage('ang_role', auth.role);

    if (auth.employee_id) {
      safeSetStorage('emp_logged_in', String(auth.employee_id).toUpperCase());
      safeSetStorage('loginId', String(auth.employee_id).toUpperCase());
    }

    if (auth.name || auth.profile_name) {
      safeSetStorage('emp_name', auth.name || auth.profile_name);
    }

    return true;
  }

  function dispatchAuthEvent(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (e) {}
  }

  function notifyUiGasResult(result) {
    result = result || {};

    var pending = getPendingAuth() || {};
    var statusId = resolveStatusId(result);
    var gas = result.gas_response || result.gasResponse || result;

    showNativePanelSafe(window.__ANG_LAST_NATIVE_AUTH_RESULT || {}, gas);

    try {
      if (typeof window.handleGasVerifySuccess === 'function') {
        window.handleGasVerifySuccess(statusId, gas);
        return;
      }
    } catch (e) {}

    if (gas && (gas.ok === true || gas.verify_token)) {
      setStatusSafe(statusId, 'success', 'GAS 驗證成功，可以繼續下一步。');
      try {
        localStorage.removeItem('ang_pending_auth');
      } catch (e2) {}
      return;
    }

    setStatusSafe(statusId, 'error', (gas && (gas.message || gas.msg)) || 'GAS 驗證失敗');
  }

  function receiveGasResult(result) {
    result = result || {};

    safeSetStorage('ang_last_native_gas_result', result);
    window.__ANG_LAST_GAS_RESPONSE = result;

    callPreviousGasReceiver(result);

    var auth = normalizeAuthFromGas(result);
    var saved = saveAuthState(auth, result);

    window.__ANG_AUTH_STATE = auth;

    notifyUiGasResult(result);

    if (saved) {
      dispatchAuthEvent('ANG_HR_AUTH_PASSED', auth);
      log('GAS 驗證成功', auth);
    } else {
      dispatchAuthEvent('ANG_HR_AUTH_FAILED', auth);
      warn('GAS 驗證未通過', auth);
    }

    return auth;
  }

  function verifyByAndroidNative(payload) {
    payload = payload || {};

    var text = JSON.stringify(payload);
    var b64 = utf8ToBase64(text);

    if (window.ANGHRApp && typeof window.ANGHRApp.verifyNativeAuthWithGas === 'function') {
      window.ANGHRApp.verifyNativeAuthWithGas(b64);
      return true;
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.verifyNativeAuthWithGas === 'function') {
      window.AndroidBridge.verifyNativeAuthWithGas(b64);
      return true;
    }

    if (window.AndroidNative && typeof window.AndroidNative.verifyNativeAuthWithGas === 'function') {
      window.AndroidNative.verifyNativeAuthWithGas(b64);
      return true;
    }

    if (window.WebAppInterface && typeof window.WebAppInterface.verifyNativeAuthWithGas === 'function') {
      window.WebAppInterface.verifyNativeAuthWithGas(b64);
      return true;
    }

    return false;
  }

  function verifyByJsonp(payload) {
    return new Promise(function (resolve) {
      var callbackName = 'ANG_JSONP_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');

      var gasUrl = getGasUrl();
      var params = [
        'action=' + encodeURIComponent(payload.action || 'verifyNativeGoogleIdToken'),
        'payload=' + encodeURIComponent(JSON.stringify(payload)),
        'callback=' + encodeURIComponent(callbackName)
      ];

      var done = false;

      function finish(res) {
        if (done) return;
        done = true;

        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] = undefined;
        }

        try {
          if (script && script.parentNode) script.parentNode.removeChild(script);
        } catch (e2) {}

        resolve(res || {});
      }

      window[callbackName] = function (res) {
        finish(res || {});
      };

      script.onerror = function () {
        finish({
          ok: false,
          message: 'JSONP 呼叫 GAS 失敗',
          source: 'native-google-bridge'
        });
      };

      setTimeout(function () {
        finish({
          ok: false,
          message: 'GAS 驗證逾時',
          source: 'native-google-bridge-timeout'
        });
      }, 25000);

      script.src = gasUrl + (gasUrl.indexOf('?') >= 0 ? '&' : '?') + params.join('&');
      document.head.appendChild(script);
    });
  }

  function verifyNativeAuthWithGas(raw) {
    raw = normalizeNativeInput(raw || {});

    safeSetStorage('ang_last_native_auth_result', raw);
    window.__ANG_LAST_NATIVE_AUTH_RESULT = raw;

    var statusId = resolveStatusId(raw);

    if (!raw.ok) {
      setStatusSafe(statusId, 'error', raw.message || 'App 原生驗證失敗');
      showNativePanelSafe(raw, null);
      return null;
    }

    if (raw.gas_response || raw.gasResponse) {
      return receiveGasResult(raw);
    }

    var token = getToken(raw);
    if (!token) {
      setStatusSafe(statusId, 'error', 'App 有回傳，但 token 是空的');
      showNativePanelSafe(raw, null);
      return null;
    }

    var payload = buildGasPayload(raw);

    safeSetStorage('ang_last_gas_payload', payload);
    window.__ANG_LAST_GAS_PAYLOAD = payload;

    setStatusSafe(statusId, 'info', '已收到 App 原生 ' + (payload.provider === 'line' ? 'LINE' : 'Google') + ' 回傳，正在送 GAS 驗證...');

    log('準備送 GAS 驗證', {
      provider: payload.provider,
      action: payload.action,
      email: payload.email,
      flow: payload.flow,
      plan: payload.plan,
      token_exists: !!getToken(payload)
    });

    var calledNative = verifyByAndroidNative(payload);

    if (calledNative) {
      safeSetStorage('ang_gas_verify_status', {
        ok: true,
        mode: 'android_native_http',
        message: '已交給 Android 原生 HTTP 呼叫 GAS',
        savedAt: Date.now()
      });

      setTimeout(function () {
        var latest = safeJsonParse(safeGetStorage('ang_last_native_gas_result', ''), {});
        if (!latest || (!latest.gas_response && !latest.gasResponse && latest.ok !== true)) {
          setStatusSafe(statusId, 'info', '仍在等待 GAS 回傳，如果停太久請再按一次 Google 驗證。');
        }
      }, 12000);

      return null;
    }

    verifyByJsonp(payload).then(function (res) {
      receiveGasResult({
        ok: true,
        provider: payload.provider,
        action: payload.action,
        gas_response: res,
        source: 'frontend_jsonp_gas'
      });
    });

    return null;
  }

  window.ANG_NATIVE_GAS_RESULT_RECEIVER = function (res) {
    return receiveGasResult(res || {});
  };

  window.ANG_DEEP_LINK_AUTH_RECEIVER = function (auth, raw) {
    return receiveGasResult(raw || auth || {});
  };

  window.ANG_NATIVE_LOGIN_RECEIVER = function (res) {
    var raw = normalizeNativeInput(res || {});
    callPreviousNativeReceiver(raw);
    return verifyNativeAuthWithGas(raw);
  };

  window.handleNativeAuthResult = function (res) {
    var raw = normalizeNativeInput(res || {});
    callPreviousNativeReceiver(raw);
    return verifyNativeAuthWithGas(raw);
  };

  window.handleNativeGoogleResult = function (payload) {
    payload = payload || {};
    payload.provider = 'google';
    return window.ANG_NATIVE_LOGIN_RECEIVER(payload);
  };

  window.handleNativeLineResult = function (payload) {
    payload = payload || {};
    payload.provider = 'line';
    return window.ANG_NATIVE_LOGIN_RECEIVER(payload);
  };

  window.onNativeGoogleLoginSuccess = function (idToken, email) {
    return window.handleNativeGoogleResult({
      ok: true,
      provider: 'google',
      id_token: idToken,
      credential: idToken,
      token: idToken,
      email: email || ''
    });
  };

  window.onGoogleSignInSuccess = window.onNativeGoogleLoginSuccess;
  window.handleAppNativeGoogleLogin = window.onNativeGoogleLoginSuccess;

  window.onNativeLineLoginSuccess = function (idToken, userId, displayName) {
    return window.handleNativeLineResult({
      ok: true,
      provider: 'line',
      id_token: idToken,
      credential: idToken,
      token: idToken,
      line_user_id: userId || '',
      profile_name: displayName || ''
    });
  };

  window.handleAppNativeLineLogin = window.onNativeLineLoginSuccess;

  window.onNativeGoogleLoginFailure = function (message) {
    var statusId = resolveStatusId({});
    setStatusSafe(statusId, 'error', message || 'Google 原生驗證失敗');
  };

  window.onGoogleSignInError = window.onNativeGoogleLoginFailure;

  window.onNativeLineLoginFailure = function (message) {
    var statusId = resolveStatusId({});
    setStatusSafe(statusId, 'error', message || 'LINE 原生驗證失敗');
  };

  window.handleAppNativeLogin = function (idToken) {
    var raw = {
      provider: 'google',
      id_token: idToken,
      credential: idToken,
      token: idToken,
      source: 'handleAppNativeLogin'
    };

    try {
      if (
        typeof PREV_HANDLE_APP_NATIVE_LOGIN === 'function' &&
        PREV_HANDLE_APP_NATIVE_LOGIN !== window.handleAppNativeLogin
      ) {
        PREV_HANDLE_APP_NATIVE_LOGIN(idToken);
      }
    } catch (e) {}

    return verifyNativeAuthWithGas(raw);
  };

  window.ANG_VERIFY_NATIVE_AUTH_WITH_GAS = verifyNativeAuthWithGas;

  window.addEventListener('ANG_HR_NATIVE_AUTH', function (event) {
    var raw = normalizeNativeInput((event && event.detail) || {});
    callPreviousNativeReceiver(raw);
    verifyNativeAuthWithGas(raw);
  });

  window.addEventListener('ANG_HR_DEEP_LINK_AUTH', function (event) {
    var detail = (event && event.detail) || {};
    receiveGasResult(detail.raw || detail.auth || detail || {});
  });

  setTimeout(function () {
    var lastNative = safeJsonParse(safeGetStorage('ang_last_native_auth_result', ''), {});
    var lastGas = safeJsonParse(safeGetStorage('ang_last_native_gas_result', ''), {});

    if (lastGas && (lastGas.gas_response || lastGas.gasResponse || lastGas.ok === true)) {
      receiveGasResult(lastGas);
      return;
    }

    if (lastNative && (lastNative.credential || lastNative.id_token || lastNative.loginToken || lastNative.token)) {
      if (!lastNative.gas_response && !lastNative.gasResponse) {
        verifyNativeAuthWithGas(lastNative);
      }
    }
  }, 600);

  log('已載入', ANG_NATIVE_BRIDGE_VERSION);
})();
