/* ============================================================
   NovaVista 2004 — Mis Archivos (almacén de datos e inventario)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  function upgBtn(id, label) {
    var S = NS.State.get();
    var def = NS.Catalog.UPGRADES[id];
    var lvl = S.upg[id] || 0;
    var cost = NS.Catalog.upgradeCost(def, lvl);
    var maxed = lvl >= def.max;
    var b = Util.el('button', {
      class: 'xp-btn small',
      text: label + ' (' + lvl + '/' + def.max + ') — ' + (maxed ? 'MÁX' : Util.fmtMoney(cost))
    });
    b.disabled = maxed || S.currencies.cash < cost;
    b.addEventListener('click', function () {
      var r = NS.State.buyUpgrade(id);
      if (!r.ok && r.why === 'dinero') NS.UI.toast('Mis Archivos', 'No tienes suficiente dinero.', 'important', 'ic-error');
      NS.WM.rerender('files');
    });
    return b;
  }

  function render(body) {
    var S = NS.State.get();
    body.innerHTML = '';
    body.className = 'app-pad';
    var col = Util.el('div', { class: 'files-cols' });

    // -------- Columna izquierda: almacenamiento --------
    var left = Util.el('div', { class: 'files-col' });
    var box = Util.el('div', { class: 'panel' });
    box.appendChild(Util.el('div', { class: 'panel-title', text: 'Almacenamiento de datos' }));
    box.appendChild(Util.el('div', { class: 'files-disk' }));
    var bar = Util.el('div', { class: 'xp-progress' });
    var fill = Util.el('div', { id: 'files-diskfill' });
    fill.style.width = Math.min(100, S.data.mb / S.data.maxMB * 100) + '%';
    bar.appendChild(fill);
    box.appendChild(bar);
    box.appendChild(Util.el('div', { class: 'cfg-info', id: 'files-used', text: Util.fmtBytes(S.data.mb * 1024 * 1024) + ' usados de ' + Util.fmtBytes(S.data.maxMB * 1024 * 1024) }));
    box.appendChild(Util.el('div', { class: 'cfg-info', html: 'Vendes datos a <b>' + Util.fmtMoney(NS.State.dataPrice()) + '/MB</b>.' }));
    var sell = Util.el('button', { class: 'xp-btn primary', id: 'files-sell', text: 'Vender todos los datos (' + Util.fmtMoney(S.data.mb * NS.State.dataPrice()) + ')' });
    sell.disabled = S.data.mb <= 0;
    sell.addEventListener('click', function () {
      if (S.data.mb <= 0) return;
      var mb = NS.State.sellDataMB(S.data.mb);
      NS.UI.toast('Mis Archivos', 'Vendidos ' + Util.fmtBytes(mb * 1024 * 1024) + ' de datos.', 'good', 'ic-coin');
      NS.Audio.cash();
      NS.WM.rerender('files');
    });
    box.appendChild(sell);
    left.appendChild(box);

    var bx2 = Util.el('div', { class: 'panel' });
    bx2.appendChild(Util.el('div', { class: 'panel-title', text: 'Acuerdos y hardware' }));
    bx2.appendChild(upgBtn('d-price', 'Acuerdo de datos'));
    bx2.appendChild(upgBtn('d-cap', 'Disco duro mayor'));
    left.appendChild(bx2);
    col.appendChild(left);

    // -------- Columna derecha: inventario --------
    var right = Util.el('div', { class: 'files-col' });
    var box3 = Util.el('div', { class: 'panel' });
    box3.appendChild(Util.el('div', { class: 'panel-title', text: 'Herramientas de intrusión' }));
    var any = false;
    Object.keys(NS.Catalog.TOOLS).forEach(function (tid) {
      var qty = S.inventory.tools[tid] || 0;
      if (qty <= 0) return;
      any = true;
      var def = NS.Catalog.TOOLS[tid];
      var r = Util.el('div', { class: 'inv-row' });
      var svg = Util.el('svg', { class: 'icon' });
      svg.innerHTML = '<use href="#' + def.icon + '"/>';
      r.appendChild(svg);
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { text: def.name + ' ×' + qty }));
      info.appendChild(Util.el('div', { class: 'cfg-sub', text: def.desc }));
      r.appendChild(info);
      box3.appendChild(r);
    });
    if (!any) box3.appendChild(Util.el('div', { class: 'cfg-info', text: 'Sin herramientas. Consíguelas en Descargas (navegador) o como botín en los asaltos de red.' }));
    right.appendChild(box3);

    var box4 = Util.el('div', { class: 'panel' });
    box4.appendChild(Util.el('div', { class: 'panel-title', text: 'Documentos' }));
    var docs = [
      ['ic-doc', 'leeme.txt', '«Bienvenido a NovaVista 2004. Tu PC es tu imperio. Gana dinero, fama y datos.»'],
      ['ic-doc', 'mapa_de_red.txt', '«El Mapa de Red es tu puerta al subsuelo. Conecta, escanea, drena. Y no te dejes rastrear.»'],
      ['ic-doc', 'consejo.txt', '«No vendas todos los datos: los asaltos profundos pagan mejor con payload.»']
    ];
    docs.forEach(function (d) {
      var r = Util.el('div', { class: 'inv-row clickable' });
      var svg = Util.el('svg', { class: 'icon' });
      svg.innerHTML = '<use href="#' + d[0] + '"/>';
      r.appendChild(svg);
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { text: d[1] }));
      info.appendChild(Util.el('div', { class: 'cfg-sub', text: d[2] }));
      r.appendChild(info);
      r.addEventListener('click', function () {
        NS.UI.alert(d[1], Util.esc(d[2]), 'ic-doc');
      });
      box4.appendChild(r);
    });
    right.appendChild(box4);
    col.appendChild(right);

    body.appendChild(col);
  }

  NS.Apps.register({
    id: 'files', title: 'Mis Archivos', icon: 'ic-files',
    desktop: true, w: 560, h: 440, minW: 460, minH: 360,
    render: render,
    tick: function () {
      var S = NS.State.get();
      var fill = Util.$('#files-diskfill');
      if (fill) fill.style.width = Math.min(100, S.data.mb / S.data.maxMB * 100) + '%';
      var used = Util.$('#files-used');
      if (used) used.textContent = Util.fmtBytes(S.data.mb * 1024 * 1024) + ' usados de ' + Util.fmtBytes(S.data.maxMB * 1024 * 1024);
      var sell = Util.$('#files-sell');
      if (sell) {
        sell.textContent = 'Vender todos los datos (' + Util.fmtMoney(S.data.mb * NS.State.dataPrice()) + ')';
        sell.disabled = S.data.mb <= 0;
      }
    }
  });
})();
