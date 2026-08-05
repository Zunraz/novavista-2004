/* ============================================================
   NovaVista 2004 — Inicio de sesión (cuentas de usuario locales)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var AVS = function () { return NS.Catalog ? NS.Catalog.AVATARS : ['ic-hacker']; };

  var bound = false;
  function show() {
    NS.Save.migrateLegacy();
    Util.$('#login-screen').classList.remove('hidden');
    if (!bound) {
      bound = true;
      Util.$('#login-new').addEventListener('click', createForm);
    }
    renderUsers();
  }

  function hide() {
    Util.$('#login-screen').classList.add('hidden');
  }

  function renderUsers() {
    var box = Util.$('#login-users');
    box.innerHTML = '';
    var profs = NS.Save.listProfiles();
    if (!profs.length) {
      box.appendChild(Util.el('div', { class: 'empty', text: 'Aún no hay cuentas. Crea la primera para empezar a jugar.' }));
    }
    profs.forEach(function (p) {
      var row = Util.el('div', { class: 'login-user' });
      row.appendChild(Util.svgIcon(AVS()[(p.avatar || 0) % AVS().length], 'icon icon-48'));
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'lu-name', text: p.name }));
      info.appendChild(Util.el('div', { class: 'lu-sub', text: 'Nivel ' + (p.level || 1) + ' · Última sesión: ' + Util.fmtDate(p.lastSeen || Date.now()) }));
      row.appendChild(info);
      row.appendChild(Util.el('span', { class: 'lu-lvl', text: 'Nv ' + (p.level || 1) }));
      row.addEventListener('click', function () {
        NS.Save.setProfile(p.id);
        enter();
      });
      box.appendChild(row);
    });
  }

  function createForm() {
    var box = Util.$('#login-box');
    box.innerHTML = '';
    box.appendChild(Util.el('div', { class: 'login-title', text: 'Nueva cuenta' }));
    box.appendChild(Util.el('div', { class: 'login-sub', text: 'Elige un nombre y un avatar. Tu progreso se guarda aparte para cada cuenta.' }));

    var inp = Util.el('input', { class: 'xp-input', type: 'text', maxlength: '20', placeholder: 'Nombre de usuario', style: { width: '70%', marginBottom: '12px' } });
    box.appendChild(inp);

    var avRow = Util.el('div', { class: 'avatar-row', style: { justifyContent: 'center', marginBottom: '14px' } });
    var sel = 0;
    AVS().forEach(function (ic, idx) {
      var b = Util.el('button', { class: 'avatar-pick' + (idx === 0 ? ' on' : '') });
      b.appendChild(Util.svgIcon(ic, 'icon icon-32'));
      b.addEventListener('click', function () {
        Util.$$('.avatar-pick', avRow).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        sel = idx;
      });
      avRow.appendChild(b);
    });
    box.appendChild(avRow);

    var btns = Util.el('div', { class: 'dialog-btns' });
    var ok = Util.el('button', { class: 'xp-btn primary', text: 'Crear cuenta y entrar' });
    ok.addEventListener('click', function () {
      var name = inp.value.trim().slice(0, 20) || 'Usuario';
      var p = NS.Save.createProfile(name, sel);
      NS.Save.setProfile(p.id);
      enter();
    });
    var cancel = Util.el('button', { class: 'xp-btn', text: 'Cancelar' });
    cancel.addEventListener('click', function () {
      box.innerHTML = '';
      box.appendChild(Util.el('div', { class: 'login-title', text: 'NovaVista 2004' }));
      box.appendChild(Util.el('div', { class: 'login-sub', text: 'Para comenzar, haga clic en su nombre de usuario' }));
      var users = Util.el('div', { id: 'login-users' });
      box.appendChild(users);
      var nb = Util.el('button', { class: 'xp-btn primary', id: 'login-new', text: 'Crear cuenta nueva...' });
      nb.addEventListener('click', createForm);
      box.appendChild(nb);
      renderUsers();
    });
    btns.appendChild(ok);
    btns.appendChild(cancel);
    box.appendChild(btns);
    inp.focus();
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok.click(); });
  }

  function enter() {
    hide();
    NS.Main.enterDesktop();
  }

  function logout() {
    NS.State.saveNow();
    window.location.reload();
  }

  function init() {
    Util.$('#login-new').addEventListener('click', createForm);
  }

  NS.Login = { init: init, show: show, hide: hide, logout: logout };
})();