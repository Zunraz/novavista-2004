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

  var store = null;
  try {
    store = window.localStorage;
    // Prueba de acceso (modo privado puede lanzar excepción)
    var probe = '__nv_test__';
    store.setItem(probe, '1');
    store.removeItem(probe);
  } catch (e) { store = null; }

  function hasStore() { return !!store; }

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
      // Copia de seguridad del guardado bueno anterior
      var prev = store.getItem(SAVE_KEY);
      if (prev) store.setItem(BACKUP_KEY, prev);
      store.setItem(SAVE_KEY, full);
      return true;
    } catch (e) { return false; }
  }

  /* Devuelve { ok, state, tampered, error } */
  function load() {
    if (!hasStore()) return { ok: false, error: 'Sin almacenamiento disponible.' };
    var raw = null;
    try { raw = store.getItem(SAVE_KEY); } catch (e) {}
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
      var raw = store.getItem(BACKUP_KEY);
      if (!raw) return null;
      var box = JSON.parse(raw);
      if (!box || !verify(box.d, box.h)) return null;
      var state = JSON.parse(box.d);
      return structuralCheck(state) ? state : null;
    } catch (e) { return null; }
  }

  function wipe() {
    if (!hasStore()) return;
    try { store.removeItem(SAVE_KEY); store.removeItem(BACKUP_KEY); } catch (e) {}
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
    sign: sign
  };
})();
