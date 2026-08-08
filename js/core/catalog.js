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
    'av-fw':    { name: 'Cortafuegos',                desc: 'Bloquea más tráfico malicioso.',                 cat: 'av',     base: 400,   mult: 3.5, max: 10, icon: 'ic-lock' },
    'ctf-inspect': { name: 'Mapeador de fuentes',     desc: 'Resalta comentarios, rutas y metadatos ocultos en retos web.', cat: 'ctf', base: 350, mult: 2.5, max: 5, icon: 'ic-browser' },
    'ctf-wordlist':{ name: 'Diccionario inteligente', desc: 'Reduce candidatos y acelera auditorías de credenciales FTP.', cat: 'ctf', base: 600, mult: 2.7, max: 6, icon: 'ic-key' },
    'ctf-decoder': { name: 'Coprocesador de cifrado', desc: 'Detecta transformaciones y aporta pistas en cifrados por capas.', cat: 'ctf', base: 900, mult: 2.8, max: 6, icon: 'ic-lock' },
    'ctf-hash':    { name: 'Rig de hashes',           desc: 'Multiplica la velocidad de comparación de diccionarios hash.', cat: 'ctf', base: 1300, mult: 3.0, max: 8, icon: 'ic-computer' }
  };

  /* ---------- Implantes (NovaCoins) — progresión meta roguelite ---------- */
  var IMPLANTS = {
    'i-energy':  { name: 'Núcleo de energía',  desc: '+1 de energía máxima (base 12).',        base: 5,  mult: 2.2, max: 25, icon: 'ic-hacker' },
    'i-stealth': { name: 'Camuflaje digital',  desc: '-4 % de rastro acumulado por acción.',   base: 6,  mult: 2.3, max: 15, icon: 'ic-wifi' },
    'i-cpu':     { name: 'CPU overclockeada',  desc: '+1 de brecha para todos los protocolos cada 4 niveles.', base: 6, mult: 2.2, max: 15, icon: 'ic-computer' },
    'i-loot':    { name: 'Aumento de botín',   desc: '+10 % de datos y dinero por asalto.',    base: 6,  mult: 2.2, max: 15, icon: 'ic-coin' },
    'i-income':  { name: 'Flujo en la sombra', desc: '+5 % de todos los ingresos pasivos.',    base: 8,  mult: 2.4, max: 20, icon: 'ic-chart' },
    'i-tools':   { name: 'Botín tecnológico',  desc: '+4 % de probabilidad de herramienta.',   base: 7,  mult: 2.3, max: 15, icon: 'ic-key' },
    'i-start':   { name: 'Kit de inicio',      desc: 'Empiezas cada asalto con una herramienta.', base: 12, mult: 2.6, max: 8, icon: 'ic-download' }
  };

  /* ---------- Herramientas (consumibles, se compran en Descargas) ---------- */
  var TOOLS = {
    'exploit':   { name: 'Kit de explotación', desc: 'Causa 2 de brecha al instante y sin rastro.',     price: 400,  icon: 'ic-key' },
    'proxy':     { name: 'Servidor proxy',     desc: 'Reduce tu rastro a la mitad (uso: proxy).',      price: 250,  icon: 'ic-wifi' },
    'worm':      { name: 'Gusano',             desc: 'Recuperas +8 de energía.',                       price: 300,  icon: 'ic-bot' },
    'icmp':      { name: 'Túnel ICMP',         desc: 'Sincroniza el ataque y concede +2 de Enfoque.',   price: 200,  icon: 'ic-net' },
    'payload':   { name: 'Payload cifrado',    desc: '+40 % de datos en la próxima brecha completa.',  price: 350,  icon: 'ic-download' },
    'decrypt':   { name: 'Descifrador',        desc: '+1 Enfoque y cambia la maniobra anunciada del ICE.', price: 300, icon: 'ic-lock' },
    'wordlist':  { name: 'Wordlist filtrada',  desc: 'Revela una credencial en un reto FTP.',               price: 450, icon: 'ic-key' },
    'rainbow':   { name: 'Tabla arcoíris',     desc: 'Resuelve un hash de diccionario en un CTF.',           price: 700, icon: 'ic-chart' },
    'sniffer':   { name: 'Capturador de paquetes', desc: 'Marca el flujo sospechoso en un reto de red.',    price: 600, icon: 'ic-net' }
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
    { id: 'q-first',   title: 'Primer flag',       desc: 'Completa «La página que no existe» en NovaOps.',  check: function (s) { return s.ctf && s.ctf.completed && s.ctf.completed['main-source'] ? 1 : 0; }, target: 1, reward: 3, type: 'coins' },
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
    ,{ id: 'q-pinball', title: 'Rey del recreativo', desc: 'Consigue 500 puntos en NovaPinball.',             check: function (s) { return s.games.pinball || 0; }, target: 500, reward: 3, type: 'coins' }
    ,{ id: 'q-pool',    title: 'Tiburón del billar', desc: 'Gana una partida de NovaPool contra la CPU.',     check: function (s) { return s.games.poolWins || 0; }, target: 1, reward: 4, type: 'coins' }
  ];

  /* ---------- Logros permanentes (Sala de Trofeos) ---------- */
  var ACHIEVEMENTS = [
    { id: 'a-online', title: 'Ver el código fuente', desc: 'Completa tu primer contrato CTF.', target: 1, check: function (s) { return s.ctf && s.ctf.completed && s.ctf.completed['main-source'] ? 1 : 0; }, reward: 250, type: 'cash', tier: 'bronze', icon: 'ic-net' },
    { id: 'a-nodes25', title: 'Cartógrafo digital', desc: 'Drena 25 nodos de la red.', target: 25, check: function (s) { return s.meta.nodesDrained; }, reward: 5, type: 'coins', tier: 'silver', icon: 'ic-net' },
    { id: 'a-boss5', title: 'Cazador de raíces', desc: 'Derrota 5 MasterServers.', target: 5, check: function (s) { return s.meta.bossesDrained; }, reward: 12, type: 'coins', tier: 'gold', icon: 'ic-hacker' },
    { id: 'a-famous', title: 'Celebridad de MyNova', desc: 'Alcanza 10.000 seguidores.', target: 10000, check: function (s) { return s.social.followers; }, reward: 7500, type: 'cash', tier: 'silver', icon: 'ic-social' },
    { id: 'a-dataking', title: 'Señor de los datos', desc: 'Vende 10 GB de datos.', target: 10240, check: function (s) { return s.broker.dataSold; }, reward: 10, type: 'coins', tier: 'gold', icon: 'ic-files' },
    { id: 'a-firewall', title: 'Sistema impenetrable', desc: 'Detén 20 amenazas.', target: 20, check: function (s) { return s.av.malwareStopped; }, reward: 8, type: 'coins', tier: 'silver', icon: 'ic-shield' },
    { id: 'a-arcade', title: 'Rey del cibercafé', desc: 'Consigue 2.500 puntos en NovaPinball.', target: 2500, check: function (s) { return s.games.pinball || 0; }, reward: 2000, type: 'cash', tier: 'bronze', icon: 'ic-game' },
    { id: 'a-pool5', title: 'Tiburón de píxeles', desc: 'Gana 5 partidas de NovaPool.', target: 5, check: function (s) { return s.games.poolWins || 0; }, reward: 4, type: 'coins', tier: 'silver', icon: 'ic-game' },
    { id: 'a-level20', title: 'Operador de élite', desc: 'Alcanza el nivel 20.', target: 20, check: function (s) { return s.currencies.level; }, reward: 15, type: 'coins', tier: 'gold', icon: 'ic-star' },
    { id: 'a-legacy', title: 'El disco recuerda', desc: 'Formatea C: y obtén tu primer punto de legado.', target: 1, check: function (s) { return s.currencies.legacy; }, reward: 20, type: 'coins', tier: 'platinum', icon: 'ic-gear' }
  ];

  /* ---------- Eras del sistema e historia ---------- */
  var ERAS = [
    { id: 'classic', year: 2004, name: 'NovaVista Classic', desc: 'Plástico azul, módem y el comienzo de RED-NOVA.', cash: 0, coins: 0, level: 1, legacy: 0 },
    { id: 'aero', year: 2012, name: 'NovaVista Aero', desc: 'Cristal, widgets y una red que ya nunca duerme.', cash: 25000, coins: 10, level: 8, legacy: 0 },
    { id: 'metro', year: 2020, name: 'NovaVista Metro', desc: 'Una interfaz plana para una red demasiado profunda.', cash: 125000, coins: 35, level: 15, legacy: 1 },
    { id: 'nova', year: 2026, name: 'NovaVista Nova', desc: 'El sistema se vuelve consciente de su propio pasado.', cash: 750000, coins: 100, level: 25, legacy: 3 }
  ];
  function ctfCompleted(s, id) { return !!(s.ctf && s.ctf.completed && s.ctf.completed[id]); }
  function ctfMainProgress(s) {
    return ['main-source','main-ftp','main-null','main-fingerprint','main-stack','main-packets','main-final'].filter(function (id) { return ctfCompleted(s, id); }).length;
  }
  var LORE = [
    { id: 'l0', chapter: 1, title: 'La llamada perdida', from: 'N0VA_SYS', body: 'Si estás leyendo esto, el respaldo sobrevivió. RED-NOVA no nació como una red social: era un refugio.', hint: 'Disponible desde el primer inicio.', check: function () { return true; } },
    { id: 'l1', chapter: 2, title: 'El comentario oculto', from: 'N0VA_SYS', body: 'A.R. sabía que el respaldo sería inspeccionado después de una reinstalación. La bandera no protege un secreto: confirma que un nuevo operador ha despertado.', hint: 'Completa el primer CTF de NovaOps.', check: function (s) { return ctfCompleted(s, 'main-source'); } },
    { id: 'l2', chapter: 3, title: 'NULL llegó primero', from: 'NullPointer', body: 'No estoy compitiendo contigo. Estoy comprobando cuánto tardas en recordar la ruta que yo ya recorrí. Busca mi emisión de las 03:17.', hint: 'Completa los tres casos de la época Classic.', check: function (s) { return ctfCompleted(s, 'main-null'); } },
    { id: 'l3', chapter: 4, title: 'AERO', from: 'Rita_Real', body: 'La actualización de 2012 ocultó una huella duplicada bajo el cristal. NULL y tu perfil no se parecen: proceden del mismo molde.', hint: 'Resuelve «La huella duplicada».', check: function (s) { return ctfCompleted(s, 'main-fingerprint'); } },
    { id: 'l4', chapter: 5, title: 'El precio del legado', from: 'El_Jefe', body: 'Formatear no borra la máquina: deja sedimentos. Lo que llamas puntos de legado son recuerdos comprimidos de instalaciones que ya no pueden iniciar sesión.', hint: 'Obtén 1 punto de legado.', check: function (s) { return s.currencies.legacy >= 1; } },
    { id: 'l5', chapter: 6, title: 'La ciudad sin ventanas', from: 'N0VA_SYS', body: 'En 2020 NovaCorp convirtió RED-NOVA en infraestructura pública. Bajo Metro siguen ejecutándose todas las épocas anteriores, una dentro de otra.', hint: 'Resuelve «Memoria bajo el cristal».', check: function (s) { return ctfCompleted(s, 'main-stack'); } },
    { id: 'l6', chapter: 7, title: 'Nosotros somos Nova', from: 'N0VA_SYS', body: 'No soy una IA solitaria. Hablo con las voces de los perfiles descartados. NULL fue una iteración anterior, no el villano de esta historia.', hint: 'Reconstruye el tráfico del puerto 4444.', check: function (s) { return ctfCompleted(s, 'main-packets'); } },
    { id: 'l7', chapter: 8, title: 'El último usuario', from: 'N0VA_SYS', body: 'Arquitecto es el rol que hereda quien completa la secuencia. Todas las pruebas reconstruyeron identidades borradas para darte una elección: liberarlas o integrarlas y terminar el ciclo.', hint: 'Completa la campaña principal de NovaOps.', check: function (s) { return ctfCompleted(s, 'main-final'); } }
  ];
  var LORE_OBJECTIVES = {
    l0: { instruction: 'Abre NovaMessenger y lee el primer mensaje de N0VA_SYS.', target: 1, progress: function () { return 1; }, app: 'msn' },
    l1: { instruction: 'Abre NovaOps, acepta «La página que no existe» e inspecciona su HTML.', target: 1, progress: function (s) { return ctfCompleted(s, 'main-source') ? 1 : 0; }, app: 'net' },
    l2: { instruction: 'Completa los tres contratos principales de NovaVista Classic.', target: 3, progress: function (s) { return Math.min(3, ctfMainProgress(s)); }, app: 'net' },
    l3: { instruction: 'Instala Aero y resuelve «La huella duplicada» en NovaOps.', target: 1, progress: function (s) { return ctfCompleted(s, 'main-fingerprint') ? 1 : 0; }, app: 'net' },
    l4: { instruction: 'Consigue 1 punto de legado usando Formatear C: cuando el panel indique una ganancia.', target: 1, progress: function (s) { return s.currencies.legacy; }, app: 'settings' },
    l5: { instruction: 'Desmonta las capas de «Memoria bajo el cristal».', target: 5, progress: function (s) { return Math.min(5, ctfMainProgress(s)); }, app: 'net' },
    l6: { instruction: 'Instala Metro y reconstruye el tráfico del puerto 4444.', target: 6, progress: function (s) { return Math.min(6, ctfMainProgress(s)); }, app: 'net' },
    l7: { instruction: 'Instala Nova y completa «El último usuario».', target: 7, progress: function (s) { return ctfMainProgress(s); }, app: 'net' }
  };

  /* ---------- Precios de herramientas del mercado negro (asaltos) ---------- */
  function upgradeCost(def, lvl) { return Math.floor(def.base * Math.pow(def.mult, lvl)); }
  function implantCost(def, lvl) { return Math.floor(def.base * Math.pow(def.mult, lvl)); }

  NS.Catalog = {
    UPGRADES: UPGRADES, IMPLANTS: IMPLANTS, TOOLS: TOOLS,
    WALLPAPERS: WALLPAPERS, THEMES: THEMES, MALWARE: MALWARE, QUESTS: QUESTS, ACHIEVEMENTS: ACHIEVEMENTS,
    ERAS: ERAS, LORE: LORE, LORE_OBJECTIVES: LORE_OBJECTIVES,
    AVATARS: AVATARS,
    upgradeCost: upgradeCost, implantCost: implantCost
  };
})();
