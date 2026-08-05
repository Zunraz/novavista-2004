/* ============================================================
   NovaVista 2004 — Símbolo del sistema (consola)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var history = [];
  var histIdx = 0;
  var inputEl = null;
  var outEl = null;

  function line(txt, cls) {
    var div = Util.el('div', { text: txt });
    if (cls) div.className = 'term-' + cls;
    outEl.appendChild(div);
    outEl.scrollTop = outEl.scrollHeight;
  }

  function banner() {
    line('NovaVista 2004 Edition [Versión 5.1.2600]', 'ok');
    line('(C) Copyright 2004 NovaCorp Systems, Ltd.', 'dim');
    line('');
    line('Escriba HELP para ver los comandos disponibles.', 'dim');
    line('');
  }

  function exec(cmd) {
    var c = cmd.trim();
    var parts = c.split(/\s+/);
    var head = (parts[0] || '').toLowerCase();
    var S = NS.State.get();

    switch (head) {
      case 'help':
        line('Comandos disponibles:', 'dim');
        ['HELP     — muestra esta ayuda', 'VER      — versión del sistema', 'CLS      — limpia la pantalla',
         'DIR      — contenido del disco', 'ECHO     — repite un texto', 'TIME     — hora actual', 'DATE     — fecha actual',
         'NOVA     — resumen de tu estado', 'PING     — comprueba la red', 'RED      — información de red',
         'CONECTAR — abre el mapa de red (asaltos)', 'IPCONFIG — configuración de red', 'WHOAMI   — usuario actual',
         'FORMAT   — formatear C: (prestige)', 'MASCOTA  — secretito'].forEach(function (h) { line(h); });
        break;
      case 'ver': line('NovaVista 2004 Edition [Versión 5.1.2600]', 'ok'); break;
      case 'cls': outEl.innerHTML = ''; break;
      case 'dir':
        line('Volumen en C: tiene etiqueta NOVA.', 'dim');
        line('Directorio de C:\\', 'dim');
        line('');
        line('DOCUMENTOS   <CARPETA>   datos personales', '');
        line('DESCARGAS    <CARPETA>   software adquirido', '');
        line('DATOS        <CARPETA>   ' + Util.fmtBytes(S.data.mb * 1024 * 1024) + ' en paquetes', '');
        line('BOTNET       <CARPETA>   ' + S.bots.count + ' bots', '');
        line('  ' + (S.data.maxMB - S.data.mb) + ' MB libres de ' + S.data.maxMB + ' MB', 'dim');
        break;
      case 'echo': line(parts.slice(1).join(' ')); break;
      case 'time': line('La hora actual es: ' + Util.fmtClock(Date.now())); break;
      case 'date': line('La fecha actual es: ' + Util.fmtDate(Date.now())); break;
      case 'nova':
        line('=== ESTADO DEL SISTEMA ===', 'ok');
        line('Efectivo: ' + Util.fmtMoney(S.currencies.cash), '');
        line('Banco: ' + Util.fmtMoney(S.bank.balance) + ' (interés ' + Util.fmtPct(NS.State.bankRate()) + '/s)', '');
        line('Seguidores: ' + Util.fmtInt(S.social.followers), '');
        line('NovaCoins: ' + S.currencies.novaCoins.toFixed(2).replace('.', ',') + ' (+' + (NS.State.botCoinRate()).toFixed(3).replace('.', ',') + '/s)', '');
        line('Datos: ' + Util.fmtBytes(S.data.mb * 1024 * 1024), '');
        line('Nivel: ' + S.currencies.level + ' · XP: ' + Util.fmtInt(S.currencies.xp), '');
        break;
      case 'ping':
        line('Haciendo ping a novanet.com [192.168.1.1] con 32 bytes de datos:', '');
        line('Respuesta desde 192.168.1.1: bytes=32 tiempo=28ms TTL=128', 'ok');
        line('Respuesta desde 192.168.1.1: bytes=32 tiempo=31ms TTL=128', 'ok');
        line('Respuesta desde 192.168.1.1: bytes=32 tiempo=29ms TTL=128', 'ok');
        line('Respuesta desde 192.168.1.1: bytes=32 tiempo=27ms TTL=128', 'ok');
        line('Estadísticas de ping: enviados = 4, recibidos = 4, perdidos = 0 (0 % perdidos)', 'dim');
        break;
      case 'red':
        line('=== RED-NOVA (inalámbrica) ===', 'ok');
        line('SSID: RED-NOVA · Velocidad: 54 Mbps · Señal: 92 %', '');
        line('IP: 192.168.1.42 · Puerta de enlace: 192.168.1.1 · DNS: 8.8.4.4', '');
        line('Paquetes enviados: ' + Util.fmtInt(S.stats.hacks * 37 + 1337) + ' · Perdidos: 0', 'dim');
        break;
      case 'ipconfig':
        line('Adaptador de red inalámbrica RED-NOVA:', '');
        line('   Dirección IP......: 192.168.1.42', '');
        line('   Máscara...........: 255.255.255.0', '');
        line('   Puerta de enlace..: 192.168.1.1', '');
        line('   DNS...............: 8.8.4.4 / 8.8.8.8', 'dim');
        break;
      case 'whoami': line('novavista\\' + S.profile.name.toLowerCase().replace(/[^a-z0-9]/g, ''), 'ok'); break;
      case 'conectar': case 'connect':
        line('Abriendo el mapa de red...', 'ok');
        NS.WM.open('net');
        break;
      case 'format':
        NS.UI.confirm('Formatear C:', '¿Seguro? Esto es el prestige del juego. Requiere NovaCoins acumuladas en total. ¿Abrir el panel de control?')
          .then(function (ok) { if (ok) NS.WM.open('settings'); });
        break;
      case 'mascota':
        line('(^._.^)ノ — el gato de NovaVista te saluda. Te desea suerte en la red.', 'ok');
        break;
      case 'limpiar':
        line('No existe ese comando. Pruebe HELP.', 'err');
        break;
      case '': break;
      default:
        line('«' + head + '» no se reconoce como comando interno o externo.', 'err');
        line('Pruebe HELP para ver la lista de comandos.', 'dim');
    }
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'term-body';
    outEl = Util.el('div', { class: 'term-out' });
    var inputRow = Util.el('div', { class: 'term-inrow' });
    var prompt = Util.el('span', { class: 'term-prompt', text: 'C:\\>' });
    inputEl = Util.el('input', { class: 'term-in', type: 'text', autocomplete: 'off', spellcheck: 'false' });
    inputRow.appendChild(prompt);
    inputRow.appendChild(inputEl);
    body.appendChild(outEl);
    body.appendChild(inputRow);

    banner();
    inputEl.focus();

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var v = inputEl.value;
        line('C:\\>' + v, 'cmd');
        exec(v);
        if (v.trim()) { history.push(v); histIdx = history.length; }
        inputEl.value = '';
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; inputEl.value = history[histIdx] || ''; }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < history.length) { histIdx++; inputEl.value = history[histIdx] || ''; }
      }
    });
    setTimeout(function () { try { inputEl.focus(); } catch (e) {} }, 60);
  }

  NS.Apps.register({
    id: 'terminal', title: 'Símbolo del sistema', icon: 'ic-terminal',
    desktop: true, w: 560, h: 380, minW: 420, minH: 260,
    render: render,
    status: function () { return 'Console — NovaVista 2004'; }
  });
})();
