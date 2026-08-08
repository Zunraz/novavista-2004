/* ============================================================
   NovaVista 2004 — Arranque principal y bucle del juego
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var started = false;
  var desktopStarted = false;
  var prev = 0;
  var trayTick = 0;

  function init() {
    if (started) return;
    started = true;

    // Iconos estáticos del HTML: <img data-icon="..."> -> PNG incrustado
    Util.applyDataIcons(document);
    if (NS.I18n) NS.I18n.init();

    // Compatibilidad de iconos: en motores antiguos <use> necesita xlink:href.
    // (Los iconos ya se incrustan literalmente, esto es una red de seguridad.)
    try {
      var xlinkNS = 'http://www.w3.org/1999/xlink';
      var fixUse = function (root) {
        var uses = root.querySelectorAll ? root.querySelectorAll('use') : [];
        for (var i = 0; i < uses.length; i++) {
          var u = uses[i];
          var h = u.getAttribute('href');
          if (h && !u.getAttributeNS(xlinkNS, 'href')) u.setAttributeNS(xlinkNS, 'xlink:href', h);
        }
      };
      fixUse(document);
      new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          for (var k = 0; k < muts[m].addedNodes.length; k++) {
            var n = muts[m].addedNodes[k];
            if (n && n.nodeType === 1) fixUse(n);
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}

    // Atajos globales + easter eggs
    var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var konamiIdx = 0;
    var konamiUsed = false;
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      if ((e.ctrlKey && e.altKey && key === 'Delete') || (e.ctrlKey && e.shiftKey && key === 'Escape')) {
        e.preventDefault();
        if (NS.TaskMgr && NS.TaskMgr.open) NS.TaskMgr.open();
        return;
      }
      if (key === konami[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === konami.length) {
          konamiIdx = 0;
          if (!konamiUsed) {
            konamiUsed = true;
            NS.State.addCash(50);
            NS.UI.toast('Código Konami', '¡Truco activado! +' + Util.fmtMoney(50) + ' (una vez por sesión).', 'good', 'ic-egg');
            NS.Audio.startup();
          } else {
            NS.UI.toast('Código Konami', 'Ya usaste el truco esta sesión.', 'dim', 'ic-egg');
          }
        }
      } else if (key.indexOf('Arrow') === 0 || key === 'b' || key === 'a') {
        konamiIdx = key === konami[0] ? 1 : 0;
      }
    });

    NS.Taskbar.init();
    NS.Event.init();

    // El escritorio se construye detrás de la pantalla de inicio de sesión
    NS.Desktop.buildIcons();

    // Secuencia de arranque
    NS.Boot.run();
  }

  /* Se ejecuta al iniciar sesión con una cuenta */
  function enterDesktop() {
    if (desktopStarted) return;
    desktopStarted = true;

    var res = NS.State.loadGame();
    var S = NS.State.get();
    S.meta.bootCount++;
    if (NS.I18n) {
      var storedLang = NS.I18n.get();
      if (!S.settings.language || (S.meta.bootCount <= 1 && storedLang === 'en')) S.settings.language = storedLang;
      NS.I18n.set(S.settings.language, false);
    }

    // Aplicar ajustes del perfil
    NS.Desktop.refresh();
    NS.Audio.setEnabled(S.settings.sound);
    NS.Taskbar.buildStartMenu();
    NS.Taskbar.refreshTray();
    NS.Taskbar.updateLanguage();

    // Reloj de la bandeja + dinero en vivo
    NS.Taskbar.tickClock();
    NS.Taskbar.updateMoney();
    setInterval(function () {
      NS.Taskbar.tickClock();
      NS.Taskbar.updateMoney();
    }, 1000);

    // Avisos de carga
    if (res.restored) {
      NS.UI.toast('Integridad del guardado', 'El guardado principal estaba modificado o corrupto. Se restauró la última copia de seguridad válida.', 'important', 'ic-warning');
    }
    if (res.quarantined) {
      NS.UI.toast('¡CUARENTENA!', 'Se detectó un guardado manipulado y no había copia válida. El sistema se reinició en modo seguro: no se guardará progreso hasta restaurar en NovaShield.', 'important', 'ic-error');
    }

    // Bienvenida en el primer arranque de la cuenta
    if (S.meta.bootCount <= 1) {
      NS.UI.dialog({
        title: 'Bienvenido a NovaVista 2004',
        icon: 'ic-hacker',
        message: '<div class="welcome-card"><div class="welcome-kicker">CUENTA ACTIVADA</div>' +
          '<div class="welcome-name">Hola, ' + Util.esc(S.profile.name) + '.</div>' +
          '<p>NovaNet está despertando. Otros operadores ya están acumulando seguidores, NovaCoins y acceso a servidores privados.</p>' +
          '<div class="welcome-goals"><span>① Hazte visible en <b>MyNova</b></span><span>② Entra al <b>Mapa de Red</b></span><span>③ Supera al siguiente rival del <b>Ranking</b></span></div>' +
          '<p class="welcome-hint">Tu primera oportunidad ya está activa. El Manual queda en el escritorio por si lo necesitas.</p></div>',
        buttons: [{ label: 'Entrar en NovaNet', value: true, primary: true }]
      }).then(function () {
        if (!S.meta.tutorialDone && !S.meta.tutorialDismissed && NS.Tutorial) NS.Tutorial.start(0);
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
    var syncCount = 0;
    setInterval(function () {
      NS.State.saveNow();
      // sincronización con el servidor cada ~45 s si hay sesión en línea
      syncCount++;
      if (NS.Online && NS.Online.isOnline() && syncCount % 3 === 0) {
        NS.Online.syncNow();
      }
    }, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        NS.State.saveNow();
        if (NS.Online && NS.Online.isOnline()) NS.Online.syncNow();
      }
    });
    window.addEventListener('beforeunload', function () {
      NS.State.saveNow();
      if (NS.Online && NS.Online.isOnline()) NS.Online.pushSave(NS.Save.exportSave(NS.State.get()));
    });
    window.addEventListener('pagehide', function () {
      NS.State.saveNow();
      if (NS.Online && NS.Online.isOnline()) NS.Online.pushSave(NS.Save.exportSave(NS.State.get()));
    });

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
        if (NS.Desktop && NS.Desktop.refreshGuide) NS.Desktop.refreshGuide();
      }
    } catch (e) {
      // El juego nunca debe romperse por un error de UI
      if (window.console && console.error) console.error('[NovaVista]', e);
    }
  }

  NS.Main = { init: init, enterDesktop: enterDesktop, afterBoot: enterDesktop };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
