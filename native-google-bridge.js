(function () {
  'use strict';

  var ANG_NATIVE_BRIDGE_VERSION = '2026-07-03-safe-isolation';

  if (window.__ANG_NATIVE_BRIDGE_VERSION === ANG_NATIVE_BRIDGE_VERSION) {
    return;
  }

  window.__ANG_NATIVE_BRIDGE_VERSION = ANG_NATIVE_BRIDGE_VERSION;
  window.__ANG_NATIVE_BRIDGE_ISOLATED = '1';

  function log() {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ANG Native Bridge]');
      console.log.apply(console, args);
    } catch (e) {}
  }

  function setStatus(message) {
    var ids = [
      'status',
      'adminLoginStatus',
      'platformLoginStatus',
      'managerLoginStatus',
      'registerStatus',
      'loginStatus'
    ];

    for (var i = 0; i < ids.length; i++) {
      try {
        var el = document.getElementById(ids[i]);
        if (el) {
          el.className = 'status show info';
          el.textContent = message;
          return;
        }
      } catch (e) {}
    }

    try {
      alert(message);
    } catch (e2) {}
  }

  function fallbackMessage() {
    setStatus('App 原生驗證準備中，請改用 Email 驗證');
    log('native auth blocked in safe isolation mode');
  }

  window.isAngHrNativeApp = function () {
    return false;
  };

  window.startAppNativeGoogleLogin = function () {
    fallbackMessage();
    return false;
  };

  window.startAppNativeLineLogin = function () {
    fallbackMessage();
    return false;
  };

  window.startOauthViaGas = function () {
    fallbackMessage();
    return false;
  };

  window.verifyNativeAuthWithGas = function () {
    fallbackMessage();
    return null;
  };

  window.encodeUtf8Base64Text = window.encodeUtf8Base64Text || function (text) {
    text = String(text || '');

    try {
      if (window.TextEncoder) {
        var bytes = new TextEncoder().encode(text);
        var binary = '';

        for (var i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        return btoa(binary);
      }

      return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      return btoa(text);
    }
  };

  log('loaded', ANG_NATIVE_BRIDGE_VERSION, 'isolated');
})();