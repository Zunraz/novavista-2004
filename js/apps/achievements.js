/* NovaVista 2004 — Sala de Trofeos */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  function progress(s, a) { return Math.max(0, Math.min(a.target, Number(a.check(s)) || 0)); }
  function rewardText(a) { return a.type === 'coins' ? a.reward + ' NovaCoins' : Util.fmtMoney(a.reward); }

  function render(body) {
    var S = NS.State.get();
    var list = NS.Catalog.ACHIEVEMENTS;
    var unlocked = list.filter(function (a) { return progress(S, a) >= a.target; }).length;
    var claimed = list.filter(function (a) { return S.achievements[a.id] && S.achievements[a.id].claimed; }).length;
    body.className = 'trophy-app';
    body.innerHTML = '<div class="trophy-hero"><div class="trophy-hero-icon"></div><div><div class="trophy-kicker">PERFIL DE OPERADOR</div><h2>Sala de Trofeos</h2><p>Haz historia en cada rincón de NovaVista.</p></div><div class="trophy-total"><b>' + unlocked + '/' + list.length + '</b><span>desbloqueados</span></div></div>' +
      '<div class="trophy-overall"><span>Progreso total</span><div class="trophy-bar"><i style="width:' + Math.round(unlocked / list.length * 100) + '%"></i></div><b>' + claimed + ' reclamados</b></div><div class="trophy-grid"></div>';
    var grid = Util.$('.trophy-grid', body);
    list.forEach(function (a) {
      var p = progress(S, a), done = p >= a.target;
      var isClaimed = !!(S.achievements[a.id] && S.achievements[a.id].claimed);
      var card = Util.el('div', { class: 'trophy-card trophy-' + a.tier + (done ? ' unlocked' : '') + (isClaimed ? ' claimed' : '') });
      var badge = Util.el('div', { class: 'trophy-badge' }); badge.appendChild(Util.svgIcon(done ? a.icon : 'ic-lock')); card.appendChild(badge);
      var info = Util.el('div', { class: 'trophy-info' });
      info.appendChild(Util.el('div', { class: 'trophy-tier', text: a.tier }));
      info.appendChild(Util.el('div', { class: 'trophy-name', text: done ? a.title : 'Logro oculto' }));
      info.appendChild(Util.el('div', { class: 'trophy-desc', text: a.desc }));
      var bar = Util.el('div', { class: 'trophy-card-bar' }); var fill = Util.el('i'); fill.style.width = Math.round(p / a.target * 100) + '%'; bar.appendChild(fill); info.appendChild(bar);
      info.appendChild(Util.el('div', { class: 'trophy-numbers', text: Util.fmtInt(p) + ' / ' + Util.fmtInt(a.target) })); card.appendChild(info);
      var action = Util.el('div', { class: 'trophy-action' });
      action.appendChild(Util.el('div', { class: 'trophy-reward', text: rewardText(a) }));
      if (done && !isClaimed) {
        var btn = Util.el('button', { class: 'xp-btn primary small', text: 'Reclamar' });
        btn.addEventListener('click', function () {
          var res = NS.State.claimAchievement(a.id);
          if (res.ok) { NS.Audio.cash(); NS.UI.toast('Trofeo desbloqueado', a.title + ' · +' + rewardText(a), 'good', 'ic-trophy'); NS.WM.rerender('achievements'); }
        }); action.appendChild(btn);
      } else action.appendChild(Util.el('span', { class: 'trophy-status', text: isClaimed ? '✓ En la vitrina' : 'Bloqueado' }));
      card.appendChild(action); grid.appendChild(card);
    });
  }

  NS.Apps.register({ id: 'achievements', title: 'Sala de Trofeos', icon: 'ic-trophy', desktop: true, w: 720, h: 570, minW: 480, minH: 400, render: render });
  NS.Achievements = { progress: progress };
})();
