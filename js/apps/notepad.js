/* ============================================================
   NovaVista 2004 — Bloc de notas
   Documentos persistentes por cuenta (guardados firmados).
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var currentDoc = null;

  function docs() {
    var S = NS.State.get();
    if (!S.docs) S.docs = [];
    return S.docs;
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad';

    var cols = Util.el('div', { class: 'files-cols' });
    var left = Util.el('div', { class: 'files-col', style: { flex: '0 0 170px' } });
    var p1 = Util.el('div', { class: 'panel' });
    p1.appendChild(Util.el('div', { class: 'panel-title', text: 'Documentos' }));
    var d = docs();
    if (!d.length) p1.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Sin documentos. Crea uno nuevo.' }));
    d.forEach(function (doc) {
      var r = Util.el('div', { class: 'mail-row clickable' + (currentDoc === doc ? ' mail-done' : '') });
      r.appendChild(Util.svgIcon('ic-doc'));
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'mail-subj', text: doc.title }));
      info.appendChild(Util.el('div', { class: 'cfg-sub', text: Util.fmtDate(doc.at || Date.now()) }));
      r.appendChild(info);
      r.addEventListener('click', function () {
        currentDoc = doc;
        NS.WM.rerender('notepad');
        var ta = Util.$('#notepad-ta');
        if (ta) ta.value = doc.text;
      });
      var del = Util.el('button', { class: 'xp-btn small danger', text: '✕' });
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        d.splice(d.indexOf(doc), 1);
        if (currentDoc === doc) currentDoc = null;
        NS.WM.rerender('notepad');
      });
      r.appendChild(del);
      p1.appendChild(r);
    });
    var nuevo = Util.el('button', { class: 'xp-btn small', text: '+ Nuevo documento' });
    nuevo.addEventListener('click', function () {
      var doc = { title: 'Sin título ' + (d.length + 1), text: '', at: Date.now() };
      d.push(doc);
      currentDoc = doc;
      NS.WM.rerender('notepad');
    });
    p1.appendChild(nuevo);
    left.appendChild(p1);
    cols.appendChild(left);

    var right = Util.el('div', { class: 'files-col' });
    if (!currentDoc) {
      right.appendChild(Util.el('div', { class: 'cfg-info', text: 'Selecciona o crea un documento para empezar a escribir.' }));
    } else {
      var p2 = Util.el('div', { class: 'panel' });
      var titlerow = Util.el('div', { class: 'trade-row' });
      var title = Util.el('input', { class: 'xp-input', id: 'notepad-title', value: currentDoc.title, maxlength: '40', style: { flex: '1' } });
      titlerow.appendChild(title);
      var saveBtn = Util.el('button', { class: 'xp-btn primary small', text: 'Guardar' });
      saveBtn.addEventListener('click', function () {
        currentDoc.title = title.value.trim().slice(0, 40) || 'Sin título';
        currentDoc.text = Util.$('#notepad-ta').value;
        currentDoc.at = Date.now();
        NS.State.saveNow();
        NS.Audio.cash();
        NS.UI.toast('Bloc de notas', 'Documento guardado en tu cuenta.', 'good', 'ic-notepad');
        NS.WM.rerender('notepad');
      });
      titlerow.appendChild(saveBtn);
      p2.appendChild(titlerow);
      var ta = Util.el('textarea', { class: 'xp-input notepad-ta', id: 'notepad-ta', placeholder: 'Escribe aquí...' });
      ta.value = currentDoc.text;
      p2.appendChild(ta);
      var infoLine = Util.el('div', { class: 'cfg-sub', id: 'notepad-info', text: '' });
      ta.addEventListener('input', function () {
        infoLine.textContent = Util.fmtInt(ta.value.length) + ' caracteres · ' + (ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0) + ' palabras';
      });
      p2.appendChild(infoLine);
      right.appendChild(p2);
    }
    cols.appendChild(right);
    body.appendChild(cols);
  }

  NS.Apps.register({
    id: 'notepad', title: 'Bloc de notas', icon: 'ic-notepad',
    desktop: true, w: 560, h: 440, minW: 440, minH: 340,
    render: render
  });
})();
