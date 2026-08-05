/* ============================================================
   NovaVista 2004 — Cliente en línea
   Cuentas reales, sincronización del guardado y rankings con el
   servidor (server/index.js). Degrada con elegancia a modo local
   si el servidor no está disponible.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var TOKEN_KEY = 'novavista.ntoken.v1';
  var state = {
    token: null,
    user: null,       // {username, avatar, level}
    online: false,    // sesión validada con el servidor
    lastPush: 0
  };

  function token() { return state.token; }
  function isOnline() { return state.online; }
  function user() { return state.user; }

  function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
      method: opts.method || 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(opts.timeout || 8000)
    }).then(function (r) {
      return r.json().catch(function () { throw new Error('Respuesta no JSON'); });
    }).then(function (j) {
      if (!j || j.ok === false) throw new Error((j && j.error) || 'Error del servidor');
      return j;
    });
  }

  /* -------- sesión -------- */
  function setSession(tok, userInfo) {
    state.token = tok;
    state.user = userInfo || null;
    state.online = !!tok;
    try { window.localStorage.setItem(TOKEN_KEY, tok || ''); } catch (e) {}
  }

  /* Restaura la sesión guardada (sin red) y la valida contra el servidor */
  function init() {
    var saved = null;
    try { saved = window.localStorage.getItem(TOKEN_KEY); } catch (e) {}
    if (!saved) return Promise.resolve(false);
    state.token = saved;
    state.online = false;
    return api('/api/me?token=' + encodeURIComponent(saved)).then(function (j) {
      state.user = { username: j.username, avatar: j.avatar, level: j.level };
      state.online = true;
      return true;
    }).catch(function () {
      state.token = null;
      state.online = false;
      try { window.localStorage.removeItem(TOKEN_KEY); } catch (e) {}
      return false;
    });
  }

  function register(username, password, avatar) {
    return api('/api/register', { method: 'POST', body: { username: username, password: password, avatar: avatar || 0 } })
      .then(function (j) {
        setSession(j.token, { username: j.username, avatar: j.avatar, level: 1 });
        return true;
      });
  }
  function login(username, password) {
    return api('/api/login', { method: 'POST', body: { username: username, password: password } })
      .then(function (j) {
        setSession(j.token, { username: j.username, avatar: j.avatar, level: 1 });
        return true;
      });
  }
  function logout() {
    if (state.token) {
      try { api('/api/logout?token=' + encodeURIComponent(state.token), { method: 'POST' }).catch(function () {}); } catch (e) {}
    }
    setSession(null, null);
    try { window.localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  /* -------- guardado -------- */
  function fetchRemoteSave() {
    if (!state.token) return Promise.resolve(null);
    return api('/api/save?token=' + encodeURIComponent(state.token)).then(function (j) {
      return j.data || null;
    }).catch(function () { return null; });
  }
  function pushSave(signedData) {
    if (!state.token || !signedData) return Promise.resolve(false);
    var nowMs = Date.now();
    if (nowMs - state.lastPush < 5000) return Promise.resolve(false); // mínimo 5 s entre envíos
    state.lastPush = nowMs;
    return api('/api/save?token=' + encodeURIComponent(state.token), { method: 'POST', body: { data: signedData }, timeout: 12000 })
      .then(function () { return true; })
      .catch(function () { return false; });
  }
  /* Sincroniza el guardado actual con el servidor (si hay sesión) */
  function syncNow() {
    if (!state.online) return Promise.resolve(false);
    var code = NS.Save.exportSave(NS.State.get());
    if (!code) return Promise.resolve(false);
    return pushSave(code);
  }

  /* -------- rankings -------- */
  function rankings(type) {
    if (!state.token) return Promise.resolve(null);
    return api('/api/rankings?type=' + (type === 'elo' ? 'elo' : 'power') + '&token=' + encodeURIComponent(state.token))
      .then(function (j) { return j.list || null; })
      .catch(function () { return null; });
  }

  /* -------- amigos y perfiles -------- */
  function searchUsers(q) {
    if (!state.token) return Promise.resolve([]);
    return api('/api/users/search?q=' + encodeURIComponent(q) + '&token=' + encodeURIComponent(state.token))
      .then(function (j) { return j.list || []; })
      .catch(function () { return []; });
  }
  function myFriends() {
    if (!state.token) return Promise.resolve({ friends: [], incoming: [], outgoing: [] });
    return api('/api/friends?token=' + encodeURIComponent(state.token))
      .then(function (j) { return { friends: j.friends || [], incoming: j.incoming || [], outgoing: j.outgoing || [] }; })
      .catch(function () { return { friends: [], incoming: [], outgoing: [] }; });
  }
  function sendFriendRequest(to) {
    return api('/api/friends/request?token=' + encodeURIComponent(state.token), { method: 'POST', body: { to: to } }).then(function () { return true; });
  }
  function acceptFriend(from) {
    return api('/api/friends/accept?token=' + encodeURIComponent(state.token), { method: 'POST', body: { from: from } }).then(function () { return true; });
  }
  function removeFriend(username) {
    return api('/api/friends/remove?token=' + encodeURIComponent(state.token), { method: 'POST', body: { username: username } }).then(function () { return true; });
  }
  function getProfile(username) {
    return api('/api/profile/' + encodeURIComponent(username) + '?token=' + encodeURIComponent(state.token || ''))
      .then(function (j) { return j.profile || null; })
      .catch(function () { return null; });
  }

  NS.Online = {
    init: init, register: register, login: login, logout: logout,
    isOnline: isOnline, user: user, token: token,
    fetchRemoteSave: fetchRemoteSave, pushSave: pushSave, syncNow: syncNow,
    rankings: rankings,
    searchUsers: searchUsers, myFriends: myFriends,
    sendFriendRequest: sendFriendRequest, acceptFriend: acceptFriend,
    removeFriend: removeFriend, getProfile: getProfile
  };
})();
