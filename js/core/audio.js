/* ============================================================
   NovaVista 2004 — Sonido sintetizado (WebAudio, sin assets)
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};

  var ctx = null;
  var enabled = true;
  var master = null;

  function ensure() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  function tone(freq, dur, type, vol, delay, slide) {
    if (!enabled || !ensure()) return;
    try {
      var t0 = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    } catch (e) {}
  }

  var S = {
    setEnabled: function (on) { enabled = !!on; },
    isEnabled: function () { return enabled; },
    click: function () { tone(1400, 0.03, 'square', 0.05); },
    tick: function () { tone(900, 0.02, 'square', 0.03); },
    error: function () { tone(180, 0.18, 'sawtooth', 0.1, 0, 120); tone(140, 0.22, 'sawtooth', 0.08, 0.05, 90); },
    warn: function () { tone(520, 0.22, 'triangle', 0.12); tone(520, 0.22, 'triangle', 0.12, 0.28); },
    ok: function () { tone(880, 0.09, 'square', 0.08); tone(1320, 0.12, 'square', 0.08, 0.07); },
    cash: function () { tone(1040, 0.06, 'square', 0.07); tone(1560, 0.09, 'square', 0.07, 0.05); },
    hack: function () { tone(220, 0.05, 'sawtooth', 0.09); tone(330, 0.05, 'sawtooth', 0.09, 0.05); tone(495, 0.05, 'sawtooth', 0.09, 0.1); tone(660, 0.09, 'square', 0.1, 0.15); },
    trace: function () { tone(700, 0.1, 'triangle', 0.12, 0, 1200); tone(700, 0.1, 'triangle', 0.12, 0.16, 1400); },
    popup: function () { tone(600, 0.08, 'sine', 0.1); tone(900, 0.1, 'sine', 0.08, 0.07); },
    notify: function () { tone(1250, 0.09, 'sine', 0.09); tone(1250, 0.09, 'sine', 0.09, 0.13); },
    startup: function () {
      tone(523.25, 0.14, 'sine', 0.16); tone(659.25, 0.14, 'sine', 0.16, 0.12);
      tone(783.99, 0.14, 'sine', 0.16, 0.24); tone(1046.5, 0.5, 'sine', 0.2, 0.36);
    },
    shutdown: function () {
      tone(1046.5, 0.12, 'sine', 0.16); tone(783.99, 0.12, 'sine', 0.16, 0.12);
      tone(659.25, 0.12, 'sine', 0.16, 0.24); tone(523.25, 0.4, 'sine', 0.16, 0.36);
    },
    bootBeep: function () { tone(880, 0.05, 'square', 0.06); }
  };

  NS.Audio = S;
})();
