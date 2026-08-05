/* ============================================================
   NovaVista 2004 — NovaMessenger (MSN de la época)
   Contactos simulados con estados, "escribiendo..." y charlas.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var CONTACTS = [
    {
      name: 'Rita_04', status: 'online', avatar: 'ic-ava-girl',
      replies: [
        'jajaja qué fuerte!!',
        '¿has visto el nuevo fondo de pantalla de MyNova? es la caña',
        'te escribo desde el ciber. el teclado huele a cola...',
        'oye oye, ¿me pasas 2 $? luego te los devuelvo, prometido',
        'conecta a la red y haz un asalto!! dicen que el MasterServer está fácil hoy',
        'k tal tu botnet?? yo no tengo ni uno :('
      ],
      gift: 2
    },
    {
      name: 'CarlosGT', status: 'busy', avatar: 'ic-ava-boy',
      replies: [
        'estoy en medio de una partida de pinball, luego te cuento',
        'el 8Pool de la cafetería... me ganó 3 partidas seguidas. MALDITO',
        '¿sabes que puedes cobrar el premio del pinball en el banco? en efectivo',
        'prueba el nuevo mensajero: es como el MSN pero sin los anuncios',
        'los bots minan NovaCoins solos mientras duermes. invierte en botnet'
      ],
      gift: 0
    },
    {
      name: 'Luna_Star', status: 'online', avatar: 'ic-ava-cool',
      replies: [
        'holaaa! ^_^',
        'me he leído el manual de NovaVista, tiene truquillos buenos',
        'si vendes datos por la noche el precio es mejor... o eso dicen',
        '¿te gusta mi avatar? me lo hice con el selector nuevo :D',
        'no te fíes de los anuncios de "gana 1000$ ya"'
      ],
      gift: 1
    },
    {
      name: 'El_Jefe', status: 'invisible', avatar: 'ic-hacker',
      replies: [
        'No me encuentro aquí. (Mensaje automático)',
        'Recuerda: intereses, seguidores y asaltos. Los tres pilares.',
        'Los implantes se compran con NovaCoins. No las malgastes en el mercado.',
        'Cuando tengas muchas NovaCoins acumuladas, formatea C: y gana legado.',
        'El sigilo es la diferencia entre cobrar y que te rastreen.'
      ],
      gift: 5
    },
    {
      name: 'CriptoPepe', status: 'online', avatar: 'ic-ava-mono',
      replies: [
        'NovaCoins a 12 $, ¡COMPRA YA! (no es consejo financiero)',
        'he minado 3 NovaCoins esta noche. la granja de bots se paga sola',
        'el MasterServer da 8-18 NovaCoins. 100% real no fake',
        'el precio sube y baja. compra barato, vende caro, repite',
        'no me hagas caso, soy un meme andante'
      ],
      gift: 2
    }
  ];

  var open = false;
  var selected = null;
  var chatLogEl = null;
  var typingTimer = null;
  var echoTimer = null;
  var typing = false;

  function statusLabel(st) {
    return { online: 'En línea', busy: 'Ocupado', invisible: 'Invisible' }[st] || 'En línea';
  }
  function statusColor(st) {
    return st === 'online' ? '#3e8f2a' : st === 'busy' ? '#e0a030' : '#999';
  }

  function addMsg(who, text, cls) {
    if (!chatLogEl) return;
    var row = Util.el('div', { class: 'msn-msg ' + (cls || '') });
    row.appendChild(Util.el('b', { text: who + ': ' }));
    row.appendChild(document.createTextNode(text));
    chatLogEl.appendChild(row);
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  function contactReply(contact) {
    if (typing) return;
    typing = true;
    var ta = Util.el('div', { class: 'msn-typing', text: contact.name + ' está escribiendo...' });
    chatLogEl.appendChild(ta);
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      typing = false;
      ta.remove();
      var pool = contact.replies;
      var msg = pool[Math.floor(Math.random() * pool.length)];
      addMsg(contact.name, msg, 'them');
      NS.Audio.notify();
      if (contact.gift > 0 && Math.random() < 0.3) {
        NS.State.addCash(contact.gift);
        NS.UI.toast('NovaMessenger', contact.name + ' te envió ' + Util.fmtMoney(contact.gift) + ' con un guiño.', 'good', 'ic-msn');
      }
    }, 900 + Math.random() * 1400);
  }

  function send(text) {
    var contact = selected;
    if (!contact || !text.trim()) return;
    addMsg('Tú', text.trim(), 'me');
    var input = Util.$('#msn-input');
    if (input) input.value = '';
    if (contact.status === 'invisible') {
      clearTimeout(echoTimer);
      echoTimer = setTimeout(function () { addMsg(contact.name, '... (no hay respuesta: está invisible)', 'dim'); }, 1200);
    } else {
      contactReply(contact);
    }
    NS.Audio.tick();
  }

  function render(body) {
    open = true;
    body.innerHTML = '';
    body.className = 'msn-root';

    var left = Util.el('div', { class: 'msn-left' });
    left.appendChild(Util.el('div', { class: 'msn-brand', text: 'NovaMessenger' }));
    var list = Util.el('div', { class: 'msn-list' });
    CONTACTS.forEach(function (c) {
      var row = Util.el('div', { class: 'msn-contact' + (selected === c ? ' sel' : '') });
      var svg = Util.el('svg', { class: 'icon icon-24' });
      svg.innerHTML = '<use href="#' + c.avatar + '"/>';
      row.appendChild(svg);
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'msn-cname', text: c.name }));
      info.appendChild(Util.el('div', { class: 'msn-cstatus', text: statusLabel(c.status) }));
      info.style.color = statusColor(c.status);
      row.appendChild(info);
      row.addEventListener('click', function () {
        // cancelar respuestas pendientes del contacto anterior al cambiar
        clearTimeout(typingTimer);
        clearTimeout(echoTimer);
        typing = false;
        selected = c;
        render(body);
        chatLogEl = Util.$('.msn-chatlog');
        addMsg('Sistema', 'Conversación iniciada con ' + c.name + '. Escribe algo y responde (con suerte te da dinero).', 'dim');
      });
      list.appendChild(row);
    });
    left.appendChild(list);
    left.appendChild(Util.el('div', { class: 'msn-slogan', text: 'Conecta con tus amigos · RED-NOVA' }));

    var right = Util.el('div', { class: 'msn-right' });
    if (!selected) {
      right.appendChild(Util.el('div', { class: 'msn-empty', text: 'Selecciona un contacto de la lista para chatear. Pueden darte consejos... y algún que otro dólar.' }));
    } else {
      var head = Util.el('div', { class: 'msn-chathead' });
      head.textContent = selected.name + ' — ' + statusLabel(selected.status);
      head.style.borderColor = statusColor(selected.status);
      right.appendChild(head);
      chatLogEl = Util.el('div', { class: 'msn-chatlog' });
      right.appendChild(chatLogEl);
      var inpRow = Util.el('div', { class: 'msn-inputrow' });
      var inp = Util.el('input', { class: 'xp-input', id: 'msn-input', type: 'text', maxlength: '120', placeholder: 'Escribe un mensaje...' });
      var btn = Util.el('button', { class: 'xp-btn small', text: 'Enviar' });
      btn.addEventListener('click', function () { send(inp.value); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(inp.value); });
      inpRow.appendChild(inp);
      inpRow.appendChild(btn);
      right.appendChild(inpRow);
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
    }
    body.appendChild(left);
    body.appendChild(right);
  }

  function tick() {
    // los contactos a veces saludan si la ventana lleva abierta un rato
    if (!open || !selected || typing) return;
    if (Math.random() < 0.003) contactReply(selected);
  }

  NS.Apps.register({
    id: 'msn', title: 'NovaMessenger', icon: 'ic-msn',
    desktop: true, w: 560, h: 420, minW: 460, minH: 340,
    render: render, tick: tick,
    onClose: function () {
      open = false;
      clearTimeout(typingTimer);
      clearTimeout(echoTimer);
      typing = false;
    }
  });
})();
