/* ============================================================
   NovaVista 2004 — Guardado con integridad verificada
   Cada partida se firma con un hash derivado de una sal
   persistente de instalación. Cualquier edición manual del
   guardado invalida la firma -> cuarentena.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var SAVE_KEY = 'novavista.save.v2';
  var BACKUP_KEY = 'novavista.backup.v2';
  var SALT_KEY = 'novavista.salt.v2';
  var PROFILES_KEY = 'novavista.profiles.v1';
  var LAST_PROFILE_KEY = 'novavista.lastprofile.v1';

  var currentProfile = null; // {id, name, avatar}
  var profiles = null;

  var store = null;
  try {
    store = window.localStorage;
    // Prueba de acceso (modo privado puede lanzar excepción)
    var probe = '__nv_test__';
    store.setItem(probe, '1');
    store.removeItem(probe);
  } catch (e) { store = null; }

  function hasStore() { return !!store; }

  function saveKeyFor(id) { return 'novavista.save.v2.' + id; }
  function backupKeyFor(id) { return 'novavista.backup.v2.' + id; }

  /* ---------- perfiles (cuentas de usuario locales) ---------- */
  function loadProfiles() {
    if (profiles) return profiles;
    profiles = [];
    if (!store) return profiles;
    try {
      var raw = store.getItem(PROFILES_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) profiles = arr.filter(function (p) { return p && p.id; });
      }
    } catch (e) {}
    return profiles;
  }
  function persistProfiles() {
    if (!store) return;
    try { store.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch (e) {}
  }
  function migrateLegacy() {
    // Partidas anteriores (una sola cuenta) → perfil "default"
    loadProfiles();
    if (profiles.length || !store) return;
    var legacy = null;
    try { legacy = store.getItem(SAVE_KEY); } catch (e) {}
    if (!legacy) return;
    var name = 'Usuario';
    try {
      var box = JSON.parse(legacy);
      var st = JSON.parse(box.d);
      if (st && st.profile && st.profile.name) name = st.profile.name;
    } catch (e) {}
    var p = { id: 'default', name: name, avatar: 0, createdAt: Date.now(), lastSeen: Date.now(), level: 1 };
    profiles.push(p);
    // mover el guardado a la clave del perfil
    try {
      store.setItem(saveKeyFor(p.id), legacy);
      store.removeItem(SAVE_KEY);
    } catch (e) {}
    persistProfiles();
  }
  function listProfiles() {
    migrateLegacy();
    loadProfiles();
    return profiles.map(function (p) { return { id: p.id, name: p.name, avatar: p.avatar, level: p.level || 1, lastSeen: p.lastSeen || 0 }; });
  }
  function createProfile(name, avatar) {
    migrateLegacy();
    loadProfiles();
    var p = {
      id: 'p' + Util.cyrb53(String(Date.now()) + Math.random(), 3).toString(36),
      name: String(name || 'Usuario').trim().slice(0, 20) || 'Usuario',
      avatar: avatar || 0,
      createdAt: Date.now(), lastSeen: Date.now(), level: 1
    };
    profiles.push(p);
    persistProfiles();
    return p;
  }
  function deleteProfile(id) {
    loadProfiles();
    profiles = profiles.filter(function (p) { return p.id !== id; });
    persistProfiles();
    try {
      store.removeItem(saveKeyFor(id));
      store.removeItem(backupKeyFor(id));
    } catch (e) {}
    if (currentProfile && currentProfile.id === id) currentProfile = null;
  }
  function setProfile(id) {
    loadProfiles();
    currentProfile = null;
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === id) currentProfile = profiles[i];
    }
    if (currentProfile && store) {
      try { store.setItem(LAST_PROFILE_KEY, id); } catch (e) {}
    }
    return !!currentProfile;
  }
  function currentProfileId() { return currentProfile ? currentProfile.id : null; }
  function lastProfileId() {
    if (!store) return null;
    try { return store.getItem(LAST_PROFILE_KEY); } catch (e) { return null; }
  }
  function touchProfile(state) {
    if (!currentProfile) return;
    currentProfile.name = state.profile.name;
    currentProfile.avatar = state.profile.avatar;
    currentProfile.level = state.currencies.level;
    currentProfile.lastSeen = Date.now();
    persistProfiles();
  }

  function getSalt() {
    if (!store) return 'sin-storage';
    var s = null;
    try { s = store.getItem(SALT_KEY); } catch (e) {}
    if (!s) {
      var entropy = String(Date.now()) + '|' + String(Math.random()) +
        (typeof navigator !== 'undefined' ? navigator.userAgent : 'nv') + '|' + String(Math.random());
      s = Util.hashStr(entropy) + Util.cyrb53(entropy, 0x5eed).toString(36);
      try { store.setItem(SALT_KEY, s); } catch (e) {}
    }
    return s;
  }

  function sign(payload) {
    // Doble paso con sal: cualquier byte alterado rompe la firma.
    var a = Util.hashStr(payload + '::' + getSalt());
    var b = Util.hashStr(payload.split('').reverse().join('') + '::' + getSalt());
    return a + b;
  }

  function verify(payload, sig) {
    var a = Util.hashStr(payload + '::' + getSalt());
    var b = Util.hashStr(payload.split('').reverse().join('') + '::' + getSalt());
    var expect = a + b;
    if (expect.length !== sig.length) return false;
    // Comparación a prueba de timing (constante)
    var diff = 0;
    for (var i = 0; i < expect.length; i++) diff |= expect.charCodeAt(i) ^ sig.charCodeAt(i);
    return diff === 0;
  }

  /* Validación estructural del estado cargado */
  function structuralCheck(o) {
    if (!o || typeof o !== 'object') return false;
    var need = ['meta', 'profile', 'settings', 'currencies', 'bank', 'social', 'bots', 'broker', 'data', 'upg', 'inventory', 'av', 'quests', 'events', 'stats'];
    for (var i = 0; i < need.length; i++) if (!o[need[i]]) return false;
    if (!o.meta.installId) return false;
    var c = o.currencies;
    if (!isFinite(c.cash) || !isFinite(c.novaCoins) || !isFinite(c.xp) || !isFinite(c.energy) || !isFinite(c.maxEnergy)) return false;
    if (c.cash < 0 || c.novaCoins < 0 || c.xp < 0 || c.energy < 0 || c.maxEnergy < 1) return false;
    if (!isFinite(o.bank.balance) || o.bank.balance < 0) return false;
    if (!isFinite(o.data.mb) || o.data.mb < 0) return false;
    if (typeof o.upg !== 'object' || typeof o.inventory.tools !== 'object') return false;
    return true;
  }

  function save(state) {
    if (!hasStore()) return false;
    try {
      var payload = JSON.stringify(state);
      var full = JSON.stringify({ d: payload, h: sign(payload) });
      var key = currentProfile ? saveKeyFor(currentProfile.id) : SAVE_KEY;
      var bk = currentProfile ? backupKeyFor(currentProfile.id) : BACKUP_KEY;
      // Copia de seguridad del guardado bueno anterior
      var prev = store.getItem(key);
      if (prev) store.setItem(bk, prev);
      store.setItem(key, full);
      touchProfile(state);
      return true;
    } catch (e) { return false; }
  }

  /* Devuelve { ok, state, tampered, error } */
  function load() {
    if (!hasStore()) return { ok: false, error: 'Sin almacenamiento disponible.' };
    var key = currentProfile ? saveKeyFor(currentProfile.id) : SAVE_KEY;
    var raw = null;
    try { raw = store.getItem(key); } catch (e) {}
    if (!raw) return { ok: false, error: 'Sin partida guardada.' };
    try {
      var box = JSON.parse(raw);
      if (!box || typeof box.d !== 'string' || typeof box.h !== 'string') {
        return { ok: false, tampered: true, error: 'Guardado malformado.' };
      }
      if (!verify(box.d, box.h)) {
        return { ok: false, tampered: true, error: 'La firma de integridad no coincide (guardado editado o corrupto).' };
      }
      var state = JSON.parse(box.d);
      if (!structuralCheck(state)) {
        return { ok: false, tampered: true, error: 'El estado no pasa la validación estructural.' };
      }
      return { ok: true, state: state };
    } catch (e) {
      return { ok: false, tampered: true, error: 'Guardado ilegible.' };
    }
  }

  function loadBackup() {
    if (!hasStore()) return null;
    try {
      var key = currentProfile ? backupKeyFor(currentProfile.id) : BACKUP_KEY;
      var raw = store.getItem(key);
      if (!raw) return null;
      var box = JSON.parse(raw);
      if (!box || !verify(box.d, box.h)) return null;
      var state = JSON.parse(box.d);
      return structuralCheck(state) ? state : null;
    } catch (e) { return null; }
  }

  function wipe() {
    if (!hasStore()) return;
    try {
      if (currentProfile) {
        store.removeItem(saveKeyFor(currentProfile.id));
        store.removeItem(backupKeyFor(currentProfile.id));
      } else {
        store.removeItem(SAVE_KEY);
        store.removeItem(BACKUP_KEY);
      }
    } catch (e) {}
  }

  /* Exportar a texto (base64, seguro para copiar) */
  function exportSave(state) {
    var payload = JSON.stringify(state);
    var full = JSON.stringify({ d: payload, h: sign(payload) });
    try {
      return btoa(unescape(encodeURIComponent(full)));
    } catch (e) { return null; }
  }

  /* Importar: la firma debe ser válida con la sal de esta instalación */
  function importSave(text) {
    if (!text || typeof text !== 'string') return { ok: false, error: 'Texto vacío.' };
    try {
      var full = decodeURIComponent(escape(atob(text.replace(/\s+/g, ''))));
      var box = JSON.parse(full);
      if (!box || typeof box.d !== 'string' || typeof box.h !== 'string') {
        return { ok: false, error: 'Código de importación malformado.' };
      }
      if (!verify(box.d, box.h)) {
        return { ok: false, error: 'La firma de integridad no es válida para esta instalación.' };
      }
      var state = JSON.parse(box.d);
      if (!structuralCheck(state)) return { ok: false, error: 'Estado no válido.' };
      return { ok: true, state: state };
    } catch (e) {
      return { ok: false, error: 'No se pudo interpretar el código.' };
    }
  }

  NS.Save = {
    hasStore: hasStore,
    save: save,
    load: load,
    loadBackup: loadBackup,
    wipe: wipe,
    exportSave: exportSave,
    importSave: importSave,
    sign: sign,
    listProfiles: listProfiles,
    createProfile: createProfile,
    deleteProfile: deleteProfile,
    setProfile: setProfile,
    currentProfileId: currentProfileId,
    lastProfileId: lastProfileId,
    migrateLegacy: migrateLegacy
  };
})();
