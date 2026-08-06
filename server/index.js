/* ============================================================
   NovaVista 2004 — Servidor en línea (Node estándar + SQLite)
   Sirve el juego y gestiona cuentas reales, guardados y rankings.
   Requiere Node 22.5+ (node:sqlite).

   Uso:  node server/index.js [puerto]
   Juego: http://localhost:3000
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = process.env.NOVAVISTA_DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'nova.db');
const PORT = parseInt(process.argv[2] || process.env.PORT || '3000', 10);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    pwd_hash TEXT NOT NULL,
    pwd_salt TEXT NOT NULL,
    avatar INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_active INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saves (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL REFERENCES users(id),
    friend_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, friend_id)
  );
`);
// migración: columna last_active en instalaciones antiguas
try {
  const cols = db.prepare("PRAGMA table_info(users)").all();
  if (!cols.some(c => c.name === 'last_active')) {
    db.exec('ALTER TABLE users ADD COLUMN last_active INTEGER NOT NULL DEFAULT 0');
  }
} catch (e) {}

/* ---------- utilidades ---------- */
function now() { return Date.now(); }
function scryptPwd(pwd, salt) {
  return crypto.scryptSync(String(pwd), salt, 32).toString('hex');
}
function newToken() { return crypto.randomBytes(32).toString('hex'); }
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('cuerpo demasiado grande')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

/* ---------- seguridad: límite de peticiones por IP ---------- */
const RATE = new Map();
function rateLimited(ip) {
  const key = ip;
  const t = now();
  const w = RATE.get(key) || { n: 0, at: t };
  if (t - w.at > 60000) { w.n = 0; w.at = t; }
  w.n++;
  RATE.set(key, w);
  return w.n > 120; // 120 peticiones/minuto por IP
}
setInterval(() => { RATE.clear(); }, 60000).unref();

/* ---------- validación de usuarios ---------- */
function validUsername(u) { return /^[A-Za-z0-9_ .\-áéíóúñÁÉÍÓÚÑ]{2,20}$/.test(String(u || '')); }
function validPassword(p) { return typeof p === 'string' && p.length >= 4 && p.length <= 64; }

function findUser(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).toLowerCase());
}
function parseState(saveData) {
  try {
    const box = JSON.parse(Buffer.from(String(saveData).trim(), 'base64').toString('utf8'));
    return JSON.parse(box.d);
  } catch (e) { return null; }
}
function scoreOf(state) {
  // puntuaciones de poder y elo (mismas fórmulas que el cliente)
  try {
    const c = state.currencies || {};
    const impl = Object.keys(state.upg || {}).filter((k) => k.indexOf('i-') === 0)
      .reduce((a, k) => a + (state.upg[k] || 0), 0);
    const power = Math.floor(
      (c.cash || 0) + (state.bank && state.bank.balance || 0) +
      (state.social && state.social.followers || 0) * 10 +
      (state.bots && state.bots.count || 0) * 1500 +
      (c.novaCoins || 0) * 40 +
      (c.level || 0) * 300 +
      (c.legacy || 0) * 8000 +
      impl * 200 +
      ((state.meta && state.meta.bossesDrained) || 0) * 500
    );
    const elo = Math.max(400, 1000 +
      ((state.meta && state.meta.bossesDrained) || 0) * 150 +
      ((state.meta && state.meta.nodesDrained) || 0) * 8 +
      ((state.meta && state.meta.runsDone) || 0) * 25 -
      ((state.meta && state.meta.runsTraced) || 0) * 30 +
      (c.level || 0) * 20);
    return { power, elo, level: c.level || 1 };
  } catch (e) {
    return { power: 0, elo: 400, level: 1 };
  }
}

