/* ============================================================
   NovaVista 2004 — Calculadora (estilo XP)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var acc = 0;
  var op = null;
  var display = '0';
  var fresh = true; // el próximo dígito empieza un número nuevo

  function renderDisplay() {
    var el = Util.$('#calc-display');
    if (el) el.textContent = display;
  }
  function pushDigit(d) {
    if (fresh) { display = d; fresh = false; }
    else {
      if (display.replace('-', '').length >= 15) return;
      display = display === '0' ? d : display + d;
    }
    renderDisplay();
  }
  function pushDot() {
    if (fresh) { display = '0.'; fresh = false; }
    else if (display.indexOf('.') === -1) display += '.';
    renderDisplay();
  }
  function setOp(nextOp) {
    if (op && !fresh) compute();
    else if (op && fresh) { op = nextOp; renderDisplay(); return; }
    acc = parseFloat(display) || 0;
    op = nextOp;
    fresh = true;
    renderDisplay();
  }
  function compute() {
    if (op === null) return;
    var b = parseFloat(display) || 0;
    var r;
    switch (op) {
      case '+': r = acc + b; break;
      case '-': r = acc - b; break;
      case '×': r = acc * b; break;
      case '÷': r = b === 0 ? NaN : acc / b; break;
      default: r = b;
    }
    if (!isFinite(r)) { display = 'Error'; op = null; acc = 0; fresh = true; renderDisplay(); return; }
    display = String(Math.round(r * 1e10) / 1e10);
    acc = r;
    op = null;
    fresh = true;
    renderDisplay();
  }
  function equals() { compute(); }
  function clearAll() { acc = 0; op = null; display = '0'; fresh = true; renderDisplay(); }
  function back() {
    if (fresh) return;
    display = display.length > 1 ? display.slice(0, -1) : '0';
    renderDisplay();
  }
  function neg() {
    if (display === 'Error') return;
    display = display.charAt(0) === '-' ? display.slice(1) : (display === '0' ? '0' : '-' + display);
    renderDisplay();
  }
  function pct() {
    if (display === 'Error') return;
    display = String((parseFloat(display) || 0) / 100);
    renderDisplay();
  }

  function key(label, fn, cls) {
    var b = Util.el('button', { class: 'calc-key ' + (cls || ''), text: label });
    b.addEventListener('click', function () { fn(); NS.Audio.tick(); });
    return b;
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad';
    var wrap = Util.el('div', { style: { maxWidth: '300px', margin: '0 auto' } });
    var disp = Util.el('div', { class: 'calc-display', id: 'calc-display', text: display });
    wrap.appendChild(disp);
    var grid = Util.el('div', { class: 'calc-grid' });
    [['C', clearAll, 'calc-fn'], ['±', neg, 'calc-fn'], ['%', pct, 'calc-fn'], ['÷', function () { setOp('÷'); }, 'calc-op'],
     ['7', function () { pushDigit('7'); }], ['8', function () { pushDigit('8'); }], ['9', function () { pushDigit('9'); }], ['×', function () { setOp('×'); }, 'calc-op'],
     ['4', function () { pushDigit('4'); }], ['5', function () { pushDigit('5'); }], ['6', function () { pushDigit('6'); }], ['-', function () { setOp('-'); }, 'calc-op'],
     ['1', function () { pushDigit('1'); }], ['2', function () { pushDigit('2'); }], ['3', function () { pushDigit('3'); }], ['+', function () { setOp('+'); }, 'calc-op'],
     ['←', back, 'calc-fn'], ['0', function () { pushDigit('0'); }], [',', pushDot], ['=', equals, 'calc-eq']].forEach(function (k) {
      grid.appendChild(key(k[0], k[1], k[2]));
    });
    wrap.appendChild(grid);
    body.appendChild(wrap);

    // teclado
    document.addEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (!NS.WM.isOpen('calc')) return;
    var k = e.key;
    if (/^[0-9]$/.test(k)) pushDigit(k);
    else if (k === '.') pushDot();
    else if (k === '+') setOp('+');
    else if (k === '-') setOp('-');
    else if (k === '*' || k.toLowerCase() === 'x') setOp('×');
    else if (k === '/') { e.preventDefault(); setOp('÷'); }
    else if (k === 'Enter' || k === '=') equals();
    else if (k === 'Backspace') back();
    else if (k === 'Escape') clearAll();
  }

  NS.Apps.register({
    id: 'calc', title: 'Calculadora', icon: 'ic-calc',
    desktop: true, w: 340, h: 440, minW: 300, minH: 380,
    render: render,
    onClose: function () { document.removeEventListener('keydown', onKey); }
  });
})();
