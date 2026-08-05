/* ============================================================
   NovaVista 2004 — Seguridad anti-manipulación
   Guardas de integridad, detección de trampas y cuarentena.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var QUARANTINE_KEY = 'novavista.quarantine.v1';
  var flags = [];
  var quarantined = false;
  var quarantinedAt = 0;
  var lastNow = null;
  var tickCount = 0;
  var randomWarning = 0;

  /* La cuarentena es por perfil (cada cuenta tiene su propia clave) */
  function qKey() {
    var pid = (NS.Save && NS.Save.currentProfileId) ? NS.Save.currentProfileId() : null;
    return pid ? QUARANTINE_KEY + '.' + pid : QUARANTINE_KEY;
  }

  function readQuarantineFlag() {
    try {
      var raw = window.localStorage.getItem(qKey());
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.on) { quarantined = true; quarantinedAt = o.at || Date.now(); }
      }
    } catch (e) { /* sin localStorage */ }
  }

  /* Reloj monotónico con detección de retroceso */
  function now() {
    var t = Date.now();
    if (lastNow !== null && t < lastNow - 4000) {
      flag('Retroceso de reloj detectado');
    }
    if (t >= lastNow) lastNow = t;
    return t;
  }

  function flag(reason) {
    if (flags.indexOf(reason) === -1) flags.push(reason);
  }

  function quarantine(reason) {
    if (quarantined) return;
    quarantined = true;
    quarantinedAt = Date.now();
    flag(reason);
    try {
      window.localStorage.setItem(qKey(), JSON.stringify({ on: true, at: quarantinedAt, why: reason }));
    } catch (e) {}
    NS.Event && NS.Event.fire && NS.Event.fire('quarantine', reason);
  }

  /* Levanta la cuarentena (solo tras restaurar una copia firmada válida) */
  function clearQuarantine() {
    quarantined = false;
    quarantinedAt = 0;
    try { window.localStorage.removeItem(qKey()); } catch (e) {}
  }

  function isQuarantined() { return quarantined; }

  /* Comprobaciones baratas, se ejecutan cada N ticks del bucle */
  function periodicChecks() {
    tickCount++;
    if (tickCount % 5 !== 0) return; // cada ~1 s
    if (quarantined) return;

    // 1) Math.random manipulado (p.ej. parcheado para devolver constante)
    var first = Math.random();
    var same = true;
    for (var i = 0; i < 5; i++) { if (Math.random() !== first) { same = false; break; } }
    if (same) {
      randomWarning++;
      if (randomWarning >= 2) quarantine('Se detectó una manipulación del generador aleatorio');
    } else randomWarning = 0;

    // 2) Contaminación de prototipos (técnica de trampas común):
    //    si Object.prototype tiene propiedades enumerables propias, un
    //    for-in sobre un objeto vacío las revela.
    try {
      var polluted = false;
      for (var k in {}) { polluted = true; break; }
      if (polluted) quarantine('Se detectó contaminación de prototipos');
    } catch (e) {}

    // 3) now() ya controla el retroceso de reloj
  }

  /* Valida un valor numérico del estado; si es corrupto devuelve 0 y avisa */
  function guardNum(v, name) {
    var n = Util.num(v);
    if (n === null) {
      flag('Valor corrupto en estado: ' + name);
      return 0;
    }
    return n;
  }

  /* Verificación de delta de tiempo entre ticks */
  function validateDelta(dtMs) {
    if (!isFinite(dtMs) || dtMs < 0) { flag('Delta de tiempo inválido'); return 0; }
    if (dtMs > 10000) {
      // Saltos grandes solo pueden venir de suspensión del equipo o de manipulación.
      // El cálculo offline se hace una sola vez en la carga; aquí limitamos.
      if (dtMs > 3600000) flag('Salto de tiempo anómalo entre ticks');
      return 10000;
    }
    return dtMs;
  }

  /* Exporta una API congelada: los métodos del juego no se pueden reemplazar */
  function sealApi(api) {
    Object.keys(api).forEach(function (k) {
      if (api[k] && typeof api[k] === 'object' && !Object.isFrozen(api[k])) {
        try { Object.freeze(api[k]); } catch (e) {}
      }
    });
    try { Object.freeze(api); } catch (e) {}
    return api;
  }

  readQuarantineFlag();

  NS.Sec = sealApi({
    now: now,
    flag: flag,
    quarantine: quarantine,
    clearQuarantine: clearQuarantine,
    isQuarantined: isQuarantined,
    quarantinedAt: function () { return quarantinedAt; },
    flags: function () { return flags.slice(); },
    periodicChecks: periodicChecks,
    guardNum: guardNum,
    validateDelta: validateDelta,
    sealApi: sealApi
  });
})();
