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

    // botones del menú inicio
    Util.$$('#start-menu [data-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-action');
        menu.classList.add('hidden');
        if (a === 'shutdown') NS.Boot.doShutdown();
        else if (a === 'restart') NS.Boot.doRestart();
      });
    });

    // acceso rápido
    var ql = Util.$('#quicklaunch');
    [['browser', 'ic-browser', 'NovaNet Explorer'], ['bank', 'ic-bank', 'Primer Banco Nova'], ['net', 'ic-net', 'Mapa de red']].forEach(function (a) {
      var b = Util.el('button', { title: a[2] });
      var svg = Util.el('svg', { class: 'icon' });
      svg.innerHTML = '<use href="#' + a[1] + '"/>';
      b.appendChild(svg);
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
      var svg = Util.el('svg', { class: 'icon' });
      svg.innerHTML = '<use href="#' + o.def.icon + '"/>';
      btn.appendChild(svg);
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
      var svg = Util.el('svg', { class: 'icon' });
      svg.innerHTML = '<use href="#' + def.icon + '"/>';
      b.appendChild(svg);
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
    var userIcon = Util.$('.sm-user-icon svg use');
    var AVS = ['ic-hacker', 'ic-users', 'ic-bot', 'ic-star', 'ic-phone', 'ic-game'];
    if (userIcon) userIcon.setAttribute('href', '#' + AVS[(NS.State.get().profile.avatar || 0) % AVS.length]);
  }

  function tickClock() {
    var el = Util.$('#tray-clock');
    if (!el) return;
    var d = new Date();
    el.innerHTML = Util.pad2(d.getHours()) + ':' + Util.pad2(d.getMinutes()) + '<br>' + Util.pad2(d.getDate()) + '/' + Util.pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function refreshTray() {
    var s = NS.State.get();
    var av = Util.$('#tray-av');
    av.classList.toggle('suspect', NS.Sec.isQuarantined());
    if (NS.Sec.isQuarantined()) {
      var svg = Util.$('svg', av);
      svg.innerHTML = '<use href="#ic-shield-bad"/>';
      av.title = '¡Integridad comprometida! Abre NovaShield para restaurar.';
    } else {
      var svg2 = Util.$('svg', av);
      svg2.innerHTML = '<use href="#ic-shield"/>';
      av.title = 'NovaShield — Protección nivel ' + (s.av.level + s.av.firewall);
    }
  }

  NS.Taskbar = { init: init, refresh: refresh, buildStartMenu: buildStartMenu, tickClock: tickClock, refreshTray: refreshTray };
})();
