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

    var html = '';
    html += '<div class="manual-title">Manual de NovaVista 2004</div>';
    html += '<div class="manual-sub">Tu PC es tu imperio. Esta guía te dice cómo empezar a ganar dinero, dominar la red y no morir en el intento. · Usuario: ' + Util.esc(s.profile.name) + '</div>';

    html += h2('1 · Empieza aquí: tus primeras 5 acciones');
    html += '<ol class="manual-steps">' +
      '<li>Abre <b>MyNova</b> y publica 3-4 veces. Cada publicación te da seguidores, y los seguidores pagan publicidad.</li>' +
      '<li>Mete lo que ganes en el <b>Primer Banco Nova</b>: los intereses se acumulan solos (mejora la tasa cuando puedas).</li>' +
      '<li>Abre el <b>Mapa de Red</b> y conecta. Escanea un nodo cercano, rompe su firewall con <b>crack</b> y drena con <b>upload</b>.</li>' +
      '<li>Vende los datos robados en <b>Mis Archivos</b> (¡cuidado con el disco lleno!).</li>' +
      '<li>Revisa <b>NovaMail</b>: las misiones dan NovaCoins al completarlas.</li>' +
      '</ol>';

    html += h2('2 · Las 6 fuentes de ingresos');
    html += p('<b>Banco:</b> intereses compuestos sobre el saldo. Guarda dinero y sube <i>Mejora de intereses</i> y <i>Certificado de depósito</i>.');
    html += p('<b>MyNova:</b> seguidores = publicidad. La <i>Chapa verificada</i> añade crecimiento orgánico (seguidores por segundo).');
    html += p('<b>Asaltos de red:</b> el dinero grande. Drena nodos, cobra el botín al desconectar y vende los datos.');
    html += p('<b>NovaClick:</b> en el navegador. Haz clic para ganar impresiones y cámbialas por dinero (autoclic y CPM mejorables).');
    html += p('<b>Botnet:</b> compra bots en el banco (pestaña Minería) para minar NovaCoins pasivamente.');
    html += p('<b>Mercado:</b> compra NovaCoins barato y véndelas caras. El precio fluctúa entre 6 $ y 60 $.');
    html += tip('Todo ingreso se multiplica por tu <b>nivel</b> (+2 % cada uno) y por tus <b>implantes</b> de ingreso. Sube de nivel con XP de los asaltos y el antivirus.');

    html += h2('3 · El roguelite: asaltos en el Mapa de Red');
    html += p('Cada asalto se genera al azar (nodos, firewall y vulnerabilidades cambian). Tu objetivo: llegar al <b>MasterServer</b>.');
    html += p('<b>Energía:</b> cada acción cuesta energía (se regenera sola). <b>Rastro:</b> cada acción también genera rastro; si llega a 100 te rastrean y pierdes el botín sin cobrar.');
    html += p('Comandos clave: <span class="manual-kbd">scan</span> revela el nodo · <span class="manual-kbd">crack</span> rompe 1 capa de firewall (con probabilidad) · <span class="manual-kbd">exploit</span> usa la vulnerabilidad de desbordamiento · <span class="manual-kbd">bruteforce</span> rompe 1 capa seguro pero genera mucho rastro · <span class="manual-kbd">upload</span> drena el nodo cuando el firewall está a 0.');
    html += p('Para sobrevivir: <span class="manual-kbd">stealth</span> reduce el rastro a 70 %, los <b>proxies</b> a la mitad, y el <b>gusano</b> recupera energía. Los nodos oscuros y el MasterServer pagan <b>NovaCoins</b>.');
    html += warn('Un nodo solo es alcanzable si has drenado antes uno que conecta con él. Escanea antes de atacar: revela vulnerabilidades que hacen el asalto mucho más fácil.');

    html += h2('4 · NovaCoins, implantes y legado');
    html += p('Las <b>NovaCoins</b> son la moneda meta: sobreviven a cada asalto. Se obtienen minando, en nodos oscuros, en el MasterServer y en misiones.');
    html += p('Gástalas en <b>implantes</b> (Mapa de Red → Equipo): energía máxima, sigilo, CPU, botín, ingresos y caída de herramientas. Los implantes son permanentes: esa es la progresión roguelite.');
    html += p('Cuando acumules muchas NovaCoins (en total), ve a <b>Panel de control → Sistema → Formatear C:</b>. Reiniciarás el progreso a cambio de <b>puntos de legado</b> (+3 % de ingresos permanentes cada uno). Es el prestige del juego.');
    html += tip('No formatees a la ligera: el legado se calcula con las NovaCoins acumuladas <b>en total</b> (histórico). Cuanto más esperes, más legado ganas.');

    html += h2('5 · No te dejes infectar');
    html += p('<b>NovaShield</b> bloquea amenazas aleatorias (troyanos, gusanos, phishing). Sube el <b>motor antivirus</b> y el <b>cortafuegos</b> para aumentar la probabilidad de bloqueo.');
    html += warn('Si el sistema entra en <b>cuarentena</b> (por manipulación del guardado o del juego), deja de guardar progreso. Restaura una copia de seguridad válida en NovaShield para salir.');

    html += h2('6 · Preguntas rápidas');
    html += p('<b>¿Disco lleno?</b> Vende datos en Mis Archivos o amplía el disco (<i>Disco duro mayor</i>).');
    html += p('<b>¿Sin energía?</b> Espera a que se regenere, usa gusanos o sube <i>Memoria RAM</i> y <i>Disipador térmico</i>.');
    html += p('<b>¿Sin dinero para el banco?</b> Los préstamos dan liquidez rápida (con interés), o drena un nodo de nivel bajo.');
    html += p('<b>¿Herramientas?</b> En Descargas del navegador con dinero, o como botín al drenar nodos.');
    html += p('<b>¿Guardado?</b> Se guarda solo cada 15 s y al cerrar. Exporta un código firmado en Panel de control → Sistema.');

    html += h2('7 · Juegos y tiempo libre');
    html += p('<b>NovaPinball</b> (escritorio): flippers con ← → o A D, lanza con ESPACIO. Cada 50 puntos = 1 $ al acabar la partida.');
    html += p('<b>NovaPool 8-Ball</b> (escritorio): apunta con el ratón (la distancia es la fuerza) y gana 25 $ por partida contra la CPU.');
    html += p('<b>NovaMessenger</b> (escritorio): chatea con tus contactos. Algunos dan consejos... y de vez en cuando, algún dólar.');
    html += p('<b>Secretos:</b> prueba el <span class="manual-kbd">Código Konami</span> (arriba, arriba, abajo, abajo, izquierda, derecha, izquierda, derecha, B, A) o el comando <span class="manual-kbd">gato</span> en la terminal. Ctrl+Mayús+Esc abre el Administrador de tareas.');

    body.innerHTML = html;
  }

  NS.Apps.register({
    id: 'manual', title: 'Manual de NovaVista', icon: 'ic-book',
    desktop: true, w: 660, h: 540, minW: 480, minH: 380,
    render: render
  });
})();
