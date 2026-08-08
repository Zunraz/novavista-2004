/* ============================================================
   NovaVista 2004 — NovaMessenger + MyNova Space 2004
   Chat MSN de la época + perfil MySpace super personalizado y
   amigos reales con otros jugadores del servidor en línea.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var CONTACTS = [
    {
      name: 'N0VA_SYS', status: 'online', avatar: 'ic-bot', lore: true,
      replies: ['No busques respuestas fuera. La red las conserva todas.', 'Cada actualización abre una capa y cierra otra.', 'El siguiente fragmento aparecerá cuando estés preparado.'], gift: 0
    },
    {
      name: 'Rita_04', status: 'online', avatar: 'ic-ava-girl',
      replies: [
        'jajaja qué fuerte!!',
        '¿has visto el nuevo fondo de pantalla de MyNova? es la caña',
        'te escribo desde el ciber. el teclado huele a cola...',
        'oye oye, ¿me pasas 2 $? luego te los devuelvo, prometido',
        'has probado el CTF de inspeccionar la web?? mira los comentarios HTML!!',
        'k tal tu botnet?? yo no tengo ni uno :('
      ],
      gift: 2
    },
    {
      name: 'CarlosGT', status: 'busy', avatar: 'ic-ava-boy',
      replies: [
        'estoy en medio de una partida de pinball, luego te cuento',
        'el 8Pool de la cafetería... me ganó 3 partidas seguidas. MALDITO',
        '¿sabes que puedes cobrar el premio del pinball en el banco? en efectivo',
        'prueba el nuevo mensajero: es como el MSN pero sin los anuncios',
        'los bots minan NovaCoins solos mientras duermes. invierte en botnet'
      ],
      gift: 0
    },
    {
      name: 'Luna_Star', status: 'online', avatar: 'ic-ava-cool',
      replies: [
        'holaaa! ^_^',
        'me he leído el manual de NovaVista, tiene truquillos buenos',
        'si vendes datos por la noche el precio es mejor... o eso dicen',
        '¿te gusta mi avatar? me lo hice con el selector nuevo :D',
        'no te fíes de los anuncios de "gana 1000$ ya"'
      ],
      gift: 1
    },
    {
      name: 'El_Jefe', status: 'invisible', avatar: 'ic-hacker',
      replies: [
        'No me encuentro aquí. (Mensaje automático)',
        'Recuerda: contratos, herramientas y reputación. El escritorio te marca el siguiente caso.',
        'Los implantes se compran con NovaCoins. No las malgastes en el mercado.',
        'Cuando tengas muchas NovaCoins acumuladas, formatea C: y gana legado.',
        'El sigilo es la diferencia entre cobrar y que te rastreen.'
      ],
      gift: 5
    },
    {
      name: 'CriptoPepe', status: 'online', avatar: 'ic-ava-mono',
      replies: [
        'NovaCoins a 12 $, ¡COMPRA YA! (no es consejo financiero)',
        'he minado 3 NovaCoins esta noche. la granja de bots se paga sola',
        'los CTF secundarios dan fama y pasta. 100% real no fake',
        'el precio sube y baja. compra barato, vende caro, repite',
        'no me hagas caso, soy un meme andante'
      ],
      gift: 2
    }
  ];

  var open = false;
  var selected = null;
  var chatLogEl = null;
  var typingTimer = null;
  var echoTimer = null;
  var typing = false;
  var curTab = 'chat';

  function statusLabel(st) {
    return { online: 'En línea', busy: 'Ocupado', invisible: 'Invisible' }[st] || 'En línea';
  }
  function statusColor(st) {
    return st === 'online' ? '#3e8f2a' : st === 'busy' ? '#e0a030' : '#999';
  }

  function addMsg(who, text, cls) {
    if (!chatLogEl) return;
    var row = Util.el('div', { class: 'msn-msg ' + (cls || '') });
    row.appendChild(Util.el('b', { text: who + ': ' }));
    row.appendChild(document.createTextNode(text));
    chatLogEl.appendChild(row);
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  function contactReply(contact) {
    if (typing) return;
    typing = true;
    var ta = Util.el('div', { class: 'msn-typing', text: contact.name + ' está escribiendo...' });
    chatLogEl.appendChild(ta);
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      typing = false;
      ta.remove();
      var pool = contact.replies;
      var msg = pool[Math.floor(Math.random() * pool.length)];
      addMsg(contact.name, msg, 'them');
      NS.Audio.notify();
      if (contact.gift > 0 && Math.random() < 0.3) {
        NS.State.addCash(contact.gift);
        NS.UI.toast('NovaMessenger', contact.name + ' te envió ' + Util.fmtMoney(contact.gift) + ' con un guiño.', 'good', 'ic-msn');
      }
    }, 900 + Math.random() * 1400);
  }

  function send(text) {
    var contact = selected;
    if (!contact || !text.trim()) return;
    addMsg('Tú', text.trim(), 'me');
    var input = Util.$('#msn-input');
    if (input) input.value = '';
    if (contact.status === 'invisible') {
      clearTimeout(echoTimer);
      echoTimer = setTimeout(function () { addMsg(contact.name, '... (no hay respuesta: está invisible)', 'dim'); }, 1200);
    } else {
      contactReply(contact);
    }
    NS.Audio.tick();
  }

  function prof() {
    var S = NS.State.get();
    if (!S.social.profile) S.social.profile = { mood: '', about: '', music: '', movies: '', heroes: '', looking: '', style: '#123a6e' };
    return S.social.profile;
  }

  /* ================= pestañas ================= */
  function tabs(body) {
    var tb = Util.el('div', { class: 'tabs' });
    [['chat', 'Conversaciones'], ['archivo', 'Archivo RED-NOVA'], ['perfil', 'Mi perfil'], ['amigos', 'Amigos']].forEach(function (t) {
      var b = Util.el('button', { class: 'tab-btn' + (curTab === t[0] ? ' on' : ''), text: t[1] });
      b.addEventListener('click', function () { curTab = t[0]; render(body); });
      tb.appendChild(b);
    });
    return tb;
  }

  function unlockedLore() {
    var S = NS.State.get();
    return NS.Catalog.LORE.filter(function (l) { return l.check(S); });
  }

  function renderLoreArchive(body) {
    var S = NS.State.get();
    var unlocked = unlockedLore();
    var panel = Util.el('div', { class: 'lore-archive' });
    panel.innerHTML = '<div class="lore-head"><div class="lore-signal">●</div><div><b>ARCHIVO RED-NOVA</b><span>Canal recuperado · cifrado de extremo a extremo</span></div><strong>' + unlocked.length + '/' + NS.Catalog.LORE.length + '</strong></div>';
    NS.Catalog.LORE.forEach(function (l) {
      var openChapter = l.check(S);
      var mission = NS.Catalog.LORE_OBJECTIVES[l.id];
      var missionProgress = Math.min(mission.target, Number(mission.progress(S)) || 0);
      var row = Util.el('div', { class: 'lore-chapter' + (openChapter ? ' open' : ' locked') });
      row.appendChild(Util.el('div', { class: 'lore-num', text: openChapter ? String(l.chapter).padStart(2, '0') : '??' }));
      var info = Util.el('div', { class: 'lore-copy' });
      info.appendChild(Util.el('div', { class: 'lore-title', text: openChapter ? l.title : 'FRAGMENTO CIFRADO' }));
      info.appendChild(Util.el('div', { class: 'lore-from', text: openChapter ? l.from + ' · mensaje recuperado' : 'MISIÓN: ' + mission.instruction }));
      if (!openChapter) {
        var missionBar = Util.el('div', { class: 'lore-mission-progress' });
        missionBar.innerHTML = '<i style="width:' + Math.round(missionProgress / mission.target * 100) + '%"></i><span>' + Util.fmtInt(missionProgress) + ' / ' + Util.fmtInt(mission.target) + '</span>';
        info.appendChild(missionBar);
      }
      if (openChapter) info.appendChild(Util.el('div', { class: 'lore-body', text: l.body }));
      row.appendChild(info);
      if (!openChapter) {
        var pinned = S.objectives && S.objectives.pinned && S.objectives.pinned.kind === 'lore' && S.objectives.pinned.id === l.id;
        var pin = Util.el('button', { class: 'xp-btn small pin-btn' + (pinned ? ' on' : ''), text: pinned ? '📌 Anclada' : '📌 Anclar' });
        pin.addEventListener('click', function (e) {
          e.stopPropagation();
          if (pinned) NS.State.unpinObjective(); else NS.State.pinObjective('lore', l.id);
          if (NS.Desktop.refreshGuide) NS.Desktop.refreshGuide();
          NS.State.saveNow(); render(body);
        });
        row.appendChild(pin);
      }
      if (openChapter && !S.lore.read[l.id]) row.appendChild(Util.el('span', { class: 'lore-new', text: 'NUEVO' }));
      row.addEventListener('click', function () { if (openChapter) { NS.State.markLoreRead(l.id); row.classList.add('read'); var n = Util.$('.lore-new', row); if (n) n.remove(); NS.State.saveNow(); } });
      panel.appendChild(row);
    });
    body.appendChild(panel);
  }

  /* ================= MySpace: perfil ================= */
  function renderProfile(body) {
    var p = prof();
    var cols = Util.el('div', { class: 'files-cols' });

    // columna izquierda: vista del perfil
    var left = Util.el('div', { class: 'files-col', style: { flex: '0 0 210px' } });
    var card = Util.el('div', { class: 'myspace-card' });
    card.style.background = 'linear-gradient(180deg,' + p.style + ', #000022)';
    card.appendChild(Util.svgIcon(NS.Catalog.AVATARS[(NS.State.get().profile.avatar || 0) % NS.Catalog.AVATARS.length], 'icon icon-64'));
    card.appendChild(Util.el('div', { class: 'ms-name', text: NS.State.get().profile.name }));
    card.appendChild(Util.el('div', { class: 'ms-mood', text: p.mood || 'Sin estado' }));
    card.appendChild(Util.el('div', { class: 'ms-info', text: 'Nivel ' + NS.State.get().currencies.level + ' · ' + Util.fmtInt(NS.State.get().social.followers) + ' seguidores' }));
    card.appendChild(Util.el('div', { class: 'ms-info', text: 'Elo hacker: ' + NS.Ranking.eloOf(NS.State.get()) }));
    left.appendChild(card);

    var top8 = Util.el('div', { class: 'panel' });
    top8.appendChild(Util.el('div', { class: 'panel-title', text: 'Top 8' }));
    var grid = Util.el('div', { class: 'ms-top8' });
    top8.appendChild(grid);
    left.appendChild(top8);
    // amigos del servidor para el Top 8
    if (NS.Online && NS.Online.isOnline()) {
      NS.Online.myFriends().then(function (fd) {
        var list = fd.friends.slice(0, 8);
        grid.innerHTML = '';
        if (!list.length) grid.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Aún no tienes amigos reales. ¡Hazte con alguno en la pestaña Amigos!' }));
        list.forEach(function (f) {
          var t = Util.el('div', { class: 'ms-top8-item', title: f.username });
          t.appendChild(Util.svgIcon(NS.Catalog.AVATARS[(f.avatar || 0) % NS.Catalog.AVATARS.length], 'icon icon-24'));
          t.appendChild(Util.el('div', { class: 'ms-top8-name', text: f.username.length > 8 ? f.username.slice(0, 7) + '…' : f.username }));
          t.addEventListener('click', function () { viewFriendProfile(f.username, body); });
          grid.appendChild(t);
        });
      });
    } else {
      CONTACTS.slice(0, 8).forEach(function (c) {
        var t = Util.el('div', { class: 'ms-top8-item', title: c.name });
        t.appendChild(Util.svgIcon(c.avatar, 'icon icon-24'));
        t.appendChild(Util.el('div', { class: 'ms-top8-name', text: c.name }));
        grid.appendChild(t);
      });
    }
    cols.appendChild(left);

    // columna derecha: edición
    var right = Util.el('div', { class: 'files-col' });
    var pnl = Util.el('div', { class: 'panel' });
    pnl.appendChild(Util.el('div', { class: 'panel-title', text: 'Personaliza tu MyNova Space' }));
    var flds = [
      ['mood', 'Estado (mood):', 'text', 'Ej: ¡fiestero total!'],
      ['about', 'Sobre mí:', 'text', 'Cuéntales quién eres...'],
      ['music', 'Música favorita:', 'text', 'Lo que suena en tu MP3'],
      ['movies', 'Películas:', 'text', 'Tus clásicos del videoclub'],
      ['heroes', 'Héroes:', 'text', 'A quién admiras'],
      ['looking', 'Busco:', 'text', 'Amigos, rivales, un bot...']
    ];
    flds.forEach(function (f) {
      var inp = Util.el('input', { class: 'xp-input', id: 'ms-f-' + f[0], value: p[f[0]] || '', maxlength: '80', placeholder: f[2] });
      var row = Util.el('div', { class: 'cfg-sub', text: f[1] });
      row.style.marginTop = '8px';
      pnl.appendChild(row);
      pnl.appendChild(inp);
    });
    // color de fondo
    var colorRow = Util.el('div', { class: 'trade-row', style: { marginTop: '8px', alignItems: 'center' } });
    colorRow.appendChild(Util.el('span', { class: 'cfg-sub', text: 'Color del perfil:' }));
    var colorInp = Util.el('input', { type: 'color', value: p.style || '#123a6e', style: { width: '40px', height: '26px' } });
    colorRow.appendChild(colorInp);
    pnl.appendChild(colorRow);
    var saveBtn = Util.el('button', { class: 'xp-btn primary', text: 'Guardar mi perfil' });
    saveBtn.addEventListener('click', function () {
      flds.forEach(function (f) {
        var el = Util.$('#ms-f-' + f[0]);
        if (el) p[f[0]] = el.value.trim();
      });
      p.style = colorInp.value;
      NS.State.saveNow();
      if (NS.Online && NS.Online.isOnline()) NS.Online.syncNow();
      NS.Audio.cash();
      NS.UI.toast('MyNova Space', 'Perfil actualizado. ¡Los demás jugadores ya pueden verlo!', 'good', 'ic-msn');
      renderProfile(body);
    });
    pnl.appendChild(saveBtn);
    right.appendChild(pnl);
    cols.appendChild(right);
    body.appendChild(cols);
  }

  /* ================= MySpace: ver perfil de otro jugador ================= */
  function viewFriendProfile(username, body) {
    var holder = Util.el('div', { id: 'ms-viewer' });
    holder.appendChild(Util.el('div', { class: 'cfg-info', text: 'Cargando perfil de ' + username + '…' }));
    body.appendChild(holder);
    NS.Online.getProfile(username).then(function (pf) {
      holder.innerHTML = '';
      if (!pf) { holder.appendChild(Util.el('div', { class: 'cfg-info', text: 'No se pudo cargar el perfil.' })); return; }
      var card = Util.el('div', { class: 'myspace-card' });
      card.style.background = 'linear-gradient(180deg,' + (pf.style || '#123a6e') + ', #000022)';
      card.appendChild(Util.svgIcon(NS.Catalog.AVATARS[(pf.avatar || 0) % NS.Catalog.AVATARS.length], 'icon icon-64'));
      card.appendChild(Util.el('div', { class: 'ms-name', text: pf.username }));
      card.appendChild(Util.el('div', { class: 'ms-mood', text: pf.mood || 'Sin estado' }));
      card.appendChild(Util.el('div', { class: 'ms-info', text: 'Nivel ' + pf.level + ' · ' + Util.fmtInt(pf.power) + ' PT · Elo ' + pf.elo + (pf.online ? ' · ● EN LÍNEA' : ' · ○ desconectado') }));
      card.appendChild(Util.el('div', { class: 'ms-info', text: pf.friendCount + ' amigos' }));
      holder.appendChild(card);
      var pnl = Util.el('div', { class: 'panel' });
      pnl.appendChild(Util.el('div', { class: 'panel-title', text: 'Perfil' }));
      [['Sobre mí', pf.about], ['Música', pf.music], ['Películas', pf.movies], ['Héroes', pf.heroes], ['Busca', pf.looking]].forEach(function (sec) {
        if (sec[1]) {
          pnl.appendChild(Util.el('div', { class: 'cfg-sub', html: '<b>' + Util.esc(sec[0]) + ':</b> ' + Util.esc(sec[1]) }));
        }
      });
      holder.appendChild(pnl);
      var back = Util.el('button', { class: 'xp-btn', text: 'Volver a mis amigos' });
      back.addEventListener('click', function () { render(body); });
      holder.appendChild(back);
    });
  }

  /* ================= Amigos reales ================= */
  function renderFriends(body) {
    var online = NS.Online && NS.Online.isOnline();
    if (!online) {
      var hint = Util.el('div', { class: 'panel' });
      hint.appendChild(Util.el('div', { class: 'panel-title', text: 'Amigos reales' }));
      hint.appendChild(Util.el('div', { class: 'cfg-info', html: 'Esta pestaña usa el <b>servidor en línea</b> (cuentas reales). ' +
        'Inicia sesión con tu cuenta de servidor en la pantalla de inicio para añadir amigos, ver sus perfiles MySpace y competir con ellos.<br><br>' +
        'Sin sesión puedes chatear con los contactos simulados en la pestaña <b>Conversaciones</b>.' }));
      body.appendChild(hint);
      return;
    }
    var content = Util.el('div', { class: 'files-cols' });
    var left = Util.el('div', { class: 'files-col', style: { flex: '0 0 46%' } });

    // buscar jugadores
    var p1 = Util.el('div', { class: 'panel' });
    p1.appendChild(Util.el('div', { class: 'panel-title', text: 'Buscar jugadores' }));
    var sRow = Util.el('div', { class: 'trade-row' });
    var sInp = Util.el('input', { class: 'xp-input', placeholder: 'Nombre de usuario...', style: { flex: '1' } });
    var sBtn = Util.el('button', { class: 'xp-btn small', text: 'Buscar' });
    sRow.appendChild(sInp);
    sRow.appendChild(sBtn);
    p1.appendChild(sRow);
    var results = Util.el('div', { id: 'ms-results' });
    p1.appendChild(results);
    left.appendChild(p1);

    // solicitudes entrantes
    var p2 = Util.el('div', { class: 'panel' });
    p2.appendChild(Util.el('div', { class: 'panel-title', text: 'Solicitudes entrantes' }));
    var incBox = Util.el('div', { id: 'ms-incoming' });
    incBox.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Cargando…' }));
    p2.appendChild(incBox);
    left.appendChild(p2);
    content.appendChild(left);

    var right = Util.el('div', { class: 'files-col' });
    var p3 = Util.el('div', { class: 'panel' });
    p3.appendChild(Util.el('div', { class: 'panel-title', text: 'Mis amigos' }));
    var frBox = Util.el('div', { id: 'ms-friends' });
    frBox.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Cargando…' }));
    p3.appendChild(frBox);
    right.appendChild(p3);
    content.appendChild(right);
    body.appendChild(content);

    function refreshAll() {
      NS.Online.myFriends().then(function (fd) {
        // amigos
        frBox.innerHTML = '';
        if (!fd.friends.length) frBox.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Todavía no tienes amigos. Busca jugadores y envíales una solicitud.' }));
        fd.friends.forEach(function (f) {
          var row = Util.el('div', { class: 'msn-contact' });
          row.appendChild(Util.svgIcon(NS.Catalog.AVATARS[(f.avatar || 0) % NS.Catalog.AVATARS.length], 'icon icon-24'));
          var info = Util.el('div', { style: { flex: '1' } });
          info.appendChild(Util.el('div', { class: 'msn-cname', text: f.username }));
          info.appendChild(Util.el('div', { class: 'msn-cstatus', text: (f.online ? '● En línea' : '○ Desconectado') + ' · Nv ' + f.level + ' · ' + f.elo + ' ELO' }));
          info.style.color = f.online ? '#3e8f2a' : '#999';
          row.appendChild(info);
          var ver = Util.el('button', { class: 'xp-btn small', text: 'Perfil' });
          ver.addEventListener('click', function () { viewFriendProfile(f.username, body); });
          row.appendChild(ver);
          var del = Util.el('button', { class: 'xp-btn small danger', text: '✕' });
          del.addEventListener('click', function () {
            NS.Online.removeFriend(f.username).then(function () { refreshAll(); });
          });
          row.appendChild(del);
          frBox.appendChild(row);
        });
        // solicitudes entrantes
        incBox.innerHTML = '';
        if (!fd.incoming.length) incBox.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Nada por aquí.' }));
        fd.incoming.forEach(function (f) {
          var row = Util.el('div', { class: 'msn-contact' });
          row.appendChild(Util.svgIcon(NS.Catalog.AVATARS[(f.avatar || 0) % NS.Catalog.AVATARS.length], 'icon icon-24'));
          var info2 = Util.el('div', { style: { flex: '1' } });
          info2.appendChild(Util.el('div', { class: 'msn-cname', text: f.username + ' quiere ser tu amigo' }));
          row.appendChild(info2);
          var ok = Util.el('button', { class: 'xp-btn small', text: 'Aceptar' });
          ok.addEventListener('click', function () {
            NS.Online.acceptFriend(f.username).then(function () { refreshAll(); });
          });
          row.appendChild(ok);
          incBox.appendChild(row);
        });
      });
    }

    sBtn.addEventListener('click', function () {
      var q = sInp.value.trim();
      if (!q) return;
      results.innerHTML = '';
      results.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Buscando…' }));
      NS.Online.searchUsers(q).then(function (list) {
        results.innerHTML = '';
        if (!list.length) { results.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Nadie con ese nombre.' })); return; }
        list.forEach(function (u) {
          var row = Util.el('div', { class: 'msn-contact' });
          row.appendChild(Util.svgIcon(NS.Catalog.AVATARS[(u.avatar || 0) % NS.Catalog.AVATARS.length], 'icon icon-24'));
          var info = Util.el('div', { style: { flex: '1' } });
          info.appendChild(Util.el('div', { class: 'msn-cname', text: u.username + (u.online ? ' ●' : ' ○') }));
          info.appendChild(Util.el('div', { class: 'msn-cstatus', text: 'Nv ' + u.level + ' · ' + u.elo + ' ELO' }));
          row.appendChild(info);
          var btn;
          if (u.rel === 'friend') btn = Util.el('button', { class: 'xp-btn small', text: 'Amigo ✓' });
          else if (u.rel === 'incoming') btn = Util.el('button', { class: 'xp-btn small', text: 'Aceptar' });
          else if (u.rel === 'outgoing') btn = Util.el('button', { class: 'xp-btn small', text: 'Enviada…' });
          else btn = Util.el('button', { class: 'xp-btn small', text: 'Añadir' });
          if (u.rel === 'none' || u.rel === 'incoming') {
            btn.addEventListener('click', function () {
              if (u.rel === 'incoming') NS.Online.acceptFriend(u.username);
              else NS.Online.sendFriendRequest(u.username);
              btn.disabled = true;
              btn.textContent = '...';
              btn.addEventListener('click', function () {});
              setTimeout(function () { results.innerHTML = ''; sBtn.click(); }, 600);
            });
          }
          row.appendChild(btn);
          var ver = Util.el('button', { class: 'xp-btn small', text: 'Perfil' });
          ver.addEventListener('click', function () { viewFriendProfile(u.username, body); });
          row.appendChild(ver);
          results.appendChild(row);
        });
      });
    });
    sInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') sBtn.click(); });
    refreshAll();
  }

  /* ================= render principal ================= */
  function renderChat(body) {
    var cols = Util.el('div', { class: 'msn-cols' });
    var left = Util.el('div', { class: 'msn-left' });
    left.appendChild(Util.el('div', { class: 'msn-brand', text: 'NovaMessenger' }));
    var list = Util.el('div', { class: 'msn-list' });
    var ordered = CONTACTS.slice().sort(function (a, b) {
      if (a.lore) return -1; if (b.lore) return 1;
      var rank = { online: 0, busy: 1, invisible: 2 };
      return rank[a.status] - rank[b.status] || a.name.localeCompare(b.name);
    });
    var previousStatus = '';
    ordered.forEach(function (c) {
      if (!c.lore && c.status !== previousStatus) {
        list.appendChild(Util.el('div', { class: 'msn-group', text: statusLabel(c.status) }));
        previousStatus = c.status;
      }
      var row = Util.el('div', { class: 'msn-contact' + (selected === c ? ' sel' : '') });
      row.appendChild(Util.svgIcon(c.avatar, 'icon icon-24'));
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'msn-cname', text: c.name }));
      info.appendChild(Util.el('div', { class: 'msn-cstatus', text: statusLabel(c.status) }));
      if (c.lore) info.appendChild(Util.el('div', { class: 'msn-cstatus msn-secure', text: unlockedLore().length + '/' + NS.Catalog.LORE.length + ' fragmentos · canal seguro' }));
      info.style.color = statusColor(c.status);
      row.appendChild(info);
      row.addEventListener('click', function () {
        clearTimeout(typingTimer);
        clearTimeout(echoTimer);
        typing = false;
        selected = c;
        render(body);
        chatLogEl = Util.$('.msn-chatlog');
        addMsg('Sistema', 'Conversación iniciada con ' + c.name + '. Escribe algo y responde (con suerte te da dinero).', 'dim');
      });
      list.appendChild(row);
    });
    left.appendChild(list);
    left.appendChild(Util.el('div', { class: 'msn-slogan', text: 'Conecta con tus amigos · RED-NOVA' }));

    var right = Util.el('div', { class: 'msn-right' });
    if (!selected) {
      right.appendChild(Util.el('div', { class: 'msn-empty', text: 'Selecciona un contacto de la lista para chatear. En la pestaña "Mi perfil" personaliza tu MyNova Space y en "Amigos" añade jugadores reales.' }));
    } else {
      var head = Util.el('div', { class: 'msn-chathead' });
      head.textContent = selected.name + ' — ' + statusLabel(selected.status);
      head.style.borderColor = statusColor(selected.status);
      right.appendChild(head);
      chatLogEl = Util.el('div', { class: 'msn-chatlog' });
      right.appendChild(chatLogEl);
      if (selected.lore) {
        unlockedLore().forEach(function (l) { addMsg(l.from, '[' + l.chapter + '] ' + l.body, 'them lore-msg'); NS.State.markLoreRead(l.id); });
      }
      var inpRow = Util.el('div', { class: 'msn-inputrow' });
      var inp = Util.el('input', { class: 'xp-input', id: 'msn-input', type: 'text', maxlength: '120', placeholder: 'Escribe un mensaje...' });
      var btn = Util.el('button', { class: 'xp-btn small', text: 'Enviar' });
      btn.addEventListener('click', function () { send(inp.value); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(inp.value); });
      inpRow.appendChild(inp);
      inpRow.appendChild(btn);
      right.appendChild(inpRow);
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
    }
    cols.appendChild(left);
    cols.appendChild(right);
    body.appendChild(cols);
  }

  function render(body) {
    open = true;
    body.innerHTML = '';
    body.className = 'msn-root app-pad';
    body.appendChild(tabs(body));
    if (curTab === 'chat') renderChat(body);
    else if (curTab === 'archivo') renderLoreArchive(body);
    else if (curTab === 'perfil') renderProfile(body);
    else renderFriends(body);
  }

  function tick() {
    if (!open || curTab !== 'chat' || !selected || typing) return;
    if (Math.random() < 0.003) contactReply(selected);
  }

  NS.Apps.register({
    id: 'msn', title: 'NovaMessenger', icon: 'ic-msn',
    desktop: true, w: 640, h: 480, minW: 480, minH: 380,
    render: render, tick: tick,
    onClose: function () {
      open = false;
      clearTimeout(typingTimer);
      clearTimeout(echoTimer);
      typing = false;
    }
  });
})();
