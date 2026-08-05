/* ============================================================
   NovaVista 2004 — Panel de control
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  function tabBar() {
    var bar = Util.el('div', { class: 'tabbar' });
    return bar;
  }

  function section(title) {
    var s = Util.el('div', { class: 'cfg-section' });
    if (title) s.appendChild(Util.el('div', { class: 'cfg-title', text: title }));
    return s;
  }

  function row(label, control) {
    var r = Util.el('div', { class: 'cfg-row' });
    r.appendChild(Util.el('span', { text: label }));
    r.appendChild(control);
    return r;
  }

  function render(body) {
    var S = NS.State.get();
    body.innerHTML = '';
    body.className = 'app-pad';

    var tabs = Util.el('div', { class: 'tabs' });
    var content = Util.el('div', { class: 'tab-content' });

    function makeTab(id, label, fn) {
      var b = Util.el('button', { class: 'tab-btn', text: label });
      b.addEventListener('click', function () {
        Util.$$('.tab-btn', tabs).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        content.innerHTML = '';
        fn();
      });
      tabs.appendChild(b);
      return b;
    }

    /* -------- Apariencia -------- */
    makeTab('apariencia', 'Apariencia', function () {
      var sc = section('Fondo de pantalla');
      NS.Catalog.WALLPAPERS.forEach(function (wp) {
        var b = Util.el('button', {
          class: 'xp-btn small wp-pick',
          text: wp.name
        });
        if (S.settings.wallpaper === wp.id) b.classList.add('on');
        b.addEventListener('click', function () {
          S.settings.wallpaper = wp.id;
          NS.Desktop.refresh();
          render(body);
        });
        sc.appendChild(b);
      });
      content.appendChild(sc);

      var st = section('Tema de colores');
      NS.Catalog.THEMES.forEach(function (t) {
        var b = Util.el('button', {
          class: 'xp-btn small wp-pick',
          text: t.name
        });
        if (S.settings.theme === t.id) b.classList.add('on');
        b.addEventListener('click', function () {
          S.settings.theme = t.id;
          NS.Desktop.refresh();
          render(body);
        });
        st.appendChild(b);
      });
      content.appendChild(st);

      var av = section('Avatar de usuario');
      for (var i = 0; i < 6; i++) {
        (function (idx) {
          var b = Util.el('button', { class: 'avatar-pick' });
          var svg = Util.el('svg', { class: 'icon icon-32' });
          svg.innerHTML = '<use href="#' + (['ic-hacker', 'ic-users', 'ic-bot', 'ic-star', 'ic-phone', 'ic-game'])[idx] + '"/>';
          b.appendChild(svg);
          if (S.profile.avatar === idx) b.classList.add('on');
          b.addEventListener('click', function () {
            S.profile.avatar = idx;
            NS.Taskbar.buildStartMenu();
            render(body);
          });
          av.appendChild(b);
        })(i);
      }
      content.appendChild(av);
    });

    /* -------- Sonido -------- */
    makeTab('sonido', 'Sonido', function () {
      var sc = section('Efectos de sonido');
      var toggle = Util.el('button', {
        class: 'xp-btn', text: S.settings.sound ? 'Sonido: ACTIVADO' : 'Sonido: DESACTIVADO'
      });
      toggle.addEventListener('click', function () {
        S.settings.sound = !S.settings.sound;
        NS.Audio.setEnabled(S.settings.sound);
        render(body);
      });
      sc.appendChild(row('Sonido del sistema', toggle));
      var test = Util.el('button', { class: 'xp-btn', text: 'Probar sonido' });
      test.addEventListener('click', function () { NS.Audio.startup(); });
      sc.appendChild(row('', test));
      content.appendChild(sc);
    });

    /* -------- Cuenta -------- */
    makeTab('cuenta', 'Cuenta', function () {
      var sc = section('Identidad de usuario');
      var inp = Util.el('input', { class: 'xp-input', value: S.profile.name, maxlength: '20' });
      var save = Util.el('button', { class: 'xp-btn', text: 'Cambiar nombre' });
      save.addEventListener('click', function () {
        var v = inp.value.trim().slice(0, 20);
        if (!v) { NS.UI.alert('Cuenta', 'Escribe un nombre válido.', 'ic-info'); return; }
        S.profile.name = v;
        NS.Taskbar.buildStartMenu();
        NS.UI.toast('Cuenta', 'Nombre actualizado a «' + Util.esc(v) + '».', 'good', 'ic-users');
      });
      sc.appendChild(row('Nombre de usuario', inp));
      sc.appendChild(row('', save));
      content.appendChild(sc);

      var st = section('Estadísticas de la partida');
      st.appendChild(Util.el('div', { class: 'cfg-info', html:
        'Instalado el: <b>' + Util.fmtDate(S.meta.createdAt) + '</b><br>' +
        'Tiempo jugado: <b>' + Util.fmtDuration(S.meta.totalPlayMs) + '</b><br>' +
        'Asaltos completados: <b>' + S.meta.runsDone + '</b> · Rastreados: <b>' + S.meta.runsTraced + '</b><br>' +
        'Nodos drenados: <b>' + S.meta.nodesDrained + '</b> · NovaCoins acumuladas (histórico): <b>' + Util.fmtNum(S.meta.allTimeCoins) + '</b><br>' +
        'Puntos de legado: <b>' + S.currencies.legacy + '</b> (+' + (S.currencies.legacy * 3) + ' % de ingresos)'
      }));
      content.appendChild(st);
    });

    /* -------- Sistema -------- */
    makeTab('sistema', 'Sistema', function () {
      var sc = section('Guardado');
      var exp = Util.el('button', { class: 'xp-btn', text: 'Exportar código de guardado' });
      exp.addEventListener('click', function () {
        var code = NS.Save.exportSave(S);
        if (!code) { NS.UI.alert('Sistema', 'No se pudo exportar.', 'ic-error'); return; }
        NS.UI.dialog({
          title: 'Exportar guardado', icon: 'ic-save',
          message: 'Copia este código (incluye firma de integridad). Para importarlo en otro equipo, necesitas la misma instalación.',
          input: true, inputValue: code
        });
      });
      sc.appendChild(row('Exportar', exp));

      var imp = Util.el('button', { class: 'xp-btn', text: 'Importar código de guardado' });
      imp.addEventListener('click', function () {
        NS.UI.dialog({
          title: 'Importar guardado', icon: 'ic-save',
          message: 'Pega el código de guardado. Debe tener una firma válida.',
          input: true
        }).then(function (code) {
          if (!code) return;
          var res = NS.Save.importSave(code);
          if (!res.ok) { NS.UI.alert('Importar', 'Importación rechazada: ' + Util.esc(res.error), 'ic-error'); return; }
          NS.UI.confirm('Importar', '¿Sustituir la partida actual por la importada? Se guardará con la firma de esta instalación.')
            .then(function (ok) {
              if (!ok) return;
              var st = res.state;
              st.meta.installId = S.meta.installId; // la sal sigue siendo local
              NS.Save.wipe();
              NS.Save.save(st); // persistir la partida importada firmada localmente
              window.location.reload();
            });
        });
      });
      sc.appendChild(row('Importar', imp));
      content.appendChild(sc);

      var sf = section('Sistema');
      var fmt = Util.el('button', { class: 'xp-btn danger', text: 'Formatear C: (prestige)' });
      fmt.addEventListener('click', function () {
        var s = NS.State.get();
        var pending = Math.floor(10 * Math.sqrt(Math.max(0, s.meta.allTimeCoins))) - s.currencies.legacy;
        if (pending <= 0) {
          NS.UI.alert('Formatear', 'Aún no has acumulado suficiente legado. Sigue ganando NovaCoins (en total, histórico).', 'ic-warning');
          return;
        }
        NS.UI.confirm('Formatear C:',
          'Esto borra TODO tu progreso actual (dinero, seguidores, bots, mejoras, implantes, asaltos) a cambio de <b>' + pending +
          ' puntos de legado</b> (+3 % de ingresos permanentes cada uno).<br><br>Es el «prestige» de NovaVista. ¿Continuar?')
          .then(function (ok) {
            if (!ok) return;
            var r = NS.State.format();
            if (r.ok) {
              NS.Desktop.refresh();
              NS.Taskbar.buildStartMenu();
              NS.State.saveNow();
              if (NS.WM.isOpen('settings')) NS.WM.rerender('settings');
            } else NS.UI.alert('Formatear', 'No se pudo formatear.', 'ic-warning');
          });
      });
      sf.appendChild(row('Formatear sistema', fmt));
      content.appendChild(sf);

      var ab = section('Acerca de NovaVista 2004');
      ab.appendChild(Util.el('div', { class: 'cfg-info', html:
        'NovaVista 2004 Edition — un sistema operativo de ficción con juego incremental y rasgos roguelite.<br>' +
        '© 2004 NovaCorp Systems. Todo lo que ves es simulado. Ninguna conexión real se realiza.<br>' +
        'Núcleo v2 · Integridad de guardado: <b>firma verificada</b>.'
      }));
      content.appendChild(ab);
    });

    body.appendChild(tabs);
    body.appendChild(content);
    // activar primera pestaña
    var first = Util.$('.tab-btn', tabs);
    if (first) first.click();
  }

  NS.Apps.register({
    id: 'settings', title: 'Panel de control', icon: 'ic-settings',
    desktop: true, w: 520, h: 460, minW: 400, minH: 340,
    render: render
  });
})();
