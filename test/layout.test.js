/* ============================================================
   Verificador de maquetación con Chromium headless (playwright)
   Detecta desbordes horizontales, texto ilegible (tamaño 0),
   errores de consola y genera capturas en test/shots/.
   Ejecutar: node test/layout.test.js [dist]
   ============================================================ */
'use strict';
var path = require('path');
var fs = require('fs');
var { chromium } = require('playwright-core');

var root = path.join(__dirname, '..');
var useDist = process.argv[2] === 'dist';
var target = useDist ? path.join(root, 'dist', 'index.html') : path.join(root, 'index.html');
var shotsDir = path.join(__dirname, 'shots');
if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

var passed = 0, failed = 0;
function ok(cond, name, extra) {
  if (cond) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (extra !== undefined ? ' — ' + JSON.stringify(extra) : '')); }
}

(async function () {
  var browser = await chromium.launch();
  var page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  var consoleErrors = [];
  page.on('console', function (m) { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', function (e) { consoleErrors.push('PAGEERROR: ' + e.message); });

  await page.goto('file://' + target.replace(/\\/g, '/'));
  await page.waitForTimeout(900);

  // saltar boot + iniciar sesión (crear cuenta)
  await page.click('#boot-screen').catch(function () {});
  await page.waitForTimeout(700);
  var loginVis = await page.evaluate(function () {
    return !document.getElementById('login-screen').classList.contains('hidden');
  });
  ok(loginVis, 'pantalla de inicio de sesión visible tras el boot');
  await page.click('#login-new').catch(function () {});
  await page.waitForTimeout(150);
  await page.fill('#login-box input', 'LayoutTest');
  await page.click('#login-box .xp-btn.primary');
  await page.waitForTimeout(600);
  var loginGone = await page.evaluate(function () {
    return document.getElementById('login-screen').classList.contains('hidden');
  });
  ok(loginGone, 'sesión iniciada');
  var startUi = await page.evaluate(function () {
    var apps = document.getElementById('taskbar-apps');
    return {
      panes: document.querySelectorAll('#btn-start .start-logo i').length,
      gap: parseFloat(getComputedStyle(apps).gap) || 0
    };
  });
  ok(startUi.panes === 4, 'icono Inicio compuesto y correctamente renderizado');
  ok(startUi.gap >= 5, 'botones de tareas con separación legible');
  await page.evaluate(function () { window.NovaOS.I18n.set('en'); });
  await page.waitForTimeout(150);
  var englishUi = await page.evaluate(function () {
    return document.documentElement.lang === 'en' && document.getElementById('btn-start').textContent.indexOf('Start') !== -1;
  });
  ok(englishUi, 'cambio inmediato al idioma inglés');
  var okBtn = await page.$('.modal-overlay .xp-btn');
  if (okBtn) { await okBtn.click(); await page.waitForTimeout(200); }

  // ---- helpers ----
  async function openApp(id) {
    await page.evaluate(function (a) { window.NovaOS.WM.open(a); }, id);
    await page.waitForTimeout(350);
  }
  async function metrics() {
    return page.evaluate(function () {
      function inScrollable(el) {
        var p = el.parentElement;
        while (p) {
          var s = getComputedStyle(p);
          if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 1) return true;
          p = p.parentElement;
        }
        return false;
      }
      var out = { hOverflow: [], zeroText: [], winOverflow: [] };
      var vw = window.innerWidth;
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > vw + 2 && el.closest('.ctx-menu') === null && !inScrollable(el)) {
          out.hOverflow.push(el.className && el.className.toString ? (el.className.toString().slice(0, 40)) : el.tagName);
        }
        // texto con caja de tamaño 0 (no renderiza)
        if (el.children.length === 0 && (el.textContent || '').trim() && r.width === 0 && r.height === 0) {
          out.zeroText.push((el.textContent || '').trim().slice(0, 30));
        }
      }
      // ventanas abiertas: su cuerpo no debe desbordar su propio contenedor
      document.querySelectorAll('.window').forEach(function (w) {
        var body = w.querySelector('.win-body');
        if (!body) return;
        var wb = w.getBoundingClientRect();
        var bb = body.getBoundingClientRect();
        if (bb.right > wb.right + 2 || bb.left < wb.left - 2) {
          out.winOverflow.push(w.id + ' body se sale de la ventana');
        }
      });
      return out;
    });
  }

  var ids = await page.evaluate(function () {
    return window.NovaOS.Apps.list().map(function (a) { return a.id; });
  });

  console.log('Abriendo ' + ids.length + ' apps...');
  for (var i = 0; i < ids.length; i++) {
    await openApp(ids[i]);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(shotsDir, 'all-open.png') });

  var untranslated = await page.evaluate(function () {
    var re = /[¿¡]|\b(Partida|Historial|Nivel|Victorias|Ganadas|Consejo|Selecciona|Cargando|Aún|Todavía|Mejoras|Estadísticas|Publicaciones|seguidores|dinero|datos|energía|rastro|botín|Guardar|Buscar|Enviar|Cuenta|Sonido|para|desde|hasta|cada|puedes|tienes|esta|este|cuando|como|todos|ahora|más|menos|nuevo|nueva|mejor|primero|antes|después)\b/i;
    var found = [];
    document.querySelectorAll('.window:not(.hidden),#taskbar,#start-menu,.modal-overlay').forEach(function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var n;
      while ((n = walker.nextNode())) {
        var value = (n.nodeValue || '').trim();
        if (value && re.test(value) && !/^nova:\/\//i.test(value) && found.indexOf(value) === -1) found.push(value.slice(0, 100));
      }
    });
    return found;
  });
  ok(untranslated.length === 0, 'interfaz inglesa sin fragmentos españoles', untranslated.slice(0, 50));

  var m = await metrics();
  ok(m.hOverflow.length === 0, 'sin desbordes horizontales en la página', m.hOverflow.slice(0, 8));
  ok(m.zeroText.length === 0, 'sin texto con tamaño 0', m.zeroText.slice(0, 8));
  ok(m.winOverflow.length === 0, 'ventanas sin desbordar su marco', m.winOverflow.slice(0, 8));
  var tutorialVisible = await page.$('.tutorial-step');
  ok(!!tutorialVisible, 'tutorial guiado visible para una cuenta nueva');
  await page.evaluate(function () { window.NovaOS.UI.closeModals(); });

  // ---- navegador: cada página interna ----
  var routes = ['nova://inicio', 'nova://noticias', 'nova://foros', 'nova://descargas', 'nova://novaclick', 'nova://ayuda', 'nova://red', 'nova://buscar?q=prueba'];
  await page.evaluate(function () { window.NovaOS.WM.open('browser'); });
  await page.waitForTimeout(300);
  for (var r = 0; r < routes.length; r++) {
    await page.evaluate(function (rt) { window.NovaOS.Browser.navigate(rt); }, routes[r]);
    await page.waitForTimeout(650);
    var h = await page.evaluate(function () {
      var w = document.getElementById('win-browser');
      var c = w ? w.querySelector('.web-content') : null;
      if (!c) return { bad: true, why: 'sin contenido' };
      var cw = c.scrollWidth, cc = c.clientWidth;
      return { bad: cw > cc + 2, why: cw + ' > ' + cc };
    });
    ok(!h.bad, 'página ' + routes[r] + ' sin desborde horizontal' + (h.bad ? ' — ' + h.why : ''));
  }

  // ---- terminal y mapa de red ----
  await page.evaluate(function () { window.NovaOS.WM.open('terminal'); });
  await page.waitForTimeout(300);
  await page.type('#win-terminal .term-in', 'nova');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  var termOk = await page.evaluate(function () {
    var out = document.querySelector('#win-terminal .term-out');
    return out && out.scrollHeight >= out.clientHeight - 1 && out.textContent.indexOf('ESTADO') !== -1;
  });
  ok(termOk, 'la terminal renderiza la salida de NOVA');

  await page.evaluate(function () { window.NovaOS.WM.open('net'); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shotsDir, 'ctf-board.png') });
  var ctfBoard = await page.evaluate(function () {
    return !!window.NovaOS.CTF && document.querySelectorAll('#win-net .ctf-job-card').length >= 10 && !!document.querySelector('#win-net .ctf-start');
  });
  ok(ctfBoard, 'NovaOps abre por defecto el banco de trabajos CTF');
  await page.click('#win-net .ctf-start');
  await page.click('#win-net .ctf-inspect-btn');
  var inspectedFlag = await page.$eval('#win-net .ctf-devtools', function (el) { return el.textContent.indexOf('NOVA-ROOT-01') !== -1; });
  ok(inspectedFlag, 'el primer CTF permite inspeccionar el HTML real del reto');
  await page.fill('#win-net .ctf-answer', 'NOVA-ROOT-01');
  await page.click('#win-net .ctf-submit-row .primary');
  await page.waitForTimeout(100);
  var ctfCompleted = await page.evaluate(function () { return window.NovaOS.CTF.isCompleted('main-source'); });
  ok(ctfCompleted, 'la bandera correcta completa el CTF y persiste el progreso');
  await page.evaluate(function () { window.NovaOS.UI.closeModals(); });
  await page.click('#win-net .tab-btn[data-tab="mapa"]');
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(shotsDir, 'net-empty.png') });
  var netEmpty = await page.evaluate(function () {
    var w = document.getElementById('win-net');
    return {
      connectButtons: w.querySelectorAll('.net-empty .xp-btn').length,
      consoleOpen: w.querySelector('.net-console-wrap').open
    };
  });
  ok(netEmpty.connectButtons === 1, 'mapa inactivo con una sola llamada a conectar');
  ok(!netEmpty.consoleOpen, 'consola avanzada plegada por defecto');
  await page.click('#win-net .net-empty .xp-btn');
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(shotsDir, 'net-active.png') });
  var netActive = await page.evaluate(function () {
    var run = window.NovaOS.State.get().run;
    return !!run && run.nodes.length >= 6 && document.querySelectorAll('#win-net .net-route-node').length >= 5 && !!document.querySelector('#win-net .net-protocol');
  });
  ok(netActive, 'operación activa con rutas pulsables y protocolos tácticos');
  var tacticalTarget = await page.evaluate(function () {
    var N = window.NovaOS;
    var run = N.State.get().run;
    var isp = run.nodes.filter(function (n) { return n.kind === 'isp'; })[0];
    var node = run.nodes.filter(function (n) { return isp.conn.indexOf(n.id) !== -1; })[0];
    node.kind = 'data'; node.fw = 2; node.fwMax = 2;
    if (!node.data) node.data = 12;
    if (!node.cash) node.cash = 20;
    N.State.addEnergy(99);
    return node.id;
  });
  await page.click('#win-net .net-route-node[data-node-id="' + tacticalTarget + '"]', { position: { x: 3, y: 3 } });
  var edgeClickSelected = await page.$eval('#win-net .net-route-node[data-node-id="' + tacticalTarget + '"]', function (el) { return el.classList.contains('selected'); });
  ok(edgeClickSelected, 'el clic en el borde de una tarjeta también selecciona el nodo');
  await page.click('#win-net .net-protocol.recommended');
  var tacticalResolved = await page.evaluate(function (id) {
    return window.NovaOS.State.get().run.nodes.filter(function (n) { return n.id === id; })[0].drained;
  }, tacticalTarget);
  ok(tacticalResolved, 'un contraprotocol resuelve la brecha en el navegador real');

  // ---- panel de control: pestaña apariencia con 16 avatares ----
  await page.evaluate(function () { window.NovaOS.WM.open('settings'); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shotsDir, 'settings.png') });

  // el manual debe poder hacer scroll (no recortarse abajo)
  var manualScroll = await page.evaluate(function () {
    var m = document.querySelector('.manual-wrap');
    if (!m) return { bad: true, why: 'sin .manual-wrap' };
    return { bad: m.scrollHeight <= m.clientHeight + 1, why: m.scrollHeight + ' / ' + m.clientHeight };
  });
  ok(!manualScroll.bad, 'el manual hace scroll sin recortarse' + (manualScroll.bad ? ' — ' + manualScroll.why : ''));

  // los juegos dibujan su canvas
  var canvases = await page.evaluate(function () {
    var out = {};
    var pin = document.querySelector('#win-pinball canvas');
    var pool = document.querySelector('#win-pool canvas');
    if (pin) out.pinball = { w: pin.width, h: pin.height };
    if (pool) out.pool = { w: pool.width, h: pool.height };
    return out;
  });
  ok(canvases.pinball && canvases.pinball.w === 360 && canvases.pinball.h === 560, 'pinball con canvas de 360x560');
  ok(canvases.pool && canvases.pool.w === 640 && canvases.pool.h === 360, 'pool con canvas de 640x360');

  ok(consoleErrors.length === 0, 'sin errores de consola', consoleErrors.slice(0, 5));

  await browser.close();
  console.log('\n' + passed + ' pasaron, ' + failed + ' fallaron (capturas en test/shots/)');
  process.exit(failed ? 1 : 0);
})().catch(function (e) {
  console.error('ERROR en layout test:', e);
  process.exit(1);
});
