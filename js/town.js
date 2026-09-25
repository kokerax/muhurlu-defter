/* Gece haritası: izometrik Galata, hareketli devriye, vapur, sis; iş iğneleri */
(function () {
  const { rnd, clamp, lerp, ease } = MD.U;
  const INK = '#0e0a07';
  const NS = 'http://www.w3.org/2000/svg';
  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  function box(cx, cy, w, d, h, c) {
    const F = [cx, cy], R = [cx + w, cy - w / 2], Lp = [cx - d, cy - d / 2], B = [cx + w - d, cy - w / 2 - d / 2];
    const up = (p, k = h) => [p[0], p[1] - k];
    let s = `<polygon points="${pts([Lp, F, up(F), up(Lp)])}" fill="${c.l}" stroke="${INK}" stroke-width="1.2"/>
      <polygon points="${pts([F, R, up(R), up(F)])}" fill="${c.r}" stroke="${INK}" stroke-width="1.2"/>`;
    return { s, F, R, L: Lp, B, up };
  }
  function faceWin(P0, u, hgt, cols, rows, lit, cls = '') {
    let s = '';
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const fx = (i + 0.3) / cols, fx2 = (i + 0.7) / cols, fy = (j + 0.3) / rows, fy2 = (j + 0.72) / rows;
      const p = (a, b) => [P0[0] + u[0] * a, P0[1] + u[1] * a - hgt * b];
      const on = Math.random() < lit;
      s += `<polygon class="${on ? 'twin ' + cls : ''}" points="${pts([p(fx, fy), p(fx2, fy), p(fx2, fy2), p(fx, fy2)])}" fill="${on ? '#f3c56b' : '#1d1a1a'}" opacity="${on ? 0.95 : 0.8}" style="animation-delay:${rnd(0, 6).toFixed(1)}s"/>`;
    }
    return s;
  }
  function building(o) {
    const { cx, cy, w, d, h } = o;
    const c = o.c || { l: '#6b5a45', r: '#4b3e31', t: '#5a4a38', roof: '#6e3226', roof2: '#4e2219' };
    const b = box(cx, cy, w, d, h, c);
    let s = b.s;
    s += faceWin(b.L, [b.F[0] - b.L[0], b.F[1] - b.L[1]], h, o.wl || 2, o.rows || 2, o.lit ?? 0.5);
    s += faceWin(b.F, [b.R[0] - b.F[0], b.R[1] - b.F[1]], h, o.wr || 3, o.rows || 2, o.lit ?? 0.5);
    const A = b.up(b.L), Bq = b.up(b.F), C = b.up(b.R), D = b.up(b.B);
    if (o.roof === 'pitch') {
      const rh = o.rh || 18;
      const m1 = [(A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2 - rh], m2 = [(D[0] + C[0]) / 2, (D[1] + C[1]) / 2 - rh];
      s += `<polygon points="${pts([A, D, m2, m1])}" fill="${c.roof2}" stroke="${INK}" stroke-width="1.2"/>
        <polygon points="${pts([A, Bq, m1])}" fill="${c.l}" stroke="${INK}" stroke-width="1.2"/>
        <polygon points="${pts([Bq, C, m2, m1])}" fill="${c.roof}" stroke="${INK}" stroke-width="1.2"/>`;
      for (let i = 1; i < 6; i++) { const k = i / 6; s += `<line x1="${lerp(Bq[0], C[0], k)}" y1="${lerp(Bq[1], C[1], k)}" x2="${lerp(m1[0], m2[0], k)}" y2="${lerp(m1[1], m2[1], k)}" stroke="#000" stroke-width=".8" opacity=".35"/>`; }
      o.top = [(m1[0] + m2[0]) / 2, Math.min(m1[1], m2[1])];
    } else {
      s += `<polygon points="${pts([A, Bq, C, D])}" fill="${c.t}" stroke="${INK}" stroke-width="1.2"/>`;
      const inset = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
      const cen = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
      s += `<polygon points="${pts([inset(A, cen, 0.12), inset(Bq, cen, 0.12), inset(C, cen, 0.12), inset(D, cen, 0.12)])}" fill="#000" opacity=".15"/>`;
      o.top = [cen[0], cen[1] - 6];
    }
    if (o.domes) {
      const cen = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
      [[-18, 2], [0, -6], [18, 2], [0, 10], [-2, 2]].forEach(([dx, dy], i) => {
        const r = i === 4 ? 13 : 8;
        s += `<path d="M${cen[0] + dx - r},${cen[1] + dy} A${r},${r * 0.95} 0 0 1 ${cen[0] + dx + r},${cen[1] + dy}Z" fill="#6f6a60" stroke="${INK}" stroke-width="1"/>
          <path d="M${cen[0] + dx},${cen[1] + dy - r * 0.95} V${cen[1] + dy - r * 0.95 - 4}" stroke="#c49a45" stroke-width="1.4"/>`;
      });
      o.top = [cen[0], cen[1] - 16];
    }
    if (o.cols) {
      for (let i = 0; i <= o.cols; i++) {
        const k = i / o.cols, x = lerp(b.L[0], b.F[0], k), y = lerp(b.L[1], b.F[1], k);
        s += `<rect x="${x - 2}" y="${y - h + 6}" width="4" height="${h - 6}" fill="#8a7a64" stroke="${INK}" stroke-width=".6"/>`;
      }
      s += `<polygon points="${pts([b.up(b.L, h + 2), b.up(b.F, h + 2), [(b.L[0] + b.F[0]) / 2, (b.L[1] + b.F[1]) / 2 - h - 16]])}" fill="#7a6a54" stroke="${INK}" stroke-width="1"/>`;
    }
    if (o.chimney) s += `<rect x="${C[0] - 14}" y="${C[1] - 22}" width="7" height="16" fill="#4a3a2e" stroke="${INK}" stroke-width="1"/>`;
    o.chim = [C[0] - 10.5, C[1] - 24];
    return s;
  }

  const BLD = {
    rihtim: { cx: 76, cy: 318, w: 66, d: 36, h: 32, roof: 'pitch', wr: 3, rows: 1, lit: 0.3, chimney: true },
    gumruk: { cx: 292, cy: 318, w: 84, d: 36, h: 44, rows: 2, wr: 4, lit: 0.35, c: { l: '#7a6a58', r: '#5a4c3e', t: '#4e4336' } },
    carsi: { cx: 78, cy: 450, w: 72, d: 44, h: 26, domes: true, rows: 1, wr: 4, lit: 0.6, c: { l: '#7a6a52', r: '#5c4e3c', t: '#6a5d4a' } },
    banka: { cx: 290, cy: 470, w: 90, d: 40, h: 60, cols: 5, rows: 3, wr: 5, lit: 0.25, c: { l: '#8a806e', r: '#6b6252', t: '#5b5446' } },
    kumar: { cx: 196, cy: 548, w: 46, d: 30, h: 30, roof: 'pitch', rh: 12, rows: 2, wr: 2, lit: 0.9, chimney: true },
    konak: { cx: 320, cy: 604, w: 58, d: 40, h: 52, roof: 'pitch', rh: 20, rows: 2, wr: 3, lit: 0.3, c: { l: '#7a5a44', r: '#5b4232', t: '#5a4a38', roof: '#5a2a22', roof2: '#3e1d17' } },
    muze: { cx: 66, cy: 620, w: 74, d: 40, h: 44, cols: 4, rows: 2, wr: 4, lit: 0.15, c: { l: '#857a68', r: '#655c4e', t: '#554d42' } },
    meyhane: { cx: 190, cy: 680, w: 52, d: 34, h: 30, roof: 'pitch', rh: 14, rows: 1, wr: 3, lit: 1, chimney: true },
    karakol: { cx: 326, cy: 726, w: 58, d: 34, h: 34, rows: 2, wr: 3, lit: 0.7, c: { l: '#6a6a6a', r: '#4d4d50', t: '#444' } },
    dukkan: { cx: 96, cy: 762, w: 56, d: 34, h: 32, roof: 'pitch', rh: 14, rows: 1, wr: 3, lit: 1, chimney: true },
  };
  const ICON = {
    rihtim: 'M-7,-5 H7 V7 H-7Z M-7,-5 L7,7 M7,-5 L-7,7',
    carsi: 'M-6,6 H6 V2 H-6Z M-3,2 V-4 H3 V2 M-5,-4 H5 V-7 H-5Z',
    kumar: 'M-7,-6 H7 V6 H-7Z M-3,-2 h.1 M3,2 h.1 M0,0 h.1',
    konak: 'M0,-8 L7,0 L0,8 L-7,0Z M-7,0 H7 M-3,-4 L0,8 L3,-4',
    gumruk: 'M-4,-2 A4,4 0 1 1 -4,-1.9 M0,-2 H8 M5,-2 V2 M8,-2 V3',
    muze: 'M-8,-3 L0,-8 L8,-3Z M-6,-2 V5 M-2,-2 V5 M2,-2 V5 M6,-2 V5 M-8,6 H8',
    banka: 'M-6,-2 C-8,6 8,6 6,-2 L3,-6 H-3Z M-2,-1 H2 M0,-3 V4',
    meyhane: 'M-6,-6 H4 V7 H-6Z M4,-3 C9,-3 9,4 4,4 M-4,-2 V4 M-1,-2 V4',
    karakol: 'M0,-8 L2.4,-2.6 L8,-2.4 L3.6,1.2 L5,7 L0,3.6 L-5,7 L-3.6,1.2 L-8,-2.4 L-2.4,-2.6Z',
    dukkan: 'M-7,0 L0,-7 L7,0 M-5,-1 V7 H5 V-1 M-1.5,7 V2 H1.5 V7',
  };

  let svg, L = {}, onPin = () => { };
  const st = { t: 0, patrol: 0, ship: 0, smoke: [], flag: null };
  const PATROL = [[40, 540], [150, 500], [250, 560], [380, 520], [420, 640], [250, 620], [150, 720], [40, 660]];

  function build() {
    let stars = '';
    for (let i = 0; i < 40; i++) stars += `<circle class="star" cx="${rnd(0, 440).toFixed(0)}" cy="${rnd(0, 110).toFixed(0)}" r="${rnd(0.4, 1.3).toFixed(1)}" fill="#fff" style="animation-delay:${rnd(0, 4).toFixed(1)}s"/>`;
    let waves = '';
    for (let i = 0; i < 9; i++) waves += `<path class="wave" d="M${-40 + (i % 3) * 30},${160 + i * 10} q10,-3 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" fill="none" stroke="#5a7090" stroke-width=".8" opacity=".5" style="animation-delay:${(i * 0.4).toFixed(1)}s"/>`;
    let grid = '';
    for (let i = -20; i < 30; i++) grid += `<line x1="${i * 40}" y1="250" x2="${i * 40 + 560}" y2="530" stroke="#fff" stroke-width=".4" opacity=".05"/><line x1="${i * 40}" y1="250" x2="${i * 40 - 560}" y2="530" stroke="#fff" stroke-width=".4" opacity=".05"/>`;
    const order = Object.entries(BLD).sort((a, b) => a[1].cy - b[1].cy);
    let blds = '';
    order.forEach(([id, o]) => {
      blds += `<g class="bld" data-loc="${id}">${building(o)}</g>`;
      if (id === 'gumruk') blds += tower();
    });
    svg.innerHTML = `
      <defs>
        <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#26304a"/></linearGradient>
        <linearGradient id="nsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2a40"/><stop offset="1" stop-color="#121a28"/></linearGradient>
        <radialGradient id="glowY"><stop offset="0" stop-color="#ffcf70" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
        <radialGradient id="moonG"><stop offset="0" stop-color="#fff6d8" stop-opacity=".45"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
        <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      </defs>
      <rect width="440" height="820" fill="#241f1a"/>
      <rect width="440" height="170" fill="url(#nsky)"/>
      ${stars}
      <circle cx="360" cy="52" r="46" fill="url(#moonG)"/>
      <path d="M360,34 A18,18 0 1 0 372,66 A14,14 0 1 1 360,34Z" fill="#f4ecc8"/>
      <path d="M0,150 L20,142 L60,146 L80,138 L96,140 L100,120 L101,112 L102,120 L104,136 L120,130 C124,112 150,108 156,130 L160,128 L161,108 L162,128 L166,132 C170,120 186,120 190,134 L204,136 L230,128 L232,112 L233,104 L234,112 L236,128 L250,124 C256,100 290,100 296,124 L300,124 L301,100 L302,124 L316,134 L340,130 L380,138 L410,134 L440,140 V160 H0Z" fill="#141a2a"/>
      <rect y="156" width="440" height="100" fill="url(#nsea)"/>
      <path d="M340,160 L380,160 L372,250 L348,250Z" fill="#f4ecc8" opacity=".06"/>
      ${waves}
      <g id="ship"><path d="M-40,0 H40 L32,10 H-34Z" fill="#1a1512" stroke="#000" stroke-width="1"/>
        <rect x="-24" y="-8" width="40" height="8" fill="#3a3028" stroke="#000" stroke-width=".8"/>
        <rect x="-4" y="-22" width="7" height="14" fill="#6e2a22" stroke="#000" stroke-width=".8"/>
        ${[-20, -12, -4, 4, 12].map(x => `<rect x="${x}" y="-5" width="3" height="3" fill="#f3c56b"/>`).join('')}
        <g id="shipSmoke"></g></g>
      <path d="M0,246 L440,246 V820 H0Z" fill="#2c2620"/>
      <path d="M0,246 H440" stroke="#5a4a3a" stroke-width="3"/>
      <rect x="0" y="246" width="440" height="10" fill="#3a3129"/>
      ${grid}
      <path d="M-20,760 L460,520" stroke="#433a30" stroke-width="30" opacity=".9"/>
      <path d="M-20,760 L460,520" stroke="#5a4e40" stroke-width="30" stroke-dasharray="2 5" opacity=".25"/>
      <path d="M-20,420 L460,660" stroke="#433a30" stroke-width="26" opacity=".9"/>
      <path d="M-20,420 L460,660" stroke="#5a4e40" stroke-width="26" stroke-dasharray="2 5" opacity=".25"/>
      <path d="M140,256 L140,300 M200,256 L260,290" stroke="#433a30" stroke-width="18"/>
      <g id="crates"><rect x="150" y="276" width="14" height="12" fill="#6b4b2c" stroke="#000"/><rect x="158" y="266" width="12" height="11" fill="#7a5a36" stroke="#000"/><rect x="170" y="280" width="12" height="10" fill="#5a3e24" stroke="#000"/>
        <path d="M22,300 V236 L60,228 M60,228 V252" stroke="#3a2e22" stroke-width="3" fill="none"/><path d="M57,252 h6 v4 h-6Z" fill="#555"/></g>
      ${[[120, 500], [236, 620], [270, 700], [30, 700], [372, 560]].map(([x, y]) => `<g class="lamp"><circle cx="${x}" cy="${y - 26}" r="34" fill="url(#glowY)"/><path d="M${x},${y} V${y - 24}" stroke="#111" stroke-width="2"/><rect x="${x - 3}" y="${y - 30}" width="6" height="7" fill="#ffd27a" stroke="#111"/></g>`).join('')}
      <g id="blds">${blds}</g>
      <g id="flag"><path d="M${BLD.karakol.cx + 20},${BLD.karakol.cy - 60} V${BLD.karakol.cy - 110}" stroke="#222" stroke-width="2"/><path id="flagCloth" fill="#b3202c" stroke="#000" stroke-width=".8"/></g>
      <g id="smoke"></g>
      <g id="patrol"><circle r="26" fill="url(#glowY)"/><circle cx="0" cy="-15" r="4" fill="#1a1a22"/><path d="M-4,-11 H4 L5,4 H-5Z" fill="#23304a"/><rect x="-5" y="-21" width="10" height="4" fill="#23304a"/><rect x="5" y="-6" width="4" height="5" fill="#ffd27a"/></g>
      <g id="fog"><ellipse cx="100" cy="420" rx="200" ry="26" fill="#9aa4b8" opacity=".07"/><ellipse cx="300" cy="640" rx="220" ry="30" fill="#9aa4b8" opacity=".06"/></g>
      <g id="tokens"></g>
      <g id="pins"></g>
      <rect width="440" height="820" fill="url(#vig)" pointer-events="none"/>`;
    ['ship', 'shipSmoke', 'smoke', 'patrol', 'fog', 'pins', 'tokens', 'flagCloth'].forEach(id => L[id] = svg.querySelector('#' + id));
  }

  function tower() {
    const cx = 214, base = 404, r = 21, H = 124, top = base - H;
    let wins = '';
    for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) {
      const y = base - 28 - j * 24, x = cx + i * 10;
      wins += `<path class="${Math.random() < 0.35 ? 'twin' : ''}" d="M${x - 2.5},${y} V${y - 7} A2.5,2.5 0 0 1 ${x + 2.5},${y - 7} V${y}Z" fill="${Math.random() < 0.35 ? '#f3c56b' : '#1a1616'}"/>`;
    }
    return `<g class="bld tower">
      <ellipse cx="${cx}" cy="${base}" rx="${r}" ry="7" fill="#3a3129"/>
      <rect x="${cx - r}" y="${top}" width="${r * 2}" height="${H}" fill="#6e665a" stroke="${INK}" stroke-width="1.2"/>
      <rect x="${cx}" y="${top}" width="${r}" height="${H}" fill="#000" opacity=".25"/>
      ${wins}
      <ellipse cx="${cx}" cy="${top + 12}" rx="${r + 5}" ry="5" fill="#4a4238" stroke="${INK}" stroke-width="1"/>
      <path d="M${cx - r - 3},${top} L${cx},${top - 46} L${cx + r + 3},${top}Z" fill="#3e3a44" stroke="${INK}" stroke-width="1.2"/>
      <path d="M${cx},${top - 46} V${top - 56}" stroke="#c49a45" stroke-width="1.5"/>
      <ellipse cx="${cx}" cy="${top}" rx="${r + 3}" ry="5" fill="#4a4238" stroke="${INK}" stroke-width="1"/>
      <circle cx="${cx}" cy="${top + 30}" r="40" fill="url(#glowY)" opacity=".4"/>
    </g>`;
  }

  function pinPos(id) { const o = BLD[id]; return [o.top[0], o.top[1] - 26]; }

  function setPins(list) {
    L.pins.innerHTML = list.map(p => {
      const [x, y] = pinPos(p.loc);
      const cls = p.kind === 'job' ? 'pin job' : 'pin ' + p.kind;
      return `<g class="${cls}" data-pin="${p.key}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        <circle class="pulse" r="17" fill="none" stroke="${p.kind === 'job' ? '#f3c56b' : '#cfd8e6'}" stroke-width="2"/>
        <path d="M0,26 L-7,12 H7Z" fill="#efe1bf" stroke="${INK}" stroke-width="1.2"/>
        <circle r="17" fill="${p.kind === 'job' ? '#efe1bf' : '#d8dfe8'}" stroke="${INK}" stroke-width="2"/>
        <path d="${ICON[p.loc]}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
        ${p.badge ? `<circle cx="13" cy="-13" r="8" fill="#8e2a22" stroke="${INK}" stroke-width="1.2"/><text x="13" y="-9.5" text-anchor="middle" class="svg-badge">${p.badge}</text>` : ''}
        <g transform="translate(0,${p.labelUp ? -32 : 40})"><rect x="${-p.label.length * 3.1 - 6}" y="-9" width="${p.label.length * 6.2 + 12}" height="16" rx="2" fill="#1a140f" opacity=".85"/>
        <text y="3" text-anchor="middle" class="svg-label">${p.label}</text></g>
        <rect x="-26" y="-26" width="52" height="60" fill="transparent"/>
      </g>`;
    }).join('');
  }

  function frame(dt) {
    if (!svg || !svg.isConnected || svg.closest('[hidden]')) return;
    st.t += dt; const t = st.t;
    st.ship = (st.ship + dt * 9) % 560;
    L.ship.setAttribute('transform', `translate(${(st.ship - 60).toFixed(1)},${(214 + Math.sin(t * 1.5) * 1.5).toFixed(1)})`);
    // devriye
    st.patrol += dt * 22;
    let d = st.patrol, i = 0, seg;
    const segLen = k => { const a = PATROL[k], b = PATROL[(k + 1) % PATROL.length]; return Math.hypot(b[0] - a[0], b[1] - a[1]); };
    const total = PATROL.reduce((s, _, k) => s + segLen(k), 0);
    d %= total;
    while (d > (seg = segLen(i))) { d -= seg; i = (i + 1) % PATROL.length; }
    const a = PATROL[i], b = PATROL[(i + 1) % PATROL.length], k = d / seg;
    L.patrol.setAttribute('transform', `translate(${lerp(a[0], b[0], k).toFixed(1)},${(lerp(a[1], b[1], k) - Math.abs(Math.sin(t * 7)) * 1.5).toFixed(1)}) scale(${b[0] < a[0] ? -1 : 1},1)`);
    L.fog.setAttribute('transform', `translate(${(Math.sin(t * 0.15) * 60).toFixed(1)},0)`);
    // bayrak
    const fx = BLD.karakol.cx + 20, fy = BLD.karakol.cy - 110;
    let top = `M${fx},${fy}`, bot = '';
    for (let s = 1; s <= 6; s++) top += ` L${fx + s * 5},${(fy + Math.sin(t * 5 - s * 0.8) * 2).toFixed(1)}`;
    for (let s = 6; s >= 0; s--) bot += ` L${fx + s * 5},${(fy + 18 + Math.sin(t * 5 - s * 0.8) * 2).toFixed(1)}`;
    L.flagCloth.setAttribute('d', top + bot + 'Z');
    // bacalardan duman
    if (Math.random() < dt * 4) {
      const srcs = Object.values(BLD).filter(o => o.chimney);
      const o = srcs[Math.floor(Math.random() * srcs.length)];
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('fill', '#8a8a92');
      L.smoke.appendChild(c); st.smoke.push({ el: c, x: o.chim[0], y: o.chim[1], r: 2, life: 0 });
    }
    if (Math.random() < dt * 2) {
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('fill', '#6a6a72');
      L.shipSmoke.appendChild(c); st.smoke.push({ el: c, x: 0, y: -24, r: 2, life: 0, ship: true });
    }
    for (let j = st.smoke.length - 1; j >= 0; j--) {
      const q = st.smoke[j]; q.life += dt; q.y -= dt * 14; q.x += dt * (q.ship ? -10 : 6); q.r += dt * 4;
      const o = Math.max(0, 0.35 - q.life * 0.12);
      q.el.setAttribute('cx', q.x.toFixed(1)); q.el.setAttribute('cy', q.y.toFixed(1)); q.el.setAttribute('r', q.r.toFixed(1)); q.el.setAttribute('opacity', o.toFixed(2));
      if (o <= 0) { q.el.remove(); st.smoke.splice(j, 1); }
    }
  }

  async function runCrew(runs) {
    const start = pinPos('dukkan');
    L.tokens.innerHTML = '';
    const promises = runs.map((r, idx) => new Promise(async res => {
      const end = pinPos(r.loc);
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = r.crew.map((c, j) => `<g transform="translate(${j * 12 - (r.crew.length - 1) * 6},0)"><circle r="8" fill="#efe1bf" stroke="#000" stroke-width="1.4"/><text y="3.5" text-anchor="middle" class="svg-token">${c.name.split(' ').pop()[0]}</text></g>`).join('');
      L.tokens.appendChild(g);
      await MD.U.sleep(idx * 350);
      const mid = [(start[0] + end[0]) / 2, Math.min(start[1], end[1]) - 40];
      await MD.tween(1.6, p => {
        const e = ease(p), u = 1 - e;
        const x = u * u * start[0] + 2 * u * e * mid[0] + e * e * end[0];
        const y = u * u * start[1] + 2 * u * e * mid[1] + e * e * end[1] - Math.abs(Math.sin(p * 30)) * 2;
        g.setAttribute('transform', `translate(${x.toFixed(1)},${(y + 30).toFixed(1)})`);
      });
      const mark = document.createElementNS(NS, 'g');
      mark.setAttribute('transform', `translate(${end[0]},${end[1] - 30})`);
      mark.innerHTML = r.ok
        ? `<circle r="13" fill="#3d6a34" stroke="#000" stroke-width="1.5"/><path d="M-6,0 L-2,5 L7,-5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`
        : `<circle r="13" fill="#8e2a22" stroke="#000" stroke-width="1.5"/><path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
      L.tokens.appendChild(mark);
      MD.Audio.play(r.ok ? 'good' : 'bad');
      await MD.tween(0.3, p => mark.setAttribute('transform', `translate(${end[0]},${end[1] - 30}) scale(${(0.4 + ease(p) * 0.6).toFixed(2)})`));
      res();
    }));
    await Promise.all(promises);
    await MD.U.sleep(900);
  }

  function init(el, cb) {
    svg = el; onPin = cb; build();
    svg.addEventListener('click', e => {
      const p = e.target.closest('[data-pin]');
      if (p) { MD.Audio.play('tap'); onPin(p.getAttribute('data-pin')); }
    });
    MD.onFrame.push(frame);
  }

  MD.Town = { init, setPins, runCrew, BLD };
})();
