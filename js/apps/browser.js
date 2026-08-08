/* ============================================================
   NovaVista 2004 — NovaNet Explorer (navegador simulado)
   Páginas internas: inicio, buscador, noticias, foros,
   descargas (tienda de herramientas), NovaClick y ayuda.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var history = [];
  var histIdx = -1;
  var pageEl = null;
  var addrEl = null;
  var contentEl = null;
  var currentRoute = 'nova://inicio';
  var loading = false;
  var pendingRoute = null;
  var loadTimer = null;

  var FAVS = [
    ['nova://inicio', 'ic-browser', 'Inicio'],
    ['nova://noticias', 'ic-doc', 'Noticias'],
    ['nova://foros', 'ic-users', 'Foros'],
    ['nova://descargas', 'ic-download', 'Descargas'],
    ['nova://novaclick', 'ic-game', 'NovaClick'],
    ['nova://ayuda', 'ic-help', 'Ayuda']
  ];

  /* ---------- utilidades de página ---------- */
  function page(title, inner, opts) {
    return '<div class="web-page' + (opts && opts.dark ? ' web-dark' : '') + '">' +
      (title ? '<div class="web-title">' + Util.esc(title) + '</div>' : '') +
      inner + '</div>';
  }
  function link(route, label) {
    return '<a class="web-link" data-route="' + Util.esc(route) + '">' + Util.esc(label) + '</a>';
  }
  function adBox(text) {
    var id = 'ad' + Math.floor(Math.random() * 1e6);
    return '<div class="web-ad" id="' + id + '">[¡¡ANUNCIO!!] ' + Util.esc(text) + ' <span style="color:#c03030">(publicidad)</span></div>';
  }

  function wireLinks(root) {
    Util.$$('.web-link', root).forEach(function (a) {
      a.addEventListener('click', function () { navigate(a.getAttribute('data-route')); });
    });
    Util.$$('.web-quick-item[data-route]', root).forEach(function (a) {
      a.addEventListener('click', function () { navigate(a.getAttribute('data-route')); });
    });
    Util.$$('.web-ad', root).forEach(function (a) {
      a.addEventListener('click', function () {
        var s = NS.State.get();
        var win = Math.random() < 0.5;
        if (win) { NS.State.addCash(2 + Math.random() * 8); NS.Audio.cash(); }
        NS.UI.toast('Anuncio', win ? 'El anuncio te dio ' + Util.fmtMoney(2 + Math.random() * 8) + ' por «hacer clic».' : 'El anuncio era fraudulento. Perdiste 1 $.', win ? 'good' : 'important', 'ic-info');
      });
    });
  }

  /* ---------- páginas ---------- */
  function pgHome() {
    var s = NS.State.get();
    var h = '<div class="web-search-wrap">' +
      '<div class="web-logo">Nova<span style="color:#c33">Search</span></div>' +
      '<div class="web-searchbox"><input id="web-q" class="xp-input web-q" type="text" placeholder="Buscar en NovaNet..." ' +
      'onkeydown="if(event.key===\'Enter\'){NovaOS.Browser.search(document.getElementById(\'web-q\').value);}"></div>' +
      '<button class="xp-btn" onclick="NovaOS.Browser.search(document.getElementById(\'web-q\').value)">Buscar</button>' +
      '</div>';
    h += '<div class="web-quick">';
    FAVS.slice(0, 5).forEach(function (f) {
      h += '<div class="web-quick-item" data-route="' + f[0] + '">' + Util.svgHtml(f[1], 'icon icon-32') + '<span>' + Util.esc(f[2]) + '</span></div>';
    });
    h += '</div>';
    h += adBox('¡NovaAntivirus 2005 YA DISPONIBLE! Protégete por solo 29,99 $');
    h += adBox('Descarga 10.000 canciones MP3 en 1 minuto — ¡sin virus! (prometido)');
    h += '<div class="web-footer">Hora local del servidor: ' + Util.fmtClock(Date.now()) + ' · Estás en la red RED-NOVA (54 Mbps)</div>';
    return page('NovaSearch — el buscador de los 2000s', h);
  }

  function pgSearch(q) {
    var qs = Util.esc(q || '');
    var results = [
      { t: 'Noticias NovaVista — edición de hoy', u: 'nova://noticias', d: 'Última hora: suben los intereses bancarios, cae la bolsa de NovaCoins, y un gusano ataca RED-NOVA.' },
      { t: 'Foros NovaNet — tema: «Cómo evitar el rastreo en asaltos»', u: 'nova://foros', d: 'Stealth, proxies y buenos hábitos. Los veteranos cuentan sus trucos.' },
      { t: 'Descargas NovaNet — herramientas y software', u: 'nova://descargas', d: 'Kits de explotación, gusanos, payloads cifrados. Todo con garantía de 30 días.' },
      { t: 'NovaClick — el minijuego más adictivo de la red', u: 'nova://novaclick', d: '¡Haz clic! ¡Haz clic! Gana dinero con las impresiones.' },
      { t: 'NovaOps — guía de contratos CTF', u: 'nova://red', d: 'HTML, FTP, cifrados, hashes, paquetes, herramientas y campaña RED-NOVA.' },
      { t: 'Ayuda de NovaVista 2004', u: 'nova://ayuda', d: 'Todo lo que necesitas saber para dominar el sistema.' }
    ];
    var h = '<div class="web-results">';
    h += '<div class="web-rcount">Resultados de «' + qs + '» (0,12 segundos)</div>';
    results.forEach(function (r) {
      h += '<div class="web-result">' +
        '<div class="web-rtitle">' + link(r.u, r.t) + '</div>' +
        '<div class="web-route">' + Util.esc(r.u) + '</div>' +
        '<div class="web-rd">' + Util.esc(r.d) + '</div></div>';
    });
    h += '<div class="web-rcount" style="margin-top:14px">¿No encuentras lo que buscas? Prueba con «foros», «descargas» o «ayuda».</div>';
    h += '</div>';
    return page('Resultados de búsqueda', h);
  }

  function pgNews() {
    var s = NS.State.get();
    var items = [
      { t: 'El Banco Nova sube los intereses un 12 %', d: 'Los analistas recomiendan mantener el saldo alto para aprovechar el interés compuesto. Los certificados de depósito siguen siendo la opción conservadora.' },
      { t: 'Las NovaCoins, ¿burbuja o futuro?', d: 'El precio de la NovaCoin fluctúa entre 6 $ y 60 $. Expertos advierten: «minar es gratis, comprar es un riesgo».' },
      { t: 'Nueva oleada de malware en RED-NOVA', d: 'Un gusano desconocido intenta colarse en los PCs de los usuarios. NovaShield recomienda mantener el antivirus al día y el cortafuegos activo.' },
      { t: 'MyNova supera los 100 millones de usuarios', d: 'La red social más popular del 2004 estrena cámara digital de 3 megapíxeles. Los «seguidores» se han convertido en moneda.' },
      { t: 'Entrevista: «Yo mino NovaCoins con una botnet casera»', d: 'Un vecino de NovaVista cuenta cómo su granja de 5 bots le paga la conexión a internet. «Es legal... creo», bromea.' }
    ];
    var h = '<div class="web-news">';
    h += '<div class="web-rcount">NovaNoticias — ' + Util.fmtDate(Date.now()) + '</div>';
    items.forEach(function (it) {
      h += '<div class="web-news-item"><div class="web-rtitle">' + Util.esc(it.t) + '</div><div class="web-rd">' + Util.esc(it.d) + '</div></div>';
    });
    h += '</div>';
    return page('NovaNoticias', h);
  }

  function pgForos() {
    var h = '<div class="web-news">';
    h += '<div class="web-rcount">Foros NovaNet — ' + Util.fmtInt(Math.floor(5000 + NS.State.get().stats.posts * 3)) + ' usuarios conectados</div>';
    var threads = [
      { t: '[Guía] Cómo evitar el rastreo en operaciones de red', a: 'RastreadorPro', r: '42', d: 'Fantasma limpia rastro y contrarresta los barridos. Guarda proxies para el núcleo y genera Enfoque antes de un élite.' },
      { t: '¿Merece la pena la chapa verificada?', a: 'Fama_Total', r: '17', d: 'El crecimiento orgánico de seguidores se dispara. Recomendada si ya tienes 1.000 seguidores.' },
      { t: 'Vendí 1 GB de datos y me compré el disco duro mayor', a: 'DataLord', r: '9', d: 'Con el acuerdo de datos al nivel 5, cada MB paga casi nada... invierte antes en precio.' },
      { t: 'El MasterServer es IMPOSIBLE', a: 'noob_2004', r: '38', d: 'Lleva Enfoque para lanzar zero-days, guarda energía y arma un payload antes de romper su integridad.' },
      { t: '¿Alguien ha formateado C:?', a: 'Veterano', r: '21', d: 'El legado da +3 % por punto y es permanente. Espera a tener 100+ NovaCoins acumuladas en total.' }
    ];
    threads.forEach(function (t) {
      h += '<div class="web-news-item">' +
        '<div class="web-rtitle">' + Util.esc(t.t) + '</div>' +
        '<div class="web-rd">por <b>' + Util.esc(t.a) + '</b> · ' + t.r + ' respuestas · ' + Util.esc(t.d) + '</div></div>';
    });
    h += '</div>';
    return page('Foros NovaNet', h);
  }

  function pgDescargas() {
    var S = NS.State.get();
    var h = '<div class="web-news"><div class="web-rcount">Tienda de software — pagas con tu efectivo (no con NovaCoins)</div>';
    Object.keys(NS.Catalog.TOOLS).forEach(function (tid) {
      var def = NS.Catalog.TOOLS[tid];
      var owned = S.inventory.tools[tid] || 0;
      h += '<div class="web-dl-item">' +
        Util.svgHtml(def.icon, 'icon icon-24') +
        '<div style="flex:1"><div class="web-rtitle">' + Util.esc(def.name) + '</div>' +
        '<div class="web-rd">' + Util.esc(def.desc) + ' (tienes: ' + owned + ')</div></div>' +
        '<button class="xp-btn small" data-tool="' + tid + '">Comprar — ' + Util.fmtMoney(def.price) + '</button></div>';
    });
    h += '<div class="web-rd" style="margin-top:8px">Las wordlists, tablas arcoíris y capturadores se usan en los <b>contratos CTF</b>; las demás herramientas sirven en la <b>Red táctica</b>. Algunas también aparecen como botín.</div>';
    h += '</div>';
    return page('Descargas NovaNet', h);
  }

  function pgNovaClick() {
    var s = NS.State.get();
    var b = s.browser || {};
    var autoLvl = b.autoLvl || 0;
    var cpmLvl = b.cpmLvl || 0;
    var autoCost = Math.floor(150 * Math.pow(2.2, autoLvl));
    var cpmCost = Math.floor(400 * Math.pow(3, cpmLvl));
    var imp = b.impressions || 0;
    var value = imp * 0.01 * Math.pow(2, cpmLvl);
    var h = '<div class="web-click">' +
      '<div class="web-logo" style="font-size:26px">Nova<span style="color:#c33">Click</span></div>' +
      '<div class="web-click-count">' + Util.fmtInt(imp) + ' impresiones</div>' +
      '<div class="web-click-value">Valor: ' + Util.fmtMoney(value) + '</div>' +
      '<button class="xp-btn click-big" onclick="NovaOS.Browser.clickImp()">¡HAZ CLIC!</button>' +
      '<div class="cfg-sub">Cada clic = 1 impresión · 0,01 $ por impresión (CPM mejorable)</div>' +
      '<div class="web-dl-item"><div style="flex:1"><div class="web-rtitle">Autoclic de marquesina</div><div class="web-rd">+1 impresión/s (nivel ' + autoLvl + ')</div></div>' +
      '<button class="xp-btn small" onclick="NovaOS.Browser.buyAuto()">' + Util.fmtMoney(autoCost) + '</button></div>' +
      '<div class="web-dl-item"><div style="flex:1"><div class="web-rtitle">Mejor CPM</div><div class="web-rd">x2 valor por impresión (nivel ' + cpmLvl + ')</div></div>' +
      '<button class="xp-btn small" onclick="NovaOS.Browser.buyCpm()">' + Util.fmtMoney(cpmCost) + '</button></div>' +
      '<div class="web-dl-item"><div style="flex:1"><div class="web-rtitle">Cobrar publicidad</div><div class="web-rd">Convierte impresiones en efectivo</div></div>' +
      '<button class="xp-btn primary small" onclick="NovaOS.Browser.cashImp()">Cobrar ' + Util.fmtMoney(value) + '</button></div>' +
      '</div>';
    return page('NovaClick — el minijuego', h, { dark: true });
  }

  function pgRed() {
    var s = NS.State.get();
    var h = '<div class="web-news"><div class="web-rcount">Guía oficial de NovaOps · campaña ' + (NS.CTF ? NS.CTF.mainProgress() : 0) + '/7</div>';
    h += '<div class="web-news-item"><div class="web-rtitle">El bucle principal</div><div class="web-rd">Acepta un contrato, lee el objetivo exacto, examina la evidencia y entrega la bandera o respuesta. Los siete casos principales conectan las cuatro épocas; los secundarios cuentan historias independientes y pagan dinero, XP, fama y reputación.</div></div>';
    h += '<div class="web-news-item"><div class="web-rtitle">Tipos de CTF</div><div class="web-rd">Inspección de HTML, credenciales FTP débiles, César, hashes de diccionario, capas Base64/ROT13 y reconstrucción de paquetes. Son simulaciones locales y ficticias: NovaOps no realiza ninguna conexión ni ataca servicios reales.</div></div>';
    h += '<div class="web-news-item"><div class="web-rtitle">Herramientas y pistas</div><div class="web-rd">El Laboratorio mejora el mapeador, la wordlist, el descifrador y el rig de hashes. Las pistas conservan el progreso, pero descuentan reputación. Descargas vende consumibles capaces de acelerar tareas concretas.</div></div>';
    h += '<div class="web-news-item"><div class="web-rtitle">Red táctica opcional</div><div class="web-rd">El mapa conserva una operación roguelite corta para obtener dinero y datos. Gestiona ICE, energía y rastro, y cobra cuando quieras. No bloquea ningún contrato de historia.</div></div>';
    h += '</div>';
    return page('NovaOps — guía CTF', h);
  }

  function pgAyuda() {
    var h = '<div class="web-news"><div class="web-rcount">Centro de ayuda de NovaVista 2004</div>';
    var faqs = [
      ['¿Qué hago primero?', 'Abre NovaOps y completa «La página que no existe». El widget del escritorio siempre señala el siguiente contrato principal o la época que debes instalar.'],
      ['¿Cómo gano dinero?', 'Los contratos CTF pagan al completarlos. También tienes intereses del banco, publicidad de MyNova, venta de datos, Red táctica y NovaClick.'],
      ['¿Qué son las NovaCoins?', 'La moneda meta del roguelite: se minan con bots, se obtienen en asaltos profundos y se gastan en implantes. Acumúlalas para el legado.'],
      ['¿Qué es el legado?', 'Al formatear C: conviertes tu historial de NovaCoins en puntos de legado permanentes (+3 % de ingresos cada uno).'],
      ['¿Por qué me rastrean?', 'Cada acción en un asalto suma rastro. El sigilo, los proxies y la energía bien gestionada son la clave. Si llega a 100, pierdes el botín.'],
      ['¿Las pistas bloquean algo?', 'No. Conservas el progreso y puedes terminar el CTF; solamente reducen la reputación obtenida en ese contrato.'],
      ['¿Qué hago con los datos?', 'Véndelos en Mis Archivos. Invierte en el acuerdo de datos y en disco duro antes de acumular mucho.'],
      ['¿Es seguro este navegador?', 'NovaNet Explorer solo muestra páginas internas de NovaVista. Las páginas externas están bloqueadas por el filtro de seguridad (según el diseño del sistema).']
    ];
    faqs.forEach(function (f) {
      h += '<div class="web-news-item"><div class="web-rtitle">' + Util.esc(f[0]) + '</div><div class="web-rd">' + Util.esc(f[1]) + '</div></div>';
    });
    h += '</div>';
    return page('Ayuda de NovaVista', h);
  }

  function pg404(route) {
    return page('No se puede mostrar la página', '<div class="web-404">' +
      '<div class="web-404-code">404</div>' +
      '<div class="web-rd">No se pudo encontrar «' + Util.esc(route) + '».</div>' +
      '<div class="web-rd">El filtro de seguridad de NovaVista bloquea el acceso a páginas externas (http://). Prueba un destino interno.</div>' +
      link('nova://inicio', 'Volver al inicio') + '</div>');
  }

  function routeToHtml(route) {
    if (route.indexOf('nova://buscar') === 0) {
      var q = '';
      try { q = decodeURIComponent(route.split('q=')[1] || ''); } catch (e) { q = ''; }
      return pgSearch(q);
    }
    switch (route) {
      case 'nova://inicio': return pgHome();
      case 'nova://noticias': return pgNews();
      case 'nova://foros': return pgForos();
      case 'nova://descargas': return pgDescargas();
      case 'nova://novaclick': return pgNovaClick();
      case 'nova://red': return pgRed();
      case 'nova://ayuda': return pgAyuda();
      default: return pg404(route);
    }
  }

  /* ---------- navegación ---------- */
  function navigate(route, push) {
    var s = NS.State.get();
    if (route.indexOf('http') === 0) {
      NS.UI.toast('NovaNet Explorer', 'El filtro de seguridad bloqueó la página externa: ' + Util.esc(route), 'important', 'ic-lock');
      NS.Audio.error();
      return;
    }
    // Una navegación nueva sustituye a la carga anterior. La implementación
    // antigua encolaba destinos y hacía que una doble navegación tardase hasta
    // un segundo o mostrase fugazmente la página equivocada.
    if (loading && loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
      loading = false;
      pendingRoute = null;
    }
    if (push !== false) {
      history = history.slice(0, histIdx + 1);
      history.push(route);
      histIdx = history.length - 1;
    }
    currentRoute = route;
    renderPage(route);
  }

  function renderPage(route) {
    loading = true;
    pendingRoute = null;
    if (addrEl) addrEl.value = route;
    var s = NS.State.get();
    if (contentEl) contentEl.innerHTML = '<div class="web-loading"><div class="web-loading-bar"></div><div>Cargando ' + Util.esc(route) + '...</div></div>';
    NS.Audio.tick();
    loadTimer = setTimeout(function () {
      loadTimer = null;
      loading = false;
      if (!contentEl) return;
      contentEl.innerHTML = routeToHtml(route);
      wireLinks(contentEl);
      // botones de descargas
      Util.$$('[data-tool]', contentEl).forEach(function (b) {
        var tid = b.getAttribute('data-tool');
        b.addEventListener('click', function () {
          var r = NS.State.buyTool(tid, 1);
          if (r.ok) {
            NS.Audio.cash();
            NS.UI.toast('Descargas', 'Compraste 1× ' + Util.esc(NS.Catalog.TOOLS[tid].name) + '.', 'good', 'ic-download');
            renderPage(route);
          } else NS.UI.toast('Descargas', 'No tienes efectivo suficiente.', 'important', 'ic-error');
        });
      });
      if (pendingRoute) { var r2 = pendingRoute; pendingRoute = null; navigate(r2, true); }
    }, 280 + Math.random() * 220);
  }

  /* ---------- API expuesta a la UI (onclick inline) ---------- */
  function search(q) {
    q = String(q || '').trim().slice(0, 60);
    if (!q) return;
    navigate('nova://buscar?q=' + encodeURIComponent(q));
  }
  function clickImp() {
    var s = NS.State.get();
    s.browser.impressions = (s.browser.impressions || 0) + 1;
    s.browser.clicks = (s.browser.clicks || 0) + 1;
    s.stats.clicks++;
    NS.Audio.tick();
    if (NS.WM.isOpen('browser')) NS.WM.rerender('browser');
  }
  function buyAuto() {
    var s = NS.State.get();
    var lvl = s.browser.autoLvl || 0;
    var cost = Math.floor(150 * Math.pow(2.2, lvl)); // el coste se re-deriva: no se confía en el caller
    if (!NS.State.spendCash(cost)) { NS.UI.toast('NovaClick', 'Sin dinero.', 'important', 'ic-error'); return; }
    s.browser.autoLvl = lvl + 1;
    NS.Audio.cash();
    if (NS.WM.isOpen('browser')) NS.WM.rerender('browser');
  }
  function buyCpm() {
    var s = NS.State.get();
    var lvl = s.browser.cpmLvl || 0;
    var cost = Math.floor(400 * Math.pow(3, lvl));
    if (!NS.State.spendCash(cost)) { NS.UI.toast('NovaClick', 'Sin dinero.', 'important', 'ic-error'); return; }
    s.browser.cpmLvl = lvl + 1;
    NS.Audio.cash();
    if (NS.WM.isOpen('browser')) NS.WM.rerender('browser');
  }
  function cashImp() {
    var s = NS.State.get();
    var imp = s.browser.impressions || 0;
    if (imp <= 0) return;
    var val = imp * 0.015 * Math.pow(2, s.browser.cpmLvl || 0);
    NS.State.addCash(val);
    s.browser.impressions = 0;
    NS.Audio.cash();
    NS.UI.toast('NovaClick', 'Cobraste ' + Util.fmtMoney(val) + ' por ' + Util.fmtInt(imp) + ' impresiones.', 'good', 'ic-coin');
    if (NS.WM.isOpen('browser')) NS.WM.rerender('browser');
  }

  /* ---------- app ---------- */
  function render(body) {
    body.innerHTML = '';
    body.className = 'web-root';

    var toolbar = Util.el('div', { class: 'web-toolbar' });
    function navBtn(label, fn, title) {
      var b = Util.el('button', { class: 'xp-btn small', text: label, title: title || '' });
      b.addEventListener('click', fn);
      toolbar.appendChild(b);
    }
    navBtn('←', function () {
      if (histIdx > 0) { histIdx--; currentRoute = history[histIdx]; renderPage(currentRoute); }
    }, 'Atrás');
    navBtn('→', function () {
      if (histIdx < history.length - 1) { histIdx++; currentRoute = history[histIdx]; renderPage(currentRoute); }
    }, 'Adelante');
    navBtn('↻', function () { renderPage(currentRoute); }, 'Actualizar');
    navBtn('⌂', function () { navigate('nova://inicio'); }, 'Inicio');

    addrEl = Util.el('input', { class: 'xp-input web-addr', type: 'text', value: currentRoute, spellcheck: 'false' });
    addrEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') navigate(addrEl.value);
    });
    toolbar.appendChild(addrEl);
    var go = Util.el('button', { class: 'xp-btn small', text: 'Ir' });
    go.addEventListener('click', function () { navigate(addrEl.value); });
    toolbar.appendChild(go);

    var favs = Util.el('div', { class: 'web-favs' });
    FAVS.forEach(function (f) {
      var b = Util.el('button', { class: 'web-fav', title: f[2] });
      b.appendChild(Util.svgIcon(f[1]));
      b.appendChild(document.createTextNode(f[2]));
      b.addEventListener('click', function () { navigate(f[0]); });
      favs.appendChild(b);
    });

    contentEl = Util.el('div', { class: 'web-content' });
    var status = Util.el('div', { class: 'web-status', text: 'Listo' });

    body.appendChild(toolbar);
    body.appendChild(favs);
    body.appendChild(contentEl);
    body.appendChild(status);
    pageEl = body;

    renderPage(currentRoute);
  }

  function tick() {
    var s = NS.State.get();
    if (!s.browser) s.browser = { impressions: 0, auto: 0, clicks: 0 };
    var auto = s.browser.autoLvl || 0;
    if (auto > 0) {
      s.browser.impressions = (s.browser.impressions || 0) + auto * 0.2; // 5 ticks/s → auto impresiones por segundo
    }
  }

  NS.Apps.register({
    id: 'browser', title: 'NovaNet Explorer', icon: 'ic-browser',
    desktop: true, w: 680, h: 480, minW: 520, minH: 360,
    render: render, tick: tick
  });
  NS.Browser = {
    navigate: navigate, search: search, clickImp: clickImp,
    buyAuto: buyAuto, buyCpm: buyCpm, cashImp: cashImp
  };
})();
