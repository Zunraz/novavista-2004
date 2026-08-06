/* ============================================================
   NovaVista 2004 — Buscaminas
   Lógica pura expuesta en NS.Minesweeper + UI clásica de XP.
   Principiante 9x9/10 · Intermedio 16x16/40 · Experto 30x16/99.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var LEVELS = {
    b: { name: 'Principiante', w: 9, h: 9, mines: 10, pay: 25 },
    i: { name: 'Intermedio', w: 16, h: 16, mines: 40, pay: 75 },
    e: { name: 'Experto', w: 30, h: 16, mines: 99, pay: 250 }
  };
  var DX = [-1, 0, 1, -1, 1, -1, 0, 1];
  var DY = [-1, -1, -1, 0, 0, 1, 1, 1];

  /* ---------- lógica pura ---------- */
  function genGrid(w, h, mines, safeX, safeY) {
    var cells = [];
    for (var y = 0; y < h; y++) {
      cells[y] = [];
      for (var x = 0; x < w; x++) cells[y][x] = { mine: false, open: false, flag: false, n: 0 };
    }
    // primer clic seguro: ni la celda ni sus vecinas llevan mina
    var forbidden = {};
    forbidden[safeY * 1000 + safeX] = true;
    for (var i = 0; i < 8; i++) {
      var nx = safeX + DX[i], ny = safeY + DY[i];
      if (nx >= 0 && ny >= 0 && nx < w && ny < h) forbidden[ny * 1000 + nx] = true;
    }
    var placed = 0, guard = 0;
    while (placed < mines && guard++ < 20000) {
      var mx = Math.floor(Math.random() * w);
      var my = Math.floor(Math.random() * h);
      if (forbidden[my * 1000 + mx] || cells[my][mx].mine) continue;
      cells[my][mx].mine = true;
      placed++;
    }
    // números
    for (var yy = 0; yy < h; yy++) {
      for (var xx = 0; xx < w; xx++) {
        if (cells[yy][xx].mine) continue;
        var n = 0;
        for (var k = 0; k < 8; k++) {
          var ax = xx + DX[k], ay = yy + DY[k];
          if (ax >= 0 && ay >= 0 && ax < w && ay < h && cells[ay][ax].mine) n++;
        }
        cells[yy][xx].n = n;
      }
    }
    return cells;
  }

  function reveal(grid, x, y) {
    if (grid[y][x].open || grid[y][x].flag) return { boom: false, opened: 0 };
    if (grid[y][x].mine) {
      grid[y][x].open = true;
      return { boom: true, opened: 1 };
    }
    var w = grid[0].length, h = grid.length;
    var opened = 0;
    var stack = [[x, y]];
    while (stack.length) {
      var c = stack.pop();
      if (c[0] < 0 || c[1] < 0 || c[0] >= w || c[1] >= h) continue;
      var cell = grid[c[1]][c[0]];
      if (cell.open || cell.flag || cell.mine) continue;
      cell.open = true;
      opened++;
      if (cell.n === 0) {
        for (var k = 0; k < 8; k++) stack.push([c[0] + DX[k], c[1] + DY[k]]);
      }
    }
    return { boom: false, opened: opened };
  }

  function chord(grid, x, y) {
    var cell = grid[y][x];
    if (!cell.open || cell.n === 0) return { boom: false, opened: 0 };
    var w = grid[0].length, h = grid.length;
    var flags = 0;
    for (var k = 0; k < 8; k++) {
      var ax = x + DX[k], ay = y + DY[k];
      if (ax >= 0 && ay >= 0 && ax < w && ay < h && grid[ay][ax].flag) flags++;
    }
    if (flags !== cell.n) return { boom: false, opened: 0 };
    var opened = 0;
    for (var k2 = 0; k2 < 8; k2++) {
      var bx = x + DX[k2], by = y + DY[k2];
      if (bx >= 0 && by >= 0 && bx < w && by < h && !grid[by][bx].flag && !grid[by][bx].open) {
        var r = reveal(grid, bx, by);
        opened += r.opened;
        if (r.boom) return { boom: true, opened: opened };
      }
    }
    return { boom: false, opened: opened };
  }

  function countFlags(grid) {
    var n = 0;
    for (var y = 0; y < grid.length; y++) {
      for (var x = 0; x < grid[y].length; x++) if (grid[y][x].flag) n++;
    }
    return n;
  }
  function checkWin(grid, mines) {
    var closed = 0;
    for (var y = 0; y < grid.length; y++) {
      for (var x = 0; x < grid[y].length; x++) {
        var c = grid[y][x];
        if (!c.open && !c.mine) return false;
      }
    }
    return true;
  }

  /* ---------- UI ---------- */
  var state = null; // {lvl, grid, first, started, time, over, won, mines}

  function startGame(lvlId) {
    var lvl = LEVELS[lvlId];
    state = { levelId: lvlId, lvl: lvl, grid: null, first: true, started: false, time: 0, over: false, won: false, mines: lvl.mines, t0: 0 };
    renderBoard();
  }

  function cellColor(n) {
    return ['#555', '#1c5fd6', '#1c8a2a', '#c03030', '#5a1c8a', '#8a5a1c', '#1c8a8a', '#222', '#888'][n] || '#555';
  }

  function renderBoard() {
    var host = Util.$('#ms-host');
    if (!host) return;
    host.innerHTML = '';
    var lvl = state.lvl;
    var grid = state.grid;
    var table = Util.el('div', { class: 'ms-table' });
    table.style.gridTemplateColumns = 'repeat(' + lvl.w + ', 22px)';
    for (var y = 0; y < lvl.h; y++) {
      for (var x = 0; x < lvl.w; x++) {
        (function (xx, yy) {
          var b = Util.el('button', { class: 'ms-cell', text: '' });
          if (grid) {
            var c = grid[yy][xx];
            if (c.flag) {
              b.textContent = '⚑';
              b.classList.add('flag');
            } else if (c.open) {
              b.classList.add('open');
              if (c.mine) {
                b.textContent = '●';
                b.classList.add('boom');
              } else if (c.n > 0) {
                b.textContent = String(c.n);
                b.style.color = cellColor(c.n);
                b.classList.add('num');
              }
            }
            if (state.over && c.mine && !c.flag) {
              b.textContent = '●';
              b.classList.add('mine-lost');
            }
            if (state.over && c.mine && c.flag) b.classList.add('flag-ok');
            if (state.over && !c.mine && c.flag) b.classList.add('flag-bad');
          }
          b.addEventListener('click', function () {
            if (state.over) return;
            if (state.first) {
              state.grid = genGrid(lvl.w, lvl.h, lvl.mines, xx, yy);
              grid = state.grid;
              state.first = false;
              state.started = true;
              state.t0 = Date.now();
              reveal(state.grid, xx, yy);
            } else if (grid[yy][xx].flag) {
              return;
            } else {
              var r = reveal(grid, xx, yy);
              if (r.boom) { lose(); return; }
            }
            if (checkWin(state.grid, lvl.mines)) { win(); return; }
            renderBoard();
          });
          b.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            if (state.over || !state.grid || state.grid[yy][xx].open) return;
            state.grid[yy][xx].flag = !state.grid[yy][xx].flag;
            if (!state.started) { state.started = true; state.t0 = Date.now(); }
            if (checkWin(state.grid, lvl.mines)) { win(); return; }
            renderBoard();
          });
          b.addEventListener('dblclick', function () {
            if (state.over || !state.grid) return;
            var r = chord(state.grid, xx, yy);
            if (r.boom) { lose(); return; }
            if (checkWin(state.grid, lvl.mines)) { win(); return; }
            renderBoard();
          });
          table.appendChild(b);
        })(x, y);
      }
    }
    host.appendChild(table);
  }

  function lose() {
    state.over = true;
    state.won = false;
    NS.Audio.error();
    NS.UI.toast('Buscaminas', '¡BOOM! Pisaste una mina. Inténtalo de nuevo.', 'important', 'ic-mines');
    renderBoard();
  }
  function win() {
    state.over = true;
    state.won = true;
    var S = NS.State.get();
    var pay = state.lvl.pay;
    NS.State.addCash(pay);
    S.games.minesweeper = S.games.minesweeper || { best: { b: 0, i: 0, e: 0 } };
    var best = S.games.minesweeper.best;
    var secs = Math.floor(state.time);
    if (!best[state.lvl] || secs < best[state.lvl]) best[state.lvl] = secs;
    NS.Audio.cash();
    NS.UI.toast('Buscaminas', '¡Misión cumplida! +' + Util.fmtMoney(pay) + ' (' + Util.fmtDuration(secs * 1000) + ').', 'good', 'ic-mines');
    renderBoard();
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad';

    var bar = Util.el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' } });
    Object.keys(LEVELS).forEach(function (id) {
      var lvl = LEVELS[id];
      var b = Util.el('button', { class: 'xp-btn small' + ((state && state.levelId === id) || (!state && id === 'b') ? ' on' : ''), text: lvl.name });
      b.addEventListener('click', function () { startGame(id); });
      bar.appendChild(b);
    });
    var bestLbl = Util.el('span', { class: 'cfg-sub', id: 'ms-best', text: '' });
    bar.appendChild(bestLbl);
    body.appendChild(bar);

    var info = Util.el('div', { style: { display: 'flex', gap: '16px', marginBottom: '8px', alignItems: 'center' } });
    var minesLbl = Util.el('span', { class: 'ms-hud', id: 'ms-mines', text: '' });
    var timeLbl = Util.el('span', { class: 'ms-hud', id: 'ms-time', text: '' });
    var smile = Util.el('button', { class: 'ms-smile', id: 'ms-smile', text: '☺' });
    smile.addEventListener('click', function () { startGame(state ? state.lvl : 'b'); });
    info.appendChild(minesLbl);
    info.appendChild(smile);
    info.appendChild(timeLbl);
    body.appendChild(info);

    body.appendChild(Util.el('div', { id: 'ms-host' }));
    body.appendChild(Util.el('div', { class: 'cfg-sub', style: { marginTop: '8px' }, text: 'Clic: abrir · Clic derecho: bandera · Doble clic sobre un número: revelar alrededor (si las banderas coinciden).' }));

    if (!state) startGame('b');
    else renderBoard();
  }

  function tick() {
    if (!state || !state.started || state.over) return;
    state.time = (Date.now() - state.t0) / 1000;
    var tLbl = Util.$('#ms-time');
    if (tLbl) tLbl.textContent = 'Tiempo: ' + Util.fmtDuration(state.time * 1000);
    var mLbl = Util.$('#ms-mines');
    if (mLbl && state.grid) mLbl.textContent = 'Minas: ' + (state.mines - countFlags(state.grid));
    var sLbl = Util.$('#ms-smile');
    if (sLbl) sLbl.textContent = state.over ? (state.won ? '☻' : '☹') : '☺';
  }

  function openTick() {
    var S = NS.State.get();
    var b = S.games.minesweeper && S.games.minesweeper.best;
    var bestLbl = Util.$('#ms-best');
    if (bestLbl && b) {
      bestLbl.textContent = 'Récords: B ' + (b.b ? b.b + 's' : '—') + ' · I ' + (b.i ? b.i + 's' : '—') + ' · E ' + (b.e ? b.e + 's' : '—');
    }
  }

  NS.Apps.register({
    id: 'minesweeper', title: 'Buscaminas', icon: 'ic-mines',
    desktop: true, w: 620, h: 560, minW: 380, minH: 420,
    render: render, tick: tick
  });
  NS.Minesweeper = { genGrid: genGrid, reveal: reveal, chord: chord, checkWin: checkWin, countFlags: countFlags, LEVELS: LEVELS };
})();
