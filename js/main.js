/* ============================================================
   NovaVista 2004 — Arranque principal y bucle del juego
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var started = false;
  var prev = 0;
  var trayTick = 0;

  function init() {
    if (started) return;
    started = true;

    NS.Taskbar.init();
    NS.Event.init();

    // Cargar partida (puede restaurar copia o marcar cuarentena)
    var res = NS.State.loadGame();
    var S = NS.State.get();
    S.meta.bootCount++;

    // Aplicar ajustes
    NS.Desktop.buildIcons();
    NS.Desktop.refresh();
    NS.Audio.setEnabled(S.settings.sound);
    NS.Taskbar.buildStartMenu();
    NS.Taskbar.refreshTray();

    // Reloj de la bandeja
    NS.Taskbar.tickClock();
    setInterval(function () { NS.Taskbar.tickClock(); }, 1000);

    // Avisos de carga
    if (res.restored) {
      NS.UI.toast('Integridad del guardado', 'El guardado principal estaba modificado o corrupto. Se restauró la última copia de seguridad válida.', 'important', 'ic-warning');
    }
    if (res.quarantined) {
      NS.UI.toast('¡CUARENTENA!', 'Se detectó un guardado manipulado y no había copia válida. El sistema se reinició en modo seguro: no se guardará progreso hasta restaurar en NovaShield.', 'important', 'ic-error');
    }

    // Secuencia de arranque
    NS.Boot.run();
  }

  function afterBoot() {
    var S = NS.State.get();

    // Sonido de inicio
    if (S.settings.sound) NS.Boot.startSound();

    // Primer arranque: registro de usuario
    if (S.meta.bootCount <= 1) {
      NS.UI.dialog({
        title: 'Bienvenido a NovaVista 2004',
        icon: 'ic-hacker',
        message: 'Este sistema operativo simulado esconde un <b>juego incremental con rasgos roguelite</b>.<br><br>' +
          'Gana dinero con el banco y MyNova, roba datos en los asaltos de red, mina NovaCoins y acumula <b>legado</b> formateando el sistema.<br><br>' +
          '¿Cómo te llamas, hacker?',
        input: true, inputValue: 'Hacker'
      }).then(function (name) {
        var v = String(name || 'Hacker').trim().slice(0, 20) || 'Hacker';
        S.profile.name = v;
        NS.Taskbar.buildStartMenu();
        NS.UI.toast('Bienvenido, ' + Util.esc(v), 'Tu misión: construir un imperio digital desde un PC de 2004. ¡No te dejes rastrear!', 'good', 'ic-hacker');
        NS.Audio.ok();
      });
    }

    // Cálculo offline (una sola vez por sesión)
    var now = Date.now();
    var delta = now - (S.meta.lastSeen || now);
    if (delta > 60000 && !NS.Sec.isQuarantined()) {
      NS.State.offline(delta);
    }

    // Bucle del juego
    prev = Date.now();
    setInterval(loop, 200);

    // Guardado periódico
    setInterval(function () { NS.State.saveNow(); }, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') NS.State.saveNow();
    });
    window.addEventListener('beforeunload', function () { NS.State.saveNow(); });
    window.addEventListener('pagehide', function () { NS.State.saveNow(); });

    // Clics en el escritorio
    Util.$('#desktop').addEventListener('contextmenu', function (e) {
      if (e.target.closest('.window')) return;
      NS.Desktop.onContext(e);
    });
  }

  function loop() {
    var now = Date.now();
    var dt = now - prev;
    prev = now;
    try {
      NS.Sec.periodicChecks();
      NS.State.tick(dt);
      NS.WM.tickAll();
      trayTick++;
      if (trayTick % 10 === 0) {
        NS.Taskbar.refreshTray();
        NS.State.verify();
        if (NS.Mail && NS.Mail.refreshBadge) NS.Mail.refreshBadge();
      }
    } catch (e) {
      // El juego nunca debe romperse por un error de UI
      if (window.console && console.error) console.error('[NovaVista]', e);
    }
  }

  NS.Main = { init: init, afterBoot: afterBoot };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
