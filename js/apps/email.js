/* ============================================================
   NovaVista 2004 — Correo NovaMail (misiones y notificaciones)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var notifs = [];

  function claimableCount() {
    var s = NS.State.get();
    var n = 0;
    NS.Catalog.QUESTS.forEach(function (q) {
      var st = s.quests[q.id] || {};
      if (!st.claimed && questProgress(s, q) >= q.target) n++;
    });
    return n;
  }

  function refreshBadge() {
    if (NS.Desktop && NS.Desktop.setMailBadge) NS.Desktop.setMailBadge(claimableCount());
  }

  function notify(title, body, icon) {
    notifs.unshift({ title: title, body: body, icon: icon || 'ic-mail', at: Date.now() });
    if (notifs.length > 40) notifs.length = 40;
    refreshBadge();
    if (NS.WM.isOpen('email')) NS.WM.rerender('email');
  }

  function questProgress(s, q) {
    var v = q.check(s);
    return Math.min(v, q.target);
  }

  function render(body) {
    var S = NS.State.get();
    body.innerHTML = '';
    body.className = 'app-pad';

    var title = Util.el('div', { class: 'mail-title', text: 'Bandeja de entrada' });
    body.appendChild(title);

    var box = Util.el('div', { class: 'panel' });
    box.appendChild(Util.el('div', { class: 'panel-title', text: 'Misiones' }));
    NS.Catalog.QUESTS.forEach(function (q) {
      var st = S.quests[q.id] || {};
      var prog = questProgress(S, q);
      var done = prog >= q.target;
      var claimed = !!st.claimed;
      var r = Util.el('div', { class: 'mail-row' + (done && !claimed ? ' mail-done' : '') });
      var ic = Util.el('svg', { class: 'icon' });
      ic.innerHTML = '<use href="#' + (done ? 'ic-star' : 'ic-mail') + '"/>';
      r.appendChild(ic);
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'mail-subj', text: q.title + (claimed ? ' ✓' : '') }));
      info.appendChild(Util.el('div', { class: 'cfg-sub', text: q.desc }));
      var bar = Util.el('div', { class: 'xp-progress', style: { height: '10px', marginTop: '4px' } });
      var fill = Util.el('div', {});
      fill.style.width = Math.min(100, prog / q.target * 100) + '%';
      bar.appendChild(fill);
      info.appendChild(bar);
      info.appendChild(Util.el('div', { class: 'cfg-sub', text: Util.fmtInt(prog) + ' / ' + Util.fmtInt(q.target) + ' — Recompensa: ' + q.reward + ' NovaCoins' }));
      r.appendChild(info);
      if (done && !claimed) {
        var btn = Util.el('button', { class: 'xp-btn small primary', text: 'Reclamar' });
        btn.addEventListener('click', function () {
          S.quests[q.id] = { claimed: true, at: Date.now() };
          NS.State.addCoins(q.reward);
          NS.Audio.cash();
          NS.UI.toast('Misión completada', '«' + Util.esc(q.title) + '» — +' + q.reward + ' NovaCoins.', 'good', 'ic-coin');
          refreshBadge();
          NS.WM.rerender('email');
        });
        r.appendChild(btn);
      } else if (claimed) {
        r.appendChild(Util.el('span', { class: 'cfg-sub', text: 'reclamada' }));
      }
      box.appendChild(r);
    });
    body.appendChild(box);

    var box2 = Util.el('div', { class: 'panel' });
    box2.appendChild(Util.el('div', { class: 'panel-title', text: 'Notificaciones del sistema' }));
    if (!notifs.length) {
      box2.appendChild(Util.el('div', { class: 'cfg-info', text: 'Aún no hay notificaciones. Los resultados de tus asaltos aparecerán aquí.' }));
    } else {
      notifs.forEach(function (n) {
        var r = Util.el('div', { class: 'mail-row' });
        var ic = Util.el('svg', { class: 'icon' });
        ic.innerHTML = '<use href="#' + n.icon + '"/>';
        r.appendChild(ic);
        var info = Util.el('div', { style: { flex: '1' } });
        info.appendChild(Util.el('div', { class: 'mail-subj', text: n.title + ' — ' + Util.fmtClock(n.at) }));
        info.appendChild(Util.el('div', { class: 'cfg-sub', html: n.body }));
        r.appendChild(info);
        box2.appendChild(r);
      });
    }
    body.appendChild(box2);
  }

  NS.Apps.register({
    id: 'email', title: 'NovaMail', icon: 'ic-mail',
    desktop: true, w: 540, h: 460, minW: 440, minH: 360,
    render: render
  });
  NS.Mail = { notify: notify, refreshBadge: refreshBadge, claimableCount: claimableCount };
})();
