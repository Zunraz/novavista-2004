/* ============================================================
   NovaVista 2004 — Motor de estado del juego
   Toda la lógica de economía, progresión y guardado vive aquí.
   Sin dependencias del DOM (testeable en Node).
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;
  var Sec = NS.Sec;
  var Cat = NS.Catalog;

  var S = null;               // estado vivo (en closure, inaccesible desde fuera)
  var lastTick = 0;
  var hooks = [];
  var offlineApplied = false;
  var prevTot = null;         // total cash+banco observado (anti-crecimiento anómalo)

  /* ---------------- estado fresco ---------------- */
  function fresh() {
    return {
      meta: {
        version: 2,
        installId: Util.hashStr(String(Date.now()) + Math.random()),
        createdAt: Date.now(), lastSeen: Date.now(), bootCount: 0, totalPlayMs: 0,
        runsDone: 0, runsTraced: 0, nodesDrained: 0, bossesDrained: 0,
        allTimeCoins: 0, legacy: 0, formatsDone: 0, threatsStopped: 0
      },
      profile: { name: 'Usuario', avatar: 0 },
      settings: { theme: 'luna', wallpaper: 'foto1', sound: true, notifs: true },
      desktopIcons: {},
      media: { skin: 'classic', volume: 0.8, currentTrack: 't1', repeat: false, shuffle: false },
      currencies: { cash: 50, novaCoins: 0, xp: 0, level: 1, energy: 12, maxEnergy: 12, legacy: 0 },
      bank: { balance: 50, loanDebt: 0, totalInterest: 0, price: 12 },
      social: { followers: 0, lastPostAt: 0, totalPosts: 0, viralBest: 0 },
      bots: { count: 0 },
      broker: { priceLvl: 0, dataSold: 0 },
      data: { mb: 0, maxMB: 2000 },
      upg: {},
      inventory: { tools: {} },
      av: { level: 0, firewall: 0, malwareStopped: 0, lastScanAt: 0 },
      run: null,
      quests: {},
      events: { nextMalwareAt: 0, nextAdAt: 0 },
      browser: { impressions: 0, auto: 0, clicks: 0 },
      games: { pinball: 0, pinballCash: 0, pool: 0, poolWins: 0 },
      docs: [],
      stats: { clicks: 0, posts: 0, hacks: 0, traces: 0, offlineSessions: 0 }
    };
  }

  function emit(type, payload) {
    hooks.forEach(function (h) { try { h(type, payload); } catch (e) {} });
  }
  function on(hook) { hooks.push(hook); }

  /* ---------------- derivados ---------------- */
  function upg(id) { return S.upg[id] || 0; }
  function incomeMult() {
    var m = 1;
    m *= 1 + 0.015 * S.currencies.level;
    m *= 1 + 0.02 * S.currencies.legacy;
    m *= 1 + 0.04 * upg('i-income');
    return m;
  }
  function bankRate() {
    // Curva LINEAL + rendimientos decrecientes: imposible explotar el banco.
    var raw = (0.00008 + 0.00006 * upg('b-rate') + 0.00006 * upg('b-off')) * (1 + 0.2 * upg('b-cd'));
    return raw / (1 + S.bank.balance / 3000000) * incomeMult();
  }
  function socialAdRate() { return 0.0015 * (1 + 0.5 * upg('s-ad')) * incomeMult(); }
  function followerGrowthRate() { return 0.0006 * upg('s-vrf') * incomeMult(); }
  function botCoinRate() { return S.bots.count * 0.0006 * (1 + 0.4 * upg('b-rig')) * incomeMult(); }
  function energyRegen() { return 0.125 * Math.pow(1.5, upg('e-regen')); }
  function maxEnergy() { return 12 + upg('e-max') + upg('i-energy'); }
  function dataPrice() { return 6 * (1 + 0.5 * upg('d-price')) * incomeMult(); }
  function dataMaxMB() { return 2000 + 500 * upg('d-cap'); }
  function botCount() { return upg('b-count'); }
  function xpForLevel(l) { return Math.floor(40 * Math.pow(l, 1.5)); }
  function legacyForCoins(c) { return Math.floor(10 * Math.sqrt(Math.max(0, c))); }

  /* ---------------- mutadores validados ---------------- */
  function addCash(n) {
    n = Sec.guardNum(n, 'addCash');
    if (n === 0) return;
    S.currencies.cash += n;
    if (S.currencies.cash < 0) { Sec.quarantine('Saldo negativo inválido'); S.currencies.cash = 0; }
  }
  function spendCash(n) {
    n = Sec.guardNum(n, 'spendCash');
    if (n < 0 || S.currencies.cash < n) return false;
    S.currencies.cash -= n;
    return true;
  }
  function addCoins(n) {
    n = Sec.guardNum(n, 'addCoins');
    if (n <= 0) return;
    S.currencies.novaCoins += n;
    S.meta.allTimeCoins += n;
  }
  function spendCoins(n) {
    n = Sec.guardNum(n, 'spendCoins');
    if (n < 0 || S.currencies.novaCoins < n) return false;
    S.currencies.novaCoins -= n;
    return true;
  }
  function addXP(n) {
    n = Sec.guardNum(n, 'addXP');
    if (n <= 0) return;
    S.currencies.xp += n;
    while (S.currencies.xp >= xpForLevel(S.currencies.level + 1)) {
      S.currencies.level++;
      emit('levelup', { level: S.currencies.level });
    }
  }
  function addEnergy(n) {
    n = Sec.guardNum(n, 'addEnergy');
    if (n <= 0) return;
    S.currencies.energy = Math.min(maxEnergy(), S.currencies.energy + n);
  }
  function spendEnergy(n) {
    n = Sec.guardNum(n, 'spendEnergy');
    if (n < 0 || S.currencies.energy < n) return false;
    S.currencies.energy -= n;
    return true;
  }
  function addFollowers(n) {
    n = Sec.guardNum(n, 'addFollowers');
    if (n <= 0) return;
    S.social.followers += n;
  }
  function addDataMB(n) {
    n = Sec.guardNum(n, 'addDataMB');
    if (n <= 0) return;
    var free = S.data.maxMB - S.data.mb;
    var added = Math.min(n, free);
    S.data.mb += added;
    if (added < n) emit('dataOverflow', { lost: n - added });
    return added;
  }
  function sellDataMB(n) {
    n = Sec.guardNum(n, 'sellDataMB');
    if (n <= 0) return 0;
    var real = Math.min(n, S.data.mb);
    if (real <= 0) return 0;
    S.data.mb -= real;
    addCash(real * dataPrice());
    S.broker.dataSold += real;
    return real;
  }

  /* ---------------- compras ---------------- */
  function buyUpgrade(id) {
    var def = Cat.UPGRADES[id];
    if (!def) return { ok: false, why: 'inexistente' };
    var lvl = upg(id);
    if (lvl >= def.max) return { ok: false, why: 'max' };
    var cost = Cat.upgradeCost(def, lvl);
    if (!spendCash(cost)) return { ok: false, why: 'dinero' };
    S.upg[id] = lvl + 1;
    emit('upgrade', { id: id, lvl: S.upg[id] });
    return { ok: true };
  }
  function buyImplant(id) {
    var def = Cat.IMPLANTS[id];
    if (!def) return { ok: false, why: 'inexistente' };
    var lvl = upg(id);
    if (lvl >= def.max) return { ok: false, why: 'max' };
    var cost = Cat.implantCost(def, lvl);
    if (!spendCoins(cost)) return { ok: false, why: 'coins' };
    S.upg[id] = lvl + 1;
    emit('upgrade', { id: id, lvl: S.upg[id] });
    return { ok: true };
  }
  function buyTool(id, qty) {
    var def = Cat.TOOLS[id];
    if (!def) return { ok: false, why: 'inexistente' };
    qty = Sec.guardNum(qty || 1, 'buyTool') || 1;
    qty = Math.max(1, Math.min(99, Math.floor(qty)));
    var cost = def.price * qty;
    if (!spendCash(cost)) return { ok: false, why: 'dinero' };
    S.inventory.tools[id] = (S.inventory.tools[id] || 0) + qty;
    emit('tool', { id: id, qty: S.inventory.tools[id] });
    return { ok: true };
  }
  function useTool(id) {
    if ((S.inventory.tools[id] || 0) <= 0) return false;
    S.inventory.tools[id]--;
    return true;
  }

  /* ---------------- préstamo ---------------- */
  function loanTake(amount) {
    amount = Sec.guardNum(amount, 'loanTake');
    if (amount < 100) return { ok: false };
    S.bank.loanDebt += amount;
    addCash(amount);
    emit('loan', { debt: S.bank.loanDebt });
    return { ok: true };
  }
  function loanRepay() {
    var debt = S.bank.loanDebt;
    if (debt <= 0) return { ok: false };
    if (S.currencies.cash < debt) return { ok: false, why: 'dinero' };
    spendCash(debt);
    S.bank.loanDebt = 0;
    return { ok: true };
  }

  /* ---------------- depósito / retiro del banco ---------------- */
  function deposit(n) {
    n = Sec.guardNum(n, 'deposit');
    if (n <= 0) return { ok: false, why: 'cantidad' };
    if (n > S.currencies.cash) n = S.currencies.cash;
    if (n <= 0) return { ok: false, why: 'dinero' };
    spendCash(n);
    S.bank.balance += n;
    return { ok: true, amount: n };
  }
  function withdraw(n) {
    n = Sec.guardNum(n, 'withdraw');
    if (n <= 0) return { ok: false, why: 'cantidad' };
    if (n > S.bank.balance) n = S.bank.balance;
    if (n <= 0) return { ok: false, why: 'saldo' };
    S.bank.balance -= n;
    addCash(n);
    return { ok: true, amount: n };
  }

  /* ---------------- intercambio NovaCoin ---------------- */
  function stepCoinPrice(dtMs) {
    // paseo aleatorio suave, siempre dentro de [6, 60]
    var p = S.bank.price;
    var drift = (Math.random() - 0.5) * 0.6 * (dtMs / 60000);
    p += drift;
    if (Math.random() < 0.03 * (dtMs / 60000)) p += (Math.random() - 0.5) * 8; // noticia ocasional
    S.bank.price = Math.round(Util.clamp(p, 6, 60) * 100) / 100;
  }
  function buyCoins(amount) {
    var cost = amount * S.bank.price;
    if (!spendCash(cost)) return { ok: false, why: 'dinero' };
    addCoins(amount);
    return { ok: true };
  }
  function sellCoins(amount) {
    var rate = S.bank.price * 0.85;
    amount = Math.min(amount, S.currencies.novaCoins);
    if (amount <= 0) return { ok: false, why: 'coins' };
    addCash(amount * rate);
    S.currencies.novaCoins -= amount;
    return { ok: true };
  }

  /* ---------------- publicaciones sociales ---------------- */
  function makePost() {
    var base = 4 * (1 + 0.4 * upg('s-post'));
    var viral = 0.5 + Math.random() * 1.2;               // multiplicador de viralidad
    var burst = Math.floor(base * viral * (1 + upg('s-vrf') * 0.12));
    addFollowers(burst);
    S.social.totalPosts++;
    S.social.lastPostAt = Sec.now();
    S.social.viralBest = Math.max(S.social.viralBest, viral);
    S.stats.posts++;
    emit('post', { gained: burst, viral: viral });
    return burst;
  }

  /* ---------------- tick ---------------- */
  function tick(dtMs) {
    dtMs = Sec.validateDelta(dtMs);
    if (dtMs <= 0) return;
    var dt = dtMs / 1000;

    // Sincronización de campos derivados (los upgrades se aplican en vivo)
    S.data.maxMB = dataMaxMB();
    S.bots.count = botCount();
    S.currencies.maxEnergy = maxEnergy();

    // En cuarentena los ingresos están suspendidos (el sistema está comprometido)
    if (!Sec.isQuarantined()) {
      // Banco
      var interest = S.bank.balance * bankRate() * dt;
      if (interest > 0) { S.bank.balance += interest; S.bank.totalInterest += interest; }

      // Red social
      var adRev = S.social.followers * socialAdRate() * dt;
      if (adRev > 0) addCash(adRev);
      var growth = S.social.followers * followerGrowthRate() * dt;
      if (growth > 0) S.social.followers += growth;

      // Botnet
      var coins = botCoinRate() * dt;
      if (coins > 0) addCoins(coins);
    }

    // Energía
    S.currencies.energy = Math.min(maxEnergy(), S.currencies.energy + energyRegen() * dt);

    // Deuda
    if (S.bank.loanDebt > 0) S.bank.loanDebt += S.bank.loanDebt * 0.00005 * dt;

    // Precio NovaCoin
    stepCoinPrice(dtMs);

    // Reloj de eventos
    var now = Sec.now();
    if (!S.events.nextMalwareAt) S.events.nextMalwareAt = now + 90000;
    if (now >= S.events.nextMalwareAt) {
      S.events.nextMalwareAt = now + (150000 + Math.random() * 200000);
      emit('malware');
    }
    if (!S.events.nextAdAt) S.events.nextAdAt = now + 60000;
    if (now >= S.events.nextAdAt) {
      S.events.nextAdAt = now + (60000 + Math.random() * 90000);
      emit('ad');
    }

    S.meta.totalPlayMs += dtMs;
    S.meta.lastSeen = now;
    lastTick = now;
  }

  /* ---------------- offline ---------------- */
  function offline(deltaMs) {
    if (offlineApplied) return 0;
    offlineApplied = true;
    if (Sec.isQuarantined()) return 0;
    deltaMs = Sec.guardNum(deltaMs, 'offline');
    var cap = 8 * 3600 * 1000;
    var real = Math.min(Math.max(0, deltaMs), cap);
    if (real < 60000) return 0;
    var dt = real / 1000 * 0.5; // 50 % de eficiencia
    var gained = { cash: 0, coins: 0, followers: 0, interest: 0 };
    gained.interest = S.bank.balance * bankRate() * dt;
    S.bank.balance += gained.interest;
    gained.cash = S.social.followers * socialAdRate() * dt;
    addCash(gained.cash);
    var g = S.social.followers * followerGrowthRate() * dt;
    S.social.followers += g; gained.followers = g;
    gained.coins = botCoinRate() * dt;
    addCoins(gained.coins);
    S.currencies.energy = Math.min(maxEnergy(), S.currencies.energy + maxEnergy() * 0.3);
    S.stats.offlineSessions++;
    emit('offline', gained);
    return real;
  }

  /* ---------------- reinicio de formato (prestige) ---------------- */
  function format() {
    var grant = legacyForCoins(S.meta.allTimeCoins) - S.currencies.legacy;
    if (grant <= 0) return { ok: false, why: 'sin-legado' };
    var keep = {
      meta: S.meta, profile: S.profile, settings: S.settings,
      stats: S.stats
    };
    S = fresh();
    // conservar identidad y progreso duro
    S.meta = keep.meta;
    S.meta.formatsDone++;
    S.profile = keep.profile;
    S.settings = keep.settings;
    S.stats = keep.stats;
    S.currencies.legacy = keep.meta.legacy + grant;
    S.meta.legacy = S.currencies.legacy;
    S.bank.price = 12;
    lastTick = Sec.now();
    prevTot = null;
    emit('format', { grant: grant, legacy: S.currencies.legacy });
    return { ok: true, grant: grant };
  }

  /* ---------------- carga / guardado ---------------- */
  function repair(o) {
    // Recalcula máximos derivados y sanea valores sueltos
    o.currencies.maxEnergy = 12 + (o.upg['e-max'] || 0) + (o.upg['i-energy'] || 0);
    o.currencies.energy = Util.clamp(o.currencies.energy, 0, o.currencies.maxEnergy);
    o.data.maxMB = 2000 + 500 * (o.upg['d-cap'] || 0);
    o.data.mb = Util.clamp(o.data.mb, 0, o.data.maxMB);
    o.av.level = o.upg['av-level'] || 0;
    o.av.firewall = o.upg['av-fw'] || 0;
    o.bots.count = o.upg['b-count'] || 0;
    // Backfill defensivo de contadores de asaltos (saves antiguos/dañados)
    if (!isFinite(o.meta.nodesDrained) || o.meta.nodesDrained < 0) o.meta.nodesDrained = (o.stats && o.stats.hacks) || 0;
    if (!isFinite(o.meta.bossesDrained) || o.meta.bossesDrained < 0) o.meta.bossesDrained = 0;
    if (!o.events.nextMalwareAt) o.events.nextMalwareAt = 0;
    if (!o.browser) o.browser = { impressions: 0, auto: 0, clicks: 0 };
    if (!o.games) o.games = { pinball: 0, pinballCash: 0, pool: 0, poolWins: 0 };
    if (!o.docs) o.docs = [];
    if (!o.desktopIcons || typeof o.desktopIcons !== 'object') o.desktopIcons = {};
    if (!o.media || typeof o.media !== 'object') o.media = { skin: 'classic', volume: 0.8, currentTrack: 't1', repeat: false, shuffle: false };
    // partidas antiguas con un asalto a medias: rellenar los campos nuevos del roguelite
    if (o.run && typeof o.run === 'object') {
      o.run.modifiers = o.run.modifiers || [];
      o.run.modIds = o.run.modIds || o.run.modifiers.map(function (m) { return m.id; });
      o.run.objective = o.run.objective || null;
      o.run.stats = o.run.stats || { drains: 0, crack: 0, bruteforce: 0, tools: {}, maxTrace: 0 };
      o.run.combo = o.run.combo || 0;
      o.run.comboBest = o.run.comboBest || 0;
    }
    return o;
  }

  function loadGame() {
    prevTot = null;
    // la cuarentena es por perfil: releer el flag persistente al entrar en una cuenta
    if (NS.Sec && NS.Sec.reload) NS.Sec.reload();
    var res = NS.Save.load();
    if (res.ok) {
      S = repair(res.state);
      offlineApplied = false;
      lastTick = Sec.now();
      return { ok: true, restored: false };
    }
    if (res.tampered) {
      var backup = NS.Save.loadBackup();
      if (backup) {
        S = repair(backup);
        offlineApplied = false;
        lastTick = Sec.now();
        NS.Save.save(S); // reescribe el guardado bueno por encima del corrupto
        return { ok: true, restored: true };
      }
      // Sin copia válida: partida nueva, en cuarentena
      S = fresh();
      Sec.quarantine('Guardado modificado detectado al cargar');
      lastTick = Sec.now();
      return { ok: true, fresh: true, quarantined: true };
    }
    S = fresh();
    lastTick = Sec.now();
    return { ok: true, fresh: true };
  }

  function newGame() {
    NS.Save.wipe();
    S = fresh();
    lastTick = Sec.now();
    offlineApplied = false;
    prevTot = null;
    emit('reset');
  }

  function saveNow() {
    if (!S || Sec.isQuarantined()) return false;
    S.meta.lastSeen = Sec.now();
    return NS.Save.save(S);
  }

  /* ---------------- acceso ---------------- */
  function get() { return S; }
  function snapshot() { return Util.deepCopy(S); }

  /* Verificador de integridad en memoria: detecta manipulación
     directa del estado (p.ej. vía consola) y dispara cuarentena. */
  function verify() {
    if (!S || Sec.isQuarantined()) return true;
    var c = S.currencies;
    var bad = function (v) { return typeof v !== 'number' || !isFinite(v) || v < 0; };
    var ok = true;
    if (bad(c.cash) || bad(c.novaCoins) || bad(c.xp) || bad(c.energy) || bad(c.level)) ok = false;
    if (c.level < 1) ok = false;
    if (c.energy > maxEnergy() + 0.5) ok = false;
    if (bad(S.bank.balance) || bad(S.bank.loanDebt)) ok = false;
    if (S.bank.price < 4 || S.bank.price > 62 || !isFinite(S.bank.price)) ok = false;
    if (bad(S.data.mb) || S.data.mb > S.data.maxMB + 0.5) ok = false;
    if (bad(S.social.followers) || bad(S.bots.count)) ok = false;
    Object.keys(S.inventory.tools).forEach(function (k) {
      if (bad(S.inventory.tools[k])) ok = false;
    });
    Object.keys(S.upg).forEach(function (k) {
      var v = S.upg[k];
      if (typeof v !== 'number' || !isFinite(v) || v < 0 || v > 100000 || Math.floor(v) !== v) ok = false;
    });
    if (S.run) {
      var r = S.run;
      if (bad(r.trace) || r.trace > 100 || bad(r.loot.data) || bad(r.loot.cash)) ok = false;
    }
    // Ledger anti-crecimiento PROPORCIONAL: el umbral escala con lo que el propio
    // juego puede generar de forma legítima (intereses + publicidad + venta de
    // todo el disco + NovaClick + préstamos + venta de NovaCoins).
    var dtS = 2.5;
    var cont = (S.bank.balance * bankRate() + S.social.followers * socialAdRate()) * dtS * 5;
    var lumpy = S.data.maxMB * dataPrice() * 1.5;
    var click = (S.browser.impressions || 0) * 0.04 * Math.pow(2, S.browser.cpmLvl || 0);
    var loans = S.bank.loanDebt * 0.25;
    var coinSell = S.currencies.novaCoins * S.bank.price;
    var expected = cont + lumpy + click + loans + coinSell + 30000;
    var tot = S.currencies.cash + S.bank.balance;
    if (prevTot !== null && tot - prevTot > expected) ok = false;
    prevTot = tot;
    if (!ok) Sec.quarantine('Estado manipulado en memoria (valores inválidos)');
    return ok;
  }

  /* ---------------- estado inicial ---------------- */
  S = fresh();

  NS.State = Sec.sealApi({
    fresh: fresh, get: get, snapshot: snapshot, on: on, verify: verify,
    tick: tick, offline: offline, loadGame: loadGame, newGame: newGame, saveNow: saveNow,
    addCash: addCash, spendCash: spendCash, addCoins: addCoins, spendCoins: spendCoins,
    addXP: addXP, addEnergy: addEnergy, spendEnergy: spendEnergy,
    addFollowers: addFollowers, addDataMB: addDataMB, sellDataMB: sellDataMB,
    buyUpgrade: buyUpgrade, buyImplant: buyImplant, buyTool: buyTool, useTool: useTool,
    loanTake: loanTake, loanRepay: loanRepay,
    deposit: deposit, withdraw: withdraw,
    buyCoins: buyCoins, sellCoins: sellCoins, makePost: makePost, format: format,
    bankRate: bankRate, socialAdRate: socialAdRate, followerGrowthRate: followerGrowthRate,
    botCoinRate: botCoinRate, energyRegen: energyRegen, maxEnergy: maxEnergy,
    dataPrice: dataPrice, dataMaxMB: dataMaxMB, botCount: botCount,
    xpForLevel: xpForLevel, incomeMult: incomeMult
  });
})();
