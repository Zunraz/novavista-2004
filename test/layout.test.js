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

  // saltar boot + diálogo de bienvenida
  await page.click('#boot-screen').catch(function () {});
  await page.waitForTimeout(700);
  var okBtn = await page.$('.dialog-btns .xp-btn');
  if (okBtn) { await okBtn.click(); await page.waitForTimeout(200); }

  // ---- helpers ----
  async function openApp(id) {
    await page.evaluate(function (a) { window.NovaOS.WM.open(a); }, id);
    await page.waitForTimeout(350);
  }
  async function metrics() {
    return page.evaluate(function () {
      var out = { hOverflow: [], zeroText: [], winOverflow: [] };
      var vw = window.innerWidth;
      var all = document.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > vw + 2 && el.closest('.ctx-menu') === null) {
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

  var m = await metrics();
  ok(m.hOverflow.length === 0, 'sin desbordes horizontales en la página', m.hOverflow.slice(0, 8));
  ok(m.zeroText.length === 0, 'sin texto con tamaño 0', m.zeroText.slice(0, 8));
  ok(m.winOverflow.length === 0, 'ventanas sin desbordar su marco', m.winOverflow.slice(0, 8));

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
  await page.screenshot({ path: path.join(shotsDir, 'net-empty.png') });

  // ---- panel de control: pestaña apariencia con 16 avatares ----
  await page.evaluate(function () { window.NovaOS.WM.open('settings'); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shotsDir, 'settings.png') });

  ok(consoleErrors.length === 0, 'sin errores de consola', consoleErrors.slice(0, 5));

  await browser.close();
  console.log('\n' + passed + ' pasaron, ' + failed + ' fallaron (capturas en test/shots/)');
  process.exit(failed ? 1 : 0);
})().catch(function (e) {
  console.error('ERROR en layout test:', e);
  process.exit(1);
});
