/* ============================================================
   NovaVista 2004 — Escritorio: iconos, selección, fondo
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var selected = null;
  var mailBadgeEl = null;

  function applyWallpaper() {
    var s = NS.State.get();
    var wp = s.settings.wallpaper || 'bliss';
    var desk = Util.$('#desktop');
    var wall = (NS.Assets && NS.Assets.walls) ? NS.Assets.walls[wp] : null;
    if (wall && wall.src) {
      // fondo fotográfico real (PNG/JPEG incrustado)
      desk.className = '';
      desk.style.backgroundImage = 'url("' + wall.src + '")';
      desk.style.backgroundSize = 'cover';
      desk.style.backgroundPosition = 'center';
    } else {
      desk.className = 'wp-' + wp;
      desk.style.backgroundImage = '';
    }
  }

  function applyTheme() {
    var s = NS.State.get();
    document.body.className = 'theme-' + (s.settings.theme || 'luna');
  }

  function buildIcons() {
    var layer = Util.$('#desktop-icons');
    layer.innerHTML = '';
    var S = NS.State.get();
    if (!S.desktopIcons) S.desktopIcons = {};
    var apps = NS.Apps.desktop();
    apps.forEach(function (def, idx) {
      var ic = Util.el('div', { class: 'desktop-icon', title: def.title });
      ic.appendChild(Util.svgIcon(def.icon, 'icon icon-32'));
      ic.appendChild(Util.el('div', { class: 'di-name', text: def.title }));
      ic.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        select(ic);
        startDrag(e, ic, def.id);
      });
      ic.addEventListener('dblclick', function () {
        NS.WM.open(def.id);
        NS.Audio.click();
      });
      if (def.id === 'email') {
        mailBadgeEl = Util.el('span', { class: 'di-badge hidden', text: '0' });
        ic.appendChild(mailBadgeEl);
      }
      // posición guardada (los iconos se recolocan libremente)
      var saved = S.desktopIcons[def.id];
      if (saved && typeof saved.x === 'number') {
        ic.style.left = saved.x + 'px';
        ic.style.top = saved.y + 'px';
      } else {
        ic.style.left = (16 + (idx % 5) * 96) + 'px';
        ic.style.top = (14 + Math.floor(idx / 5) * 92) + 'px';
      }
      layer.appendChild(ic);
    });
    // icono de papelera
    var trash = Util.el('div', { class: 'desktop-icon', title: 'Papelera de reciclaje' });
    trash.appendChild(Util.svgIcon('ic-trash', 'icon icon-32'));
    trash.appendChild(Util.el('div', { class: 'di-name', text: 'Papelera' }));
    var tSaved = S.desktopIcons['_trash'];
    if (tSaved && typeof tSaved.x === 'number') {
      trash.style.left = tSaved.x + 'px';
      trash.style.top = tSaved.y + 'px';
    } else {
      // posición por defecto: tras el último icono de la cuadrícula
      trash.style.left = (16 + (apps.length % 5) * 96) + 'px';
      trash.style.top = (14 + Math.floor(apps.length / 5) * 92) + 'px';
    }
    trash.addEventListener('mousedown', function (e) {
      e.stopPropagation();
      select(trash);
      startDrag(e, trash, '_trash');
    });
    trash.addEventListener('dblclick', function () {
      Util.UI.alert('Papelera de reciclaje', 'La papelera está vacía. (Casi todo lo borrado se vende o se pierde en este sistema).', 'ic-trash');
    });
    layer.appendChild(trash);
  }

  /* ---------- arrastrar iconos libremente ---------- */
  var dragState = null;
  function startDrag(e, iconEl, appId) {
    if (e.button !== 0) return;
    var startX = e.clientX, startY = e.clientY;
    var origLeft = iconEl.offsetLeft, origTop = iconEl.offsetTop;
    dragState = { iconEl: iconEl, appId: appId, startX: startX, startY: startY, origLeft: origLeft, origTop: origTop, moved: false };
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  }
  function onDragMove(e) {
    if (!dragState) return;
    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    dragState.moved = true;
    var desk = Util.$('#desktop');
    var dw = desk.clientWidth, dh = desk.clientHeight;
    var x = Util.clamp(dragState.origLeft + dx, 0, Math.max(0, dw - 90));
    var y = Util.clamp(dragState.origTop + dy, 0, Math.max(0, dh - 80));
    dragState.iconEl.style.left = x + 'px';
    dragState.iconEl.style.top = y + 'px';
  }
  function onDragEnd() {
    if (!dragState) return;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    if (dragState.moved) {
      var S = NS.State.get();
      S.desktopIcons[dragState.appId] = { x: dragState.iconEl.offsetLeft, y: dragState.iconEl.offsetTop };
      NS.State.saveNow();
    }
    dragState = null;
  }
  function arrangeIcons() {
    var S = NS.State.get();
    S.desktopIcons = {};
    var icons = Util.$$('.desktop-icon');
    icons.forEach(function (ic, idx) {
      ic.style.left = (16 + (idx % 5) * 96) + 'px';
      ic.style.top = (14 + Math.floor(idx / 5) * 92) + 'px';
    });
    NS.State.saveNow();
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
        if (NS.Mail && NS.Mail.refreshBadge) NS.Mail.refreshBadge();
        NS.UI.toast('Escritorio', 'Escritorio actualizado.', '', 'ic-info');
      } },
      { label: 'Organizar iconos', icon: 'ic-files', action: function () {
        arrangeIcons();
        NS.UI.toast('Escritorio', 'Iconos ordenados en cuadrícula.', '', 'ic-files');
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

  /* Badge de correo sin leer en el icono del escritorio */
  function setMailBadge(n) {
    n = Math.max(0, Math.floor(n));
    if (!mailBadgeEl) return;
    if (n <= 0) {
      mailBadgeEl.classList.add('hidden');
      mailBadgeEl.textContent = '0';
    } else {
      mailBadgeEl.classList.remove('hidden');
      mailBadgeEl.textContent = n > 99 ? '99+' : String(n);
    }
  }

  NS.Desktop = {
    buildIcons: buildIcons, select: select, clearSelection: clearSelection,
    refresh: refresh, onContext: onDesktopContext, setMailBadge: setMailBadge,
    arrangeIcons: arrangeIcons
  };
})();
