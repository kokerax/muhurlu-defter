/* Dükkân sahnesi: duvar, pencere, kapı, raflar, lamba, tezgâh; zaman ve ortam animasyonu */
(function () {
  const { rnd, clamp, lerp, ease } = MD.U;
  const INK = '#24160d';
  const NS = 'http://www.w3.org/2000/svg';

  MD.tween = function (dur, fn) {
    return new Promise(res => {
      let t = 0;
      const step = dt => {
        t += dt;
        const p = Math.min(1, t / dur);
        fn(p);
        if (p >= 1) { MD.onFrame.splice(MD.onFrame.indexOf(step), 1); res(); }
      };
      MD.onFrame.push(step);
    });
  };

  const SKY = [
    [480, '#7f9fb8', '#d8cdb4'], [600, '#a3c2d4', '#eadfc2'], [780, '#8fb6d0', '#f0e4c4'],
    [930, '#c9a877', '#f1d6a2'], [1020, '#c07352', '#eeac6c'], [1080, '#7b4a5a', '#d88a5c'], [1150, '#2c2c48', '#6a4a58'],
  ];
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  let svg, L = {};
  const st = { door: 1, bell: { a: 0, v: 0 }, sign: { a: 0, v: 0 }, t: 0, dust: [], lampK: 0.3 };

  function build() {
    let planks = '';
    for (let i = -6; i <= 16; i++) {
      const xb = i * 40, xt = 220 + (xb - 220) * 0.55;
      planks += `<line x1="${xt}" y1="270" x2="${xb}" y2="310" stroke="#3a2414" stroke-width="1.2"/>`;
    }
    let panels = '';
    for (let i = 0; i < 7; i++) panels += `<rect x="${6 + i * 64}" y="212" width="54" height="50" fill="none" stroke="#2a180c" stroke-width="2"/><rect x="${10 + i * 64}" y="216" width="46" height="42" fill="none" stroke="#7a5232" stroke-width="1" opacity=".6"/>`;
    let front = '';
    for (let i = 0; i < 4; i++) front += `<rect x="${14 + i * 106}" y="368" width="94" height="60" fill="#402616" stroke="#24140a" stroke-width="3"/><rect x="${20 + i * 106}" y="374" width="82" height="48" fill="none" stroke="#6e4527" stroke-width="1.2"/><circle cx="${61 + i * 106}" cy="398" r="4" fill="#c49a45" stroke="${INK}" stroke-width="1"/>`;
    let ticks = '';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ticks += `<line x1="${184 + Math.sin(a) * 10}" y1="${18 - Math.cos(a) * 10}" x2="${184 + Math.sin(a) * 12.5}" y2="${18 - Math.cos(a) * 12.5}" stroke="${INK}" stroke-width="${i % 3 ? 0.8 : 1.6}"/>`; }
    let streetWin = '';
    [[272, 150], [288, 150], [306, 138], [322, 138], [376, 146], [392, 146], [300, 162], [384, 164]].forEach(([x, y]) => { streetWin += `<rect x="${x}" y="${y}" width="6" height="8" fill="#ffd27a"/>`; });

    svg.innerHTML = `
    <defs>
      <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop id="sky0" offset="0" stop-color="#a9c7d8"/><stop id="sky1" offset="1" stop-color="#e8dcc0"/></linearGradient>
      <radialGradient id="lampG"><stop offset="0" stop-color="#ffdc8f" stop-opacity=".8"/><stop offset=".35" stop-color="#ffc766" stop-opacity=".28"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient>
      <linearGradient id="shaftG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d0" stop-opacity=".6"/><stop offset="1" stop-color="#fff3d0" stop-opacity="0"/></linearGradient>
      <linearGradient id="ctopG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4526"/><stop offset="1" stop-color="#94603a"/></linearGradient>
      <linearGradient id="vignG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".3" stop-color="#000" stop-opacity="0"/></linearGradient>
      <pattern id="wallP" width="32" height="42" patternUnits="userSpaceOnUse">
        <rect width="32" height="42" fill="#33402f"/>
        <path d="M16,5 C22,12 22,19 16,25 C10,19 10,12 16,5Z M16,27 L19,31 L16,35 L13,31Z" fill="#3e4c38"/>
        <path d="M0,0 V42" stroke="#4d4a32" stroke-width="1.2"/>
      </pattern>
      <clipPath id="winClip"><rect x="266" y="30" width="144" height="144"/></clipPath>
      <clipPath id="doorClip"><rect x="22" y="40" width="82" height="230"/></clipPath>
    </defs>
    <rect x="0" y="0" width="440" height="200" fill="url(#wallP)"/>
    <rect x="0" y="196" width="440" height="10" fill="#6e4727" stroke="${INK}" stroke-width="1.5"/>
    <rect x="0" y="206" width="440" height="64" fill="#4a2e1b"/>
    ${panels}
    <rect x="0" y="266" width="440" height="6" fill="#2a180c"/>
    <rect x="0" y="270" width="440" height="40" fill="#5c3b22"/>
    ${planks}

    <!-- pencere -->
    <g id="window">
      <rect x="258" y="22" width="160" height="160" fill="#3a2416" stroke="${INK}" stroke-width="2"/>
      <g clip-path="url(#winClip)">
        <rect x="266" y="30" width="144" height="144" fill="url(#skyG)"/>
        <g id="winSun"><circle cx="300" cy="70" r="14" fill="#fff1c4" opacity=".7"/></g>
        <path d="M352,152 V84 H366 V152Z" fill="#6b6570" opacity=".75"/>
        <path d="M350,86 L359,58 L368,86Z" fill="#5a5460" opacity=".8"/>
        <path d="M349,98 H369" stroke="#4a4550" stroke-width="3" opacity=".7"/>
        <path d="M266,174 V136 L280,128 L294,136 V124 L310,116 L326,124 V132 H342 V140 L358,134 V146 L372,138 L386,146 V130 L400,124 L410,130 V174Z" fill="#8a7564"/>
        <path d="M266,174 V150 H300 V142 L318,136 L336,142 V158 H370 V150 L392,144 L410,150 V174Z" fill="#6f5b4c"/>
        <g id="streetWin" opacity="0">${streetWin}</g>
        <path d="M280,40 L300,40 L270,110 L266,110Z" fill="#fff" opacity=".12"/>
      </g>
      <path d="M338,30 V174 M266,96 H410" stroke="#3a2416" stroke-width="7"/>
      <path d="M338,30 V174 M266,96 H410" stroke="${INK}" stroke-width="1" opacity=".6"/>
      <rect x="252" y="180" width="172" height="10" fill="#6e4727" stroke="${INK}" stroke-width="1.5"/>
      <g id="curtL"><path d="M248,14 C264,60 256,120 270,194 L250,194 C246,130 240,60 244,14Z" fill="#6a2126" stroke="${INK}" stroke-width="1.5"/>
        <path d="M252,30 C256,80 252,140 258,190" fill="none" stroke="#000" stroke-width="1.2" opacity=".35"/></g>
      <g id="curtR"><path d="M428,14 C412,60 420,120 406,194 L426,194 C430,130 436,60 432,14Z" fill="#6a2126" stroke="${INK}" stroke-width="1.5"/>
        <path d="M424,30 C420,80 424,140 418,190" fill="none" stroke="#000" stroke-width="1.2" opacity=".35"/></g>
      <rect x="244" y="8" width="192" height="14" fill="#4a2e1b" stroke="${INK}" stroke-width="1.5"/>
      <path d="M244,22 ${Array.from({ length: 12 }, (_, i) => `Q${252 + i * 16},30 ${260 + i * 16},22`).join(' ')}" fill="#6a2126" stroke="${INK}" stroke-width="1.2"/>
    </g>

    <!-- ışık huzmesi -->
    <path id="shaft" d="M266,176 L410,176 L330,300 L150,300Z" fill="url(#shaftG)" opacity=".18"/>

    <!-- kapı -->
    <g id="doorway">
      <rect x="14" y="32" width="98" height="240" fill="#2a180c" stroke="${INK}" stroke-width="2"/>
      <g clip-path="url(#doorClip)">
        <rect x="22" y="40" width="82" height="230" fill="url(#skyG)"/>
        <path d="M22,270 V190 L40,180 L60,190 V170 L84,160 L104,170 V270Z" fill="#9a8672"/>
        <rect x="22" y="240" width="82" height="30" fill="#b8a488"/>
      </g>
      <g id="door">
        <rect x="22" y="40" width="82" height="230" fill="#5a371f" stroke="${INK}" stroke-width="2"/>
        <rect x="32" y="52" width="62" height="92" fill="url(#skyG)" stroke="${INK}" stroke-width="2" opacity=".9"/>
        <path d="M63,52 V144 M32,98 H94" stroke="#5a371f" stroke-width="4"/>
        <rect x="32" y="156" width="62" height="42" fill="none" stroke="#2a180c" stroke-width="2"/>
        <rect x="32" y="208" width="62" height="50" fill="none" stroke="#2a180c" stroke-width="2"/>
        <circle cx="94" cy="190" r="4.5" fill="#c49a45" stroke="${INK}" stroke-width="1.2"/>
        <g id="sign"><path d="M52,100 L63,90 L74,100" fill="none" stroke="${INK}" stroke-width="1"/>
          <rect x="44" y="100" width="38" height="17" fill="#efe1bf" stroke="${INK}" stroke-width="1.4"/>
          <text x="63" y="112.5" text-anchor="middle" class="svg-sign">AÇIK</text></g>
      </g>
      <path d="M104,38 H122" stroke="${INK}" stroke-width="2.5"/>
      <g id="bell"><path d="M120,38 V44" stroke="${INK}" stroke-width="1.5"/>
        <path d="M113,56 C113,46 116,44 120,44 C124,44 127,46 127,56Z" fill="#c49a45" stroke="${INK}" stroke-width="1.5"/>
        <circle cx="120" cy="58" r="2" fill="${INK}"/></g>
    </g>

    <!-- raf dolabı -->
    <g id="cabinet">
      <rect x="126" y="30" width="118" height="164" fill="#2f1c10" stroke="${INK}" stroke-width="2"/>
      <rect x="120" y="24" width="130" height="10" fill="#5a371f" stroke="${INK}" stroke-width="1.5"/>
      ${[82, 136, 190].map(y => `<rect x="126" y="${y - 6}" width="118" height="7" fill="#6e4727" stroke="${INK}" stroke-width="1.2"/>`).join('')}
      <rect x="120" y="30" width="7" height="166" fill="#4a2e1b" stroke="${INK}" stroke-width="1.2"/>
      <rect x="243" y="30" width="7" height="166" fill="#4a2e1b" stroke="${INK}" stroke-width="1.2"/>
      <g id="shelfItems"></g>
      <g id="clock">
        <circle cx="184" cy="18" r="15" fill="#6e4727" stroke="${INK}" stroke-width="1.6"/>
        <circle cx="184" cy="18" r="13" fill="#efe1bf" stroke="${INK}" stroke-width="1"/>
        ${ticks}
        <line id="clockH" x1="184" y1="18" x2="184" y2="11" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
        <line id="clockM" x1="184" y1="18" x2="184" y2="8" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="184" cy="18" r="1.4" fill="${INK}"/>
      </g>
    </g>

    <g id="dust"></g>
    <g id="actors"></g>

    <!-- lamba -->
    <circle id="lampGlow" cx="220" cy="58" r="150" fill="url(#lampG)" opacity=".3" pointer-events="none"/>
    <g id="lamp">
      <line x1="220" y1="-4" x2="220" y2="40" stroke="${INK}" stroke-width="1.6"/>
      <path d="M204,54 C206,42 212,38 220,38 C228,38 234,42 236,54Z" fill="#2f4a36" stroke="${INK}" stroke-width="1.6"/>
      <path d="M204,54 H236" stroke="#c49a45" stroke-width="2"/>
      <ellipse id="bulb" cx="220" cy="57" rx="6" ry="4" fill="#fff0c0"/>
    </g>

    <!-- tezgâh -->
    <rect x="0" y="0" width="440" height="440" fill="url(#vignG)" pointer-events="none"/>
    <g id="counter">
      <path d="M-4,300 H444 V354 H-4Z" fill="url(#ctopG)" stroke="${INK}" stroke-width="2"/>
      <path d="M0,312 C80,310 160,316 250,312 C320,309 380,314 440,312 M0,330 C90,334 170,328 260,331 C330,333 390,329 440,331 M0,344 C60,342 150,346 230,343" fill="none" stroke="#5a371f" stroke-width="1" opacity=".7"/>
      <rect x="-4" y="352" width="448" height="6" fill="#c49a45" stroke="${INK}" stroke-width="1.5"/>
      <rect x="-4" y="358" width="448" height="90" fill="#2e1a0e"/>
      ${front}
      <g id="ledger" class="tap">
        <path d="M18,342 L26,306 L74,302 L72,338Z" fill="#e9dab4" stroke="${INK}" stroke-width="1.5"/>
        <path d="M72,338 L74,302 L122,306 L128,342Z" fill="#efe2bf" stroke="${INK}" stroke-width="1.5"/>
        <path d="M30,314 L70,311 M29,320 L70,317 M28,326 L70,323 M27,332 L70,329 M78,311 L118,314 M78,317 L120,320 M78,323 L121,326 M78,329 L122,332" stroke="#8a6a4a" stroke-width=".8"/>
        <path d="M100,305 L103,346 L106,340 L109,346 L106,306Z" fill="#8e2a22"/>
        <path d="M16,344 L72,340 L130,344" fill="none" stroke="#4a2414" stroke-width="3"/>
      </g>
      <g id="ink"><path d="M136,338 L138,322 H152 L154,338Z" fill="#1c2230" stroke="${INK}" stroke-width="1.4"/>
        <path d="M146,324 C150,300 162,286 176,280 C168,292 160,304 148,324Z" fill="#efe6d2" stroke="${INK}" stroke-width="1"/></g>
      <rect x="166" y="308" width="112" height="40" rx="4" fill="#2f3d2c" stroke="${INK}" stroke-width="1.5"/>
      <rect x="171" y="312" width="102" height="32" rx="2" fill="none" stroke="#c49a45" stroke-width=".8" stroke-dasharray="3 2" opacity=".7"/>
      <g id="counterItem"></g>
      <g id="cash" opacity="0"></g>
      <g id="svcBell" class="tap">
        <ellipse cx="404" cy="338" rx="20" ry="5" fill="#6e4727" stroke="${INK}" stroke-width="1.4"/>
        <path d="M388,336 C388,322 396,316 404,316 C412,316 420,322 420,336Z" fill="#c49a45" stroke="${INK}" stroke-width="1.5"/>
        <rect x="401" y="310" width="6" height="6" rx="1" fill="#c49a45" stroke="${INK}" stroke-width="1.2"/>
        <path d="M394,330 C394,324 398,320 402,319" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/>
      </g>
    </g>`;
    ['sky0', 'sky1', 'winSun', 'streetWin', 'shaft', 'door', 'bell', 'sign', 'shelfItems', 'clockH', 'clockM', 'dust', 'actors', 'lampGlow', 'lamp', 'counterItem', 'cash', 'curtL', 'curtR', 'ledger', 'svcBell', 'bulb']
      .forEach(id => L[id] = svg.querySelector('#' + id));
    for (let i = 0; i < 18; i++) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', rnd(0.6, 1.5).toFixed(1)); c.setAttribute('fill', '#fff4d8');
      L.dust.appendChild(c);
      st.dust.push({ el: c, x: rnd(150, 410), y: rnd(180, 300), vx: rnd(-4, 4), vy: rnd(-3, 3), ph: rnd(0, 6) });
    }
    L.svcBell.addEventListener('click', () => { MD.Audio.play('ding'); MD.haptic('light'); ringBell(); });
  }

  function ringBell() { st.bell.v += 260; }

  function frame(dt) {
    st.t += dt;
    const t = st.t;
    const b = st.bell; b.v += (-120 * b.a - 3 * b.v) * dt; b.a += b.v * dt;
    L.bell.setAttribute('transform', `rotate(${clamp(b.a, -40, 40).toFixed(1)} 120 40)`);
    const sg = st.sign; sg.v += (-40 * sg.a - 1.8 * sg.v) * dt; sg.a += sg.v * dt;
    L.sign.setAttribute('transform', `rotate(${clamp(sg.a, -25, 25).toFixed(1)} 63 90)`);
    const sw = Math.sin(t * 0.9) * 1.6;
    L.lamp.setAttribute('transform', `rotate(${sw.toFixed(2)} 220 -4)`);
    L.lampGlow.setAttribute('cx', (220 - sw * 1.2).toFixed(1));
    const fl = st.lampK * (0.94 + Math.sin(t * 13) * 0.03 + Math.sin(t * 7.3) * 0.03);
    L.lampGlow.setAttribute('opacity', fl.toFixed(3));
    L.curtL.setAttribute('transform', `skewX(${(Math.sin(t * 0.7) * 0.8).toFixed(2)})`);
    L.curtR.setAttribute('transform', `translate(${(Math.sin(t * 0.6 + 1) * 1).toFixed(2)},0)`);
    st.dust.forEach(d => {
      d.x += (d.vx + Math.sin(t * 0.5 + d.ph) * 3) * dt; d.y += (d.vy + Math.cos(t * 0.4 + d.ph) * 2) * dt;
      if (d.x < 140) d.x = 410; if (d.x > 415) d.x = 145; if (d.y < 170) d.y = 300; if (d.y > 305) d.y = 175;
      d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1));
      d.el.setAttribute('opacity', (0.25 + Math.sin(t * 1.3 + d.ph) * 0.25 + 0.25).toFixed(2));
    });
  }

  function setTime(min) {
    let i = 0;
    while (i < SKY.length - 2 && min > SKY[i + 1][0]) i++;
    const [m0, a0, b0] = SKY[i], [m1, a1, b1] = SKY[i + 1];
    const k = clamp((min - m0) / (m1 - m0), 0, 1);
    L.sky0.setAttribute('stop-color', mix(a0, a1, k));
    L.sky1.setAttribute('stop-color', mix(b0, b1, k));
    const day = clamp((min - 540) / 540, 0, 1);
    st.lampK = lerp(0.22, 0.72, Math.pow(day, 1.6));
    L.shaft.setAttribute('opacity', lerp(0.2, 0.05, day).toFixed(3));
    L.streetWin.setAttribute('opacity', clamp((min - 960) / 120, 0, 1).toFixed(2));
    L.winSun.setAttribute('transform', `translate(${(day * 70).toFixed(1)},${(Math.sin(day * Math.PI) * -18 + day * 40).toFixed(1)})`);
    L.winSun.setAttribute('opacity', (1 - clamp((min - 1020) / 80, 0, 1)).toFixed(2));
    const h = (min / 60) % 12, m = min % 60;
    L.clockH.setAttribute('transform', `rotate(${(h * 30 + m * 0.5).toFixed(1)} 184 18)`);
    L.clockM.setAttribute('transform', `rotate(${(m * 6).toFixed(1)} 184 18)`);
  }

  async function openDoor() {
    MD.Audio.play('bell');
    st.bell.v += 320; st.sign.v += 90;
    await MD.tween(0.35, p => L.door.setAttribute('transform', `translate(22,0) scale(${(1 - ease(p) * 0.78).toFixed(3)},1) translate(-22,0)`));
  }
  async function closeDoor() {
    await MD.tween(0.4, p => L.door.setAttribute('transform', `translate(22,0) scale(${(0.22 + ease(p) * 0.78).toFixed(3)},1) translate(-22,0)`));
    st.sign.v -= 60; st.bell.v += 80;
  }

  const SLOTS = [];
  [184, 130, 76].forEach(y => [148, 185, 222].forEach(x => SLOTS.push([x, y])));
  function setShelf(items) {
    const list = items.slice(0, 9);
    L.shelfItems.innerHTML = list.map((it, i) => {
      const [x, y] = SLOTS[i];
      return `<svg x="${x - 18}" y="${y - 38}" width="36" height="38" viewBox="0 0 100 100">${MD.Art.inner(it)}</svg>`;
    }).join('');
  }

  async function showItem(it) {
    L.counterItem.innerHTML = it ? `<svg x="-38" y="-68" width="76" height="76" viewBox="0 0 100 100">${MD.Art.inner(it)}</svg>` : '';
    if (!it) return;
    await MD.tween(0.35, p => {
      const e = ease(p);
      L.counterItem.setAttribute('transform', `translate(222,${(338 - 24 * (1 - e)).toFixed(1)})`);
      L.counterItem.setAttribute('opacity', e.toFixed(2));
    });
  }
  async function takeItem(dir = 'up') {
    if (!L.counterItem.innerHTML) return;
    await MD.tween(0.35, p => {
      const e = ease(p);
      const dx = dir === 'shelf' ? -40 * e : 0, dy = dir === 'shelf' ? -150 * e : -30 * e;
      L.counterItem.setAttribute('transform', `translate(${(222 + dx).toFixed(1)},${(338 + dy).toFixed(1)}) scale(${(1 - e * 0.5).toFixed(2)})`);
      L.counterItem.setAttribute('opacity', (1 - e).toFixed(2));
    });
    L.counterItem.innerHTML = '';
  }

  async function cash(amount, toPlayer) {
    const n = clamp(Math.ceil(Math.log10(Math.max(amount, 1)) * 1.6), 1, 6);
    let h = '';
    for (let i = 0; i < n; i++) h += `<g transform="translate(${(i % 3) * 3},${-i * 4})"><rect x="-22" y="-7" width="44" height="14" rx="1.5" fill="#9fb58a" stroke="${INK}" stroke-width="1.2"/><rect x="-18" y="-4" width="36" height="8" fill="none" stroke="#4d6a3a" stroke-width=".8"/><circle cx="0" cy="0" r="3" fill="none" stroke="#4d6a3a" stroke-width=".8"/></g>`;
    h += `<path d="M-6,-${n * 4 + 3} H8" stroke="#8e2a22" stroke-width="3"/>`;
    L.cash.innerHTML = h;
    const y0 = toPlayer ? 300 : 340, y1 = toPlayer ? 340 : 300;
    await MD.tween(0.4, p => {
      const e = ease(p);
      L.cash.setAttribute('transform', `translate(318,${lerp(y0, y1, e).toFixed(1)})`);
      L.cash.setAttribute('opacity', Math.min(1, e * 2).toFixed(2));
    });
    await MD.U.sleep(500);
    await MD.tween(0.3, p => {
      L.cash.setAttribute('transform', `translate(318,${(y1 + (toPlayer ? 20 : -30) * p).toFixed(1)})`);
      L.cash.setAttribute('opacity', (1 - p).toFixed(2));
    });
  }

  function init(el) {
    svg = el; build(); setTime(540);
    MD.onFrame.push(frame);
  }

  MD.Shop = { init, setTime, openDoor, closeDoor, setShelf, showItem, takeItem, cash, ringBell, get actors() { return L.actors; }, get ledger() { return L.ledger; } };
})();
