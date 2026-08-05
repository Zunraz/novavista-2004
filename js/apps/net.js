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
    data: ['PC de Ana', 'PC de Roberto', 'PC familiar', 'PC de la vecina', 'CiberCafé NovaNet', 'Oficina de diseño XS', 'Gestoría El Águila', 'Servidor NovaNoticias', 'Banco del Sur S.A.', 'MegaSoft Corp', 'DataCorp Central'],
    elite: ['Núcleo MegaSoft', 'Bóveda del Banco del Sur', 'DataCorp Central', 'Sala de servidores VIP'],
    loot: ['Cámara olvidada', 'Cajón de datos', 'Copia de seguridad', 'Archivo perdido'],
    shop: ['Vendedor del subsuelo', 'Mercado negro NovaNet', 'Chiringuito de chips'],
    event: ['Señal desconocida', 'Foro del submundo', 'Sala de chat cifrada'],
    boss: ['MASTER SERVER', 'Núcleo de control', 'La Madre']
  };

  /* Genera un nodo según su tipo; el nivel (1-4) marca la dificultad */
  function genNode(rng, kind, lvl) {
    var fw, data, cash, coins = 0, coinsChance = 0;
    if (kind === 'data') {
      fw = 1 + Math.floor(lvl / 2) + (rng() < 0.4 ? 1 : 0);
      data = Math.round(Math.pow(lvl, 1.4) * 14 * (0.8 + rng() * 0.6));
      cash = Math.round(Math.pow(lvl, 2.05) * 26 * (0.8 + rng() * 0.5));
      coinsChance = 0.25 + lvl * 0.04;
    } else if (kind === 'elite') {
      fw = 2 + Math.floor(lvl / 2) + (rng() < 0.5 ? 1 : 0);
      data = Math.round(Math.pow(lvl, 1.5) * 34 * (0.9 + rng() * 0.6));
      cash = Math.round(Math.pow(lvl, 2.1) * 60 * (0.9 + rng() * 0.5));
      coinsChance = 0.5;
    } else if (kind === 'loot') {
      fw = 0; data = Math.round(Math.pow(lvl, 1.3) * 26 * (0.8 + rng() * 0.5));
      cash = Math.round(Math.pow(lvl, 1.9) * 32 * (0.8 + rng() * 0.5));
    } else if (kind === 'shop') {
      fw = 0; data = 0; cash = 0;
    } else if (kind === 'event') {
      fw = 0; data = 0; cash = 0;
    } else if (kind === 'boss') {
      fw = 4 + Math.floor(lvl / 2);
      data = 4200 + Math.floor(rng() * 2200);
      cash = 22000 + Math.floor(rng() * 16000);
      coins = 8 + Math.floor(rng() * 10);
      coinsChance = 1;
    } else { // isp
      fw = 0; data = 0; cash = 0;
    }
    var vulns = [];
    var pool = ['buffer', 'openport', 'weakpass', 'backdoor'];
    var nv = (kind === 'data' || kind === 'elite') ? (rng() < 0.3 ? 0 : rng() < 0.7 ? 1 : 2) : (rng() < 0.4 ? 1 : 0);
    for (var i = 0; i < nv; i++) {
      var v = pool[Math.floor(rng() * pool.length)];
      if (vulns.indexOf(v) === -1) vulns.push(v);
    }
    return {
      id: 'n' + Math.floor(rng() * 1e9).toString(36),
      kind: kind,
      name: kind === 'isp' ? 'Proveedor ISP (tú)' : (NAMES[kind] || ['Nodo desconocido'])[Math.floor(rng() * (NAMES[kind] || ['Nodo desconocido']).length)],
      lvl: lvl,
      fw: kind === 'boss' ? fw : Math.min(fw, 6),
      fwMax: fw,
      trace: (kind === 'elite' ? 8 : kind === 'boss' ? 14 : 5) + lvl * 2 + Math.floor(rng() * 4),
      data: data, cash: cash, coins: coins, coinsChance: coinsChance,
      vulns: vulns,
      conn: [],
      explored: kind === 'isp',
      drained: false,
      usedVulns: {}
    };
  }

  /* Tipos de nodo según la posición en la rama (más profundo = más peligroso) */
  function pickKind(rng, d, depth) {
    var table;
    if (d === 1) table = [['data', 58], ['loot', 24], ['event', 18]];
    else if (d === depth) table = [['data', 38], ['elite', 27], ['loot', 14], ['shop', 12], ['event', 9]];
    else table = [['data', 42], ['loot', 18], ['event', 14], ['shop', 14], ['elite', 12]];
    var total = 0;
    table.forEach(function (t) { total += t[1]; });
    var r = rng() * total;
    for (var i = 0; i < table.length; i++) {
      r -= table[i][1];
      if (r <= 0) return table[i][0];
    }
    return 'data';
  }

  function genRun(seed) {
    var rng = Util.mulberry32(seed >>> 0);
    var nodes = [];
    function add(n) { nodes.push(n); return n; }

    var isp = add(genNode(rng, 'isp', 0));

    // 3 ramas × 3 profundidades: el jugador elige su ruta (StS-style)
    var branches = 3;
    var depth = 3;
    var ends = [];
    for (var b = 0; b < branches; b++) {
      var prev = isp;
      for (var d = 1; d <= depth; d++) {
        var kind = pickKind(rng, d, depth);
        var node = add(genNode(rng, kind, d));
        prev.conn.push(node.id);
        prev = node;
        if (d === depth) ends.push(node);
      }
    }
    // el jefe conecta con el final de las 3 ramas
    var boss = add(genNode(rng, 'boss', 4));
    ends.forEach(function (e) { e.conn.push(boss.id); });
    // a veces una conexión extra rama<->rama (atajos)
    if (rng() < 0.5) {
      var n1 = nodes[1 + Math.floor(rng() * (nodes.length - 2))];
      var n2 = nodes[1 + Math.floor(rng() * (nodes.length - 2))];
      if (n1 !== n2 && n1.conn.indexOf(n2.id) === -1 && n2.conn.indexOf(n1.id) === -1 && n1 !== isp && n2 !== isp && n1 !== boss && n2 !== boss) {
        n1.conn.push(n2.id);
      }
    }

    /* -------- modificadores del asalto (variedad sin injusticia) -------- */
    var MODIFIERS = [
      { id: 'vigilada',  kind: 'bad',  name: 'Red vigilada',     desc: '+25 % de rastro por acción' },
      { id: 'hora-punta',kind: 'bad',  name: 'Hora punta',       desc: '+1 de energía por acción' },
      { id: 'silenciosa',kind: 'good', name: 'Red silenciosa',   desc: '-20 % de rastro por acción' },
      { id: 'agujeros',  kind: 'good', name: 'Red con agujeros', desc: 'Los nodos tienen más vulnerabilidades' },
      { id: 'criptico',  kind: 'good', name: 'Nodos cripticos',  desc: '+50 % de NovaCoins' },
      { id: 'aquelarre', kind: 'good', name: 'Noche de aquelarre', desc: 'Menos firewall en las ramas iniciales' }
    ];
    var bads = MODIFIERS.filter(function (m) { return m.kind === 'bad'; });
    var goods = MODIFIERS.filter(function (m) { return m.kind === 'good'; });
    var modifiers = [
      bads[Math.floor(rng() * bads.length)],
      goods[Math.floor(rng() * goods.length)]
    ];
    if (rng() < 0.35) modifiers.push(goods[Math.floor(rng() * goods.length)]);
    var modIds = modifiers.map(function (m) { return m.id; });

    // aplicar efectos de modificadores a los nodos
    if (modIds.indexOf('agujeros') !== -1) {
      var vpool = ['buffer', 'openport', 'weakpass', 'backdoor'];
      nodes.forEach(function (n) {
        if (n.kind === 'isp' || n.kind === 'boss' || n.kind === 'shop' || n.kind === 'event') return;
        if (rng() < 0.7 && n.vulns.length < 2) {
          var v = vpool[Math.floor(rng() * vpool.length)];
          if (n.vulns.indexOf(v) === -1) n.vulns.push(v);
        }
      });
    }
    if (modIds.indexOf('aquelarre') !== -1) {
      nodes.forEach(function (n) {
        if (n.lvl <= 2 && n.fw > 1) n.fw = Math.max(1, n.fw - 1);
        if (n.lvl <= 2) n.fwMax = n.fw;
      });
    }
    if (modIds.indexOf('criptico') !== -1) {
      nodes.forEach(function (n) {
        if ((n.kind === 'data' && n.coinsChance > 0) || n.kind === 'elite' || n.kind === 'boss') n.coins = Math.round((n.coins || 0) * 1.5) || n.coins;
      });
    }

    /* -------- objetivo secundario (bonus de NovaCoins) -------- */
    var OBJECTIVES = [
      { id: 'o-no-bruteforce', desc: 'Termina sin usar BRUTEFORCE',           bonus: 4, check: function (r) { return r.stats.bruteforce === 0; } },
      { id: 'o-low-trace',     desc: 'Cobra con el rastro por debajo de 40',  bonus: 3, check: function (r) { return r.trace < 40; } },
      { id: 'o-4-drains',      desc: 'Consigue 4 o más nodos en un asalto',   bonus: 3, check: function (r) { return r.stats.drains >= 4; } },
      { id: 'o-2-tools',       desc: 'Usa 2 herramientas distintas',          bonus: 4, check: function (r) { return Object.keys(r.stats.tools).length >= 2; } },
      { id: 'o-no-crack',      desc: 'Termina sin usar CRACK',                bonus: 5, check: function (r) { return r.stats.crack === 0; } },
      { id: 'o-calm',          desc: 'Nunca superes 60 de rastro',            bonus: 4, check: function (r) { return r.stats.maxTrace <= 60; } }
    ];
    var objective = OBJECTIVES[Math.floor(rng() * OBJECTIVES.length)];

    return {
      seed: seed, nodes: nodes, ispId: isp.id, bossId: boss.id,
      trace: 0, loot: { data: 0, cash: 0 }, tools: {},
      status: 'active', startedAt: Date.now(), mapRevealed: false,
      summary: null,
      modifiers: modifiers, modIds: modIds, objective: objective,
      combo: 0, comboBest: 0,
      stealthCount: 0,
      stats: { drains: 0, crack: 0, bruteforce: 0, tools: {}, maxTrace: 0 }
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
    var risk = node.trace * stealth * (0.85 + Math.random() * 0.3);
    return Math.max(1, risk * runTraceMult(run));
  }
  function addTrace(run, node) {
    run.trace += traceRisk(run, node);
    if (run.trace > run.stats.maxTrace) run.stats.maxTrace = Math.floor(run.trace);
    if (run.trace >= 70 && run.trace < 100 && !run.traceWarned) {
      run.traceWarned = true;
      log('warn', '¡CUIDADO! Rastro alto (' + Math.floor(run.trace) + '/100). Usa SIGILO o un PROXY.');
      NS.Audio.trace();
    }
    if (run.trace >= 100) {
      run.trace = 100;
      // Escapatoria: no es muerte instantánea, pero tampoco gratis.
      var S = NS.State.get();
      var escapeChance = Util.clamp(0.35 + 0.05 * (S.upg['i-stealth'] || 0), 0, 0.65);
      if (Math.random() < escapeChance) {
        run.trace = 35;
        log('ok', '¡Te escabulliste del rastreo a duras penas! Rastro reiniciado a 35.');
        NS.Audio.trace();
        refresh();
      } else {
        traced(run);
      }
      return true;
    }
    return false;
  }
  function spendE(run, n) {
    // "Hora punta" encarece las acciones en +1
    var cost = n + (run && run.modIds && run.modIds.indexOf('hora-punta') !== -1 ? 1 : 0);
    if (!NS.State.spendEnergy(cost)) return false;
    return true;
  }
  function runTraceMult(run) {
    var m = 1;
    if (run.modIds && run.modIds.indexOf('vigilada') !== -1) m *= 1.25;
    if (run.modIds && run.modIds.indexOf('silenciosa') !== -1) m *= 0.8;
    return m;
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
    if (!spendE(run, 1)) return log('err', 'Energía insuficiente.');
    node.explored = true;
    if (node.kind === 'loot' || node.kind === 'shop' || node.kind === 'event') {
      log('ok', 'ESCANEO de ' + node.name + ' (' + KIND_LABEL[node.kind] + ', nivel ' + node.lvl + ')');
      log('dim', '  No es un servidor hostil: no tiene firewall. Interactúa con la acción especial.');
    } else {
      var vulnTxt = node.vulns.length ? node.vulns.map(vulnName).join(', ') : 'ninguna conocida';
      log('ok', 'ESCANEO de ' + node.name + ' (nivel ' + node.lvl + (node.kind === 'elite' ? ' — ¡ÉLITE!' : '') + ')');
      log('dim', '  Firewall: ' + '▓'.repeat(node.fw) + '░'.repeat(node.fwMax - node.fw) + ' · Vulnerabilidades: ' + vulnTxt);
      log('dim', '  Botín estimado: ' + Util.fmtBytes(node.data * 1024 * 1024) + ' · ' + Util.fmtMoney(node.cash) + (node.coinsChance > 0 ? ' · posible monedas' : ''));
    }
    addTrace(run, node);
    NS.State.addXP(2);
    NS.Audio.tick();
    refresh();
  }
  function actCrack(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.fw <= 0) return log('dim', 'El firewall de ' + node.name + ' ya está caído. Usa UPLOAD.');
    if (!spendE(run, 1)) return log('err', 'Energía insuficiente.');
    run.stats.crack++;
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
    if (!spendE(run, 1)) return log('err', 'Energía insuficiente.');
    // la energía se cobra antes de consumir la herramienta: nunca se pierde un kit en vano
    if (node.vulns.indexOf('buffer') === -1) { takeTool(run, 'exploit'); usesTool = true; run.stats.tools.exploit = 1; }
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
    if (!spendE(run, 2)) return log('err', 'Energía insuficiente (cuesta 2).');
    run.stats.bruteforce++;
    node.fw--;
    log('warn', 'BRUTEFORCE: capa rota a la fuerza (' + node.fw + ' restantes). El rastro aumenta mucho.');
    addTrace(run, node);
    addTrace(run, node);
    NS.State.addXP(2);
    NS.Audio.error();
    refresh();
  }
  function actUpload(run, node) {
    if (node.kind !== 'data' && node.kind !== 'elite' && node.kind !== 'boss') {
      return log('err', '«' + node.name + '» no es un servidor hostil: usa su acción especial.');
    }
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.drained) return log('dim', 'Ya drenaste ' + node.name + '.');
    if (node.fw > 0) return log('err', 'El firewall de ' + node.name + ' sigue activo (' + node.fw + ' capas).');
    if (!spendE(run, 2)) return log('err', 'Energía insuficiente (cuesta 2).');

    // Racha: drenar con poco rastro encadena bonus (+10 % hasta +50 %)
    if (run.trace < 50) { run.combo++; } else { run.combo = 0; }
    if (run.combo > run.comboBest) run.comboBest = run.combo;
    var comboMult = 1 + 0.1 * Util.clamp(run.combo - 1, 0, 5);
    if (run.combo >= 2) log('ok', '¡RACHA ×' + run.combo + '! +' + Math.round((comboMult - 1) * 100) + ' % de botín.');

    var payloadUsed = false;
    if (hasTool(run, 'payload')) {
      takeTool(run, 'payload');
      payloadUsed = true;
      log('ok', 'Payload cifrado inyectado: +40 % de datos.');
    }
    var mult = lootMult() * (payloadUsed ? 1.4 : 1) * comboMult;
    var d = Math.round(node.data * mult);
    var c = Math.round(node.cash * mult);
    run.loot.data += d;
    run.loot.cash += c;
    node.drained = true;
    run.stats.drains++;
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

  /* ---------- acciones de los nodos especiales ---------- */
  var KIND_LABEL = {
    isp: 'Tu ISP', data: 'Servidor', elite: 'ÉLITE', loot: 'Botín',
    shop: 'Mercado negro', event: 'Evento', boss: 'MASTER SERVER'
  };

  /* Botín: recoger sin pelear, con riesgo de trampa */
  function actTake(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.drained) return log('dim', 'Ya vaciaste ' + node.name + '.');
    if (!spendE(run, 1)) return log('err', 'Energía insuficiente.');
    var dice = Math.random();
    if (dice < 0.8) {
      var d = Math.round(node.data * lootMult());
      var c = Math.round(node.cash * lootMult());
      run.loot.data += d;
      run.loot.cash += c;
      node.drained = true;
      run.stats.drains++;
      run.combo++;
      if (run.combo > run.comboBest) run.comboBest = run.combo;
      log('ok', '¡Robaste la cámara! +' + Util.fmtBytes(d * 1024 * 1024) + ' y ' + Util.fmtMoney(c) + ' al botín.');
      NS.Audio.cash();
    } else {
      node.drained = true;
      run.trace += 22;
      if (run.trace > run.stats.maxTrace) run.stats.maxTrace = Math.floor(run.trace);
      log('warn', '¡ERA UNA TRAMPA! Una alarma silenciosa te delató: +22 de rastro (' + Math.floor(run.trace) + '/100).');
      NS.Audio.trace();
    }
    addTrace(run, node);
    NS.State.addXP(2);
    refresh();
  }

  /* Mercado negro: gasta botín del asalto en ventajas */
  function actShop(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.drained) return log('dim', 'Ya visitaste ' + node.name + '.');
    var loot = run.loot.cash;
    var offers = [
      { id: 'energy', label: 'Cápsula de energía (+60 % de la máxima)', cost: Math.max(25, Math.round(loot * 0.35)), fn: function () {
        var S = NS.State.get();
        var add = Math.round(NS.State.maxEnergy() * 0.6);
        S.currencies.energy = Math.min(NS.State.maxEnergy(), S.currencies.energy + add);
        log('ok', 'Cápsula consumida: +' + add + ' de energía.');
      } },
      { id: 'clean', label: 'Limpiador de rastro (-40)', cost: Math.max(30, Math.round(loot * 0.4)), fn: function () {
        run.trace = Math.max(0, run.trace - 40);
        log('ok', 'Rastro limpiado: ahora está en ' + Math.floor(run.trace) + '.');
      } },
      { id: 'tool', label: 'Herramienta aleatoria (1×)', cost: Math.max(20, Math.round(loot * 0.3)), fn: function () {
        var tids = Object.keys(NS.Catalog.TOOLS);
        var tid = tids[Math.floor(Math.random() * tids.length)];
        run.tools[tid] = (run.tools[tid] || 0) + 1;
        log('ok', 'Herramienta comprada: 1× ' + NS.Catalog.TOOLS[tid].name + '.');
      } }
    ];
    var msg = '<b>' + Util.esc(node.name) + '</b> (mercado negro)<br>' +
      'Dispones de <b>' + Util.fmtMoney(loot) + '</b> de botín para gastar. Lo que gastes no lo cobrarás al final.<br><br>';
    var buttons = offers.map(function (o) {
      return { label: o.label + ' — ' + Util.fmtMoney(o.cost), value: o.id, primary: false, disabled: loot < o.cost };
    });
    buttons.push({ label: 'Salir sin comprar', value: null, primary: true });
    NS.UI.dialog({
      title: 'Mercado negro', icon: 'ic-coin',
      message: msg,
      buttons: buttons
    }).then(function (choice) {
      if (!choice) { node.drained = true; log('dim', 'Sales del mercado negro sin comprar.'); refresh(); return; }
      for (var i = 0; i < offers.length; i++) {
        if (offers[i].id === choice) {
          if (run.loot.cash < offers[i].cost) { log('err', 'No te alcanza el botín para eso.'); return; }
          run.loot.cash -= offers[i].cost;
          offers[i].fn();
          node.drained = true;
          log('ok', 'El vendedor acepta el trato y desaparece en la penumbra.');
          NS.Audio.cash();
          refresh();
          return;
        }
      }
    });
  }

  /* Evento: resultado aleatorio justo (60 % bueno / 40 % malo) */
  function actEvent(run, node) {
    if (!isReachable(run, node)) return log('err', 'Nodo inalcanzable.');
    if (node.drained) return log('dim', 'Ya resolviste ' + node.name + '.');
    if (!spendE(run, 1)) return log('err', 'Energía insuficiente.');
    node.drained = true;
    var roll = Math.random();
    if (roll < 0.6) {
      var picks = ['energy', 'tool', 'coins', 'trace'];
      var p = picks[Math.floor(Math.random() * picks.length)];
      if (p === 'energy') {
        NS.State.addEnergy(8);
        log('ok', 'Un script útil: +8 de energía.');
      } else if (p === 'tool') {
        var tids = Object.keys(NS.Catalog.TOOLS);
        var tid = tids[Math.floor(Math.random() * tids.length)];
        run.tools[tid] = (run.tools[tid] || 0) + 1;
        log('ok', 'Regalo de un extraño: 1× ' + NS.Catalog.TOOLS[tid].name + '.');
      } else if (p === 'coins') {
        var coins = 1 + Math.floor(Math.random() * 3);
        NS.State.addCoins(coins);
        log('ok', 'Pagaron por una ayuda: +' + coins + ' NovaCoins.');
      } else {
        run.trace = Math.max(0, run.trace - 20);
        log('ok', 'Un contacto borró parte de tu rastro: -20.');
      }
    } else {
      var bad = Math.random();
      if (bad < 0.4) {
        run.trace += 18;
        log('warn', 'Un honeypot del administrador: +18 de rastro (' + Math.floor(run.trace) + '/100).');
      } else if (bad < 0.7) {
        var lost = Math.round(run.loot.cash * 0.15);
        run.loot.cash -= lost;
        log('warn', 'Un estafador te vació parte del botín: -' + Util.fmtMoney(lost) + '.');
      } else {
        NS.State.get().currencies.energy = Math.max(0, NS.State.get().currencies.energy - 6);
        log('warn', 'Un virus en el acceso: -6 de energía.');
      }
    }
    addTrace(run, node);
    refresh();
  }
  function actStealth(run) {
    if (!spendE(run, 2)) return log('err', 'Energía insuficiente (cuesta 2).');
    // Fatiga de sigilo: cada uso en el mismo asalto reduce menos, y los
    // vigilantes aprenden tu método (el rastro base sube). No se puede
    // spamear para anular el riesgo del roguelite.
    run.stealthCount = (run.stealthCount || 0) + 1;
    var k = run.stealthCount;
    var mult = Math.max(0.5, 0.7 + 0.06 * (k - 1));
    run.trace = Math.floor(run.trace * mult) + 3;
    log('ok', 'SIGILO (#uso ' + k + '): rastro ×' + mult.toFixed(2) + ' +3 de atención → ' + Math.floor(run.trace) + '.');
    log('dim', 'Los vigilantes se están fijando en ti: cada sigilo es menos eficaz.');
    NS.State.addXP(1);
    NS.Audio.tick();
    refresh();
  }
  function actProxy(run) {
    if (!takeTool(run, 'proxy')) return log('err', 'No tienes servidores proxy.');
    run.stats.tools.proxy = 1;
    run.trace = Math.floor(run.trace * 0.5);
    log('ok', 'PROXY quemado. Rastro reducido a la mitad (' + Math.floor(run.trace) + ').');
    NS.Audio.tick();
    refresh();
  }
  function actWorm(run) {
    if (!takeTool(run, 'worm')) return log('err', 'No tienes gusanos.');
    run.stats.tools.worm = 1;
    NS.State.addEnergy(8);
    log('ok', 'GUSANO desplegado: +8 de energía (' + NS.State.get().currencies.energy + '/max).');
    NS.Audio.ok();
    refresh();
  }
  function actIcmp(run) {
    if (!takeTool(run, 'icmp')) return log('err', 'No tienes túneles ICMP.');
    run.stats.tools.icmp = 1;
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
    run.stats.tools.decrypt = 1;
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

    // objetivo secundario: bonus de NovaCoins
    var objBonus = 0;
    var objMet = false;
    if (run.objective && run.objective.check(run)) {
      objMet = true;
      objBonus = run.objective.bonus;
      NS.State.addCoins(objBonus);
    }

    bonusXP = drained * 4;
    NS.State.addXP(bonusXP);
    S.meta.runsDone++;
    S.stats.traces = S.stats.traces || 0;

    var title = victoryRun ? 'ASALTO COMPLETADO' : 'ASALTO FINALIZADO';
    NS.UI.toast(title, 'Cobraste ' + Util.fmtMoney(loot.cash) + ' y ' + Util.fmtBytes(loot.data * 1024 * 1024) + ' de datos (' + drained + ' nodos drenados, +' + bonusXP + ' XP)' + (objMet ? ' · ¡Objetivo cumplido! +' + objBonus + ' NC' : '') + '.', 'good', 'ic-coin');
    NS.Audio.cash();
    NS.Mail.notify(title, 'Resumen: <b>' + drained + '</b> nodos drenados · <b>' + Util.fmtMoney(loot.cash) + '</b> cobrados · <b>' + Util.fmtBytes(loot.data * 1024 * 1024) + '</b> de datos' + (victoryRun ? ' · ¡MasterServer destruido!' : '') + (objMet ? ' · Objetivo: <b>CUMPLIDO</b> (+' + objBonus + ' NC)' : '') + '.', 'ic-net');

    // resumen del asalto (solo si merece la pena mostrarlo)
    if (drained > 0) {
      var modsTxt = run.modifiers.map(function (m) { return m.name; }).join(', ');
      NS.UI.dialog({
        title: title, icon: victoryRun ? 'ic-coin' : 'ic-net',
        message:
          '<b>Nodos drenados:</b> ' + drained + '<br>' +
          '<b>Dinero cobrado:</b> ' + Util.fmtMoney(loot.cash) + '<br>' +
          '<b>Datos al almacén:</b> ' + Util.fmtBytes(loot.data * 1024 * 1024) + '<br>' +
          '<b>Mejor racha:</b> ×' + run.comboBest + ' (+' + Math.min(50, run.comboBest > 1 ? (run.comboBest - 1) * 10 : 0) + ' % máx)<br>' +
          '<b>XP ganada:</b> +' + bonusXP + '<br>' +
          '<b>Objetivo del asalto:</b> ' + (run.objective ? Util.esc(run.objective.desc) : '—') + ' → <b>' + (objMet ? 'CUMPLIDO (+' + objBonus + ' NC)' : 'no cumplido') + '</b><br>' +
          '<b>Modificadores:</b> ' + Util.esc(modsTxt),
        buttons: [{ label: '¡A por el siguiente!', value: true, primary: true }]
      });
    }
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
    log('ok', 'Modificadores: ' + run.modifiers.map(function (m) { return m.name + ' (' + m.desc + ')'; }).join(' · '));
    log('dim', 'Objetivo del asalto: ' + run.objective.desc + ' → +' + run.objective.bonus + ' NovaCoins.');
    log('dim', 'Meta principal: drenar el MASTER SERVER. Drena nodos para abrir el camino.');
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
    if (node) {
      if (node.kind === 'data' || node.kind === 'elite' || node.kind === 'boss') {
        b('Crack', function () { actCrack(run, node); }, !reach || node.fw <= 0);
        b('Exploit', function () { actExploit(run, node); }, !reach || node.fw <= 0);
        b('Bruteforce', function () { actBruteforce(run, node); }, !reach || node.fw <= 0);
        b('Descifrar', function () { actDecrypt(run, node); }, !reach);
        b('¡Upload!', function () { actUpload(run, node); }, !reach || node.fw > 0 || node.drained);
      } else if (node.kind === 'loot') {
        b('Robar botín', function () { actTake(run, node); }, !reach || node.drained, 'Recoge el botín: no hay firewall, pero puede ser una trampa.');
      } else if (node.kind === 'shop') {
        b('Entrar al mercado', function () { actShop(run, node); }, !reach || node.drained, 'Gasta botín del asalto en energía, limpieza de rastro o herramientas.');
      } else if (node.kind === 'event') {
        b('Investigar', function () { actEvent(run, node); }, !reach || node.drained, 'Resultado aleatorio: a veces una ganga, a veces una trampa.');
      }
    }
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
      if (run.combo >= 2) {
        html += '<div class="net-stat net-combo"><span class="net-lbl">RACHA</span><span>×' + run.combo + ' (+' + Math.min(50, (run.combo - 1) * 10) + ' %)</span></div>';
      }
    } else {
      html += '<div class="net-stat"><span class="net-lbl">Sin asalto activo</span></div>';
    }
    top.innerHTML = html;
    // segunda fila: modificadores + objetivo
    var extra = Util.$('#net-extra');
    if (!extra) {
      extra = Util.el('div', { class: 'net-extra', id: 'net-extra' });
      top.parentNode.insertBefore(extra, top.nextSibling);
    }
    extra.innerHTML = '';
    if (run) {
      (run.modifiers || []).forEach(function (m) {
        extra.appendChild(Util.el('span', { class: 'net-mod ' + m.kind, title: m.desc, text: m.name + (m.kind === 'bad' ? ' ▼' : ' ▲') }));
      });
      if (run.objective) {
        extra.appendChild(Util.el('span', { class: 'net-obj', text: 'Objetivo: ' + run.objective.desc + ' (+' + run.objective.bonus + ' NC)' }));
      }
    }
  }

  /* ---------- mapa en canvas (ramas + conexiones) ---------- */
  var mapCanvas = null;
  var mapCtx = null;

  var KIND_GLYPH = { isp: 'ISP', data: 'D', elite: 'E', loot: 'L', shop: 'S', event: '?', boss: 'B' };
  var KIND_COLOR = { isp: '#3f8fd6', data: '#5a6a8a', elite: '#c050a0', loot: '#3e9e4a', shop: '#d6a83f', event: '#9a6ad6', boss: '#d6403f' };

  function mapLayout(run) {
    // posiciones fijas: ISP abajo-izquierda, 3 ramas en columnas, jefe arriba al centro
    var pos = {};
    var BX = [150, 280, 410];
    var byId = {};
    run.nodes.forEach(function (n) { byId[n.id] = n; });
    pos[run.ispId] = { x: 60, y: 272 };
    // recorrido: hijos directos del ISP definen las ramas
    var isp = byId[run.ispId];
    isp.conn.forEach(function (cid, ci) {
      var cur = byId[cid];
      var depth = 1;
      pos[cid] = { x: BX[ci % 3], y: 232 };
      while (cur && cur.conn.length) {
        var nextId = cur.conn[0];
        var next = byId[nextId];
        if (!next || next.id === run.bossId || pos[nextId]) break;
        depth++;
        pos[nextId] = { x: BX[ci % 3], y: 232 - (depth - 1) * 77 };
        cur = next;
      }
    });
    pos[run.bossId] = { x: 280, y: 22 };
    return pos;
  }

  function drawMap(run) {
    var cv = mapCanvas;
    if (!cv || !mapCtx) return;
    var ctx = mapCtx;
    var W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a1230';
    ctx.fillRect(0, 0, W, H);
    // retícula sutil
    ctx.strokeStyle = 'rgba(120,160,220,.06)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    var pos = mapLayout(run);
    var byId = {};
    run.nodes.forEach(function (n) { byId[n.id] = n; });

    // líneas de conexión
    run.nodes.forEach(function (n) {
      var a = pos[n.id];
      if (!a) return;
      (n.conn || []).forEach(function (cid) {
        var b = pos[cid];
        if (!b) return;
        ctx.strokeStyle = 'rgba(140,180,230,.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    });

    // nodos
    run.nodes.forEach(function (n) {
      var p = pos[n.id];
      if (!p) return;
      var reach = isReachable(run, n);
      var visible = n.explored || run.mapRevealed;
      var sel = selectedId === n.id;
      var x = p.x - 55, y = p.y - 23, w = 110, h = 46;

      ctx.fillStyle = n.drained ? '#123a22' : (reach ? '#12305a' : '#151a26');
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = n.drained ? '#3e9e4a' : (sel ? '#f2c14e' : (n.kind === 'boss' ? '#d6403f' : (reach ? '#3f8fd6' : '#3a4252')));
      ctx.lineWidth = sel ? 3 : 2;
      ctx.strokeRect(x, y, w, h);
      if (n.drained) {
        ctx.fillStyle = '#3e9e4a';
        ctx.font = 'bold 20px Tahoma';
        ctx.fillText('✓', x + w - 18, y + 18);
      }
      // glifo del tipo
      ctx.fillStyle = KIND_COLOR[n.kind] || '#888';
      ctx.font = 'bold 14px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText(visible ? (KIND_GLYPH[n.kind] || '?') : '?', x + 16, y + 20);
      // nombre
      ctx.fillStyle = visible ? '#dfe8f5' : '#6a7288';
      ctx.font = '10px Tahoma';
      var name = visible ? n.name : '???';
      if (name.length > 13) name = name.slice(0, 12) + '…';
      ctx.fillText(name, x + w / 2, y + h - 10);
      // subinfo
      if (visible && !n.drained && n.kind !== 'loot' && n.kind !== 'shop' && n.kind !== 'event' && n.kind !== 'isp') {
        ctx.fillStyle = '#8fa8c8';
        ctx.fillText('FW ' + n.fw + ' · Nv ' + n.lvl, x + w / 2, y + 15);
      } else if (visible && n.kind === 'loot') {
        ctx.fillStyle = '#8fc89a';
        ctx.fillText('botín', x + w / 2, y + 15);
      } else if (visible && n.kind === 'shop') {
        ctx.fillStyle = '#d6c06a';
        ctx.fillText('mercado', x + w / 2, y + 15);
      } else if (visible && n.kind === 'event') {
        ctx.fillStyle = '#b99ad6';
        ctx.fillText('evento', x + w / 2, y + 15);
      } else if (visible && n.kind === 'boss') {
        ctx.fillStyle = '#e0806a';
        ctx.fillText('FW ' + n.fw, x + w / 2, y + 15);
      }
      ctx.textAlign = 'left';
    });

    // etiqueta del jefe
    ctx.fillStyle = '#d6403f';
    ctx.font = 'bold 12px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText('MASTER SERVER', 280, 12);
    ctx.textAlign = 'left';

    // consejo inferior
    ctx.fillStyle = 'rgba(160,200,255,.5)';
    ctx.font = '9px Tahoma';
    ctx.fillText('Haz clic en un nodo alcanzable para atacarlo · Drena nodos conectados para abrir el camino', 12, H - 6);
  }

  function mapHit(run, mx, my) {
    var pos = mapLayout(run);
    var best = null, bestD = 1e9;
    run.nodes.forEach(function (n) {
      var p = pos[n.id];
      if (!p) return;
      var d = Math.sqrt((p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my));
      if (d < 60 && d < bestD) { bestD = d; best = n; }
    });
    return best;
  }

  function renderMap() {
    if (!mapEl) return;
    var S = NS.State.get();
    var run = S.run;
    mapEl.innerHTML = '';
    if (!run) {
      var empty = Util.el('div', { class: 'net-empty' });
      empty.innerHTML = '<div style="font-size:20px;margin-bottom:10px">Mapa de red inactivo</div>' +
        '<div class="cfg-sub" style="margin-bottom:12px">Conecta para generar un asalto procedural. Elige tu ruta entre 3 ramas, esquiva el rastreo y alcanza el MasterServer.</div>';
      var btn = Util.el('button', { class: 'xp-btn primary', text: 'Conectar a la red' });
      btn.addEventListener('click', startRun);
      empty.appendChild(btn);
      mapEl.appendChild(empty);
      return;
    }
    renderTop();
    mapCanvas = Util.el('canvas', { width: 560, height: 322, style: { width: '100%', maxWidth: '560px', display: 'block', margin: '0 auto', cursor: 'pointer' } });
    try {
      mapCtx = mapCanvas.getContext('2d');
    } catch (e) { mapCtx = null; } // motores sin canvas (jsdom)
    mapEl.appendChild(mapCanvas);
    mapCanvas.addEventListener('click', function (e) {
      var r = mapCanvas.getBoundingClientRect();
      var mx = (e.clientX - r.left) * (mapCanvas.width / r.width);
      var my = (e.clientY - r.top) * (mapCanvas.height / r.height);
      var hit = mapHit(run, mx, my);
      if (hit) {
        selectedId = hit.id;
        var reach = isReachable(run, hit);
        if (hit.explored || run.mapRevealed) {
          log('dim', 'Seleccionado: ' + hit.name + ' (' + (KIND_LABEL[hit.kind] || hit.kind) + ')' + (reach ? ' — alcanzable' : ' — bloqueado') + (hit.drained ? ' — ya resuelto' : ''));
        }
        drawMap(run);
        renderActions();
      }
    });
    drawMap(run);

    // leyenda
    var legend = Util.el('div', { class: 'net-legend' });
    legend.appendChild(Util.el('span', { html: '<span class="lg lg-reach"></span> alcanzable' }));
    legend.appendChild(Util.el('span', { html: '<span class="lg lg-lock"></span> bloqueado' }));
    legend.appendChild(Util.el('span', { html: '<span class="lg lg-done"></span> resuelto' }));
    legend.appendChild(Util.el('span', { html: '<span class="lg lg-hidden"></span> sin escanear' }));
    legend.appendChild(Util.el('span', { html: '<span class="lg lg-boss"></span> MasterServer' }));
    legend.appendChild(Util.el('span', { html: '<span class="lg lg-d"></span> datos · <span class="lg lg-l"></span> botín · <span class="lg lg-s"></span> mercado · <span class="lg lg-e"></span> evento · <span class="lg lg-x"></span> élite' }));
    mapEl.appendChild(legend);
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
      row.appendChild(Util.svgIcon(def.icon));
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
      row.appendChild(Util.svgIcon(def.icon));
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
