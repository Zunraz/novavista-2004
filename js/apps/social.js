/* ============================================================
   NovaVista 2004 — MyNova (red social)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var AVATARS = NS.Catalog.AVATARS;
  var SLOGANS = [
    '¡He conectado con gente de todo el mundo!',
    'Hoy subiré fotos de mi nuevo PC.',
    '¿Alguien más usa NovaVista 2004?',
    'Mi botnet llega a 5 bots, ¡genial!',
    'Interés bancario pasivo: la clave del éxito.',
    'El rastreo de red me pone nervioso...',
    'Descubrí un nodo secreto en la red. No cuentes a nadie.'
  ];

  function upgBtn(id, label) {
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
      if (!r.ok && r.why === 'dinero') NS.UI.toast('MyNova', 'No tienes suficiente dinero.', 'important', 'ic-error');
      NS.WM.rerender('social');
    });
    return b;
  }

  function render(body) {
    var S = NS.State.get();
    body.innerHTML = '';
    body.className = 'app-pad';
    var col = Util.el('div', { class: 'files-cols' });

    // -------- Perfil --------
    var left = Util.el('div', { class: 'files-col' });
    var prof = Util.el('div', { class: 'myspace-profile' });
    var head = Util.el('div', { class: 'myspace-head', text: S.profile.name + ' est@n en MyNova' });
    prof.appendChild(head);
    var inner = Util.el('div', { class: 'myspace-inner' });
    var av = Util.el('svg', { class: 'icon icon-64' });
    av.innerHTML = '<use href="#' + AVATARS[S.profile.avatar % AVATARS.length] + '"/>';
    inner.appendChild(av);
    var info = Util.el('div', { style: { flex: '1' } });
    info.appendChild(Util.el('div', { class: 'myspace-name', text: S.profile.name }));
    info.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Última conexión: ahora mismo' }));
    info.appendChild(Util.el('div', { class: 'cfg-sub', text: SLOGANS[Math.floor(S.profile.avatar % SLOGANS.length)] }));
    inner.appendChild(info);
    prof.appendChild(inner);
    left.appendChild(prof);

    var stats = Util.el('div', { class: 'panel' });
    stats.appendChild(Util.el('div', { class: 'panel-title', text: 'Tus cifras' }));
    stats.appendChild(Util.el('div', { class: 'social-big', text: Util.fmtInt(S.social.followers) + ' seguidores' }));
    stats.appendChild(Util.el('div', { class: 'cfg-info', html:
      'Ingresos por publicidad: <b>' + Util.fmtMoney(S.social.followers * NS.State.socialAdRate()) + '/s</b><br>' +
      'Crecimiento orgánico: <b>' + Util.fmtNum(S.social.followers * NS.State.followerGrowthRate()) + ' seg/s</b><br>' +
      'Publicaciones: <b>' + S.social.totalPosts + '</b> · Mejor viralidad: <b>' + (S.social.viralBest || 0).toFixed(2).replace('.', ',') + '×</b>'
    }));
    left.appendChild(stats);

    var p2 = Util.el('div', { class: 'panel' });
    p2.appendChild(Util.el('div', { class: 'panel-title', text: 'Mejoras de MyNova' }));
    p2.appendChild(upgBtn('s-post', 'Cámara digital'));
    p2.appendChild(upgBtn('s-ad', 'Agencia de anuncios'));
    p2.appendChild(upgBtn('s-vrf', 'Chapa verificada'));
    left.appendChild(p2);
    col.appendChild(left);

    // -------- Publicar --------
    var right = Util.el('div', { class: 'files-col' });
    var pub = Util.el('div', { class: 'panel' });
    pub.appendChild(Util.el('div', { class: 'panel-title', text: 'Escribe una publicación' }));
    var ta = Util.el('textarea', { class: 'xp-input post-box', maxlength: '200', placeholder: '¿Qué estás haciendo, ' + S.profile.name + '?' });
    pub.appendChild(ta);
    var btn = Util.el('button', { class: 'xp-btn primary', text: 'Publicar ahora' });
    btn.addEventListener('click', function () {
      var txt = ta.value.trim() || SLOGANS[Math.floor(Math.random() * SLOGANS.length)];
      var gained = NS.State.makePost();
      NS.Mail.notify('Publicación en MyNova', '«' + Util.esc(txt.slice(0, 60)) + '…» ganó <b>' + Util.fmtInt(gained) + ' seguidores</b>.', 'ic-social');
      NS.Audio.cash();
      NS.WM.rerender('social');
    });
    pub.appendChild(btn);
    pub.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Cada publicación da un golpe de seguidores con viralidad aleatoria (0,5× a 1,7×). El crecimiento pasivo viene de la chapa verificada.' }));
    right.appendChild(pub);

    var feed = Util.el('div', { class: 'panel' });
    feed.appendChild(Util.el('div', { class: 'panel-title', text: 'Últimas publicaciones de tus contactos' }));
    var posts = [
      ['ic-game', 'xX_NovaGamer_Xx', '¡He llegado al nivel 99 en el minijuego del navegador! (hace 2 min)'],
      ['ic-bot', 'BotMaster_77', 'Mi granja de bots ya mina 0.5 NC/min 🔥 (hace 8 min)'],
      ['ic-phone', 'Sara_2004', 'Nuevo wallpaper de atardecer digital, ¿qué opináis? (hace 15 min)'],
      ['ic-star', 'CriptoPepe', 'Compré NovaCoins a 9 $, ¡van a volar! (hace 30 min)']
    ];
    posts.forEach(function (p) {
      var r = Util.el('div', { class: 'mail-row' });
      var ic = Util.el('svg', { class: 'icon' });
      ic.innerHTML = '<use href="#' + p[0] + '"/>';
      r.appendChild(ic);
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'mail-subj', text: p[1] }));
      info.appendChild(Util.el('div', { class: 'cfg-sub', text: p[2] }));
      r.appendChild(info);
      feed.appendChild(r);
    });
    right.appendChild(feed);
    col.appendChild(right);

    body.appendChild(col);
  }

  NS.Apps.register({
    id: 'social', title: 'MyNova', icon: 'ic-social',
    desktop: true, w: 580, h: 480, minW: 480, minH: 400,
    render: render
  });
})();
