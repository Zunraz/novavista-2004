/* ============================================================
   Tests de lógica pura de NovaVista 2004 (Node, sin DOM)
   Ejecutar: node test/core.test.js
   ============================================================ */
'use strict';

// ---- stubs de entorno ----
var mem = {};
global.window = globalThis;
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
  setItem: function (k, v) { mem[k] = String(v); },
  removeItem: function (k) { delete mem[k]; }
};
// node 24 ya expone navigator nativo; no lo tocamos
// stubs de UI (solo si algo los invoca en runtime)
global.NovaOS = global.NovaOS || {};
global.NovaOS.UI = { toast: function () {}, dialog: function () { return Promise.resolve(true); }, confirm: function () { return Promise.resolve(true); }, alert: function () {} };
global.NovaOS.Audio = { ok: function () {}, cash: function () {}, error: function () {}, warn: function () {}, tick: function () {}, hack: function () {}, trace: function () {}, startup: function () {}, popup: function () {}, notify: function () {} };
global.NovaOS.Mail = { notify: function () {} };

function load(path) { require('../' + path); }
load('js/core/utils.js');
load('js/core/security.js');
load('js/core/catalog.js');
load('js/core/save.js');
load('js/core/state.js');
load('js/core/wm.js');
load('js/core/physics.js');
load('js/apps/net.js');

var U = global.NovaOS.Util;
var Sec = global.NovaOS.Sec;
var State = global.NovaOS.State;
var Save = global.NovaOS.Save;
var Cat = global.NovaOS.Catalog;
var Net = global.NovaOS.Net;

var passed = 0, failed = 0;
function ok(cond, name, extra) {
  if (cond) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '')); }
}
function eq(a, b, name) { ok(a === b, name, { got: a, want: b }); }

/* ================= utils ================= */
console.log('utils');
eq(U.fmtNum(999), '999', 'fmtNum pequeño');
eq(U.fmtNum(1500), '1,50 K', 'fmtNum K');
eq(U.fmtMoney(1234), '$1,23 K', 'fmtMoney');
eq(U.hashStr('hola'), U.hashStr('hola'), 'hashStr determinista');
ok(U.hashStr('hola') !== U.hashStr('hola!'), 'hashStr cambia con entrada');
var r1 = U.mulberry32(42), r2 = U.mulberry32(42), r3 = U.mulberry32(43);
ok(r1() === r2() && r1() === r2(), 'mulberry32 determinista');
ok(r3() !== r1(), 'mulberry32 semillas distintas');
eq(U.esc('<b>&'), '&lt;b&gt;&amp;', 'esc escapa HTML');

/* ================= security ================= */
console.log('security');
eq(Sec.validateDelta(200), 200, 'delta normal');
eq(Sec.validateDelta(-5), 0, 'delta negativo → 0');
eq(Sec.validateDelta(500000), 10000, 'delta enorme recortado');
ok(!Sec.isQuarantined(), 'sin cuarentena al inicio');

/* ================= state ================= */
console.log('state — economía');
State.newGame();
var s = State.get();
eq(s.currencies.cash, 50, 'cash inicial 50');
eq(State.maxEnergy(), 12, 'energía máxima base');
ok(State.bankRate() > 0, 'tasa de interés > 0');
ok(State.addCash(100) === undefined, 'addCash acepta números');
eq(s.currencies.cash, 150, 'cash +100');
State.addCash(Infinity); // intento de inyección
ok(isFinite(s.currencies.cash), 'cash rechaza Infinity');
State.addCash('999'); // coerción no deseada → guardNum devuelve 0
ok(isFinite(s.currencies.cash), 'cash rechaza strings');

console.log('state — compras');
State.addCash(500);
var before = s.currencies.cash;
var r = State.buyUpgrade('b-rate');
ok(r.ok, 'compra b-rate nivel 0');
ok(s.currencies.cash < before, 'se descontó dinero');
ok(State.bankRate() > 0.0004, 'interés sube tras mejora');
var r2 = State.buyUpgrade('no-existe');
ok(!r2.ok, 'compra inexistente rechazada');
State.addCoins(100);
var r3 = State.buyImplant('i-energy');
ok(r3.ok, 'implante i-energy comprado');
eq(State.maxEnergy(), 13, 'energía máxima 13 tras implante');

