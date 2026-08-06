/* ============================================================
   NovaVista 2004 — NovaPinball (v3)
   Física robusta: flippers con colisión de segmento en movimiento,
   lanzador lateral (plunger), túneles, slingshots, dianas y
   bumpers. 50 puntos = 1 $ al acabar.
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
  var waiting = false;       // bola en el lanzador lateral
  var targetFlash = 0;       // parpadeo de dianas al golpearlas

  var BALL_R = 8;
  var GRAV = 1500;

  // Geometría del campo
  var WALL_TOP = 8, WALL_SIDE = 14;
  var BOTTOM_Y = H - 58;             // paredes inferiores (flanquean el desagüe)
  var DRAIN_Y = H - 40;              // por debajo = bola perdida
  var GAP_HALF = 52;                 // media anchura del desagüe central
  var CRADLE = { x: W - 26, y: H - 46 };  // lanzador lateral (plunger)

  var FL_PIV_L = { x: 85, y: H - 70 };
  var FL_PIV_R = { x: W - 85, y: H - 70 };
  var FL_LEN = 74;
  var FL_THICK = 13;
  var FL_REST = -0.32, FL_UP = -1.02;
  var FL_SPEED = 12;

  var BUMPERS = [
    { x: W * 0.25, y: 150, r: 17 },
    { x: W * 0.50, y: 105, r: 17 },
    { x: W * 0.75, y: 150, r: 17 },
    { x: W * 0.38, y: 215, r: 15 },
    { x: W * 0.62, y: 215, r: 15 }
  ];
  // slingshots: propulsores inclinados sobre los flippers
  var SLINGS = [
    { x: 58, y: H - 128, r: 14, dx: -1, dy: -0.9 },
    { x: W - 58, y: H - 128, r: 14, dx: 1, dy: -0.9 }
  ];
  // dianas (golpéalas: +8 y parpadean)
  var TARGETS = [
    { x: W * 0.5 - 34, y: 195, r: 10 },
    { x: W * 0.5 + 34, y: 195, r: 10 }
  ];
  // túnel: entrada arriba a la izquierda, salida a la derecha
  var TUNNEL = { in: { x: 60, y: 92, r: 15 }, out: { x: W - 46, y: 320, r: 14 } };

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
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { if (!flipperL) NS.Audio.flip(); flipperL = true; }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { if (!flipperR) NS.Audio.flip(); flipperR = true; }
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
      ball.vy = -(500 + launcher * 6.4);
      ball.vx = -60;                     // hacia el centro del campo
      waiting = false;
      launcher = 0;
      NS.Audio.launch();
    }
  }

  /* -------- colisión de flipper (segmento en movimiento) --------
     Resuelve el problema de la bola que atraviesa: empuja la bola
     fuera del segmento y aplica la velocidad del punto de impacto. */
  function flipperCollide(ball, pivot, angle, len, dir, active) {
    var ex = pivot.x + Math.cos(angle) * len;
    var ey = pivot.y + Math.sin(angle) * len;
    var dx = ex - pivot.x, dy = ey - pivot.y;
    var L2 = dx * dx + dy * dy || 1;
    var t = Util.clamp(((ball.x - pivot.x) * dx + (ball.y - pivot.y) * dy) / L2, 0, 1);
    var cx = pivot.x + t * dx, cy = pivot.y + t * dy;
    var rx = ball.x - cx, ry = ball.y - cy;
    var d = Math.sqrt(rx * rx + ry * ry);
    var minD = ball.r + FL_THICK / 2;
    if (d >= minD || d < 0.001) return false;
    // empujar fuera del segmento
    var nx = rx / d, ny = ry / d;
    ball.x = cx + nx * minD;
    ball.y = cy + ny * minD;
    // impulso: rebote + velocidad del punto del flipper (si se está moviendo)
    var rel = t * len;
    var vAng = dir * FL_SPEED * (active ? 1 : 0);
    var vxTip = -Math.sin(angle) * vAng * rel * 0.55;
    var vyTip = Math.cos(angle) * vAng * rel * 0.55;
    var speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || 60;
    ball.vx = nx * speed * 0.55 + vxTip + dir * 30;
    ball.vy = ny * speed * 0.55 + vyTip - (active ? 140 : 40);
    addScore(10);
    NS.Audio.ok();
    return true;
  }

  /* -------- física -------- */
  function step(dt) {
    if (gameOver || !ball) return;

    // cuna del lanzador lateral
    if (waiting) {
      ball.x = CRADLE.x; ball.y = CRADLE.y; ball.vx = 0; ball.vy = 0;
      if (charging) launcher = Math.min(100, launcher + 2.4);
      return;
    }

    ball.vy += GRAV * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // techo y paredes laterales
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
      var bdx = ball.x - b.x, bdy = ball.y - b.y;
      var bd = Math.sqrt(bdx * bdx + bdy * bdy);
      if (bd > 0.001 && bd < b.r + ball.r) {
        var bnx = bdx / bd, bny = bdy / bd;
        ball.x = b.x + bnx * (b.r + ball.r + 1);
        ball.y = b.y + bny * (b.r + ball.r + 1);
        ball.vx += bnx * 340; ball.vy += bny * 340;
        addScore(25);
        NS.Audio.bump();
      }
    }

    // slingshots
    for (var s = 0; s < SLINGS.length; s++) {
      var sl = SLINGS[s];
      var sdx = ball.x - sl.x, sdy = ball.y - sl.y;
      var sd = Math.sqrt(sdx * sdx + sdy * sdy);
      if (sd > 0.001 && sd < sl.r + ball.r) {
        ball.x = sl.x + (sdx / sd) * (sl.r + ball.r + 1);
        ball.y = sl.y + (sdy / sd) * (sl.r + ball.r + 1);
        ball.vx += sl.dx * 430; ball.vy += sl.dy * 420;
        addScore(10);
        NS.Audio.kick();
      }
    }

    // dianas
    for (var tg = 0; tg < TARGETS.length; tg++) {
      var t = TARGETS[tg];
      var tdx = ball.x - t.x, tdy = ball.y - t.y;
      var td = Math.sqrt(tdx * tdx + tdy * tdy);
      if (td > 0.001 && td < t.r + ball.r) {
        ball.x = t.x + (tdx / td) * (t.r + ball.r + 1);
        ball.y = t.y + (tdy / td) * (t.r + ball.r + 1);
        ball.vx *= 0.9; ball.vy *= 0.9;
        addScore(8);
        targetFlash = 0.35;
        NS.Audio.ding();
      }
    }

    // túnel (scoop): entra arriba, sale abajo a la derecha
    var tin = TUNNEL.in;
    var tdx2 = ball.x - tin.x, tdy2 = ball.y - tin.y;
    if (Math.sqrt(tdx2 * tdx2 + tdy2 * tdy2) < tin.r + ball.r) {
      ball.x = TUNNEL.out.x;
      ball.y = TUNNEL.out.y;
      ball.vx = 0; ball.vy = 160;
      addScore(15);
      NS.Audio.whoosh();
    }

    // flippers (colisión de segmento en movimiento)
    var aL = FL_REST + (FL_UP - FL_REST) * (flipperL ? 1 : 0);
    var aR = Math.PI - (FL_REST + (FL_UP - FL_REST) * (flipperR ? 1 : 0));
    flipperCollide(ball, FL_PIV_L, aL, FL_LEN, 1, flipperL);
    flipperCollide(ball, FL_PIV_R, aR, FL_LEN, -1, flipperR);

    // límite de velocidad: evita túneles a altísima velocidad
    var sp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (sp > 1250) { ball.vx *= 1250 / sp; ball.vy *= 1250 / sp; }

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
    ctx.strokeRect(WALL_SIDE, WALL_TOP, W - WALL_SIDE * 2, BOTTOM_Y - WALL_TOP);

    // zona de desagüe
    ctx.fillStyle = '#060a20';
    ctx.fillRect(W / 2 - GAP_HALF, BOTTOM_Y, GAP_HALF * 2, H - BOTTOM_Y);
    ctx.strokeStyle = '#8a3a2a';
    ctx.strokeRect(W / 2 - GAP_HALF, BOTTOM_Y, GAP_HALF * 2, H - BOTTOM_Y);

    // túnel: entrada + salida + línea
    ctx.strokeStyle = 'rgba(120,200,255,.4)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(TUNNEL.in.x, TUNNEL.in.y);
    ctx.lineTo(TUNNEL.out.x, TUNNEL.out.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#0e2a4a';
    ctx.beginPath(); ctx.arc(TUNNEL.in.x, TUNNEL.in.y, TUNNEL.in.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7fc4ff'; ctx.stroke();
    ctx.fillStyle = '#7fc4ff';
    ctx.font = 'bold 11px Tahoma'; ctx.textAlign = 'center';
    ctx.fillText(NS.I18n && NS.I18n.get() === 'en' ? 'TUNNEL' : 'TÚNEL', TUNNEL.in.x, TUNNEL.in.y + 4);
    ctx.fillStyle = '#0e2a4a';
    ctx.beginPath(); ctx.arc(TUNNEL.out.x, TUNNEL.out.y, TUNNEL.out.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7fc4ff'; ctx.stroke();

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

    // slingshots
    SLINGS.forEach(function (sl) {
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.r, 0, Math.PI * 2);
      ctx.fillStyle = '#d6a83f';
      ctx.fill();
      ctx.strokeStyle = '#6a4a10';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y);
      ctx.lineTo(sl.x + sl.dx * sl.r * 1.4, sl.y + sl.dy * sl.r * 1.4);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // dianas
    var flash = targetFlash > 0;
    TARGETS.forEach(function (t) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#ffe08a' : '#e8e2d0';
      ctx.fill();
      ctx.strokeStyle = '#8a8262';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#8a8262';
      ctx.font = 'bold 10px Tahoma';
      ctx.textAlign = 'center';
      ctx.fillText('8', t.x, t.y + 3);
    });

    // flippers
    var aL = FL_REST + (FL_UP - FL_REST) * (flipperL ? 1 : 0);
    var aR = Math.PI - (FL_REST + (FL_UP - FL_REST) * (flipperR ? 1 : 0));
    drawFlipper(FL_PIV_L, aL);
    drawFlipper(FL_PIV_R, aR);

    // lanzador lateral
    ctx.strokeStyle = '#2a4a8a';
    ctx.lineWidth = 2;
    ctx.strokeRect(W - 32, H - 120, 14, 78);
    if (waiting) {
      ctx.fillStyle = '#d6a83f';
      ctx.fillRect(W - 31, H - 42 - launcher * 0.9, 12, 6);
    }

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
    ctx.fillText((NS.I18n && NS.I18n.get() === 'en' ? 'SCORE: ' : 'PUNTOS: ') + Math.floor(score), 16, 28);
    ctx.textAlign = 'right';
    ctx.fillText((NS.I18n && NS.I18n.get() === 'en' ? 'BALLS: ' : 'BOLAS: ') + ballsLeft, W - 16, 28);
    if (charging && waiting) {
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(W / 2 - 50, H - 26, launcher, 8);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(W / 2 - 50, H - 26, 100, 8);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '11px Tahoma';
      ctx.fillText(NS.I18n && NS.I18n.get() === 'en' ? 'RELEASE SPACE!' : '¡SUELTA ESPACIO!', W / 2, H - 34);
    } else if (waiting) {
      ctx.fillStyle = '#9ec5f5';
      ctx.textAlign = 'center';
      ctx.font = '11px Tahoma';
      ctx.fillText(NS.I18n && NS.I18n.get() === 'en' ? 'HOLD SPACE TO LAUNCH' : 'MANTÉN ESPACIO PARA LANZAR', W / 2, H - 34);
    }
  }

  function drawFlipper(pivot, angle) {
    var e = { x: pivot.x + Math.cos(angle) * FL_LEN, y: pivot.y + Math.sin(angle) * FL_LEN };
    ctx.strokeStyle = '#c03030';
    ctx.lineWidth = FL_THICK;
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
    // 3 sub-pasos: sin túneles en colisiones rápidas
    step(dt / 3);
    step(dt / 3);
    step(dt / 3);
    if (targetFlash > 0) targetFlash -= dt;
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
    try { ctx = cv.getContext('2d'); } catch (e) { ctx = null; }
    wrap.appendChild(cv);

    var side = Util.el('div', { style: { flex: '1', minWidth: '150px' } });
    var p1 = Util.el('div', { class: 'panel' });
    p1.appendChild(Util.el('div', { class: 'panel-title', text: 'Controles' }));
    p1.appendChild(Util.el('div', { class: 'cfg-sub', text: '← → / A D: flippers · ESPACIO (mantener): cargar el lanzador lateral y soltar.' }));
    var flRow = Util.el('div', { class: 'trade-row' });
    var bL = Util.el('button', { class: 'xp-btn', text: '◀ FLIP' });
    var bR = Util.el('button', { class: 'xp-btn', text: 'FLIP ▶' });
    bL.addEventListener('mousedown', function () { if (!flipperL) NS.Audio.flip(); flipperL = true; });
    bL.addEventListener('mouseup', function () { flipperL = false; });
    bL.addEventListener('mouseleave', function () { flipperL = false; });
    bR.addEventListener('mousedown', function () { if (!flipperR) NS.Audio.flip(); flipperR = true; });
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
    p2.appendChild(Util.el('div', { class: 'panel-title', text: 'Premio y pista' }));
    p2.appendChild(Util.el('div', { class: 'cfg-sub', id: 'pin-best', text: 'Récord: ' + (NS.State.get().games.pinball || 0) + ' puntos' }));
    p2.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Cada 50 puntos = 1 $ al terminar. Bumpers +25 · túnel +15 · slingshot +10 · flipper +10 · diana +8.' }));
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
  NS.Pinball = { _test: { newGame: newGame, step: step, charge: chargeLaunch, release: releaseLaunch, getState: function () {
    return { score: score, ballsLeft: ballsLeft, waiting: waiting, gameOver: gameOver, ball: ball };
  } } };
})();
