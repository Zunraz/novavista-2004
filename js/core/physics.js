/* ============================================================
   NovaVista 2004 — Física 2D para juegos (pura, sin DOM)
   Colisiones de círculos, rebotes y bolsillos de billar.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};

  /* Resolución elástica de colisión entre dos círculos.
     a,b: {x, y, vx, vy, r, m}  (m = masa; por defecto r²)
     Devuelve true si colisionaron y ajusta velocidades. */
  function circleCollide(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var min = a.r + b.r;
    if (dist === 0 || dist > min) return false;
    // separar (evitar solape)
    var nx = dx / dist, ny = dy / dist;
    var overlap = min - dist;
    var ma = a.m || (a.r * a.r), mb = b.m || (b.r * b.r);
    var total = ma + mb;
    a.x -= nx * overlap * (mb / total);
    a.y -= ny * overlap * (mb / total);
    b.x += nx * overlap * (ma / total);
    b.y += ny * overlap * (ma / total);
    // impulso elástico 1D
    var rvx = b.vx - a.vx, rvy = b.vy - a.vy;
    var vn = rvx * nx + rvy * ny;
    if (vn > 0) return true; // ya se separan
    var j = -(1 + 0.9) * vn / (1 / ma + 1 / mb);
    a.vx -= (j / ma) * nx; a.vy -= (j / ma) * ny;
    b.vx += (j / mb) * nx; b.vy += (j / mb) * ny;
    return true;
  }

  /* Rebote contra un rectángulo [x0,x1]x[y0,y1]. Devuelve true si rebotó. */
  function wallBounce(b, x0, y0, x1, y1) {
    var hit = false;
    if (b.x - b.r < x0) { b.x = x0 + b.r; b.vx = Math.abs(b.vx) * 0.85; hit = true; }
    else if (b.x + b.r > x1) { b.x = x1 - b.r; b.vx = -Math.abs(b.vx) * 0.85; hit = true; }
    if (b.y - b.r < y0) { b.y = y0 + b.r; b.vy = Math.abs(b.vy) * 0.85; hit = true; }
    else if (b.y + b.r > y1) { b.y = y1 - b.r; b.vy = -Math.abs(b.vy) * 0.85; hit = true; }
    return hit;
  }

  /* ¿La bola entra en un bolsillo? (centro dentro del radio del bolsillo) */
  function pocketed(b, px, py, pr) {
    var dx = b.x - px, dy = b.y - py;
    return dx * dx + dy * dy < pr * pr;
  }

  /* Rebote de un círculo contra un segmento (flipper): devuelve la normal
     si hubo impacto. p1,p2 = extremos, r = radio de la bola. */
  function segmentCollide(b, p1, p2, r) {
    var ex = p2.x - p1.x, ey = p2.y - p1.y;
    var len2 = ex * ex + ey * ey;
    if (len2 === 0) return null;
    var t = ((b.x - p1.x) * ex + (b.y - p1.y) * ey) / len2;
    t = Math.max(0, Math.min(1, t));
    var px = p1.x + ex * t, py = p1.y + ey * t;
    var dx = b.x - px, dy = b.y - py;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > r || dist === 0) return null;
    var nx = dx / dist, ny = dy / dist;
    b.x = px + nx * r; b.y = py + ny * r;
    var vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= (1 + 0.7) * vn * nx;
      b.vy -= (1 + 0.7) * vn * ny;
    }
    return { nx: nx, ny: ny, t: t };
  }

  /* Avanza un paso de simulación (paso fijo). */
  function stepBalls(balls, dt) {
    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    for (var k = 0; k < balls.length; k++) {
      for (var j = k + 1; j < balls.length; j++) {
        circleCollide(balls[k], balls[j]);
      }
    }
  }

  NS.Physics = {
    circleCollide: circleCollide,
    wallBounce: wallBounce,
    pocketed: pocketed,
    segmentCollide: segmentCollide,
    stepBalls: stepBalls
  };
})();
