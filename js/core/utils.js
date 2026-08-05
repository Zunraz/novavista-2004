/* ============================================================
   NovaVista 2004 — Utilidades (sin dependencias del DOM)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined) return;
        if (k === 'class') node.className = v;
        else if (k === 'style' && typeof v === 'object') {
          Object.keys(v).forEach(function (sk) { node.style[sk] = v[sk]; });
        } else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      });
    }
    if (children) {
      if (typeof children === 'string') node.textContent = children;
      else if (children.forEach) children.forEach(function (c) { if (c) node.appendChild(c); });
      else node.appendChild(children);
    }
    return node;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- formato de números ---------- */
  var UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
  function fmtNum(n) {
    if (!isFinite(n)) return '∞';
    var neg = n < 0;
    n = Math.abs(n);
    if (n < 1000) return (neg ? '-' : '') + Math.floor(n).toLocaleString('es-ES');
    var tier = Math.floor(Math.log10(n) / 3);
    if (tier >= UNITS.length) tier = UNITS.length - 1;
    var scaled = n / Math.pow(10, tier * 3);
    var digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return (neg ? '-' : '') + scaled.toFixed(digits).replace('.', ',') + ' ' + UNITS[tier];
  }
  function fmtMoney(n) { return '$' + fmtNum(n); }
  function fmtInt(n) { return Math.floor(n).toLocaleString('es-ES'); }
  function fmtBytes(b) {
    if (!isFinite(b)) return '∞';
    var u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return (i === 0 ? Math.floor(b) : b.toFixed(1).replace('.', ',')) + ' ' + u[i];
  }
  function fmtPct(n) { return (n * 100).toFixed(2).replace('.', ',') + ' %'; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtClock(ts) {
    var d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function fmtDuration(ms) {
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ' h ' : '') + (m ? m + ' min ' : '') + sec + ' s';
  }

  /* ---------- RNG determinista ---------- */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cyrb53(str, seed) {
    var h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function hashStr(str) {
    var a = cyrb53(str, 0x9e3779b9);
    var b = cyrb53(str, 0x85ebca6b);
    return a.toString(36) + b.toString(36);
  }
  function randId() { return cyrb53(String(Math.random()) + String(Date.now()), 7).toString(36); }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function deepCopy(o) {
    if (o === null || typeof o !== 'object') return o;
    if (Array.isArray(o)) return o.map(deepCopy);
    var out = {};
    Object.keys(o).forEach(function (k) { out[k] = deepCopy(o[k]); });
    return out;
  }

  /* Validación estricta de números de estado: cualquier valor corrupto -> null */
  function num(x) {
    if (typeof x === 'number' && isFinite(x)) return x;
    return null;
  }

  /* ---------- iconos: incrustación literal del SVG (sin <use>) ----------
     Algunos navegadores/webviews no renderizan <use>. Copiamos el contenido
     del <symbol> dentro de cada <svg> para que los iconos funcionen siempre. */
  function symInfo(name) {
    var sym = document.getElementById(name);
    if (!sym) return { vb: '0 0 32 32', html: '' };
    return { vb: sym.getAttribute('viewBox') || '0 0 32 32', html: sym.innerHTML };
  }
  function svgHtml(name, cls) {
    var s = symInfo(name);
    return '<svg class="' + (cls || 'icon') + '" viewBox="' + s.vb + '" xmlns="http://www.w3.org/2000/svg">' + s.html + '</svg>';
  }
  function svgIcon(name, cls) {
    var s = symInfo(name);
    var svg = el('svg', { class: cls || 'icon', viewBox: s.vb });
    svg.innerHTML = s.html;
    return svg;
  }

  NS.Util = {
    $: $, $$: $$, el: el, esc: esc,
    fmtNum: fmtNum, fmtMoney: fmtMoney, fmtInt: fmtInt, fmtBytes: fmtBytes,
    fmtPct: fmtPct, fmtClock: fmtClock, fmtDate: fmtDate, fmtDuration: fmtDuration, pad2: pad2,
    mulberry32: mulberry32, cyrb53: cyrb53, hashStr: hashStr, randId: randId,
    clamp: clamp, lerp: lerp, deepCopy: deepCopy, num: num,
    symInfo: symInfo, svgHtml: svgHtml, svgIcon: svgIcon
  };
})();
