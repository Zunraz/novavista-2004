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
  ok(N.Apps.list().length >= 17, 'apps registradas: ' + N.Apps.list().length);

  // aplicaciones registradas esperadas
  var ids = N.Apps.list().map(function (a) { return a.id; });
  ['browser', 'bank', 'social', 'files', 'terminal', 'email', 'av', 'net', 'settings', 'manual', 'msn', 'pinball', 'pool', 'minesweeper', 'achievements', 'taskmgr', 'ranking', 'notepad', 'calc'].forEach(function (id) {
    ok(ids.indexOf(id) !== -1, 'app registrada: ' + id);
  });

  N.WM.open('achievements');
  await wait(50);
  ok(doc.querySelectorAll('#win-achievements .trophy-card').length === N.Catalog.ACHIEVEMENTS.length, 'Sala de Trofeos renderiza todos los logros');
  N.WM.close('achievements');

  // saltar el boot
  click(doc.getElementById('boot-screen'));
  await wait(800);
  ok(doc.getElementById('boot-screen').classList.contains('hidden'), 'boot completado (pantalla oculta)');

  // pantalla de inicio de sesión (cuentas de usuario)
  var login = doc.getElementById('login-screen');
  ok(!login.classList.contains('hidden'), 'pantalla de inicio de sesión visible');
  click(doc.getElementById('login-new'));
  await wait(100);
  var nameInp = login.querySelector('input');
  ok(!!nameInp, 'formulario de cuenta nueva');
  if (nameInp) {
    nameInp.value = 'HackerTest';
    var createBtn = Array.prototype.slice.call(login.querySelectorAll('.xp-btn')).filter(function (b) { return b.textContent.indexOf('Crear cuenta y entrar') !== -1; })[0];
    if (createBtn) click(createBtn);
  }
  await wait(300);
  ok(login.classList.contains('hidden'), 'sesión iniciada (login oculto)');
  ok(N.Save.listProfiles().some(function (p) { return p.name === 'HackerTest'; }), 'cuenta HackerTest creada');
  ok(!!doc.querySelector('.welcome-goals') && doc.querySelectorAll('.welcome-goals span').length === 3,
    'bienvenida estructurada con tres objetivos');
  N.I18n.set('en');
  await wait(80);
  ok(doc.getElementById('btn-start').textContent.indexOf('Start') !== -1, 'idioma inglés aplicado a la barra');
  ok(doc.querySelector('.welcome-goals').textContent.indexOf('Get noticed') !== -1, 'bienvenida traducida al inglés');
  N.I18n.set('es');
  await wait(80);
  ok(doc.getElementById('btn-start').textContent.indexOf('Inicio') !== -1, 'cambio de vuelta a español sin reiniciar');
  click(doc.getElementById('tray-lang'));
  await wait(80);
  ok(N.I18n.get() === 'en' && doc.getElementById('tray-lang').textContent === 'EN', 'selector EN/ES disponible en la bandeja');
  click(doc.getElementById('tray-lang'));
  await wait(80);

  // escritorio con iconos
  var icons = doc.querySelectorAll('.desktop-icon');
  ok(icons.length >= 10, 'iconos del escritorio: ' + icons.length);
  ok(!!doc.querySelector('#mission-guide') && /CTF|OBJETIVO/.test(doc.querySelector('#mission-guide').textContent), 'guía contextual visible en el escritorio');
  ok(!!N.Tutorial && N.Tutorial.steps.length >= 8, 'tutorial guiado cubre los sistemas principales');
  ok(!!doc.querySelector('.di-badge'), 'icono de correo con badge en el escritorio');
  N.WM.open('msn');
  await wait(50);
  ok(!!doc.querySelector('#win-msn .win-resize'), 'ventana de Messenger redimensionable');
  ok(doc.querySelector('#win-msn .msn-cname').textContent === 'N0VA_SYS', 'Messenger fija el contacto de historia primero');
  ok(doc.querySelectorAll('#win-msn .msn-group').length >= 2, 'Messenger agrupa contactos por estado');
  var archiveTab = Array.prototype.slice.call(doc.querySelectorAll('#win-msn .tab-btn')).filter(function (b) { return b.textContent.indexOf('Archivo RED-NOVA') !== -1; })[0];
  click(archiveTab);
  await wait(30);
  ok(doc.querySelectorAll('#win-msn .lore-chapter').length === N.Catalog.LORE.length, 'archivo de historia renderiza todos los capítulos');
  ok(doc.querySelectorAll('#win-msn .lore-chapter.open').length >= 1, 'primer capítulo de historia disponible');
  ok(doc.querySelectorAll('#win-msn .lore-mission-progress').length >= 1, 'misiones narrativas muestran progreso concreto');
  var lorePin = doc.querySelector('#win-msn .pin-btn');
  click(lorePin); await wait(30);
  ok(!!N.State.get().objectives.pinned && !!doc.querySelector('#mission-guide .mission-progress'), 'misión narrativa anclada al widget');
  N.State.unpinObjective(); N.Desktop.refreshGuide();
  N.WM.close('msn');

  // cerrar diálogo de bienvenida si está abierto
  var okBtn = doc.querySelector('.modal-overlay .xp-btn');
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

  // NovaOps: el gameplay principal es un banco de CTF interactivos
  N.State.newGame();
  N.WM.open('net');
  await wait(150);
  ok(!!N.CTF && N.CTF.jobs.length >= 10, 'motor CTF con catálogo ampliable');
  var mainCtf = N.CTF.jobs.filter(function (j) { return j.type === 'main'; }).sort(function (a, b) { return a.order - b.order; });
  ok(mainCtf.length === 7 && mainCtf.every(function (j, i) { return i === 0 ? !j.prereq : j.prereq === mainCtf[i - 1].id; }), 'campaña de siete CTF encadenada por requisitos');
  ok(['inspect','ftp','caesar','hash','layers','packets','choice'].every(function (kind) { return N.CTF.jobs.some(function (j) { return j.stages.some(function (s) { return s.kind === kind; }); }); }), 'catálogo CTF cubre web, FTP, cifrado, hashes, capas, paquetes y decisión final');
  ok(N.CTF.jobs.filter(function (j) { return j.type === 'side'; }).length >= 5 && N.CTF.jobs.some(function (j) { return j.type === 'endgame' && j.repeat === 'daily'; }), 'encargos secundarios y ranura diaria de endgame disponibles');
  ok(N.CTF.caesar('UBSS DHZ OLYL MPYZA', 7) === 'NULL WAS HERE FIRST', 'descifrador César produce la solución esperada');
  ok(N.CTF.transform('V0UtQVJFLU5PVkE=', 'base64') === 'WE-ARE-NOVA', 'decodificador Base64 produce la solución esperada');
  ok(doc.querySelectorAll('#win-net .ctf-job-card').length >= 10, 'banco de trabajos CTF renderizado');
  ok(!!doc.querySelector('#win-net .ctf-start'), 'primer contrato de campaña disponible');
  click(doc.querySelector('#win-net .ctf-start'));
  await wait(40);
  click(doc.querySelector('#win-net .ctf-inspect-btn'));
  await wait(40);
  ok(doc.querySelector('#win-net .ctf-devtools').textContent.indexOf('NOVA-ROOT-01') !== -1, 'CTF web revela la bandera al inspeccionar el HTML');
  var ctfAnswer = doc.querySelector('#win-net .ctf-answer');
  ctfAnswer.value = 'NOVA-ROOT-01';
  click(doc.querySelector('#win-net .ctf-submit-row .primary'));
  await wait(60);
  ok(N.CTF.isCompleted('main-source'), 'primer CTF de campaña completado');
  ok(N.State.get().ctf.reputation >= 1, 'reputación CTF concedida');
  N.UI.closeModals();

  // El mapa táctico se conserva como actividad secundaria compacta
  click(doc.querySelector('#win-net .tab-btn[data-tab="mapa"]'));
  await wait(50);
  var connectBtn = doc.querySelector('.net-empty .xp-btn');
  ok(!!connectBtn, 'botón conectar en mapa vacío');
  if (connectBtn) click(connectBtn);
  await wait(150);
  ok(N.State.get().run !== null, 'asalto iniciado');
  ok(!!doc.querySelector('#win-net .net-intel'), 'Mapa de Red explica el siguiente paso');
  ok(doc.querySelectorAll('#win-net .net-route-node').length >= 5, 'rutas compactas renderizadas como botones grandes');
  ok(doc.querySelectorAll('#win-net .net-action-card').length >= 2, 'protocolos tácticos muestran coste y consecuencia');
  ok(!doc.querySelector('.net-content canvas'), 'el mapa interactivo ya no depende de coordenadas de canvas');
  var runNodes = N.State.get().run.nodes;
  ok(runNodes.length >= 6, 'mapa secundario reducido a pocos nodos: ' + runNodes.length);
  ok(runNodes.some(function (n) { return n.kind !== 'isp' && n.kind !== 'boss'; }), 'encuentros de ruta presentes');
  ok(runNodes.filter(function (n) { return n.kind === 'boss'; }).length === 1, 'un MasterServer');

  // acciones del asalto: seleccionar un destino completo y contrarrestar su ICE
  var s2 = N.State.get();
  var ispNode = s2.run.nodes.filter(function (n) { return n.kind === 'isp'; })[0];
  var first = s2.run.nodes.filter(function (n) { return ispNode.conn.indexOf(n.id) !== -1; })[0];
  ok(!!first, 'hay un nodo alcanzable directo desde el ISP');
  first.kind = 'data';
  if (first.cash <= 0) first.cash = 20;
  if (first.data <= 0) first.data = 15;
  first.fw = 2;
  first.fwMax = 2;
  s2.run.trace = 0;
  N.State.addEnergy(99);
  var routeButton = doc.querySelector('.net-route-node[data-node-id="' + first.id + '"]');
  click(routeButton);
  await wait(30);
  var selectedButton = doc.querySelector('.net-route-node[data-node-id="' + first.id + '"]');
  ok(selectedButton.classList.contains('selected'), 'clic en cualquier punto de la tarjeta selecciona el destino');
  var counter = doc.querySelector('#win-net .net-protocol.recommended');
  ok(!!counter, 'el ICE anuncia un contraprotocol recomendado');
  click(counter);
  await wait(60);
  ok(first.drained, 'el contraprotocol rompe la integridad y extrae el nodo automáticamente');
  ok(s2.run.loot.data > 0, 'botín de datos acumulado: ' + s2.run.loot.data + ' MB');

  // desconectar y cobrar
  click(doc.querySelector('#win-net .net-cashout'));
  await wait(100);
  ok(N.State.get().run === null, 'asalto finalizado tras desconectar');
  ok(N.State.get().meta.nodesDrained >= 1, 'nodesDrained registrado');

  // guardado
  var saved = N.State.saveNow();
  ok(saved, 'guardado correcto');
  // el guardado firmado se escribe en la clave del perfil activo
  var pid = N.Save.currentProfileId();
  var raw = win.localStorage.getItem('novavista.save.v2.' + pid);
  ok(!!raw && raw.length > 100, 'guardado escrito en localStorage');

  // reloj de la bandeja
  ok(doc.getElementById('tray-clock').textContent.length >= 5, 'reloj en la bandeja');
  N.Taskbar.updateMoney();
  ok(doc.getElementById('tray-money').textContent.indexOf('$') !== -1, 'contador de dinero en la bandeja: ' + doc.getElementById('tray-money').textContent);

  // menú inicio
  click(doc.getElementById('btn-start'));
  await wait(100);
  ok(!doc.getElementById('start-menu').classList.contains('hidden'), 'menú inicio se abre');
  click(doc.getElementById('btn-start'));
  await wait(100);

  // menú contextual del escritorio
  N.WM.close('browser');
  doc.getElementById('desktop').dispatchEvent(new win.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 120 }));
  await wait(60);
  var ctxItems = doc.querySelectorAll('.ctx-menu button');
  ok(ctxItems.length >= 4, 'menú contextual con opciones');
  var termItem = null;
  ctxItems.forEach(function (b) { if (b.textContent.indexOf('Abrir terminal') !== -1) termItem = b; });
  if (termItem) {
    termItem.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    termItem.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  await wait(150);
  ok(N.WM.isOpen('terminal'), 'acción del menú contextual abre la terminal');

  // --- iconos: todas las apps abiertas y todas las referencias <use> resuelven ---
  ids.forEach(function (id) { N.WM.open(id); });
  await wait(400);
  // minijuegos: comprobar mecánicas reales, no sólo que exista el canvas
  var cpuLaunch = N.Pool && N.Pool._test.cpuLaunchVector({ dx: 1, dy: 0, power: 0.5 });
  ok(!!cpuLaunch && cpuLaunch.speed === 850 && cpuLaunch.vx === 850,
    'NovaPool: la CPU convierte potencia en un disparo útil');
  N.Pool._test.newGame();
  ok(!!N.Pool._test.cpuPick(), 'NovaPool: la CPU encuentra un tiro desde la rotura');
  ok(N.Pool._test.ballColor(9) && N.Pool._test.ballColor(15), 'NovaPool: todas las bolas listadas tienen color propio');
  var ranked = N.Ranking.sortBy([{ power: 2 }, { power: 9 }, { power: 4 }], 'power');
  ok(ranked[0].power === 9 && ranked[2].power === 2, 'rankings ordenados de mayor a menor');
  if (N.Pinball) {
    N.Pinball._test.newGame();
    N.Pinball._test.charge();
    for (var chargeTick = 0; chargeTick < 12; chargeTick++) N.Pinball._test.step(0.016);
    N.Pinball._test.release();
    ok(!N.Pinball._test.getState().waiting && N.Pinball._test.getState().ball.vy < -400,
      'NovaPinball: el lanzador carga y pone la bola en juego');
  }
  var uses = doc.querySelectorAll('use');
  var missing = [];
  uses.forEach(function (u) {
    var h = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
    var id = h.replace('#', '');
    if (id && !doc.getElementById(id)) missing.push(id);
  });
  ok(missing.length === 0, 'todas las referencias de icono resuelven (' + uses.length + ' usos)' + (missing.length ? ' faltan: ' + missing.join(',') : ''));
  ok(uses.length === 0, 'iconos incrustados literalmente (sin <use>): ' + uses.length);
  var deskSvg = doc.querySelectorAll('.desktop-icon img');
  ok(deskSvg.length >= 16, 'iconos del escritorio incrustados (PNG): ' + deskSvg.length);

  // manual de usuario abierto y con contenido
  ok(N.WM.isOpen('manual'), 'ventana del manual abierta');
  ok(doc.querySelector('.manual-h2') !== null, 'manual con secciones');
  var steps = doc.querySelectorAll('.manual-steps li');
  ok(steps.length >= 5, 'manual con pasos de inicio: ' + steps.length);

  // selector de avatares: 16 opciones en el panel
  N.WM.rerender('settings');
  await wait(100);
  var avatars = doc.querySelectorAll('.avatar-pick');
  ok(avatars.length >= 14, 'selector con 16 avatares: ' + avatars.length);

  // wallpaper nuevo en el catálogo
  ok(N.Catalog.WALLPAPERS.some(function (w) { return w.id === 'bosque'; }), 'wallpaper Bosque nocturno en catálogo');

  // badge de correo: tras drenar un nodo hay misiones reclamables
  N.Mail.refreshBadge();
  var badge = doc.querySelector('.di-badge');
  ok(!!badge && !badge.classList.contains('hidden') && parseInt(badge.textContent, 10) >= 1, 'badge de correo muestra misiones reclamables: ' + (badge ? badge.textContent : '?'));

  // terminal: comando explorer abre el navegador
  N.WM.close('browser');
  var termInput = doc.querySelector('#win-terminal .term-in');
  if (termInput) {
    termInput.value = 'explorer';
    termInput.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }
  await wait(100);
  ok(N.WM.isOpen('browser'), 'comando "explorer" abre el navegador');
  N.WM.close('browser');

  // --- easter egg: código Konami da 50 $ (una vez) ---
  var cashBefore = N.State.get().currencies.cash;
  var konamiKeys = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  konamiKeys.forEach(function (k) {
    doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true }));
  });
  await wait(50);
  var cashAfterKonami = N.State.get().currencies.cash;
  ok(cashAfterKonami >= cashBefore + 50 && cashAfterKonami < cashBefore + 51, 'código Konami da +50 $ (' + cashBefore + ' → ' + cashAfterKonami + ')');
  // segunda vez: sin recompensa
  konamiKeys.forEach(function (k) {
    doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true }));
  });
  await wait(50);
  ok(N.State.get().currencies.cash - cashAfterKonami < 1, 'Konami solo premia una vez por sesión (' + N.State.get().currencies.cash + ')');

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
