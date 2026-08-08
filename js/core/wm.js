/* ============================================================
   NovaVista 2004 — Gestor de ventanas
   Abrir/cerrar/minimizar/maximizar, arrastre, foco y z-order.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var defs = {};
  var wins = {};          // id -> {def, dom, body, statusbar, minimized, maximized, rect}
  var zCounter = 100;
  var cascade = 0;
  var drag = null;
  var resizing = null;

  /* Registro central de aplicaciones (metadatos para escritorio y menú inicio) */
  var appDefs = {};
  var Apps = {
    register: function (def) {
      appDefs[def.id] = def;
      NS.WM.register(def);
    },
    list: function () { return Object.keys(appDefs).map(function (k) { return appDefs[k]; }); },
    get: function (id) { return appDefs[id]; },
    desktop: function () { return Object.keys(appDefs).filter(function (k) { return appDefs[k].desktop; }).map(function (k) { return appDefs[k]; }); }
  };
  NS.Apps = Apps;

  function layer() { return Util.$('#windows-layer'); }

  function register(def) {
    def.single = def.single !== false;
    defs[def.id] = def;
  }

  function isOpen(id) { return !!wins[id]; }

  function open(id) {
    var def = defs[id];
    if (!def) return null;
    if (def.single && wins[id]) { focus(id); return wins[id]; }

    var win = { def: def, minimized: false, maximized: false, rect: null };
    var dom = Util.el('div', { class: 'window', id: 'win-' + def.id });
    var tb = Util.el('div', { class: 'win-titlebar' });
    var title = Util.el('div', { class: 'wt-title' });
    var ico = Util.svgIcon(def.icon);
    title.appendChild(ico);
    title.appendChild(Util.el('span', { text: def.title }));
    var btns = Util.el('div', { class: 'win-btns' });
    var bMin = Util.el('button', { class: 'wc-min', text: '_', title: 'Minimizar' });
    var bMax = Util.el('button', { class: 'wc-max', text: '□', title: 'Maximizar' });
    var bCls = Util.el('button', { class: 'wc-close', text: '✕', title: 'Cerrar' });
    bMin.addEventListener('click', function (e) { e.stopPropagation(); minimize(id); });
    bMax.addEventListener('click', function (e) { e.stopPropagation(); toggleMaximize(id); });
    bCls.addEventListener('click', function (e) { e.stopPropagation(); close(id); });
    btns.appendChild(bMin); btns.appendChild(bMax); btns.appendChild(bCls);
    tb.appendChild(title); tb.appendChild(btns);
    var body = Util.el('div', { class: 'win-body' });
    dom.appendChild(tb); dom.appendChild(body);

    // Tirador inferior derecho: todas las ventanas respetan su tamaño mínimo.
    var resizeHandle = Util.el('div', { class: 'win-resize', title: 'Redimensionar' });
    resizeHandle.addEventListener('mousedown', function (e) {
      if (win.maximized) return;
      focus(id);
      resizing = {
        id: id, dom: dom, x: e.clientX, y: e.clientY,
        w: dom.offsetWidth, h: dom.offsetHeight,
        minW: def.minW || 280, minH: def.minH || 160
      };
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
      e.preventDefault(); e.stopPropagation();
    });
    dom.appendChild(resizeHandle);

    // Barra de estado opcional
    if (def.status) {
      var sb = Util.el('div', { class: 'win-statusbar' });
      sb.innerHTML = '<span class="ws-status"></span><span style="flex:1"></span>';
      dom.appendChild(sb);
      win.statusbar = Util.$('.ws-status', sb);
    }

    layer().appendChild(dom);

    var w = Math.min(def.w || 480, window.innerWidth - 40);
    var h = Math.min(def.h || 360, window.innerHeight - 80);
    var x = def.x !== undefined ? def.x : 40 + (cascade % 8) * 26;
    var y = def.y !== undefined ? def.y : 20 + (cascade % 8) * 22;
    cascade++;
    dom.style.width = w + 'px';
    dom.style.height = h + 'px';
    dom.style.left = Math.max(0, x) + 'px';
    dom.style.top = Math.max(0, y) + 'px';

    wins[id] = win; win.dom = dom; win.body = body;
    dom.dataset.app = def.id;

    // arrastre
    tb.addEventListener('mousedown', function (e) { onDragStart(e, id, dom); });

    if (def.onOpen) def.onOpen(win);
    if (def.render) def.render(body, win);
    focus(id);
    refreshTaskbar();
    return win;
  }

  function onDragStart(e, id, dom) {
    if (e.target.closest('.win-btns')) return;
    if (wins[id].maximized) return;
    focus(id);
    drag = {
      id: id, dom: dom,
      dx: e.clientX - dom.offsetLeft, dy: e.clientY - dom.offsetTop,
      moved: false
    };
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    e.preventDefault();
  }
  function onDragMove(e) {
    if (!drag) return;
    drag.moved = true;
    var x = Util.clamp(e.clientX - drag.dx, -200, window.innerWidth - 40);
    var y = Util.clamp(e.clientY - drag.dy, 0, window.innerHeight - 60);
    drag.dom.style.left = x + 'px';
    drag.dom.style.top = y + 'px';
  }
  function onDragEnd() {
    drag = null;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  }
  function onResizeMove(e) {
    if (!resizing) return;
    var maxW = Math.max(resizing.minW, window.innerWidth - resizing.dom.offsetLeft);
    var maxH = Math.max(resizing.minH, window.innerHeight - resizing.dom.offsetTop - 30);
    resizing.dom.style.width = Util.clamp(resizing.w + e.clientX - resizing.x, resizing.minW, maxW) + 'px';
    resizing.dom.style.height = Util.clamp(resizing.h + e.clientY - resizing.y, resizing.minH, maxH) + 'px';
  }
  function onResizeEnd() {
    resizing = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  }

  function focus(id) {
    var win = wins[id];
    if (!win) return;
    zCounter++;
    win.dom.style.zIndex = zCounter;
    Object.keys(wins).forEach(function (k) {
      wins[k].dom.classList.toggle('focused', k === id);
    });
    if (win.minimized) { win.minimized = false; win.dom.classList.remove('minimized'); win.dom.style.display = ''; }
    refreshTaskbar();
  }

  function minimize(id) {
    var win = wins[id];
    if (!win) return;
    win.minimized = true;
    win.dom.style.display = 'none';
    refreshTaskbar();
  }

  function toggleMaximize(id) {
    var win = wins[id];
    if (!win) return;
    if (!win.maximized) {
      win.rect = { w: win.dom.style.width, h: win.dom.style.height, l: win.dom.style.left, t: win.dom.style.top };
      win.dom.classList.add('maximized');
      win.dom.style.width = '100%';
      win.dom.style.height = 'calc(100% - 0px)';
      win.dom.style.left = '0';
      win.dom.style.top = '0';
      win.maximized = true;
    } else {
      win.dom.classList.remove('maximized');
      win.dom.style.width = win.rect.w; win.dom.style.height = win.rect.h;
      win.dom.style.left = win.rect.l; win.dom.style.top = win.rect.t;
      win.maximized = false;
    }
  }

  function close(id) {
    var win = wins[id];
    if (!win) return;
    if (win.def.onClose) { try { win.def.onClose(win); } catch (e) {} }
    if (win.dom.parentNode) win.dom.parentNode.removeChild(win.dom);
    delete wins[id];
    refreshTaskbar();
  }

  function rerender(id) {
    var win = wins[id];
    if (!win) return;
    win.body.innerHTML = '';
    if (win.def.render) win.def.render(win.body, win);
  }

  function refreshTaskbar() {
    if (NS.Taskbar) NS.Taskbar.refresh();
  }

  /* Actualización periódica de apps abiertas (tick de UI) */
  function tickAll() {
    Object.keys(wins).forEach(function (id) {
      var win = wins[id];
      if (!win || win.minimized) return;
      var def = win.def;
      if (def.tick) { try { def.tick(win); } catch (e) {} }
      if (def.status && win.statusbar) {
        var txt = def.status(NS.State.get());
        win.statusbar.textContent = txt === undefined ? '' : txt;
      }
    });
  }

  function openDefs() { return defs; }
  function openList() {
    return Object.keys(wins).map(function (id) {
      return { id: id, win: wins[id], def: defs[id] };
    });
  }

  NS.WM = {
    register: register, open: open, close: close, focus: focus,
    minimize: minimize, toggleMaximize: toggleMaximize, rerender: rerender,
    isOpen: isOpen, openDefs: openDefs, openList: openList,
    tickAll: tickAll, layer: layer
  };
})();
