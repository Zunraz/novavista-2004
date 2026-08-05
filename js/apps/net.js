/* ============================================================
   NovaVista 2004 — Mapa de Red (núcleo roguelite)
   Asaltos procedurales: nodos, firewall, rastro, energía,
   botín, implantes meta y legado.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  /* ================= generación de asaltos (puro) ================= */
  var NAMES = {
    home: ['PC de Ana', 'PC de Roberto', 'PC familiar', 'PC de la vecina'],
    cafe: ['CiberCafé NovaNet', 'Ciber@24 horas', 'Café Internet El Navegante'],
    office: ['Oficina de diseño XS', 'Gestoría El Águila', 'Despacho López y Cía'],
    news: ['Servidor NovaNoticias', 'Portal de deportes Golazo'],
    bank: ['Banco del Sur S.A.', 'Caja de Ahorros Nova', 'Crédito Hipotecario Global'],
    corp: ['MegaSoft Corp', 'DataCorp Central', 'Telefónica del Norte'],
    dark: ['Nodo Oscuro #7', 'Bazar del Subsuelo', 'Servidor Fantasma']
  };

  function genNode(rng, kind, lvl, name, conn) {
    var fw = 1 + Math.floor(lvl / 2) + (rng() < 0.45 ? 1 : 0);
    var vulns = [];
    var pool = ['buffer', 'openport', 'weakpass', 'backdoor'];
    var nv = rng() < 0.3 ? 0 : rng() < 0.7 ? 1 : 2;
    for (var i = 0; i < nv; i++) {
      var v = pool[Math.floor(rng() * pool.length)];
      if (vulns.indexOf(v) === -1) vulns.push(v);
    }
    return {
      id: 'n' + Math.floor(rng() * 1e9).toString(36),
      kind: kind, name: name,
      lvl: lvl,
      fw: kind === 'isp' ? 0 : fw,
      fwMax: fw,
      trace: 3 + lvl * 2 + Math.floor(rng() * 4),
      data: Math.round(Math.pow(lvl, 1.35) * 15 * (0.8 + rng() * 0.6)),
      cash: Math.round(Math.pow(lvl, 2.05) * 40 * (0.8 + rng() * 0.5)),
      coins: kind === 'dark' ? 2 + Math.floor(rng() * 4) : 0,
      coinsChance: kind === 'dark' ? 0.65 : kind === 'boss' ? 1 : 0,
      vulns: vulns,
      conn: conn || [],
      explored: kind === 'isp',
      drained: false,
      usedVulns: {}
    };
  }

  function genRun(seed) {
    var rng = Util.mulberry32(seed >>> 0);
    var nodes = [];
    var boss;

    var isp = genNode(rng, 'isp', 0, 'Proveedor ISP (tú)', []);
    nodes.push(isp);

    function addLayer(count, kinds, lvlMin, lvlMax) {
      var layer = [];
      for (var i = 0; i < count; i++) {
        var k = kinds[Math.floor(rng() * kinds.length)];
        var lvl = lvlMin + Math.floor(rng() * (lvlMax - lvlMin + 1));
        var n = genNode(rng, k, lvl, NAMES[k][Math.floor(rng() * NAMES[k].length)], []);
        nodes.push(n);
        layer.push(n);
      }
      return layer;
    }

    var d1 = addLayer(2 + Math.floor(rng() * 2), ['home', 'home', 'cafe'], 1, 3);
    var d2 = addLayer(2 + Math.floor(rng() * 2), ['office', 'office', 'news'], 3, 5);
    var d3 = addLayer(1 + Math.floor(rng() * 2), ['bank', 'bank', 'corp'], 5, 8);
    var d4 = addLayer(1, ['dark'], 7, 9);
    boss = genNode(rng, 'boss', 10, 'MASTER SERVER', []);
    boss.data = 4000 + Math.floor(rng() * 2000);
    boss.cash = 25000 + Math.floor(rng() * 15000);
    boss.coins = 8 + Math.floor(rng() * 10);
    nodes.push(boss);

    // conexiones
    isp.conn = d1.map(function (n) { return n.id; });
    function wire(prev, next) {
      prev.forEach(function (p, i) {
        var targets = next.slice();
        // al menos 1, a veces 2
        var picks = 1 + (rng() < 0.6 ? 1 : 0);
        for (var k = 0; k < picks && targets.length; k++) {
          var t = targets.splice(Math.floor(rng() * targets.length), 1)[0];
          p.conn.push(t.id);
        }
        if (!p.conn.length && next.length) p.conn.push(next[0].id);
      });
    }
    wire(d1, d2);
    wire(d2, d3);
    wire(d3, d4);
    d4.forEach(function (n) { n.conn.push(boss.id); });
    // conexión extra opcional d2 -> boss para variedad
    if (rng() < 0.3) d2[Math.floor(rng() * d2.length)].conn.push(boss.id);

    return {
      seed: seed, nodes: nodes, ispId: isp.id, bossId: boss.id,
      trace: 0, loot: { data: 0, cash: 0 }, tools: {},
      status: 'active', startedAt: Date.now(), mapRevealed: false,
      summary: null
    };
  }

  /* ================= estado del asalto ================= */
  function nodeById(run, id) {
    for (var i = 0; i < run.nodes.length; i++) if (run.nodes[i].id === id) return run.nodes[i];
    return null;
  }
  function isReachable(run, node) {
    if (node.kind === 'isp') return true;
    // un nodo es alcanzable si algún nodo que apunta a él (su "padre") está drenado
    for (var i = 0; i < run.nodes.length; i++) {
      var p = run.nodes[i];
      if (p.id === node.id) continue;
      if ((p.kind === 'isp' || p.drained) && p.conn.indexOf(node.id) !== -1) return true;
    }
    return false;
  }
  function hasTool(run, tid) {
    if (run.tools[tid] > 0) return true;
    return (NS.State.get().inventory.tools[tid] || 0) > 0;
  }
  function takeTool(run, tid) {
    if (run.tools[tid] > 0) { run.tools[tid]--; return true; }
    if (NS.State.useTool(tid)) return true;
    return false;
  }
  function traceRisk(run, node) {
    var S = NS.State.get();
    var stealth = 1 - 0.04 * (S.upg['i-stealth'] || 0);
    return Math.max(1, node.trace * stealth * (0.85 + Math.random() * 0.3));
  }
  function addTrace(run, node) {
    run.trace += traceRisk(run, node);
    if (run.trace >= 100) {
      run.trace = 100;
      traced(run);
      return true;
    }
    return false;
  }
  function spendE(n) {
    if (!NS.State.spendEnergy(n)) return false;
    return true;
  }
  function lootMult() {
    var S = NS.State.get();
    return 1 + 0.1 * (S.upg['i-loot'] || 0);
  }
  function toolDropChance() {
    var S = NS.State.get();
    return 0.12 + 0.04 * (S.upg['i-tools'] || 0);
  }

  /* ================= acciones ================= */
  function actScan(run, node) {
    if (!isReachable(run, node)) return log('err', 'No puedes alcanzar «' + node.name + '» todavía. Drena antes un nodo conectado.');
    if (!spendE(1)) return log('err', 'Energía insuficiente.');
    node.explored = true;
    var vulnTxt = node.vulns.length ? node.vulns.map(vulnName).join(', ') : 'ninguna conocida';
    log('ok', 'ESCANEO de ' + node.name + ' (nivel ' + node.lvl + ')');
    log('dim', '  Firewall: ' + '▓'.repeat(node.fw) + '░'.repeat(node.fwMax - node.fw) + ' · Vulnerabilidades: ' + vulnTxt);
    log('dim', '  Botín estimado: ' + Util.fmtBytes(node.data * 1024 * 1024) + ' · ' + Util.fmtMoney(node.cash) + (node.coinsChance > 0 ? ' · posible monedas' : ''));
    addTrace(run, node);
    NS.State.addXP(2);
    NS.Audio.tick();
    refresh();
  }
  function actCrack(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.fw <= 0) return log('dim', 'El firewall de ' + node.name + ' ya está caído. Usa UPLOAD.');
    if (!spendE(1)) return log('err', 'Energía insuficiente.');
    var S = NS.State.get();
    var chance = 0.55 + 0.12 * (S.upg['i-cpu'] || 0);
    if (node.usedVulns.openport) chance += 0.25;
    var autoWin = node.usedVulns.weakpass ? false : (node.vulns.indexOf('weakpass') !== -1);
    if (autoWin) { node.usedVulns.weakpass = true; chance = 1; }
    chance = Util.clamp(chance, 0.15, 0.95);
    if (Math.random() < chance) {
      node.fw--;
      log('ok', 'CRACK exitoso en ' + node.name + ' — capa de firewall eliminada (' + node.fw + ' restantes).');
      NS.State.addXP(3);
      NS.Audio.hack();
    } else {
      log('warn', 'CRACK fallido en ' + node.name + '. Aumenta el rastro...');
      NS.Audio.error();
    }
    addTrace(run, node);
    refresh();
  }
  function actExploit(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.fw <= 0) return log('dim', 'Sin firewall que explotar.');
    var usesTool = false;
    if (node.vulns.indexOf('buffer') === -1 && !hasTool(run, 'exploit')) {
      return log('err', 'No hay vulnerabilidad de desbordamiento conocida en ' + node.name + '. Escanéalo antes o usa un Kit de explotación.');
    }
    if (!spendE(1)) return log('err', 'Energía insuficiente.');
    // la energía se cobra antes de consumir la herramienta: nunca se pierde un kit en vano
    if (node.vulns.indexOf('buffer') === -1) { takeTool(run, 'exploit'); usesTool = true; }
    node.usedVulns.buffer = true;
    node.fw = Math.max(0, node.fw - 1);
    log('ok', 'EXPLOIT aplicado' + (usesTool ? ' (kit de explotación)' : ' (desbordamiento)') + '. Capa eliminada sin rastro (' + node.fw + ' restantes).');
    NS.State.addXP(4);
    NS.Audio.hack();
    refresh();
  }
  function actBruteforce(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.fw <= 0) return log('dim', 'El firewall ya está caído.');
    if (!spendE(2)) return log('err', 'Energía insuficiente (cuesta 2).');
    node.fw--;
    log('warn', 'BRUTEFORCE: capa rota a la fuerza (' + node.fw + ' restantes). El rastro aumenta mucho.');
    addTrace(run, node);
    addTrace(run, node);
    NS.State.addXP(2);
    NS.Audio.error();
    refresh();
  }
  function actUpload(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.drained) return log('dim', 'Ya drenaste ' + node.name + '.');
    if (node.fw > 0) return log('err', 'El firewall de ' + node.name + ' sigue activo (' + node.fw + ' capas).');
    if (!spendE(2)) return log('err', 'Energía insuficiente (cuesta 2).');

    var payloadUsed = false;
    if (hasTool(run, 'payload')) {
      takeTool(run, 'payload');
      payloadUsed = true;
      log('ok', 'Payload cifrado inyectado: +40 % de datos.');
    }
    var mult = lootMult() * (payloadUsed ? 1.4 : 1);
    var d = Math.round(node.data * mult);
    var c = Math.round(node.cash * mult);
    run.loot.data += d;
    run.loot.cash += c;
    node.drained = true;
    NS.State.get().stats.hacks++;
    NS.State.get().meta.nodesDrained++;
    NS.State.addXP(6 + node.lvl * 2);

    var msg = 'UPLOAD completado en ' + node.name + ' — +' + Util.fmtBytes(d * 1024 * 1024) + ' de datos y ' + Util.fmtMoney(c) + ' al botín.';
    if (node.coinsChance > 0 && (node.kind === 'boss' || Math.random() < node.coinsChance)) {
      NS.State.addCoins(node.coins);
      msg += ' ¡+' + node.coins + ' NovaCoins a tu cartera!';
    }
    log('ok', msg);
    NS.Audio.hack();

    // caída de herramienta
    if (Math.random() < toolDropChance()) {
      var tids = Object.keys(NS.Catalog.TOOLS);
      var tid = tids[Math.floor(Math.random() * tids.length)];
      NS.State.get().inventory.tools[tid] = (NS.State.get().inventory.tools[tid] || 0) + 1;
      log('dim', 'Botín extra: 1× ' + NS.Catalog.TOOLS[tid].name + '.');
    }

    addTrace(run, node);
    if (node.kind === 'boss') {
      run.status = 'done';
      run.summary = 'victory';
      var bonus = 10 + Math.floor(Math.random() * 15);
      NS.State.addCoins(bonus);
      NS.State.addXP(60);
      NS.State.get().meta.bossesDrained++;
      log('ok', '★★★★★ MASTER SERVER DRENADO — ASALTO COMPLETADO ★★★★★');
      log('ok', 'Bonus de victoria: +' + bonus + ' NovaCoins y +60 XP.');
      NS.Audio.startup();
      endRun(true);
    }
    refresh();
  }
  function actStealth(run) {
    if (!spendE(1)) return log('err', 'Energía insuficiente.');
    run.trace = Math.floor(run.trace * 0.7);
    log('ok', 'SIGILO activado. Rastro reducido al 70 % (' + Math.floor(run.trace) + ').');
    NS.State.addXP(1);
    NS.Audio.tick();
    refresh();
  }
  function actProxy(run) {
    if (!takeTool(run, 'proxy')) return log('err', 'No tienes servidores proxy.');
    run.trace = Math.floor(run.trace * 0.5);
    log('ok', 'PROXY quemado. Rastro reducido a la mitad (' + Math.floor(run.trace) + ').');
    NS.Audio.tick();
    refresh();
  }
  function actWorm(run) {
    if (!takeTool(run, 'worm')) return log('err', 'No tienes gusanos.');
    NS.State.addEnergy(8);
    log('ok', 'GUSANO desplegado: +8 de energía (' + NS.State.get().currencies.energy + '/max).');
    NS.Audio.ok();
    refresh();
  }
  function actIcmp(run) {
    if (!takeTool(run, 'icmp')) return log('err', 'No tienes túneles ICMP.');
    run.mapRevealed = true;
    run.nodes.forEach(function (n) { n.explored = true; });
    log('ok', 'TÚNEL ICMP: se ha revelado todo el mapa de red.');
    NS.Audio.ok();
    refresh();
  }
  function actDecrypt(run, node) {
    if (!node || !node.explored) return log('err', 'Selecciona y escanea antes un nodo.');
    var extra = ['buffer', 'openport', 'weakpass', 'backdoor'].filter(function (v) { return node.vulns.indexOf(v) === -1; });
    if (!extra.length) { log('dim', 'El nodo no tiene más vulnerabilidades que revelar.'); return; }
    if (!takeTool(run, 'decrypt')) return log('err', 'No tienes descifradores.');
    var v = extra[Math.floor(Math.random() * extra.length)];
    node.vulns.push(v);
    log('ok', 'DESCIFRADOR: vulnerabilidad revelada — ' + vulnName(v));
    refresh();
  }
  function actDisconnect(run) {
    log('dim', 'Desconectando de la red...');
    NS.Audio.tick();
    endRun(false);
  }
  function vulnName(v) {
    return { buffer: 'desbordamiento', openport: 'puerto abierto', weakpass: 'contraseña débil', backdoor: 'puerta trasera' }[v] || v;
  }

  /* ================= finalizar asalto ================= */
  function commitLoot(run) {
    var S = NS.State.get();
    var added = NS.State.addDataMB(run.loot.data);
    NS.State.addCash(run.loot.cash);
    return { data: added, cash: run.loot.cash };
  }
  function endRun(victoryRun) {
    var S = NS.State.get();
    var run = S.run;
    if (!run) return;
    S.run = null;
    var bonusXP = 0;
    var drained = 0;
    run.nodes.forEach(function (n) { if (n.drained) drained++; });

    if (run.status === 'traced') {
      S.meta.runsTraced++;
      NS.UI.toast('¡RASTREADO!', 'Te localizaron y perdiste el botín sin cobrar. Mantuviste las NovaCoins obtenidas.', 'important', 'ic-error');
      NS.Audio.trace();
      NS.Mail.notify('Alerta de rastreo', 'El asalto a la red terminó mal: te rastrearon y el botín se perdió. <b>Consejo:</b> usa stealth antes de cada acción y guarda proxies.', 'ic-error');
      refresh();
      return;
    }

    var loot = commitLoot(run);
    bonusXP = drained * 4;
    NS.State.addXP(bonusXP);
    S.meta.runsDone++;
    S.stats.traces = S.stats.traces || 0;

    var title = victoryRun ? 'ASALTO COMPLETADO' : 'ASALTO FINALIZADO';
    NS.UI.toast(title, 'Cobraste ' + Util.fmtMoney(loot.cash) + ' y ' + Util.fmtBytes(loot.data * 1024 * 1024) + ' de datos (' + drained + ' nodos drenados, +' + bonusXP + ' XP).', 'good', 'ic-coin');
    NS.Audio.cash();
    NS.Mail.notify(title, 'Resumen: <b>' + drained + '</b> nodos drenados · <b>' + Util.fmtMoney(loot.cash) + '</b> cobrados · <b>' + Util.fmtBytes(loot.data * 1024 * 1024) + '</b> de datos en el almacén' + (victoryRun ? ' · ¡MasterServer destruido!' : '') + '.', 'ic-net');
    refresh();
  }
  function traced(run) {
    run.status = 'traced';
    NS.State.get().stats.traces++;
    endRun(false);
  }

  /* ================= interfaz ================= */
  var outEl = null;
  var inpEl = null;
  var mapEl = null;
  var infoEl = null;
  var curTab = 'mapa';
  var selectedId = null;
  var cmdHist = [];
  var cmdIdx = 0;

  function log(cls, txt) {
    if (!outEl) return;
    var div = Util.el('div', { class: 'term-' + cls, text: txt });
    outEl.appendChild(div);
    outEl.scrollTop = outEl.scrollHeight;
  }
  function refresh() {
    if (curTab === 'mapa') renderMap();
    else if (curTab === 'equipo') renderEquipo();
    else if (curTab === 'registro') renderRegistro();
  }

  function startRun() {
    var S = NS.State.get();
    if (S.run) { log('warn', 'Ya hay un asalto activo.'); return; }
    var seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    var run = genRun(seed);
    var startTools = S.upg['i-start'] || 0;
    if (startTools > 0) run.tools.exploit = (run.tools.exploit || 0) + startTools;
    S.run = run;
    log('ok', '=== NUEVO ASALTO ===');
    log('dim', 'Conexión establecida con el Proveedor ISP.');
    log('dim', 'Objetivo: drenar el MASTER SERVER. Drena nodos para abrir el camino.');
    log('dim', 'Consejo: SCAN antes de atacar. Usa SIGILO si el rastro sube.');
    NS.Audio.hack();
    renderMap();
    renderTop();
  }

  function actionButtons(container, run, node) {
    var b = function (label, fn, disabled, title) {
      var btn = Util.el('button', { class: 'xp-btn small', text: label, title: title || '' });
      btn.disabled = !!disabled;
      btn.addEventListener('click', fn);
      container.appendChild(btn);
    };
    if (!run || run.status !== 'active') return;
    var reach = node && isReachable(run, node);
    b('Escanear', function () { actScan(run, node); }, !reach);
    b('Crack', function () { actCrack(run, node); }, !reach || (node && node.fw <= 0));
    b('Exploit', function () { actExploit(run, node); }, !reach || (node && node.fw <= 0));
    b('Bruteforce', function () { actBruteforce(run, node); }, !reach || (node && node.fw <= 0));
    b('Descifrar', function () { actDecrypt(run, node); }, !reach);
    b('¡Upload!', function () { actUpload(run, node); }, !reach || !node || node.fw > 0 || node.drained);
  }

  function renderTop() {
    var top = Util.$('#net-top');
    if (!top) return;
    var S = NS.State.get();
    var run = S.run;
    var energyPct = S.currencies.energy / NS.State.maxEnergy() * 100;
    var html = '';
    html += '<div class="net-stat"><span class="net-lbl">Energía</span><div class="xp-progress xp-blue" style="width:110px"><div style="width:' + energyPct + '%"></div></div><span>' + Math.floor(S.currencies.energy) + '/' + NS.State.maxEnergy() + '</span></div>';
    if (run) {
      html += '<div class="net-stat"><span class="net-lbl">Rastro</span><div class="xp-progress" style="width:110px"><div style="width:' + Math.floor(run.trace) + '%;' + (run.trace > 70 ? 'background:#c03030' : '') + '"></div></div><span>' + Math.floor(run.trace) + '/100</span></div>';
      html += '<div class="net-stat"><span class="net-lbl">Botín</span><span>' + Util.fmtBytes(run.loot.data * 1024 * 1024) + ' · ' + Util.fmtMoney(run.loot.cash) + '</span></div>';
    } else {
      html += '<div class="net-stat"><span class="net-lbl">Sin asalto activo</span></div>';
    }
    top.innerHTML = html;
  }

  function renderMap() {
    if (!mapEl) return;
    var S = NS.State.get();
    var run = S.run;
    mapEl.innerHTML = '';
    if (!run) {
      mapEl.appendChild(Util.el('div', { class: 'net-empty' }));
      Util.$('.net-empty', mapEl).innerHTML = '<div style="font-size:20px;margin-bottom:10px">Mapa de red inactivo</div>' +
        '<div class="cfg-sub" style="margin-bottom:12px">Conecta para generar un asalto procedural. Drena nodos, esquiva el rastreo y alcanza el MasterServer.</div>';
      var btn = Util.el('button', { class: 'xp-btn primary', text: 'Conectar a la red' });
      btn.addEventListener('click', startRun);
      Util.$('.net-empty', mapEl).appendChild(btn);
      return;
    }
    renderTop();
    // agrupar por profundidad (nivel de conexión = distancia desde isp)
    var depths = {};
    var visited = {};
    var queue = [[run.ispId, 0]];
    visited[run.ispId] = 0;
    while (queue.length) {
      var cur = queue.shift();
      var n = nodeById(run, cur[0]);
      (depths[cur[1]] = depths[cur[1]] || []).push(n);
      n.conn.forEach(function (cid) {
        if (visited[cid] === undefined) { visited[cid] = cur[1] + 1; queue.push([cid, cur[1] + 1]); }
      });
    }
    var colWrap = Util.el('div', { class: 'net-cols' });
    Object.keys(depths).sort(function (a, b) { return a - b; }).forEach(function (d) {
      var col = Util.el('div', { class: 'net-col' });
      depths[d].forEach(function (node) {
        var reach = isReachable(run, node);
        var visible = node.explored || run.mapRevealed;
        var box = Util.el('div', {
          class: 'net-node' + (node.drained ? ' drained' : '') + (reach ? ' reach' : '') + (!visible ? ' hidden' : '') + (selectedId === node.id ? ' sel' : '') + (node.kind === 'boss' ? ' boss' : '')
        });
        var svg = Util.el('svg', { class: 'icon' });
        svg.innerHTML = '<use href="#' + (node.kind === 'boss' ? 'ic-error' : node.kind === 'isp' ? 'ic-computer' : node.kind === 'dark' ? 'ic-hacker' : 'ic-net') + '"/>';
        box.appendChild(svg);
        box.appendChild(Util.el('div', { class: 'net-node-name', text: (visible ? node.name : '???') }));
        box.appendChild(Util.el('div', { class: 'net-node-sub', text: visible ? ('nivel ' + node.lvl + ' · FW ' + node.fw) : '' }));
        if (node.drained) box.appendChild(Util.el('div', { class: 'net-node-sub ok', text: '✓ drenado' }));
        box.addEventListener('click', function () {
          selectedId = node.id;
          if (visible) {
            log('dim', 'Seleccionado: ' + node.name + (reach ? ' (alcanzable)' : ' (bloqueado)') + (node.drained ? ' — ya drenado' : ''));
          }
          renderMap();
        });
        col.appendChild(box);
      });
      colWrap.appendChild(col);
    });
    mapEl.appendChild(colWrap);
    renderTop();
  }

  function renderActions() {
    var S = NS.State.get();
    var run = S.run;
    var bar = Util.$('#net-actions');
    if (!bar) return;
    bar.innerHTML = '';
    if (!run || run.status !== 'active') {
      if (!run) {
        var b0 = Util.el('button', { class: 'xp-btn primary', text: 'Conectar a la red' });
        b0.addEventListener('click', startRun);
        bar.appendChild(b0);
      }
      return;
    }
    var node = selectedId ? nodeById(run, selectedId) : null;
    var actions = Util.el('span', { class: 'net-actionset' });
    actionButtons(actions, run, node);
    bar.appendChild(actions);

    var glob = Util.el('span', { class: 'net-actionset' });
    var sBtn = Util.el('button', { class: 'xp-btn small', text: 'SIGILO' });
    sBtn.addEventListener('click', function () { actStealth(run); });
    glob.appendChild(sBtn);
    ['proxy', 'worm', 'icmp'].forEach(function (tid) {
      var def = NS.Catalog.TOOLS[tid];
      var cnt = (run.tools[tid] || 0) + (NS.State.get().inventory.tools[tid] || 0);
      var b = Util.el('button', { class: 'xp-btn small', text: def.name.split(' ')[0] + ' (' + cnt + ')' });
      b.disabled = cnt <= 0;
      b.title = def.desc;
      b.addEventListener('click', function () {
        if (tid === 'proxy') actProxy(run);
        else if (tid === 'worm') actWorm(run);
        else actIcmp(run);
      });
      glob.appendChild(b);
    });
    var dc = Util.el('button', { class: 'xp-btn small danger', text: 'Desconectar y cobrar' });
    dc.addEventListener('click', function () { actDisconnect(run); });
    glob.appendChild(dc);
    bar.appendChild(glob);
  }

  function renderConsole() {
    if (!outEl) return;
    // el log ya se escribe con log()
  }

  function renderEquipo() {
    if (!infoEl) return;
    var S = NS.State.get();
    infoEl.innerHTML = '';
    var col = Util.el('div', { class: 'files-cols' });
    var left = Util.el('div', { class: 'files-col' });
    var p1 = Util.el('div', { class: 'panel' });
    p1.appendChild(Util.el('div', { class: 'panel-title', text: 'Implantes (NovaCoins — persistencia meta)' }));
    p1.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Cartera: ' + S.currencies.novaCoins.toFixed(2).replace('.', ',') + ' NC · ' + Util.fmtNum(S.meta.allTimeCoins) + ' NC acumuladas en total.' }));
    Object.keys(NS.Catalog.IMPLANTS).forEach(function (id) {
      var def = NS.Catalog.IMPLANTS[id];
      var lvl = S.upg[id] || 0;
      var cost = NS.Catalog.implantCost(def, lvl);
      var maxed = lvl >= def.max;
      var row = Util.el('div', { class: 'inv-row' });
      var svg = Util.el('svg', { class: 'icon' });
      svg.innerHTML = '<use href="#' + def.icon + '"/>';
      row.appendChild(svg);
      var mid = Util.el('div', { style: { flex: '1' } });
      mid.appendChild(Util.el('div', { class: 'mail-subj', text: def.name + ' (nivel ' + lvl + ')' }));
      mid.appendChild(Util.el('div', { class: 'cfg-sub', text: def.desc }));
      row.appendChild(mid);
      var btn = Util.el('button', { class: 'xp-btn small', text: maxed ? 'MÁX' : cost + ' NC' });
      btn.disabled = maxed || S.currencies.novaCoins < cost;
      btn.addEventListener('click', function () {
        var r = NS.State.buyImplant(id);
        if (!r.ok && r.why === 'coins') NS.UI.toast('Equipo', 'No tienes suficientes NovaCoins. Mina o haz asaltos.', 'important', 'ic-coin');
        refresh();
      });
      row.appendChild(btn);
      p1.appendChild(row);
    });
    left.appendChild(p1);
    col.appendChild(left);

    var right = Util.el('div', { class: 'files-col' });
    var p2 = Util.el('div', { class: 'panel' });
    p2.appendChild(Util.el('div', { class: 'panel-title', text: 'Hardware del rig (dólares)' }));
    ['e-max', 'e-regen'].forEach(function (id) {
      var def = NS.Catalog.UPGRADES[id];
      var lvl = S.upg[id] || 0;
      var cost = NS.Catalog.upgradeCost(def, lvl);
      var maxed = lvl >= def.max;
      var row = Util.el('div', { class: 'inv-row' });
      var svg = Util.el('svg', { class: 'icon' });
      svg.innerHTML = '<use href="#' + def.icon + '"/>';
      row.appendChild(svg);
      var mid = Util.el('div', { style: { flex: '1' } });
      mid.appendChild(Util.el('div', { class: 'mail-subj', text: def.name + ' (nivel ' + lvl + ')' }));
      mid.appendChild(Util.el('div', { class: 'cfg-sub', text: def.desc }));
      row.appendChild(mid);
      var btn = Util.el('button', { class: 'xp-btn small', text: maxed ? 'MÁX' : Util.fmtMoney(cost) });
      btn.disabled = maxed || S.currencies.cash < cost;
      btn.addEventListener('click', function () {
        var r = NS.State.buyUpgrade(id);
        if (!r.ok && r.why === 'dinero') NS.UI.toast('Equipo', 'Fondos insuficientes.', 'important', 'ic-error');
        refresh();
      });
      row.appendChild(btn);
      p2.appendChild(row);
    });
    right.appendChild(p2);

    var p3 = Util.el('div', { class: 'panel' });
    p3.appendChild(Util.el('div', { class: 'panel-title', text: 'Estadísticas del equipo' }));
    p3.appendChild(Util.el('div', { class: 'cfg-info', html:
      'Energía máxima: <b>' + NS.State.maxEnergy() + '</b> (regeneración ' + (NS.State.energyRegen() * 60).toFixed(1).replace('.', ',') + '/min)<br>' +
      'Sigilo: <b>-' + ((S.upg['i-stealth'] || 0) * 4) + ' %</b> de rastro por acción<br>' +
      'CPU: <b>+' + ((S.upg['i-cpu'] || 0) * 12) + ' %</b> de éxito en crack<br>' +
      'Botín: <b>+' + ((S.upg['i-loot'] || 0) * 10) + ' %</b> · Caída de herramientas: <b>' + Math.round(toolDropChance() * 100) + ' %</b><br>' +
      'Ingresos globales: <b>+' + Math.round((NS.State.incomeMult() - 1) * 100) + ' %</b>'
    }));
    right.appendChild(p3);

    var p4 = Util.el('div', { class: 'panel' });
    p4.appendChild(Util.el('div', { class: 'panel-title', text: 'Legado (prestige)' }));
    p4.appendChild(Util.el('div', { class: 'cfg-info', html:
      'Puntos de legado: <b>' + S.currencies.legacy + '</b> (+' + (S.currencies.legacy * 3) + ' % de ingresos)<br>' +
      'NovaCoins acumuladas (total histórico): <b>' + Util.fmtNum(S.meta.allTimeCoins) + '</b>'
    }));
    var fmtBtn = Util.el('button', { class: 'xp-btn danger small', text: 'Formatear C: (abrir panel)' });
    fmtBtn.addEventListener('click', function () { NS.WM.open('settings'); });
    p4.appendChild(fmtBtn);
    right.appendChild(p4);
    col.appendChild(right);
    infoEl.appendChild(col);
  }

  function renderRegistro() {
    if (!infoEl) return;
    var S = NS.State.get();
    infoEl.innerHTML = '';
    var p = Util.el('div', { class: 'panel' });
    p.appendChild(Util.el('div', { class: 'panel-title', text: 'Historial del operador' }));
    p.appendChild(Util.el('div', { class: 'cfg-info', html:
      'Asaltos completados: <b>' + S.meta.runsDone + '</b> · Rastreado: <b>' + S.meta.runsTraced + '</b><br>' +
      'Nodos drenados: <b>' + S.meta.nodesDrained + '</b> · MasterServers: <b>' + S.meta.bossesDrained + '</b><br>' +
      'Amenazas detenidas: <b>' + S.meta.threatsStopped + '</b> · Clics: <b>' + Util.fmtInt(S.stats.clicks) + '</b><br>' +
      'Publicaciones: <b>' + S.stats.posts + '</b> · Formateos: <b>' + S.meta.formatsDone + '</b>'
    }));
    infoEl.appendChild(p);
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'net-root';
    var top = Util.el('div', { class: 'net-top', id: 'net-top' });
    var tabs = Util.el('div', { class: 'tabs' });
    var content = Util.el('div', { class: 'net-content' });
    var actions = Util.el('div', { class: 'net-actions', id: 'net-actions' });

    function makeTab(id, label, fn) {
      var b = Util.el('button', { class: 'tab-btn', text: label });
      b.addEventListener('click', function () {
        curTab = id;
        Util.$$('.tab-btn', tabs).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        fn();
      });
      tabs.appendChild(b);
      return b;
    }
    makeTab('mapa', 'Mapa', function () {
      content.innerHTML = '';
      mapEl = Util.el('div', { class: 'net-map' });
      content.appendChild(mapEl);
      content.appendChild(actions);
      renderMap();
      renderActions();
      renderConsole();
    });
    makeTab('equipo', 'Equipo', function () {
      content.innerHTML = '';
      infoEl = Util.el('div', { class: 'app-pad' });
      content.appendChild(infoEl);
      renderEquipo();
    });
    makeTab('registro', 'Registro', function () {
      content.innerHTML = '';
      infoEl = Util.el('div', { class: 'app-pad' });
      content.appendChild(infoEl);
      renderRegistro();
    });

    body.appendChild(top);
    body.appendChild(tabs);
    body.appendChild(content);
    // consola
    var cons = Util.el('div', { class: 'term-body net-console' });
    outEl = Util.el('div', { class: 'term-out' });
    var row = Util.el('div', { class: 'term-inrow' });
    var prompt = Util.el('span', { class: 'term-prompt', text: 'net>' });
    inpEl = Util.el('input', { class: 'term-in', type: 'text', autocomplete: 'off', spellcheck: 'false' });
    row.appendChild(prompt);
    row.appendChild(inpEl);
    cons.appendChild(outEl);
    cons.appendChild(row);
    body.appendChild(cons);

    inpEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var v = inpEl.value.trim();
        if (v) {
          log('cmd', 'net>' + v);
          cmd(v);
          cmdHist.push(v); cmdIdx = cmdHist.length;
        }
        inpEl.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdIdx > 0) { cmdIdx--; inpEl.value = cmdHist[cmdIdx] || ''; }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (cmdIdx < cmdHist.length) { cmdIdx++; inpEl.value = cmdHist[cmdIdx] || ''; }
      }
    });

    var first = Util.$('.tab-btn', tabs);
    if (first) first.click();
    renderTop();
  }

  /* comandos escritos a mano */
  function resolveNode(run, token) {
    token = String(token).toLowerCase();
    for (var i = 0; i < run.nodes.length; i++) {
      if (run.nodes[i].id === token || run.nodes[i].name.toLowerCase().indexOf(token) !== -1) return run.nodes[i];
    }
    return null;
  }
  function cmd(v) {
    var S = NS.State.get();
    var parts = v.split(/\s+/);
    var head = parts[0].toLowerCase();
    var run = S.run;
    if (!run && head !== 'conectar' && head !== 'connect' && head !== 'help' && head !== 'ayuda' && head !== '?') {
      log('err', 'No hay asalto activo. Escribe CONECTAR.');
      return;
    }
    var target = parts[1] ? (run ? resolveNode(run, parts[1]) : null) : null;
    switch (head) {
      case 'conectar': case 'connect': startRun(); break;
      case 'scan': case 'escaneo': if (target) actScan(run, target); else log('err', 'Uso: scan <nombre>'); break;
      case 'crack': case 'romper': if (target) actCrack(run, target); else log('err', 'Uso: crack <nombre>'); break;
      case 'exploit': case 'explotar': if (target) actExploit(run, target); else log('err', 'Uso: exploit <nombre>'); break;
      case 'bruteforce': case 'fuerza': if (target) actBruteforce(run, target); else log('err', 'Uso: bruteforce <nombre>'); break;
      case 'upload': case 'drenar': if (target) actUpload(run, target); else log('err', 'Uso: upload <nombre>'); break;
      case 'stealth': case 'sigilo': actStealth(run); break;
      case 'proxy': actProxy(run); break;
      case 'worm': case 'gusano': actWorm(run); break;
      case 'icmp': actIcmp(run); break;
      case 'decrypt': case 'descifrar': if (target) actDecrypt(run, target); else log('err', 'Uso: decrypt <nombre>'); break;
      case 'disconnect': case 'salir': actDisconnect(run); break;
      case 'trace': case 'rastro': log('dim', 'Rastro actual: ' + Math.floor(run.trace) + '/100.'); break;
      case 'energy': case 'energia': log('dim', 'Energía: ' + Math.floor(S.currencies.energy) + '/' + NS.State.maxEnergy() + '.'); break;
      case 'loot': case 'botin': log('dim', 'Botín sin cobrar: ' + Util.fmtBytes(run.loot.data * 1024 * 1024) + ' · ' + Util.fmtMoney(run.loot.cash) + '.'); break;
      case 'help': case 'ayuda': case '?':
        ['scan <n> · crack <n> · exploit <n> · bruteforce <n>', 'upload <n> · stealth · proxy · worm · icmp', 'decrypt <n> · disconnect · trace · energy · loot', 'conectar — inicia un asalto'].forEach(function (l) { log('dim', l); });
        break;
      default: log('err', 'Comando desconocido. Escribe help.');
    }
  }

  function tick() {
    renderTop();
    renderActions();
  }

  NS.Apps.register({
    id: 'net', title: 'Mapa de Red', icon: 'ic-net',
    desktop: true, w: 720, h: 540, minW: 600, minH: 440,
    render: render, tick: tick,
    status: function () {
      var s = NS.State.get();
      return s.run ? 'Asalto activo · Rastro ' + Math.floor(s.run.trace) + '/100' : 'Sin asalto activo';
    }
  });
  NS.Net = { genRun: genRun, startRun: startRun };
})();
