/* ============================================================
   NovaVista 2004 — NovaPinball (reescrito)
   Física: gravedad, flippers dentro del campo, bumpers, desagüe
   real y lanzador con carga. 50 puntos = 1 $ al acabar.
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
  var charging = false;
  var launcher = 0;
  var waiting = false; // bola en la cuna del lanzador

  var BALL_R = 8;
  var GRAV = 1500;

  // Geometría del campo
  var WALL_TOP = 8, WALL_SIDE = 14;
  var BOTTOM_Y = H - 58;            // paredes inferiores (flanquean el desagüe)
  var DRAIN_Y = H - 40;             // por debajo = bola perdida
  var GAP_HALF = 52;                // media anchura del desagüe central
  var CRADLE = { x: W / 2, y: H - 50 };

  var FL_PIV_L = { x: 85, y: H - 70 };
  var FL_PIV_R = { x: W - 85, y: H - 70 };
  var FL_LEN = 74;
  var FL_REST = -0.32, FL_UP = -1.02;
  var FL_SPEED = 11;

  var BUMPERS = [
    { x: W * 0.30, y: 150, r: 17 },
    { x: W * 0.50, y: 108, r: 17 },
    { x: W * 0.70, y: 150, r: 17 }
  ];

  function newGame() {
    score = 0; ballsLeft = 3; gameOver = false; launcher = 0; charging = false;
    waiting = true;
    ball = { x: CRADLE.x, y: CRADLE.y, vx: 0, vy: 0, r: BALL_R, m: 64 };
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
  function chargeLaunch() { if (gameOver || !waiting) return; charging = true; }
  function releaseLaunch() {
    charging = false;
    if (!waiting || !ball || gameOver) return;
    if (launcher > 5) {
      ball.vy = -(460 + launcher * 6.2);
      ball.vx = (Math.random() - 0.5) * 70;
      waiting = false;
      launcher = 0;
      NS.Audio.hack();
    }
  }

  /* -------- física -------- */
  function flipperEnds(pivot, angle, len) {
    return { x: pivot.x + Math.cos(angle) * len, y: pivot.y + Math.sin(angle) * len };
  }

  function step(dt) {
    if (gameOver || !ball) return;

    // cuna del lanzador: la bola espera quieta hasta lanzar
    if (waiting) {
      ball.x = CRADLE.x; ball.y = CRADLE.y; ball.vx = 0; ball.vy = 0;
      if (charging) launcher = Math.min(100, launcher + 2.4);
      return;
    }

    ball.vy += GRAV * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // paredes laterales y techo
    if (ball.x - ball.r < WALL_SIDE) { ball.x = WALL_SIDE + ball.r; ball.vx = Math.abs(ball.vx) * 0.8; addScore(2); }
    else if (ball.x + ball.r > W - WALL_SIDE) { ball.x = W - WALL_SIDE - ball.r; ball.vx = -Math.abs(ball.vx) * 0.8; addScore(2); }
    if (ball.y - ball.r < WALL_TOP) { ball.y = WALL_TOP + ball.r; ball.vy = Math.abs(ball.vy) * 0.8; addScore(2); }

    // paredes inferiores a los lados del desagüe
    if (ball.x < W / 2 - GAP_HALF && ball.y + ball.r > BOTTOM_Y) {
      ball.y = BOTTOM_Y - ball.r; ball.vy = -Math.abs(ball.vy) * 0.8;
    }
    if (ball.x > W / 2 + GAP_HALF && ball.y + ball.r > BOTTOM_Y) {
      ball.y = BOTTOM_Y - ball.r; ball.vy = -Math.abs(ball.vy) * 0.8;
    }

    // bumpers
    for (var i = 0; i < BUMPERS.length; i++) {
      var b = BUMPERS[i];
      var dx = ball.x - b.x, dy = ball.y - b.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.001 && d < b.r + ball.r) {
        var nx = dx / d, ny = dy / d;
        ball.x = b.x + nx * (b.r + ball.r + 1);
        ball.y = b.y + ny * (b.r + ball.r + 1);
        ball.vx += nx * 340; ball.vy += ny * 340;
        addScore(25);
        NS.Audio.ok();
      }
    }

    // flippers (con impulso del "latigazo")
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
      ball.vx += Math.cos(aL) * tipV * 0.16;
      ball.vy += Math.sin(aL) * tipV * 0.16 - 70;
      addScore(10);
      NS.Audio.ok();
    }

    // desagüe
    if (ball.y > DRAIN_Y) {
      ballsLeft--;
      NS.Audio.error();
      if (ballsLeft <= 0) {
        gameOver = true;
        ball = null;
        NS.Audio.shutdown();
        renderOverlay();
      } else {
        waiting = true;
        launcher = 0;
        charging = false;
        ball = { x: CRADLE.x, y: CRADLE.y, vx: 0, vy: 0, r: BALL_R, m: 64 };
      }
    }
  }

  /* -------- dibujo -------- */
  function draw() {
    if (!ctx) return;
    ctx.fillStyle = '#0a1440';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a4a8a';
    ctx.lineWidth = 3;
    // paredes: laterales + techo
    ctx.strokeRect(WALL_SIDE, WALL_TOP, W - WALL_SIDE * 2, BOTTOM_Y - WALL_TOP);
    // zona de desagüe
    ctx.fillStyle = '#060a20';
    ctx.fillRect(W / 2 - GAP_HALF, BOTTOM_Y, GAP_HALF * 2, H - BOTTOM_Y);
    ctx.strokeStyle = '#8a3a2a';
    ctx.strokeRect(W / 2 - GAP_HALF, BOTTOM_Y, GAP_HALF * 2, H - BOTTOM_Y);

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
    if (charging && waiting) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(W / 2 - 50, H - 26, launcher, 8);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(W / 2 - 50, H - 26, 100, 8);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '11px Tahoma';
      ctx.fillText('¡SUELTA ESPACIO!', W / 2, H - 34);
    } else if (waiting) {
      ctx.fillStyle = '#9ec5f5';
      ctx.textAlign = 'center';
      ctx.font = '11px Tahoma';
      ctx.fillText('MANTÉN ESPACIO PARA LANZAR', W / 2, H - 34);
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
    // dos sub-pasos de dt/2: integración estable y sin túnel en colisiones
    step(dt / 2);
    step(dt / 2);
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
    var p1 = Util.el('div', { class: 'panel' });
    p1.appendChild(Util.el('div', { class: 'panel-title', text: 'Controles' }));
    p1.appendChild(Util.el('div', { class: 'cfg-sub', text: '← → / A D: flippers · ESPACIO (mantener): cargar y lanzar.' }));
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
    side.appendChild(p1);

    var p2 = Util.el('div', { class: 'panel' });
    p2.appendChild(Util.el('div', { class: 'panel-title', text: 'Premio' }));
    p2.appendChild(Util.el('div', { class: 'cfg-sub', id: 'pin-best', text: 'Récord: ' + (NS.State.get().games.pinball || 0) + ' puntos' }));
    p2.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Cada 50 puntos = 1 $ al terminar. Bumpers +25, flippers +10.' }));
    side.appendChild(p2);

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
