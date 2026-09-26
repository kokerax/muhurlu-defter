/* Procedural müzik ve ortam sesi (WebAudio, dış dosya yok, telifsiz).
   Sahneler: 'title' (hicaz taksimi), 'shop' (sokak uğultusu + martı + tramvay; gramofon varsa cızırtılı tango),
   'night' (dalga + cırcır böceği + uzak vapur düdüğü), 'auction' (kalabalık uğultusu). */
(function () {
  let ctx = null, master = null, on = true, scene = null, want = null, gramofon = false;
  try { on = localStorage.getItem('md_music') !== '0'; } catch (e) { }
  const timers = new Set();
  let nodes = [];

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function later(ms, fn) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); }
  function stopAll() {
    timers.forEach(clearTimeout); timers.clear();
    nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { } });
    nodes = [];
  }
  function noiseBuf(sec, brown) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function loopNoise(brown, freq, q, vol, lfo) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf(4, brown); s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(master); s.start();
    nodes.push(s);
    if (lfo) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = lfo; og.gain.value = vol * 0.8;
      o.connect(og).connect(g.gain); o.start(); nodes.push(o);
    }
    return g;
  }
  function note(f, t, dur, type, vol, dest, attack = 0.01) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---- çalgılar ---- */
  function oud(m, t, dur, dest, vol = 0.12) {
    const f = hz(m);
    note(f, t, dur, 'sawtooth', vol, dest, 0.004);
    note(f * 2.003, t, dur * 0.6, 'triangle', vol * 0.35, dest, 0.004);
  }
  function bandoneon(m, t, dur, dest, vol = 0.05) {
    [0, 0.12].forEach(det => note(hz(m) * (1 + det / 100), t, dur, 'sawtooth', vol, dest, 0.05));
  }
  function bass(m, t, dur, dest, vol = 0.14) { note(hz(m), t, dur, 'triangle', vol, dest, 0.005); }

  /* ---- hicaz taksimi (açılış) ---- */
  const HICAZ = [62, 63, 66, 67, 69, 70, 72, 74];
  function taksim() {
    if (scene !== 'title') return;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200; f.connect(master);
    const g = ctx.createGain(); g.gain.value = 1; g.connect(f);
    let t = ctx.currentTime + 0.1, i = 4;
    const phrase = [];
    for (let k = 0; k < 14; k++) { i = Math.max(0, Math.min(HICAZ.length - 1, i + [-1, -1, 1, 1, 2, -2, 0][Math.floor(Math.random() * 7)])); phrase.push(HICAZ[i]); }
    phrase.push(62);
    phrase.forEach((m, k) => {
      const d = k === phrase.length - 1 ? 2.2 : [0.28, 0.28, 0.56, 0.42][k % 4];
      oud(m, t, d * 1.6, g); if (k % 4 === 0) oud(m - 12, t, d * 2, g, 0.06);
      t += d;
    });
    later((t - ctx.currentTime + 1.4) * 1000, taksim);
  }

  /* ---- tango (gramofon) ---- */
  const TANGO_MEL = [[69, 1], [72, .5], [71, .5], [69, 1], [64, 1], [65, 1.5], [64, .5], [62, 1], [60, 1], [64, 1], [69, .5], [68, .5], [69, 1], [71, 1], [72, 1.5], [71, .5], [69, 2]];
  const TANGO_BASS = [45, 45, 40, 40, 38, 38, 40, 40];
  function tango() {
    if (scene !== 'shop' || !gramofon) return;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0.7; bp.connect(g).connect(master);
    const beat = 60 / 108;
    let t = ctx.currentTime + 0.1;
    TANGO_BASS.forEach((m, bar) => {
      const b0 = t + bar * beat * 2;
      bass(m, b0, beat * 0.7, bp); bass(m, b0 + beat * 0.75, beat * 0.25, bp, 0.1); bass(m + 7, b0 + beat, beat * 0.5, bp, 0.1); bass(m, b0 + beat * 1.5, beat * 0.5, bp, 0.1);
    });
    let mt = t;
    TANGO_MEL.forEach(([m, d]) => { bandoneon(m, mt, d * beat * 0.95, bp); mt += d * beat; });
    // cızırtı
    for (let k = 0; k < 40; k++) {
      const ct = t + Math.random() * 16 * beat;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf(0.02, false);
      const cg = ctx.createGain(); cg.gain.value = 0.02 + Math.random() * 0.03; s.connect(cg).connect(master); s.start(ct);
    }
    later((16 * beat) * 1000, tango);
  }

  /* ---- ortam olayları ---- */
  function gull() {
    if (scene !== 'shop' && scene !== 'night') return;
    const t = ctx.currentTime, g = ctx.createGain(); g.gain.value = 0.04; g.connect(master);
    [0, 0.22, 0.4].forEach(d => {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(1700, t + d); o.frequency.exponentialRampToValueAtTime(1100, t + d + 0.18);
      og.gain.setValueAtTime(0.0001, t + d); og.gain.exponentialRampToValueAtTime(1, t + d + 0.03); og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
      o.connect(og).connect(g); o.start(t + d); o.stop(t + d + 0.25);
    });
    later(9000 + Math.random() * 16000, gull);
  }
  function tram() {
    if (scene !== 'shop') return;
    const t = ctx.currentTime;
    [0, 0.25].forEach(d => { note(1480, t + d, 0.5, 'sine', 0.025, master); note(2220, t + d, 0.3, 'sine', 0.01, master); });
    later(25000 + Math.random() * 30000, tram);
  }
  function crickets() {
    if (scene !== 'night') return;
    const t = ctx.currentTime;
    for (let k = 0; k < 6; k++) note(4200 + Math.random() * 300, t + k * 0.07, 0.04, 'sine', 0.008, master);
    later(700 + Math.random() * 1500, crickets);
  }
  function horn() {
    if (scene !== 'night') return;
    const t = ctx.currentTime;
    note(110, t, 2.6, 'sawtooth', 0.02, master, 0.4); note(165, t, 2.6, 'sawtooth', 0.012, master, 0.4);
    later(30000 + Math.random() * 30000, horn);
  }

  function fadeTo(v, sec = 1.2) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + sec);
  }

  function start(name) {
    scene = name;
    stopAll();
    if (!name || !on || !ac()) return;
    fadeTo(0.9);
    if (name === 'title') taksim();
    if (name === 'shop') { loopNoise(true, 500, 0.6, 0.05, 0.07); later(3000, gull); later(12000, tram); tango(); }
    if (name === 'night') { loopNoise(true, 350, 0.5, 0.09, 0.12); crickets(); later(6000, horn); later(15000, gull); }
    if (name === 'auction') { loopNoise(true, 800, 0.8, 0.07, 0.3); }
  }

  MD.Music = {
    scene(name) { want = name; if (name === scene && nodes.length) return; start(name); },
    setGramofon(v) { const was = gramofon; gramofon = v; if (v && !was && scene === 'shop' && ctx) tango(); },
    get on() { return on; },
    set on(v) { on = v; try { localStorage.setItem('md_music', v ? '1' : '0'); } catch (e) { } start(v ? want : null); },
    unlock() { ac(); },
  };
})();
