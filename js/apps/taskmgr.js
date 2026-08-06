/* ============================================================
   NovaVista 2004 — Administrador de tareas
   Ctrl+Alt+Supr lo abre. Lista ventanas abiertas y permite
   cerrarlas, con CPU/RAM simuladas según la carga.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad';

    var open = NS.WM.openList();
    var load = Math.min(99, 8 + open.length * 9 + Math.floor(Math.random() * 8));
    var ram = Math.min(256, 40 + open.length * 28 + Math.floor(Math.random() * 16));

    var top = Util.el('div', { class: 'panel' });
    top.appendChild(Util.el('div', { class: 'panel-title', text: 'Rendimiento' }));
    top.appendChild(Util.el('div', { class: 'cfg-info', html:
      'CPU: <b>' + load + ' %</b> · Memoria: <b>' + ram + ' / 256 MB</b><br>' +
      'Procesos: <b>' + (open.length + 6) + '</b> · Usuario: <b>' + Util.esc(NS.State.get().profile.name) + '</b>'
    }));
    body.appendChild(top);

    var list = Util.el('div', { class: 'panel' });
    list.appendChild(Util.el('div', { class: 'panel-title', text: 'Aplicaciones abiertas' }));
    if (!open.length) {
      list.appendChild(Util.el('div', { class: 'cfg-info', text: 'No hay ventanas abiertas.' }));
    } else {
      open.forEach(function (o) {
        var r = Util.el('div', { class: 'mail-row' });
        r.appendChild(Util.svgIcon(o.def.icon));
        var info = Util.el('div', { style: { flex: '1' } });
        info.appendChild(Util.el('div', { class: 'mail-subj', text: o.def.title }));
        info.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Memoria: ' + (18 + Math.floor(Math.random() * 30)) + ' MB · CPU: ' + (1 + Math.floor(Math.random() * 8)) + ' %' }));
        r.appendChild(info);
        var kill = Util.el('button', { class: 'xp-btn small danger', text: 'Finalizar' });
        kill.addEventListener('click', function () {
          NS.WM.close(o.id);
          NS.Audio.error();
          NS.WM.rerender('taskmgr');
        });
        r.appendChild(kill);
        list.appendChild(r);
      });
    }
    body.appendChild(list);

    var tip = Util.el('div', { class: 'cfg-sub', text: 'Consejo: si una ventana se "cuelga", finalízala desde aquí. El sistema no se romperá.' });
    body.appendChild(tip);
  }

  NS.Apps.register({
    id: 'taskmgr', title: 'Administrador de tareas', icon: 'ic-taskmgr',
    desktop: false, w: 480, h: 400, minW: 400, minH: 320,
    render: render
  });

  NS.TaskMgr = { open: function () { NS.WM.open('taskmgr'); } };
})();
