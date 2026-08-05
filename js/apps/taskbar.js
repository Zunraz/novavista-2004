/* ============================================================
   NovaVista 2004 — Barra de tareas, menú inicio y bandeja
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  function init() {
    var btnStart = Util.$('#btn-start');
    var menu = Util.$('#start-menu');
    btnStart.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('hidden');
      NS.Audio.click();
    });
    Util.$('#desktop').addEventListener('mousedown', function () {
      menu.classList.add('hidden');
      NS.Desktop.clearSelection();
    });

    // easter egg: hacer clic en tu nombre 5 veces
    var nameClicks = 0;
    Util.$('#sm-username').addEventListener('click', function (e) {
      e.stopPropagation();
      nameClicks++;
      if (nameClicks === 5) {
        nameClicks = 0;
        NS.UI.toast('NovaVista', '¿Por qué haces clic en tu propio nombre? Bueno... aquí tienes ' + Util.fmtMoney(1) + '.', 'good', 'ic-egg');
        NS.State.addCash(1);
        NS.Audio.popup();
      }
    });

    // botones del menú inicio
    Util.$$('#start-menu [data-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-action');
        menu.classList.add('hidden');
        if (a === 'shutdown') NS.Boot.doShutdown();
        else if (a === 'restart') NS.Boot.doRestart();
        else if (a === 'logout') { if (NS.Login) NS.Login.logout(); }
      });
    });

    // acceso rápido
    var ql = Util.$('#quicklaunch');
    [['browser', 'ic-browser', 'NovaNet Explorer'], ['bank', 'ic-bank', 'Primer Banco Nova'], ['net', 'ic-net', 'Mapa de red']].forEach(function (a) {
      var b = Util.el('button', { title: a[2] });
      b.appendChild(Util.svgIcon(a[1]));
      b.addEventListener('click', function () { NS.WM.open(a[0]); });
      ql.appendChild(b);
    });

    // bandeja
    Util.$('#tray-av').addEventListener('click', function () { NS.WM.open('av'); });
    Util.$('#tray-wifi').addEventListener('click', function () {
      NS.UI.toast('RED-NOVA', 'Conectado a RED-NOVA — 54 Mbps. Señal: buena.', '', 'ic-wifi');
    });
    Util.$('#tray-vol').addEventListener('click', function () {
      var s = NS.State.get();
      NS.Audio.setEnabled(!s.settings.sound);
      s.settings.sound = !s.settings.sound;
      NS.UI.toast('Volumen', s.settings.sound ? 'Sonido activado.' : 'Sonido desactivado.', '', 'ic-volume');
    });
  }

  function refresh() {
    var wrap = Util.$('#taskbar-apps');
    wrap.innerHTML = '';
    NS.WM.openList().forEach(function (o) {
      var btn = Util.el('button', { class: 'tb-btn' + (o.win.minimized ? '' : ' active') });
      btn.appendChild(Util.svgIcon(o.def.icon));
      btn.appendChild(Util.el('span', { class: 'tb-title', text: o.def.title }));
      btn.addEventListener('click', function () {
        if (o.win.minimized) { NS.WM.focus(o.id); }
        else if (NS.WM.isOpen(o.id)) { NS.WM.minimize(o.id); }
      });
      wrap.appendChild(btn);
    });
  }

  function buildStartMenu() {
    var col = Util.$('#sm-programs');
    col.innerHTML = '';
    NS.Apps.list().forEach(function (def) {
      var b = Util.el('button', { class: 'sm-item' });
      b.appendChild(Util.svgIcon(def.icon));
      b.appendChild(document.createTextNode(def.title));
      b.addEventListener('click', function () {
        Util.$('#start-menu').classList.add('hidden');
        NS.WM.open(def.id);
        NS.Audio.click();
      });
      col.appendChild(b);
    });
    var user = Util.$('#sm-username');
    if (user) user.textContent = NS.State.get().profile.name;
    var uic = Util.$('.sm-user-icon');
    var AVS = NS.Catalog.AVATARS;
    if (uic) {
      uic.innerHTML = '';
      uic.appendChild(Util.svgIcon(AVS[(NS.State.get().profile.avatar || 0) % AVS.length], 'icon icon-48'));
    }
    var lvlEl = Util.$('#sm-level');
    if (lvlEl) {
      var s = NS.State.get();
      var xpNeed = NS.State.xpForLevel(s.currencies.level + 1);
      var pct = Math.min(100, s.currencies.xp / xpNeed * 100);
      lvlEl.innerHTML = 'Nivel ' + s.currencies.level +
        '<br><span style="display:inline-block;width:70px;height:6px;border:1px solid #fff;border-radius:3px;overflow:hidden;vertical-align:middle"><span style="display:block;height:100%;width:' + Math.floor(pct) + '%;background:#7ed957"></span></span>';
    }
  }

  function tickClock() {
    var el = Util.$('#tray-clock');
    if (!el) return;
    var d = new Date();
    el.innerHTML = Util.pad2(d.getHours()) + ':' + Util.pad2(d.getMinutes()) + '<br>' + Util.pad2(d.getDate()) + '/' + Util.pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function updateMoney() {
    var el = Util.$('#tray-money');
    if (!el) return;
    var s = NS.State.get();
    el.innerHTML = Util.fmtMoney(s.currencies.cash) + '<br>' + s.currencies.novaCoins.toFixed(2).replace('.', ',') + ' NC';
  }

  function refreshTray() {
    var s = NS.State.get();
    var av = Util.$('#tray-av');
    av.classList.toggle('suspect', NS.Sec.isQuarantined());
    av.innerHTML = '';
    if (NS.Sec.isQuarantined()) {
      av.appendChild(Util.svgIcon('ic-shield-bad'));
      av.title = '¡Integridad comprometida! Abre NovaShield para restaurar.';
    } else {
      av.appendChild(Util.svgIcon('ic-shield'));
      av.title = 'NovaShield — Protección nivel ' + (s.av.level + s.av.firewall);
    }
  }

  NS.Taskbar = { init: init, refresh: refresh, buildStartMenu: buildStartMenu, tickClock: tickClock, refreshTray: refreshTray, updateMoney: updateMoney };
})();
