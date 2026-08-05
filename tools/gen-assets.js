/* ============================================================
   NovaVista 2004 — Generador de assets
   Convierte el sprite SVG en iconos PNG reales (base64) usando
   Chromium headless, y descarga fondos fotográficos reales.
   Uso: node tools/gen-assets.js
   Salida: js/core/assets.js (NS.Assets con iconos y wallpapers)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'js', 'core', 'assets.js');

const WALL_SEEDS = ['hill', 'desert', 'forest', 'mountain', 'beach', 'space', 'river', 'city'];
const WALL_NAMES = ['Colinas al atardecer', 'Desierto dorado', 'Bosque frondoso', 'Cordillera nevada', 'Playa paradisíaca', 'Noche estrellada', 'Río sereno', 'Ciudad al amanecer'];

async function downloadImage(url, timeoutMs) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error('imagen demasiado pequeña: ' + buf.length);
  return buf.toString('base64');
}

(async () => {
  const html = fs.readFileSync(HTML, 'utf8');
  const m = html.match(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*>([\s\S]*?)<\/svg>\s*<!-- ============ OVERLAYS/s);
  if (!m) { console.error('No se encontró el sprite SVG en index.html'); process.exit(1); }
  const spriteInner = m[1];

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  await page.setContent('<!doctype html><html><body><div id="host"></div></body></html>');
  await page.evaluate((s) => {
    const d = document.createElement('div');
    d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden">' + s + '</svg>';
    document.body.appendChild(d);
  }, spriteInner);

  const ids = await page.evaluate(() => Array.prototype.slice.call(document.querySelectorAll('symbol')).map(s => s.id));
  console.log('Símbolos a rasterizar:', ids.length);

  const icons = {};
  for (const id of ids) {
    const pngs = await page.evaluate(async (symId) => {
      const sym = document.getElementById(symId);
      if (!sym) return null;
      const vb = sym.getAttribute('viewBox') || '0 0 32 32';
      const mk = (size) => new Promise((resolve, reject) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', vb);
        svg.innerHTML = sym.innerHTML;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, size, size); resolve(canvas.toDataURL('image/png')); };
        img.onerror = () => reject(new Error('imagen no cargó'));
        img.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg));
      });
      const s32 = await mk(32);
      const s64 = await mk(64);
      return { s32, s64 };
    }, id);
    if (pngs) icons[id] = pngs;
  }

  // ---- fondos: fotos reales (JPEG reescalado a 900x675) ----
  const walls = {};
  let downloaded = 0;
  for (let i = 0; i < WALL_SEEDS.length; i++) {
    const id = 'foto' + (i + 1);
    const name = WALL_NAMES[i];
    try {
      const b64 = await downloadImage('https://picsum.photos/seed/' + WALL_SEEDS[i] + '/900/675', 20000);
      walls[id] = { name, src: 'data:image/jpeg;base64,' + b64 };
      downloaded++;
      console.log('  fondo ok:', name);
    } catch (e) {
      console.log('  fondo FALLÓ (' + name + '):', e.message);
    }
  }

  // ---- fondos procedurales (estilo Bliss) como complemento ----
  const proc = await page.evaluate(async () => {
    const mk = (cfg) => new Promise((resolve) => {
      const c = document.createElement('canvas');
      c.width = 900; c.height = 675;
      const x = c.getContext('2d');
      // cielo
      const g = x.createLinearGradient(0, 0, 0, 675);
      g.addColorStop(0, cfg.skyTop);
      g.addColorStop(0.55, cfg.skyMid);
      g.addColorStop(1, cfg.skyBot);
      x.fillStyle = g;
      x.fillRect(0, 0, 900, 675);
      // sol/luna
      x.fillStyle = cfg.sun;
      x.beginPath(); x.arc(cfg.sunX, cfg.sunY, 55, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.35)';
      x.beginPath(); x.arc(cfg.sunX, cfg.sunY, 90, 0, Math.PI * 2); x.fill();
      // nubes
      const cloud = (cx, cy, s, a) => {
        x.fillStyle = 'rgba(255,255,255,' + a + ')';
        x.beginPath();
        x.ellipse(cx, cy, 70 * s, 22 * s, 0, 0, Math.PI * 2);
        x.ellipse(cx + 45 * s, cy - 12 * s, 48 * s, 18 * s, 0, 0, Math.PI * 2);
        x.ellipse(cx - 48 * s, cy + 6 * s, 44 * s, 16 * s, 0, 0, Math.PI * 2);
        x.fill();
      };
      cfg.clouds.forEach(cl => cloud(cl[0], cl[1], cl[2], cl[3]));
      // colinas
      const hill = (baseY, amp, color, hx) => {
        x.fillStyle = color;
        x.beginPath();
        x.moveTo(0, 675);
        x.quadraticCurveTo(225, baseY - amp, 450, baseY);
        x.quadraticCurveTo(675, baseY + amp, 900, baseY - amp * 0.4);
        x.lineTo(900, 675);
        x.closePath();
        x.fill();
      };
      cfg.hills.forEach(h => hill(h[0], h[1], h[2], 0));
      // grano
      const idt = x.getImageData(0, 0, 900, 675);
      const d = idt.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 10;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      x.putImageData(idt, 0, 0);
      resolve(c.toDataURL('image/jpeg', 0.72));
    });
    return {
      bliss: await mk({
        skyTop: '#3a8fe0', skyMid: '#bfe3ff', skyBot: '#fdf6d8',
        sunX: 620, sunY: 120, sun: '#fff7d8',
        clouds: [[150, 90, 1, .85], [430, 150, 1.3, .8], [720, 70, 1.1, .7], [300, 220, .8, .5]],
        hills: [[470, 90, '#7fb45a'], [560, 120, '#5c9440'], [640, 60, '#3e7a30']]
      }),
      desert: await mk({
        skyTop: '#f6a83c', skyMid: '#fce3b0', skyBot: '#fff7e2',
        sunX: 200, sunY: 100, sun: '#ffdf9a',
        clouds: [[600, 120, 1.4, .5], [300, 200, .9, .4]],
        hills: [[560, 40, '#d9a44a'], [620, 70, '#c08a38']]
      }),
      night: await mk({
        skyTop: '#070b24', skyMid: '#16244f', skyBot: '#31456e',
        sunX: 700, sunY: 120, sun: '#e8f0ff',
        clouds: [[250, 100, 1.2, .18], [550, 180, 1, .12]],
        hills: [[600, 50, '#0d1226'], [650, 70, '#0a0e20']]
      })
    };
  });

  console.log('Fondos descargados:', downloaded + ' / ' + WALL_SEEDS.length);

  // ---- escribir js/core/assets.js ----
  const out = `/* ============================================================
   NovaVista 2004 — Assets incrustados (generado por tools/gen-assets.js)
   Iconos PNG (base64) rasterizados desde el sprite SVG y fondos
   fotográficos reales. NO EDITAR A MANO: regenera con
   node tools/gen-assets.js
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  NS.Assets = {
    icons: ${JSON.stringify(icons)},
    walls: ${JSON.stringify({ ...walls, procBliss: { name: 'Bliss clásico', src: proc.bliss }, procDesert: { name: 'Desierto clásico', src: proc.desert }, procNight: { name: 'Noche clásica', src: proc.night } })}
  };
})();
`;
  fs.writeFileSync(OUT, out);
  console.log('Escrito', OUT, '(' + Math.round(out.length / 1024) + ' KB)');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
