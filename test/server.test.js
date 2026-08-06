/* ============================================================
   NovaVista 2004 — Test del servidor en línea (amigos + cuentas)
   Ejecuta: node test/server.test.js
   ============================================================ */
'use strict';
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 3910;
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✓ ' + label); }
  else { failed++; console.log('  ✗ ' + label); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const testData = fs.mkdtempSync(path.join(os.tmpdir(), 'novavista-test-'));
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'index.js'), String(PORT)], {
    stdio: 'ignore', env: Object.assign({}, process.env, { NOVAVISTA_DATA_DIR: testData })
  });
  await sleep(1200);
  const B = 'http://localhost:' + PORT;
  const post = (p, body, token) => fetch(B + p + (token ? '?token=' + token : ''), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
  });
  try {
    let r = await post('/api/register', { username: 'AnaJugadora', password: 'clave1111', avatar: 2 });
    let j = await r.json();
    ok(r.status === 200 && j.token, 'registro AnaJugadora');
    const tokA = j.token;

    r = await post('/api/register', { username: 'BrunoHacker', password: 'clave2222', avatar: 7 });
    j = await r.json();
    ok(r.status === 200 && j.token, 'registro BrunoHacker');
    const tokB = j.token;

    // buscar usuarios
    r = await fetch(B + '/api/users/search?q=brun&token=' + tokA);
    j = await r.json();
    ok(j.list.length === 1 && j.list[0].username === 'brunohacker', 'búsqueda encuentra a Bruno');

    // solicitud A -> B
    r = await post('/api/friends/request', { to: 'brunohacker' }, tokA);
    ok(r.status === 200, 'A envía solicitud a B');
    r = await post('/api/friends/request', { to: 'brunohacker' }, tokA);
    ok(r.status === 409, 'solicitud duplicada rechazada');
    r = await post('/api/friends/request', { to: 'anajugadora' }, tokA);
    ok(r.status === 400, 'no te puedes autoenviar solicitud');

    // B ve la solicitud entrante
    r = await fetch(B + '/api/friends?token=' + tokB);
    j = await r.json();
    ok(j.incoming.length === 1 && j.incoming[0].username === 'anajugadora', 'B tiene 1 solicitud entrante');
    ok(j.friends.length === 0, 'B aún sin amigos');

    // B acepta
    r = await post('/api/friends/accept', { from: 'anajugadora' }, tokB);
    ok(r.status === 200, 'B acepta la solicitud');

    // ambos son amigos ya
    r = await fetch(B + '/api/friends?token=' + tokA);
    j = await r.json();
    ok(j.friends.length === 1 && j.friends[0].username === 'brunohacker', 'A ve a Bruno como amigo');
    r = await fetch(B + '/api/friends?token=' + tokB);
    j = await r.json();
    ok(j.friends.length === 1 && j.friends[0].username === 'anajugadora', 'B ve a Ana como amiga');

    // perfil público con relación
    r = await fetch(B + '/api/profile/brunohacker?token=' + tokA);
    j = await r.json();
    ok(j.profile.rel === 'friend' && j.profile.elo >= 400, 'perfil de Bruno: rel=friend, elo válido');
    r = await fetch(B + '/api/profile/noexiste?token=' + tokA);
    ok(r.status === 404, 'perfil inexistente 404');

    // eliminar amigo
    r = await post('/api/friends/remove', { username: 'brunohacker' }, tokA);
    ok(r.status === 200, 'A elimina a Bruno');
    r = await fetch(B + '/api/friends?token=' + tokA);
    j = await r.json();
    ok(j.friends.length === 0, 'lista de amigos vacía tras eliminar');

    // perfil con campos personalizados (guardar perfil -> parsear mood)
    const fake = Buffer.from(JSON.stringify({
      d: JSON.stringify({ social: { profile: { mood: 'fiesta total', about: 'me gusta el 8pool' } }, currencies: { level: 4, cash: 100, novaCoins: 2, legacy: 0 }, meta: {}, bank: { balance: 0 }, upg: {}, bots: { count: 0 } }),
      h: 'x'
    })).toString('base64');
    await post('/api/save', { data: fake }, tokB);
    r = await fetch(B + '/api/profile/brunohacker?token=' + tokA);
    j = await r.json();
    ok(j.profile.mood === 'fiesta total' && j.profile.level === 4, 'perfil con mood y nivel del guardado');

    // login con contraseña equivocada y rate limit suave
    r = await post('/api/login', { username: 'brunohacker', password: 'incorrecta' });
    ok(r.status === 401, 'login con contraseña mala 401');

    console.log('\nServidor: ' + passed + ' pasaron, ' + failed + ' fallaron');
  } catch (e) {
    failed++;
    console.error('Error en test:', e.message);
  } finally {
    srv.kill();
    try { fs.rmSync(testData, { recursive: true, force: true }); } catch (e) {}
  }
  process.exit(failed ? 1 : 0);
})();
