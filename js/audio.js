/* Sentez ses efektleri + iOS dokunsal geri bildirim köprüsü */
(function () {
  let ctx = null, on = true;
  try { on = localStorage.getItem('md_sound') !== '0'; } catch (e) { }
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, dur, type = 'sine', vol = 0.2, when = 0, slide = 0) {
    const c = ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, freq, when = 0) {
    const c = ctx, t = c.currentTime + when;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
  }
  const S = {
    bell() { tone(1568, 0.9, 'sine', 0.14); tone(2093, 0.6, 'sine', 0.07); tone(1760, 0.8, 'sine', 0.1, 0.16); tone(2349, 0.5, 'sine', 0.05, 0.16); },
    ding() { tone(2637, 1.3, 'sine', 0.13); tone(3951, 0.7, 'sine', 0.04); },
    coin() { [0, 0.07, 0.13].forEach((w, i) => tone(1500 + i * 280, 0.14, 'triangle', 0.1, w)); noise(0.08, 0.05, 6000, 0.02); },
    pay() { noise(0.12, 0.12, 2500); noise(0.1, 0.1, 2200, 0.1); },
    stamp() { noise(0.1, 0.4, 700); tone(85, 0.2, 'sine', 0.45, 0, -40); },
    tap() { tone(520, 0.04, 'triangle', 0.05); },
    tick() { tone(1250, 0.025, 'square', 0.025); },
    bad() { tone(260, 0.3, 'sawtooth', 0.06, 0, -110); tone(196, 0.35, 'sawtooth', 0.05, 0.12, -80); },
    good() { tone(660, 0.12, 'triangle', 0.1); tone(990, 0.2, 'triangle', 0.1, 0.09); },
    page() { noise(0.2, 0.1, 3200); },
    scan() { tone(900, 0.5, 'sine', 0.03, 0, 500); },
    night() { tone(196, 1.4, 'sine', 0.06); tone(247, 1.4, 'sine', 0.05, 0.3); tone(294, 1.6, 'sine', 0.05, 0.6); },
  };
  MD.Audio = {
    play(n) { if (!on || !ac()) return; try { S[n] && S[n](); } catch (e) { } },
    unlock() { ac(); },
    get on() { return on; },
    set on(v) { on = v; try { localStorage.setItem('md_sound', v ? '1' : '0'); } catch (e) { } },
  };
  /* Karakter sesleri (Chatterbox ile önceden üretilmiş mp3'ler, vo/manifest.js listeler) */
  const cache = {};
  let cur = null;
  function variants(voice, base) {
    const m = MD.VO_MANIFEST;
    if (!m || !m[voice]) return [];
    return m[voice].filter(k => k === base || k.startsWith(base + '-'));
  }
  function decode(url) {
    if (!cache[url]) {
      const c = ac();
      cache[url] = fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => new Promise((res, rej) => c.decodeAudioData(b, res, rej)));
      cache[url].catch(() => { delete cache[url]; });
    }
    return cache[url];
  }
  MD.VO = {
    async play(voice, base) {
      if (!on || !voice || !base) return 0;
      const ks = variants(voice, base);
      if (!ks.length) return 0;
      const k = ks[Math.floor(Math.random() * ks.length)];
      try {
        const c = ac(); if (!c) return 0;
        const buf = await decode(`vo/${voice}/${k}.mp3`);
        MD.VO.stop();
        const s = c.createBufferSource(); s.buffer = buf;
        const g = c.createGain(); g.gain.value = 1.1;
        s.connect(g).connect(c.destination); s.start();
        cur = s;
        return buf.duration;
      } catch (e) { return 0; }
    },
    stop() { if (cur) { try { cur.stop(); } catch (e) { } cur = null; } },
    has: (voice, base) => variants(voice, base).length > 0,
  };

  MD.haptic = function (kind) {
    try { window.webkit.messageHandlers.haptic.postMessage(kind); } catch (e) { }
  };
})();
