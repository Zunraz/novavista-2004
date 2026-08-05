const { chromium } = require('playwright-core');
const fs = require('fs');
(async () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const sprite = html.match(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" style="position:absolute[^>]*>([\s\S]*?)<\/svg>\s*<!-- ============ INICIO/s)[1];
  const b = await chromium.launch();
  const pg = await b.newPage();
  await pg.setViewportSize({ width: 600, height: 600 });
  await pg.setContent('<div id="host"></div>');
  // inyectar el sprite como un svg normal (no display:none)
  await pg.evaluate((s) => {
    const d = document.createElement('div');
    d.innerHTML = s;
    document.body.appendChild(d);
  }, sprite);
  const syms = await pg.evaluate(() => {
    return Array.prototype.slice.call(document.querySelectorAll('symbol')).map(s => s.id);
  });
  console.log('symbols:', syms.length);
  // renderizar uno
  const out = await pg.evaluate(async (id) => {
    const sym = document.getElementById(id);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '32');
    svg.setAttribute('height', '32');
    svg.setAttribute('viewBox', sym.getAttribute('viewBox') || '0 0 32 32');
    svg.innerHTML = sym.innerHTML;
    document.getElementById('host').appendChild(svg);
    const rect = svg.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const svgStr = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;base64,' + btoa(svgStr); });
    ctx.drawImage(img, 0, 0, 32, 32);
    return canvas.toDataURL('image/png').length;
  }, 'ic-browser');
  console.log('png data uri length:', out);
  await b.close();
})();
