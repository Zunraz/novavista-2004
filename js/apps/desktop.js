/* ============================================================
   NovaVista 2004 — Escritorio: iconos, selección, fondo
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var selected = null;

  function applyWallpaper() {
    var s = NS.State.get();
    var wp = s.settings.wallpaper || 'bliss';
    var desk = Util.$('#desktop');
    desk.className = 'wp-' + wp;
  }

  function applyTheme() {
    var s = NS.State.get();
    document.body.className = 'theme-' + (s.settings.theme || 'luna');
  }

  function buildIcons() {
    var layer = Util.$('#desktop-icons');
    layer.innerHTML = '';
    var apps = NS.Apps.desktop();
    apps.forEach(function (def) {
      var ic = Util.el('div', { class: 'desktop-icon', title: def.title });
      var svg = Util.el('svg', { class: 'icon icon-32' });
      svg.innerHTML = '<use href="#' + def.icon + '"/>';
      ic.appendChild(svg);
      ic.appendChild(Util.el('div', { class: 'di-name', text: def.title }));
      ic.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        select(ic);
      });
      ic.addEventListener('dblclick', function () {
        NS.WM.open(def.id);
        NS.Audio.click();
      });
      layer.appendChild(ic);
    });
    // icono de papelera
    var trash = Util.el('div', { class: 'desktop-icon', title: 'Papelera de reciclaje' });
    var svg2 = Util.el('svg', { class: 'icon icon-32' });
    svg2.innerHTML = '<use href="#ic-trash"/>';
    trash.appendChild(svg2);
    trash.appendChild(Util.el('div', { class: 'di-name', text: 'Papelera' }));
    trash.addEventListener('dblclick', function () {
      Util.UI.alert('Papelera de reciclaje', 'La papelera está vacía. (Casi todo lo borrado se vende o se pierde en este sistema).', 'ic-trash');
    });
    layer.appendChild(trash);
  }

  function select(iconEl) {
    if (selected) selected.classList.remove('sel');
    selected = iconEl;
    if (selected) selected.classList.add('sel');
  }

  function clearSelection() {
    if (selected) { selected.classList.remove('sel'); selected = null; }
  }

  function onDesktopContext(e) {
    e.preventDefault();
    e.stopPropagation();
    NS.UI.ctxMenu(e.clientX, e.clientY, [
      { label: 'Actualizar', icon: 'ic-gear', action: function () {
        Util.$('#desktop-icons').innerHTML = '';
        buildIcons();
        NS.UI.toast('Escritorio', 'Escritorio actualizado.', '', 'ic-info');
      } },
      { label: 'Propiedades', icon: 'ic-settings', action: function () { NS.WM.open('settings'); } },
      { sep: true },
      { label: 'Abrir terminal', icon: 'ic-terminal', action: function () { NS.WM.open('terminal'); } },
      { label: 'Abrir navegador', icon: 'ic-browser', action: function () { NS.WM.open('browser'); } }
    ]);
  }

  function refresh() {
    applyWallpaper();
    applyTheme();
  }

  NS.Desktop = {
    buildIcons: buildIcons, select: select, clearSelection: clearSelection,
    refresh: refresh, onContext: onDesktopContext
  };
})();