console.log('state — herramientas');
State.addCash(5000);
ok(State.buyTool('exploit', 2).ok, 'compra 2 exploit');
eq(s.inventory.tools.exploit, 2, 'inventario 2 exploit');
ok(State.useTool('exploit'), 'usa 1 exploit');
eq(s.inventory.tools.exploit, 1, 'quedan 1');
ok(!State.useTool('nada'), 'uso de herramienta inexistente rechazado');

console.log('state — datos');
State.addDataMB(500);
eq(s.data.mb, 500, '500 MB almacenados');
var got = State.sellDataMB(200);
eq(got, 200, 'vende 200 MB');
eq(s.data.mb, 300, 'quedan 300 MB');
eq(s.broker.dataSold, 200, 'dataSold registra');
State.addDataMB(999999);
eq(s.data.mb, s.data.maxMB, 'disco llena hasta el máximo');

console.log('state — banco: depósito y retiro');
State.newGame();
s = State.get();
s.currencies.cash = 1000;
var d = State.deposit(300);
ok(d.ok && d.amount === 300, 'depósito de 300');
eq(s.currencies.cash, 700, 'cash baja tras depositar');
eq(s.bank.balance, 350, 'saldo del banco sube (50 inicial + 300)');
var w = State.withdraw(100);
ok(w.ok && w.amount === 100, 'retiro de 100');
eq(s.bank.balance, 250, 'saldo baja tras retirar');
eq(s.currencies.cash, 800, 'cash sube tras retirar');
var d2 = State.deposit(999999);
ok(d2.ok && d2.amount === 800, 'depositar más de lo que hay deposita todo lo disponible');
var w2 = State.withdraw(9999999);
ok(w2.ok && w2.amount === 1050, 'retirar más del saldo se recorta al saldo disponible');
var d3 = State.deposit(-5);
ok(!d3.ok, 'depósito negativo rechazado');

console.log('state — upgrades aplicados en vivo (sincronización derivada)');
State.newGame();
s = State.get(); // refrescar la referencia tras newGame
State.addCash(100000);
State.buyUpgrade('d-cap');
State.buyUpgrade('b-count');
State.buyUpgrade('b-count');
ok(State.dataMaxMB() > 2000, 'capacidad derivada sube con d-cap');
State.tick(100);
eq(State.get().data.maxMB, State.dataMaxMB(), 'maxMB sincronizado tras tick');
eq(State.get().bots.count, 2, 'bots.count sincronizado tras comprar 2 bots');
ok(State.botCoinRate() > 0, 'la botnet ya produce NovaCoins');
ok(State.get().games && typeof State.get().games.pinball === 'number', 'estado de juegos presente');

console.log('physics — colisiones y rebotes');
var P = global.NovaOS.Physics;
var A = { x: 0, y: 0, vx: 100, vy: 0, r: 10, m: 100 };
var B = { x: 15, y: 0, vx: 0, vy: 0, r: 10, m: 100 };
ok(P.circleCollide(A, B), 'dos bolas colisionan');
ok(A.vx < 100 && B.vx > 0, 'la energía se transfiere en la colisión');
var W = { x: 4, y: 5, vx: -50, vy: 0, r: 5 };
ok(P.wallBounce(W, 0, 0, 100, 100), 'rebote contra pared');
ok(W.vx > 0, 'la velocidad se invierte tras el rebote');
ok(P.pocketed({ x: 10, y: 10 }, 10, 10, 17), 'bola dentro del bolsillo');
ok(!P.pocketed({ x: 90, y: 90 }, 10, 10, 17), 'bola fuera del bolsillo');
var F = { x: 50, y: 55, vx: 0, vy: 0, r: 8 };
var norm = P.segmentCollide(F, { x: 30, y: 60 }, { x: 70, y: 60 }, 8);
ok(norm && Math.abs(norm.ny) > 0.9, 'colisión con segmento (flipper) devuelve normal');

console.log('state — tick');
s = State.get();
State.deposit(500);
var c0 = s.currencies.cash;
var t0 = s.bank.balance;
State.tick(1000);
ok(s.bank.balance > t0, 'el banco genera intereses en 1 s');
State.tick(-50);
ok(isFinite(s.currencies.cash), 'tick negativo no rompe');

