/* ============================================================
   NovaVista 2004 — Build de producción
   Genera dist/index.html autocontenido (CSS y JS inline,
   comentarios y espacios eliminados).
   Ejecutar: node build/build.js
   ============================================================ */
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var DIST = path.join(ROOT, 'dist');

/* ---------- mini-minificador JS (con conciencia de strings/regex) ---------- */
function minifyJS(js) {
  var out = '';
  var i = 0, n = js.length;
  var state = 'code'; // code | str | line | block | regex
  var strCh = '';
  var prev = '';      // último carácter significativo emitido
  var lastWord = '';  // última palabra (para detectar keywords antes de regex)
  var pendingSpace = false;

  function isIdent(c) { return /[A-Za-z0-9_$]/.test(c); }

  while (i < n) {
    var c = js[i], c2 = js[i + 1];

    if (state === 'line') {
      if (c === '\n') { state = 'code'; out += '\n'; }
      i++; continue;
    }
    if (state === 'block') {
      if (c === '*' && c2 === '/') { state = 'code'; i += 2; }
      else i++;
      continue;
    }
    if (state === 'str') {
      out += c;
      if (c === '\\' && i + 1 < n) { out += c2; i += 2; continue; }
      if (c === strCh) state = 'code';
      i++; continue;
    }
    if (state === 'regex') {
      if (c === '\\' && i + 1 < n) { out += c; out += c2; i += 2; continue; }
      out += c;
      if (c === '[') {
        i++;
        while (i < n && js[i] !== ']') { out += js[i]; i++; }
        if (i < n) { out += ']'; i++; }
        continue;
      }
      if (c === '/') state = 'code';
      i++; continue;
    }

    // estado 'code'
    if (c === '/' && c2 === '/') { state = 'line'; i += 2; continue; }
    if (c === '/' && c2 === '*') { state = 'block'; i += 2; continue; }
    if (c === '/' && isRegexStart(prev, lastWord)) {
      state = 'regex'; out += '/'; i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { state = 'str'; strCh = c; out += c; i++; continue; }
    if (/\s/.test(c)) {
      if (c === '\n' || c === '\r') {
        if (out.length && out[out.length - 1] !== '\n') out += '\n';
        while (i < n && /\s/.test(js[i])) i++;
        continue;
      }
      pendingSpace = true;
      i++; continue;
    }
    // carácter significativo
    if (pendingSpace && out.length && isIdent(out[out.length - 1]) && isIdent(c)) out += ' ';
    pendingSpace = false;
    out += c;
    prev = c;
    lastWord = isIdent(c) ? lastWord + c : '';
    i++;
  }
  return out;
}
function isRegexStart(prev, lastWord) {
  if (prev === '' || prev === '(' || prev === '[' || prev === '{' || prev === '=' || prev === ':' ||
      prev === ',' || prev === ';' || prev === '!' || prev === '&' || prev === '|' || prev === '?' ||
      prev === '+' || prev === '-' || prev === '*' || prev === '%' || prev === '^' || prev === '~' ||
      prev === '<' || prev === '>') return true;
  if (/^(return|typeof|case|in|of|new|delete|void|do|else|instanceof|yield)$/.test(lastWord)) return true;
  return false;
}

/* ---------- mini-minificador CSS ---------- */
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

/* ---------- build ---------- */
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// CSS inline
html = html.replace(/<link rel="stylesheet" href="css\/([^"]+)">/g, function (m, f) {
  var css = fs.readFileSync(path.join(ROOT, 'css', f), 'utf8');
  return '<style>' + minifyCSS(css) + '</style>';
});

// JS inline (en orden)
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, function (m, f) {
  var js = fs.readFileSync(path.join(ROOT, f), 'utf8');
  return '<script>' + minifyJS(js) + '</script>';
});

html = '<!-- NovaVista 2004 Edition · Build de producción ' + new Date().toISOString() + ' · autocontenido, sin red -->\n' + html;

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log('dist/index.html generado (' + (html.length / 1024).toFixed(1) + ' KB)');
