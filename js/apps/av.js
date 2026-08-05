/* ============================================================
   NovaVista 2004 — NovaShield (antivirus y cortafuegos)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var log = [];

  function addLog(txt, cls) {
    log.unshift({ txt: txt, cls: cls || '', at: Date.now() });
    if (log.length > 30) log.length = 30;
  }

  function avBtn(id, label) {
    var S = NS.State.get();
    var def = NS.Catalog.UPGRADES[id];
    var lvl = S.upg[id] || 0;
    var cost = NS.Catalog.upgradeCost(def, lvl);
    var maxed = lvl >= def.max;
    var b = Util.el('button', {
      class: 'xp-btn small',
      text: label + ' (nivel ' + lvl + ')' + (maxed ? ' — MÁX' : ' — ' + Util.fmtMoney(cost))
    });
    b.disabled = maxed || S.currencies.cash < cost;
    b.addEventListener('click', function () {
      var r = NS.State.buyUpgrade(id);
      if (!r.ok && r.why === 'dinero') NS.UI.toast('NovaShield', 'Fondos insuficientes para la licencia.', 'important', 'ic-error');
      NS.WM.rerender('av');
    });
    return b;
  }

  function render(body) {
    var S = NS.State.get();
    body.innerHTML = '';
    body.className = 'app-pad';

    var q = NS.Sec.isQuarantined();
    if (q) {
      var warn = Util.el('div', { class: 'panel av-quarantine' });
      warn.appendChild(Util.el('div', { class: 'panel-title', text: '¡INTEGRIDAD COMPROMETIDA!' }));
      warn.appendChild(Util.el('div', { class: 'cfg-info', html:
        'NovaShield detectó que se intentó <b>modificar o manipular</b> el juego/guardado.<br><br>' +
        'Mientras el sistema esté en cuarentena, <b>no se guarda el progreso</b> y los ingresos están suspendidos.<br><br>' +
        'Soluciones:' }));
      var restore = Util.el('button', { class: 'xp-btn primary', text: 'Restaurar copia de seguridad válida' });
      restore.addEventListener('click', function () {
        var backup = NS.Save.loadBackup();
        if (!backup) {
          NS.UI.alert('NovaShield', 'No hay ninguna copia de seguridad válida. Solo queda formatear el sistema.', 'ic-error');
          return;
        }
        NS.UI.confirm('NovaShield', 'Se restaurará la última copia firmada correctamente. Todo el progreso posterior a esa copia se perderá. ¿Continuar?')
          .then(function (ok) {
            if (!ok) return;
            NS.Save.save(backup);
            NS.Sec.clearQuarantine(); // la copia restaurada es válida: fin de cuarentena
            window.location.reload();
          });
      });
      warn.appendChild(restore);
      var fmt = Util.el('button', { class: 'xp-btn danger', text: 'Formatear C: (empezar de cero)' });
      fmt.addEventListener('click', function () {
        NS.UI.confirm('Formatear', 'Se borrará todo y se generará una instalación limpia. ¿Continuar?')
          .then(function (ok) {
            if (!ok) return;
            NS.Save.wipe();
            NS.Sec.clearQuarantine();
            window.location.reload();
          });
      });
      warn.appendChild(fmt);
      body.appendChild(warn);
      return;
    }

    var cols = Util.el('div', { class: 'files-cols' });
    var left = Util.el('div', { class: 'files-col' });

    var box = Util.el('div', { class: 'panel av-box' });
    box.appendChild(Util.el('div', { class: 'panel-title', text: 'Estado de protección' }));
    var prot = 2 + (S.upg['av-level'] || 0) + (S.upg['av-fw'] || 0);
    var grade = prot >= 14 ? 'EXCELENTE' : prot >= 10 ? 'BUENA' : prot >= 6 ? 'ACEPTABLE' : 'DÉBIL';
    box.appendChild(Util.el('div', { class: 'av-grade', text: grade }));
    box.appendChild(Util.el('div', { class: 'cfg-info', html:
      'Antivirus: <b>nivel ' + (S.upg['av-level'] || 0) + '</b> · Cortafuegos: <b>nivel ' + (S.upg['av-fw'] || 0) + '</b><br>' +
      'Amenazas detenidas: <b>' + S.av.malwareStopped + '</b><br>' +
      'Probabilidad de bloquear una amenaza: <b>' + Math.round(Util.clamp(0.25 + prot * 0.075, 0, 0.95) * 100) + ' %</b>'
    }));
    left.appendChild(box);

    var bx2 = Util.el('div', { class: 'panel' });
    bx2.appendChild(Util.el('div', { class: 'panel-title', text: 'Mejoras de seguridad' }));
    bx2.appendChild(avBtn('av-level', 'Motor de antivirus'));
    bx2.appendChild(avBtn('av-fw', 'Cortafuegos'));
    left.appendChild(bx2);
    cols.appendChild(left);

    var right = Util.el('div', { class: 'files-col' });
    var bx3 = Util.el('div', { class: 'panel' });
    bx3.appendChild(Util.el('div', { class: 'panel-title', text: 'Escaneo manual' }));
    var scan = Util.el('button', { class: 'xp-btn', text: 'Analizar sistema' });
    var scanInfo = Util.el('div', { class: 'cfg-sub', text: 'Da XP y puede revelar amenazas latentes.' });
    var scanning = false;
    scan.addEventListener('click', function () {
      if (scanning) return;
      scanning = true;
      scan.disabled = true;
      scan.textContent = 'Analizando...';
      var p = 0;
      (function step() {
        p += 4 + Math.random() * 10;
        if (p >= 100) {
          scanning = false;
          scan.disabled = false;
          scan.textContent = 'Analizar sistema';
          NS.State.addXP(4 + S.av.level * 2);
          var clean = Math.random() > 0.25;
          addLog(clean ? 'Escaneo completo: ningún archivo infectado encontrado.' : 'Escaneo completo: se eliminaron 2 archivos sospechosos en cuarentena.', clean ? 'ok' : 'warn');
          NS.Audio.ok();
          NS.WM.rerender('av');
        } else {
          scan.textContent = 'Analizando... ' + Math.floor(p) + ' %';
          setTimeout(step, 60);
        }
      })();
    });
    bx3.appendChild(scan);
    bx3.appendChild(scanInfo);
    right.appendChild(bx3);

    var bx4 = Util.el('div', { class: 'panel' });
    bx4.appendChild(Util.el('div', { class: 'panel-title', text: 'Registro de eventos' }));
    if (!log.length) log.push({ txt: 'NovaShield iniciado. Protección activa.', cls: 'ok', at: Date.now() });
    log.forEach(function (l) {
      var r = Util.el('div', { class: 'mail-row' });
      var ic = Util.el('svg', { class: 'icon' });
      ic.innerHTML = '<use href="#' + (l.cls === 'warn' ? 'ic-warning' : 'ic-shield') + '"/>';
      r.appendChild(ic);
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'cfg-sub', html: Util.esc(l.txt) + ' <span style="color:#999">(' + Util.fmtClock(l.at) + ')</span>' }));
      r.appendChild(info);
      bx4.appendChild(r);
    });
    right.appendChild(bx4);
    cols.appendChild(right);

    body.appendChild(cols);
  }

  NS.Apps.register({
    id: 'av', title: 'NovaShield', icon: 'ic-shield',
    desktop: true, w: 560, h: 460, minW: 460, minH: 380,
    render: render
  });
  NS.AV = { addLog: addLog };
})();
