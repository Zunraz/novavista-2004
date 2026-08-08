/* ============================================================
   NovaVista 2004 — NovaMedia Player
   Reproductor de música estilo 2000s (Winamp-esque) con skins
   exageradas y chiptunes generados proceduralmente en tiempo real.
   ============================================================ */
(function () {
  'use strict';
  var NS = window.NovaOS = window.NovaOS || {};
  var Util = NS.Util;

  /* ---------------- biblioteca procedural ---------------- */
  var SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10]
  };
  function genTrack(id, seed, cfg) {
    var rng = Util.mulberry32(seed);
    var scale = SCALES[cfg.scale];
    var notes = [];
    var steps = 64; // 8 compases de corcheas
    for (var i = 0; i < steps; i++) {
      // melodía: un 60 % de pasos suena, con pausas naturales
      if (rng() < 0.62) {
        var deg = scale[Math.floor(rng() * scale.length)];
        var oct = 4 + (rng() < 0.7 ? 0 : 1);
        notes.push({ step: i, midi: cfg.root + deg + oct * 12, len: (rng() < 0.3 ? 2 : 1) });
      }
    }
    var bass = [];
    for (var b = 0; b < 16; b++) {
      bass.push({ step: b * 4, midi: cfg.root + scale[b % scale.length] + 2 * 12, len: 2 });
    }
    var drums = [];
    for (var d = 0; d < 64; d++) {
      var kind = d % 8 === 0 ? 'kick' : (d % 4 === 2 ? 'snare' : (rng() < 0.12 ? 'hat' : null));
      if (kind) drums.push({ step: d, kind: kind });
    }
    return { id: id, name: cfg.name, artist: cfg.artist, bpm: cfg.bpm, era: cfg.era || 0, notes: notes, bass: bass, drums: drums };
  }
  function buildLibrary() {
    var lib = [
      genTrack('t1', 101, { name: 'Chips al amanecer', artist: '8-Bit Bros', bpm: 132, root: 48, scale: 'major', era: 0 }),
      genTrack('t2', 202, { name: 'Hielo binario', artist: '8-Bit Bros', bpm: 112, root: 45, scale: 'minor', era: 0 }),
      genTrack('t3', 303, { name: 'Descarga final', artist: 'Sebas el DJ', bpm: 142, root: 50, scale: 'dorian', era: 1 }),
      genTrack('t4', 404, { name: 'Subsuelo', artist: 'Sebas el DJ', bpm: 128, root: 43, scale: 'phrygian', era: 1 }),
      genTrack('t5', 505, { name: 'Neón 84', artist: 'Neón 84', bpm: 100, root: 52, scale: 'major', era: 2 }),
      genTrack('t6', 606, { name: 'Autopista nocturna', artist: 'Neón 84', bpm: 96, root: 47, scale: 'minor', era: 2 }),
      genTrack('t7', 707, { name: 'Memoria sintética', artist: 'N0VA_SYS', bpm: 118, root: 45, scale: 'phrygian', era: 3 }),
      genTrack('t8', 808, { name: 'Último arranque', artist: 'El Arquitecto', bpm: 150, root: 50, scale: 'dorian', era: 3 })
    ];
    var era = NS.State && NS.State.get() ? (NS.State.get().meta.era || 0) : 0;
    return lib.filter(function (t) { return t.era <= era; });
  }

  /* ---------------- motor de sonido ---------------- */
  var AC = null;
  var master = null;
  var analyser = null;
  var playing = false;
  var current = null;
  var curStep = 0;
  var nextTime = 0;
  var timer = null;
  var trackStart = 0;
  var elapsed = 0;
  var volGain = 1;

  function ensureAudio() {
    if (AC) return true;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      AC = new Ctx();
      master = AC.createGain();
      master.gain.value = volGain;
      analyser = AC.createAnalyser();
      analyser.fftSize = 128;
      master.connect(analyser);
      analyser.connect(AC.destination);
      return true;
    } catch (e) { return false; }
  }

  function osc(type, freq, when, dur, vol) {
    if (!AC) return;
    var o = AC.createOscillator();
    var g = AC.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(master);
    o.start(when);
    o.stop(when + dur + 0.05);
  }
  function noiseBurst(when, dur, vol, hp) {
    if (!AC) return;
    var len = Math.max(1, Math.floor(AC.sampleRate * dur));
    var buf = AC.createBuffer(1, len, AC.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = AC.createBufferSource();
    src.buffer = buf;
    var g = AC.createGain();
    g.gain.value = vol;
    var f = AC.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(when);
  }
  function noteOn(midi, when, dur) {
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    osc('square', f, when, dur * 0.9, 0.10);
    osc('square', f * 2.01, when, dur * 0.5, 0.03); // armónico
  }
  function bassOn(midi, when, dur) {
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    osc('triangle', f, when, dur * 0.95, 0.14);
  }

  function schedule() {
    if (!AC || !playing || !current) return;
    var spb = 60 / current.bpm / 2; // corchea
    while (nextTime < AC.currentTime + 0.12) {
      // batería
      current.drums.forEach(function (dr) {
        if (dr.step === curStep % 64) {
          var t = nextTime;
          if (dr.kind === 'kick') osc('sine', 150, t, 0.18, 0.5);
          else if (dr.kind === 'snare') noiseBurst(t, 0.12, 0.25, 1200);
          else noiseBurst(t, 0.04, 0.08, 6000);
        }
      });
      // bajo
      current.bass.forEach(function (bn) {
        if (bn.step === curStep % 64) bassOn(bn.midi, nextTime, spb * bn.len);
      });
      // melodía
      current.notes.forEach(function (n) {
        if (n.step === curStep % 64) noteOn(n.midi, nextTime, spb * n.len);
      });
      nextTime += spb;
      curStep++;
      if (curStep >= 64) curStep = 0;
    }
  }
  function schedulerLoop() {
    schedule();
    if (playing) timer = setTimeout(schedulerLoop, 40);
  }

  function play(track, autoNext) {
    if (!ensureAudio()) { NS.UI.toast('NovaMedia', 'Tu navegador no permite audio. La música solo se escucha con sonido activo.', 'dim', 'ic-music'); return; }
    if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    stopSilently();
    current = track;
    curStep = 0;
    elapsed = 0;
    trackStart = AC.currentTime;
    nextTime = AC.currentTime + 0.06;
    playing = true;
    schedule();
    timer = setTimeout(schedulerLoop, 40);
    var m = NS.State.get().media;
    m.currentTrack = track.id;
    NS.UI.toast('NovaMedia', '▶ ' + track.name + ' — ' + track.artist, '', 'ic-music');
    NS.Audio.ok();
  }
  function stopSilently() {
    playing = false;
    if (timer) { clearTimeout(timer); timer = null; }
  }
  function stopPlay() {
    stopSilently();
    if (AC && analyser) {
      // cortar notas: silencio maestro momentáneo
    }
    current = null;
    elapsed = 0;
  }
  function nextTrack(shuffle) {
    var lib = buildLibrary();
    var m = NS.State.get().media;
    if (shuffle) {
      var idx = Math.floor(Math.random() * lib.length);
      play(lib[idx], true);
      return;
    }
    var ci = lib.findIndex(function (t) { return t.id === (m.currentTrack || ''); });
    var ni = (ci + 1) % lib.length;
    play(lib[ni], true);
  }
  function prevTrack() {
    var lib = buildLibrary();
    var m = NS.State.get().media;
    var ci = lib.findIndex(function (t) { return t.id === (m.currentTrack || ''); });
    var pi = (ci - 1 + lib.length) % lib.length;
    play(lib[pi], true);
  }

  function trackElapsed() {
    if (!playing || !AC || !current) return elapsed;
    elapsed = AC.currentTime - trackStart;
    return elapsed;
  }

  /* ---------------- UI ---------------- */
  var SKINS = [
    { id: 'classic', name: 'Clásico' },
    { id: 'candy', name: 'Candy' },
    { id: 'hulk', name: 'Hulk' },
    { id: 'chrome', name: 'Cromo' },
    { id: 'neon', name: 'Neón' }
  ];

  function fmtT(s) {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ':' + Util.pad2(s % 60);
  }

  function render(body) {
    var S = NS.State.get();
    if (!S.media) S.media = { skin: 'classic', volume: 0.8, currentTrack: 't1', repeat: false, shuffle: false };
    var m = S.media;
    var eraIndex = S.meta.era || 0;
    var eraDef = NS.Catalog.ERAS[eraIndex];
    var eraSkins = ['classic', 'chrome', 'neon', 'candy'];
    if (m.eraSkinApplied !== eraIndex) { m.skin = eraSkins[eraIndex]; m.eraSkinApplied = eraIndex; }
    body.innerHTML = '';
    body.className = 'app-pad mp-body skin-' + m.skin + ' mp-era-' + eraDef.id;

    var lib = buildLibrary();
    var cur = lib.filter(function (t) { return t.id === m.currentTrack; })[0] || lib[0];
    volGain = m.volume;

    var main = Util.el('div', { class: 'mp-main' });
    main.appendChild(Util.el('div', { class: 'mp-era-label', text: eraDef.year + ' · ' + eraDef.name.toUpperCase() + ' · BIBLIOTECA ' + lib.length + '/8' }));

    // pantalla
    var disp = Util.el('div', { class: 'mp-display' });
    var trackLbl = Util.el('div', { class: 'mp-track', id: 'mp-track', text: '▶ ' + cur.name });
    var artistLbl = Util.el('div', { class: 'mp-time', id: 'mp-artist', text: cur.artist + ' · ' + cur.bpm + ' BPM' });
    disp.appendChild(trackLbl);
    disp.appendChild(artistLbl);
    var timeRow = Util.el('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '4px' } });
    var timeLbl = Util.el('span', { class: 'mp-time', id: 'mp-time', text: '0:00' });
    var durLbl = Util.el('span', { class: 'mp-time', text: fmtT(64 * 60 / cur.bpm / 2) });
    timeRow.appendChild(timeLbl);
    timeRow.appendChild(durLbl);
    disp.appendChild(timeRow);
    var prog = Util.el('div', { class: 'mp-progress', id: 'mp-progress' });
    prog.appendChild(Util.el('div', { style: { width: '0%' } }));
    prog.addEventListener('click', function (e) {
      if (!AC || !current) return;
      var r = prog.getBoundingClientRect();
      var frac = Util.clamp((e.clientX - r.left) / r.width, 0, 0.999);
      trackStart = AC.currentTime - frac * (64 * 60 / current.bpm / 2);
    });
    disp.appendChild(prog);
    main.appendChild(disp);

    // ecualizador (barras)
    var eq = Util.el('canvas', { class: 'mp-eq', id: 'mp-eq', width: 320, height: 52 });
    main.appendChild(eq);

    // controles
    var ctr = Util.el('div', { class: 'mp-controls' });
    var mk = function (label, fn, on) {
      var b = Util.el('button', { class: 'mp-btn' + (on ? ' on' : ''), text: label });
      b.addEventListener('click', fn);
      return b;
    };
    ctr.appendChild(mk('⏮', function () { prevTrack(); render(body); }));
    ctr.appendChild(mk(playing ? '⏸' : '▶', function () {
      if (playing) { stopPlay(); render(body); }
      else { play(cur); render(body); }
    }, playing));
    ctr.appendChild(mk('⏭', function () { nextTrack(m.shuffle); render(body); }));
    ctr.appendChild(mk('R', function () { m.repeat = !m.repeat; render(body); }, m.repeat));
    ctr.appendChild(mk('AZ', function () { m.shuffle = !m.shuffle; render(body); }, m.shuffle));
    ctr.appendChild(mk('■', function () { stopPlay(); render(body); }));
    main.appendChild(ctr);

    // volumen
    var volRow = Util.el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' } });
    volRow.appendChild(Util.el('span', { class: 'mp-time', text: 'Vol' }));
    var vol = Util.el('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(m.volume), style: { flex: '1' } });
    vol.addEventListener('input', function () {
      m.volume = parseFloat(vol.value) || 0;
      volGain = m.volume;
      if (master) master.gain.value = volGain;
    });
    volRow.appendChild(vol);
    main.appendChild(volRow);

    // skins
    var skinRow = Util.el('div', { class: 'mp-skin-row' });
    SKINS.forEach(function (sk) {
      var b = Util.el('button', { class: 'mp-skin' + (m.skin === sk.id ? ' on' : ''), text: sk.name });
      b.addEventListener('click', function () {
        m.skin = sk.id;
        render(body);
      });
      skinRow.appendChild(b);
    });
    main.appendChild(skinRow);
    main.appendChild(Util.el('div', { class: 'mp-time', style: { marginTop: '6px' }, text: 'Temas generados en tiempo real por tu tarjeta de sonido (estilo FM/chiptune). ¡Skins de la era dorada de los reproductores!' }));
    body.appendChild(main);

    // lista
    var list = Util.el('div', { class: 'mp-list' });
    lib.forEach(function (t) {
      var it = Util.el('div', { class: 'mp-list-item' + (t.id === m.currentTrack ? ' on' : '') });
      it.appendChild(Util.svgIcon('ic-music'));
      var info = Util.el('div', { style: { flex: '1' } });
      info.appendChild(Util.el('div', { class: 'mail-subj', text: t.name }));
      info.appendChild(Util.el('div', { class: 'cfg-sub', text: t.artist + ' · ' + t.bpm + ' BPM' }));
      it.appendChild(info);
      it.addEventListener('click', function () { play(t); render(body); });
      list.appendChild(it);
    });
    body.appendChild(list);

    // bucle de UI: tiempo + ecualizador
    var raf = null;
    function uiLoop() {
      var tLbl = Util.$('#mp-time');
      var trLbl = Util.$('#mp-track');
      if (tLbl && current) {
        var el2 = trackElapsed();
        tLbl.textContent = fmtT(el2);
        var total = 64 * 60 / current.bpm / 2;
        var bar = Util.$('#mp-progress > div');
        if (bar) bar.style.width = Math.min(100, el2 / total * 100) + '%';
        if (el2 >= total) {
          if (m.repeat) { play(current); }
          else { nextTrack(m.shuffle); }
          render(body);
          return;
        }
      }
      if (eq && AC && analyser && playing) {
        var data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        var ctx = eq.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(4,6,10,.85)';
          ctx.fillRect(0, 0, eq.width, eq.height);
          var bars = 32;
          var bw = eq.width / bars;
          for (var i = 0; i < bars; i++) {
            var v = data[Math.floor(i * data.length / bars)] / 255;
            ctx.fillStyle = 'rgba(90,255,160,.9)';
            ctx.fillRect(i * bw + 1, eq.height - v * eq.height, bw - 2, v * eq.height);
          }
        }
      }
      raf = requestAnimationFrame(uiLoop);
    }
    uiLoop();
    NS.Apps._mpCleanup = NS.Apps._mpCleanup || [];
    NS.Apps._mpCleanup.push(function () { if (raf) cancelAnimationFrame(raf); });
  }

  NS.Apps.register({
    id: 'player', title: 'NovaMedia Player', icon: 'ic-music',
    desktop: true, w: 420, h: 560, minW: 360, minH: 480,
    render: render,
    onClose: function () {
      stopSilently();
      if (NS.Apps._mpCleanup) {
        NS.Apps._mpCleanup.forEach(function (f) { try { f(); } catch (e) {} });
        NS.Apps._mpCleanup = [];
      }
    }
  });
  NS.MediaPlayer = { play: play, stop: stopPlay, next: nextTrack, prev: prevTrack };
})();
