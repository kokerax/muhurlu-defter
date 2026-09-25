/* Eşya çizimleri: 100x100 viewBox, mürekkep hatlı gravür üslubu */
(function () {
  const INK = '#24160d';
  const S = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  const S1 = `stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"`;
  const hatch = (d, o = 0.4) => `<path d="${d}" fill="url(#hatch)" opacity="${o}"/>`;
  const shadow = (cx = 50, cy = 90, rx = 30) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="4.5" fill="#000" opacity=".18"/>`;
  const sparkle = (x, y, s = 1) => `<path class="twinkle" d="M${x},${y - 5 * s} L${x + 1.3 * s},${y - 1.3 * s} L${x + 5 * s},${y} L${x + 1.3 * s},${y + 1.3 * s} L${x},${y + 5 * s} L${x - 1.3 * s},${y + 1.3 * s} L${x - 5 * s},${y} L${x - 1.3 * s},${y - 1.3 * s}Z" fill="#fff8e0"/>`;

  const A = {
    ring(v) {
      return `${shadow(50, 88, 26)}
      <ellipse cx="50" cy="64" rx="25" ry="20" fill="none" stroke="${INK}" stroke-width="10"/>
      <ellipse cx="50" cy="64" rx="25" ry="20" fill="none" stroke="${v.metal}" stroke-width="6.5"/>
      <path d="M28,58 A25,20 0 0 1 44,45" fill="none" stroke="#fff" stroke-width="1.6" opacity=".55"/>
      <path d="M35,46 L41,32 H59 L65,46 Q50,52 35,46Z" fill="${v.metal}" ${S}/>
      ${hatch('M52,34 H59 L65,46 Q58,49 52,49Z', .35)}
      <path d="M39,33 L44,19 H56 L61,33 L50,42Z" fill="${v.gem}" ${S}/>
      <path d="M44,19 L50,33 L56,19 M39,33 H61" fill="none" ${S1} opacity=".55"/>
      <path d="M46,22 L49,22 L47,28Z" fill="#fff" opacity=".75"/>
      ${sparkle(62, 18, .9)}`;
    },
    necklace(v) {
      let pearls = '';
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * (0.08 + 0.84 * i / 16);
        const x = 50 - Math.cos(a) * 34, y = 20 + Math.sin(a) * 42;
        pearls += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="${v.gem}" ${S1}/><circle cx="${(x - 1.3).toFixed(1)}" cy="${(y - 1.3).toFixed(1)}" r="1.2" fill="#fff" opacity=".8"/>`;
      }
      return `${shadow(50, 92, 22)}
      <path d="M16,22 C16,70 84,70 84,22" fill="none" stroke="${v.metal}" stroke-width="1.5"/>
      ${pearls}
      <path d="M50,62 L57,72 L50,90 L43,72Z" fill="${v.metal}" ${S}/>
      <path d="M50,67 L54,73 L50,84 L46,73Z" fill="${v.gem}" ${S1}/>
      ${sparkle(58, 78, .8)}`;
    },
    watch(v) {
      let ticks = '';
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        const r1 = i % 3 === 0 ? 17 : 19.5, r2 = 22;
        ticks += `<line x1="${(50 + Math.sin(a) * r1).toFixed(1)}" y1="${(58 - Math.cos(a) * r1).toFixed(1)}" x2="${(50 + Math.sin(a) * r2).toFixed(1)}" y2="${(58 - Math.cos(a) * r2).toFixed(1)}" stroke="${INK}" stroke-width="${i % 3 === 0 ? 2 : 1}"/>`;
      }
      return `${shadow(50, 92, 28)}
      <path d="M50,17 C38,4 16,8 12,22 C8,36 22,40 20,52" fill="none" stroke="${v.metal}" stroke-width="3" stroke-dasharray="3 2"/>
      <circle cx="50" cy="18" r="5.5" fill="none" stroke="${INK}" stroke-width="3.5"/><circle cx="50" cy="18" r="5.5" fill="none" stroke="${v.metal}" stroke-width="2"/>
      <rect x="45.5" y="23" width="9" height="8" rx="2" fill="${v.metal}" ${S}/>
      <circle cx="50" cy="58" r="31" fill="${v.metal}" ${S}/>
      ${hatch('M62,30 A31,31 0 0 1 62,86 A28,28 0 0 0 62,30Z', .45)}
      <circle cx="50" cy="58" r="24.5" fill="${v.gem}" stroke="${INK}" stroke-width="1.6"/>
      ${ticks}
      <line x1="50" y1="58" x2="50" y2="44" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="50" y1="58" x2="61" y2="62" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      <g><line x1="50" y1="62" x2="50" y2="37" stroke="#9a2b1e" stroke-width="1"/>
        <animateTransform attributeName="transform" type="rotate" from="0 50 58" to="360 50 58" dur="60s" repeatCount="indefinite"/></g>
      <circle cx="50" cy="58" r="2" fill="${INK}"/>
      <path d="M30,40 A26,26 0 0 1 44,33" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>`;
    },
    vase(v) {
      return `${shadow(50, 91, 26)}
      <path d="M37,14 H63 L60,24 C60,30 79,40 79,60 C79,79 66,90 50,90 C34,90 21,79 21,60 C21,40 40,30 40,24Z" fill="${v.metal}" ${S}/>
      <ellipse cx="50" cy="14" rx="13" ry="3.2" fill="${v.metal}" ${S}/>
      <path d="M26,46 H74 M23,72 H77" fill="none" stroke="${v.gem}" stroke-width="3"/>
      <path d="M50,76 C50,66 50,60 50,54 M50,62 C44,60 40,56 40,51 C45,51 49,55 50,60 M50,62 C56,60 60,56 60,51 C55,51 51,55 50,60" fill="none" stroke="${v.gem}" stroke-width="2"/>
      <path d="M44,54 C44,46 50,42 50,42 C50,42 56,46 56,54 C53,52 51,52 50,55 C49,52 47,52 44,54Z" fill="${v.gem}" ${S1}/>
      <path d="M30,60 C30,56 34,54 34,54 C34,54 36,58 34,62Z M66,60 C66,56 70,54 70,54 C70,54 72,58 70,62Z" fill="${v.gem}"/>
      ${hatch('M64,36 C72,44 79,52 79,60 C79,79 66,90 54,90 C68,82 72,66 64,36Z', .45)}
      <path d="M30,54 C30,46 36,40 42,36" fill="none" stroke="#fff" stroke-width="2.2" opacity=".55"/>`;
    },
    painting(v) {
      return `${shadow(50, 90, 36)}
      <rect x="11" y="16" width="78" height="66" fill="${v.metal}" ${S}/>
      <rect x="15" y="20" width="70" height="58" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/>
      <rect x="20" y="25" width="60" height="48" fill="${v.gem}" ${S1}/>
      <rect x="20" y="56" width="60" height="17" fill="#2d4a66" opacity=".85"/>
      <circle cx="64" cy="40" r="6" fill="#f4d58a" opacity=".9"/>
      <path d="M20,58 L28,54 L34,56 L40,50 L44,51 L46,40 L48,51 L52,52 L60,55 L70,53 L80,57 L80,60 L20,60Z" fill="#2a2320"/>
      <path d="M44.6,41 L46,34 L47.4,41Z" fill="#2a2320"/>
      <path d="M24,66 H40 M52,68 H74 M30,70 H46" stroke="#e8e0c8" stroke-width="1" opacity=".6"/>
      <path d="M58,62 L66,62 L64,65 L60,65Z M62,62 V56 L66,60Z" fill="#1d1712"/>
      <circle cx="11" cy="16" r="3" fill="${v.metal}" ${S1}/><circle cx="89" cy="16" r="3" fill="${v.metal}" ${S1}/>
      <circle cx="11" cy="82" r="3" fill="${v.metal}" ${S1}/><circle cx="89" cy="82" r="3" fill="${v.metal}" ${S1}/>
      ${hatch('M80,16 H89 V82 H11 V73 H80Z', .35)}`;
    },
    bust(v) {
      return `${shadow(50, 93, 26)}
      <path d="M32,78 H68 L70,92 H30Z" fill="${v.gem}" ${S}/>
      <rect x="28" y="74" width="44" height="6" fill="${v.metal}" ${S}/>
      <path d="M24,74 C26,60 38,55 50,55 C62,55 74,60 76,74Z" fill="${v.metal}" ${S}/>
      <path d="M44,49 L44,57 Q50,60 56,57 L56,49Z" fill="${v.metal}" ${S}/>
      <path d="M36,32 C36,18 44,12 50,12 C58,12 64,18 64,32 C64,44 58,52 50,52 C42,52 36,44 36,32Z" fill="${v.metal}" ${S}/>
      <path d="M36,28 C38,16 48,10 58,14 C62,16 65,22 64,28 C60,22 54,20 46,22 C42,23 38,25 36,28Z" fill="${v.gem}" ${S1}/>
      <path d="M44,33 Q46,31 48,33 M52,33 Q54,31 56,33 M50,35 L49,41 L51,41 M46,45 Q50,47 54,45" fill="none" ${S1}/>
      ${hatch('M56,14 C62,18 64,26 64,32 C64,44 58,52 52,52 C58,44 60,28 56,14Z M60,56 C68,58 74,64 76,74 H62Z', .5)}
      <path d="M40,24 C40,20 43,17 46,16" fill="none" stroke="#fff" stroke-width="1.8" opacity=".5"/>`;
    },
    pistol(v) {
      return `${shadow(50, 84, 38)}
      <path d="M10,38 H66 L70,34 H86 V46 H72 L66,50 H52 C50,58 46,70 38,80 L24,77 C29,67 31,58 30,50 H10Z" fill="${v.gem}" ${S}/>
      <rect x="10" y="37" width="58" height="8" fill="${v.metal}" ${S}/>
      <path d="M40,50 C40,58 46,60 50,56" fill="none" ${S}/>
      <path d="M44,50 L46,56" ${S1}/>
      <path d="M66,34 L70,26 L74,28 L72,34Z" fill="${v.metal}" ${S1}/>
      <circle cx="34" cy="62" r="2.2" fill="${v.metal}"/><circle cx="30" cy="70" r="2" fill="${v.metal}"/><circle cx="37" cy="54" r="1.8" fill="${v.metal}"/>
      <path d="M12,40 H64" stroke="#fff" stroke-width="1.2" opacity=".6"/>
      ${hatch('M52,50 C50,58 46,70 38,80 L32,79 C40,68 44,58 46,50Z', .5)}`;
    },
    dagger(v) {
      return `${shadow(50, 94, 20)}
      <path d="M50,8 C64,24 66,46 57,62 L45,62 C52,46 51,28 50,8Z" fill="#d8dde0" ${S}/>
      <path d="M50,12 C58,26 59,44 53,60" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>
      <path d="M34,61 H66 L63,68 H37Z" fill="${v.metal}" ${S}/>
      <path d="M44,68 H56 L58,86 C58,91 42,91 42,86Z" fill="${v.gem}" ${S}/>
      <circle cx="50" cy="90" r="5" fill="${v.metal}" ${S}/>
      <path d="M44,74 H56 M43,80 H57" stroke="${v.metal}" stroke-width="2"/>
      <circle cx="50" cy="64.5" r="2.4" fill="#b3202c"/>
      ${hatch('M56,20 C64,34 64,50 57,62 L53,62 C60,48 60,34 56,20Z', .35)}`;
    },
    book(v) {
      return `${shadow(52, 91, 32)}
      <path d="M26,18 H80 V86 H26Z" fill="#efe4c8" ${S}/>
      <path d="M22,14 H76 Q80,14 80,18 V82 Q80,86 76,86 H22Z" fill="${v.gem}" ${S}/>
      <rect x="22" y="14" width="8" height="72" fill="#000" opacity=".22"/>
      <rect x="34" y="20" width="40" height="60" fill="none" stroke="${v.metal}" stroke-width="1.6"/>
      <ellipse cx="54" cy="50" rx="12" ry="16" fill="${v.metal}" ${S1}/>
      <path d="M54,38 L57,47 L66,50 L57,53 L54,62 L51,53 L42,50 L51,47Z" fill="${v.gem}" opacity=".8"/>
      <path d="M34,20 L42,20 L34,28Z M74,20 L66,20 L74,28Z M34,80 L42,80 L34,72Z M74,80 L66,80 L74,72Z" fill="${v.metal}"/>
      <path d="M80,24 V82" stroke="${INK}" stroke-width="1" opacity=".4" stroke-dasharray="1 2"/>`;
    },
    candle(v) {
      const flame = x => `<g class="flame" style="transform-origin:${x}px 20px"><path d="M${x},8 C${x + 4},14 ${x + 4},18 ${x},21 C${x - 4},18 ${x - 4},14 ${x},8Z" fill="#f4b23c"/><path d="M${x},12 C${x + 2},16 ${x + 2},18 ${x},20 C${x - 2},18 ${x - 2},16 ${x},12Z" fill="#fff4c4"/></g>`;
      return `${shadow(50, 92, 22)}
      <ellipse cx="50" cy="86" rx="20" ry="5" fill="${v.metal}" ${S}/>
      <path d="M46,86 L47,60 H53 L54,86Z" fill="${v.metal}" ${S}/>
      <path d="M50,58 C40,58 26,54 26,40 M50,58 C60,58 74,54 74,40 M50,58 V38" fill="none" stroke="${INK}" stroke-width="5.5"/>
      <path d="M50,58 C40,58 26,54 26,40 M50,58 C60,58 74,54 74,40 M50,58 V38" fill="none" stroke="${v.metal}" stroke-width="3"/>
      <rect x="20" y="36" width="12" height="4" fill="${v.metal}" ${S1}/><rect x="68" y="36" width="12" height="4" fill="${v.metal}" ${S1}/><rect x="44" y="34" width="12" height="4" fill="${v.metal}" ${S1}/>
      <rect x="23" y="22" width="6" height="14" fill="${v.gem}" ${S1}/><rect x="71" y="22" width="6" height="14" fill="${v.gem}" ${S1}/><rect x="47" y="20" width="6" height="14" fill="${v.gem}" ${S1}/>
      ${flame(26)}${flame(74)}${flame(50)}`;
    },
    gramophone(v) {
      return `${shadow(48, 92, 32)}
      <path d="M18,64 H70 V88 H18Z" fill="${v.gem}" ${S}/>
      <rect x="23" y="68" width="42" height="16" fill="none" stroke="${v.metal}" stroke-width="1.3"/>
      <ellipse cx="42" cy="63" rx="24" ry="4.5" fill="#1c1410" ${S1}/>
      <path d="M58,62 L52,54 L56,52" fill="none" stroke="${v.metal}" stroke-width="3"/>
      <path d="M54,54 C58,44 64,36 68,30 L88,10 C94,20 94,36 84,42 L74,38 C68,44 62,50 58,56Z" fill="${v.metal}" ${S}/>
      <path d="M88,10 C94,20 94,36 84,42 C86,30 86,20 88,10Z" fill="#6b4b22" ${S1}/>
      <path d="M66,34 L84,18 M62,40 L86,28" stroke="${INK}" stroke-width=".8" opacity=".5"/>
      <path d="M72,20 L80,14" stroke="#fff" stroke-width="1.5" opacity=".6"/>
      ${hatch('M18,64 H70 V88 H56 V68 H18Z', .3)}`;
    },
    coffee(v) {
      return `${shadow(50, 90, 36)}
      <ellipse cx="50" cy="84" rx="38" ry="7" fill="${v.metal}" ${S}/>
      <path d="M18,52 L22,82 H44 L48,52Z" fill="${v.metal}" ${S}/>
      <path d="M16,50 H50" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M48,54 L76,36" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M48,54 L76,36" stroke="#5a3a22" stroke-width="2" stroke-linecap="round"/>
      <path d="M58,60 L60,78 H76 L78,60Z" fill="${v.metal}" ${S}/>
      <path d="M58.5,60 H77.5 L77,64 H59Z" fill="${v.gem}" ${S1}/>
      <ellipse cx="68" cy="80" rx="12" ry="2.6" fill="${v.metal}" ${S1}/>
      <path d="M62,66 L64,74 M68,66 V75 M74,66 L72,74" stroke="${INK}" stroke-width=".8" opacity=".6"/>
      <path d="M24,56 L26,78" stroke="#fff" stroke-width="1.8" opacity=".5"/>
      <g class="steam"><path d="M30,44 C26,38 34,34 30,28 M38,44 C34,38 42,34 38,28" fill="none" stroke="#fff" stroke-width="1.5" opacity=".5"/></g>`;
    },
  };

  function wear(it) {
    if (it.c === 0) return `<g opacity=".7"><path d="M32,30 L40,42 L36,50 L44,62 M64,56 L58,64 L62,72" fill="none" stroke="${INK}" stroke-width="1.3"/><circle cx="60" cy="40" r="3" fill="#5a4a30" opacity=".5"/><circle cx="38" cy="70" r="4" fill="#5a4a30" opacity=".4"/></g>`;
    if (it.c === 1) return `<g opacity=".45"><path d="M36,40 L42,48 M62,64 L66,70" stroke="${INK}" stroke-width="1"/></g>`;
    return '';
  }

  MD.Art = {
    item(it, opts = {}) {
      const C = MD.D.CATS[it.cat];
      const v = C.v[it.vi];
      const vb = opts.vb || '0 0 100 100';
      return `<svg viewBox="${vb}" class="item-svg" aria-hidden="true">${A[C.art](v)}${wear(it)}</svg>`;
    },
    inner(it) {
      const C = MD.D.CATS[it.cat];
      return A[C.art](C.v[it.vi]) + wear(it);
    },
  };
})();
