/* İnceleme masası: büyüteç, mihenk taşı/tiner bezi ve katalog mini oyunları.
   MD.Bench.run(tool, item, baseMin) → Promise<dakika>. Hızlı bakış: baseMin + 5. */
(function () {
  const { rnd, ri, pick, clamp, shuffle } = MD.U;
  const D = MD.D;
  const METAL = new Set(['ring', 'necklace', 'watch', 'pistol', 'dagger', 'candle', 'coffee', 'gramophone', 'bust']);
  const isMetal = it => METAL.has(it.cat);
  const toolName = (t, it) => t === 'c' ? 'Büyüteç' : t === 'p' ? 'Fiyat Kataloğu' : (isMetal(it) ? 'Mihenk Taşı' : 'Tiner Bezi');

  const FLAWS = [
    ['çatlak', 'pas', 'eksik parça'],
    ['çizik', 'aşınma', 'damga'],
    ['damga', 'ince çizik', 'temiz yüzey'],
    ['usta damgası', 'temiz yüzey', 'parlak cila'],
  ];

  let root = null;
  function overlay(html) {
    root = document.createElement('div');
    root.id = 'bench';
    root.innerHTML = `<div class="bench-card">${html}</div>`;
    document.getElementById('app').appendChild(root);
    requestAnimationFrame(() => root.classList.add('open'));
    return root;
  }
  function close() {
    if (!root) return;
    const r = root; root = null;
    r.classList.remove('open');
    setTimeout(() => r.remove(), 220);
  }
  function frame(title, hint, stage, it) {
    return `<div class="bench-head"><b>${title}</b><span>${it.name}</span></div>
      <div class="bench-stage" id="bStage">${stage}</div>
      <p class="bench-hint" id="bHint">${hint}</p>
      <div class="bench-bar"><i id="bBar"></i></div>
      <div class="acts"><button class="btn" data-b="skip">Hızlı bak <small>(+5 dk)</small></button></div>`;
  }
  function art(it, extra = '') { return `<svg viewBox="0 0 100 100" class="bench-art" ${extra}>${MD.Art.inner(it)}</svg>`; }
  function wire(res, baseMin, t0) {
    root.querySelector('[data-b="skip"]').addEventListener('click', () => { MD.Audio.play('tap'); done(res, baseMin + 5); });
  }
  let finished = false;
  function done(res, min) {
    if (finished) return;
    finished = true;
    setTimeout(close, 450);
    res(Math.max(3, Math.round(min)));
  }
  const pt = (e, el) => { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, r]; };

  /* --- büyüteç: kusur/damga ara --- */
  function lens(it, baseMin) {
    return new Promise(res => {
      finished = false;
      const spots = [];
      const flaws = shuffle(FLAWS[it.c]);
      for (let i = 0; i < 3; i++) {
        let x, y, tries = 0;
        do { x = rnd(0.24, 0.76); y = rnd(0.24, 0.76); tries++; } while (tries < 30 && spots.some(s => Math.hypot(s.x - x, s.y - y) < 0.22));
        spots.push({ x, y, label: flaws[i], found: false, t: 0 });
      }
      overlay(frame('Büyüteç', 'Parmağını eşyanın üstünde gezdir. Üç iz bul: kusur, damga, işçilik.', `
        <div class="blur-layer">${art(it)}</div>
        <div class="lens" id="bLens"><div class="lens-in">${art(it)}</div></div>
        <div id="bPins"></div>`, it));
      const stage = root.querySelector('#bStage'), L = root.querySelector('#bLens'), inner = L.querySelector('.lens-in'), pins = root.querySelector('#bPins');
      const t0 = performance.now();
      let pos = null, last = performance.now();
      const place = (x, y, r) => {
        const R = L.offsetWidth / 2;
        L.style.transform = `translate(${x * r.width - R}px, ${y * r.height - R}px)`;
        inner.style.width = r.width * 2 + 'px'; inner.style.height = r.height * 2 + 'px';
        inner.style.transform = `translate(${-(x * r.width * 2 - R)}px, ${-(y * r.height * 2 - R)}px)`;
      };
      const move = e => { const [x, y, r] = pt(e, stage); pos = [clamp(x, 0, 1), clamp(y, 0, 1)]; place(pos[0], pos[1], r); L.classList.add('on'); };
      stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); move(e); });
      stage.addEventListener('pointermove', move);
      wire(res, baseMin, t0);
      const loop = now => {
        if (finished) return;
        const dt = (now - last) / 1000; last = now;
        if (pos) spots.forEach(s => {
          if (s.found) return;
          if (Math.hypot(s.x - pos[0], s.y - pos[1]) < 0.11) {
            s.t += dt;
            if (s.t > 0.35) {
              s.found = true; MD.Audio.play('tick'); MD.haptic('light');
              pins.insertAdjacentHTML('beforeend', `<span class="flaw ${it.c <= 1 && s.label !== 'damga' ? 'bad' : 'good'}" style="left:${s.x * 100}%;top:${s.y * 100}%">${s.label}</span>`);
            }
          } else s.t = 0;
        });
        const n = spots.filter(s => s.found).length, el = (now - t0) / 1000;
        root.querySelector('#bBar').style.width = (n / 3 * 100) + '%';
        if (n === 3 || el > 9) {
          root.querySelector('#bHint').textContent = n === 3 ? 'Üç izi de buldun.' : 'Yeterince baktın.';
          return done(res, baseMin * (0.5 + Math.min(1, el / 9) * 0.5) + (n < 3 ? 3 : 0));
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }

  /* --- mihenk taşı / tiner bezi: sürt, izin rengini oku --- */
  function rub(it, baseMin) {
    return new Promise(res => {
      finished = false;
      const metal = isMetal(it);
      const col = it.fake ? (metal ? '#7d8a5a' : '#c9d6e0') : (metal ? '#e2b64c' : '#8a5a2a');
      overlay(frame(metal ? 'Mihenk Taşı' : 'Tiner Bezi',
        metal ? 'Eşyayı taşın üstünde sağa sola sürt. Bıraktığı izin rengine bak: altın sarısı hakiki, soluk yeşil sahte.'
          : 'Bezi köşeye sürt. Alttan eski boya çıkarsa hakiki, taze boya bulaşırsa sahte.',
        `<div class="rub-item" id="bItem">${art(it)}</div>
         <svg class="rub-stone" viewBox="0 0 200 60" preserveAspectRatio="none">
           <rect x="2" y="2" width="196" height="56" rx="10" fill="${metal ? '#1b1b1f' : '#efe6cf'}" stroke="#24160d" stroke-width="3"/>
           ${metal ? '' : '<path d="M10,50 Q60,40 110,52 T190,46" stroke="#b9a684" stroke-width="2" fill="none"/>'}
           <path id="bStreak" d="" stroke="${col}" stroke-width="9" stroke-linecap="round" fill="none" opacity=".9"/>
         </svg>`, it));
      const stage = root.querySelector('#bStage'), item = root.querySelector('#bItem'), streak = root.querySelector('#bStreak');
      const t0 = performance.now();
      let lastX = null, dist = 0, pts = [], dir = 0, passes = 0;
      const move = e => {
        const [x, y, r] = pt(e, stage);
        item.style.transform = `translate(${(x - 0.5) * r.width}px, ${(clamp(y, 0.2, 0.85) - 0.35) * r.height}px) rotate(${(x - 0.5) * 20}deg)`;
        if (lastX != null && y > 0.45) {
          const dx = x - lastX; dist += Math.abs(dx);
          const nd = Math.sign(dx);
          if (nd && nd !== dir) { passes++; dir = nd; if (passes % 2) MD.Audio.play('tick'); }
          pts.push([clamp(x, 0.05, 0.95) * 200, 30 + Math.sin(pts.length) * 6]);
          if (pts.length > 60) pts.shift();
          streak.setAttribute('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L'));
        }
        lastX = x;
        const p = clamp(dist / 3, 0, 1);
        root.querySelector('#bBar').style.width = p * 100 + '%';
        if (p >= 1) {
          root.querySelector('#bHint').textContent = it.fake ? (metal ? 'İz soluk ve yeşilimsi.' : 'Taze boya bulaştı.') : (metal ? 'İz parlak altın sarısı.' : 'Alttan eski boya çıktı.');
          done(res, baseMin * (0.5 + Math.min(1, (performance.now() - t0) / 7000) * 0.5));
        }
      };
      stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); lastX = null; move(e); });
      stage.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') move(e); });
      wire(res, baseMin, t0);
    });
  }

  /* --- katalog: doğru kaydı bul --- */
  function catalog(it, baseMin) {
    return new Promise(res => {
      finished = false;
      const C = D.CATS[it.cat];
      const others = shuffle(Object.keys(D.CATS).filter(k => k !== it.cat)).slice(0, 2).map(k => ({ cat: k, vi: 0, r: it.r, c: 2 }));
      const same = C.v.length > 1 ? [{ cat: it.cat, vi: (it.vi + 1) % C.v.length, r: it.r, c: 2 }] : [];
      const entries = shuffle([{ cat: it.cat, vi: it.vi, r: it.r, c: 2, ok: true }, ...same, ...others].slice(0, 4));
      const e = D.estimate(Object.assign({}, it, { k: { c: it.k.c, a: it.k.a, p: true } }));
      overlay(frame('Fiyat Kataloğu', `Sayfalarda <b>${it.name}</b> kaydını bul.`,
        `<div class="cat-book">${entries.map((x, i) => {
          const v = D.CATS[x.cat].v[x.vi];
          return `<button class="cat-entry" data-i="${i}"><svg viewBox="0 0 100 100">${MD.Art.inner(Object.assign({ id: 'x' }, x))}</svg><span>${v.n}</span><small>Kat. No ${ri(100, 999)}</small></button>`;
        }).join('')}</div>`, it));
      const t0 = performance.now();
      let extra = 0;
      root.querySelectorAll('.cat-entry').forEach(b => b.addEventListener('click', () => {
        const x = entries[+b.dataset.i];
        if (x.ok) {
          b.classList.add('right'); MD.Audio.play('good');
          root.querySelector('#bBar').style.width = '100%';
          root.querySelector('#bHint').innerHTML = `Kayıt bulundu: piyasa değeri <b>${e[0] === e[1] ? e[0] : e[0] + '–' + e[1]} L</b>`;
          done(res, baseMin * (0.5 + Math.min(1, (performance.now() - t0) / 6000) * 0.5) + extra);
        } else {
          b.classList.add('wrong'); MD.Audio.play('bad'); MD.haptic('error'); extra += 3;
          root.querySelector('#bHint').textContent = 'Bu değil. Sayfayı çevirmek 3 dakika sürdü.';
        }
      }));
      wire(res, baseMin, t0);
    });
  }

  let fast = false;
  try { fast = localStorage.getItem('md_fast') === '1'; } catch (e) { }
  MD.Bench = {
    run(t, it, baseMin) {
      if (fast) return Promise.resolve(baseMin);
      return t === 'c' ? lens(it, baseMin) : t === 'a' ? rub(it, baseMin) : catalog(it, baseMin);
    },
    toolName, isMetal,
    get fast() { return fast; },
    set fast(v) { fast = v; try { localStorage.setItem('md_fast', v ? '1' : '0'); } catch (e) { } },
  };
})();
