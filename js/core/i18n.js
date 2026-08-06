/* NovaVista 2004 — runtime bilingual UI (Spanish / English). */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var lang = 'es';
  try { lang = localStorage.getItem('novavista.language') === 'en' ? 'en' : 'es'; } catch (e) {}

  var D = {
    'Inicio':'Start','Cerrar sesión':'Log off','Reiniciar equipo':'Restart computer','Apagar equipo...':'Turn off computer...',
    'Panel de control':'Control Panel','Mapa de Red':'Network Map','Mapa de red':'Network Map','Mis Archivos':'My Files',
    'Bloc de notas':'Notepad','Calculadora':'Calculator','Administrador de tareas':'Task Manager','Rankings NovaVista':'NovaVista Rankings',
    'Manual de NovaVista':'NovaVista Manual','Símbolo del sistema':'Command Prompt','Primer Banco Nova':'Nova First Bank',
    'Apariencia':'Appearance','Sonido':'Sound','Cuenta':'Account','Sistema':'System','Fondo de pantalla':'Desktop background',
    'Tema de colores':'Color theme','Avatar de usuario':'User avatar','Efectos de sonido':'Sound effects','Sonido del sistema':'System sound',
    'Probar sonido':'Test sound','Notificaciones':'Notifications','Identidad de usuario':'User identity','Nombre de usuario':'User name',
    'Cambiar nombre':'Change name','Cuenta en línea':'Online account','Estadísticas de la partida':'Game statistics','Guardado':'Save game',
    'Exportar':'Export','Importar':'Import','Exportar código de guardado':'Export save code','Importar código de guardado':'Import save code',
    'Formatear sistema':'Format system','Formatear C: (prestige)':'Format C: (prestige)','Acerca de NovaVista 2004':'About NovaVista 2004',
    'Español':'Spanish','Inglés':'English','Idioma':'Language','Idioma del sistema':'System language',
    'Nueva partida':'New game','Partida':'Game','Historial':'History','Tu turno.':'Your turn.','Turno de la CPU...':'CPU turn...',
    'Controles':'Controls','Premio y pista':'Prize and table','Jugar otra vez':'Play again','PARTIDA FINALIZADA':'GAME OVER',
    'Mapa':'Map','Equipo':'Equipment','Registro':'Log','Conectar a la red':'Connect to network','Escanear':'Scan','Crack':'Crack',
    'Exploit':'Exploit','Bruteforce':'Brute force','Descifrar':'Decrypt','¡Upload!':'Upload!','SIGILO':'STEALTH',
    'Desconectar y cobrar':'Disconnect and collect','Consola avanzada':'Advanced console','Sin asalto activo':'No active raid',
    'Mapa de red inactivo':'Network map inactive','alcanzable':'reachable','bloqueado':'locked','resuelto':'cleared','detalles sin escanear':'unscanned details','botín':'loot','mercado':'market','evento':'event',
    'Escribe una publicación':'Write a post','Publicar ahora':'Post now','Tus cifras':'Your stats','Mejoras de MyNova':'MyNova upgrades',
    'Últimas publicaciones de tus contactos':'Latest posts from your contacts','TENDENCIA AHORA':'TRENDING NOW','Espera':'Wait',
    'Más poder':'Most power','Mayor hacker (ELO)':'Top hacker (ELO)','Ranking de PODER':'POWER RANKING','Ranking de ELO HACKER':'HACKER ELO RANKING',
    'Tu puesto:':'Your rank:','de':'of','Nivel':'Level','TÚ':'YOU','Estás en la cima. Defiende tu puesto.':'You are at the top. Defend your rank.',
    'Banco':'Bank','Saldo':'Balance','Depositar':'Deposit','Retirar':'Withdraw','Préstamo':'Loan','Mejoras':'Upgrades',
    'Comprar':'Buy','Vender':'Sell','Cobrar':'Collect','Dinero':'Money','Datos':'Data','Seguidores':'Followers','Publicaciones':'Posts',
    'Cerrar':'Close','Aceptar':'OK','Cancelar':'Cancel','Sí':'Yes','No':'No','Ayuda':'Help','Buscar':'Search','Actualizar':'Refresh',
    'Atrás':'Back','Adelante':'Forward','Inicio de sesión':'Log on','Crear cuenta nueva...':'Create new account...',
    'Crear cuenta y entrar':'Create account and log on','Contraseña':'Password','Entrar':'Log on','Usuario':'User',
    'Bienvenido a NovaVista 2004':'Welcome to NovaVista 2004','CUENTA ACTIVADA':'ACCOUNT ACTIVATED','Entrar en NovaNet':'Enter NovaNet',
    'Publicar con':'Post with','Crecimiento orgánico:':'Organic growth:','Ingresos por publicidad:':'Ad revenue:','Mejor viralidad:':'Best viral reach:',
    'Victorias:':'Wins:','Ganadas cobradas:':'Winnings collected:','Récord:':'High score:','puntos':'points','BOLAS:':'BALLS:','PUNTOS:':'SCORE:',
    'MANTÉN ESPACIO PARA LANZAR':'HOLD SPACE TO LAUNCH','¡SUELTA ESPACIO!':'RELEASE SPACE!','POTENCIA':'POWER',
    'Tú:':'You:','CPU:':'CPU:','sólidas':'solids','listadas':'stripes','Mete la 8 al final':'Pocket the 8-ball last',
    'Correo':'Mail','Asunto':'Subject','Recompensa':'Reward','Reclamar':'Claim','Completada':'Completed','Pendiente':'Pending',
    'ACTIVADO':'ON','DESACTIVADO':'OFF','ACTIVADAS':'ON','DESACTIVADAS':'OFF',
    'Ir':'Go','Listo':'Done','Papelera':'Recycle Bin','Bandeja de entrada':'Inbox','Misiones':'Missions','Notificaciones del sistema':'System notifications',
    'Almacenamiento de datos':'Data storage','Acuerdos y hardware':'Deals and hardware','Herramientas de intrusión':'Intrusion tools','Documentos':'Documents',
    'Depositar todo':'Deposit all','Retirar todo':'Withdraw all','Comprar:':'Buy:','Vender:':'Sell:','Pedir':'Borrow','Pagar toda la deuda':'Repay all debt',
    'Estado de protección':'Protection status','Mejoras de seguridad':'Security upgrades','Escaneo manual':'Manual scan','Analizar sistema':'Scan system','Registro de eventos':'Event log',
    'Rendimiento':'Performance','Aplicaciones abiertas':'Running applications','Finalizar':'End task','Nueva cuenta':'New account','Crear cuenta':'Create account',
    'Comprobando servidor…':'Checking server…','Cuenta en línea':'Online account','Cargando…':'Loading…','Guardar':'Save','Nuevo documento':'New document',
    'Sin estado':'No status','Top 8':'Top 8','Perfil':'Profile','Amigos reales':'Real friends','Buscar jugadores':'Find players','Solicitudes entrantes':'Incoming requests',
    'Mis amigos':'My friends','En línea':'Online','Desconectado':'Offline','Amigo ✓':'Friend ✓','Enviada…':'Sent…','Añadir':'Add','Enviar':'Send',
    'Personaliza tu MyNova Space':'Customize your MyNova Space','Color del perfil:':'Profile color:','Guardar mi perfil':'Save my profile','Volver a mis amigos':'Back to friends',
    'Implantes (NovaCoins — persistencia meta)':'Implants (NovaCoins — permanent progression)','Hardware del rig (dólares)':'Rig hardware (dollars)',
    'Estadísticas del equipo':'Equipment stats','Legado (prestige)':'Legacy (prestige)','Historial del operador':'Operator history','Formatear C: (abrir panel)':'Format C: (open panel)',
    'Reclamar':'Claim','reclamada':'claimed','Premio y pista':'Prize and table','Cobrar premio:':'Collect prize:','Lanzar (ESPACIO)':'Launch (SPACE)',
    '+ Nuevo documento':'+ New document','Sin título':'Untitled','Cambiar idioma':'Change language','Cambiar a inglés':'Switch to English'
  };
  var R = [
    [/Tu turno/g,'Your turn'],[/Turno de la CPU/g,'CPU turn'],[/Rompe el triángulo/g,'Break the rack'],
    [/Arrastra con el ratón para apuntar/g,'Drag the mouse to aim'],[/la distancia controla la fuerza/g,'distance controls power'],
    [/Mete tus bolas y la 8 al final/g,'Pocket your group, then the 8-ball'],[/La CPU tira listadas/g,'The CPU plays stripes'],
    [/Te faltan/g,'You need'],[/para adelantar a/g,'to overtake'],[/termina en/g,'ends in'],[/alcance/g,'reach'],
    [/seguidores/g,'followers'],[/Publicaciones/g,'Posts'],[/Ingresos por publicidad/g,'Ad revenue'],[/Crecimiento orgánico/g,'Organic growth'],[/Nivel (?=\d)/g,'Level '],
    [/Nueva partida/g,'New game'],[/Sonido activado/g,'Sound enabled'],[/Sonido desactivado/g,'Sound disabled'],[/nivel/g,'level'],[/MÁX/g,'MAX'],[/Mejoras/g,'Upgrades'],
    [/Sincronizar ahora/g,'Sync now'],[/Cerrar sesión en línea/g,'Log off online'],[/Tiempo jugado/g,'Time played'],
    [/Asaltos completados/g,'Raids completed'],[/Nodos drenados/g,'Nodes drained'],[/Puntos de legado/g,'Legacy points'],
    [/Energía/g,'Energy'],[/Rastro/g,'Trace'],[/Botín/g,'Loot'],[/Objetivo/g,'Objective'],[/Publicar ahora/g,'Post now'],
    [/hace (\d+) min/g,'$1 min ago'],[/ahora mismo/g,'right now'],[/Última conexión/g,'Last online'],
    [/Hola, /g,'Hello, '],[/Tu primera oportunidad ya está activa/g,'Your first opportunity is already live'],
    [/Hazte visible en/g,'Get noticed on'],[/Entra al/g,'Enter the'],[/Supera al siguiente rival del/g,'Overtake your next rival in the'],
    [/Cada 50 puntos = 1 \$/g,'Every 50 points = $1'],[/Ganar = \+25 \$/g,'Win = +$25'],
    [/Sin dinero/g,'Not enough money'],[/Fondos insuficientes/g,'Insufficient funds'],[/No tienes suficiente dinero/g,'You do not have enough money'],
    [/Victorias/g,'Wins'],[/Ganadas cobradas/g,'Winnings collected'],[/Tiras/g,'You shoot'],[/otra vez tú/g,'you shoot again'],[/usados de/g,'used of'],
    [/Temas generados en tiempo real por tu tarjeta de sonido/g,'Tracks generated in real time by your sound card'],
    [/estilo FM\/chiptune/g,'FM/chiptune style'],[/Clásico/g,'Classic'],[/Neón/g,'Neon'],[/Hielo binario/g,'Binary Ice'],[/Descarga final/g,'Final Download'],[/Subsuelo/g,'Underground'],[/Chips al amanecer/g,'Chips at Dawn'],
    [/Efectivo disponible/g,'Cash available'],[/Depositar todo/g,'Deposit all'],[/Retirar todo/g,'Withdraw all'],[/El interés se calcula sobre el saldo en la cuenta/g,'Interest is calculated from your account balance'],[/Deja dinero aquí para que trabaje por ti/g,'Leave money here and let it work for you'],
    [/Compra barato, vende caro/g,'Buy low, sell high'],[/El precio fluctúa con el tiempo/g,'The price changes over time'],[/Pagar toda la deuda/g,'Repay all debt'],[/Pedir /g,'Borrow '],
    [/Aún no hay/g,'There are no'],[/Todavía no tienes/g,'You do not have'],[/No hay ventanas abiertas/g,'No open windows'],[/Memoria/g,'Memory'],
    [/Da XP y puede revelar amenazas latentes/g,'Grants XP and may reveal hidden threats'],[/Restaurar copia de seguridad válida/g,'Restore valid backup'],[/empezar de cero/g,'start over'],
    [/Sin herramientas/g,'No tools'],[/Consíguelas en Descargas \(navegador\) o como botín en los asaltos de red/g,'Get them from Downloads (browser) or as loot from network raids'],
    [/Aún no hay notificaciones/g,'No notifications yet'],[/Los resultados de tus asaltos aparecerán aquí/g,'Your raid results will appear here'],[/Recompensa/g,'Reward'],
    [/Para comenzar, haga clic en su nombre de usuario/g,'To begin, click your user name'],[/Elige un nombre y un avatar/g,'Choose a name and avatar'],[/Tu progreso se guarda aparte para cada cuenta/g,'Progress is saved separately for each account'],
    [/está escribiendo/g,'is typing'],[/amigos/g,'friends'],[/quiere ser tu amigo/g,'wants to be your friend'],[/Selecciona un contacto de la lista para chatear/g,'Select a contact from the list to chat'],
    [/Conecta con tus amigos/g,'Connect with your friends'],[/Cargando perfil de/g,'Loading profile for'],[/No se pudo cargar el perfil/g,'Could not load profile'],[/Nada por aquí/g,'Nothing here'],[/Buscando/g,'Searching'],[/Nadie con ese nombre/g,'No user with that name'],
    [/Cartera/g,'Wallet'],[/acumuladas en total/g,'earned all-time'],[/Puntos de legado/g,'Legacy points'],[/Ingresos globales/g,'Global income'],[/Formateos/g,'Formats'],
    [/Clic: abrir/g,'Click: open'],[/Clic derecho: bandera/g,'Right click: flag'],[/Doble clic sobre un número: revelar alrededor/g,'Double-click a number: reveal nearby cells'],[/si las banderas coinciden/g,'when flags match'],
    [/Selecciona o crea un documento para empezar a escribir/g,'Select or create a document to start writing'],[/Sin documentos/g,'No documents'],[/Crea uno nuevo/g,'Create a new one'],
    [/ESPACIO \(mantener\): cargar el lanzador lateral y soltar/g,'SPACE (hold): charge the side launcher, then release'],[/Cada 50 puntos = 1 \$ al terminar/g,'Every 50 points = $1 when the game ends'],[/túnel/g,'tunnel'],[/diana/g,'target'],
    [/Haz clic en un nodo alcanzable para atacarlo/g,'Click a reachable node to attack it'],[/Drena nodos conectados para abrir el camino/g,'Drain connected nodes to open the path']
    ,[/Vendes datos a/g,'You sell data for'],[/Vender todos los datos/g,'Sell all data'],[/Vendidos/g,'Sold'],[/ de datos/g,' of data'],[/Acuerdo de datos/g,'Data deal'],[/Disco duro mayor/g,'Larger hard drive'],
    [/Bienvenido a NovaVista 2004\. Tu PC es tu imperio\. Gana dinero, fama y datos\./g,'Welcome to NovaVista 2004. Your PC is your empire. Earn money, fame and data.'],
    [/El Mapa de Red es tu puerta al subsuelo\. Conecta, escanea, drena\. Y no te dejes rastrear\./g,'The Network Map is your gateway underground. Connect, scan and drain. Do not get traced.'],
    [/No vendas todos los datos: los asaltos profundos pagan mejor con payload\./g,'Do not sell all your data: deep raids pay better with a payload.'],[/consejo\.txt/g,'tip.txt'],[/mapa_de_red\.txt/g,'network_map.txt'],[/leeme\.txt/g,'readme.txt'],
    [/Cuenta saneada/g,'Healthy account'],[/Ten ([\d.]+) \$ en el banco/g,'Hold $1 $ in the bank'],[/Vende 1 GB de datos en total/g,'Sell 1 GB of data in total'],[/Gana una partida de NovaPool contra la CPU/g,'Win a NovaPool game against the CPU'],
    [/Mejora de intereses/g,'Interest upgrade'],[/Certificado de depósito/g,'Deposit certificate'],[/Cuenta offshore/g,'Offshore account'],[/Cada level añade/g,'Each level adds'],[/Cada level multiplica/g,'Each level multiplies'],
    [/Cámara digital de 3 MP/g,'3 MP digital camera'],[/Agencia de anuncios/g,'Ad agency'],[/Chapa verificada/g,'Verified badge'],[/Bot zombie/g,'Zombie bot'],[/Granja de minería/g,'Mining farm'],
    [/Memoria RAM extra/g,'Extra RAM'],[/Disipador térmico/g,'CPU cooler'],[/Motor de antivirus/g,'Antivirus engine'],[/Cortafuegos/g,'Firewall'],[/Añade un bot a tu botnet/g,'Adds one bot to your botnet'],
    [/de interés/g,'interest'],[/de seguidores por publicación/g,'followers per post'],[/de ingresos por seguidor/g,'income per follower'],[/de crecimiento/g,'growth'],[/de producción por bot/g,'production per bot'],[/al precio de venta/g,'sale price'],[/de almacenamiento de datos/g,'data storage'],[/de energía máxima/g,'maximum energy'],[/La energía se regenera/g,'Energy regenerates'],[/Mejora la detección de amenazas/g,'Improves threat detection'],[/Bloquea más tráfico malicioso/g,'Blocks more malicious traffic'],
    [/Consejo: si una ventana se "cuelga", finalízala desde aquí\. El sistema no se romperá\./g,'Tip: if a window freezes, end it here. The system will remain safe.']
    ,[/Escriba HELP para ver los comandos disponibles\./g,'Type HELP to list available commands.'],[/¡He conectado con gente de todo el mundo!/g,'I have connected with people all over the world!'],[/Mejor viralidad/g,'Best viral reach'],
    [/🔥 TENDENCIA AHORA/g,'🔥 TRENDING NOW'],[/Las tendencias duran poco\. Publica en el momento adecuado para ampliar tu reach\./g,'Trends are short-lived. Post at the right time to expand your reach.'],
    [/¡He llegado al level 99 en el minijuego del navegador!/g,'I reached level 99 in the browser minigame!'],[/Nuevo wallpaper de atardecer digital, ¿qué opináis\?/g,'New digital sunset wallpaper—what do you think?'],[/Compré NovaCoins a 9 \$, ¡van a volar!/g,'I bought NovaCoins at $9—they are going to soar!'],
    [/\[¡¡ANUNCIO!!\]/g,'[ADVERTISEMENT!]'],[/¡NovaAntivirus 2005 YA DISPONIBLE! Protégete por solo 29,99 \$/g,'NovaAntivirus 2005 AVAILABLE NOW! Protect yourself for only $29.99'],[/Descarga 10\.000 canciones MP3 en 1 minuto — ¡sin virus! \(prometido\)/g,'Download 10,000 MP3 songs in one minute—virus free! (promised)'],
    [/Conecta para generar un asalto procedural\. Elige tu ruta entre 3 ramas, esquiva el rastreo y alcanza el MasterServer\./g,'Connect to generate a procedural raid. Choose among three branches, evade tracing and reach the MasterServer.'],
    [/¡Skins de la era dorada de los reproductores!/g,'Skins from the golden age of media players!']
  ];
  var originals = new Map();
  var attrOriginals = new Map();
  var busy = false;

  function t(value) {
    if (lang !== 'en' || value === null || value === undefined) return String(value == null ? '' : value);
    var s = String(value);
    var trimmed = s.trim();
    if (D[trimmed]) return s.replace(trimmed, D[trimmed]);
    R.forEach(function (r) { s = s.replace(r[0], r[1]); });
    return s;
  }
  function translateText(node) {
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
    var p = node.parentNode;
    if (p && /^(SCRIPT|STYLE|TEXTAREA)$/i.test(p.nodeName)) return;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    var out = t(originals.get(node));
    if (node.nodeValue !== out) node.nodeValue = out;
  }
  function translateRoot(root) {
    if (lang !== 'en' || !root) return;
    busy = true;
    if (root.nodeType === 3) translateText(root);
    if (root.nodeType === 1 || root.nodeType === 9) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var n; while ((n = walker.nextNode())) translateText(n);
      var els = root.querySelectorAll ? root.querySelectorAll('[title],[placeholder]') : [];
      for (var i = 0; i < els.length; i++) {
        ['title','placeholder'].forEach(function (a) {
          if (!els[i].hasAttribute(a)) return;
          var key = els[i];
          var saved = attrOriginals.get(key) || {};
          if (!(a in saved)) saved[a] = els[i].getAttribute(a);
          attrOriginals.set(key, saved);
          els[i].setAttribute(a, t(saved[a]));
        });
      }
    }
    busy = false;
  }
  function restore() {
    busy = true;
    originals.forEach(function (value, node) { if (node && node.isConnected) node.nodeValue = value; });
    attrOriginals.forEach(function (saved, el) { if (el && el.isConnected) Object.keys(saved).forEach(function (a) { el.setAttribute(a, saved[a]); }); });
    originals.clear(); attrOriginals.clear(); busy = false;
  }
  function rerender() {
    try {
      if (NS.WM && NS.WM.openList) NS.WM.openList().forEach(function (o) { NS.WM.rerender(o.id); });
      if (NS.Taskbar) { NS.Taskbar.buildStartMenu(); NS.Taskbar.refresh(); NS.Taskbar.refreshTray(); NS.Taskbar.updateLanguage(); }
      if (NS.Desktop) NS.Desktop.refresh();
    } catch (e) {}
  }
  function set(next, persist) {
    next = next === 'en' ? 'en' : 'es';
    if (next === lang && document.documentElement.lang === next) { translateRoot(document); return; }
    lang = next; document.documentElement.lang = next;
    if (persist !== false) try { localStorage.setItem('novavista.language', next); } catch (e) {}
    if (next === 'es') restore();
    rerender();
    if (next === 'en') translateRoot(document);
  }
  function init() {
    document.documentElement.lang = lang;
    new MutationObserver(function (muts) {
      if (busy || lang !== 'en') return;
      muts.forEach(function (m) {
        if (m.type === 'characterData') translateText(m.target);
        else Array.prototype.forEach.call(m.addedNodes, translateRoot);
      });
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    if (lang === 'en') translateRoot(document);
  }
  NS.I18n = { init: init, set: set, get: function () { return lang; }, t: t, translate: translateRoot };
})();
