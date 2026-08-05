/* ============================================================
   NovaVista 2004 — Rankings locales
   Tablas de «Más poder» y «Mayor hacker (ELO)» que comparan tu
   cuenta con las demás cuentas locales y con rivales NPC.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var NPCS = [
    { name: 'Búfer',        avatar: 6,  power: 3200,    elo: 1150 },
    { name: 'Cafeína_2004', avatar: 9,  power: 9800,    elo: 1310 },
    { name: 'Ruter69',      avatar: 8,  power: 26000,   elo: 1420 },
    { name: 'Sector9',      avatar: 10, power: 74000,   elo: 1580 },
    { name: 'N0va_Fan',     avatar: 12, power: 190000,  elo: 1720 },
    { name: 'Chip_Chandler',avatar: 7,  power: 480000,  elo: 1890 },
    { name: 'DatoNegro',    avatar: 11, power: 1250000, elo: 2050 },
    { name: 'Ph4ntom',      avatar: 14, power: 3300000, elo: 2240 },
    { name: 'La_Sombra',    avatar: 13, power: 8700000, elo: 2410 },
    { name: 'ZeroCool_ES',  avatar: 15, power: 22000000, elo: 2590 },
    { name: 'MasterServidor', avatar: 0, power: 59000000, elo: 2750 },
    { name: 'NullPointer',  avatar: 10, power: 150000000, elo: 2900 }
  ];

  function implantLevels(st) {
    var n = 0;
    Object.keys(st.upg || {}).forEach(function (k) {
      if (k.indexOf('i-') === 0) n += st.upg[k];
    });
    return n;
  }
  function powerOf(st) {
    var c = st.currencies;
    var wealth = c.cash + st.bank.balance;
    return Math.floor(
      wealth +
      st.social.followers * 10 +
      st.bots.count * 1500 +
      c.novaCoins * 40 +
      c.level * 300 +
      c.legacy * 8000 +
      implantLevels(st) * 200 +
      (st.meta.bossesDrained || 0) * 500
    );
  }
  function eloOf(st) {
    var e = 1000 +
      (st.meta.bossesDrained || 0) * 150 +
      (st.meta.nodesDrained || 0) * 8 +
      (st.meta.runsDone || 0) * 25 -
      (st.meta.runsTraced || 0) * 30 +
      st.currencies.level * 20;
    return Math.max(400, e);
  }

  /* Reúne: NPCs + cuentas locales (leyendo sus guardados) + el jugador */
  function gather() {
    var rows = [];
    var myId = NS.Save.currentProfileId();
    var myIdRestore = myId;

    // cuentas locales: leer su partida (sin tocar la del jugador)
    var profs = NS.Save.listProfiles();
    try {
      profs.forEach(function (p) {
        if (p.id === myIdRestore) return;
        var saved = null;
        if (NS.Save.setProfile(p.id)) {
          var res = NS.Save.load();
          if (res.ok) saved = res.state;
        }
        if (saved) {
          rows.push({
            name: saved.profile.name, avatar: saved.profile.avatar,
            power: powerOf(saved), elo: eloOf(saved), isPlayer: false, level: saved.currencies.level
          });
        }
      });
    } finally {
      // siempre restaurar la cuenta del jugador, aunque algo falle
      if (myIdRestore) NS.Save.setProfile(myIdRestore);
    }

    // jugador actual
    var S = NS.State.get();
    rows.push({
      name: S.profile.name, avatar: S.profile.avatar,
      power: powerOf(S), elo: eloOf(S), isPlayer: true, level: S.currencies.level
    });

    // NPCs
    NPCS.forEach(function (n) {
      rows.push({ name: n.name, avatar: n.avatar, power: n.power, elo: n.elo, isPlayer: false, level: 1 + Math.floor(Math.log(n.power) / Math.LN10) });
    });

    // restaurar el perfil del jugador
    if (myId) NS.Save.setProfile(myId);
    return rows;
  }

  function rankRow(row, pos, scoreTxt, top) {
    var r = Util.el('div', { class: 'rank-row' + (row.isPlayer ? ' me' : '') });
    var posEl = Util.el('span', { class: 'rank-pos' + (top ? ' rank-top' + top : ''), text: pos + 'º' });
    r.appendChild(posEl);
    r.appendChild(Util.svgIcon(NS.Catalog.AVATARS[(row.avatar || 0) % NS.Catalog.AVATARS.length], 'icon icon-24'));
    var info = Util.el('div', { style: { flex: '1' } });
    info.appendChild(Util.el('div', { class: 'mail-subj', text: row.name + (row.isPlayer ? '  ← TÚ' : '') }));
    info.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Nivel ' + (row.level || 1) }));
    r.appendChild(info);
    r.appendChild(Util.el('span', { class: 'rank-score', text: scoreTxt }));
    return r;
  }

  function sortBy(arr, key) {
    return arr.slice().sort(function (a, b) { return b[key] - a[key]; });
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad';
    var tabs = Util.el('div', { class: 'tabs' });
    var content = Util.el('div', { class: 'tab-content' });

    function table(title, key, fmt) {
      content.innerHTML = '';
      var head = Util.el('div', { class: 'panel' });
      head.appendChild(Util.el('div', { class: 'panel-title', text: title }));
      var info = Util.el('div', { class: 'cfg-info', id: 'rank-info', text: 'Cargando…' });
      head.appendChild(info);
      content.appendChild(head);
      var list = Util.el('div', { class: 'panel' });
      content.appendChild(list);

      function paint(rows) {
        rows = rows.slice();
        var myRow = rows.filter(function (r) { return r.isPlayer; })[0];
        var myPos = rows.indexOf(myRow) + 1;
        var infoEl = Util.$('#rank-info', content);
        if (infoEl) infoEl.innerHTML = 'Tu puesto: <b>#' + myPos + ' de ' + rows.length + '</b> (' + fmt(myRow ? myRow[key] : 0) + ')';
        list.innerHTML = '';
        rows.forEach(function (row, i) {
          list.appendChild(rankRow(row, i + 1, fmt(row[key]), i < 3 ? i + 1 : 0));
        });
      }

      // rankings del servidor (cuentas reales) cuando hay sesión en línea
      var remote = NS.Online && NS.Online.isOnline() ? NS.Online.rankings(key === 'elo' ? 'elo' : 'power') : Promise.resolve(null);
      remote.then(function (serverList) {
        var rows;
        if (serverList && serverList.length) {
          var me = NS.Online.user();
          rows = serverList.map(function (r) {
            return {
              name: r.name, avatar: r.avatar, level: r.level,
              power: r.power, elo: r.elo,
              isPlayer: me ? r.name === me.username : false
            };
          });
          // añadir rivales NPC como reto permanente
          NPCS.forEach(function (n) {
            rows.push({ name: n.name, avatar: n.avatar, power: n.power, elo: n.elo, isPlayer: false, level: 1 + Math.floor(Math.log(n.power) / Math.LN10) });
          });
          paint(rows);
        } else {
          paint(gather());
        }
      }).catch(function () { paint(gather()); });
    }

    var b1 = Util.el('button', { class: 'tab-btn', text: 'Más poder' });
    b1.addEventListener('click', function () {
      Util.$$('.tab-btn', tabs).forEach(function (x) { x.classList.remove('on'); });
      b1.classList.add('on');
      table('Ranking de PODER', 'power', function (v) { return Util.fmtNum(v) + ' PT'; });
    });
    var b2 = Util.el('button', { class: 'tab-btn', text: 'Mayor hacker (ELO)' });
    b2.addEventListener('click', function () {
      Util.$$('.tab-btn', tabs).forEach(function (x) { x.classList.remove('on'); });
      b2.classList.add('on');
      table('Ranking de ELO HACKER', 'elo', function (v) { return Util.fmtInt(v) + ' ELO'; });
    });
    tabs.appendChild(b1);
    tabs.appendChild(b2);
    body.appendChild(tabs);
    body.appendChild(content);
    b1.click();
  }

  NS.Apps.register({
    id: 'ranking', title: 'Rankings NovaVista', icon: 'ic-trophy',
    desktop: true, w: 480, h: 520, minW: 420, minH: 400,
    render: render
  });
  NS.Ranking = { powerOf: powerOf, eloOf: eloOf };
})();
