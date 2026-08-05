/* ============================================================
   NovaVista 2004 — Catálogo de contenido (mejoras, implantes,
   herramientas, misiones, malware, fondos, temas)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};

  /* ---------- Mejoras comprables con dólares ---------- */
  var UPGRADES = {
    'b-rate':   { name: 'Mejora de intereses',        desc: 'Cada nivel añade +0,006 %/s de interés (con rendimientos decrecientes).', cat: 'banco',  base: 300,   mult: 3.2, max: 25, icon: 'ic-chart' },
    'b-cd':     { name: 'Certificado de depósito',    desc: 'Cada nivel multiplica el interés por 1,2.',            cat: 'banco',  base: 3200,  mult: 4.0, max: 15, icon: 'ic-bank' },
    'b-off':    { name: 'Cuenta offshore',            desc: '+0,006 %/s de interés fijo por nivel.',              cat: 'banco',  base: 24000, mult: 5.2, max: 10, icon: 'ic-lock' },
    's-post':   { name: 'Cámara digital de 3 MP',     desc: 'Cada nivel da +40 % de seguidores por publicación.', cat: 'social', base: 250,   mult: 3.0, max: 20, icon: 'ic-social' },
    's-ad':     { name: 'Agencia de anuncios',        desc: 'Cada nivel da +50 % de ingresos por seguidor.',     cat: 'social', base: 1800,  mult: 3.6, max: 15, icon: 'ic-chart' },
    's-vrf':    { name: 'Chapa verificada',           desc: 'Cada nivel añade +0,06 %/s de crecimiento.',        cat: 'social', base: 9000,  mult: 4.2, max: 10, icon: 'ic-star' },
    'b-count':  { name: 'Bot zombie',                 desc: 'Añade un bot a tu botnet.',                      cat: 'bots',   base: 2200,  mult: 2.1, max: 120, icon: 'ic-bot' },
    'b-rig':    { name: 'Granja de minería',          desc: 'Cada nivel da +40 % de producción por bot.',     cat: 'bots',   base: 14000, mult: 2.5, max: 12, icon: 'ic-gear' },
    'd-price':  { name: 'Acuerdo de datos',           desc: 'Cada nivel da +50 % al precio de venta.',        cat: 'datos',  base: 1200,  mult: 3.4, max: 15, icon: 'ic-files' },
    'd-cap':    { name: 'Disco duro mayor',           desc: '+500 MB de almacenamiento de datos.',            cat: 'datos',  base: 900,   mult: 2.6, max: 60, icon: 'ic-computer' },
    'e-max':    { name: 'Memoria RAM extra',          desc: '+1 de energía máxima.',                          cat: 'rig',    base: 3500,  mult: 3.1, max: 20, icon: 'ic-hacker' },
    'e-regen':  { name: 'Disipador térmico',          desc: 'La energía se regenera x1,5 más rápido.',        cat: 'rig',    base: 6000,  mult: 3.6, max: 12, icon: 'ic-settings' },
    'av-level': { name: 'Motor de antivirus',         desc: 'Mejora la detección de amenazas.',               cat: 'av',     base: 500,   mult: 3.5, max: 10, icon: 'ic-shield' },
    'av-fw':    { name: 'Cortafuegos',                desc: 'Bloquea más tráfico malicioso.',                 cat: 'av',     base: 400,   mult: 3.5, max: 10, icon: 'ic-lock' }
  };

  /* ---------- Implantes (NovaCoins) — progresión meta roguelite ---------- */
  var IMPLANTS = {
    'i-energy':  { name: 'Núcleo de energía',  desc: '+1 de energía máxima (base 12).',        base: 5,  mult: 2.2, max: 25, icon: 'ic-hacker' },
    'i-stealth': { name: 'Camuflaje digital',  desc: '-4 % de rastro acumulado por acción.',   base: 6,  mult: 2.3, max: 15, icon: 'ic-wifi' },
    'i-cpu':     { name: 'CPU overclockeada',  desc: '+12 % de éxito al usar crack.',          base: 6,  mult: 2.2, max: 15, icon: 'ic-computer' },
    'i-loot':    { name: 'Aumento de botín',   desc: '+10 % de datos y dinero por asalto.',    base: 6,  mult: 2.2, max: 15, icon: 'ic-coin' },
    'i-income':  { name: 'Flujo en la sombra', desc: '+5 % de todos los ingresos pasivos.',    base: 8,  mult: 2.4, max: 20, icon: 'ic-chart' },
    'i-tools':   { name: 'Botín tecnológico',  desc: '+4 % de probabilidad de herramienta.',   base: 7,  mult: 2.3, max: 15, icon: 'ic-key' },
    'i-start':   { name: 'Kit de inicio',      desc: 'Empiezas cada asalto con una herramienta.', base: 12, mult: 2.6, max: 8, icon: 'ic-download' }
  };

  /* ---------- Herramientas (consumibles, se compran en Descargas) ---------- */
  var TOOLS = {
    'exploit':   { name: 'Kit de explotación', desc: 'Elimina 1 capa de firewall al instante.',        price: 400,  icon: 'ic-key' },
    'proxy':     { name: 'Servidor proxy',     desc: 'Reduce tu rastro a la mitad (uso: proxy).',      price: 250,  icon: 'ic-wifi' },
    'worm':      { name: 'Gusano',             desc: 'Recuperas +8 de energía.',                       price: 300,  icon: 'ic-bot' },
    'icmp':      { name: 'Túnel ICMP',         desc: 'Revela todas las conexiones del mapa.',          price: 200,  icon: 'ic-net' },
    'payload':   { name: 'Payload cifrado',    desc: '+40 % de datos al drenar el nodo objetivo.',     price: 350,  icon: 'ic-download' },
    'decrypt':   { name: 'Descifrador',        desc: 'Revela una vulnerabilidad extra del nodo.',      price: 300,  icon: 'ic-lock' }
  };

  /* ---------- Fondos de pantalla y temas ---------- */
  var WALLPAPERS = [
    { id: 'foto1',   name: 'Colinas al atardecer' },
    { id: 'foto2',   name: 'Desierto dorado' },
    { id: 'foto3',   name: 'Bosque frondoso' },
    { id: 'foto4',   name: 'Cordillera nevada' },
    { id: 'foto5',   name: 'Playa paradisíaca' },
    { id: 'foto6',   name: 'Noche estrellada' },
    { id: 'foto7',   name: 'Río sereno' },
    { id: 'foto8',   name: 'Ciudad al amanecer' },
    { id: 'procBliss', name: 'Bliss clásico' },
    { id: 'procDesert', name: 'Desierto clásico' },
    { id: 'procNight', name: 'Noche clásica' },
    { id: 'bliss',   name: 'Colinas de la felicidad (estilizado)' },
    { id: 'nova',    name: 'Azul Nova' },
    { id: 'grid',    name: 'Malla del sistema' },
    { id: 'sunset',  name: 'Atardecer digital' },
    { id: 'fractal', name: 'Fractal 2004' },
    { id: 'bosque',  name: 'Bosque nocturno' }
  ];
  var THEMES = [
    { id: 'luna',   name: 'Luna (azul)' },
    { id: 'olive',  name: 'Oliva (verde)' },
    { id: 'silver', name: 'Plata' }
  ];

  /* ---------- Avatares de usuario ---------- */
  var AVATARS = [
    'ic-hacker', 'ic-users', 'ic-bot', 'ic-star', 'ic-phone', 'ic-game',
    'ic-ava-cool', 'ic-ava-girl', 'ic-ava-boy', 'ic-ava-dog', 'ic-ava-cat',
    'ic-ava-alien', 'ic-ava-robot', 'ic-ava-skel', 'ic-ava-punk', 'ic-ava-mono'
  ];

  /* ---------- Eventos de malware ---------- */
  var MALWARE = [
    { id: 'trojan',   name: 'Caballo de Troya',      threat: 4, desc: 'Un archivo infectado entró por el correo.',        loss: 'cash' },
    { id: 'phish',    name: 'Página de phishing',    threat: 3, desc: 'Un sitio falso intenta robarte la contraseña.',   loss: 'cash' },
    { id: 'portscan', name: 'Escaneo de puertos',    threat: 5, desc: 'Alguien sondea tus puertos en busca de huecos.',  loss: 'data' },
    { id: 'botnet',   name: 'Reclutamiento botnet',  threat: 6, desc: 'Un botnet intenta tomar el control de tu PC.',    loss: 'income' },
    { id: 'worm',     name: 'Gusano de red',         threat: 7, desc: 'Un gusano se propaga por tu red local.',           loss: 'data' },
    { id: 'rootkit',  name: 'Rootkit sigiloso',      threat: 8, desc: 'Algo se escondió en el núcleo del sistema.',       loss: 'cash' }
  ];

  /* ---------- Misiones (se reclaman en el correo) ---------- */
  var QUESTS = [
    { id: 'q-first',   title: 'Primer asalto',     desc: 'Drena un nodo en el mapa de red.',                 check: function (s) { return s.meta.nodesDrained; }, target: 1,  reward: 3,  type: 'coins' },
    { id: 'q-5nodes',  title: 'Cazador de nodos',  desc: 'Drena 5 nodos en total.',                          check: function (s) { return s.meta.nodesDrained; }, target: 5,  reward: 6,  type: 'coins' },
    { id: 'q-boss',    title: 'Rey del servidor',  desc: 'Drena el MasterServer de un asalto.',              check: function (s) { return s.meta.bossesDrained; }, target: 1, reward: 10, type: 'coins' },
    { id: 'q-500',     title: 'Fama incipiente',   desc: 'Alcanza 500 seguidores en MyNova.',                check: function (s) { return s.social.followers; }, target: 500, reward: 3, type: 'coins' },
    { id: 'q-5k',      title: 'Estrella del foro', desc: 'Alcanza 5.000 seguidores.',                        check: function (s) { return s.social.followers; }, target: 5000, reward: 8, type: 'coins' },
    { id: 'q-bank10k', title: 'Cuenta saneada',    desc: 'Ten 10.000 $ en el banco.',                        check: function (s) { return s.bank.balance; }, target: 10000, reward: 4, type: 'coins' },
    { id: 'q-bank100k',title: 'Capitalista',       desc: 'Ten 100.000 $ en el banco.',                       check: function (s) { return s.bank.balance; }, target: 100000, reward: 10, type: 'coins' },
    { id: 'q-data',    title: 'Traficante',        desc: 'Vende 1 GB de datos en total.',                    check: function (s) { return s.broker.dataSold; }, target: 1024, reward: 5, type: 'coins' },
    { id: 'q-bots',    title: 'Dueño de botnet',   desc: 'Ten 5 bots minando NovaCoins.',                    check: function (s) { return s.bots.count; }, target: 5, reward: 5, type: 'coins' },
    { id: 'q-coins',   title: 'Acumulador',        desc: 'Acumula 25 NovaCoins en tu cartera.',              check: function (s) { return s.currencies.novaCoins; }, target: 25, reward: 8, type: 'coins' },
    { id: 'q-lvl10',   title: 'Veterano',          desc: 'Alcanza el nivel 10 de hacker.',                   check: function (s) { return s.currencies.level; }, target: 10, reward: 8, type: 'coins' },
    { id: 'q-malware', title: 'Bombero digital',   desc: 'Detén 5 amenazas con NovaShield.',                 check: function (s) { return s.av.malwareStopped; }, target: 5, reward: 4, type: 'coins' }
  ];

  /* ---------- Precios de herramientas del mercado negro (asaltos) ---------- */
  function upgradeCost(def, lvl) { return Math.floor(def.base * Math.pow(def.mult, lvl)); }
  function implantCost(def, lvl) { return Math.floor(def.base * Math.pow(def.mult, lvl)); }

  NS.Catalog = {
    UPGRADES: UPGRADES, IMPLANTS: IMPLANTS, TOOLS: TOOLS,
    WALLPAPERS: WALLPAPERS, THEMES: THEMES, MALWARE: MALWARE, QUESTS: QUESTS,
    AVATARS: AVATARS,
    upgradeCost: upgradeCost, implantCost: implantCost
  };
})();
