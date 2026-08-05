/* ============================================================
   NovaVista 2004 — Eventos del juego (amenazas, anuncios,
   notificaciones). Conecta el motor con la interfaz.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var malwareBusy = false;
  var lastThreat = null;

  function pickMalware() {
    var list = NS.Catalog.MALWARE;
    return list[Math.floor(Math.random() * list.length)];
  }

  function threatLevel(mw) {
    // Nivel de protección NovaShield (2 base + mejoras)
    var s = NS.State.get();
    return 2 + (s.upg['av-level'] || 0) + (s.upg['av-fw'] || 0);
  }

  function resolveMalware(mw) {
    var s = NS.State.get();
    var prot = threatLevel(mw);
    var chance = Util.clamp(0.25 + prot * 0.075, 0, 0.95);
    var success = Math.random() < chance;
    var UI = NS.UI;

    if (success) {
      s.av.malwareStopped++;
      s.meta.threatsStopped++;
      NS.State.addXP(6 + prot * 2);
      if (UI) UI.toast('Amenaza neutralizada', 'NovaShield bloqueó «' + mw.name + '» (' + Math.round(chance * 100) + ' % de éxito).', 'good', 'ic-shield');
      NS.Audio.ok();
    } else {
      s.stats.traces = (s.stats.traces || 0) + 1;
      var lossCash = 0;
      if (mw.loss === 'cash') lossCash = s.currencies.cash * (0.04 + Math.random() * 0.06);
      else if (mw.loss === 'data') {
        var lossData = s.data.mb * (0.1 + Math.random() * 0.15);
        s.data.mb = Math.max(0, s.data.mb - lossData);
      } else {
        lossCash = s.currencies.cash * 0.05;
      }
      if (lossCash > 0) {
        s.currencies.cash = Math.max(0, s.currencies.cash - lossCash);
        NS.State.addXP(1);
      }
      if (UI) UI.toast('¡Infección!', '«' + mw.name + '» superó tus defensas' + (lossCash > 0 ? ' y te costó ' + Util.fmtMoney(lossCash) : ' y borró parte de tus datos') + '. Mejora NovaShield.', 'important', 'ic-shield-bad');
      NS.Audio.warn();
    }
    malwareBusy = false;
  }

  function onMalware() {
    if (malwareBusy) return;
    if (NS.Sec.isQuarantined()) return;
    var mw = pickMalware();
    lastThreat = mw;
    malwareBusy = true;
    var UI = NS.UI;
    NS.Audio.warn();
    if (!UI || !UI.dialog) { resolveMalware(mw); return; }
    var s = NS.State.get();
    var prot = threatLevel(mw);
    var chance = Util.clamp(0.25 + prot * 0.075, 0, 0.95);
    UI.dialog({
      title: '¡Amenaza detectada!',
      icon: 'ic-shield-bad',
      message: 'NovaShield ha interceptado: <b>' + Util.esc(mw.name) + '</b><br><br>' +
        Util.esc(mw.desc) + '<br><br>Protección actual: <b>' + prot + '</b> — Probabilidad de bloquearlo: <b>' + Math.round(chance * 100) + ' %</b>',
      buttons: [
        { label: 'Ejecutar NovaShield', value: 'go', primary: true },
        { label: 'Ignorar', value: 'ignore' }
      ]
    }).then(function (v) {
      if (v === 'go') resolveMalware(mw);
      else {
        // ignorar = fallo asegurado (con algo de suerte se va solo)
        if (Math.random() < 0.15) { resolveMalware(mw); }
        else {
          malwareBusy = false;
          var s2 = NS.State.get();
          var l = s2.currencies.cash * 0.03;
          s2.currencies.cash = Math.max(0, s2.currencies.cash - l);
          if (UI) UI.toast('Sistema comprometido', 'Ignoraste la amenaza y perdiste ' + Util.fmtMoney(l) + '.', 'important', 'ic-warning');
        }
      }
    });
  }

  function onAd() {
    var UI = NS.UI;
    if (!UI) return;
    var gifts = ['¡Has ganado un cupón de 5 $!', '¡Descarga gratis el protector de pantalla!', '¡Tu PC está en riesgo! ¡Limpia YA!', '¡Conoce a nuevas personas en NovaChat!', '¡Internet Explorer es lento! ¡Prueba NovaSurf!'];
    var g = gifts[Math.floor(Math.random() * gifts.length)];
    UI.toast('Anuncio emergente', g + ' <span style="color:#888">(ventana emergente)</span>', 'ad', 'ic-info');
  }

  function hook(type, payload) {
    var UI = NS.UI;
    switch (type) {
      case 'malware': onMalware(); break;
      case 'ad': onAd(); break;
      case 'levelup':
        if (UI) UI.toast('¡Nivel ' + payload.level + '!', 'Tu habilidad de hacker aumenta. +2 % de ingresos por nivel.', 'good', 'ic-star');
        NS.Audio.ok();
        break;
      case 'offline':
        if (UI) UI.toast('Informe de ausencia', 'Mientras no estabas: ' + Util.fmtMoney(payload.interest) + ' de intereses, ' + Util.fmtMoney(payload.cash) + ' de publicidad y ' + payload.coins.toFixed(3).replace('.', ',') + ' NovaCoins minados.', 'good', 'ic-info');
        NS.Audio.notify();
        break;
      case 'dataOverflow':
        if (UI) UI.toast('Disco lleno', 'No cabían ' + Util.fmtBytes(payload.lost * 1024 * 1024) + ' de datos. Vende datos en Mis Archivos.', 'important', 'ic-warning');
        break;
      case 'format':
        if (UI) UI.toast('Formato completado', 'Tu legado crece: +' + payload.grant + ' puntos de legado (+3 % de ingresos cada uno).', 'good', 'ic-gear');
        NS.Audio.startup();
        break;
      case 'quarantine':
        if (UI) UI.toast('¡Integridad comprometida!', 'Se detectó una manipulación del juego. El sistema entra en CUARENTENA: no se guardará el progreso hasta restaurar.', 'important', 'ic-error');
        NS.Audio.error();
        break;
      case 'upgrade':
        NS.Audio.cash();
        break;
      case 'post':
        if (payload && payload.gained > 0) NS.Audio.cash();
        break;
    }
  }

  function init() {
    NS.State.on(hook);
  }

  NS.Event = { init: init, fire: hook, lastThreat: function () { return lastThreat; } };
})();
