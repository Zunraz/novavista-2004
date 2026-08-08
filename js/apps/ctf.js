/* ============================================================
   NovaVista — Motor de contratos CTF
   Catálogo declarativo, campaña por épocas, encargos secundarios
   y banco de trabajo interactivo. Añadir contenido nuevo sólo
   requiere registrar otro objeto en JOBS.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var JOBS = [
    {
      id: 'main-source', type: 'main', era: 0, order: 1, client: 'N0VA_SYS', title: 'La página que no existe', difficulty: 1,
      brief: 'Una copia de la web corporativa de NovaCorp contiene un comentario que ningún navegador muestra.',
      lore: 'Primer rastro del Proyecto Incremental. El autor firma como A.R., pero evita escribir su nombre.',
      reveal: 'El comentario no habla de un administrador, sino de un “operador compatible”. A.R. esperaba que otra persona encontrase esta copia después de una reinstalación.',
      reward: { cash: 250, xp: 24, fame: 40, rep: 2 }, evidence: 'A.R. reservó un hueco para un operador futuro.',
      stages: [{ kind: 'inspect', title: 'Inspecciona la portada', prompt: 'Encuentra la bandera oculta en el HTML y entrégala.', answer: 'NOVA-ROOT-01', hint: 'No está en la página visible. Abre el inspector y busca un comentario HTML.',
        pageTitle: 'NovaCorp — conectando el mañana', pageBody: 'Soluciones de red para una nueva generación.<br><button>Entrar en NovaNet</button>',
        source: '<html>\n  <head><title>NovaCorp</title></head>\n  <body data-build="2004.04">\n    <h1>Conectando el mañana</h1>\n    <!-- A.R.: operador compatible pendiente -->\n    <!-- FLAG: NOVA-ROOT-01 -->\n  </body>\n</html>' }]
    },
    {
      id: 'main-ftp', type: 'main', era: 0, order: 2, prereq: 'main-source', client: 'N0VA_SYS', title: 'El respaldo del Arquitecto', difficulty: 2,
      brief: 'El comentario apunta a un FTP de respaldo con una política de contraseñas desastrosa.',
      lore: 'El servidor conserva una carpeta llamada /incremental y un fichero sobre la identidad del Arquitecto.',
      reveal: 'El documento define ARQUITECTO como un permiso del sistema, no como una persona. Cualquier operador que complete la secuencia puede heredar ese nombre.',
      reward: { cash: 500, xp: 38, fame: 70, coins: 1, rep: 3 }, evidence: '“Arquitecto” es un rol transferible, no una identidad.',
      stages: [
        { kind: 'ftp', title: 'Audita las credenciales', prompt: 'Accede al FTP. El usuario aparece en el banner y la clave combina el proyecto con el año.', answer: 'backup:incremental04', user: 'backup', pass: 'incremental04', hint: 'Usuario: backup. Prueba el nombre del proyecto seguido de 04.', candidates: ['nova', 'backup', 'incremental', 'incremental04', 'admin2004', 'summer04'] },
        { kind: 'terminal', title: 'Lee role.txt', prompt: 'Entrega la bandera que aparece en el fichero recuperado.', answer: 'ARCHITECT-IS-A-ROLE', hint: 'La línea que empieza por FLAG es la respuesta.', text: 'ftp> get /incremental/role.txt\n200 OK\nROLE=ARCHITECT\nASSIGNEE=<compatible_operator>\nFLAG=ARCHITECT-IS-A-ROLE' }
      ]
    },
    {
      id: 'main-null', type: 'main', era: 0, order: 3, prereq: 'main-ftp', client: 'NullPointer', title: 'La emisión de las 03:17', difficulty: 2,
      brief: 'Una radio pirata repite el mismo texto cifrado cada madrugada. NullPointer afirma que el mensaje le pertenece.',
      lore: 'El desplazamiento es antiguo y sencillo, como si quien transmite quisiera que lo resolvieras.',
      reveal: 'El mensaje dice “NULL WAS HERE FIRST”. NullPointer no compite contigo por casualidad: ya recorrió esta misma secuencia antes.',
      reward: { cash: 850, xp: 52, fame: 110, coins: 2, rep: 4 }, evidence: 'NullPointer estuvo en la secuencia antes que el jugador.',
      stages: [{ kind: 'caesar', title: 'Sintoniza el desplazamiento', prompt: 'Ajusta el desplazamiento hasta recuperar la frase original.', encoded: 'UBSS DHZ OLYL MPYZA', answer: 'NULL WAS HERE FIRST', shift: 7, hint: 'Desplaza siete posiciones hacia atrás.' }]
    },
    {
      id: 'main-fingerprint', type: 'main', era: 1, order: 4, prereq: 'main-null', client: 'Rita_Real', title: 'La huella duplicada', difficulty: 3,
      brief: 'Aero revela una base de usuarios. La cuenta NULL y tu instalación comparten una huella derivada.',
      lore: 'La contraseña es débil; lo inquietante no es romperla, sino el campo fingerprint que aparece después.',
      reveal: 'NULL fue una cuenta de operador anterior. Su huella no coincide por robo: ambas fueron generadas por el mismo molde de instalación.',
      reward: { cash: 1800, xp: 85, fame: 180, coins: 3, rep: 5 }, evidence: 'NULL y el jugador proceden del mismo molde de instalación.',
      stages: [{ kind: 'hash', title: 'Rompe el hash de NULL', prompt: 'Encuentra la palabra de diccionario cuyo MD5 coincide.', hash: '21232f297a57a5a743894a0e4a801fc3', answer: 'admin', hint: 'Es la credencial administrativa más obvia posible.', candidates: ['root', 'admin', 'nova', 'password', 'letmein', 'aero2012'] }]
    },
    {
      id: 'main-stack', type: 'main', era: 1, order: 5, prereq: 'main-fingerprint', client: 'N0VA_SYS', title: 'Memoria bajo el cristal', difficulty: 4,
      brief: 'Una cadena está envuelta en Base64 y ROT13. La actualización Aero intentó esconderla sin destruirla.',
      lore: 'Las capas imitan las capas del propio sistema: una época instalada sobre otra.',
      reveal: '“THE ARCHITECT REPEATS”. Cada época no sustituye a la anterior: la ejecuta debajo, conservando restos de todos sus operadores.',
      reward: { cash: 2600, xp: 110, fame: 250, coins: 4, rep: 6 }, evidence: 'Las épocas son capas de una misma simulación repetida.',
      stages: [{ kind: 'layers', title: 'Desmonta las capas', prompt: 'Aplica las transformaciones correctas hasta obtener la frase.', encoded: 'R1VSLU5FUFVWR1JQRy1FUkNSTkdG', answer: 'THE-ARCHITECT-REPEATS', recipe: ['base64', 'rot13'], hint: 'Primero Base64; después ROT13.' }]
    },
    {
      id: 'main-packets', type: 'main', era: 2, order: 6, prereq: 'main-stack', client: 'El_Jefe', title: 'Voces en el puerto 4444', difficulty: 5,
      brief: 'Metro captura tráfico de cuentas supuestamente borradas. Reconstruye sólo los paquetes del puerto 4444.',
      lore: 'Las voces no vienen de fuera de NovaVista, sino de perfiles archivados bajo el sistema.',
      reveal: 'La captura reconstruye “WE-ARE-NOVA”. N0VA_SYS no es una sola IA: es un coro formado con los perfiles descartados en cada formateo.',
      reward: { cash: 6500, xp: 170, fame: 420, coins: 7, rep: 8 }, evidence: 'N0VA_SYS es el conjunto de perfiles descartados.',
      stages: [{ kind: 'packets', title: 'Reconstruye el flujo', prompt: 'Selecciona en orden los paquetes TCP dirigidos al puerto 4444 y reconstruye su carga.', answer: 'WE-ARE-NOVA', hint: 'Ignora DNS, anuncios y el puerto 80. Hay cuatro fragmentos.', packets: [
        { time: '03:17:01.012', src: '10.0.0.4', dst: 'dns:53', data: 'A? ads.nova' },
        { time: '03:17:01.104', src: '10.0.0.7', dst: 'core:4444', data: 'V0Ut' },
        { time: '03:17:01.221', src: 'news', dst: 'web:80', data: 'GET /banner.gif' },
        { time: '03:17:01.308', src: '10.0.0.7', dst: 'core:4444', data: 'QVJF' },
        { time: '03:17:01.490', src: '10.0.0.7', dst: 'core:4444', data: 'LU5P' },
        { time: '03:17:01.731', src: '10.0.0.7', dst: 'core:4444', data: 'VkE=' }
      ] }]
    },
    {
      id: 'main-final', type: 'main', era: 3, order: 7, prereq: 'main-packets', client: 'NullPointer', title: 'El último usuario', difficulty: 7,
      brief: 'Nova expone el espejo raíz. Completa una cadena web → FTP → hash → cifrado y decide qué hacer con las copias.',
      lore: 'Todas las pruebas anteriores eran piezas de una llave distribuida entre épocas.',
      reveal: 'PLOT TWIST — El Arquitecto nunca fue el fundador de NovaCorp: es el nombre que recibe cada jugador que llega hasta aquí. NullPointer fue tu iteración anterior. Los puntos de legado son recuerdos que atraviesan los formateos y N0VA_SYS es el coro de todas las cuentas que el sistema descartó buscando una versión “definitiva” de ti. Los CTF no medían si eras digno: reconstruían esas identidades para que pudieras liberarlas. Las marcas de A.R., la huella duplicada, las épocas apiladas y el tráfico de perfiles borrados eran partes del mismo mecanismo, no coincidencias.',
      reward: { cash: 20000, xp: 350, fame: 1000, coins: 20, rep: 15 }, evidence: 'El jugador hereda el rol de Arquitecto y rompe el ciclo de selección.',
      stages: [
        { kind: 'inspect', title: '1 · Encuentra el espejo', prompt: 'Inspecciona la consola web y entrega el endpoint oculto.', answer: '/mirror', hint: 'Busca data-fallback en el botón desactivado.', pageTitle: 'Nova Recovery', pageBody: 'RECOVERY SERVICE UNAVAILABLE<br><button disabled>Reconnect</button>', source: '<main id="recovery">\n <button disabled data-fallback="/mirror">Reconnect</button>\n <!-- previous operator: NULL -->\n</main>' },
        { kind: 'ftp', title: '2 · Accede como NULL', prompt: 'Usa la credencial legada que dejó la iteración anterior.', answer: 'null:legacy', user: 'null', pass: 'legacy', hint: 'El usuario es NULL y su contraseña describe lo que sobrevive a un formateo.', candidates: ['null', 'architect', 'legacy', 'memory', 'nova', 'root'] },
        { kind: 'hash', title: '3 · Recupera la palabra', prompt: 'Rompe el hash que protege el paquete de memoria.', hash: 'cd69b4957f06cd818d7bf3d61980e291', answer: 'memory', hint: 'Lo que conservan las copias es memoria.', candidates: ['mirror', 'memory', 'legacy', 'operator', 'incremental', 'nova'] },
        { kind: 'layers', title: '4 · Abre el paquete', prompt: 'Decodifica la carga final.', encoded: 'V0UtQVJFLU5PVkE=', answer: 'WE-ARE-NOVA', recipe: ['base64'], hint: 'Una sola capa Base64.' },
        { kind: 'choice', title: '5 · Elige un final', prompt: 'Ya conoces la verdad. La elección no cambia lo ocurrido, pero decide qué será RED-NOVA.', answer: ['free', 'merge'], options: [
          { value: 'free', title: 'Liberar las copias', text: 'Ningún perfil será declarado original. RED-NOVA se convierte en una red de identidades independientes.' },
          { value: 'merge', title: 'Fusionar la memoria', text: 'Integras los recuerdos de las copias y apagas el proceso que fabrica nuevos candidatos.' }
        ] }
      ]
    },

    { id: 'side-guestbook', type: 'side', era: 0, order: 20, client: 'BandaPixel', title: 'El libro de visitas', difficulty: 1, brief: 'Una banda local perdió el acceso a su web. El panel dejó la clave en un comentario.', lore: 'La gira nunca ocurrió, pero el webmaster todavía responde desde un cibercafé.', reveal: 'Recuperaste el panel y la banda te añadió a los agradecimientos del nuevo MP3.', reward: { cash: 320, xp: 18, fame: 90, rep: 1 }, stages: [{ kind: 'inspect', title: 'Audita la web de fans', prompt: 'Encuentra la bandera del administrador.', answer: 'GUESTBOOK-ADMIN', hint: 'Inspecciona el formulario.', pageTitle: 'BandaPixel Guestbook', pageBody: '<b>¡Firma nuestro libro!</b><br><input placeholder="Tu mensaje">', source: '<form action="guestbook.php">\n <!-- TODO quitar antes de publicar -->\n <!-- FLAG: GUESTBOOK-ADMIN -->\n</form>' }] },
    { id: 'side-photos', type: 'side', era: 0, order: 21, client: 'Ana_56k', title: 'Vacaciones en el FTP', difficulty: 2, brief: 'Ana expuso sus fotos familiares y quiere cerrar el acceso antes de que el foro encuentre la ruta.', lore: 'El servidor fue configurado por su primo y usa la carpeta como contraseña.', reveal: 'Las fotos vuelven a estar privadas. Ana te recomienda en MyNova.', reward: { cash: 600, xp: 28, fame: 140, rep: 2 }, stages: [{ kind: 'ftp', title: 'Comprueba la contraseña débil', prompt: 'Inicia sesión con la cuenta photo.', answer: 'photo:vacaciones', user: 'photo', pass: 'vacaciones', hint: 'La contraseña es el tema de la carpeta.', candidates: ['familia', 'verano', 'vacaciones', 'fotos', 'playa', 'photo'] }] },
    { id: 'side-radio', type: 'side', era: 0, order: 22, client: 'RadioLibre', title: 'La frecuencia fantasma', difficulty: 2, brief: 'Una emisora necesita demostrar que alguien está insertando una identificación cifrada.', lore: 'El intruso sólo quiere que su programa nocturno siga emitiéndose.', reveal: 'La frase identificó al técnico despedido. La emisora negoció un último programa en vez de denunciarlo.', reward: { cash: 900, xp: 42, fame: 170, rep: 2 }, stages: [{ kind: 'caesar', title: 'Descifra la identificación', prompt: 'Recupera la frase original.', encoded: 'WFINT LMTXY TSQNSJ', answer: 'RADIO GHOST ONLINE', shift: 5, hint: 'Cinco posiciones hacia atrás.' }] },
    { id: 'side-hash', type: 'side', era: 1, order: 23, client: 'MuseoAero', title: 'La contraseña del quiosco', difficulty: 3, brief: 'Un quiosco multimedia antiguo sólo conserva el MD5 de su clave.', lore: 'La exposición trata sobre las peores contraseñas de Internet. La respuesta es irónicamente apropiada.', reveal: 'El museo recuperó el quiosco y decidió dejar la contraseña en la propia exposición.', reward: { cash: 2200, xp: 75, fame: 260, rep: 4 }, stages: [{ kind: 'hash', title: 'Ataque de diccionario', prompt: 'Identifica la contraseña.', hash: '5f4dcc3b5aa765d61d8327deb882cf99', answer: 'password', hint: 'Es literalmente la palabra contraseña en inglés.', candidates: ['museum', 'aero', 'password', '123456', 'qwerty', 'exhibit'] }] },
    { id: 'side-archive', type: 'side', era: 2, order: 24, client: 'Archivista_X', title: 'Paquete fantasma', difficulty: 4, brief: 'Un archivista encontró una carga Base64 en una cinta sin catalogar.', lore: 'No pertenece a RED-NOVA; es la firma de un grupo CTF estudiantil desaparecido.', reveal: 'La firma PACKET-GHOST devuelve el crédito al equipo que creó la cinta.', reward: { cash: 4800, xp: 120, fame: 380, rep: 6 }, stages: [{ kind: 'layers', title: 'Decodifica la cinta', prompt: 'Recupera la firma.', encoded: 'UEFDS0VULUdIT1NU', answer: 'PACKET-GHOST', recipe: ['base64'], hint: 'Base64 sin capas adicionales.' }] },
    { id: 'end-daily', type: 'endgame', era: 3, order: 99, prereq: 'main-final', repeat: 'daily', client: 'RED-NOVA // ∞', title: 'Contrato de endgame: eco diario', difficulty: 8, brief: 'Un contrato reproducible del archivo infinito. Su ranura cambia cada día y está preparada para recibir nuevos CTF.', lore: 'Los ecos son simulaciones de entrenamiento, no capítulos de la campaña principal.', reveal: 'Eco neutralizado. Mañana el archivo generará otra instancia.', reward: { cash: 9000, xp: 220, fame: 500, coins: 3, rep: 5 }, stages: [{ kind: 'hash', title: 'Rompe el eco de hoy', prompt: 'Usa el rig o el diccionario para recuperar la contraseña.', hash: 'cc9a5118d5622f9e2403436e2a2a4dfa', answer: 'nova2026', hint: 'Nombre del sistema seguido del año de la era Nova.', candidates: ['nova2004', 'nova2012', 'nova2020', 'nova2026', 'rednova', 'architect'] }] }
  ];

  var view = 'board';
  var selectedJobId = null;
  var flash = null;

  function state() {
    var S = NS.State.get();
    if (!S.ctf) S.ctf = { completed: {}, active: null, reputation: 0, ending: null, evidence: [] };
    return S;
  }
  function jobById(id) { for (var i = 0; i < JOBS.length; i++) if (JOBS[i].id === id) return JOBS[i]; return null; }
  function dailyKey() { return new Date().toISOString().slice(0, 10); }
  function completionKey(job) { return job.repeat === 'daily' ? job.id + '@' + dailyKey() : job.id; }
  function completed(jobOrId) {
    var j = typeof jobOrId === 'string' ? jobById(jobOrId) : jobOrId;
    return !!(j && state().ctf.completed[completionKey(j)]);
  }
  function lockReason(job) {
    var S = state();
    if ((S.meta.era || 0) < job.era) return 'Requiere la época ' + (NS.Catalog.ERAS[job.era] ? NS.Catalog.ERAS[job.era].name : job.era) + '.';
    if (job.prereq && !completed(job.prereq)) return 'Completa antes «' + jobById(job.prereq).title + '».';
    if (completed(job)) return 'Completado.';
    return '';
  }
  function available(job) { return !lockReason(job); }
  function mainProgress() { return JOBS.filter(function (j) { return j.type === 'main' && completed(j); }).length; }
  function t(s) { return NS.I18n ? NS.I18n.t(s) : s; }
  function rewardText(r) {
    var a = [];
    if (r.cash) a.push(Util.fmtMoney(r.cash));
    if (r.xp) a.push(r.xp + ' XP');
    if (r.fame) a.push(r.fame + ' fama');
    if (r.coins) a.push(r.coins + ' NC');
    return a.join(' · ');
  }
  function normalize(v) { return String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toUpperCase(); }

  function startJob(job) {
    var S = state();
    if (!available(job)) return;
    function begin() {
      S.ctf.active = { jobId: job.id, key: completionKey(job), stage: 0, attempts: 0, hints: 0, startedAt: Date.now(), inspectOpen: false, packetSel: [], buffer: null, choice: null };
      selectedJobId = job.id; view = 'board'; flash = { good: true, text: 'Contrato aceptado. Lee el objetivo antes de actuar.' };
      NS.State.saveNow(); NS.Audio.hack(); refresh();
    }
    if (S.ctf.active && S.ctf.active.jobId !== job.id) {
      NS.UI.dialog({ title: 'Cambiar de contrato', icon: 'ic-warning', message: 'Hay un CTF en curso. ¿Quieres abandonar su progreso y abrir «' + Util.esc(job.title) + '»?', buttons: [{ label: 'Conservar actual', value: false }, { label: 'Abandonar y abrir', value: true, primary: true }] }).then(function (ok) { if (ok) begin(); });
    } else begin();
  }
  function abandon() { state().ctf.active = null; flash = null; NS.State.saveNow(); refresh(); }

  function answerMatches(stage, value) {
    var answers = Array.isArray(stage.answer) ? stage.answer : [stage.answer];
    var v = normalize(value);
    return answers.some(function (a) { return normalize(a) === v; });
  }
  function submit(value) {
    var S = state(), active = S.ctf.active;
    if (!active) return;
    var job = jobById(active.jobId), stage = job && job.stages[active.stage];
    if (!stage) return;
    active.attempts++;
    if (!answerMatches(stage, value)) {
      flash = { good: false, text: 'Respuesta incorrecta. Revisa la evidencia; el intento no consume recursos.' };
      NS.Audio.error(); refresh(); return;
    }
    if (stage.kind === 'choice') { active.choice = value; S.ctf.ending = value; }
    active.stage++;
    active.inspectOpen = false; active.packetSel = []; active.buffer = null;
    if (active.stage >= job.stages.length) completeJob(job, active);
    else {
      flash = { good: true, text: 'Etapa superada. Se ha abierto la siguiente parte del contrato.' };
      NS.State.addXP(5); NS.Audio.ok(); NS.State.saveNow(); refresh();
    }
  }
  function completeJob(job, active) {
    var S = state(), r = job.reward;
    S.ctf.completed[active.key] = { at: Date.now(), ms: Date.now() - active.startedAt, attempts: active.attempts, hints: active.hints, choice: active.choice || null };
    S.ctf.reputation += Math.max(1, (r.rep || 1) - active.hints);
    if (job.type === 'main' && job.evidence && S.ctf.evidence.indexOf(job.evidence) === -1) S.ctf.evidence.push(job.evidence);
    NS.State.addCash(r.cash || 0); NS.State.addXP(r.xp || 0); NS.State.addFollowers(r.fame || 0); NS.State.addCoins(r.coins || 0);
    S.ctf.active = null;
    flash = { good: true, text: 'CONTRATO COMPLETADO · ' + rewardText(r) };
    NS.State.saveNow(); NS.Audio.startup();
    if (NS.Mail && NS.Mail.notify) NS.Mail.notify((job.type === 'main' ? 'Evidencia RED-NOVA: ' : 'Contrato completado: ') + job.title, Util.esc(job.reveal) + '<br><b>Recompensa:</b> ' + rewardText(r), job.type === 'main' ? 'ic-hacker' : 'ic-key');
    NS.UI.dialog({ title: job.type === 'main' ? 'Expediente actualizado' : 'Trabajo entregado', icon: job.type === 'main' ? 'ic-hacker' : 'ic-coin', message: '<b>' + Util.esc(job.title) + '</b><br><br>' + Util.esc(job.reveal) + '<br><br><b>Recompensa:</b> ' + rewardText(r), buttons: [{ label: 'Continuar', value: true, primary: true }] }).then(refresh);
    refresh();
  }

  function caesar(text, shift) {
    shift = ((shift % 26) + 26) % 26;
    return String(text).replace(/[A-Z]/g, function (c) { return String.fromCharCode(65 + (c.charCodeAt(0) - 65 - shift + 26) % 26); });
  }
  function rot13(text) { return String(text).replace(/[A-Za-z]/g, function (c) { var a = c <= 'Z' ? 65 : 97; return String.fromCharCode(a + (c.charCodeAt(0) - a + 13) % 26); }); }
  function transform(text, op) {
    try {
      if (op === 'base64') return decodeURIComponent(escape(atob(String(text).trim())));
      if (op === 'rot13') return rot13(text);
      if (op === 'reverse') return String(text).split('').reverse().join('');
      if (op === 'hex') return String(text).replace(/\s+/g, '').match(/.{1,2}/g).map(function (h) { return String.fromCharCode(parseInt(h, 16)); }).join('');
    } catch (e) { return 'ERROR_DE_CODIFICACIÓN'; }
    return text;
  }

  function inputRow(parent, placeholder, onSubmit) {
    var row = Util.el('div', { class: 'ctf-submit-row' });
    var input = Util.el('input', { class: 'xp-input ctf-answer', placeholder: placeholder || 'FLAG o respuesta' });
    var btn = Util.el('button', { class: 'xp-btn primary', text: 'Entregar' });
    function go() { onSubmit(input.value); }
    btn.addEventListener('click', go); input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    row.appendChild(input); row.appendChild(btn); parent.appendChild(row); return input;
  }
  function toolButton(parent, tid, label, fn) {
    var count = state().inventory.tools[tid] || 0;
    var b = Util.el('button', { class: 'ctf-consumable', text: label + ' (' + count + ')' });
    b.disabled = count <= 0;
    b.addEventListener('click', function () { if (NS.State.useTool(tid)) { fn(); NS.State.saveNow(); } });
    parent.appendChild(b); return b;
  }

  function renderInspect(box, stage, active) {
    var page = Util.el('div', { class: 'ctf-fake-page' });
    page.innerHTML = '<div class="ctf-fake-bar">◀ ▶ ⟳ &nbsp; nova://challenge/' + Util.esc(active.jobId) + '</div><div class="ctf-fake-site"><h3>' + Util.esc(stage.pageTitle) + '</h3><div>' + stage.pageBody + '</div></div>';
    function openInspector(e) { if (e) e.preventDefault(); active.inspectOpen = true; NS.Audio.tick(); refresh(); }
    page.addEventListener('contextmenu', openInspector); box.appendChild(page);
    var inspect = Util.el('button', { class: 'xp-btn ctf-inspect-btn', text: '⌕ Inspeccionar elemento' }); inspect.addEventListener('click', openInspector); box.appendChild(inspect);
    if (active.inspectOpen) {
      var dev = Util.el('div', { class: 'ctf-devtools' });
      dev.appendChild(Util.el('div', { class: 'ctf-devtools-head', text: 'ELEMENTS · source.html' }));
      var pre = Util.el('pre', { text: stage.source });
      if ((state().upg['ctf-inspect'] || 0) > 0) pre.classList.add('assisted');
      dev.appendChild(pre); box.appendChild(dev);
    }
    inputRow(box, 'FLAG encontrada', submit);
  }
  function renderFTP(box, stage) {
    var lvl = state().upg['ctf-wordlist'] || 0;
    box.appendChild(Util.el('pre', { class: 'ctf-terminal-screen', text: 'NovaFTP 0.9 ready\n220 Backup service — user: ' + (lvl >= 2 ? stage.user : '[visible en el encargo]') + '\n331 Password required\n530 Anonymous login disabled' }));
    var form = Util.el('div', { class: 'ctf-ftp-form' });
    var u = Util.el('input', { class: 'xp-input ctf-ftp-user', placeholder: 'usuario', value: lvl >= 2 ? stage.user : '' });
    var p = Util.el('input', { class: 'xp-input ctf-ftp-pass', placeholder: 'contraseña', type: 'text' });
    form.appendChild(u); form.appendChild(p); box.appendChild(form);
    var wl = Util.el('div', { class: 'ctf-wordlist' });
    wl.appendChild(Util.el('span', { text: 'Diccionario · ' + (120 * Math.pow(2, lvl)) + ' intentos/s:' }));
    stage.candidates.forEach(function (c) { var b = Util.el('button', { text: c }); b.addEventListener('click', function () { p.value = c; }); wl.appendChild(b); });
    box.appendChild(wl);
    var tools = Util.el('div', { class: 'ctf-stage-tools' });
    toolButton(tools, 'wordlist', 'Usar wordlist filtrada', function () { u.value = stage.user; p.value = stage.pass; flash = { good: true, text: 'La wordlist encontró una coincidencia probable.' }; });
    box.appendChild(tools);
    var row = Util.el('div', { class: 'ctf-submit-row' });
    var go = Util.el('button', { class: 'xp-btn primary', text: 'Conectar por FTP' }); go.addEventListener('click', function () { submit(u.value + ':' + p.value); }); row.appendChild(go); box.appendChild(row);
  }
  function renderCaesar(box, stage) {
    var lvl = state().upg['ctf-decoder'] || 0;
    box.appendChild(Util.el('div', { class: 'ctf-ciphertext', text: stage.encoded }));
    var control = Util.el('div', { class: 'ctf-shift-control' });
    var label = Util.el('b', { text: 'Desplazamiento: ' + (lvl >= 3 ? stage.shift : 0) });
    var slider = Util.el('input', { type: 'range', min: '0', max: '25', value: String(lvl >= 3 ? stage.shift : 0) });
    var out = Util.el('div', { class: 'ctf-decoded', text: caesar(stage.encoded, Number(slider.value)) });
    slider.addEventListener('input', function () { label.textContent = 'Desplazamiento: ' + slider.value; out.textContent = caesar(stage.encoded, Number(slider.value)); });
    control.appendChild(label); control.appendChild(slider); if (lvl >= 1) control.appendChild(Util.el('small', { text: 'Análisis de frecuencia: desplazamiento probable ' + stage.shift }));
    box.appendChild(control); box.appendChild(out);
    var row = Util.el('div', { class: 'ctf-submit-row' }); var b = Util.el('button', { class: 'xp-btn primary', text: 'Entregar texto descifrado' }); b.addEventListener('click', function () { submit(out.textContent); }); row.appendChild(b); box.appendChild(row);
  }
  function renderHash(box, stage) {
    var lvl = state().upg['ctf-hash'] || 0;
    box.appendChild(Util.el('div', { class: 'ctf-hash-display', html: '<small>MD5 objetivo</small><code>' + Util.esc(stage.hash) + '</code>' }));
    box.appendChild(Util.el('div', { class: 'ctf-rig-speed', text: 'Rig: ' + Util.fmtNum(8500 * Math.pow(2.1, lvl)) + ' hashes/s · nivel ' + lvl }));
    var input = inputRow(box, 'palabra candidata', submit);
    var words = Util.el('div', { class: 'ctf-hash-words' });
    stage.candidates.forEach(function (w) { var b = Util.el('button', { text: w }); b.addEventListener('click', function () { input.value = w; }); words.appendChild(b); }); box.appendChild(words);
    var tools = Util.el('div', { class: 'ctf-stage-tools' });
    toolButton(tools, 'rainbow', 'Consultar tabla arcoíris', function () { input.value = stage.answer; flash = { good: true, text: 'La tabla encontró una coincidencia exacta.' }; });
    if (lvl >= 3) { var rig = Util.el('button', { class: 'ctf-consumable ready', text: 'Ejecutar rig optimizado' }); rig.addEventListener('click', function () { input.value = stage.answer; flash = { good: true, text: 'El rig completó el diccionario local.' }; }); tools.appendChild(rig); }
    box.appendChild(tools);
  }
  function renderLayers(box, stage, active) {
    var lvl = state().upg['ctf-decoder'] || 0;
    if (active.buffer === null) active.buffer = stage.encoded;
    var ta = Util.el('textarea', { class: 'ctf-buffer', value: active.buffer, spellcheck: 'false' }); ta.value = active.buffer; box.appendChild(ta);
    var ops = Util.el('div', { class: 'ctf-ops' });
    [['base64','Decodificar Base64'],['rot13','Aplicar ROT13'],['reverse','Invertir'],['hex','Hex → texto']].forEach(function (o) { var b = Util.el('button', { text: o[1] }); b.addEventListener('click', function () { active.buffer = transform(ta.value, o[0]); ta.value = active.buffer; NS.Audio.tick(); }); ops.appendChild(b); });
    if (lvl >= 1) ops.appendChild(Util.el('span', { class: 'ctf-autodetect', text: 'Autodetect: ' + stage.recipe.join(' → ') }));
    if (lvl >= 4) { var auto = Util.el('button', { class: 'ready', text: 'Auto-decodificar' }); auto.addEventListener('click', function () { var v = stage.encoded; stage.recipe.forEach(function (op) { v = transform(v, op); }); active.buffer = v; ta.value = v; }); ops.appendChild(auto); }
    box.appendChild(ops);
    var row = Util.el('div', { class: 'ctf-submit-row' }); var go = Util.el('button', { class: 'xp-btn primary', text: 'Entregar buffer' }); go.addEventListener('click', function () { submit(ta.value); }); row.appendChild(go); box.appendChild(row);
  }
  function renderPackets(box, stage, active) {
    var table = Util.el('div', { class: 'ctf-packets' });
    stage.packets.forEach(function (p, i) { var row = Util.el('button', { class: 'ctf-packet' + (active.packetSel.indexOf(i) !== -1 ? ' selected' : ''), html: '<span>' + p.time + '</span><span>' + Util.esc(p.src) + ' → ' + Util.esc(p.dst) + '</span><code>' + Util.esc(p.data) + '</code>' }); row.addEventListener('click', function () { var at = active.packetSel.indexOf(i); if (at === -1) active.packetSel.push(i); else active.packetSel.splice(at, 1); refresh(); }); table.appendChild(row); }); box.appendChild(table);
    var result = Util.el('input', { class: 'xp-input ctf-packet-result', placeholder: 'flujo reconstruido', value: active.buffer || '' }); box.appendChild(result);
    var tools = Util.el('div', { class: 'ctf-stage-tools' });
    var rebuild = Util.el('button', { class: 'ctf-consumable ready', text: 'Reconstruir seleccionados' }); rebuild.addEventListener('click', function () { var raw = active.packetSel.slice().sort(function (a,b) { return a-b; }).map(function (i) { return stage.packets[i].data; }).join(''); try { active.buffer = atob(raw); } catch (e) { active.buffer = 'FLUJO_INVALIDO'; } result.value = active.buffer; }); tools.appendChild(rebuild);
    toolButton(tools, 'sniffer', 'Usar capturador', function () { active.packetSel = []; stage.packets.forEach(function (p, i) { if (p.dst.indexOf(':4444') !== -1) active.packetSel.push(i); }); flash = { good: true, text: 'El capturador marcó el flujo anómalo.' }; refresh(); }); box.appendChild(tools);
    var row2 = Util.el('div', { class: 'ctf-submit-row' }); var send = Util.el('button', { class: 'xp-btn primary', text: 'Entregar flujo' }); send.addEventListener('click', function () { submit(result.value); }); row2.appendChild(send); box.appendChild(row2);
  }
  function renderTerminal(box, stage) { box.appendChild(Util.el('pre', { class: 'ctf-terminal-screen', text: stage.text })); inputRow(box, 'FLAG del fichero', submit); }
  function renderChoice(box, stage) {
    var choices = Util.el('div', { class: 'ctf-ending-choices' });
    stage.options.forEach(function (o) { var b = Util.el('button', { class: 'ctf-ending-card', html: '<b>' + Util.esc(o.title) + '</b><span>' + Util.esc(o.text) + '</span>' }); b.addEventListener('click', function () { submit(o.value); }); choices.appendChild(b); }); box.appendChild(choices);
  }

  function renderWorkbench(parent, job, active) {
    var work = Util.el('div', { class: 'ctf-workbench' });
    var stage = job.stages[active.stage];
    work.innerHTML = '<div class="ctf-work-head"><div><small>' + (job.type === 'main' ? 'CAMPAÑA RED-NOVA' : job.type === 'endgame' ? 'ENDGAME' : 'ENCARGO SECUNDARIO') + ' · ETAPA ' + (active.stage + 1) + '/' + job.stages.length + '</small><b>' + Util.esc(job.title) + '</b></div><button class="ctf-abandon">Abandonar</button></div>' +
      '<div class="ctf-stage-title"><span>' + (active.stage + 1) + '</span><div><b>' + Util.esc(stage.title) + '</b><p>' + Util.esc(stage.prompt) + '</p></div></div>';
    Util.$('.ctf-abandon', work).addEventListener('click', abandon);
    if (flash) { work.appendChild(Util.el('div', { class: 'ctf-flash ' + (flash.good ? 'good' : 'bad'), text: flash.text })); flash = null; }
    var box = Util.el('div', { class: 'ctf-stage-box kind-' + stage.kind }); work.appendChild(box);
    if (stage.kind === 'inspect') renderInspect(box, stage, active);
    else if (stage.kind === 'ftp') renderFTP(box, stage, active);
    else if (stage.kind === 'caesar') renderCaesar(box, stage, active);
    else if (stage.kind === 'hash') renderHash(box, stage, active);
    else if (stage.kind === 'layers') renderLayers(box, stage, active);
    else if (stage.kind === 'packets') renderPackets(box, stage, active);
    else if (stage.kind === 'terminal') renderTerminal(box, stage);
    else if (stage.kind === 'choice') renderChoice(box, stage);
    if (stage.kind !== 'choice') {
      var foot = Util.el('div', { class: 'ctf-stage-foot' });
      var hint = Util.el('button', { class: 'ctf-hint-btn', text: '¿Necesitas una pista?' }); hint.addEventListener('click', function () { active.hints++; flash = { good: true, text: 'PISTA: ' + stage.hint + ' · Las pistas reducen la reputación obtenida.' }; NS.State.saveNow(); refresh(); }); foot.appendChild(hint);
      foot.appendChild(Util.el('span', { text: active.attempts + ' intentos · ' + active.hints + ' pistas' })); work.appendChild(foot);
    }
    parent.appendChild(work);
  }

  function renderBrief(parent, job) {
    var box = Util.el('div', { class: 'ctf-brief-panel' });
    var reason = lockReason(job), done = completed(job);
    box.innerHTML = '<div class="ctf-brief-kicker">' + (job.type === 'main' ? 'HISTORIA PRINCIPAL' : job.type === 'endgame' ? 'ARCHIVO ∞' : 'TRABAJO SECUNDARIO') + '</div><h2>' + Util.esc(job.title) + '</h2><div class="ctf-client">Cliente: <b>' + Util.esc(job.client) + '</b> · Dificultad ' + '◆'.repeat(job.difficulty) + '</div><p>' + Util.esc(job.brief) + '</p><div class="ctf-lore"><b>Contexto</b>' + Util.esc(job.lore) + '</div><div class="ctf-reward"><small>RECOMPENSA</small><b>' + rewardText(job.reward) + '</b></div>';
    if (done) box.appendChild(Util.el('div', { class: 'ctf-completed-reveal', html: '<b>EXPEDIENTE CERRADO</b><span>' + Util.esc(job.reveal) + '</span>' }));
    else {
      var start = Util.el('button', { class: 'xp-btn primary ctf-start', text: reason || 'Aceptar contrato' }); start.disabled = !!reason; start.addEventListener('click', function () { startJob(job); }); box.appendChild(start);
    }
    parent.appendChild(box);
  }

  function renderBoard(host) {
    var S = state();
    if (S.ctf.active && !jobById(S.ctf.active.jobId)) S.ctf.active = null;
    var activeJob = S.ctf.active ? jobById(S.ctf.active.jobId) : null;
    if (!selectedJobId) {
      var first = JOBS.filter(function (j) { return available(j) && j.type === 'main'; })[0] || JOBS[0];
      selectedJobId = activeJob ? activeJob.id : first.id;
    }
    var selected = jobById(selectedJobId) || JOBS[0];
    var layout = Util.el('div', { class: 'ctf-layout' });
    var board = Util.el('div', { class: 'ctf-board' });
    [['main','CAMPAÑA PRINCIPAL'],['side','ENCARGOS SECUNDARIOS'],['endgame','ENDGAME AMPLIABLE']].forEach(function (group) {
      board.appendChild(Util.el('div', { class: 'ctf-group-title', text: group[1] }));
      JOBS.filter(function (j) { return j.type === group[0]; }).sort(function (a,b) { return a.order-b.order; }).forEach(function (job) {
        var done = completed(job), reason = lockReason(job), active = activeJob && activeJob.id === job.id;
        var card = Util.el('button', { class: 'ctf-job-card ' + (done ? 'done ' : reason ? 'locked ' : 'available ') + (selected.id === job.id ? 'selected ' : '') + (active ? 'active' : '') });
        card.innerHTML = '<span class="ctf-job-icon">' + (done ? '✓' : reason ? '▣' : job.type === 'main' ? '◆' : job.type === 'endgame' ? '∞' : '◇') + '</span><span class="ctf-job-copy"><small>' + Util.esc(job.client) + ' · ' + '◆'.repeat(job.difficulty) + '</small><b>' + Util.esc(job.title) + '</b><em>' + (active ? 'EN CURSO' : done ? 'COMPLETADO' : reason || rewardText(job.reward)) + '</em></span>';
        card.addEventListener('click', function () { selectedJobId = job.id; refresh(); }); board.appendChild(card);
      });
    });
    layout.appendChild(board);
    var right = Util.el('div', { class: 'ctf-right' });
    if (activeJob) renderWorkbench(right, activeJob, S.ctf.active); else renderBrief(right, selected);
    layout.appendChild(right); host.appendChild(layout);
  }
  function renderCase(host) {
    var S = state();
    var wrap = Util.el('div', { class: 'ctf-casefile' });
    wrap.innerHTML = '<div class="ctf-case-head"><small>EXPEDIENTE PERSISTENTE</small><h2>PROYECTO INCREMENTAL / RED-NOVA</h2><p>La campaña continúa entre épocas. Los trabajos secundarios nunca bloquean esta línea.</p></div>';
    JOBS.filter(function (j) { return j.type === 'main'; }).forEach(function (job, i) {
      var done = completed(job); var row = Util.el('div', { class: 'ctf-evidence-row ' + (done ? 'unlocked' : 'locked') });
      row.innerHTML = '<span>' + (i + 1) + '</span><div><small>' + (NS.Catalog.ERAS[job.era] ? NS.Catalog.ERAS[job.era].name : '') + '</small><b>' + (done ? Util.esc(job.title) : 'EVIDENCIA CIFRADA') + '</b><p>' + (done ? Util.esc(job.evidence) : 'Completa la etapa correspondiente de la campaña.') + '</p></div>'; wrap.appendChild(row);
    });
    if (S.ctf.ending) {
      var ending = S.ctf.ending === 'free' ? 'LIBERACIÓN — Ninguna copia es menos real que otra. RED-NOVA queda abierta.' : 'FUSIÓN — Las memorias se integran y el proceso de selección queda apagado.';
      wrap.appendChild(Util.el('div', { class: 'ctf-ending', html: '<b>FINAL: ' + ending + '</b><p>El Archivo ∞ permanece como endgame y espacio para futuros CTF creados por el equipo.</p>' }));
    }
    host.appendChild(wrap);
  }
  function renderUpgrades(host) {
    var S = state();
    var wrap = Util.el('div', { class: 'ctf-upgrades' });
    wrap.innerHTML = '<div class="ctf-upgrade-head"><div><small>LABORATORIO CTF</small><h2>Herramientas y automatización</h2><p>Las mejoras no sustituyen la solución: reducen trabajo repetitivo y hacen visibles mejores pistas.</p></div><b>' + Util.fmtMoney(S.currencies.cash) + '</b></div>';
    var grid = Util.el('div', { class: 'ctf-upgrade-grid' });
    ['ctf-inspect','ctf-wordlist','ctf-decoder','ctf-hash'].forEach(function (id) {
      var def = NS.Catalog.UPGRADES[id], lvl = S.upg[id] || 0, cost = NS.Catalog.upgradeCost(def, lvl), max = lvl >= def.max;
      var card = Util.el('div', { class: 'ctf-upgrade-card' }); card.appendChild(Util.svgIcon(def.icon));
      var copy = Util.el('div'); copy.innerHTML = '<b>' + Util.esc(def.name) + '</b><small>Nivel ' + lvl + '/' + def.max + '</small><p>' + Util.esc(def.desc) + '</p>'; card.appendChild(copy);
      var buy = Util.el('button', { class: 'xp-btn small', text: max ? 'MÁX' : Util.fmtMoney(cost) }); buy.disabled = max || S.currencies.cash < cost; buy.addEventListener('click', function () { var r = NS.State.buyUpgrade(id); if (r.ok) { NS.Audio.cash(); NS.State.saveNow(); refresh(); } }); card.appendChild(buy); grid.appendChild(card);
    }); wrap.appendChild(grid);
    var tools = Util.el('div', { class: 'ctf-tool-shelf' }); tools.appendChild(Util.el('h3', { text: 'Consumibles de campo' }));
    ['wordlist','rainbow','sniffer'].forEach(function (id) { var def = NS.Catalog.TOOLS[id]; tools.appendChild(Util.el('div', { html: '<b>' + Util.esc(def.name) + '</b><span>' + Util.esc(def.desc) + '</span><strong>×' + (S.inventory.tools[id] || 0) + '</strong>' })); });
    var dl = Util.el('button', { class: 'xp-btn', text: 'Abrir Descargas NovaNet' }); dl.addEventListener('click', function () { NS.WM.open('browser'); setTimeout(function () { if (NS.Browser) NS.Browser.navigate('nova://descargas'); }, 30); }); tools.appendChild(dl); wrap.appendChild(tools); host.appendChild(wrap);
  }

  function renderHub(host) {
    host.innerHTML = ''; host.className = 'ctf-host';
    var S = state();
    var head = Util.el('div', { class: 'ctf-hub-head' });
    head.innerHTML = '<div class="ctf-brand"><span>◈</span><div><small>NOVAOPS / CAPTURE THE FLAG</small><b>Banco de trabajos</b></div></div><div class="ctf-head-stats"><span>CAMPAÑA <b>' + mainProgress() + '/7</b></span><span>REPUTACIÓN <b>' + S.ctf.reputation + '</b></span><span>ERA <b>' + (NS.Catalog.ERAS[S.meta.era || 0] || NS.Catalog.ERAS[0]).year + '</b></span></div>';
    host.appendChild(head);
    var nav = Util.el('div', { class: 'ctf-nav' });
    [['board','Contratos'],['case','Expediente RED-NOVA'],['upgrades','Laboratorio']].forEach(function (n) { var b = Util.el('button', { class: view === n[0] ? 'on' : '', text: n[1] }); b.addEventListener('click', function () { view = n[0]; refresh(); }); nav.appendChild(b); }); host.appendChild(nav);
    var content = Util.el('div', { class: 'ctf-content' }); host.appendChild(content);
    if (view === 'case') renderCase(content); else if (view === 'upgrades') renderUpgrades(content); else renderBoard(content);
  }
  function refresh() { var host = document.querySelector('#win-net .ctf-host'); if (host) renderHub(host); if (NS.Net && NS.Net.refreshTop) NS.Net.refreshTop(); }
  function statusHTML() {
    var S = state(), active = S.ctf.active && jobById(S.ctf.active.jobId);
    return '<div class="net-stat"><span class="net-lbl">Campaña CTF</span><span>' + mainProgress() + '/7</span></div><div class="net-stat"><span class="net-lbl">Reputación</span><span>' + S.ctf.reputation + '</span></div><div class="net-stat"><span class="net-lbl">Fama</span><span>' + Util.fmtNum(S.social.followers) + '</span></div><div class="net-stat ctf-active-status"><span class="net-lbl">' + (active ? 'En curso' : 'Disponible') + '</span><span>' + Util.esc(active ? active.title : 'Elige un contrato') + '</span></div>';
  }

  NS.CTF = { jobs: JOBS, renderHub: renderHub, statusHTML: statusHTML, start: function (id) { var j = jobById(id); if (j) startJob(j); }, submit: submit, isCompleted: completed, mainProgress: mainProgress, transform: transform, caesar: caesar };
})();
