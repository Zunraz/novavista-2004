/* ============================================================
   NovaVista 2004 — Manual de usuario (tutorial de inicio)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  function h2(t) { return '<div class="manual-h2">' + Util.esc(t) + '</div>'; }
  function p(html) { return '<div class="manual-p">' + html + '</div>'; }
  function tip(html) { return '<div class="manual-tip"><b>CONSEJO:</b> ' + html + '</div>'; }
  function warn(html) { return '<div class="manual-warn"><b>AVISO:</b> ' + html + '</div>'; }

  function render(body) {
    body.innerHTML = '';
    body.className = 'manual-wrap';
    var s = NS.State.get();
    if (NS.I18n && NS.I18n.get() === 'en') {
      body.innerHTML = '<div class="manual-title">NovaVista 2004 Manual</div>' +
        '<div class="manual-sub">Your PC is your investigation desk. This guide covers CTF contracts, progression, eras, and every optional activity. · User: ' + Util.esc(s.profile.name) + '</div>' +
        '<div class="manual-h2">1 · Your first five actions</div><ol class="manual-steps">' +
        '<li>Open <b>NovaOps</b>, accept “The page that does not exist,” and read its exact objective.</li>' +
        '<li>Press <b>Inspect element</b>, find the hidden HTML flag, and submit it.</li>' +
        '<li>Read the recovered evidence in the <b>RED-NOVA case file</b> and NovaMessenger.</li>' +
        '<li>Complete side CTF jobs for cash, XP, fame, and reputation.</li><li>Check <b>NovaMail</b>, claim missions, and follow the pinned desktop objective.</li></ol>' +
        '<div class="manual-h2">2 · Accounts and saving</div><div class="manual-p">Each local or online account keeps separate progress and competes in the rankings. The game saves every 15 seconds and when you shut down. You can export a signed save from Control Panel.</div>' +
        '<div class="manual-h2">3 · Income and progression</div><div class="manual-p"><b>CTF jobs:</b> cash, XP, fame, NovaCoins, and reputation. <b>Bank:</b> compound interest. <b>MyNova:</b> followers and trends. <b>Tactical Network:</b> optional cash and data raids. <b>NovaClick, Botnet, and Market:</b> alternative income.</div>' +
        '<div class="manual-tip"><b>TIP:</b> The next main CTF is always shown on the desktop. Side jobs never block the story, so use them whenever you need money or practice.</div>' +
        '<div class="manual-h2">4 · Main gameplay: CTF contracts</div><div class="manual-p">NovaOps separates the <b>main campaign</b>, self-contained <b>side jobs</b>, and the expandable <b>Infinite Archive</b> endgame. Select a card to read its client, context, exact objective, difficulty, and reward before accepting it.</div>' +
        '<div class="manual-p">Challenges teach one concept at a time: inspect local HTML, audit weak FTP credentials, shift Caesar ciphers, identify dictionary hashes, unwrap encoding layers, and reconstruct packets. Everything runs inside this fictional offline game; no real service is targeted.</div>' +
        '<div class="manual-p">Hints never erase progress, but reduce the reputation earned. The Laboratory upgrades the source mapper, wordlist, decoder, and hash rig. Field consumables can fill a likely answer or isolate useful traffic.</div>' +
        '<div class="manual-h2">4B · Optional tactical network</div><div class="manual-p">The Network Map remains a short roguelite side activity. Servers telegraph their ICE action; counter it with Ghost, Spoof, or Overload, manage energy and trace, and cash out whenever you want. Its rewards help with upgrades, but it does not gate the CTF story.</div>' +
        '<div class="manual-h2">5 · NovaCoins, implants and legacy</div><div class="manual-p">NovaCoins come from missions, bots and deep network nodes. Spend them on permanent implants. Formatting C: resets normal progress and grants permanent legacy points; each adds 3% income.</div>' +
        '<div class="manual-warn"><b>WARNING:</b> Format only when the Control Panel shows a meaningful legacy gain.</div>' +
        '<div class="manual-h2">6 · Rankings and security</div><div class="manual-p">Power measures wealth and infrastructure. Hacker ELO rewards successful raids and penalizes traces. NovaShield protects cash and data from random threats; upgrade its engine and firewall.</div>' +
        '<div class="manual-h2">7 · Games and tools</div><div class="manual-p"><b>NovaPinball:</b> A/D or arrow keys control flippers; hold Space to launch. <b>NovaPool:</b> drag from the cue ball to aim and set power. <b>Minesweeper:</b> left click opens, right click flags. Notepad, Calculator, Messenger and NovaMedia Player are fully usable desktop apps.</div>' +
        '<div class="manual-tip"><b>TIP:</b> Try the Konami code or type <span class="manual-kbd">cat</span> in the terminal. Ctrl+Shift+Esc opens Task Manager.</div>';
      return;
    }

    var html = '';
    html += '<div class="manual-title">Manual de NovaVista 2004</div>';
    html += '<div class="manual-sub">Tu PC es tu mesa de investigación. Esta guía explica los CTF, la progresión, las épocas y todas las actividades opcionales. · Usuario: ' + Util.esc(s.profile.name) + '</div>';

    html += h2('1 · Empieza aquí: tus primeras 5 acciones');
    html += '<ol class="manual-steps">' +
      '<li>Abre <b>NovaOps</b> y acepta «La página que no existe»: el objetivo exacto aparece antes de empezar.</li>' +
      '<li>Pulsa <b>Inspeccionar elemento</b>, busca la bandera oculta en el HTML y entrégala.</li>' +
      '<li>Lee la evidencia recuperada en el <b>Expediente RED-NOVA</b> y en NovaMessenger.</li>' +
      '<li>Completa encargos CTF secundarios para ganar dinero, XP, fama y reputación.</li>' +
      '<li>Revisa <b>NovaMail</b>, reclama misiones y sigue el objetivo anclado del escritorio.</li>' +
      '</ol>';

    html += h2('2 · Arranque y cuentas');
    html += p('Al encender el equipo verás la pantalla de inicio de sesión. Crea una <b>cuenta</b> con nombre y avatar: cada cuenta guarda su progreso por separado y compite en los <b>rankings locales</b>.');
    html += p('Desde el menú Inicio puedes <b>cerrar sesión</b> para volver a la pantalla de cuentas. La partida se guarda sola cada 15 segundos y al apagar.');

    html += h2('3 · Las 6 fuentes de ingresos');
    html += p('<b>Banco:</b> intereses compuestos sobre el saldo. Guarda dinero y sube <i>Mejora de intereses</i> (+0,04 %/s por nivel) y <i>Certificado de depósito</i>.');
    html += p('<b>MyNova:</b> seguidores = publicidad. La <i>Chapa verificada</i> añade crecimiento orgánico (seguidores por segundo).');
    html += p('<b>Contratos CTF:</b> la actividad principal. La campaña paga dinero, XP, fama, NovaCoins y reputación; los encargos secundarios sirven para practicar y financiar mejoras sin bloquear la historia.');
    html += p('<b>Red táctica:</b> una actividad roguelite opcional. Drena sus pocos nodos, cobra al desconectar y vende los datos cuando quieras variar.');
    html += p('<b>NovaClick:</b> en el navegador. Haz clic para ganar impresiones y cámbialas por dinero (autoclic y CPM mejorables).');
    html += p('<b>Botnet:</b> compra bots en el banco (pestaña Minería) para minar NovaCoins pasivamente.');
    html += p('<b>Mercado:</b> compra NovaCoins barato y véndelas caras. El precio fluctúa entre 6 $ y 60 $.');
    html += tip('El siguiente contrato principal siempre aparece en el widget del escritorio. Los secundarios nunca bloquean la historia: hazlos cuando quieras practicar o necesites recursos.');

    html += h2('4 · El gameplay principal: contratos CTF');
    html += p('<b>NovaOps</b> separa la campaña principal, los encargos secundarios con lore propio y el <b>Archivo ∞</b> de endgame. Antes de aceptar una tarjeta puedes leer cliente, contexto, objetivo exacto, dificultad y recompensa.');
    html += p('Los retos introducen una idea cada vez: <b>inspeccionar HTML</b> local, auditar credenciales FTP débiles, descifrar César, reconocer hashes de diccionario, desmontar capas de codificación y reconstruir paquetes. Todo ocurre dentro de la ficción local del juego; no se ataca ningún servicio real.');
    html += p('Cada etapa conserva el progreso. Las pistas no consumen dinero ni impiden avanzar, aunque reducen la <b>reputación</b> obtenida. La respuesta se entrega en el propio banco de trabajo y la evidencia pasa al expediente al cerrar un caso principal.');
    html += p('En <b>Laboratorio</b> puedes mejorar el mapeador de fuentes, la wordlist, el descifrador y el rig de hashes. Los consumibles —wordlists filtradas, tablas arcoíris y capturadores— resuelven trabajo repetitivo o aíslan tráfico útil.');
    html += tip('La campaña atraviesa Classic, Aero, Metro y Nova. Si el siguiente caso pertenece a otra época, el widget te manda directamente a Panel de control → Sistema y muestra qué debes instalar.');

    html += h2('4B · La Red táctica opcional');
    html += p('El Mapa de Red conserva un roguelite corto con <b>pocos nodos</b>. El ICE anuncia su maniobra: Fantasma, Suplantar y Sobrecarga la contrarrestan. Gestiona energía y rastro, usa herramientas y desconéctate para cobrar cuando quieras.');
    html += warn('La Red táctica aporta dinero, datos y NovaCoins, pero nunca bloquea la campaña CTF. Es una actividad alternativa para variar el ritmo.');

    html += h2('5 · NovaCoins, implantes y legado');
    html += p('Las <b>NovaCoins</b> son la moneda meta: sobreviven a cada asalto. Se obtienen minando, en nodos oscuros, en el MasterServer y en misiones.');
    html += p('Gástalas en <b>implantes</b> (Mapa de Red → Equipo): energía máxima, sigilo, CPU, botín, ingresos y caída de herramientas. Los implantes son permanentes: esa es la progresión roguelite.');
    html += p('Cuando acumules muchas NovaCoins (en total), ve a <b>Panel de control → Sistema → Formatear C:</b>. Reiniciarás el progreso a cambio de <b>puntos de legado</b> (+3 % de ingresos permanentes cada uno). Es el prestige del juego.');
    html += tip('No formatees a la ligera: el legado se calcula con las NovaCoins acumuladas <b>en total</b> (histórico). Cuanto más esperes, más legado ganas.');

    html += h2('6 · Rankings y rivales');
    html += p('La app <b>Rankings NovaVista</b> compara tu cuenta con las demás cuentas (locales o del servidor en línea) y con rivales NPC. Dos tablas: <b>Poder</b> (riqueza, seguidores, bots, implantes y legado) y <b>Elo Hacker</b> (MasterServers drenados, nodos, asaltos y rastreos). ¿Podrás superar a NullPointer?');
    html += p('Con una <b>cuenta en línea</b> (pantalla de inicio de sesión → sección en línea), el ranking se calcula en el servidor con los guardados de todos los jugadores reales.');

    html += h2('7 · No te dejes infectar');
    html += p('<b>NovaShield</b> bloquea amenazas aleatorias (troyanos, gusanos, phishing). Sube el <b>motor antivirus</b> y el <b>cortafuegos</b> para aumentar la probabilidad de bloqueo.');
    html += warn('Si el sistema entra en <b>cuarentena</b> (por manipulación del guardado o del juego), deja de guardar progreso. Restaura una copia de seguridad válida en NovaShield para salir.');

    html += h2('8 · Preguntas rápidas');
    html += p('<b>¿Disco lleno?</b> Vende datos en Mis Archivos o amplía el disco (<i>Disco duro mayor</i>).');
    html += p('<b>¿Sin energía?</b> Espera a que se regenere, usa gusanos o sube <i>Memoria RAM</i> y <i>Disipador térmico</i>.');
    html += p('<b>¿Sin dinero para el banco?</b> Los préstamos dan liquidez rápida (con interés), o drena un nodo de nivel bajo.');
    html += p('<b>¿Herramientas?</b> En Descargas del navegador con dinero, o como botín al drenar nodos.');
    html += p('<b>¿Guardado?</b> Se guarda solo cada 15 s y al cerrar, en la clave de tu cuenta. Exporta un código firmado en Panel de control → Sistema.');

    html += h2('9 · Juegos y tiempo libre');
    html += p('<b>NovaPinball</b> (escritorio): flippers con ← → o A D, mantén ESPACIO para cargar y suelta para lanzar. Bumpers +25. Cada 50 puntos = 1 $ al acabar la partida (o al cerrar).');
    html += p('<b>NovaPool 8-Ball</b> (escritorio): <b>arrastra</b> desde la bola blanca: la dirección es la puntería y la distancia es la fuerza. Gana 25 $ por partida contra la CPU.');
    html += p('<b>NovaMessenger</b> (escritorio): chatea con tus contactos. Algunos dan consejos... y de vez en cuando, algún dólar.');
    html += p('<b>Bloc de notas</b> y <b>Calculadora</b>: guarda documentos en tu cuenta y haz cuentas a la antigua.');
    html += p('<b>NovaMedia Player</b>: reproductor de los 2000s con 5 skins (Clásico, Candy, Hulk, Cromo, Neón), ecualizador y canciones generadas en tiempo real por tu tarjeta de sonido. Cambia de skin en el propio reproductor.');
    html += p('<b>Secretos:</b> prueba el <span class="manual-kbd">Código Konami</span> (arriba, arriba, abajo, abajo, izquierda, derecha, izquierda, derecha, B, A) o el comando <span class="manual-kbd">gato</span> en la terminal. Ctrl+Mayús+Esc abre el Administrador de tareas.');

    body.innerHTML = html;
    var tourBtn = Util.el('button', { class: 'xp-btn primary manual-tour-btn', text: '▶ Iniciar tutorial guiado' });
    tourBtn.addEventListener('click', function () { NS.Tutorial.start(0); });
    body.insertBefore(tourBtn, body.firstChild);
  }

  var TOUR = [
    { icon: 'ic-logo', title: 'Tu objetivo en NovaVista', enTitle: 'Your goal in NovaVista', text: 'Resuelve siete contratos CTF principales a lo largo de cuatro épocas y descubre la verdad de RED-NOVA. Los encargos secundarios, la Red táctica y los minijuegos son opcionales y nunca bloquean la campaña.', en: 'Solve seven main CTF contracts across four eras and uncover RED-NOVA’s truth. Side jobs, the Tactical Network, and minigames are optional and never block the campaign.' },
    { icon: 'ic-computer', title: 'El escritorio', enTitle: 'The desktop', text: 'Haz doble clic en un icono para abrirlo. Arrastra las ventanas, redimensiónalas desde su esquina inferior derecha y usa la barra de tareas para cambiar entre ellas. El widget inferior derecho siempre propone un objetivo.', en: 'Double-click icons to open them. Drag windows, resize them from the bottom-right corner, and use the taskbar to switch apps. The bottom-right widget always suggests an objective.' },
    { icon: 'ic-chart', title: 'Economía y progreso', enTitle: 'Economy and progression', text: 'Los CTF pagan dinero, XP, fama, reputación y NovaCoins. MyNova, el Banco, la Red táctica y otras apps ofrecen ingresos alternativos. Las mejoras, implantes y el legado aceleran tu progreso.', en: 'CTFs pay cash, XP, fame, reputation, and NovaCoins. MyNova, the Bank, the Tactical Network, and other apps provide alternative income. Upgrades, implants, and legacy speed up progression.' },
    { icon: 'ic-net', title: 'Tu primer contrato CTF', enTitle: 'Your first CTF contract', text: 'Abre NovaOps, acepta «La página que no existe» y lee el objetivo. Pulsa Inspeccionar elemento, encuentra la bandera en el comentario HTML y entrégala. Cada reto nuevo explica exactamente qué debes recuperar.', en: 'Open NovaOps, accept “The page that does not exist,” and read the objective. Press Inspect element, find the flag in the HTML comment, and submit it. Every new challenge states exactly what you must recover.' },
    { icon: 'ic-warning', title: 'Herramientas y dificultad', enTitle: 'Tools and difficulty', text: 'Los siguientes CTF añaden FTP, cifrados, hashes, capas y paquetes. Puedes pedir pistas, comprar mejoras en el Laboratorio y usar consumibles. Los encargos secundarios sirven para practicar y ganar recursos sin bloquear la historia.', en: 'Later CTFs add FTP, ciphers, hashes, layers, and packets. You can request hints, buy Laboratory upgrades, and use consumables. Side jobs offer practice and rewards without blocking the story.' },
    { icon: 'ic-mail', title: 'Misiones anclables', enTitle: 'Pinnable missions', text: 'NovaMail contiene misiones con recompensas. Pulsa “Anclar” para mostrarlas en el escritorio. El widget enseña el progreso, abre la aplicación necesaria y permite desanclar con ×.', en: 'NovaMail contains rewarded missions. Press “Pin” to show one on the desktop. The widget displays progress, opens the required app, and can be unpinned with ×.' },
    { icon: 'ic-msn', title: 'Historia y épocas', enTitle: 'Story and eras', text: 'Cada CTF principal añade una evidencia al expediente; NovaMessenger la convierte en conversaciones y capítulos de lore anclables. Panel de control → Sistema permite instalar Aero, Metro y Nova cuando cumplas sus requisitos.', en: 'Each main CTF adds evidence to the case file; NovaMessenger turns it into conversations and pinnable lore chapters. Control Panel → System installs Aero, Metro, and Nova after you meet their requirements.' },
    { icon: 'ic-game', title: 'Endgame y actividades', enTitle: 'Endgame and activities', text: 'Tras el final se abre el Archivo ∞ con un contrato diario y espacio para futuros CTF. La Red táctica, Pinball, billar, buscaminas, música, bloc y calculadora siguen siendo actividades secundarias; NovaShield, Descargas, Rankings y Trofeos apoyan el progreso.', en: 'After the ending, the Infinite Archive opens with a daily contract and room for future CTFs. The Tactical Network, Pinball, pool, minesweeper, music, notepad, and calculator remain optional; NovaShield, Downloads, Rankings, and Trophies support progression.' }
  ];

  function startTutorial(index) {
    index = Math.max(0, Math.min(TOUR.length - 1, index || 0));
    var t = TOUR[index];
    var english = NS.I18n && NS.I18n.get() === 'en';
    NS.UI.dialog({ title: (english ? t.enTitle : t.title) + ' · ' + (index + 1) + '/' + TOUR.length, icon: t.icon,
      message: '<div class="tutorial-step"><div class="tutorial-count">' + (index + 1) + ' / ' + TOUR.length + '</div><p>' + Util.esc(english ? t.en : t.text) + '</p><div class="tutorial-dots">' + TOUR.map(function (_, i) { return '<i class="' + (i === index ? 'on' : '') + '"></i>'; }).join('') + '</div></div>',
      buttons: [{ label: english ? 'Back' : 'Anterior', value: 'prev', disabled: index === 0 }, { label: index === TOUR.length - 1 ? (english ? 'Finish' : 'Terminar') : (english ? 'Next' : 'Siguiente'), value: 'next', primary: true }, { label: english ? 'Close tutorial' : 'Cerrar tutorial', value: 'exit' }]
    }).then(function (v) {
      if (v === 'prev') return startTutorial(index - 1);
      if (v === 'next' && index < TOUR.length - 1) return startTutorial(index + 1);
      if (v === 'next') { NS.State.get().meta.tutorialDone = true; NS.State.saveNow(); NS.UI.toast('Tutorial', english ? 'You are ready. Follow the desktop objective.' : 'Ya estás listo. Sigue el objetivo del escritorio.', 'good', 'ic-star'); }
      if (v === 'exit') { NS.State.get().meta.tutorialDismissed = true; NS.State.saveNow(); }
    });
  }

  NS.Tutorial = { start: startTutorial, steps: TOUR };

  NS.Apps.register({
    id: 'manual', title: 'Manual de NovaVista', icon: 'ic-book',
    desktop: true, w: 660, h: 540, minW: 480, minH: 380,
    render: render
  });
})();
