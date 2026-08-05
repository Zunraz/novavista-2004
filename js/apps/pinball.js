/* ============================================================
   NovaVista 2004 — NovaPinball
   Pinball 2D con física simple: gravedad, flippers, bumpers.
   El marcador se canjea por dinero en efectivo.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var W = 360, H = 560;
  var cv, ctx;
  var raf = null;
  var running = false;

  var ball = null;
  var score = 0;
  var ballsLeft = 3;
  var gameOver = false;
  var lastTime = 0;
  var flipperL = false, flipperR = false;
  var launcher = 0; // poder del lanzador (0-100)

  var BUMPERS = [
    { x: W * 0.28, y: 150, r: 17 },
    { x: W * 0.5, y: 110, r: 17 },
    { x: W * 0.72, y: 150, r: 17 }
  ];
  var FL_LEN = 54, FL_PIV_L = { x: 44, y: H - 66 }, FL_PIV_R = { x: W - 44, y: H - 66 };
  var FL_REST = -0.42, FL_UP = -1.05; // radianes
  var FL_SPEED = 9;

  function resetBall() {
    ball = { x: W / 2, y: H - 130, vx: 0, vy: 0, r: 8, m: 64 };
  }
  function newGame() {
    score = 0; ballsLeft = 3; gameOver = false; launcher = 0;
    resetBall();
  }

  function addScore(n) {
    score += n;
    NS.Audio.tick();
  }

  /* -------- entrada -------- */
  function onKeyDown(e) {
    if (!running) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') flipperL = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') flipperR = true;
    if (e.key === ' ') { e.preventDefault(); chargeLaunch(); }
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') flipperL = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') flipperR = false;
    if (e.key === ' ') { e.preventDefault(); releaseLaunch(); }
  }
  var charging = false;
  function chargeLaunch() { if (gameOver) return; charging = true; }
  function releaseLaunch() {
    charging = false;
    if (!ball) return;
    if (launcher > 5) {
      ball.vy = -(500 + launcher * 5);
      ball.vx = (Math.random() - 0.5) * 60;
      launcher = 0;
      NS.Audio.hack();
    }
  }

  /* -------- física -------- */
  function flipperEnds(pivot, angle, len) {
    return {
      x: pivot.x + Math.cos(angle) * len,
      y: pivot.y + Math.sin(angle) * len
    };
  }
  function step(dt) {
    if (gameOver || !ball) return;

    // cargador
    if (charging && !ball) {
      // el lanzador se usa cuando la bola está en la zona de lanzamiento
    }

    if (ball) {
      ball.vy += 1300 * dt;
      ball.vx *= (1 - 0.02 * dt * 60 * 0.15);
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      NS.Physics.wallBounce(ball, 12, 8, W - 12, H - 118);

      // bumpers
      for (var i = 0; i < BUMPERS.length; i++) {
        var b = BUMPERS[i];
        var dx = ball.x - b.x, dy = ball.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < b.r + ball.r) {
          var nx = dx / (d || 1), ny = dy / (d || 1);
          ball.x = b.x + nx * (b.r + ball.r + 1);
          ball.y = b.y + ny * (b.r + ball.r + 1);
          ball.vx += nx * 320; ball.vy += ny * 320;
          addScore(25);
          NS.Audio.ok();
        }
      }

      // flippers
      var aL = FL_REST + (FL_UP - FL_REST) * (flipperL ? 1 : 0);
      var aR = Math.PI - (FL_REST + (FL_UP - FL_REST) * (flipperR ? 1 : 0));
      var eL = flipperEnds(FL_PIV_L, aL, FL_LEN);
      var eR = flipperEnds(FL_PIV_R, aR, FL_LEN);
      var hitL = NS.Physics.segmentCollide(ball, FL_PIV_L, eL, ball.r);
      var hitR = NS.Physics.segmentCollide(ball, FL_PIV_R, eR, ball.r);
      if (hitL || hitR) {
        var dir = hitL ? 1 : -1;
        var w = dir * FL_SPEED;
        var tipV = w * FL_LEN;
        ball.vx += dir * Math.cos(aL) * tipV * 0.12;
        ball.vy += Math.sin(aL) * tipV * 0.12 - 60;
        addScore(10);
        NS.Audio.ok();
      }

      // desagüe
      if (ball.y > H - 108) {
        ballsLeft--;
        NS.Audio.error();
        if (ballsLeft <= 0) {
          gameOver = true;
          ball = null;
          NS.Audio.shutdown();
          renderOverlay();
        } else {
          resetBall();
        }
      }
    }
  }

  /* -------- dibujo -------- */
  function draw() {
    if (!ctx) return;
    // mesa
    ctx.fillStyle = '#0a1440';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a4a8a';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 6, W - 20, H - 116);

    // bumpers
    BUMPERS.forEach(function (b) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();
      ctx.strokeStyle = '#7a1c1c';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe08a';
      ctx.fill();
    });

    // flippers
    var aL = FL_REST + (FL_UP - FL_REST) * (flipperL ? 1 : 0);
    var aR = Math.PI - (FL_REST + (FL_UP - FL_REST) * (flipperR ? 1 : 0));
    drawFlipper(FL_PIV_L, aL);
    drawFlipper(FL_PIV_R, aR);

    // bola
    if (ball) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = '#f8f8f8';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#9ec5f5';
    ctx.font = 'bold 16px Tahoma';
    ctx.textAlign = 'left';
    ctx.fillText('PUNTOS: ' + Math.floor(score), 16, 28);
    ctx.textAlign = 'right';
    ctx.fillText('BOLAS: ' + ballsLeft, W - 16, 28);
    if (charging) {
      launcher = Math.min(100, launcher + 2.2);
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(W / 2 - 50, H - 30, launcher, 8);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(W / 2 - 50, H - 30, 100, 8);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('¡SUELTA ESPACIO!', W / 2, H - 40);
    }
  }

  function drawFlipper(pivot, angle) {
    var e = flipperEnds(pivot, angle, FL_LEN);
    ctx.strokeStyle = '#c03030';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function renderOverlay() {
    if (!cv) return;
    var box = Util.$('#pinball-overlay');
    if (box) {
      var S = NS.State.get();
      var cash = Math.floor(score / 50);
      box.innerHTML = '';
      box.classList.remove('hidden');
      box.appendChild(Util.el('div', { class: 'pin-over-title', text: 'PARTIDA FINALIZADA' }));
      box.appendChild(Util.el('div', { class: 'pin-over-score', text: Math.floor(score) + ' puntos' }));
      if (score >= 50) {
        var btn = Util.el('button', { class: 'xp-btn primary', text: 'Cobrar premio: ' + Util.fmtMoney(cash) });
        btn.addEventListener('click', function () {
          NS.State.addCash(cash);
          S.games.pinballCash += cash;
          NS.Audio.cash();
          NS.UI.toast('NovaPinball', 'Premio cobrado: ' + Util.fmtMoney(cash) + '. ¡Bien jugado!', 'good', 'ic-pinball');
          box.classList.add('hidden');
          newGame();
        });
        box.appendChild(btn);
      }
      var again = Util.el('button', { class: 'xp-btn', text: 'Jugar otra vez' });
      again.addEventListener('click', function () {
        box.classList.add('hidden');
        newGame();
      });
      box.appendChild(again);
      if (Math.floor(score) > S.games.pinball) S.games.pinball = Math.floor(score);
    }
  }

  function loop(ts) {
    if (!running) return;
    var dt = Math.min(0.033, (ts - lastTime) / 1000 || 0.016);
    lastTime = ts;
    step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function startGame() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  /* -------- app -------- */
  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad pin-root';

    var wrap = Util.el('div', { style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } });
    cv = Util.el('canvas', { width: W, height: H, style: { border: '2px solid #1c3f6e', borderRadius: '4px' } });
    ctx = cv.getContext('2d');
    wrap.appendChild(cv);

    var side = Util.el('div', { style: { flex: '1', minWidth: '150px' } });
    side.appendChild(Util.el('div', { class: 'panel' }));
    var p1 = Util.$('.panel', side);
    p1.appendChild(Util.el('div', { class: 'panel-title', text: 'Controles' }));
    p1.appendChild(Util.el('div', { class: 'cfg-sub', text: '← → / A D: flippers · ESPACIO: cargar y lanzar la bola.' }));
    var flRow = Util.el('div', { class: 'trade-row' });
    var bL = Util.el('button', { class: 'xp-btn', text: '◀ FLIP' });
    var bR = Util.el('button', { class: 'xp-btn', text: 'FLIP ▶' });
    bL.addEventListener('mousedown', function () { flipperL = true; });
    bL.addEventListener('mouseup', function () { flipperL = false; });
    bL.addEventListener('mouseleave', function () { flipperL = false; });
    bR.addEventListener('mousedown', function () { flipperR = true; });
    bR.addEventListener('mouseup', function () { flipperR = false; });
    bR.addEventListener('mouseleave', function () { flipperR = false; });
    flRow.appendChild(bL); flRow.appendChild(bR);
    p1.appendChild(flRow);
    var launch = Util.el('button', { class: 'xp-btn primary', text: 'Lanzar (ESPACIO)' });
    launch.addEventListener('mousedown', function () { chargeLaunch(); });
    launch.addEventListener('mouseup', function () { releaseLaunch(); });
    p1.appendChild(launch);

    var p2 = Util.el('div', { class: 'panel' });
    p2.appendChild(Util.el('div', { class: 'panel-title', text: 'Premio' }));
    p2.appendChild(Util.el('div', { class: 'cfg-sub', id: 'pin-best', text: 'Récord: ' + (NS.State.get().games.pinball || 0) + ' puntos' }));
    p2.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Cada 50 puntos = 1 $ al terminar la partida. Bumpers +25, flippers +10.' }));

    var overlay = Util.el('div', { class: 'pin-overlay hidden', id: 'pinball-overlay' });
    wrap.appendChild(side);

    body.appendChild(wrap);
    body.appendChild(overlay);

    newGame();
    startGame();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function tick() {
    var best = Util.$('#pin-best');
    if (best) best.textContent = 'Récord: ' + (NS.State.get().games.pinball || 0) + ' puntos';
  }

  NS.Apps.register({
    id: 'pinball', title: 'NovaPinball', icon: 'ic-pinball',
    desktop: true, w: 600, h: 600, minW: 520, minH: 500,
    render: render, tick: tick,
    onClose: function () {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      // canjear automáticamente el marcador al cerrar
      var S = NS.State.get();
      if (score > 0 && !gameOver) {
        var cash = Math.floor(score / 50);
        if (cash > 0) {
          NS.State.addCash(cash);
          S.games.pinballCash += cash;
          NS.UI.toast('NovaPinball', 'Premio cobrado al cerrar: ' + Util.fmtMoney(cash) + '.', 'good', 'ic-pinball');
        }
      }
      if (Math.floor(score) > S.games.pinball) S.games.pinball = Math.floor(score);
    }
  });
})();