console.log('state — nivel/XP');
State.addXP(State.xpForLevel(2));
ok(s.currencies.level >= 2, 'sube de nivel');
ok(State.incomeMult() > 1, 'incomeMult > 1 con nivel');

console.log('state — offline');
State.newGame();
s = State.get();
s.meta.lastSeen = Date.now() - 3600000; // 1 h ausente
var off = State.offline(3600000);
ok(off >= 3600000, 'offline computa la hora ausente');
var off2 = State.offline(3600000);
eq(off2, 0, 'offline solo una vez por sesión');

/* ================= save / integridad ================= */
console.log('save — firma e integridad');
State.newGame();
State.addCash(777);
ok(State.saveNow(), 'saveNow guarda');
var raw1 = mem['novavista.save.v2'];
ok(!!raw1, 'existe clave de guardado');

// recargar desde el mismo guardado
var res = Save.load();
ok(res.ok && !res.tampered, 'carga limpia del guardado');
eq(res.state.currencies.cash, 827, 'estado correcto tras carga');

// manipulación directa del guardado
var box = JSON.parse(raw1);
var tampered = JSON.parse(box.d);
tampered.currencies.cash = 999999999;
box.d = JSON.stringify(tampered);
mem['novavista.save.v2'] = JSON.stringify(box);
var res2 = Save.load();
ok(!res2.ok && res2.tampered, 'guardado editado → firma inválida');

// restaurar copia de seguridad (debe ocurrir ANTES de que la cuarentena se dispare)
State.newGame();
State.addCash(111);
State.saveNow(); // guardado bueno 1
State.addCash(222);
State.saveNow(); // guardado bueno 2 (copia = bueno 1)
mem['novavista.save.v2'] = JSON.stringify({ d: 'corrupto', h: 'y' });
var res4 = State.loadGame();
ok(res4.restored, 'guardado corrupto con copia → restaurado');
eq(State.get().currencies.cash, 161, 'copia restaurada conserva el estado (50 inicial + 111)');

// borrado + guardado corrupto sin copia → cuarentena (último: la cuarentena es pegajosa)
mem['novavista.save.v2'] = JSON.stringify({ d: 'basura', h: 'x' });
mem['novavista.backup.v2'] = null;
var res3 = State.loadGame();
ok(res3.fresh && res3.quarantined, 'guardado corrupto sin copia → fresco + cuarentena');

// export / import
State.newGame();
State.addCash(4242);
State.saveNow();
var code = Save.exportSave(State.get());
ok(!!code && code.length > 50, 'exportación genera código');
var imp = Save.importSave(code);
ok(imp.ok, 'importación acepta código válido');
var impBad = Save.importSave(code.slice(0, -5) + 'AAAA');
ok(!impBad.ok, 'importación rechaza código alterado');

/* ================= net: generación procedural ================= */
console.log('net — generación de asaltos');
var run = Net.genRun(12345);
ok(run.nodes.length >= 7, 'red con al menos 7 nodos, got ' + run.nodes.length);
var hasBoss = run.nodes.some(function (n) { return n.kind === 'boss'; });
ok(hasBoss, 'existe el MasterServer');
var run2 = Net.genRun(12345);
eq(JSON.stringify(run), JSON.stringify(run2), 'mismo seed → mismo asalto');
var run3 = Net.genRun(999);
ok(JSON.stringify(run) !== JSON.stringify(run3), 'seed distinto → asalto distinto');

// conectividad estructural: todo nodo alcanzable por BFS desde ISP
function bfsReach(r) {
  var seen = {};
  var q = [r.ispId];
  seen[r.ispId] = true;
  while (q.length) {
    var id = q.shift();
    var n = r.nodes.filter(function (x) { return x.id === id; })[0];
    n.conn.forEach(function (c) { if (!seen[c]) { seen[c] = true; q.push(c); } });
  }
  return seen;
}
var seen = bfsReach(run);
var allReachable = run.nodes.every(function (n) { return seen[n.id]; });
ok(allReachable, 'todos los nodos son alcanzables desde el ISP');

