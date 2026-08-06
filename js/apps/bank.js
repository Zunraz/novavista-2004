/* ============================================================
   NovaVista 2004 — Primer Banco Nova
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  var priceHist = [];

  function upgBtn(id, label) {
    var S = NS.State.get();
    var def = NS.Catalog.UPGRADES[id];
    var lvl = S.upg[id] || 0;
    var cost = NS.Catalog.upgradeCost(def, lvl);
    var maxed = lvl >= def.max;
    var b = Util.el('button', {
      class: 'xp-btn small',
      text: label + ' (nivel ' + lvl + ')' + (maxed ? ' — MÁX' : ' — ' + Util.fmtMoney(cost))
    });
    b.disabled = maxed || S.currencies.cash < cost;
    b.addEventListener('click', function () {
      var r = NS.State.buyUpgrade(id);
      if (!r.ok && r.why === 'dinero') NS.UI.toast('Banco', 'Fondos insuficientes.', 'important', 'ic-error');
      NS.WM.rerender('bank');
    });
    return b;
  }

  function panel(title) {
    var p = Util.el('div', { class: 'panel' });
    p.appendChild(Util.el('div', { class: 'panel-title', text: title }));
    return p;
  }

  function renderTabs(body) {
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

    /* -------- Cuenta -------- */
    makeTab('cuenta', 'Cuenta', function () {
      var S = NS.State.get();
      var p = panel('Saldo e intereses');
      var bal = Util.el('div', { class: 'bank-balance', id: 'bank-balance', text: Util.fmtMoney(S.bank.balance) });
      p.appendChild(bal);
      var info = Util.el('div', { class: 'cfg-info', id: 'bank-info', html:
        'Interés actual: <b>' + Util.fmtPct(NS.State.bankRate()) + '/s</b> → <b>' + Util.fmtMoney(S.bank.balance * NS.State.bankRate()) + '/s</b><br>' +
        'Interés total acumulado: <b>' + Util.fmtMoney(S.bank.totalInterest) + '</b>'
      });
      p.appendChild(info);
      p.appendChild(Util.el('div', { class: 'cfg-sub', text: 'Efectivo disponible: ' + Util.fmtMoney(S.currencies.cash) }));

      // depósito / retiro
      var ops = Util.el('div', { class: 'trade-row' });
      var inp = Util.el('input', { class: 'xp-input', id: 'bank-amount', type: 'number', min: '1', value: '100', style: { width: '90px' } });
      var dep = Util.el('button', { class: 'xp-btn small', text: 'Depositar' });
      dep.addEventListener('click', function () {
        var n = parseFloat(inp.value) || 0;
        var r = NS.State.deposit(n);
        if (!r.ok) NS.UI.toast('Banco', 'No tienes ese efectivo.', 'important', 'ic-error');
        else NS.Audio.cash();
        NS.WM.rerender('bank');
      });
      var depAll = Util.el('button', { class: 'xp-btn small', text: 'Depositar todo' });
      depAll.addEventListener('click', function () {
        var r = NS.State.deposit(S.currencies.cash);
        if (r.ok) { NS.Audio.cash(); NS.UI.toast('Banco', 'Depositados ' + Util.fmtMoney(r.amount) + ' a tu cuenta.', 'good', 'ic-bank'); }
        NS.WM.rerender('bank');
      });
      var wit = Util.el('button', { class: 'xp-btn small', text: 'Retirar' });
      wit.addEventListener('click', function () {
        var n = parseFloat(inp.value) || 0;
        var r = NS.State.withdraw(n);
        if (!r.ok) NS.UI.toast('Banco', 'El saldo es insuficiente.', 'important', 'ic-error');
        else NS.Audio.cash();
        NS.WM.rerender('bank');
      });
      var witAll = Util.el('button', { class: 'xp-btn small', text: 'Retirar todo' });
      witAll.addEventListener('click', function () {
        var r = NS.State.withdraw(S.bank.balance);
        if (r.ok) { NS.Audio.cash(); NS.UI.toast('Banco', 'Retirados ' + Util.fmtMoney(r.amount) + ' a tu efectivo.', 'good', 'ic-bank'); }
        NS.WM.rerender('bank');
      });
      ops.appendChild(inp); ops.appendChild(dep); ops.appendChild(depAll); ops.appendChild(wit); ops.appendChild(witAll);
      p.appendChild(ops);
      p.appendChild(Util.el('div', { class: 'cfg-sub', text: 'El interés se calcula sobre el saldo en la cuenta. Deja dinero aquí para que trabaje por ti.' }));
      content.appendChild(p);
      var p2 = panel('Mejoras de interés');
      p2.appendChild(upgBtn('b-rate', 'Mejora de intereses'));
      p2.appendChild(upgBtn('b-cd', 'Certificado de depósito'));
      p2.appendChild(upgBtn('b-off', 'Cuenta offshore'));
      content.appendChild(p2);
    });

    /* -------- Minería -------- */
    makeTab('mineria', 'Minería', function () {
      var S = NS.State.get();
      var p = panel('Botnet de NovaCoins');
      p.appendChild(Util.el('div', { class: 'bank-balance', id: 'bank-bots', text: S.bots.count + ' bots' }));
      p.appendChild(Util.el('div', { class: 'cfg-info', html:
        'Producción: <b>' + NS.State.botCoinRate().toFixed(3).replace('.', ',') + ' NovaCoins/s</b> ' +
        '(≈ ' + (NS.State.botCoinRate() * 60).toFixed(1).replace('.', ',') + ' /min)<br>' +
        'Cartera de NovaCoins: <b>' + S.currencies.novaCoins.toFixed(2).replace('.', ',') + '</b>'
      }));
      content.appendChild(p);
      var p2 = panel('Hardware de minería');
      p2.appendChild(upgBtn('b-count', 'Comprar bot zombie'));
      p2.appendChild(upgBtn('b-rig', 'Granja de minería'));
      content.appendChild(p2);
      var p3 = panel('¿Qué son las NovaCoins?');
      p3.appendChild(Util.el('div', { class: 'cfg-info', html: 'Las NovaCoins son la moneda <b>meta</b>: sobreviven a cada asalto y se gastan en implantes (app Mapa de Red → Equipo). También alimentan tu <b>legado</b> al formatear el sistema.' }));
      content.appendChild(p3);
    });

    /* -------- Mercado -------- */
    makeTab('mercado', 'Mercado', function () {
      var S = NS.State.get();
      var p = panel('Mercado de NovaCoins');
      p.appendChild(Util.el('div', { class: 'bank-balance', id: 'bank-price', text: '1 NC = ' + Util.fmtMoney(S.bank.price) }));
      p.appendChild(Util.el('div', { class: 'cfg-info', text: 'Compra barato, vende caro. El precio fluctúa con el tiempo.' }));
      // mini gráfico
      var chart = Util.el('div', { class: 'spark' });
      priceHist.slice(-40).forEach(function (v) {
        var d = Util.el('div', { class: 'spark-bar' });
        d.style.height = (v / 60 * 100) + '%';
        chart.appendChild(d);
      });
      p.appendChild(chart);

      var buyRow = Util.el('div', { class: 'trade-row' });
      buyRow.appendChild(Util.el('span', { text: 'Comprar:' }));
      [10, 50, 250].forEach(function (n) {
        var b = Util.el('button', {
          class: 'xp-btn small',
          text: n + ' NC (' + Util.fmtMoney(n * S.bank.price) + ')'
        });
        b.disabled = S.currencies.cash < n * S.bank.price;
        b.addEventListener('click', function () {
          var r = NS.State.buyCoins(n);
          if (!r.ok) NS.UI.toast('Mercado', 'No tienes efectivo suficiente.', 'important', 'ic-error');
          NS.Audio.cash();
          NS.WM.rerender('bank');
        });
        buyRow.appendChild(b);
      });
      p.appendChild(buyRow);
      var sellRow = Util.el('div', { class: 'trade-row' });
      sellRow.appendChild(Util.el('span', { text: 'Vender:' }));
      [10, 50, 250].forEach(function (n) {
        var b = Util.el('button', {
          class: 'xp-btn small',
          text: n + ' NC (' + Util.fmtMoney(n * S.bank.price * 0.85) + ')'
        });
        b.disabled = S.currencies.novaCoins < n;
        b.addEventListener('click', function () {
          var r = NS.State.sellCoins(n);
          if (!r.ok) NS.UI.toast('Mercado', 'No tienes suficientes NovaCoins.', 'important', 'ic-error');
          NS.Audio.cash();
          NS.WM.rerender('bank');
        });
        sellRow.appendChild(b);
      });
      p.appendChild(sellRow);
      content.appendChild(p);
    });

    /* -------- Préstamos -------- */
    makeTab('prestamos', 'Préstamos', function () {
      var S = NS.State.get();
      var p = panel('Crédito personal');
      p.appendChild(Util.el('div', { class: 'cfg-info', html:
        'Deuda pendiente: <b>' + Util.fmtMoney(S.bank.loanDebt) + '</b><br>' +
        'Interés de la deuda: 0,18 %/h (se acumula solo).'
      }));
      if (S.bank.loanDebt > 0) {
        var repay = Util.el('button', {
          class: 'xp-btn primary',
          text: 'Pagar toda la deuda (' + Util.fmtMoney(S.bank.loanDebt) + ')'
        });
        repay.disabled = S.currencies.cash < S.bank.loanDebt;
        repay.addEventListener('click', function () {
          var r = NS.State.loanRepay();
          if (!r.ok) NS.UI.toast('Banco', 'No tienes efectivo para cubrir la deuda.', 'important', 'ic-error');
          NS.Audio.cash();
          NS.WM.rerender('bank');
        });
        p.appendChild(repay);
      }
      content.appendChild(p);
      var p2 = panel('Pedir dinero prestado');
      [1000, 5000, 20000].forEach(function (amt) {
        var b = Util.el('button', {
          class: 'xp-btn small',
          text: 'Pedir ' + Util.fmtMoney(amt)
        });
        b.addEventListener('click', function () {
          var r = NS.State.loanTake(amt);
          if (r.ok) { NS.Audio.cash(); NS.UI.toast('Banco', 'Préstamo de ' + Util.fmtMoney(amt) + ' ingresado. ¡No olvides pagarlo!', 'good', 'ic-bank'); }
          NS.WM.rerender('bank');
        });
        p2.appendChild(b);
      });
      content.appendChild(p2);
    });

    body.appendChild(tabs);
    body.appendChild(content);
    var first = Util.$('.tab-btn', tabs);
    if (first) first.click();
  }

  function render(body) {
    body.innerHTML = '';
    body.className = 'app-pad';
    renderTabs(body);
  }

  NS.Apps.register({
    id: 'bank', title: 'Primer Banco Nova', icon: 'ic-bank',
    desktop: true, w: 520, h: 500, minW: 440, minH: 400,
    render: render,
    tick: function () {
      var S = NS.State.get();
      priceHist.push(S.bank.price);
      if (priceHist.length > 60) priceHist.shift();
      // actualización en vivo del saldo, el interés y los bots
      var bal = Util.$('#bank-balance');
      if (bal) bal.textContent = Util.fmtMoney(S.bank.balance);
      var info = Util.$('#bank-info');
      if (info) info.innerHTML =
        'Interés actual: <b>' + Util.fmtPct(NS.State.bankRate()) + '/s</b> → <b>' + Util.fmtMoney(S.bank.balance * NS.State.bankRate()) + '/s</b><br>' +
        'Interés total acumulado: <b>' + Util.fmtMoney(S.bank.totalInterest) + '</b>';
      var bots = Util.$('#bank-bots');
      if (bots) bots.textContent = S.bots.count + ' bots';
      var price = Util.$('#bank-price');
      if (price) price.textContent = '1 NC = ' + Util.fmtMoney(S.bank.price);
    }
  });
})();
