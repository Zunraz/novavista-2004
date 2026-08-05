/* ============================================================
   Smoke test de integración (jsdom) — ejecuta el juego real
   Ejecutar: node test/dom.test.js
   ============================================================ */
'use strict';
var path = require('path');
var fs = require('fs');
var { JSDOM } = require('jsdom');

var root = path.join(__dirname, '..');
var target = process.env.TARGET || path.join(root, 'index.html');
var html = fs.readFileSync(target, 'utf8');

var dom = new JSDOM(html, {
  url: 'file://' + target.replace(/\\/g, '/'),
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  beforeParse: function (win) {
    // silenciar AudioContext inexistente y consola ruidosa
    win.AudioContext = undefined;
    win.webkitAudioContext = undefined;
    // jsdom no da localStorage en file:// — lo stubeamos para probar el guardado
    var mem = {};
    try { Object.defineProperty(win, 'localStorage', {
      configurable: true,
      value: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        setItem: function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; },
        clear: function () { mem = {}; }
      }
    }); } catch (e) {}
  }
});

var win = dom.window;
var doc = win.document;

function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function click(el) {
  el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
}
function dblclick(el) {
  el.dispatchEvent(new win.MouseEvent('dblclick', { bubbles: true, cancelable: true }));
}

var passed = 0, failed = 0;
function ok(cond, name, extra) {
  if (cond) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '')); }
}

(async function () {
  // esperar a que los scripts carguen y se registren las apps
  await wait(600);
  var N = win.NovaOS;
  ok(!!N, 'NovaOS cargado');
  ok(!!N.State && !!N.WM && !!N.Browser && !!N.Net, 'módulos principales expuestos');
  ok(N.Apps.list().length >= 9, 'apps registradas: ' + N.Apps.list().length);

  // aplicaciones registradas esperadas
  var ids = N.Apps.list().map(function (a) { return a.id; });
  ['browser', 'bank', 'social', 'files', 'terminal', 'email', 'av', 'net', 'settings'].forEach(function (id) {
    ok(ids.indexOf(id) !== -1, 'app registrada: ' + id);
  });

  // saltar el boot
  click(doc.getElementById('boot-screen'));
  await wait(800);
  ok(doc.getElementById('boot-screen').classList.contains('hidden'), 'boot completado (pantalla oculta)');

  // escritorio con iconos
  var icons = doc.querySelectorAll('.desktop-icon');
  ok(icons.length >= 9, 'iconos del escritorio: ' + icons.length);

  // cerrar diálogo de bienvenida si está abierto
  var okBtn = doc.querySelector('.dialog-btns .xp-btn');
  if (okBtn) click(okBtn);
  await wait(200);

  // abrir ventana del banco
  N.WM.open('bank');
  await wait(150);
  var bankWin = doc.getElementById('win-bank');
  ok(!!bankWin, 'ventana del banco abierta');
  ok(doc.querySelectorAll('.tb-btn').length >= 1, 'botón en la barra de tareas');
  var balanceTxt = bankWin && bankWin.textContent.match(/\$\d+/);
  ok(!!balanceTxt, 'el banco muestra saldo: ' + (balanceTxt ? balanceText(bankWin) : ''));

  // el bucle de tick corre y el dinero crece
  var s0 = N.State.snapshot();
  await wait(1600);
  var s1 = N.State.snapshot();
  ok(s1.meta.totalPlayMs > s0.meta.totalPlayMs, 'el bucle del juego avanza');

  // navegador: abrir y navegar
  N.WM.open('browser');
  await wait(200);
  N.Browser.navigate('nova://descargas');
  await wait(700);
  ok(doc.querySelector('.web-dl-item') !== null, 'página de descargas renderizada');
  N.Browser.navigate('nova://novaclick');
  await wait(700);
  ok(doc.querySelector('.click-big') !== null, 'página NovaClick renderizada');

  // clic en el minijuego
  var big = doc.querySelector('.click-big');
  if (big) { click(big); click(big); }
  await wait(100);
  ok((N.State.get().browser.impressions || 0) >= 2, 'impresiones de NovaClick: ' + N.State.get().browser.impressions);

  // asalto de red
  N.State.newGame();
  N.WM.open('net');
  await wait(150);
  var connectBtn = doc.querySelector('.net-empty .xp-btn');
  ok(!!connectBtn, 'botón conectar en mapa vacío');
  if (connectBtn) click(connectBtn);
  await wait(150);
  ok(N.State.get().run !== null, 'asalto iniciado');
  var nodes = doc.querySelectorAll('.net-node');
  ok(nodes.length >= 7, 'nodos renderizados: ' + nodes.length);

  // acciones del asalto: escanear y drenar el primer nodo
  var s2 = N.State.get();
  var first = s2.run.nodes.filter(function (n) { return n.kind !== 'isp'; })[0];
  s2.run.trace = 0;
  N.State.addEnergy(99); // se recorta al máximo legítimo (12)
  // seleccionar nodo y usar acciones directamente
  N.Net._testHooks = N.Net._testHooks || {};
  // simular escaneo + crack + upload mediante la API interna no expuesta: usamos la consola
  var netInput = doc.querySelector('.net-console .term-in');
  function netCmd(v) {
    netInput.value = v;
    netInput.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }
  netCmd('scan ' + first.name.split(' ')[0]);
  await wait(50);
  netCmd('crack ' + first.name.split(' ')[0]);
  await wait(50);
  // forzar firewall a 0 si el crack falló (los tests no dependen del azar)
  first.fw = 0;
  netCmd('upload ' + first.name.split(' ')[0]);
  await wait(50);
  ok(first.drained, 'primer nodo drenado');
  ok(s2.run.loot.data > 0, 'botín de datos acumulado: ' + s2.run.loot.data + ' MB');

  // desconectar y cobrar
  netCmd('disconnect');
  await wait(100);
  ok(N.State.get().run === null, 'asalto finalizado tras desconectar');
  ok(N.State.get().meta.nodesDrained >= 1, 'nodesDrained registrado');

  // guardado
  var saved = N.State.saveNow();
  ok(saved, 'guardado correcto');
  var raw = win.localStorage.getItem('novavista.save.v2');
  ok(!!raw && raw.length > 100, 'guardado escrito en localStorage');

  // reloj de la bandeja
  ok(doc.getElementById('tray-clock').textContent.length >= 5, 'reloj en la bandeja');

  // menú inicio
  click(doc.getElementById('btn-start'));
  await wait(100);
  ok(!doc.getElementById('start-menu').classList.contains('hidden'), 'menú inicio se abre');
  click(doc.getElementById('btn-start'));
  await wait(100);

  console.log('\n' + passed + ' pasaron, ' + failed + ' fallaron');
  process.exit(failed ? 1 : 0);
})().catch(function (e) {
  console.error('ERROR en smoke test:', e);
  process.exit(1);
});

function balanceText(winEl) {
  var m = winEl.textContent.match(/[\d.,]+/);
  return m ? m[0] : '?';
}
