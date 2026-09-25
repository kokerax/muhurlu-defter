/* Karakter iskeleti: SVG parçalar + kare kare animasyon (yürüme, nefes, göz kırpma, konuşma, jest, duygu) */
(function () {
  const { rnd, pick, clamp, lerp } = MD.U;
  const INK = '#24160d';
  const SK = ['#f2d4b3', '#e6bd94', '#d2a278', '#b8845c', '#8e5e3e'];
  const HAIR = ['#1d130c', '#3a2414', '#5e3b1f', '#8c5a2e', '#b88a4e', '#8a8680', '#d2cdc2'];
  const COAT = ['#39414d', '#4b3627', '#2e3e34', '#5a4938', '#6a2e29', '#2b2b31', '#76674f', '#364b61', '#58503f'];
  const TIE = ['#7e2323', '#23466e', '#2f5a31', '#6b4b1c', '#4a2a55', '#8a6a2a'];
  const DRESS = ['#6a2e3e', '#2e4a5e', '#4a5e3a', '#7a5a3a', '#3e3350', '#8a4a3a', '#2f4f4f'];
  const HATC = ['#2b2420', '#3d3328', '#4a3b2c', '#2a3140', '#5a4a3a'];

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = clamp(Math.round(r * k), 0, 255); g = clamp(Math.round(g * k), 0, 255); b = clamp(Math.round(b * k), 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function randSpec(o = {}) {
    const f = o.f != null ? o.f : Math.random() < 0.35;
    const old = o.old != null ? o.old : Math.random() < 0.3;
    const s = {
      f, old,
      skin: pick(SK),
      hair: old ? pick(HAIR.slice(5)) : pick(HAIR.slice(0, 5)),
      hs: f ? pick(['bun', 'bob', 'wave']) : pick(old ? ['bald', 'short', 'slick'] : ['short', 'slick', 'curly', 'short']),
      hat: f ? pick(['none', 'cloche', 'none', 'beret']) : pick(['none', 'fez', 'fedora', 'kasket', 'bowler', 'fez', 'none']),
      hatc: pick(HATC),
      mus: f ? 'none' : pick(['none', 'thick', 'handle', 'none', 'thick', 'beard', 'thin']),
      gls: pick(old ? ['none', 'round', 'round', 'monocle'] : ['none', 'none', 'none', 'round', 'monocle']),
      coat: pick(COAT), tie: pick(TIE), dress: pick(DRESS),
      vest: Math.random() < 0.55, bow: Math.random() < 0.25, pearls: Math.random() < 0.5,
      w: rnd(0.93, 1.12),
      acc: 'none',
    };
    return Object.assign(s, o);
  }

  /* ---------- çizim ---------- */
  const SW = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  const SW1 = `stroke="${INK}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"`;

  const BROWS = {
    n: ['M-24,-209 Q-15,-213 -6,-209', 'M24,-209 Q15,-213 6,-209'],
    up: ['M-24,-214 Q-15,-219 -6,-215', 'M24,-214 Q15,-219 6,-215'],
    angry: ['M-24,-213 Q-15,-210 -5,-204', 'M24,-213 Q15,-210 5,-204'],
    sad: ['M-24,-205 Q-15,-208 -6,-213', 'M24,-205 Q15,-208 6,-213'],
    sly: ['M-24,-209 Q-15,-211 -6,-208', 'M24,-214 Q15,-218 6,-213'],
  };
  const MOUTHS = {
    n: 'M-9,-167 Q0,-166 9,-167',
    smile: 'M-11,-169 Q0,-160 11,-169',
    grin: 'M-12,-170 Q0,-155 12,-170 Q0,-166 -12,-170Z',
    frown: 'M-10,-163 Q0,-170 10,-163',
    flat: 'M-8,-166 L8,-166',
    O: 'M-5,-166 Q-5,-158 0,-158 Q5,-158 5,-166 Q5,-173 0,-173 Q-5,-173 -5,-166Z',
    tA: 'M-8,-168 Q0,-162 8,-168 Q0,-170 -8,-168Z',
    tB: 'M-8,-169 Q0,-157 8,-169 Q0,-172 -8,-169Z',
    smirk: 'M-9,-166 Q2,-164 11,-171',
  };
  const EMO = {
    neutral: { b: 'n', m: 'n', fl: 0 },
    happy: { b: 'up', m: 'smile', fl: 0.1 },
    delight: { b: 'up', m: 'grin', fl: 0.2 },
    annoyed: { b: 'angry', m: 'flat', fl: 0.2 },
    angry: { b: 'angry', m: 'frown', fl: 0.65 },
    sad: { b: 'sad', m: 'frown', fl: 0 },
    surprised: { b: 'up', m: 'O', fl: 0.15 },
    sly: { b: 'sly', m: 'smirk', fl: 0 },
    think: { b: 'sly', m: 'flat', fl: 0 },
    worried: { b: 'sad', m: 'flat', fl: 0.1 },
  };

  function hairFront(s) {
    const h = s.hair;
    switch (s.hs) {
      case 'short': return `<path d="M-33,-196 C-36,-236 -16,-243 0,-243 C18,-243 36,-236 33,-196 C31,-214 20,-223 2,-223 C-16,-223 -30,-214 -33,-196Z" fill="${h}" ${SW}/>
        <path d="M-33,-198 L-33,-184 L-29,-186 L-29,-204Z M33,-198 L33,-184 L29,-186 L29,-204Z" fill="${h}"/>`;
      case 'slick': return `<path d="M-33,-194 C-37,-238 -14,-244 2,-244 C20,-244 37,-236 33,-194 C32,-212 24,-224 4,-226 C-12,-226 -28,-216 -33,-194Z" fill="${h}" ${SW}/>
        <path d="M-12,-241 Q-8,-232 -6,-225" fill="none" stroke="#fff" stroke-width="1.4" opacity=".35"/>
        <path d="M6,-240 Q16,-236 24,-226" fill="none" stroke="#fff" stroke-width="1.2" opacity=".25"/>`;
      case 'curly': {
        let c = '';
        for (let x = -28; x <= 28; x += 8) c += `<circle cx="${x}" cy="${(-226 - (1 - (x / 32) ** 2) * 12).toFixed(1)}" r="8.5" fill="${h}" ${SW1}/>`;
        return c + `<path d="M-33,-200 L-32,-186 L-28,-190Z M33,-200 L32,-186 L28,-190Z" fill="${h}"/>`;
      }
      case 'bald': return `<path d="M-33,-200 Q-37,-214 -30,-219 L-29,-200Z M33,-200 Q37,-214 30,-219 L29,-200Z" fill="${h}" ${SW1}/>
        <ellipse cx="-10" cy="-222" rx="9" ry="4" fill="#fff" opacity=".28"/>`;
      case 'bun': return `<circle cx="0" cy="-246" r="11" fill="${h}" ${SW}/>
        <path d="M-33,-194 C-36,-240 36,-240 33,-194 C28,-214 14,-222 0,-222 C-14,-222 -28,-214 -33,-194Z" fill="${h}" ${SW}/>
        <path d="M-6,-236 Q0,-226 6,-236" fill="none" stroke="#fff" stroke-width="1" opacity=".3"/>`;
      case 'bob': return `<path d="M-34,-198 C-35,-240 35,-240 34,-198 C28,-214 12,-206 2,-216 C-8,-206 -26,-214 -34,-198Z" fill="${h}" ${SW}/>`;
      case 'wave': return `<path d="M-34,-196 C-36,-240 36,-242 34,-196 C30,-222 14,-222 -4,-226 C-14,-214 -26,-212 -34,-196Z" fill="${h}" ${SW}/>
        <path d="M-2,-238 Q10,-232 22,-222" fill="none" stroke="#fff" stroke-width="1.2" opacity=".3"/>`;
    }
    return '';
  }
  function hairBack(s) {
    const h = s.hair;
    if (s.hs === 'bob') return `<path d="M-38,-200 C-42,-244 42,-244 38,-200 L40,-158 Q30,-152 24,-160 L-24,-160 Q-30,-152 -40,-158Z" fill="${h}" ${SW}/>`;
    if (s.hs === 'wave') return `<path d="M-38,-200 C-44,-246 44,-246 38,-200 C44,-172 52,-142 44,-118 Q34,-114 26,-126 L-26,-126 Q-34,-114 -44,-118 C-52,-142 -44,-172 -38,-200Z" fill="${h}" ${SW}/>
      <path d="M-40,-170 Q-46,-150 -42,-130 M40,-170 Q46,-150 42,-130" fill="none" stroke="#000" stroke-width="1" opacity=".3"/>`;
    return '';
  }
  function hat(s) {
    const c = s.hatc;
    switch (s.hat) {
      case 'fez': return `<path d="M-24,-223 L-19,-262 L19,-262 L24,-223 Q0,-218 -24,-223Z" fill="#8e2a22" ${SW}/>
        <ellipse cx="0" cy="-262" rx="19" ry="4" fill="#7a221c" ${SW1}/>
        <path d="M8,-262 L14,-224 L24,-223 L19,-262Z" fill="url(#hatch)" opacity=".4"/>`;
      case 'fedora': return `<path d="M-28,-226 L-24,-257 Q0,-266 24,-257 L28,-226Z" fill="${c}" ${SW}/>
        <path d="M-9,-262 Q0,-252 9,-262" fill="none" ${SW1}/>
        <path d="M-28,-233 L28,-233 L28,-226 L-28,-226Z" fill="${shade(c, .55)}"/>
        <path d="M-48,-222 Q0,-210 48,-222 Q40,-231 0,-228 Q-40,-231 -48,-222Z" fill="${c}" ${SW}/>
        <path d="M10,-258 L24,-257 L28,-226 L14,-226Z" fill="url(#hatch)" opacity=".45"/>`;
      case 'kasket': return `<path d="M-35,-212 C-37,-244 -10,-254 10,-250 C32,-247 40,-232 36,-216 Q0,-226 -35,-212Z" fill="#6b5a44" ${SW}/>
        <path d="M-36,-214 Q-6,-203 28,-213 Q0,-222 -36,-214Z" fill="#4e4132" ${SW}/>
        <circle cx="2" cy="-249" r="2.6" fill="#4e4132" ${SW1}/>
        <path d="M-20,-240 L-12,-226 M-4,-246 L2,-228 M12,-246 L16,-230" stroke="${INK}" stroke-width=".8" opacity=".35"/>`;
      case 'bowler': return `<path d="M-27,-223 C-28,-266 28,-266 27,-223Z" fill="#231c18" ${SW}/>
        <path d="M-27,-230 L27,-230 L27,-224 L-27,-224Z" fill="#3a2e28"/>
        <path d="M-39,-221 Q0,-213 39,-221 Q0,-229 -39,-221Z" fill="#231c18" ${SW}/>
        <path d="M-14,-252 Q-6,-259 4,-259" fill="none" stroke="#fff" stroke-width="1.4" opacity=".25"/>`;
      case 'cloche': return `<path d="M-37,-194 C-41,-248 41,-248 37,-194 Q30,-206 0,-208 Q-30,-206 -37,-194Z" fill="${c}" ${SW}/>
        <path d="M-36,-206 Q0,-216 36,-206" fill="none" stroke="${shade(c, .6)}" stroke-width="4"/>
        <circle cx="-22" cy="-208" r="5.5" fill="#b3444a" ${SW1}/>`;
      case 'beret': return `<ellipse cx="4" cy="-236" rx="36" ry="11" fill="${c}" ${SW} transform="rotate(-9 4 -236)"/>
        <path d="M6,-247 L8,-253" ${SW}/>`;
      case 'kepi': return `<path d="M-30,-222 L-27,-255 Q0,-261 27,-255 L30,-222Z" fill="#23304a" ${SW}/>
        <path d="M-30,-231 H30" stroke="#c49a45" stroke-width="3"/>
        <path d="M-33,-221 Q0,-207 33,-221 Q0,-217 -33,-221Z" fill="#141414" ${SW1}/>
        <path d="M0,-251 L3,-244 L10,-244 L4.5,-240 L6.5,-233 L0,-237 L-6.5,-233 L-4.5,-240 L-10,-244 L-3,-244Z" fill="#d6aa4c" ${SW1}/>`;
    }
    return '';
  }
  function mustache(s) {
    const h = s.old ? s.hair : shade(s.hair, 0.9);
    switch (s.mus) {
      case 'thick': return `<path d="M-17,-171 Q-9,-181 0,-176 Q9,-181 17,-171 Q9,-173 0,-170 Q-9,-173 -17,-171Z" fill="${h}" ${SW1}/>`;
      case 'thin': return `<path d="M-12,-172 Q-6,-176 0,-174 Q6,-176 12,-172" fill="none" stroke="${h}" stroke-width="2.6"/>`;
      case 'handle': return `<path d="M-2,-176 Q-10,-180 -18,-174 Q-24,-172 -24,-178 Q-22,-170 -14,-171 Q-7,-172 0,-171 Q7,-172 14,-171 Q22,-170 24,-178 Q24,-172 18,-174 Q10,-180 2,-176Z" fill="${h}" ${SW1}/>`;
      case 'beard': return `<path d="M-30,-184 C-30,-162 -16,-146 0,-146 C16,-146 30,-162 30,-184 C26,-170 18,-160 12,-160 Q0,-156 -12,-160 C-18,-160 -26,-170 -30,-184Z" fill="${h}" ${SW1}/>
        <path d="M-15,-171 Q-7,-179 0,-175 Q7,-179 15,-171 Q7,-172 0,-170 Q-7,-172 -15,-171Z" fill="${h}" ${SW1}/>`;
    }
    return '';
  }
  function glasses(s) {
    if (s.gls === 'round') return `<g fill="#fff" fill-opacity=".12" stroke="${INK}" stroke-width="1.8"><circle cx="-14" cy="-193" r="9"/><circle cx="14" cy="-193" r="9"/></g>
      <path d="M-5,-194 Q0,-197 5,-194 M-23,-194 L-32,-196 M23,-194 L32,-196" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
    if (s.gls === 'monocle') return `<circle cx="14" cy="-193" r="9.5" fill="#fff" fill-opacity=".14" stroke="#b08a3a" stroke-width="2"/>
      <path d="M22,-188 Q30,-170 26,-140" fill="none" stroke="#b08a3a" stroke-width="1" stroke-dasharray="2 1.5"/>`;
    return '';
  }

  function torso(s) {
    const w = s.w;
    if (s.f) {
      const d = s.dress;
      return `<path d="M${-52 * w},-124 C${-66 * w},-118 ${-70 * w},-96 ${-70 * w},-64 L${-60 * w},-22 L${-86 * w},112 L${86 * w},112 L${60 * w},-22 L${70 * w},-64 C${70 * w},-96 ${66 * w},-118 ${52 * w},-124 Q0,-134 ${-52 * w},-124Z" fill="${d}" ${SW}/>
        <path d="M${34 * w},-126 C${64 * w},-116 ${70 * w},-90 ${68 * w},-60 L${58 * w},-22 L${84 * w},112 L${50 * w},112 L${40 * w},-22 C${48 * w},-70 ${46 * w},-104 ${34 * w},-126Z" fill="url(#hatch)" opacity=".4"/>
        <path d="M${-60 * w},-24 L${60 * w},-24" stroke="${shade(d, .6)}" stroke-width="6"/>
        <path d="M-40,40 Q-30,70 -44,108 M20,20 Q34,60 26,110" fill="none" stroke="#000" stroke-width="1.2" opacity=".25"/>
        <path d="M-24,-132 Q-22,-108 -2,-115 L0,-123 L2,-115 Q22,-108 24,-132 Q0,-124 -24,-132Z" fill="#f1eadb" ${SW1}/>
        ${s.pearls ? [-14, -9, -3, 3, 9, 14].map((x, i) => `<circle cx="${x}" cy="${-110 + Math.abs(x) * -0.25 + (i === 2 || i === 3 ? 3 : 0)}" r="2.3" fill="#f6f0e0" stroke="${INK}" stroke-width=".7"/>`).join('') : ''}`;
    }
    const c = s.coat, dk = shade(c, 0.72), vest = s.vest ? shade(c, 1.35) : '#efe6d2';
    return `<path d="M${-60 * w},-124 C${-74 * w},-118 ${-80 * w},-96 ${-80 * w},-64 L${-82 * w},60 L${82 * w},60 L${80 * w},-64 C${80 * w},-96 ${74 * w},-118 ${60 * w},-124 Q0,-136 ${-60 * w},-124Z" fill="${c}" ${SW}/>
      <path d="M-17,-134 L0,-88 L17,-134Z" fill="#efe6d2" ${SW1}/>
      <path d="M-24,-126 L-28,-26 L0,-16 L28,-26 L24,-126 L0,-90Z" fill="${vest}" ${SW1}/>
      ${s.vest ? `<circle cx="0" cy="-76" r="1.8" fill="${INK}"/><circle cx="0" cy="-60" r="1.8" fill="${INK}"/><circle cx="0" cy="-44" r="1.8" fill="${INK}"/>
      <path d="M-16,-50 Q-6,-44 0,-52" fill="none" stroke="#c49a45" stroke-width="1.4"/>` : ''}
      ${s.bow ? `<path d="M-12,-133 L-12,-121 L0,-127Z M12,-133 L12,-121 L0,-127Z" fill="${s.tie}" ${SW1}/><circle cx="0" cy="-127" r="2.8" fill="${s.tie}" ${SW1}/>`
        : `<path d="M-5,-129 L5,-129 L6,-118 L0,-88 L-6,-118Z" fill="${s.tie}" ${SW1}/>`}
      <path d="M-17,-134 L-38,-121 L-27,-100 L-34,-52 L-3,-90Z" fill="${dk}" ${SW1}/>
      <path d="M17,-134 L38,-121 L27,-100 L34,-52 L3,-90Z" fill="${dk}" ${SW1}/>
      <path d="M0,-16 L0,60" stroke="${INK}" stroke-width="1.4" opacity=".7"/>
      <circle cx="-7" cy="-2" r="2.3" fill="${dk}" ${SW1}/><circle cx="-7" cy="20" r="2.3" fill="${dk}" ${SW1}/>
      <path d="M-50,-98 L-38,-98 L-44,-106Z" fill="#f1eadb" ${SW1}/>
      <path d="M-56,-94 L-36,-94" stroke="${INK}" stroke-width="1.2" opacity=".6"/>
      <path d="M${32 * w},-128 C${70 * w},-120 ${80 * w},-90 ${82 * w},60 L${48 * w},60 C${52 * w},-20 ${48 * w},-90 ${32 * w},-128Z" fill="url(#hatch)" opacity=".45"/>`;
  }

  function legs(s) {
    if (s.f) {
      const st = '#c9a88a';
      const leg = sgn => `<path d="M${-20 * sgn},96 L${-19 * sgn},178 L${-8 * sgn},178 L${-7 * sgn},96Z" fill="${st}" ${SW1}/>
        <path d="M${-22 * sgn},176 Q${-24 * sgn},188 ${-12 * sgn},189 L${-2 * sgn},189 Q${-1 * sgn},180 ${-8 * sgn},176Z" fill="#241712" ${SW1}/>`;
      return [leg(1), leg(-1)];
    }
    const tr = shade(s.coat, 0.8);
    const leg = sgn => `<path d="M${-32 * sgn},16 L${-30 * sgn},176 L${-8 * sgn},176 L${-5 * sgn},16Z" fill="${tr}" ${SW}/>
      <path d="M${-19 * sgn},60 L${-19 * sgn},172" stroke="#000" stroke-width="1" opacity=".3"/>
      <path d="M${-34 * sgn},175 Q${-37 * sgn},190 ${-20 * sgn},190 L${-2 * sgn},190 Q${0 * sgn},178 ${-8 * sgn},175Z" fill="#1c120c" ${SW1}/>
      <path d="M${-26 * sgn},180 L${-16 * sgn},180" stroke="#fff" stroke-width="1.4" opacity=".3"/>`;
    return [leg(1), leg(-1)];
  }

  function arm(s, sgn) {
    const w = s.w, c = s.f ? s.dress : s.coat;
    const X = x => x * sgn * w;
    const hx = X(-69);
    return {
      upper: `<path d="M${X(-74)},-122 C${X(-86)},-104 ${X(-86)},-84 ${X(-83)},-56 L${X(-55)},-56 C${X(-56)},-84 ${X(-54)},-104 ${X(-50)},-120Z" fill="${c}" ${SW}/>`,
      fore: `<path d="M${X(-83)},-62 L${X(-81)},0 L${X(-57)},0 L${X(-55)},-62Z" fill="${c}" ${SW}/>
        <path d="M${X(-81)},-6 L${X(-57)},-6 L${X(-57)},3 L${X(-81)},3Z" fill="${s.f ? '#f1eadb' : '#efe6d2'}" ${SW1}/>
        <circle cx="${hx}" cy="13" r="9.5" fill="${s.skin}" ${SW}/>
        <ellipse cx="${hx + 7 * sgn}" cy="8" rx="3.4" ry="6" fill="${s.skin}" ${SW1} transform="rotate(${-20 * sgn} ${hx + 7 * sgn} 8)"/>`,
      SL: [X(-62), -116], EL: [X(-69), -60], H: [hx, 13],
    };
  }

  function head(s) {
    const lips = s.f ? '#9b3a3a' : '#6a2a22';
    return `
      <ellipse cx="-33" cy="-189" rx="5.5" ry="8.5" fill="${s.skin}" ${SW1}/>
      <ellipse cx="33" cy="-189" rx="5.5" ry="8.5" fill="${s.skin}" ${SW1}/>
      <path d="M-32,-196 C-32,-222 -18,-233 0,-233 C18,-233 32,-222 32,-196 C32,-172 20,-152 0,-151 C-20,-152 -32,-172 -32,-196Z" fill="${s.skin}" ${SW}/>
      <path d="M17,-224 C29,-212 32,-192 28,-173 C23,-161 13,-154 4,-152 C19,-166 24,-196 17,-224Z" fill="url(#hatch)" opacity=".38"/>
      ${s.old ? `<path d="M-14,-219 Q0,-222 14,-219 M-10,-214 Q0,-216 10,-214" fill="none" stroke="${INK}" stroke-width="1" opacity=".45"/>` : ''}
      ${hairFront(s)}
      <g class="a-face">
        <g class="a-flush" opacity="0"><ellipse cx="-20" cy="-177" rx="8" ry="4.5" fill="#c0392b"/><ellipse cx="20" cy="-177" rx="8" ry="4.5" fill="#c0392b"/></g>
        ${s.f ? `<ellipse cx="-20" cy="-177" rx="7" ry="4" fill="#d9716a" opacity=".3"/><ellipse cx="20" cy="-177" rx="7" ry="4" fill="#d9716a" opacity=".3"/>` : ''}
        <g class="a-eyes">
          <ellipse cx="-14" cy="-193" rx="6.2" ry="4.6" fill="#f6efdf" ${SW1}/>
          <ellipse cx="14" cy="-193" rx="6.2" ry="4.6" fill="#f6efdf" ${SW1}/>
          <g class="a-pupils"><circle cx="-14" cy="-193" r="2.9" fill="${INK}"/><circle cx="14" cy="-193" r="2.9" fill="${INK}"/>
            <circle cx="-15" cy="-194" r=".9" fill="#fff"/><circle cx="13" cy="-194" r=".9" fill="#fff"/></g>
          ${s.f ? `<path d="M-21,-196 L-24,-199 M-19,-197.5 L-21,-201 M21,-196 L24,-199 M19,-197.5 L21,-201" stroke="${INK}" stroke-width="1.2"/>` : ''}
          ${s.old ? `<path d="M-20,-188 Q-14,-185 -8,-188 M20,-188 Q14,-185 8,-188" fill="none" stroke="${INK}" stroke-width=".9" opacity=".5"/>` : ''}
        </g>
        <path class="a-brow a-browL" d="${BROWS.n[0]}" fill="none" stroke="${shade(s.hair, .8)}" stroke-width="3.4" stroke-linecap="round"/>
        <path class="a-brow a-browR" d="${BROWS.n[1]}" fill="none" stroke="${shade(s.hair, .8)}" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M-1,-195 Q-6,-182 -7,-177 Q-2,-173 5,-176" fill="none" ${SW1}/>
        <path class="a-mouth" d="${MOUTHS.n}" fill="${lips}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        ${mustache(s)}
        ${glasses(s)}
      </g>
      ${hat(s)}
      ${s.hat === 'fez' ? `<g class="a-tassel"><path d="M2,-262 Q12,-264 16,-257 L17,-238" fill="none" stroke="#1d130c" stroke-width="2"/>
        <path d="M13,-242 L21,-242 L22,-228 L12,-228Z" fill="#1d130c"/></g>` : ''}`;
  }

  function accessory(s, hand, sgn) {
    const [hx, hy] = hand;
    if (s.acc === 'cigar' && sgn === 1) {
      return `<path d="M${hx - 4},${hy - 5} L${hx - 30},${hy - 9} L${hx - 30},${hy - 2} L${hx - 4},${hy + 1}Z" fill="#6b4524" ${SW1}/>
        <path d="M${hx - 12},${hy - 6.5} L${hx - 12},${hy - 0.5}" stroke="#b3202c" stroke-width="3"/>
        <circle class="a-ember" cx="${hx - 30}" cy="${hy - 5.5}" r="3" fill="#e8742a"/>`;
    }
    return '';
  }

  /* hareket pozları: [omuz, dirsek] içe doğru pozitif */
  const POSES = {
    idle: { L: [4, 6], R: [4, 6] },
    counter: { L: [14, 62], R: [14, 62] },
    present: { L: [4, 6], R: [-30, -70] },
    think: { L: [18, 100], R: [40, 132] },
    cross: { L: [18, 100], R: [20, 104] },
    shrug: { L: [-20, -115], R: [-20, -115] },
    wave: { L: [4, 6], R: [-150, -20] },
    point: { L: [4, 6], R: [-78, -12] },
    offer: { L: [4, 6], R: [30, 96] },
    cigar: { L: [16, 64], R: [36, 128] },
    fists: { L: [-12, 40], R: [-12, 40] },
  };

  function rot(p, c, deg) {
    const a = deg * Math.PI / 180, x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
  }

  const NS = 'http://www.w3.org/2000/svg';
  const ALL = new Set();

  class Actor {
    constructor(spec) {
      this.spec = spec;
      const s = spec;
      this.aL = arm(s, 1); this.aR = arm(s, -1);
      const [legL, legR] = legs(s);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'actor');
      g.innerHTML = `<g class="a-bob"><g transform="translate(0,-190)">
        <ellipse class="a-shadow" cx="0" cy="190" rx="${48 * s.w}" ry="9" fill="#000" opacity=".22"/>
        <g class="a-legL">${legL}</g><g class="a-legR">${legR}</g>
        <g class="a-upper">
          <g class="a-hairback">${hairBack(s)}</g>
          ${torso(s)}
          <path d="M-11,-162 L-12,-128 Q0,-120 12,-128 L11,-162Z" fill="${s.skin}" ${SW}/>
          <ellipse cx="0" cy="-154" rx="12" ry="4" fill="#000" opacity=".18"/>
          <g class="a-head">${head(s)}</g>
          <g class="a-armL">${this.aL.upper}<g class="a-foreL">${this.aL.fore}${accessory(s, this.aL.H, -1)}</g></g>
          <g class="a-armR">${this.aR.upper}<g class="a-foreR">${this.aR.fore}${accessory(s, this.aR.H, 1)}</g></g>
          ${s.acc === 'tespih' ? `<g class="a-beads">${beads()}</g>` : ''}
          <g class="a-smoke"></g>
        </g>
      </g></g>`;
      this.el = g;
      const q = c => g.querySelector(c);
      this.p = {
        bob: q('.a-bob'), upper: q('.a-upper'), legL: q('.a-legL'), legR: q('.a-legR'), head: q('.a-head'), hairback: q('.a-hairback'),
        face: q('.a-face'), eyes: q('.a-eyes'), pupils: q('.a-pupils'), browL: q('.a-browL'), browR: q('.a-browR'),
        mouth: q('.a-mouth'), flush: q('.a-flush'), armL: q('.a-armL'), armR: q('.a-armR'), foreL: q('.a-foreL'), foreR: q('.a-foreR'),
        tassel: q('.a-tassel'), beads: q('.a-beads'), smoke: q('.a-smoke'), ember: q('.a-ember'), shadow: q('.a-shadow'),
      };
      this.x = 0; this.y = 0; this.s = 1; this.flip = 1;
      this.t = Math.random() * 10;
      this.pose = s.acc === 'cigar' ? 'cigar' : 'idle';
      const P = POSES[this.pose];
      this.ang = { Ls: P.L[0], Le: P.L[1], Rs: P.R[0], Re: P.R[1] };
      this.emotion = 'neutral'; this.emoUntil = 0; this.baseEmotion = 'neutral';
      this.talking = false;
      this.look = 0; this.lookT = 0; this.lookY = 0;
      this.blinkT = rnd(1, 4); this.blinkK = 0;
      this.walk = null; this.wb = 0;
      this.hopT = 0; this.shakeT = 0; this.nodT = 0;
      this.fl = 0;
      this.tas = { a: 0, v: 0 }; this.bd = { a: 0, v: 0 };
      this.puffT = 0; this.puffs = [];
      this._b = ''; this._m = '';
      this.prevHead = 0;
      ALL.add(this);
    }
    place(x, y, s) { this.x = x; this.y = y; this.s = s; this.apply(0); return this; }
    walkTo(x, y, s, dur = 1.6) {
      return new Promise(res => {
        this.walk = { x0: this.x, y0: this.y, s0: this.s, x1: x, y1: y, s1: s, p: 0, dur, res };
        this.lookT = x > this.x ? 1 : -1;
      });
    }
    setPose(p) { if (POSES[p]) this.pose = p; }
    setEmotion(e, ms) {
      if (!EMO[e]) return;
      if (ms) { this.emotion = e; this.emoUntil = performance.now() + ms; }
      else { this.baseEmotion = e; if (!this.emoUntil) this.emotion = e; }
    }
    hop() { this.hopT = 0.38; }
    shake() { this.shakeT = 0.7; }
    nod() { this.nodT = 0.6; }
    remove() { this.el.remove(); ALL.delete(this); }
    handWorld(side) {
      const a = side === 'L' ? this.aL : this.aR, sg = side === 'L' ? -1 : 1;
      const S = this.ang[side + 's'] * sg, E = this.ang[side + 'e'] * sg;
      const el = rot(a.EL, a.SL, S);
      const h = rot([a.H[0], a.H[1]], a.EL, S + E);
      return [h[0] - a.EL[0] + el[0], h[1] - a.EL[1] + el[1]];
    }
    apply(dt) {
      const s = this.spec, p = this.p, t = this.t;
      const now = performance.now();
      if (this.emoUntil && now > this.emoUntil) { this.emoUntil = 0; this.emotion = this.baseEmotion; }
      // yürüyüş
      let walking = 0;
      if (this.walk) {
        const w = this.walk;
        w.p = Math.min(1, w.p + dt / w.dur);
        const e = w.p < 1 ? w.p : 1;
        this.x = lerp(w.x0, w.x1, e); this.y = lerp(w.y0, w.y1, e); this.s = lerp(w.s0, w.s1, e);
        walking = 1;
        if (w.p >= 1) { this.walk = null; this.lookT = 0; w.res(); }
      }
      this.wb = lerp(this.wb, walking, 1 - Math.exp(-dt * 10));
      const wb = this.wb, ph = t * 8.5;
      let hopY = 0;
      if (this.hopT > 0) { this.hopT -= dt; hopY = -Math.sin(Math.PI * (1 - Math.max(0, this.hopT) / 0.38)) * 16; }
      const bob = -Math.abs(Math.sin(ph)) * 7 * wb + hopY;
      const sway = Math.sin(ph) * 2.4 * wb;
      p.bob.setAttribute('transform', `translate(${this.x.toFixed(1)},${(this.y + bob * this.s).toFixed(1)}) scale(${(this.s * this.flip).toFixed(3)},${this.s.toFixed(3)}) rotate(${sway.toFixed(2)})`);
      // bacaklar
      const lg = Math.sin(ph) * 20 * wb;
      p.legL.setAttribute('transform', `rotate(${lg.toFixed(1)} -18 20)`);
      p.legR.setAttribute('transform', `rotate(${(-lg).toFixed(1)} 18 20)`);
      // nefes
      const br = Math.sin(t * 2.1);
      p.upper.setAttribute('transform', `translate(0,${(br * 1.1).toFixed(2)}) scale(${(1 + br * 0.006).toFixed(4)},${(1 + br * 0.01).toFixed(4)})`);
      // kollar
      const P = POSES[this.pose];
      const k = 1 - Math.exp(-dt * 7);
      let tLs = P.L[0], tLe = P.L[1], tRs = P.R[0], tRe = P.R[1];
      if (wb > 0.05) { tLs += Math.sin(ph) * 9 * wb; tRs -= Math.sin(ph) * 9 * wb; }
      if (this.pose === 'wave') tRe += Math.sin(t * 11) * 22;
      if (this.pose === 'idle') { tLs += Math.sin(t * 1.3) * 1.5; tRs += Math.sin(t * 1.3 + 1) * 1.5; }
      const A = this.ang;
      A.Ls += (tLs - A.Ls) * k; A.Le += (tLe - A.Le) * k; A.Rs += (tRs - A.Rs) * k; A.Re += (tRe - A.Re) * k;
      const L = this.aL, R = this.aR;
      p.armL.setAttribute('transform', `rotate(${(-A.Ls).toFixed(1)} ${L.SL[0].toFixed(1)} ${L.SL[1]})`);
      p.foreL.setAttribute('transform', `rotate(${(-A.Le).toFixed(1)} ${L.EL[0].toFixed(1)} ${L.EL[1]})`);
      p.armR.setAttribute('transform', `rotate(${A.Rs.toFixed(1)} ${R.SL[0].toFixed(1)} ${R.SL[1]})`);
      p.foreR.setAttribute('transform', `rotate(${A.Re.toFixed(1)} ${R.EL[0].toFixed(1)} ${R.EL[1]})`);
      // baş
      let tilt = Math.sin(t * 0.8) * 2.2 + sway * 0.6;
      let nodY = 0, shakeX = 0;
      if (this.nodT > 0) { this.nodT -= dt; nodY = Math.sin((0.6 - this.nodT) * 20) * 3.5; }
      if (this.shakeT > 0) { this.shakeT -= dt; shakeX = Math.sin(this.shakeT * 30) * 4.5 * Math.min(1, this.shakeT * 3); }
      if (this.emotion === 'think') tilt += 6;
      if (this.emotion === 'angry') tilt += Math.sin(t * 24) * 0.8;
      const headY = Math.sin(t * 2.1 + 0.5) * 0.8 + nodY * 0.5;
      const hT = `rotate(${tilt.toFixed(2)} 0 -156) translate(0,${headY.toFixed(2)})`;
      p.head.setAttribute('transform', hT);
      p.hairback.setAttribute('transform', hT);
      // bakış
      if (!this.walk && Math.random() < dt * 0.25) this.lookT = pick([-0.6, 0, 0, 0.5, 0.2]);
      this.look = lerp(this.look, this.lookT, 1 - Math.exp(-dt * 6));
      p.face.setAttribute('transform', `translate(${(this.look * 4 + shakeX).toFixed(2)},${(nodY).toFixed(2)})`);
      p.pupils.setAttribute('transform', `translate(${(this.look * 2.2).toFixed(2)},${(this.lookY).toFixed(2)})`);
      // göz kırpma
      this.blinkT -= dt;
      if (this.blinkT <= 0) { this.blinkK = 0.14; this.blinkT = rnd(1.8, 5); if (Math.random() < 0.2) this.blinkT = 0.25; }
      let eyeS = 1;
      if (this.blinkK > 0) { this.blinkK -= dt; eyeS = 0.12; }
      if (this.emotion === 'surprised') eyeS *= 1.25;
      if (this.emotion === 'angry' || this.emotion === 'sly') eyeS *= 0.75;
      p.eyes.setAttribute('transform', `translate(0,-193) scale(1,${eyeS.toFixed(2)}) translate(0,193)`);
      // yüz ifadesi
      const E = EMO[this.emotion] || EMO.neutral;
      const bkey = E.b;
      if (bkey !== this._b) { p.browL.setAttribute('d', BROWS[bkey][0]); p.browR.setAttribute('d', BROWS[bkey][1]); this._b = bkey; }
      let m = E.m;
      if (this.talking) { const seq = ['tA', 'tB', 'n', 'tB', 'tA', 'flat', 'tB']; m = seq[Math.floor(t * 11) % seq.length]; }
      if (m !== this._m) { p.mouth.setAttribute('d', MOUTHS[m]); p.mouth.setAttribute('fill', (m === 'grin' || m === 'O' || m === 'tA' || m === 'tB') ? '#4a1812' : 'none'); this._m = m; }
      this.fl = lerp(this.fl, E.fl, 1 - Math.exp(-dt * 4));
      p.flush.setAttribute('opacity', this.fl.toFixed(2));
      // püskül sarkacı
      const hv = (tilt - this.prevHead) / Math.max(dt, 0.001); this.prevHead = tilt;
      if (p.tassel) {
        const T = this.tas;
        T.v += (-40 * T.a - 3.5 * T.v - hv * 0.9 - (walking ? Math.cos(ph) * 60 : 0)) * dt;
        T.a += T.v * dt; T.a = clamp(T.a, -35, 35);
        p.tassel.setAttribute('transform', `rotate(${T.a.toFixed(1)} 2 -262)`);
      }
      // tespih
      if (p.beads) {
        const hw = this.handWorld('L');
        const B = this.bd;
        B.v += (-30 * B.a - 2.2 * B.v - (walking ? Math.cos(ph) * 90 : 0) - (Math.random() < dt * 0.4 ? rnd(-60, 60) : 0)) * dt;
        B.a += B.v * dt; B.a = clamp(B.a, -40, 40);
        p.beads.setAttribute('transform', `translate(${hw[0].toFixed(1)},${(hw[1] + 6).toFixed(1)}) rotate(${B.a.toFixed(1)})`);
      }
      // puro dumanı
      if (p.ember) {
        p.ember.setAttribute('opacity', (0.7 + Math.sin(t * 5) * 0.3).toFixed(2));
        this.puffT -= dt;
        if (this.puffT <= 0 && this.puffs.length < 10) {
          this.puffT = rnd(0.25, 0.5);
          const hw = this.handWorld('R');
          const ang = this.ang.Rs + this.ang.Re;
          const tip = rot([hw[0] - 30, hw[1] - 5], hw, ang);
          const c = document.createElementNS(NS, 'circle');
          c.setAttribute('fill', '#d8d2c6');
          p.smoke.appendChild(c);
          this.puffs.push({ el: c, x: tip[0], y: tip[1], r: 2, life: 0, vx: rnd(-6, 6) });
        }
        for (let i = this.puffs.length - 1; i >= 0; i--) {
          const q = this.puffs[i];
          q.life += dt; q.y -= dt * 24; q.x += (q.vx + Math.sin(t * 2 + i) * 8) * dt; q.r += dt * 7;
          const o = Math.max(0, 0.45 - q.life * 0.16);
          q.el.setAttribute('cx', q.x.toFixed(1)); q.el.setAttribute('cy', q.y.toFixed(1)); q.el.setAttribute('r', q.r.toFixed(1)); q.el.setAttribute('opacity', o.toFixed(2));
          if (o <= 0) { q.el.remove(); this.puffs.splice(i, 1); }
        }
      }
    }
    update(dt) { this.t += dt; this.apply(dt); }
  }

  function beads() {
    let b = '';
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1)) * Math.PI;
      const x = Math.cos(a) * 9, y = Math.sin(a) * 30 + 4;
      b += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#6b1f1a" stroke="${INK}" stroke-width=".8"/>`;
    }
    return `<path d="M-9,4 Q-10,30 0,36 Q10,30 9,4" fill="none" stroke="#3a1a10" stroke-width="1"/>${b}
      <path d="M0,34 L0,44" stroke="#3a1a10" stroke-width="1.5"/><path d="M-3,44 L3,44 L4,54 L-4,54Z" fill="#c49a45" stroke="${INK}" stroke-width=".8"/>`;
  }

  /* Tüm aktörler tek rAF döngüsünde */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ALL.forEach(a => { if (!a.el.isConnected) return; a.update(dt); });
    MD.onFrame.slice().forEach(f => f(dt, now));
    requestAnimationFrame(loop);
  }
  MD.onFrame = [];
  requestAnimationFrame(loop);

  /* Küçük portre: bağımsız svg içinde başlı-gövdeli karakter */
  function portrait(spec, opts = {}) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', opts.vb || '-80 -275 160 175');
    svg.setAttribute('class', 'portrait');
    const a = new Actor(spec);
    a.place(0, 190, 1);
    svg.appendChild(a.el);
    if (opts.emotion) a.setEmotion(opts.emotion);
    return { svg, actor: a };
  }

  MD.People = { randSpec, Actor, portrait, shade, EMO };
  MD.Actor = Actor;
})();
