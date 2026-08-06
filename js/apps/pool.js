/* ============================================================
   NovaVista 2004 — NovaPool (billar 8-ball contra la CPU)
   Física de bolas con rozamiento, bolsillos y turnos.
   Ganar una partida paga 25 $.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var W = 640, H = 360;
  var cv, ctx;
  var raf = null;
  var running = false;
  var lastTime = 0;

  var T = { x0: 30, y0: 30, x1: 610, y1: 330 };
  var BALL_R = 11;
  var POCKETS = [
    { x: 30, y: 30 }, { x: 320, y: 27 }, { x: 610, y: 30 },
    { x: 30, y: 330 }, { x: 320, y: 333 }, { x: 610, y: 330 }
  ];
  var POCKET_R = 17;

  var balls = [];
  var cue = null;
  var turn = 'player';
  var groupPlayer = null; // 'solid' | 'stripe'
  var groupCpu = null;
  var phase = 'aim';      // aim | move | cpu | over
  var again = false;
  var aim = { x: 200, y: 180 };
  var lastHitAt = 0;
  var result = null;

  var BALL_COLORS = {
    1: '#f2c14e', 2: '#315bd8', 3: '#d13b32', 4: '#7b3ba8',
    5: '#ed7b28', 6: '#25834b', 7: '#8f3028', 8: '#171a20',
    9: '#f2c14e', 10: '#315bd8', 11: '#d13b32', 12: '#7b3ba8',
    13: '#ed7b28', 14: '#25834b', 15: '#8f3028'
  };

  function makeBalls() {
    balls = [];
    cue = { x: 140, y: H / 2, vx: 0, vy: 0, r: BALL_R, m: 121, num: 0, type: 'cue', pocketed: false };
    balls.push(cue);
    var apexX = 470, apexY = H / 2;
    var n = 1;
    for (var row = 0; row < 5; row++) {
      for (var col = 0; col <= row; col++) {
        var type = n === 8 ? '8' : (n <= 7 ? 'solid' : 'stripe');
        balls.push({
          x: apexX + row * (BALL_R * 2 + 1),
          y: apexY + (col - row / 2) * (BALL_R * 2 + 1),
          vx: 0, vy: 0, r: BALL_R, m: 121,
          num: n, type: type, pocketed: false
        });
        n++;
      }
    }
  }

  function newGame() {
    makeBalls();
    turn = 'player'; groupPlayer = null; groupCpu = null;
    phase = 'aim'; again = false; result = null;
    var st = Util.$('#pool-status');
    if (st) st.textContent = 'Tu turno — Tiras. Rompe el triángulo.';
  }

  /* -------- reglas -------- */
  function groupLabel(g) { return g === 'solid' ? 'sólidas' : 'listadas'; }

  function onPocketed(ball) {
    ball.pocketed = true;
    NS.Audio.popup();
    if (ball.type === 'cue') {
      cue.x = 140; cue.y = H / 2; cue.vx = 0; cue.vy = 0; cue.pocketed = false;
      turn = turn === 'player' ? 'cpu' : 'player';
      again = false;
      setStatus('¡Metediste la blanca! Turno del rival.');
      return;
    }
    if (ball.num === 8) {
      // 8 en la rotura (sin grupos asignados): se recoloca y sigue el juego
      if (!groupPlayer) {
        ball.pocketed = false;
        ball.x = 320; ball.y = H / 2; ball.vx = 0; ball.vy = 0;
        turn = turn === 'player' ? 'cpu' : 'player';
        again = false;
        NS.UI.toast('NovaPool', '¡La 8 entró en la rotura! Se recoloca y sigue la partida.', 'important', 'ic-pool');
        return;
      }
      var mine = turn === 'player' ? groupPlayer : groupCpu;
      var cleared = balls.filter(function (b) { return b.type === mine && !b.pocketed; }).length === 0;
      if (cleared) {
        result = turn;
        NS.Audio.startup();
        if (turn === 'player') {
          var S = NS.State.get();
          NS.State.addCash(25);
          S.games.poolWins++;
          NS.UI.toast('NovaPool', '¡GANASTE! +' + Util.fmtMoney(25) + ' por la partida.', 'good', 'ic-pool');
        } else {
          NS.UI.toast('NovaPool', 'La CPU te ganó. ¡Revancha!', 'important', 'ic-pool');
        }
        phase = 'over';
      } else {
        result = turn === 'player' ? 'cpu' : 'player';
        NS.Audio.error();
        NS.UI.toast('NovaPool', 'Metediste la 8 antes de tiempo. Pierdes.', 'important', 'ic-pool');
        phase = 'over';
      }
      return;
    }
    // asignar grupos en la primera bola embocada
    if (!groupPlayer) {
      groupPlayer = turn === 'player' ? ball.type : (ball.type === 'solid' ? 'stripe' : 'solid');
      groupCpu = groupPlayer === 'solid' ? 'stripe' : 'solid';
      setStatus(turn === 'player'
        ? 'Tiras ' + groupLabel(groupPlayer) + ' — ¡sigue si metes de las tuyas!'
        : 'La CPU tira ' + groupLabel(groupCpu) + ' — tú tiras ' + groupLabel(groupPlayer) + '.');
    }
    var mineType = turn === 'player' ? groupPlayer : groupCpu;
    again = ball.type === mineType;
    if (!again) setStatus('Fallaste en las tuyas. Turno del rival.');
    else setStatus('¡Bien! Otra vez tú.');
  }

  function setStatus(t) {
    var st = Util.$('#pool-status');
    if (st) st.textContent = t;
  }

  function endMove() {
    if (phase === 'over') return;
    if (again) {
      again = false;
      phase = turn === 'player' ? 'aim' : 'cpu';
      setStatus(turn === 'player' ? 'Tu turno — otra vez.' : 'Turno de la CPU...');
    } else {
      turn = turn === 'player' ? 'cpu' : 'player';
      phase = turn === 'player' ? 'aim' : 'cpu';
      setStatus(turn === 'player' ? 'Tu turno.' : 'Turno de la CPU...');
    }
    if (phase === 'cpu') scheduleCpu();
  }

  function allStill() {
    for (var i = 0; i < balls.length; i++) {
      if (!balls[i].pocketed && (Math.abs(balls[i].vx) > 0.5 || Math.abs(balls[i].vy) > 0.5)) return false;
    }
    return true;
  }

  /* -------- disparo del jugador (arrastrar para apuntar) -------- */
  var dragActive = false;
  var dragPower = 0;

  function shootTo(mx, my) {
    if (phase !== 'aim' || cue.pocketed || result) return;
    var dx = mx - cue.x, dy = my - cue.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 8) return;
    var nx = dx / d, ny = dy / d;
    var power = Util.clamp(d / 280, 0.1, 1);
    cue.vx = nx * (400 + power * 900);
    cue.vy = ny * (400 + power * 900);
    phase = 'move';
    lastHitAt = performance.now();
    NS.Audio.hack();
  }

  /* -------- CPU -------- */
  function scheduleCpu() {
    setTimeout(function () {
      if (!running || phase !== 'cpu') return;
      var shot = cpuPick();
      if (!shot) { setStatus('La CPU no tiene tiro claro...'); endMove(); return; }
      // `power` es un porcentaje (0..1), no una velocidad. Antes la CPU
      // impulsaba la blanca a menos de 1 px/s y su turno parecía colgado.
      var launch = cpuLaunchVector(shot);
      cue.vx = launch.vx;
      cue.vy = launch.vy;
      phase = 'move';
      lastHitAt = performance.now();
      NS.Audio.hack();
    }, 1100);
  }

  function cpuLaunchVector(shot) {
    var speed = 400 + Util.clamp(shot.power, 0, 1) * 900;
    return { vx: shot.dx * speed, vy: shot.dy * speed, speed: speed };
  }

  function cpuPick() {
    var mine = balls.filter(function (b) {
      if (b.pocketed || b.type === 'cue' || b.num === 8) return false;
      return groupCpu ? b.type === groupCpu : true;
    });
    if (!mine.length) mine = balls.filter(function (b) { return !b.pocketed && b.num === 8; });
    var best = null;
    mine.forEach(function (target) {
      POCKETS.forEach(function (p) {
        // dirección objetivo → bolsillo
        var dx = p.x - target.x, dy = p.y - target.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) return;
        var nx = dx / d, ny = dy / d;
        // ¿alguien bloquea la línea?
        var blocked = balls.some(function (o) {
          if (o === target || o.pocketed || o.type === 'cue') return false;
          var px = o.x - target.x, py = o.y - target.y;
          var proj = px * nx + py * ny;
          if (proj < -2 || proj > d + 2) return false;
          var perp = Math.abs(px * ny - py * nx);
          return perp < BALL_R * 2;
        });
        if (blocked) return;
        // ¿línea desde la blanca al objetivo libre?
        var qx = target.x - cue.x, qy = target.y - cue.y;
        var qd = Math.sqrt(qx * qx + qy * qy) || 1;
        var qnx = qx / qd, qny = qy / qd;
        var qblocked = balls.some(function (o) {
          if (o === cue || o === target || o.pocketed) return false;
          var px = o.x - cue.x, py = o.y - cue.y;
          var proj = px * qnx + py * qny;
          if (proj < -2 || proj > qd + 2) return false;
          var perp = Math.abs(px * qny - py * qnx);
          return perp < BALL_R * 2;
        });
        var align = 1 - Util.clamp(d / 700, 0, 1);
        var score = align * (qblocked ? 0.1 : 1);
        if (!best || score > best.score) {
          best = { dx: qnx, dy: qny, power: Util.clamp(qd / 260, 0.3, 0.95), score: score };
        }
      });
    });
    // Si no hay una tronera perfecta, la CPU hace un tiro de seguridad contra
    // la bola legal más cercana. Nunca se queda inmóvil ni regala el turno.
    if (!best && mine.length) {
      mine.sort(function (a, b) {
        return Math.hypot(a.x - cue.x, a.y - cue.y) - Math.hypot(b.x - cue.x, b.y - cue.y);
      });
      var t = mine[0];
      var fx = t.x - cue.x, fy = t.y - cue.y;
      var fd = Math.sqrt(fx * fx + fy * fy) || 1;
      best = { dx: fx / fd, dy: fy / fd, power: 0.62, score: 0 };
    }
    return best;
  }

  /* -------- bucle -------- */
  function step(dt) {
    if (phase !== 'move') return;
    NS.Physics.stepBalls(balls, dt);
    var fr = Math.pow(0.985, dt * 60); // rozamiento estable a cualquier FPS
    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      if (b.pocketed) continue;
      b.vx *= fr; b.vy *= fr;
      if (Math.abs(b.vx) < 0.03) b.vx = 0;
      if (Math.abs(b.vy) < 0.03) b.vy = 0;
      NS.Physics.wallBounce(b, T.x0, T.y0, T.x1, T.y1);
      for (var p = 0; p < POCKETS.length; p++) {
        if (NS.Physics.pocketed(b, POCKETS[p].x, POCKETS[p].y, POCKET_R)) {
          onPocketed(b);
          break;
        }
      }
    }
    if (phase === 'move' && allStill()) endMove();
  }

  /* -------- dibujo -------- */
  function draw() {
    if (!ctx) return;
    // mesa
    ctx.fillStyle = '#123a1e';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2c7a3e';
    ctx.fillRect(T.x0 - 4, T.y0 - 4, T.x1 - T.x0 + 8, T.y1 - T.y0 + 8);
    ctx.strokeStyle = '#0f2a14';
    ctx.lineWidth = 4;
    ctx.strokeRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0);
    // línea de cabecera
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(215, T.y0); ctx.lineTo(215, T.y1);
    ctx.stroke();
    // bolsillos
    POCKETS.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a12';
      ctx.fill();
      ctx.strokeStyle = '#2a2f3d';
      ctx.stroke();
    });
    // bolas
    balls.forEach(function (b) {
      if (b.pocketed) return;
      var c = '#fff';
      if (b.type === 'solid') c = BALL_COLORS[b.num];
      else if (b.type === 'stripe') c = '#f8f8f8';
      else if (b.type === '8') c = '#1a1f2e';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (b.type === 'stripe') {
        ctx.save();
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 0.5, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = BALL_COLORS[b.num];
        ctx.fillRect(b.x - b.r, b.y - 4, b.r * 2, 8);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#333';
        ctx.stroke();
      }
      if (b.num > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.num), b.x, b.y + 0.5);
      }
    });
    // línea de puntería y barra de potencia
    if (phase === 'aim' && !cue.pocketed) {
      var dx = aim.x - cue.x, dy = aim.y - cue.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = dx / d, ny = dy / d;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + nx * 260, cue.y + ny * 260);
      ctx.stroke();
      ctx.setLineDash([]);
      // potencia (distancia del arrastre)
      if (dragActive) {
        var power = Util.clamp(d / 280, 0.1, 1);
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(8, H - 22, 120, 10);
        ctx.fillStyle = power > 0.75 ? '#ff6b6b' : power > 0.4 ? '#f2c14e' : '#7ed957';
        ctx.fillRect(9, H - 21, 118 * power, 8);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(8, H - 22, 120, 10);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Tahoma';
        ctx.fillText((NS.I18n && NS.I18n.get() === 'en' ? 'POWER ' : 'POTENCIA ') + Math.round(power * 100) + ' %', 8, H - 28);
      }
    }
    // HUD de grupos
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Tahoma';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    var gTxt = 'Tú: ' + (groupPlayer ? groupLabel(groupPlayer) : '—') + '   CPU: ' + (groupCpu ? groupLabel(groupCpu) : '—');
    ctx.fillText(gTxt, 8, 16);
    ctx.font = '10px Tahoma';
    ctx.fillText(NS.I18n ? NS.I18n.t('Ganar = +25 $ · Mete la 8 al final') : 'Ganar = +25 $ · Mete la 8 al final', 8, H - 6);
  }

  function loop(ts) {
    if (!running) return;
    var dt = Math.min(0.033, (ts - lastTime) / 1000 || 0.016);
    lastTime = ts;
    // varios sub-pasos para estabilidad
    step(dt / 2);
    step(dt / 2);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  /* -------- app -------- */
  function onMove(e) {
    var r = cv.getBoundingClientRect();
    var sx = cv.width / (r.width || cv.width);
    var sy = cv.height / (r.height || cv.height);
    aim.x = Util.clamp((e.clientX - r.left) * sx, T.x0, T.x1);
    aim.y = Util.clamp((e.clientY - r.top) * sy, T.y0, T.y1);
  }
  function onDown(e) {
    if (phase !== 'aim') return;
    dragActive = true;
  }
  function onUp(e) {
    if (!dragActive) return;
    dragActive = false;
    var r = cv.getBoundingClientRect();
    shootTo((e.clientX - r.left) * (cv.width / (r.width || cv.width)),
      (e.clientY - r.top) * (cv.height / (r.height || cv.height)));
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad';
    var wrap = Util.el('div', { style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } });
    cv = Util.el('canvas', { width: W, height: H, style: { border: '2px solid #0f2a14', borderRadius: '6px', cursor: 'crosshair' } });
    ctx = cv.getContext('2d');
    cv.addEventListener('mousemove', onMove);
    cv.addEventListener('mousedown', onDown);
    // soltar fuera del canvas también dispara (evita que el arrastre se quede pillado)
    window.addEventListener('mouseup', onUp);
    wrap.appendChild(cv);

    var side = Util.el('div', { style: { flex: '1', minWidth: '170px' } });
    var p1 = Util.el('div', { class: 'panel' });
    p1.appendChild(Util.el('div', { class: 'panel-title', text: 'Partida' }));
    p1.appendChild(Util.el('div', { class: 'cfg-sub', id: 'pool-status', text: 'Tu turno — Rompe el triángulo.' }));
    p1.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Arrastra con el ratón para apuntar: la distancia controla la fuerza. Mete tus bolas y la 8 al final. La CPU tira listadas.' }));
    var restart = Util.el('button', { class: 'xp-btn', text: 'Nueva partida' });
    restart.addEventListener('click', function () { newGame(); });
    p1.appendChild(restart);
    var p2 = Util.el('div', { class: 'panel' });
    p2.appendChild(Util.el('div', { class: 'panel-title', text: 'Historial' }));
    p2.appendChild(Util.el('div', { class: 'cfg-sub', id: 'pool-stats', text: '' }));
    side.appendChild(p1);
    side.appendChild(p2);
    wrap.appendChild(side);
    body.appendChild(wrap);

    newGame();
    start();
  }

  function tick() {
    var st = Util.$('#pool-stats');
    if (st) {
      var S = NS.State.get();
      st.textContent = 'Victorias: ' + (S.games.poolWins || 0) + ' · Ganadas cobradas: ' + Util.fmtMoney((S.games.poolWins || 0) * 25);
    }
  }

  NS.Apps.register({
    id: 'pool', title: 'NovaPool 8-Ball', icon: 'ic-pool',
    desktop: true, w: 860, h: 440, minW: 700, minH: 380,
    render: render, tick: tick,
    onClose: function () {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('mouseup', onUp);
    }
  });
  NS.Pool = { _test: { cpuPick: cpuPick, cpuLaunchVector: cpuLaunchVector, newGame: newGame, ballColor: function (n) { return BALL_COLORS[n]; }, getBalls: function () { return balls; } } };
})();