/* ---------- manejador de API ---------- */
async function handleApi(req, res, url) {
  const ip = req.socket.remoteAddress || '0.0.0.0';
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'Demasiadas peticiones. Espera un momento.' });
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method;

  // ---- registro ----
  if (p === '/api/register' && method === 'POST') {
    let body;
    try { body = await readBody(req, 4096); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    const username = String(body.username || '').trim();
    if (!validUsername(username)) return json(res, 400, { ok: false, error: 'Nombre no válido (2-20 caracteres, sin símbolos raros).' });
    if (!validPassword(body.password)) return json(res, 400, { ok: false, error: 'La contraseña debe tener al menos 4 caracteres.' });
    const lower = username.toLowerCase();
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(lower);
    if (exists) return json(res, 409, { ok: false, error: 'Ese nombre de usuario ya existe.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = scryptPwd(body.password, salt);
    const avatar = Math.max(0, Math.min(15, parseInt(body.avatar, 10) || 0));
    const info = db.prepare('INSERT INTO users (username, pwd_hash, pwd_salt, avatar, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(lower, hash, salt, avatar, now());
    const token = newToken();
    db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, info.lastInsertRowid, now());
    return json(res, 200, { ok: true, token, username: lower, avatar });
  }

  // ---- login ----
  if (p === '/api/login' && method === 'POST') {
    let body;
    try { body = await readBody(req, 4096); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    const u = findUser(body.username);
    if (!u) return json(res, 401, { ok: false, error: 'Usuario o contraseña incorrectos.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const h1 = scryptPwd(body.password, u.pwd_salt);
    const h2 = scryptPwd(body.password, salt); // tiempo constante a prueba de timing
    if (!crypto.timingSafeEqual(Buffer.from(h1, 'hex'), Buffer.from(u.pwd_hash, 'hex'))) {
      return json(res, 401, { ok: false, error: 'Usuario o contraseña incorrectos.' });
    }
    const token = newToken();
    db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, u.id, now());
    return json(res, 200, { ok: true, token, username: u.username, avatar: u.avatar });
  }

  // ---- sesión ---- 
  const auth = url.searchParams.get('token');
  let session = null;
  if (auth) {
    session = db.prepare('SELECT s.token, s.user_id, u.username, u.avatar FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(auth);
    if (session) db.prepare('UPDATE users SET last_active = ? WHERE id = ?').run(now(), session.user_id);
  }
  const ONLINE_WINDOW = 5 * 60 * 1000; // 5 min

  /* perfil público de un usuario (datos + estado + amigos) */
  function profileOf(userRow, myId) {
    const save = db.prepare('SELECT data FROM saves WHERE user_id = ?').get(userRow.id);
    let st = null;
    if (save) st = parseState(save.data);
    const sc = st ? scoreOf(st) : { power: 0, elo: 400, level: 1 };
    const social = (st && st.social) || {};
    const prof = social.profile || {};
    const fc = db.prepare('SELECT COUNT(*) AS n FROM friends WHERE user_id = ? AND status = ?').get(userRow.id, 'accepted');
    let rel = 'none';
    if (myId && myId !== userRow.id) {
      const a = db.prepare('SELECT status FROM friends WHERE user_id = ? AND friend_id = ?').get(myId, userRow.id);
      const b = db.prepare('SELECT status FROM friends WHERE user_id = ? AND friend_id = ?').get(userRow.id, myId);
      if (a && a.status === 'accepted') rel = 'friend';
      else if (b && b.status === 'pending') rel = 'incoming';
      else if (a && a.status === 'pending') rel = 'outgoing';
    }
    return {
      username: userRow.username, avatar: userRow.avatar,
      level: sc.level, power: sc.power, elo: sc.elo,
      online: now() - (userRow.last_active || 0) < ONLINE_WINDOW,
      mood: prof.mood || '', about: prof.about || '', music: prof.music || '',
      movies: prof.movies || '', heroes: prof.heroes || '', looking: prof.looking || '',
      style: prof.style || '',
      friendCount: (fc && fc.n) || 0,
      rel: rel
    };
  }

  // ---- logout ----
  if (p === '/api/logout' && method === 'POST') {
    if (session) db.prepare('DELETE FROM sessions WHERE token = ?').run(session.token);
    return json(res, 200, { ok: true });
  }

  // ---- perfil ----
  if (p === '/api/me' && method === 'GET') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    const save = db.prepare('SELECT data FROM saves WHERE user_id = ?').get(session.user_id);
    let level = 1;
    if (save) {
      const st = parseState(save.data);
      if (st && st.currencies) level = st.currencies.level || 1;
    }
    return json(res, 200, { ok: true, username: session.username, avatar: session.avatar, level });
  }

  // ---- guardado: bajar ----
  if (p === '/api/save' && method === 'GET') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    const save = db.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').get(session.user_id);
    return json(res, 200, { ok: true, data: save ? save.data : null, updatedAt: save ? save.updated_at : 0 });
  }

  // ---- guardado: subir ----
  if (p === '/api/save' && method === 'POST') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    let body;
    try { body = await readBody(req, 600000); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    if (typeof body.data !== 'string' || body.data.length < 50 || body.data.length > 500000) {
      return json(res, 400, { ok: false, error: 'Guardado no válido.' });
    }
    db.prepare('INSERT INTO saves (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
      .run(session.user_id, body.data, now());
    return json(res, 200, { ok: true });
  }

  // ---- búsqueda de usuarios (amigos) ----
  if (p === '/api/users/search' && method === 'GET') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    const q = String(url.searchParams.get('q') || '').toLowerCase().trim();
    if (!q) return json(res, 200, { ok: true, list: [] });
    const all = db.prepare('SELECT * FROM users WHERE id != ?').all(session.user_id);
    const out = all.filter(u => u.username.indexOf(q) !== -1).slice(0, 20).map(u => profileOf(u, session.user_id));
    return json(res, 200, { ok: true, list: out });
  }

  // ---- lista de amigos / solicitudes ----
  if (p === '/api/friends' && method === 'GET') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    const acc = db.prepare('SELECT u.* FROM friends f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ? AND f.status = ?').all(session.user_id, 'accepted');
    const inc = db.prepare('SELECT u.* FROM friends f JOIN users u ON u.id = f.user_id WHERE f.friend_id = ? AND f.status = ?').all(session.user_id, 'pending');
    const out = db.prepare('SELECT u.* FROM friends f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ? AND f.status = ?').all(session.user_id, 'pending');
    return json(res, 200, {
      ok: true,
      friends: acc.map(u => profileOf(u, session.user_id)),
      incoming: inc.map(u => ({ username: u.username, avatar: u.avatar })),
      outgoing: out.map(u => ({ username: u.username, avatar: u.avatar }))
    });
  }

  // ---- enviar solicitud de amistad ----
  if (p === '/api/friends/request' && method === 'POST') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    let body;
    try { body = await readBody(req, 4096); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    const target = findUser(body.to);
    if (!target) return json(res, 404, { ok: false, error: 'Ese usuario no existe.' });
    if (target.id === session.user_id) return json(res, 400, { ok: false, error: 'No puedes ser tu propio amigo.' });
    const exists = db.prepare('SELECT status FROM friends WHERE user_id = ? AND friend_id = ?').get(session.user_id, target.id);
    const reverse = db.prepare('SELECT status FROM friends WHERE user_id = ? AND friend_id = ?').get(target.id, session.user_id);
    if (exists || reverse) return json(res, 409, { ok: false, error: 'Ya hay una solicitud o sois amigos.' });
    db.prepare('INSERT INTO friends (user_id, friend_id, status, created_at) VALUES (?, ?, ?, ?)').run(session.user_id, target.id, 'pending', now());
    return json(res, 200, { ok: true });
  }

  // ---- aceptar solicitud ----
  if (p === '/api/friends/accept' && method === 'POST') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    let body;
    try { body = await readBody(req, 4096); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    const from = findUser(body.from);
    if (!from) return json(res, 404, { ok: false, error: 'Ese usuario no existe.' });
    const row = db.prepare('SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?').get(from.id, session.user_id, 'pending');
    if (!row) return json(res, 409, { ok: false, error: 'No hay ninguna solicitud de ese usuario.' });
    db.prepare('UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?').run('accepted', from.id, session.user_id);
    db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id, status, created_at) VALUES (?, ?, ?, ?)').run(session.user_id, from.id, 'accepted', now());
    return json(res, 200, { ok: true });
  }

  // ---- eliminar amigo / rechazar solicitud ----
  if (p === '/api/friends/remove' && method === 'POST') {
    if (!session) return json(res, 401, { ok: false, error: 'Sesión no válida.' });
    let body;
    try { body = await readBody(req, 4096); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    const other = findUser(body.username);
    if (!other) return json(res, 404, { ok: false, error: 'Ese usuario no existe.' });
    db.prepare('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)')
      .run(session.user_id, other.id, other.id, session.user_id);
    return json(res, 200, { ok: true });
  }

  // ---- perfil público de un usuario ----
  if (p.indexOf('/api/profile/') === 0 && method === 'GET') {
    const uname = decodeURIComponent(p.slice('/api/profile/'.length)).toLowerCase();
    const u = findUser(uname);
    if (!u) return json(res, 404, { ok: false, error: 'Ese usuario no existe.' });
    const prof = profileOf(u, session ? session.user_id : null);
    if (session && u.id === session.user_id) prof.me = true;
    return json(res, 200, { ok: true, profile: prof });
  }

  // ---- rankings ----
  if (p === '/api/rankings' && method === 'GET') {    const type = url.searchParams.get('type') === 'elo' ? 'elo' : 'power';
    const rows = db.prepare('SELECT u.username, u.avatar, s.data FROM users u LEFT JOIN saves s ON s.user_id = u.id').all();
    const out = [];
    for (const r of rows) {
      let sc = { power: 0, elo: 400, level: 1 };
      if (r.data) {
        const st = parseState(r.data);
        if (st) sc = scoreOf(st);
      }
      out.push({ name: r.username, avatar: r.avatar, level: sc.level, power: sc.power, elo: sc.elo });
    }
    out.sort((a, b) => (type === 'elo' ? b.elo - a.elo : b.power - a.power));
    return json(res, 200, { ok: true, type, list: out.slice(0, 50) });
  }

  return json(res, 404, { ok: false, error: 'Ruta no encontrada.' });
}

/* ---------- estáticos ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  let file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ---------- servidor ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.indexOf('/api/') === 0) {
      await handleApi(req, res, url);
    } else if (req.method === 'GET' || req.method === 'HEAD') {
      serveStatic(req, res, url);
    } else {
      json(res, 405, { ok: false, error: 'Método no permitido.' });
    }
  } catch (e) {
    console.error('[servidor]', e);
    try { json(res, 500, { ok: false, error: 'Error interno.' }); } catch (e2) {}
  }
});

server.listen(PORT, () => {
  console.log('══════════════════════════════════════════════');
  console.log('  NovaVista 2004 — servidor en línea');
  console.log('  Juego:   http://localhost:' + PORT);
  console.log('  BD:      ' + DB_PATH + ' (SQLite)');
  console.log('══════════════════════════════════════════════');
});