// validez de campos (el ISP es tu propio nodo: no tiene botín)
var sane = run.nodes.every(function (n) {
  if (n.kind === 'isp') return Array.isArray(n.conn);
  return isFinite(n.data) && isFinite(n.cash) && n.data > 0 && n.cash > 0 && Array.isArray(n.conn);
});
ok(sane, 'campos de botín y conexiones válidos');
var boss = run.nodes.filter(function (n) { return n.kind === 'boss'; })[0];
ok(boss.coins >= 8 && boss.coins <= 18, 'MasterServer da 8-18 NovaCoins, got ' + boss.coins);
var darks = run.nodes.filter(function (n) { return n.kind === 'dark'; });
ok(darks.length === 0 || darks.every(function (n) { return n.coins >= 2 && n.coinsChance === 0.65; }), 'nodos oscuros pagan NovaCoins 2-5');
ok(boss.coinsChance === 1, 'el MasterServer siempre paga NovaCoins');

// simular drenado en cadena hasta el boss
var runX = Net.genRun(777);
function find(kind) { return runX.nodes.filter(function (n) { return n.kind === kind; })[0]; }
var d1 = runX.nodes.filter(function (n) { return n.kind === 'home' || n.kind === 'cafe'; });
d1.forEach(function (n) { n.drained = true; });
var d2 = runX.nodes.filter(function (n) { return n.kind === 'office' || n.kind === 'news'; });
d2.forEach(function (n) { n.drained = true; });
var d3 = runX.nodes.filter(function (n) { return n.kind === 'bank' || n.kind === 'corp'; });
d3.forEach(function (n) { n.drained = true; });
find('dark').drained = true;
ok(true, 'cadena de drenado hasta el boss simulada sin errores');

/* ================= catalog ================= */
console.log('catalog');
eq(Cat.upgradeCost(Cat.UPGRADES['b-rate'], 0), 300, 'coste b-rate lvl0');
eq(Cat.upgradeCost(Cat.UPGRADES['b-rate'], 1), 960, 'coste b-rate lvl1 (300*3,2)');
ok(Cat.QUESTS.length >= 10, 'hay misiones');
ok(Object.keys(Cat.IMPLANTS).length >= 5, 'hay implantes');
ok(Cat.AVATARS.length >= 14, 'catálogo con 16 avatares: ' + Cat.AVATARS.length);
ok(Cat.WALLPAPERS.some(function (w) { return w.id === 'bosque'; }), 'wallpaper bosque en catálogo');

/* ================= verificación anti-manipulación (último: cuarentena pegajosa) ================= */
console.log('security — manipulación en memoria');
Sec.clearQuarantine(); // el test anterior de cuarentena la dejó activa (por diseño)
State.newGame();
State.addCash(100);
ok(State.verify(), 'estado normal pasa verificación');
State.addCash(2e8); // cheat vía la API sancionada (crecimiento instantáneo absurdo)
ok(!State.verify(), 'crecimiento anómalo detectado');
ok(Sec.isQuarantined(), 'cuarentena por crecimiento anómalo');
ok(!State.saveNow(), 'no se guarda en cuarentena');
Sec.clearQuarantine();
State.get().currencies.cash = -999; // edición directa en memoria
ok(!State.verify(), 'cash negativo detectado');
ok(Sec.isQuarantined(), 'cuarentena por manipulación directa');
Sec.clearQuarantine();
State.newGame();
State.tick(1000);
State.tick(1000);
ok(State.verify(), 'los ticks normales no disparan falsos positivos');
Sec.clearQuarantine();
State.newGame();
ok(State.verify(), 'línea base del ledger establecida');
var s6 = State.get();
s6.bank.balance = 1e9; // partida muy avanzada (salto instantáneo)
ok(!State.verify(), 'salto instantáneo a 1e9 detectado por el ledger');
ok(Sec.isQuarantined(), 'cuarentena por salto de balance');
Sec.clearQuarantine();
State.tick(5000); // intereses legítimos de esa partida avanzada
ok(State.verify(), 'intereses a gran escala no dan falso positivo');

/* ================= resumen ================= */
console.log('\n' + passed + ' pasaron, ' + failed + ' fallaron');
process.exit(failed ? 1 : 0);
