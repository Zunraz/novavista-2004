/* ============================================================
   NovaVista 2004 — Secuencia de arranque, reinicio y apagado
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};

  var BIOS_LINES = [
    ['NovaVista 2004 Edition — BIOS v2.04', 'b-ok'],
    ['Copyright (C) 2004 NovaCorp Systems, Ltd.', ''],
    ['', ''],
    ['CPU: Pentium IV 2.4 GHz', 'b-ok'],
    ['Memoria: 256 MB DDR (comprobando...)  OK', 'b-ok'],
    ['Disco: 40 GB ATA 100  OK', 'b-ok'],
    ['Tarjeta de red: Realtek RTL8139  OK', 'b-ok'],
    ['Módem: 56K V.92  detectado', 'b-warn'],
    ['Detectando dispositivos IDE...  OK', 'b-ok'],
    ['Detectando unidades USB...  ninguna', 'b-warn'],
    ['', ''],
    ['Iniciando NovaVista 2004...', 'b-ok']
  ];

  var booting = false;
  var bootDone = false;

  function setBootVis(vis) {
    var el = NS.Util.$('#boot-screen');
    if (el) el.classList.toggle('hidden', !vis);
  }

  function run() {
    if (booting || bootDone) return;
    booting = true;
    var biosEl = NS.Util.$('#boot-bios');
    var barEl = NS.Util.$('#boot-bar');
    var skipEl = NS.Util.$('#boot-skip');
    biosEl.innerHTML = '';
    barEl.style.width = '0%';

    var lineIdx = 0;
    var cancel = false;
    var onSkip = function () { cancel = true; finish(); };
    NS.Util.$('#boot-screen').addEventListener('click', onSkip);

    function typeLine(line, cls) {
      if (cancel) return;
      var div = document.createElement('div');
      if (cls) div.className = cls;
      var i = 0;
      return new Promise(function (res) {
        (function step() {
          if (cancel) { div.textContent = line; res(); return; }
          div.textContent = line.slice(0, i);
          i += 2;
          if (i <= line.length) setTimeout(step, 4);
          else res();
        })();
      }).then(function () {
        biosEl.appendChild(div);
        biosEl.scrollTop = biosEl.scrollHeight;
      });
    }

    function nextLine() {
      if (cancel) return Promise.resolve();
      if (lineIdx >= BIOS_LINES.length) return Promise.resolve();
      var l = BIOS_LINES[lineIdx++];
      if (!l[0]) { biosEl.appendChild(document.createElement('br')); return nextLine(); }
      return typeLine(l[0], l[1]).then(function () {
        return new Promise(function (r) { setTimeout(r, lineIdx < 3 ? 160 : 40); });
      }).then(nextLine);
    }

    function progress() {
      return new Promise(function (res) {
        var p = 0;
        (function step() {
          if (cancel) { barEl.style.width = '100%'; res(); return; }
          p += 1 + Math.random() * 3;
          barEl.style.width = Math.min(100, p) + '%';
          if (p >= 100) { setTimeout(res, 250); }
          else setTimeout(step, 24);
        })();
      });
    }

    function finish() {
      if (booting === false) return;
      booting = false;
      bootDone = true;
      NS.Util.$('#boot-screen').removeEventListener('click', onSkip);
      setTimeout(function () {
        setBootVis(false);
        if (NS.Login && NS.Login.show) NS.Login.show();
        else if (NS.Main && NS.Main.enterDesktop) NS.Main.enterDesktop();
      }, 300);
    }

    nextLine().then(progress).then(finish);
  }

  /* ---------- apagado / reinicio ---------- */
  function doShutdown() {
    NS.State.saveNow();
    NS.Audio.shutdown();
    NS.Util.$('#shutdown-screen').classList.remove('hidden');
    NS.Util.$('#shutdown-msg').textContent = 'Es seguro apagar el equipo.';
    NS.Util.$('#btn-power-on').textContent = 'Encender';
    NS.Util.$('#btn-power-on').onclick = function () {
      NS.Util.$('#shutdown-screen').classList.add('hidden');
      window.location.reload();
    };
  }

  function doRestart() {
    NS.State.saveNow();
    NS.Audio.shutdown();
    NS.Util.$('#shutdown-screen').classList.remove('hidden');
    NS.Util.$('#shutdown-msg').textContent = 'Reiniciando NovaVista 2004...';
    NS.Util.$('#btn-power-on').textContent = 'Continuar';
    NS.Util.$('#btn-power-on').onclick = function () {
      NS.Util.$('#shutdown-screen').classList.add('hidden');
      window.location.reload();
    };
    // Sin espera: el reinicio se hace al pulsar Continuar (estilo realista)
  }

  function startSound() {
    try { NS.Audio.startup(); } catch (e) {}
  }

  NS.Boot = { run: run, doShutdown: doShutdown, doRestart: doRestart, startSound: startSound };
})();
