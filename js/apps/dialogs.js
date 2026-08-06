/* ============================================================
   NovaVista 2004 — Interfaz de diálogos: toasts, modales,
   confirmaciones y menús contextuales.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var toastCount = 0;
  var modalStack = [];

  /* ---------------- Toasts ---------------- */
  function toast(title, body, cls, icon) {
    var wrap = Util.$('#toasts');
    if (!wrap) return;
    // Toggle "notificaciones": silencia los avisos informativos (no los importantes)
    try {
      var s = NS.State.get();
      if (s && s.settings && s.settings.notifs === false && cls !== 'important' && cls !== 'good') return;
    } catch (e) {}
    var t = Util.el('div', { class: 'toast ' + (cls || '') });
    var ic = icon || 'ic-info';
    t.appendChild(Util.svgIcon(ic, 'icon t-icon'));
    var box = Util.el('div', { style: { flex: '1' } });
    box.appendChild(Util.el('div', { class: 't-title', text: title }));
    var b = Util.el('div', { class: 't-body', html: body });
    box.appendChild(b);
    t.appendChild(box);
    var btn = Util.el('button', { class: 't-close', text: '✕', title: 'Cerrar' });
    btn.addEventListener('click', function () { t.remove(); });
    t.appendChild(btn);
    wrap.appendChild(t);
    toastCount++;
    setTimeout(function () { if (t.parentNode) t.remove(); }, cls === 'important' ? 12000 : 7000);
    while (wrap.children.length > 5) wrap.removeChild(wrap.firstChild);
  }

  /* ---------------- Diálogo modal ---------------- */
  function dialog(opts) {
    return new Promise(function (resolve) {
      var overlay = Util.el('div', {
        class: 'modal-overlay',
        style: {
          position: 'fixed', inset: '0', background: 'rgba(0,0,0,.35)',
          zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }
      });
      var box = Util.el('div', {
        class: 'window',
        style: { position: 'relative', width: Math.min(460, window.innerWidth - 60) + 'px', minHeight: '0' }
      });
      var tb = Util.el('div', { class: 'win-titlebar' });
      var title = Util.el('div', { class: 'wt-title' });
      title.appendChild(Util.svgIcon(opts.icon || 'ic-info'));
      title.appendChild(Util.el('span', { text: opts.title || 'NovaVista' }));
      tb.appendChild(title);
      box.appendChild(tb);

      var body = Util.el('div', { class: 'win-body', style: { overflow: 'auto' } });
      body.appendChild(Util.el('div', { class: 'dialog-msg', html: opts.message || '' }));
      if (opts.input) {
        var inpWrap = Util.el('div', { class: 'dialog-input' });
        var inp = Util.el('input', { class: 'xp-input', type: opts.inputType || 'text', value: opts.inputValue || '' });
        inp.style.width = '100%';
        inpWrap.appendChild(inp);
        body.appendChild(inpWrap);
      }
      var btns = Util.el('div', { class: 'dialog-btns' });
      (opts.buttons || [{ label: 'Aceptar', value: true, primary: true }]).forEach(function (b) {
        var btn = Util.el('button', {
          class: 'xp-btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : ''),
          text: b.label
        });
        btn.disabled = !!b.disabled;        btn.addEventListener('click', function () {
          overlay.remove();
          var idx = modalStack.indexOf(overlay);
          if (idx !== -1) modalStack.splice(idx, 1);
          var val = opts.input ? inp.value : b.value;
          resolve(val);
        });
        btns.appendChild(btn);
      });
      body.appendChild(btns);
      box.appendChild(body);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      modalStack.push(overlay);
      if (opts.input) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
    });
  }

  function confirm(title, message) {
    return dialog({
      title: title, icon: 'ic-warning', message: message,
      buttons: [
        { label: 'Sí', value: true, primary: true },
        { label: 'No', value: false }
      ]
    });
  }

  function alertBox(title, message, icon) {
    return dialog({ title: title, icon: icon || 'ic-info', message: message });
  }

  /* ---------------- Menú contextual ---------------- */
  function ctxMenu(x, y, items) {
    closeCtx();
    var menu = Util.el('div', { class: 'ctx-menu' });
    items.forEach(function (it) {
      if (it.sep) { menu.appendChild(Util.el('hr')); return; }
      var btn = Util.el('button', {});
      // impedir que el cierre por mousedown global destruya el menú antes del click
      btn.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      if (it.icon) {
        btn.appendChild(Util.svgIcon(it.icon));
      }
      btn.appendChild(document.createTextNode(' ' + it.label));
      btn.addEventListener('click', function () { closeCtx(); it.action && it.action(); });
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    // posicionar DESPUÉS de insertar: offsetHeight solo es fiable con el menú en el DOM
    menu.style.left = Math.min(x, window.innerWidth - 190) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - menu.offsetHeight - 10) + 'px';
    setTimeout(function () {
      document.addEventListener('mousedown', closeCtx);
      document.addEventListener('keydown', closeCtx);
    }, 10);
  }
  function closeCtx() {
    Util.$$('.ctx-menu').forEach(function (m) { m.remove(); });
    document.removeEventListener('mousedown', closeCtx);
    document.removeEventListener('keydown', closeCtx);
  }

  function closeModals() {
    modalStack.forEach(function (o) { o.remove(); });
    modalStack = [];
  }

  NS.UI = {
    toast: toast, dialog: dialog, confirm: confirm, alert: alertBox,
    ctxMenu: ctxMenu, closeCtx: closeCtx, closeModals: closeModals
  };
})();
