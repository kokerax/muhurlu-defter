/* Oyun akışı: gün döngüsü, alım-satım ve pazarlık, kâr/zarar defteri, gece işleri, kayıt */
(function () {
  const { rnd, ri, pick, wpick, clamp, round5, sleep, money, fmt, hhmm } = MD.U;
  const D = MD.D;
  const $ = s => document.querySelector(s);
  const E = MD.E;
  const { OPEN, CLOSE, DUE } = E.C;
  const DAYN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const MON = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const SAVE_KEY = 'md_save_v1';
  let G = null;
  let closeEarly = false;
  let running = false;

  /* ---------- kayıt ---------- */
  function save() {
    if (!G) return;
    const s = JSON.stringify(G);
    try { localStorage.setItem(SAVE_KEY, s); } catch (e) { }
    try { window.webkit.messageHandlers.save.postMessage(s); } catch (e) { }
  }
  function load() {
    let s = null;
    try { s = window.__MD_SAVE__ || localStorage.getItem(SAVE_KEY); } catch (e) { }
    if (!s) return null;
    try { const g = JSON.parse(s); return g && g.v === 1 && !g.over ? migrate(g) : null; } catch (e) { return null; }
  }
  function migrate(g) {
    g.rep ??= E.C.START_REP; g.upg ??= {}; g.orders ??= []; g.returns ??= []; g.shadow ??= 0;
    g.story ??= {}; g.tut ??= 9; g.stats.returns ??= 0;
    return g;
  }
  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    try { window.webkit.messageHandlers.save.postMessage(''); } catch (e) { }
    window.__MD_SAVE__ = null;
  }

  /* ---------- karakter kalıpları ---------- */
  const NURI = () => MD.People.randSpec({ f: false, old: true, skin: '#e6bd94', hair: '#d2cdc2', hs: 'bald', hat: 'fez', mus: 'handle', gls: 'round', coat: '#2b2b31', vest: true, bow: false, tie: '#6b1f1a', w: 1.1, acc: 'tespih' });
  const KOMISER = () => MD.People.randSpec({ f: false, old: false, skin: '#d2a278', hair: '#1d130c', hs: 'short', hat: 'kepi', mus: 'thick', gls: 'none', coat: '#23304a', vest: false, tie: '#1a1a22', w: 1.08, acc: 'none' });
  const MUHBIR = () => MD.People.randSpec({ f: false, old: false, hs: 'short', hat: 'kasket', mus: 'thin', gls: 'none', coat: '#58503f', vest: false, w: 0.94 });

  function newGame() {
    G = {
      v: 1, day: 1, time: OPEN, phase: 'day', cash: E.C.START_CASH, heat: 5, inv: [], crew: [], paidN: 0,
      rep: E.C.START_REP, upg: {}, orders: [], returns: [], shadow: 0, story: {}, tut: 0,
      dayLog: [], stats: { bought: 0, sold: 0, spent: 0, earned: 0, profit: 0, jobs: 0, best: 0, returns: 0 },
      trend: null, tip: false, intro: true, endless: false, komiserToday: false, night: null, over: null,
    };
    const s1 = D.makeItem({ cat: 'vase', rar: 0, cond: 2 }); s1.paid = 30; s1.k = { c: true, a: true, p: true };
    const s2 = D.makeItem({ cat: 'candle', rar: 0, cond: 1 }); s2.paid = 18; s2.k = { c: true, a: true, p: false };
    const s3 = D.makeItem({ cat: 'watch', rar: 1, cond: 1 }); s3.paid = 70; s3.k = { c: true, a: false, p: false };
    G.inv.push(s1, s2, s3);
    G.crew.push(D.makeCrew('kabadayi', { name: 'Topal Hüsnü', kas: 4, sin: 1, akl: 1, wage: 12, hire: 0, spec: MD.People.randSpec({ f: false, old: true, hs: 'short', hat: 'kasket', mus: 'thick', gls: 'none', coat: '#4b3627', vest: false }) }));
    G.trend = makeTrend();
    save();
  }
  function makeTrend() {
    const cats = MD.U.shuffle(Object.keys(D.CATS));
    return { up: cats[0], down: cats[1] };
  }
  const hasPerk = r => G.crew.some(c => c.role === r && !c.jail);

  /* ---------- üst çubuk ---------- */
  function hud() {
    const d = new Date(1926, 4, 2 + G.day);
    $('#hDate').textContent = `${d.getDate()} ${MON[d.getMonth()]} · ${DAYN[(G.day - 1) % 7]}`;
    $('#hClock').textContent = G.phase === 'night' ? 'Gece' : hhmm(G.time);
    $('#hCash').textContent = fmt(G.cash);
    $('#hHeat').style.setProperty('--v', clamp(G.heat, 0, 100) + '%');
    $('#hHeatN').textContent = Math.round(G.heat);
    $('#hRep').textContent = Math.round(G.rep);
    $('#hudRep').title = 'İtibar: ' + E.repTitle(G.rep);
    $('#hudHeat').classList.toggle('hot', G.heat >= 60);
    const due = DUE[G.paidN];
    if (due && !G.endless) {
      const left = due.day - G.day;
      $('#hDebt').innerHTML = `<b>${fmt(due.amt)} L</b><span>${left <= 0 ? 'bu akşam' : left + ' gün'}</span>`;
      $('#hudDebt').classList.toggle('urgent', left <= 1);
      $('#hudDebt').hidden = false;
    } else $('#hudDebt').hidden = true;
    const tc = $('#tCash'); if (tc) { tc.textContent = fmt(G.cash); $('#tHeat').textContent = Math.round(G.heat); $('#tDay').textContent = G.day + '. gece'; }
  }
  function countTo(el, from, to) {
    MD.tween(0.6, p => { el.textContent = fmt(from + (to - from) * MD.U.ease(p)); });
  }
  function addCash(delta) {
    const from = G.cash; G.cash += delta;
    countTo($('#hCash'), from, G.cash);
    const hc = $('#hudCash'); hc.classList.remove('bump-pos', 'bump-neg'); void hc.offsetWidth; hc.classList.add(delta >= 0 ? 'bump-pos' : 'bump-neg');
    floatText((delta >= 0 ? '+' : '−') + fmt(Math.abs(delta)) + ' L', delta >= 0 ? 'pos' : 'neg', 'hud');
    if (delta < 0) G.stats.spent -= delta; else G.stats.earned += delta;
  }
  function addHeat(v) {
    G.heat = clamp(G.heat + v, 0, 100);
    hud();
    if (v > 0) floatText('Polis dikkati +' + v, 'heat', 'hud');
  }
  function floatText(txt, cls, where) {
    const f = document.createElement('div');
    f.className = 'float ' + cls + (where === 'hud' ? ' at-hud' : '');
    f.textContent = txt;
    $('#fx').appendChild(f);
    setTimeout(() => f.remove(), 1700);
  }
  async function tick(min) {
    const from = G.time; G.time = Math.min(G.time + min, CLOSE + 60);
    await MD.tween(0.35, p => { const m = from + (G.time - from) * p; MD.Shop.setTime(m); $('#hClock').textContent = hhmm(m); });
    hud();
  }

  /* ---------- konuşma balonu ---------- */
  let skipType = false, tapWait = null, typing = false;
  async function say(c, text, o = {}) {
    const sp = $('#speech');
    sp.hidden = false;
    sp.style.setProperty('--tag', c.tag || '#6b4b2c');
    $('#spName').textContent = c.name;
    $('#spRole').textContent = c.role || '';
    renderPatience(c);
    const el = $('#spText');
    el.textContent = '';
    sp.classList.remove('wait');
    if (c.actor) c.actor.talking = true;
    let voEnd = 0;
    if (o.vo) MD.VO.play(c.voice, o.vo).then(d => { if (d) voEnd = performance.now() + d * 1000; });
    skipType = false; typing = true;
    for (let i = 0; i < text.length; i++) {
      if (skipType) { el.textContent = text; break; }
      el.textContent += text[i];
      const ch = text[i];
      await sleep(ch === '.' || ch === '?' || ch === '!' ? 110 : ch === ',' ? 60 : 17);
    }
    typing = false;
    await sleep(60);
    const rem = voEnd - performance.now();
    if (c.actor) { if (rem > 0) { const a = c.actor; setTimeout(() => { a.talking = false; }, rem); } else c.actor.talking = false; }
    if (o.wait) {
      sp.classList.add('wait');
      await new Promise(r => { tapWait = r; });
      sp.classList.remove('wait');
    }
  }
  function renderPatience(c) {
    const el = $('#spPat');
    if (c.pat == null || c.patMax == null) { el.innerHTML = ''; return; }
    el.innerHTML = Array.from({ length: c.patMax }, (_, i) => `<i class="${i < c.pat ? 'on' : ''}"></i>`).join('');
    el.title = 'Sabır';
  }
  function hideSpeech() { $('#speech').hidden = true; }

  /* ---------- alt panel ---------- */
  let actRes = null, panelId = 0, queued = null;
  function waitAct() {
    if (queued && queued.id === panelId) { const a = queued.act; queued = null; return Promise.resolve(a); }
    queued = null;
    return new Promise(r => { actRes = r; });
  }
  let lastPanel = '';
  function panel(html, cls = '') {
    if (html + cls === lastPanel) return;
    lastPanel = html + cls;
    const p = $('#panel');
    p.className = 'panel ' + cls;
    p.innerHTML = html;
    panelId++;
  }
  const TOOL_SVG = {
    c: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15,15 L21,21" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M7,8 A4,4 0 0 1 10,5.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    a: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="4" fill="currentColor" opacity=".85"/><path d="M6,13 C9,11 13,15 18,12" stroke="#e8c877" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    p: '<svg viewBox="0 0 24 24"><path d="M3,5 C6,4 9,4 12,6 C15,4 18,4 21,5 V19 C18,18 15,18 12,20 C9,18 6,18 3,19Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12,6 V20 M5,8 H9 M5,11 H9 M15,8 H19 M15,11 H19" stroke="currentColor" stroke-width="1.2"/></svg>',
  };
  const TOOL_N = { c: ['Büyüteç', 'Durum'], a: ['Mihenk Taşı', 'Özgünlük'], p: ['Fiyat Kataloğu', 'Değer'] };

  function estText(it) {
    const e = D.estimate(it);
    return e[0] === e[1] ? money(e[0]) : `${fmt(e[0])}–${fmt(e[1])} L`;
  }
  function cardHTML(it, o = {}) {
    const R = D.RAR[it.r], C = D.COND[it.c], cat = D.CATS[it.cat];
    const cond = it.k.c ? `<b style="color:${C.c}">${C.n}</b>` : `<span class="unk">?</span>`;
    const auth = it.k.a ? (it.fake ? `<b class="neg">Sahte</b>` : `<b class="pos">Hakiki</b>`) : `<span class="unk">?</span>`;
    return `<div class="card ${o.small ? 'small' : ''}" style="--rar:${R.c}">
      <div class="card-art">${MD.Art.item(it)}${it.stolen ? '<span class="tag-stolen">Çalıntı</span>' : ''}<div class="stamp-slot"></div></div>
      <div class="card-info">
        <div class="card-name">${it.name}</div>
        <div class="card-rar"><span style="color:${R.c}">${R.n}</span> · ${cat.g}</div>
        <dl>
          <dt>Durum</dt><dd>${cond}</dd>
          <dt>Özgünlük</dt><dd>${auth}</dd>
          <dt>Tahmin</dt><dd class="est">${estText(it)}</dd>
          ${o.paid != null ? `<dt>Ödenen</dt><dd>${money(o.paid)}</dd>` : ''}
        </dl>
      </div>
    </div>`;
  }
  function toolsHTML(it, focus) {
    return `<div class="tools">${['c', 'a', 'p'].map(t => `<button class="tool ${focus === 't:' + t && !it.k[t] ? 'pulse' : ''}" data-act="t:${t}" ${it.k[t] ? 'disabled' : ''}>
      ${TOOL_SVG[t]}<span>${MD.Bench.toolName(t, it)}</span><small>${it.k[t] ? 'Bakıldı' : TOOL_N[t][1] + ' · ~' + E.inspectMin(G) + ' dk'}</small></button>`).join('')}</div>`;
  }
  function plRange(it, price, sellerMode) {
    const e = D.estimate(it);
    if (sellerMode) return [e[0] - price, e[1] - price];
    return [price - it.paid, price - it.paid];
  }
  function plHTML(it, price, sellerMode) {
    const [a, b] = plRange(it, price, sellerMode);
    const sgn = v => (v >= 0 ? '+' : '−') + fmt(Math.abs(v));
    if (!sellerMode) return `<div class="pl ${a >= 0 ? 'pos' : 'neg'}"><span>${a >= 0 ? 'Kâr' : 'Zarar'}</span><b>${sgn(a)} L</b></div>`;
    const cls = a >= 0 ? 'pos' : b < 0 ? 'neg' : 'mid';
    return `<div class="pl ${cls}"><span>Olası kâr</span><b>${a === b ? sgn(a) : sgn(a) + ' / ' + sgn(b)} L</b></div>`;
  }
  function hint(t) { return G.day <= 2 ? `<p class="hint">${t}</p>` : ''; }

  function dealHTML(c) {
    const it = c.item, seller = c.kind === 'seller';
    const price = seller ? c.ask : c.offer;
    const canPay = !seller || G.cash >= price;
    return `${cardHTML(it, { paid: seller ? null : it.paid })}
      <div class="offer-row">
        <div class="offer"><span>${seller ? 'İstenen' : 'Teklif'}</span><b>${money(price)}</b></div>
        ${plHTML(it, price, seller)}
      </div>
      ${seller ? toolsHTML(it, c.guide && c.guide.focus) : ''}
      ${c.guide ? guideHTML(c) : c.orderId ? '<p class="hint">Sipariş müşterisi: piyasanın çok üstünde ödemeye hazır.</p>' : ''}
      <div class="acts">
        <button class="btn primary" data-act="accept" ${canPay ? '' : 'disabled'}>${seller ? 'Satın al' : 'Sat'} · ${money(price)}</button>
        <button class="btn ${c.guide && c.guide.focus === 'haggle' ? 'pulse' : ''}" data-act="haggle">Pazarlık</button>
        <button class="btn danger" data-act="reject">${seller ? 'Reddet' : 'Satmam'}</button>
      </div>
      ${canPay ? '' : '<p class="warn">Kasada bu kadar para yok. Pazarlık et ya da geri çevir.</p>'}`;
  }

  /* ---------- inceleme ---------- */
  async function inspect(it, t) {
    MD.Audio.play('scan');
    const min = await MD.Bench.run(t, it, E.inspectMin(G));
    await tick(min);
    it.k[t] = true;
    let txt = '', cls = '';
    if (t === 'c') { txt = D.COND[it.c].n; cls = it.c >= 2 ? 'pos' : 'neg'; }
    if (t === 'a') { txt = it.fake ? 'SAHTE' : 'HAKİKİ'; cls = it.fake ? 'neg' : 'pos'; }
    if (t === 'p') { txt = estText(it); cls = 'ink'; }
    return { txt, cls };
  }
  function stamp(txt, cls, sel = '#panel .stamp-slot') {
    const s = document.querySelector(sel);
    if (!s) return;
    s.innerHTML = `<div class="stamp ${cls}">${txt}</div>`;
    MD.Audio.play('stamp'); MD.haptic('medium');
  }

  /* ---------- müşteri üretimi ---------- */
  const L = {
    sell: {
      saf: ['Merhaba efendim. Tavan arasında bir {n} buldum. {p} lira eder mi, bilmem ki?', 'Kusura bakmayın, ben pek anlamam bu işlerden. Şu {n} için {p} lira olur mu?'],
      normal: ['İyi günler. Ben {name}. Şu {n} elimde kaldı, {p} liraya bırakırım.', 'Rahmetli babamdan kalma bir {n}. {p} lira istiyorum.', 'Taşınıyoruz, eşyaları elden çıkarıyorum. {n} için {p} lira diyorum.'],
      uyanik: ['Bu {n} kolay bulunmaz, siz de bilirsiniz. {p} liranın altına inmem.', 'Pera\'da bunu kapışırlar. Size {p} lira, dostluğumuza.'],
      dolandirici: ['Hakiki {n}, garantili! Acelem var, {p} liraya veriyorum.', 'Bakın, bu {n} bir paşa ailesinden kalma. {p} lira, çok ucuz!'],
      tekinsiz: ['(fısıltıyla) Nereden geldiğini sorma. {n}. {p} lira, peşin.', 'Dün gece... neyse. Şu {n} sende kalsın. {p} lira yeter.'],
    },
    sCounter: ['{p} olsun, orta yol.', 'Olmaz. {p} diyelim.', 'Biraz daha yaklaşın: {p} lira.', '{p}. Daha aşağısı zor.'],
    sInsult: ['Dalga mı geçiyorsunuz? En az {p}.', 'Bu fiyata ancak ceketimi veririm. {p}!'],
    sAccept: ['Anlaştık. Hayırlı olsun.', 'Peki, olsun. Paraya ihtiyacım var.', 'Tamam, sizin olsun.'],
    sLeave: ['Vaktimi harcadınız. Hoşça kalın.', 'Başka antikacı mı yok! Allahaısmarladık.'],
    sRejected: ['Peki... Başka kapıya.', 'Siz bilirsiniz. İyi günler.'],
    buy: {
      koleksiyoncu: ['Koleksiyonuma bir {n} arıyordum. {p} lira teklif ediyorum.', 'Şu {n}... İlginç parça. {p} lira veririm.'],
      turist: ['Bonjour! Oh, très joli! Bu {n}... {p} lira, olur mu?', 'Oh là là, magnifique! {n} için {p} lira?'],
      turistM: ['Good day! This is lovely. {n}... {p} lira, will that do?', 'I say, what a marvellous piece! {p} lira for the {n}?'],
      normal: ['İyi günler. Şu {n} gözüme çarptı. {p} lira veririm.', 'Hanıma hediye arıyorum. {n} için {p} lira?'],
      tuccar: ['{n} için {p} lira. Fazlasını vermem, ben de satacağım.', 'Toptan iş yaparım. {n}: {p} lira.'],
    },
    bCounter: ['Peki, {p} vereyim.', '{p} lira. Daha fazlası zor.', 'Hmm... {p} olur.'],
    bInsult: ['O kadar mı? Soygun bu! En fazla {p}.', 'Ben bunu Pera\'da yarı fiyata bulurum. {p}.'],
    bAccept: ['Anlaştık! Güle güle kullanayım.', 'Tamam, alıyorum.', 'Merci! Harika bir parça.'],
    bLeave: ['Bu fiyata mı? Hoşça kalın.', 'Başka yerden alırım.'],
    bRejected: ['Yazık... Peki.', 'Fikrinizi değiştirirseniz buralardayım.'],
  };
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] != null ? (k === 'p' ? fmt(o[k]) : o[k]) : '');
  const TAG = { seller: '#6b4b2c', buyer: '#3d6a34', lender: '#8e2a22', komiser: '#23466e', recruit: '#5a4a6a', muhbir: '#4a4a3a' };

  function mkSeller() {
    const d = E.sellerDeal(G);
    const { type, item: it, ask } = d;
    const spec = MD.People.randSpec();
    const name = spec.f ? pick(D.FIRST_F) : pick(D.FIRST_M);
    return { ...d, name, role: 'Satıcı', tag: TAG.seller, spec, voice: voiceFor(spec, name), tell: rnd(-0.06, 0.06), greet: fill(pick(L.sell[type]), { n: it.name, p: ask, name }), greetVo: { saf: 's_saf', normal: 's_hi', uyanik: 's_uyanik', dolandirici: 's_dol', tekinsiz: 's_tek' }[type] };
  }
  function mkBuyer(forceItem, forceType) {
    const d = E.buyerDeal(G, { kalpazan: hasPerk('kalpazan') }, forceItem, forceType);
    const { type, item: it, offer } = d;
    const tur = type === 'turist';
    const spec = MD.People.randSpec(tur ? { hat: Math.random() < 0.5 ? 'fedora' : 'none', coat: '#76674f' } : type === 'koleksiyoncu' ? { gls: pick(['monocle', 'round']), old: true } : {});
    const name = tur ? (spec.f ? pick(['Madam Anjel', 'Mademoiselle Colette', 'Madam Matild']) : pick(['Mister Hollis', 'Lord Ashby', 'Mister Grant'])) : spec.f ? pick(D.FIRST_F.filter(n => !n.startsWith('Madam'))) : pick(D.FIRST_M.filter(n => !n.startsWith('Mösyö')));
    const role = { koleksiyoncu: 'Koleksiyoncu', turist: 'Seyyah', normal: 'Alıcı', tuccar: 'Tüccar' }[type];
    const gl = tur && !spec.f ? L.buy.turistM : L.buy[type];
    const gi = Math.floor(Math.random() * gl.length);
    return { ...d, name, role, tag: TAG.buyer, spec, voice: tur ? (spec.f ? 'tf' : 'tm') : voiceFor(spec, name), tur, tell: rnd(-0.06, 0.06), greet: fill(gl[gi], { n: it.name, p: offer }), greetVo: tur ? 't_hi-' + (gi + 1) : type === 'tuccar' ? 'b_tuc' : 'b_hi' };
  }
  function voiceFor(spec, name, recruit) {
    if (spec.f) return spec.old && !recruit ? 'f2' : 'f1';
    if (spec.old && !recruit) return 'm2';
    let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return Math.abs(h) % 2 ? 'm1' : 'm3';
  }
  function nextCustomer() {
    const tc = tutorialCustomer(); if (tc) return tc;
    const sc = storyCustomer(); if (sc) return sc;
    const rt = G.returns.find(r => r.day <= G.day);
    if (rt) { G.returns = G.returns.filter(x => x !== rt); return { kind: 'return', name: rt.name, role: 'Öfkeli müşteri', tag: '#8e2a22', spec: rt.spec, voice: rt.voice, item: rt.item, amt: rt.amt }; }
    const ob = orderBuyer(); if (ob) return ob;
    if (!G.komiserToday && G.heat >= 45 && Math.random() < (G.heat - 35) / 100) { G.komiserToday = true; return { kind: 'komiser', name: 'Komiser Cevdet', role: 'Beyoğlu Karakolu', tag: TAG.komiser, spec: KOMISER(), voice: 'komiser' }; }
    if (G.crew.length < 5 && G.day > 1 && Math.random() < 0.06) { const cr = D.makeCrew(); return { kind: 'recruit', name: cr.name, role: D.ROLES[cr.role].n, tag: TAG.recruit, spec: cr.spec, voice: voiceFor(cr.spec, cr.name, true), crew: cr }; }
    if (!G.tip && G.day > 1 && Math.random() < 0.05) return { kind: 'muhbir', name: 'Muhbir Şaban', role: 'Kulak', tag: TAG.muhbir, spec: MUHBIR(), voice: 'muhbir' };
    if (G.day > 1 && G.orders.length < 2 && Math.random() < 0.07) return mkOrderer();
    return E.tradeKind(G) === 'seller' ? mkSeller() : mkBuyer();
  }

  /* ---------- sahneye giriş / çıkış ---------- */
  async function enter(c) {
    c.actor = new MD.Actor(c.spec);
    c.actor.place(63, 270, 0.42);
    c.actor.el.setAttribute('opacity', '0');
    MD.Shop.actors.appendChild(c.actor.el);
    const door = MD.Shop.openDoor();
    await MD.tween(0.3, p => c.actor.el.setAttribute('opacity', p.toFixed(2)));
    await door;
    await c.actor.walkTo(292, 474, 0.86, 1.7);
    MD.Shop.closeDoor();
    c.actor.setPose(c.spec.acc === 'cigar' ? 'cigar' : 'counter');
    c.actor.lookT = 0;
  }
  async function leave(c) {
    await sleep(350);
    hideSpeech();
    c.actor.setPose('idle');
    MD.Shop.openDoor();
    await c.actor.walkTo(63, 270, 0.42, 1.5);
    await MD.tween(0.25, p => c.actor.el.setAttribute('opacity', (1 - p).toFixed(2)));
    c.actor.remove();
    await MD.Shop.closeDoor();
  }

  /* ---------- canlı yüz ifadesi (pazarlık ipucu) ---------- */
  function react(c, price) {
    let r = c.kind === 'seller' ? price / c.min : c.max / price;
    r += c.tell;
    const e = r >= 1 ? (r >= 1.15 ? 'delight' : 'happy') : r >= 0.9 ? 'think' : r >= 0.72 ? 'annoyed' : 'angry';
    c.actor.setEmotion(e);
  }

  /* ---------- pazarlık ---------- */
  function haggle(c) {
    const seller = c.kind === 'seller', it = c.item;
    const lo = seller ? Math.max(1, round5(c.ask * 0.2)) : c.offer;
    const hi = seller ? c.ask : Math.max(round5(c.offer * 2.5), c.offer + 20);
    let price = seller ? round5(c.ask * 0.8) : round5(c.offer * 1.25);
    price = clamp(price, lo, hi);
    panel(`${cardHTML(it, { small: true, paid: seller ? null : it.paid })}
      <div class="haggle">
        <div class="hg-label">${seller ? 'Senin teklifin' : 'İstediğin fiyat'} <small>${seller ? 'İstenen: ' + money(c.ask) : 'Onun teklifi: ' + money(c.offer)}</small></div>
        <div class="hg-row">
          <button class="step" data-act="h:-10">−10%</button>
          <button class="step" data-act="h:-">−</button>
          <output id="hgOut">${money(price)}</output>
          <button class="step" data-act="h:+">+</button>
          <button class="step" data-act="h:+10">+10%</button>
        </div>
        <input id="hgRange" type="range" min="${lo}" max="${hi}" step="1" value="${price}" aria-label="Fiyat">
        <div id="hgPl"></div>
        <div class="acts">
          <button class="btn primary" data-act="offer" id="hgOffer">Teklif ver</button>
          <button class="btn" data-act="back">Vazgeç</button>
        </div>
        <p class="warn" id="hgWarn" hidden>Kasada bu kadar para yok.</p>
      </div>`, 'haggling');
    const out = $('#hgOut'), rg = $('#hgRange');
    const upd = () => {
      out.textContent = money(price);
      rg.value = price;
      $('#hgPl').innerHTML = plHTML(it, price, seller);
      const cant = seller && price > G.cash;
      $('#hgOffer').disabled = cant; $('#hgWarn').hidden = !cant;
      react(c, price);
    };
    rg.addEventListener('input', () => { price = +rg.value; upd(); if (Math.random() < 0.3) MD.Audio.play('tick'); });
    upd();
    return (async () => {
      while (true) {
        const a = await waitAct();
        const step = Math.max(1, round5(price * 0.02));
        if (a === 'h:-') price -= step;
        else if (a === 'h:+') price += step;
        else if (a === 'h:-10') price = round5(price * 0.9);
        else if (a === 'h:+10') price = round5(price * 1.1);
        else if (a === 'offer') return price;
        else if (a === 'back') { c.actor.setEmotion('neutral'); return null; }
        price = clamp(price, lo, hi);
        upd();
      }
    })();
  }
  const respond = E.respond;

  /* ---------- işlemler ---------- */
  function logDeal(kind, it, price, pl) {
    G.dayLog.push({ k: kind, n: it.name, p: price, pl, t: hhmm(G.time) });
  }
  async function doBuy(c, price) {
    const it = c.item;
    c.actor.setEmotion('happy', 2000); c.actor.nod();
    addCash(-price); MD.Audio.play('pay'); MD.haptic('medium');
    it.paid = price; it.day = G.day;
    G.inv.push(it); G.stats.bought++;
    logDeal('Alış', it, price, null);
    stamp('ALINDI', 'ink');
    MD.Shop.cash(price, false);
    await tick(5);
    await say(c, pick(L.sAccept), { vo: 'accept' });
    await MD.Shop.takeItem('shelf');
    MD.Shop.setShelf(G.inv);
    await leave(c);
  }
  async function doSell(c, price) {
    const it = c.item, pl = price - it.paid;
    c.actor.setEmotion('delight', 2200); c.actor.hop();
    addCash(price); MD.Audio.play('coin'); MD.haptic('success');
    G.inv = G.inv.filter(x => x.id !== it.id);
    G.stats.sold++; G.stats.profit += pl; G.stats.best = Math.max(G.stats.best, pl);
    logDeal('Satış', it, price, pl);
    if (c.orderId) { G.orders = G.orders.filter(o => o.id !== c.orderId); E.addRep(G, 3); floatText('Sipariş teslim · İtibar +3', 'pos', 'hud'); }
    stamp((pl >= 0 ? 'KÂR +' : 'ZARAR −') + fmt(Math.abs(pl)), pl >= 0 ? 'pos' : 'neg');
    setTimeout(() => floatText((pl >= 0 ? 'Kâr +' : 'Zarar −') + fmt(Math.abs(pl)) + ' L', pl >= 0 ? 'pos big' : 'neg big', 'stage'), 250);
    MD.Shop.cash(price, true);
    if (it.stolen) { addHeat(6); G.shadow += 3; }
    E.addRep(G, 1); hud();
    if (it.fake) { if (it.k.a) G.shadow += 2; if (Math.random() < E.RETURN_P) G.returns.push({ day: G.day + ri(1, 3), amt: price, name: c.name, spec: c.spec, voice: c.voice, item: it.name }); }
    await tick(5);
    await say(c, c.tur ? (c.spec.f ? 'Merci! Magnifique.' : 'Splendid! We have a deal.') : pick(L.bAccept), { vo: c.tur ? 't_accept' : 'baccept' });
    await MD.Shop.takeItem('up');
    MD.Shop.setShelf(G.inv);
    await leave(c);
  }

  async function sellerVisit(c) {
    const it = c.item;
    if (hasPerk('eksper')) it.k.c = true;
    await enter(c);
    c.actor.setPose('present');
    MD.Shop.showItem(it);
    await tick(10);
    panel(dealHTML(c), 'deal');
    await say(c, c.greet, { vo: c.greetVo });
    c.actor.setPose('counter');
    while (true) {
      panel(dealHTML(c), 'deal');
      const act = await waitAct();
      if (act.startsWith('t:')) {
        const t = act[2];
        c.actor.lookT = 0; c.actor.setEmotion(c.type === 'dolandirici' && t === 'a' ? 'worried' : 'neutral');
        const r = await inspect(it, t);
        panel(dealHTML(c), 'deal');
        stamp(r.txt, r.cls);
        if (t === 'a' && it.fake && c.type === 'dolandirici') {
          c.actor.setEmotion('surprised', 1400); c.actor.shake();
          await sleep(500);
          if (Math.random() < 0.45) { await say(c, 'Eh... Benim acelem vardı zaten. Hoşça kalın!', { vo: 'fake_run' }); await MD.Shop.takeItem('up'); await leave(c); return; }
          c.ask = Math.max(3, round5(D.authVal(it) * rnd(0.12, 0.25))); c.min = Math.max(2, round5(c.ask * 0.7));
          await say(c, `Sahte mi? Olamaz... Ben de öyle aldım! Peki, ${fmt(c.ask)} lira olsun.`, { vo: 'fake_exposed' });
        } else if (t === 'c' && it.c >= 3) c.actor.setEmotion('sly', 1200);
        continue;
      }
      if (act === 'accept') { await doBuy(c, c.ask); return; }
      if (act === 'reject') { c.actor.setEmotion('sad'); await say(c, pick(L.sRejected), { vo: 'rejected' }); await MD.Shop.takeItem('up'); await leave(c); return; }
      if (act === 'haggle') {
        const o = await haggle(c);
        if (o == null) continue;
        await tick(10);
        const r = respond(c, o);
        if (r.type === 'accept') { await doBuy(c, r.price); return; }
        if (r.type === 'leave') { c.actor.setEmotion('angry'); c.actor.shake(); renderPatience(c); await say(c, pick(L.sLeave), { vo: 'leave' }); await MD.Shop.takeItem('up'); await leave(c); return; }
        c.actor.setEmotion(r.insult ? 'angry' : 'annoyed', 1600);
        if (r.insult) c.actor.shake(); else c.actor.setPose('shrug');
        panel(dealHTML(c), 'deal');
        await say(c, fill(pick(r.insult ? L.sInsult : L.sCounter), { p: r.price }), { vo: r.insult ? 'insult' : 'counter' });
        c.actor.setPose('counter'); c.actor.setEmotion('neutral');
      }
    }
  }

  async function buyerVisit(c) {
    const it = c.item;
    await enter(c);
    c.actor.setPose('point'); c.actor.lookT = -0.8;
    await sleep(500);
    MD.Shop.showItem(it);
    await tick(10);
    c.actor.setPose('counter'); c.actor.lookT = 0;
    if (it.fake && Math.random() < E.fakeSpot(c.type, { kalpazan: hasPerk('kalpazan') })) {
      c.actor.setEmotion('angry'); c.actor.shake();
      await say(c, `Bu ${it.name} sahte! Beni kandıracağını mı sandın? Rezalet!`, { vo: 'fake_angry' });
      E.addRep(G, -4); hud(); floatText('İtibar −4', 'neg', 'hud');
      await MD.Shop.takeItem('shelf');
      await leave(c);
      return;
    }
    panel(dealHTML(c), 'deal');
    await say(c, c.greet, { vo: c.greetVo });
    while (true) {
      panel(dealHTML(c), 'deal');
      const act = await waitAct();
      if (act === 'accept') { await doSell(c, c.offer); return; }
      if (act === 'reject') { c.actor.setEmotion('sad'); await say(c, c.tur ? (c.spec.f ? 'Non, non. Au revoir.' : 'No, no. Good day to you.') : pick(L.bRejected), { vo: c.tur ? 't_leave' : 'brejected' }); await MD.Shop.takeItem('shelf'); await leave(c); return; }
      if (act === 'haggle') {
        const o = await haggle(c);
        if (o == null) continue;
        await tick(10);
        const r = respond(c, o);
        if (r.type === 'accept') { await doSell(c, r.price); return; }
        if (r.type === 'leave') { c.actor.setEmotion('angry'); c.actor.shake(); renderPatience(c); await say(c, c.tur ? (c.spec.f ? 'Non, non. Au revoir.' : 'No, no. Good day to you.') : pick(L.bLeave), { vo: c.tur ? 't_leave' : 'leave' }); await MD.Shop.takeItem('shelf'); await leave(c); return; }
        c.actor.setEmotion(r.insult ? 'angry' : 'think', 1600);
        if (r.insult) c.actor.shake(); else c.actor.setPose('think');
        panel(dealHTML(c), 'deal');
        await say(c, c.tur ? fill(c.spec.f ? "Hmm... d'accord, un peu plus. {p} lira." : 'Hmm... very well, a little more. {p} lira.', { p: r.price }) : fill(pick(r.insult ? L.bInsult : L.bCounter), { p: r.price }), { vo: c.tur ? 't_counter' : r.insult ? 'binsult' : 'bcounter' });
        c.actor.setPose('counter'); c.actor.setEmotion('neutral');
      }
    }
  }

  function crewCardHTML(cr, o = {}) {
    const R = D.ROLES[cr.role];
    const bar = (k, n) => `<div class="stat"><span>${n}</span><i style="--v:${cr[k] * 20}%"></i><b>${cr[k]}</b></div>`;
    return `<div class="crew-card ${o.cls || ''}" ${o.attr || ''}>
      <div class="crew-pt" data-pt="${cr.id}"></div>
      <div class="crew-info">
        <div class="crew-name">${cr.name}</div>
        <div class="crew-role">${R.n}${cr.hurt ? ' · <b class="neg">Yaralı ' + cr.hurt + ' gün</b>' : ''}${cr.jail ? ' · <b class="neg">Nezarette ' + cr.jail + ' gün</b>' : ''}</div>
        ${bar('kas', 'Kas')}${bar('sin', 'Sinsilik')}${bar('akl', 'Kurnazlık')}
        <div class="crew-perk">${R.perk}</div>
        <div class="crew-wage">Günlük ${money(cr.wage)}${o.hire ? ' · İşe alma ' + money(cr.hire) : ''}</div>
      </div>
    </div>`;
  }
  const portraits = [];
  function mountPortraits(root, list) {
    root.querySelectorAll('[data-pt]').forEach(el => {
      const cr = list.find(x => x.id === el.getAttribute('data-pt'));
      if (!cr) return;
      const p = MD.People.portrait(cr.spec, { emotion: cr.hurt || cr.jail ? 'sad' : 'neutral' });
      el.appendChild(p.svg); portraits.push(p.actor);
    });
  }
  function clearPortraits() { portraits.splice(0).forEach(a => a.remove()); }

  async function recruitVisit(c) {
    await enter(c);
    const hi = ri(0, 1);
    await say(c, ['Selam patron. Dayının adamlarını tanırdım. İş var mı?', 'Kolum güçlü, dilim kısa. İş arıyorum.'][hi], { vo: 'r_hi-' + (hi + 1) });
    panel(crewCardHTML(c.crew, { hire: true }) + `<div class="acts"><button class="btn primary" data-act="hire" ${G.cash >= c.crew.hire ? '' : 'disabled'}>İşe al · ${money(c.crew.hire)}</button><button class="btn" data-act="no">Gerek yok</button></div>`, 'deal');
    mountPortraits($('#panel'), [c.crew]);
    const a = await waitAct();
    clearPortraits();
    if (a === 'hire') { addCash(-c.crew.hire); G.crew.push(c.crew); c.actor.setEmotion('delight', 1500); c.actor.hop(); await say(c, 'Pişman olmayacaksın patron. Akşam görüşürüz.', { vo: 'r_yes' }); }
    else { c.actor.setEmotion('sad'); await say(c, 'Peki. Fikrin değişirse meyhanede bulursun beni.', { vo: 'r_no' }); }
    await leave(c);
  }
  async function muhbirVisit(c) {
    await enter(c);
    c.actor.setEmotion('sly');
    await say(c, 'Psst. Otuz lira ver, bu gece işine yarayacak bir fısıltı söyleyeyim.', { vo: 'offer' });
    panel(`<div class="note">Muhbir ipucu, bu gecenin işlerinden birinde başarı şansını ve ödülü artırır.</div><div class="acts"><button class="btn primary" data-act="pay" ${G.cash >= 30 ? '' : 'disabled'}>Öde · 30 L</button><button class="btn" data-act="no">Defol</button></div>`, 'deal');
    const a = await waitAct();
    if (a === 'pay') { addCash(-30); G.tip = true; await say(c, 'Bu gece bekçiler vardiya değiştiriyor. Haritada yıldızlı işe bak.', { vo: 'paid' }); }
    else { c.actor.setEmotion('annoyed'); await say(c, 'Sen bilirsin. Kulak bedava değil.', { vo: 'no' }); }
    await leave(c);
  }
  async function komiserVisit(c) {
    await enter(c);
    c.actor.setPose('cross'); c.actor.setEmotion('annoyed');
    const stolen = G.inv.filter(x => x.stolen);
    await say(c, stolen.length ? 'Duyduğuma göre dükkânında kaynağı belirsiz mallar varmış.' : 'Şöyle bir bakayım dedim. Mahallede adın çok geçiyor.', { vo: stolen.length ? 'sus-1' : 'sus-2' });
    const bribe = round5(40 + G.heat * 2.5);
    panel(`<div class="note">Polis dikkati: <b>${Math.round(G.heat)}</b>. ${stolen.length ? `Depoda <b>${stolen.length}</b> çalıntı mal var.` : 'Depoda çalıntı mal yok.'}</div>
      <div class="acts"><button class="btn" data-act="bribe" ${G.cash >= bribe ? '' : 'disabled'}>Rüşvet ver · ${money(bribe)}</button><button class="btn primary" data-act="search">Buyurun, arayın</button></div>`, 'deal');
    const a = await waitAct();
    if (a === 'bribe') {
      addCash(-bribe); G.heat = clamp(G.heat - 15, 0, 100); G.shadow += 2; hud();
      c.actor.setEmotion('sly'); await say(c, 'Görmedim say. Ama bir dahakine bu kadar anlayışlı olmam.', { vo: 'bribe' });
    } else {
      c.actor.setPose('point');
      await tick(20);
      const found = stolen.filter(() => Math.random() < (E.upg(G, 'kasa') ? 0.375 : 0.75));
      if (found.length) {
        G.inv = G.inv.filter(x => !found.includes(x));
        const fine = round5(G.cash * 0.15);
        addCash(-fine); G.heat = clamp(G.heat - 10, 0, 100); hud();
        MD.Shop.setShelf(G.inv);
        c.actor.setEmotion('angry');
        await say(c, `${found.map(x => x.name).join(', ')}... Çalıntı! El koyuyorum. Cezası da ${fmt(fine)} lira.`, { wait: true, vo: 'found' });
      } else {
        G.heat = clamp(G.heat - 8, 0, 100); hud();
        c.actor.setEmotion('think');
        await say(c, 'Hmm. Temiz görünüyor... Şimdilik.', { vo: 'clean' });
      }
    }
    await leave(c);
  }

  /* ---------- tefeci ---------- */
  function nuri() { return { kind: 'lender', name: 'Nuri Efendi', role: 'Tefeci', tag: TAG.lender, spec: NURI(), voice: 'nuri' }; }
  async function introScene() {
    const c = nuri();
    panel(`<div class="note center">Kapının zili çalıyor…</div>`, 'idle');
    await enter(c);
    c.actor.setEmotion('think');
    await say(c, 'Demek dükkânın yeni sahibi sensin. Başın sağ olsun, Rıza rahmetli iyi adamdı.', { wait: true, vo: 'intro-1' });
    c.actor.setEmotion('sly'); c.actor.setPose('present');
    await say(c, 'Ama bana borcunu ödemeden gitti. Defterde yazılı: tam 5.250 lira.', { wait: true, vo: 'intro-2' });
    c.actor.setPose('counter'); c.actor.setEmotion('annoyed');
    await say(c, 'Üç taksit. Her pazar akşamı gelirim: 1.000, 1.750, 2.500. Gecikirsen dükkândaki mallar benim olur.', { wait: true, vo: 'intro-3' });
    c.actor.setEmotion('happy');
    await say(c, 'Ucuza al, pahalıya sat, ne aldığını bil. Hüsnü de sana kalsın, gece işlerine yarar. Hadi, kolay gelsin.', { wait: true, vo: 'intro-4' });
    await leave(c);
  }
  async function lenderVisit() {
    const due = DUE[G.paidN];
    const c = nuri();
    await enter(c);
    c.actor.setEmotion('sly');
    await say(c, `Pazar akşamı, evlat. Defter açık: ${fmt(due.amt)} lira.`, { vo: 'due-' + G.paidN });
    const can = G.cash >= due.amt;
    panel(`<div class="note">Taksit ${G.paidN + 1}/3 · <b>${money(due.amt)}</b> · Kasa <b>${money(G.cash)}</b></div>
      <div class="acts">${can ? `<button class="btn primary" data-act="pay">Öde · ${money(due.amt)}</button>` : `<button class="btn danger" data-act="short">Kasadakini ver · ${money(G.cash)}</button>`}</div>
      ${can ? '' : '<p class="warn">Eksik kalan kısım için Nuri Efendi raflardan mal alacak.</p>'}`, 'deal');
    const a = await waitAct();
    if (a === 'pay') {
      addCash(-due.amt); G.paidN++;
      MD.Audio.play('stamp'); MD.haptic('heavy');
      panel(`<div class="seal-wrap"><div class="seal">ÖDENDİ</div><p>${G.paidN}. taksit kapandı.</p></div>`, 'idle');
      c.actor.setEmotion('happy'); c.actor.nod();
      if (G.paidN >= DUE.length) {
        await say(c, 'Defter kapandı. Dayından iyi tüccar çıktın, evlat. Galata artık senin.', { wait: true, vo: 'paid-end' });
        await leave(c);
        await victory();
        return;
      }
      await say(c, `Aferin. Gelecek pazar ${fmt(DUE[G.paidN].amt)} lira. Unutma.`, { wait: true, vo: 'paid-' + G.paidN });
    } else {
      let rest = due.amt - G.cash;
      if (G.cash > 0) addCash(-G.cash);
      const taken = [];
      const sorted = G.inv.slice().sort((x, y) => D.trueVal(y) - D.trueVal(x));
      for (const it of sorted) { if (rest <= 0) break; rest -= Math.round(D.trueVal(it) * 0.6); taken.push(it); }
      G.inv = G.inv.filter(x => !taken.includes(x));
      MD.Shop.setShelf(G.inv);
      if (rest > 0) {
        c.actor.setEmotion('angry'); c.actor.shake();
        await say(c, 'Kasa boş, raflar boş. Bu dükkân artık benim. Anahtarları bırak.', { wait: true, vo: 'lose' });
        await leave(c);
        await gameOver('Dükkân elden gitti', 'Nuri Efendi taksiti tahsil edemedi ve dükkâna el koydu.');
        return;
      }
      G.paidN++;
      c.actor.setEmotion('annoyed');
      await say(c, `${taken.length} parça mal aldım: ${taken.map(x => x.name).join(', ')}. Bir dahakine nakit isterim.`, { wait: true, vo: 'seize' });
      if (G.paidN >= DUE.length) { await leave(c); await victory(); return; }
    }
    await leave(c);
  }

  /* ---------- rehberli ilk gün ---------- */
  const GUIDE = [
    { focus: 't:c', text: 'İstenen fiyat tahmin aralığının altında, fırsat olabilir. Önce <b>Büyüteç</b>le durumuna bak; iyi çıkarsa al.' },
    { focus: 't:a', text: 'Epik bir saat bu fiyata mı? Fazla ucuz. <b>Mihenk Taşı</b>yla özgünlüğüne bak; sahteyse ya pazarlık et ya reddet.' },
    { focus: 'haggle', text: 'Alıcılar ilk teklifte hep düşük verir. <b>Pazarlık</b>a bas, fiyatı yükselt ve yüzünü izle: kaşları çatılıyorsa sınıra geldin.' },
  ];
  function tutorialCustomer() {
    if (G.tut >= 3 || G.day > 1) return null;
    let c;
    if (G.tut === 0) {
      const it = D.makeItem({ cat: 'ring', rar: 1, cond: 2 });
      const ask = round5(D.authVal(it) * 0.5);
      c = Object.assign(mkSeller(), { type: 'saf', item: it, ask, min: round5(ask * 0.85), greetVo: 's_saf' });
      c.greet = fill(L.sell.saf[0], { n: it.name, p: ask });
    } else if (G.tut === 1) {
      const it = D.makeItem({ cat: 'watch', rar: 2, cond: 2, fake: true });
      const ask = round5(D.authVal(it) * 0.55);
      c = Object.assign(mkSeller(), { type: 'dolandirici', item: it, ask, min: round5(ask * 0.7), greetVo: 's_dol' });
      c.greet = fill(L.sell.dolandirici[0], { n: it.name, p: ask });
    } else {
      const it = G.inv.find(x => !x.fake && !x.special) || G.inv[0];
      if (!it) { G.tut = 3; return null; }
      c = mkBuyer(it, 'normal');
    }
    c.guide = GUIDE[G.tut];
    G.tut++;
    return c;
  }
  const guideHTML = c => c.guide ? `<div class="guide"><b>Rehber</b>${c.guide.text}</div>` : '';

  /* ---------- sahte iadesi ---------- */
  async function returnVisit(c) {
    await enter(c);
    c.actor.setPose('fists'); c.actor.setEmotion('angry');
    await say(c, `Bana sattığın ${c.item} sahte çıktı! Paramı geri istiyorum: ${fmt(c.amt)} lira.`, { vo: 'ret_hi' });
    const pay = Math.min(c.amt, G.cash);
    panel(`<div class="note">Bu müşteriye sahte mal satmıştın. İade edersen itibarın az düşer; reddedersen dedikodu yayılır ve polis kulak kabartır.</div>
      <div class="acts"><button class="btn primary" data-act="refund">İade et · ${money(pay)}</button><button class="btn danger" data-act="refuse">Reddet</button></div>`, 'deal');
    const a = await waitAct();
    G.stats.returns++;
    if (a === 'refund') {
      addCash(-pay); E.addRep(G, -3); hud();
      logDeal('İade', { name: c.item }, pay, -pay);
      c.actor.setEmotion('annoyed');
      await say(c, 'Bir daha seninle iş yapmam.', { vo: 'ret_ok' });
    } else {
      E.addRep(G, -10); addHeat(6); hud();
      c.actor.shake();
      await say(c, 'Bunu bütün Galata duyacak! Komisere de söyleyeceğim!', { vo: 'ret_no' });
    }
    await leave(c);
  }

  /* ---------- siparişler ---------- */
  function mkOrderer() {
    const o = E.makeOrder(G);
    const spec = MD.People.randSpec({ old: Math.random() < 0.6, gls: pick(['monocle', 'round', 'none']) });
    const name = spec.f ? pick(['Madam Eleni', 'Leman Hanım', 'Madam Sofia']) : pick(['Lord Ashby', 'Kirkor Efendi', 'Doktor Refik', 'Hacı Tevfik']);
    return { kind: 'order', order: o, name, role: 'Koleksiyoncu', tag: TAG.buyer, spec, voice: voiceFor(spec, name) };
  }
  async function orderVisit(c) {
    const o = c.order, cat = D.CATS[o.cat].g, days = o.due - G.day;
    await enter(c);
    c.actor.setPose('present');
    await say(c, `${D.RAR[o.minR].n} ya da daha iyi bir ${cat.toLowerCase()} parçası arıyorum. ${days} gün içinde bulursan piyasanın ${o.mult.toFixed(1).replace('.', ',')} katını öderim.`, { vo: 'o_hi' });
    panel(`<div class="note"><b>Sipariş:</b> ${cat} · en az ${D.RAR[o.minR].n} · ${days} gün · değerin ×${o.mult.toFixed(2).replace('.', ',')}'i. Teslim edemezsen itibarın düşer.</div>
      <div class="acts"><button class="btn primary" data-act="take" ${G.orders.length >= 2 ? 'disabled' : ''}>Siparişi al</button><button class="btn" data-act="no">İlgilenmiyorum</button></div>`, 'deal');
    const a = await waitAct();
    if (a === 'take') { G.orders.push(Object.assign({}, o, { name: c.name, spec: c.spec, voice: c.voice })); c.actor.setEmotion('happy'); c.actor.nod(); await say(c, 'Güzel. Sözüne güveniyorum.', { vo: 'o_ok' }); }
    else { c.actor.setEmotion('neutral'); await say(c, 'Peki, başka dükkâna sorarım.', { vo: 'o_no' }); }
    await leave(c);
  }
  function orderBuyer() {
    for (const o of G.orders) {
      const it = G.inv.find(x => E.orderFits(o, x) && !x.special);
      if (!it || !(o.due <= G.day || Math.random() < 0.45)) continue;
      const c = mkBuyer(it, 'koleksiyoncu');
      c.name = o.name; c.spec = o.spec; c.voice = o.voice; c.role = 'Siparişçi';
      c.max = round5(D.authVal(it) * o.mult * E.repMult(G)); c.offer = round5(c.max * 0.82);
      c.greet = `Siparişim hazır mı? ${it.name} için ${fmt(c.offer)} lira veririm.`; c.greetVo = 'o_back';
      c.orderId = o.id;
      return c;
    }
    return null;
  }

  /* ---------- hikâye ---------- */
  const DESPINA = () => MD.People.randSpec({ f: true, old: true, skin: '#e6bd94', hair: '#8a8680', hs: 'bun', hat: 'none', dress: '#2e2a3a', pearls: true, gls: 'none', w: 1.05 });
  const STORY = {
    d1: { who: 'despina', lines: ['Rıza benim meyhanemin en eski müşterisiydi. O gece köprüden düşmedi, evlat; düşürüldü.', 'Nuri\'nin bir defteri var. Galata\'nın yarısının borcu, sırrı o sayfalarda. Gözünü dört aç.'] },
    k1: { who: 'komiser', lines: ['Nuri Efendi\'yi yıllardır izliyorum ama elimde delil yok.', 'Onun defterini bulursan bana getir. Senin borcun da o defterle birlikte yanar.'] },
    n1: { who: 'nuri', lines: ['Komiserle çay içtiğini duydum, evlat.', 'Akıllı ol. Rıza da akıllı olmayı unutmuştu.'] },
    d2: { who: 'despina', lines: ['Rıza ölmeden bana bir anahtar bıraktı. Tezgâhın altındaki gizli çekmeceyi açıyor.', 'İçinde ne varsa artık senin. Ama dikkat et, o defteri isteyen çok.'] },
  };
  function storyCustomer() {
    const S = G.story;
    if (G.time > 720) return null;
    const mk = (key, who) => {
      S[key] = true;
      if (who === 'despina') return { kind: 'story', key, name: 'Madam Despina', role: 'Meyhaneci', tag: '#5a2a4a', spec: DESPINA(), voice: 'despina' };
      if (who === 'komiser') return { kind: 'story', key, name: 'Komiser Cevdet', role: 'Beyoğlu Karakolu', tag: TAG.komiser, spec: KOMISER(), voice: 'komiser' };
      return { kind: 'story', key, name: 'Nuri Efendi', role: 'Tefeci', tag: TAG.lender, spec: NURI(), voice: 'nuri' };
    };
    if (G.day >= 3 && !S.d1) return mk('d1', 'despina');
    if (G.day >= 5 && !S.k1) return mk('k1', 'komiser');
    if (G.day >= 10 && !S.n1) return mk('n1', 'nuri');
    if (G.day >= 15 && G.paidN >= 2 && !S.d2) return mk('d2', 'despina');
    return null;
  }
  async function storyVisit(c) {
    const st = STORY[c.key];
    await enter(c);
    const emo = { d1: 'sad', k1: 'think', n1: 'sly', d2: 'worried' }[c.key];
    c.actor.setEmotion(emo);
    if (c.key === 'n1') c.actor.setPose('cross');
    panel(`<div class="note center">${c.name} kısık sesle konuşuyor…</div>`, 'idle');
    for (let i = 0; i < st.lines.length; i++) await say(c, st.lines[i], { wait: true, vo: `${c.key}-${i + 1}` });
    if (c.key === 'd2') {
      const it = { id: MD.U.uid(), cat: 'book', vi: 2, name: 'Nuri\'nin Kara Defteri', r: 3, c: 2, fake: false, stolen: false, noise: 1, k: { c: true, a: true, p: true }, paid: 0, day: G.day, special: 'ledger' };
      G.inv.push(it); MD.Shop.setShelf(G.inv);
      panel(`<div class="seal-wrap"><div class="seal">KARA DEFTER</div><p>Depoya eklendi. Depo'dan açıp ne yapacağına karar ver.</p></div>`, 'idle');
      MD.Audio.play('stamp');
      await sleep(1600);
    }
    await leave(c);
  }
  async function ledgerChoice(to) {
    closeSheet();
    const remaining = DUE.slice(G.paidN).reduce((s, d) => s + d.amt, 0);
    G.inv = G.inv.filter(x => x.special !== 'ledger');
    MD.Shop.setShelf(G.inv);
    if (to === 'komiser') {
      if (G.shadow >= 40) {
        await gameOver('Aynı Hücrede', 'Komiser Cevdet defteri açtı. Nuri\'nin sayfalarında senin gece işlerin, çalıntı mallar ve rüşvetler de yazılıydı. İkiniz aynı gün tutuklandınız.');
        return;
      }
      G.story.ending = 'durust'; G.paidN = DUE.length; save();
      await victory('durust', remaining);
    } else {
      G.story.ending = 'baba'; G.shadow += 20; G.paidN = DUE.length; save();
      await victory('baba', remaining);
    }
  }

  /* ---------- dükkân geliştirmeleri ---------- */
  function applyUpgrades() {
    MD.Shop.setUpgrades && MD.Shop.setUpgrades(G.upg);
    MD.Music.setGramofon(!!E.upg(G, 'gramofon'));
  }
  async function dukkanSheet() {
    while (true) {
      const html = `<h2 class="sh-title">Dükkân</h2><p class="sh-sub">İtibar ${Math.round(G.rep)} · ${E.repTitle(G.rep)}</p>
        <div class="upg-list">${Object.entries(E.UPG).map(([k, u]) => {
          const lv = E.upg(G, k), max = u.lv.length, cost = u.lv[lv];
          return `<div class="upg">
            <div class="upg-top"><b>${u.n}</b><span class="dots">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span></div>
            <p>${u.d}</p>
            <small>${lv ? 'Şu an: ' + u.fx(lv) : 'Etkisi: ' + u.fx(1)}${lv && lv < max ? ' · Sonraki: ' + u.fx(lv + 1) : ''}</small>
            ${lv < max ? `<button class="btn small primary" data-s="u:${k}" ${G.cash >= cost ? '' : 'disabled'}>${lv ? 'Geliştir' : 'Satın al'} · ${money(cost)}</button>` : '<span class="upg-max">Tamam</span>'}
          </div>`;
        }).join('')}</div>
        <div class="acts"><button class="btn" data-s="close">Kapat</button></div>`;
      const v = await openSheet(html, 'dukkan-sheet');
      if (v === 'close') break;
      if (v.startsWith('u:')) {
        const k = v.slice(2), cost = E.upgCost(G, k);
        if (cost != null && G.cash >= cost) {
          addCash(-cost); G.upg[k] = E.upg(G, k) + 1;
          if (k === 'tabela') { E.addRep(G, 12); }
          G.dayLog.push({ k: 'Geliştirme', n: E.UPG[k].n, p: cost, pl: null, t: hhmm(G.time) });
          applyUpgrades(); hud(); MD.Audio.play('coin'); save();
        }
      }
    }
    closeSheet();
  }

  /* ---------- mezat ---------- */
  async function auctionDay() {
    panel(`<div class="idle-wrap"><div class="idle-clock">Cumartesi</div><p>Kapalıçarşı'da haftalık mezat başlıyor.</p></div>`, 'idle');
    const won = await MD.Auction.run({ cash: G.cash, lots: E.auctionLots(G), vo: k => MD.VO.play('mezatci', k) });
    MD.Music.scene('shop');
    for (const w of won) {
      w.item.paid = w.price; w.item.day = G.day;
      G.inv.push(w.item); addCash(-w.price); G.stats.bought++;
      G.dayLog.push({ k: 'Mezat', n: w.item.name, p: w.price, pl: null, t: 'mezat' });
    }
    MD.Shop.setShelf(G.inv); save();
  }

  /* ---------- gün döngüsü ---------- */
  function idlePanel() {
    const late = G.time >= CLOSE - 60;
    panel(`<div class="idle-wrap">
      <div class="idle-clock">${hhmm(G.time)}</div>
      <p>${late ? 'Kapanışa az kaldı.' : 'Dükkân açık. Kapının zilini bekliyorsun…'}</p>
      <div class="acts"><button class="btn" data-act="close">Dükkânı kapat</button></div>
    </div>`, 'idle');
  }
  async function visit(c) {
    if (c.kind === 'seller') return sellerVisit(c);
    if (c.kind === 'buyer') return buyerVisit(c);
    if (c.kind === 'recruit') return recruitVisit(c);
    if (c.kind === 'muhbir') return muhbirVisit(c);
    if (c.kind === 'komiser') return komiserVisit(c);
    if (c.kind === 'return') return returnVisit(c);
    if (c.kind === 'order') return orderVisit(c);
    if (c.kind === 'story') return storyVisit(c);
  }
  async function dayLoop() {
    if (running) return;
    running = true;
    G.phase = 'day';
    $('#town').hidden = true;
    hud(); MD.Shop.setTime(G.time); MD.Shop.setShelf(G.inv);
    MD.Music.scene('shop'); applyUpgrades();
    if (G.intro) { await introScene(); G.intro = false; save(); }
    while (G.time < CLOSE && !closeEarly && !G.over) {
      idlePanel();
      const r = await Promise.race([sleep(1100).then(() => 'go'), waitAct()]);
      actRes = null;
      if (r === 'close') { closeEarly = true; break; }
      if (G.heat >= 100) break;
      await visit(nextCustomer());
      if (G.over) break;
      await tick(ri(...E.C.GAP));
      save();
    }
    closeEarly = false;
    running = false;
    if (G.over) return;
    if (G.heat >= 100) return arrested();
    await endDay();
  }
  async function endDay() {
    panel(`<div class="idle-wrap"><div class="idle-clock">Kapandı</div><p>Kepenkler iniyor.</p></div>`, 'idle');
    MD.Shop.setTime(Math.max(G.time, CLOSE));
    const due = DUE[G.paidN];
    if (G.day % 7 === E.C.AUCTION_DAY) await auctionDay();
    if (due && !G.endless && due.day === G.day) { await lenderVisit(); if (G.over) return; }
    if (G.over) return;
    await ledgerSheet(true);
    goNight();
  }

  /* ---------- sayfa (sheet) sistemi ---------- */
  let sheetRes = null, sheetHideT = null;
  function openSheet(html, cls = '') {
    const s = $('#sheet');
    clearPortraits();
    clearTimeout(sheetHideT);
    s.innerHTML = `<div class="sheet-card ${cls}">${html}</div>`;
    if (s.hidden) { s.hidden = false; requestAnimationFrame(() => s.classList.add('open')); }
    else s.classList.add('open');
    return new Promise(r => { sheetRes = r; });
  }
  function closeSheet() {
    const s = $('#sheet');
    clearPortraits();
    s.classList.remove('open');
    sheetRes = null;
    clearTimeout(sheetHideT);
    sheetHideT = setTimeout(() => { s.hidden = true; s.innerHTML = ''; }, 230);
  }

  const OUT_K = new Set(['Alış', 'Mezat', 'İade', 'Geliştirme']);
  function ledgerRows(log) {
    if (!log.length) return '<p class="muted">Bugün defter boş kaldı.</p>';
    return `<table class="ledger"><thead><tr><th>Saat</th><th>İşlem</th><th class="n">Tutar</th><th class="n">Kâr/Zarar</th></tr></thead><tbody>
      ${log.map(r => `<tr><td>${r.t}</td><td><b>${r.k}</b> ${r.n}</td><td class="n">${OUT_K.has(r.k) ? '−' : '+'}${fmt(r.p)}</td><td class="n ${r.pl == null ? '' : r.pl >= 0 ? 'pos' : 'neg'}">${r.pl == null ? '·' : (r.pl >= 0 ? '+' : '−') + fmt(Math.abs(r.pl))}</td></tr>`).join('')}
    </tbody></table>`;
  }
  function stockValue() {
    let a = 0, b = 0;
    G.inv.forEach(it => { const e = D.estimate(it); a += e[0]; b += e[1]; });
    return [a, b];
  }
  async function ledgerSheet(endOfDay) {
    MD.Audio.play('page');
    const spent = G.dayLog.filter(r => OUT_K.has(r.k) && r.k !== 'İade').reduce((s, r) => s + r.p, 0);
    const earned = G.dayLog.filter(r => r.k === 'Satış').reduce((s, r) => s + r.p, 0);
    const realized = G.dayLog.filter(r => r.pl != null).reduce((s, r) => s + r.pl, 0);
    const [sa, sb] = stockValue();
    await openSheet(`<h2 class="sh-title">${endOfDay ? 'Günün Hesabı' : 'Defter'}</h2>
      <p class="sh-sub">${G.day}. gün · ${hhmm(Math.min(G.time, CLOSE))}</p>
      ${ledgerRows(G.dayLog)}
      <div class="totals">
        <div><span>Alışlara giden</span><b class="neg">−${fmt(spent)} L</b></div>
        <div><span>Satışlardan gelen</span><b class="pos">+${fmt(earned)} L</b></div>
        <div class="big"><span>Gerçekleşen kâr</span><b class="${realized >= 0 ? 'pos' : 'neg'}">${realized >= 0 ? '+' : '−'}${fmt(Math.abs(realized))} L</b></div>
        <div><span>Kasa</span><b>${money(G.cash)}</b></div>
        <div><span>Depodaki mal (${G.inv.length}) tahmini</span><b>${fmt(sa)}–${fmt(sb)} L</b></div>
      </div>
      <div class="acts">${endOfDay ? '<button class="btn primary" data-s="ok">Geceye çık</button>' : '<button class="btn" data-s="close">Kapat</button>'}</div>`, 'ledger-sheet');
    closeSheet();
  }

  async function depoSheet() {
    let sel = null;
    while (true) {
      const [sa, sb] = stockValue();
      let html;
      if (!sel) {
        html = `<h2 class="sh-title">Depo</h2><p class="sh-sub">${G.inv.length} parça · tahmini ${fmt(sa)}–${fmt(sb)} L</p>
          <div class="inv-list">${G.inv.length ? G.inv.map(it => {
            const R = D.RAR[it.r];
            return `<button class="inv-row" data-s="i:${it.id}" style="--rar:${R.c}">${MD.Art.item(it)}<span class="inv-n"><b>${it.name}</b><small><i style="color:${R.c}">${R.n}</i> · ${it.k.c ? D.COND[it.c].n : 'Durum ?'}${it.stolen ? ' · <em class="neg">Çalıntı</em>' : ''}${it.k.a && it.fake ? ' · <em class="neg">Sahte</em>' : ''}${it.restoring ? ' · <em>Ustada</em>' : ''}${G.orders.some(o => E.orderFits(o, it)) ? ' · <em class="pos">Siparişe uygun</em>' : ''}${it.special ? ' · <em class="neg">Gizli</em>' : ''}</small></span>
              <span class="inv-v"><small>Ödenen</small>${money(it.paid)}<small>Tahmin ${estText(it)}</small></span></button>`;
          }).join('') : '<p class="muted">Raflar boş. Satıcılardan mal al.</p>'}</div>
          <div class="acts"><button class="btn" data-s="close">Kapat</button></div>`;
      } else {
        const it = G.inv.find(x => x.id === sel);
        if (!it) { sel = null; continue; }
        const day = G.phase === 'day';
        html = `<h2 class="sh-title">${it.name}</h2>${cardHTML(it, { paid: it.paid })}
          ${day ? `<div class="tools">${['c', 'a', 'p'].map(t => `<button class="tool" data-s="t:${t}" ${it.k[t] ? 'disabled' : ''}>${TOOL_SVG[t]}<span>${MD.Bench.toolName(t, it)}</span><small>${it.k[t] ? 'Bakıldı' : '~' + E.inspectMin(G) + ' dk'}</small></button>`).join('')}</div>` : ''}
          ${it.special === 'ledger' ? `<p>Nuri Efendi'nin mühürlü defteri. Sayfalarda Galata'nın yarısının borcu ve sırları yazılı. Ne yapacaksın?</p>
            <div class="acts"><button class="btn primary" data-s="L:komiser">Komiser Cevdet'e götür</button><button class="btn danger" data-s="L:nuri">Nuri Efendi'ye geri ver</button></div>
            <p class="muted">Komiser, senin de gölgeli işlerini görebilir. Nuri ise seni ortak yapar ama bedeli ağır olur.</p>` : ''}
          ${!it.special && it.k.c && it.c < 3 && !it.restoring ? `<div class="acts"><button class="btn" data-s="R" ${G.cash >= E.restoreCost(it) ? '' : 'disabled'}>Ustaya ver · ${money(E.restoreCost(it))} <small>(sabaha ${D.COND[it.c + 1].n})</small></button></div>` : ''}
          ${it.restoring ? '<p class="muted">Usta Kâzım üzerinde çalışıyor; sabah hazır olacak.</p>' : ''}
          ${!it.k.c && !it.special ? '<p class="muted">Ustaya vermek için önce durumuna bak.</p>' : ''}
          <div class="acts"><button class="btn" data-s="back">Geri</button></div>`;
      }
      const v = await openSheet(html, 'depo-sheet');
      if (v.startsWith('L:')) { await ledgerChoice(v.slice(2)); return; }
      if (v === 'R') {
        const it = G.inv.find(x => x.id === sel), cost = it && E.restoreCost(it);
        if (it && cost && G.cash >= cost) { addCash(-cost); it.restoring = true; G.dayLog.push({ k: 'Geliştirme', n: 'Onarım: ' + it.name, p: cost, pl: null, t: hhmm(G.time) }); MD.Audio.play('coin'); save(); }
        continue;
      }
      if (v === 'close') break;
      if (v === 'back') { sel = null; continue; }
      if (v.startsWith('i:')) { sel = v.slice(2); continue; }
      if (v.startsWith('t:')) {
        const it = G.inv.find(x => x.id === sel);
        if (it && !it.k[v[2]]) { const m = await MD.Bench.run(v[2], it, E.inspectMin(G)); it.k[v[2]] = true; await tick(m); MD.Audio.play('stamp'); save(); }
      }
    }
    closeSheet();
  }

  async function ekipSheet() {
    while (true) {
      const html = `<h2 class="sh-title">Ekip</h2><p class="sh-sub">${G.crew.length}/5 kişi · günlük toplam ${money(G.crew.reduce((s, c) => s + c.wage, 0))}</p>
        <div class="crew-list">${G.crew.map(cr => crewCardHTML(cr) + `<button class="btn small danger" data-s="f:${cr.id}">Kov</button>`).join('') || '<p class="muted">Ekip yok.</p>'}</div>
        <p class="muted">Yeni adamları gece meyhanede ya da gündüz kapıda bulursun.</p>
        <div class="acts"><button class="btn" data-s="close">Kapat</button></div>`;
      const p = openSheet(html, 'ekip-sheet');
      mountPortraits($('#sheet'), G.crew);
      const v = await p;
      if (v === 'close') break;
      if (v.startsWith('f:')) { G.crew = G.crew.filter(c => c.id !== v.slice(2)); save(); }
    }
    closeSheet();
  }

  async function defterSheet() {
    while (true) {
      const html = `<h2 class="sh-title">Mühürlü Defter</h2>
        <p class="sh-sub">Dayı Rıza'nın borcu · Nuri Efendi</p>
        <div class="debts">${DUE.map((d, i) => `<div class="debt ${i < G.paidN ? 'paid' : ''}"><span>${d.day}. gün · Pazar</span><b>${money(d.amt)}</b>${i < G.paidN ? '<i class="mini-seal">ÖDENDİ</i>' : ''}</div>`).join('')}</div>
        <div class="totals">
          <div><span>Alınan / satılan parça</span><b>${G.stats.bought} / ${G.stats.sold}</b></div>
          <div><span>Toplam gerçekleşen kâr</span><b class="${G.stats.profit >= 0 ? 'pos' : 'neg'}">${G.stats.profit >= 0 ? '+' : '−'}${fmt(Math.abs(G.stats.profit))} L</b></div>
          <div><span>En kârlı satış</span><b>+${fmt(G.stats.best)} L</b></div>
          <div><span>Gece işleri</span><b>${G.stats.jobs}</b></div>
          <div><span>Piyasa</span><b><span class="pos">${D.CATS[G.trend.up].g} ↑</span> · <span class="neg">${D.CATS[G.trend.down].g} ↓</span></b></div>
        </div>
        <div class="totals"><div><span>İtibar</span><b>${Math.round(G.rep)} · ${E.repTitle(G.rep)}</b></div><div><span>Gölge</span><b class="${G.shadow >= 40 ? 'neg' : ''}">${G.shadow >= 40 ? 'Adın karanlık işlerle anılıyor' : G.shadow >= 20 ? 'Fısıltılar var' : 'Temiz'}</b></div></div>
        ${G.orders.length ? `<h3 class="sh-h3">Siparişler</h3><div class="debts">${G.orders.map(o => `<div class="debt"><span>${o.name}: ${D.CATS[o.cat].g}, en az ${D.RAR[o.minR].n}</span><b>${o.due - G.day <= 0 ? 'bugün' : (o.due - G.day) + ' gün'}</b></div>`).join('')}</div>` : ''}
        <h3 class="sh-h3">Bugünkü işlemler</h3>
        ${ledgerRows(G.dayLog)}
        <div class="acts">
          <button class="btn" data-s="snd">Ses: ${MD.Audio.on ? 'Açık' : 'Kapalı'}</button>
          <button class="btn" data-s="mus">Müzik: ${MD.Music.on ? 'Açık' : 'Kapalı'}</button>
          <button class="btn" data-s="fast">İnceleme: ${MD.Bench.fast ? 'Hızlı' : 'Oyunlu'}</button>
          <button class="btn danger" data-s="new">Yeni oyun</button>
          <button class="btn primary" data-s="close">Kapat</button>
        </div>`;
      const v = await openSheet(html, 'defter-sheet');
      if (v === 'close') break;
      if (v === 'snd') { MD.Audio.on = !MD.Audio.on; continue; }
      if (v === 'mus') { MD.Music.on = !MD.Music.on; continue; }
      if (v === 'fast') { MD.Bench.fast = !MD.Bench.fast; continue; }
      if (v === 'new') {
        const w = await openSheet(`<h2 class="sh-title">Yeni oyun?</h2><p>Bu oyundaki kasa, mallar ve ekip silinir. Geri alınamaz.</p>
          <div class="acts"><button class="btn danger" data-s="yes">Evet, baştan başla</button><button class="btn" data-s="no">Vazgeç</button></div>`);
        if (w === 'yes') { closeSheet(); clearSave(); location.reload(); return; }
      }
    }
    closeSheet();
  }

  /* ---------- gece ---------- */
  function goNight() {
    G.phase = 'night';
    if (!G.night) {
      const pool = D.JOBS.filter(j => j.minDay <= G.day);
      const jobs = MD.U.shuffle(pool).slice(0, 3).map(j => j.id);
      G.night = { jobs, assign: {}, cands: [D.makeCrew(), D.makeCrew()], star: G.tip ? jobs[0] : null };
    }
    save();
    MD.Audio.play('night'); MD.Music.scene('night');
    $('#town').hidden = false;
    hud();
    renderTown();
  }
  const jobById = id => D.JOBS.find(j => j.id === id);
  const crewById = id => G.crew.find(c => c.id === id);
  function busyIn(id) { return Object.keys(G.night.assign).find(j => G.night.assign[j].includes(id)); }
  function chance(job, ids) {
    if (!ids.length) return 0;
    const power = ids.map(crewById).filter(Boolean).reduce((s, c) => s + job.key.reduce((q, k) => q + c[k], 0), 0);
    return clamp(0.45 + (power - job.diff) * 0.1 + (G.night.star === job.id ? 0.15 : 0), 0.05, 0.95);
  }
  function renderTown() {
    const N = G.night;
    const pins = N.jobs.map(id => {
      const j = jobById(id);
      return { key: 'j:' + id, loc: j.loc, kind: 'job', label: (N.star === id ? '★ ' : '') + D.LOCS[j.loc], badge: (N.assign[id] || []).length || '' };
    });
    pins.push({ key: 'meyhane', loc: 'meyhane', kind: 'recruit', label: 'Meyhane · Adam bul' });
    pins.push({ key: 'karakol', loc: 'karakol', kind: 'bribe', label: 'Karakol · Zarf' });
    pins.push({ key: 'dukkan', loc: 'dukkan', kind: 'home', label: 'Dükkân · Geceyi bitir' });
    MD.Town.setPins(pins);
    $('#tCrew').innerHTML = G.crew.map(c => {
      const j = busyIn(c.id);
      const st = c.jail ? 'Nezarette' : c.hurt ? 'Yaralı' : j ? D.LOCS[jobById(j).loc] : 'Boşta';
      return `<span class="chip ${c.jail || c.hurt ? 'off' : j ? 'busy' : ''}"><b>${c.name}</b><small>${st}</small></span>`;
    }).join('') || '<span class="chip off"><b>Ekip yok</b><small>Meyhaneye uğra</small></span>';
    hud();
  }
  async function onPin(key) {
    if (!G || G.phase !== 'night') return;
    if (key.startsWith('j:')) return jobSheet(key.slice(2));
    if (key === 'meyhane') return meyhaneSheet();
    if (key === 'karakol') return karakolSheet();
    if (key === 'dukkan') {
      const any = Object.values(G.night.assign).some(a => a.length);
      const v = await openSheet(`<h2 class="sh-title">Geceyi bitir</h2><p>${any ? 'Adamların işe çıkacak. Sabah sonuçlarını göreceksin.' : 'Bu gece kimse işe çıkmıyor. Dükkâna dönüp uyuyacaksın.'}</p>
        <div class="acts"><button class="btn primary" data-s="go">${any ? 'İşleri başlat' : 'Uyu'}</button><button class="btn" data-s="close">Vazgeç</button></div>`);
      closeSheet();
      if (v === 'go') endNight();
    }
  }
  async function jobSheet(id) {
    const job = jobById(id), N = G.night;
    while (true) {
      const ids = N.assign[id] || [];
      const p = chance(job, ids);
      const keyN = { kas: 'Kas', sin: 'Sinsilik', akl: 'Kurnazlık' };
      const reward = job.cash ? `${fmt(job.cash[0])}–${fmt(job.cash[1])} L nakit` : job.items ? `${job.items} parça mal` : `${D.RAR[job.item.rar[0]].n}${job.item.rar[1] !== job.item.rar[0] ? '/' + D.RAR[job.item.rar[1]].n : ''} mücevher/eser (çalıntı)`;
      const html = `<h2 class="sh-title">${N.star === id ? '★ ' : ''}${job.t}</h2><p class="sh-sub">${D.LOCS[job.loc]}</p>
        <p>${job.d}</p>
        <div class="totals">
          <div><span>Gereken</span><b>${job.key.map(k => keyN[k]).join(' + ')} · zorluk ${job.diff}</b></div>
          <div><span>Ödül</span><b class="pos">${reward}${N.star === id ? ' · ×1,5' : ''}</b></div>
          <div><span>Polis dikkati</span><b class="neg">+${job.heat}</b></div>
          <div><span>Kişi</span><b>${ids.length}/${job.slots}</b></div>
        </div>
        <div class="chance"><span>Başarı şansı</span><div class="meter"><i style="--v:${Math.round(p * 100)}%"></i></div><b>%${Math.round(p * 100)}</b></div>
        <div class="pick-list">${G.crew.map(c => {
          const inThis = ids.includes(c.id), other = busyIn(c.id) && !inThis, off = c.hurt || c.jail;
          const val = job.key.reduce((q, k) => q + c[k], 0);
          return `<button class="pick ${inThis ? 'on' : ''}" data-s="c:${c.id}" ${off || other || (!inThis && ids.length >= job.slots) ? 'disabled' : ''}>
            <b>${c.name}</b><small>${D.ROLES[c.role].n} · güç ${val}${off ? ' · ' + (c.jail ? 'nezarette' : 'yaralı') : other ? ' · başka işte' : ''}</small></button>`;
        }).join('') || '<p class="muted">Ekibin yok. Meyhaneden adam bul.</p>'}</div>
        <div class="acts"><button class="btn primary" data-s="close">Tamam</button></div>`;
      const v = await openSheet(html, 'job-sheet');
      if (v === 'close') break;
      if (v.startsWith('c:')) {
        const cid = v.slice(2);
        const a = N.assign[id] = N.assign[id] || [];
        const i = a.indexOf(cid);
        if (i >= 0) a.splice(i, 1); else if (a.length < job.slots) a.push(cid);
        MD.Audio.play('tap');
      }
    }
    closeSheet(); save(); renderTown();
  }
  async function meyhaneSheet() {
    while (true) {
      const N = G.night;
      const html = `<h2 class="sh-title">Madam Despina Meyhanesi</h2><p class="sh-sub">Rakı, duman ve iş arayan adamlar</p>
        <div class="crew-list">${N.cands.map(cr => crewCardHTML(cr, { hire: true }) + `<button class="btn small primary" data-s="h:${cr.id}" ${G.cash >= cr.hire && G.crew.length < 5 ? '' : 'disabled'}>İşe al · ${money(cr.hire)}</button>`).join('') || '<p class="muted">Bu gece masada kimse kalmadı.</p>'}</div>
        ${G.crew.length >= 5 ? '<p class="warn">Ekip dolu (5/5).</p>' : ''}
        <div class="acts"><button class="btn" data-s="close">Çık</button></div>`;
      const p = openSheet(html, 'ekip-sheet');
      mountPortraits($('#sheet'), N.cands);
      const v = await p;
      if (v === 'close') break;
      if (v.startsWith('h:')) {
        const cr = N.cands.find(c => c.id === v.slice(2));
        if (cr && G.cash >= cr.hire) { addCash(-cr.hire); G.crew.push(cr); N.cands = N.cands.filter(c => c !== cr); MD.Audio.play('coin'); save(); }
      }
    }
    closeSheet(); renderTown();
  }
  async function karakolSheet() {
    const opts = [[80, 10], [180, 25]];
    const v = await openSheet(`<h2 class="sh-title">Beyoğlu Karakolu</h2><p class="sh-sub">Nöbetçi komiser yardımcısı esniyor</p>
      <p>Bir zarf, bazı dosyaların tozlu rafta kalmasını sağlar. Polis dikkati şu an <b>${Math.round(G.heat)}</b>.</p>
      <div class="acts">${opts.map(([c, h]) => `<button class="btn" data-s="b:${c}:${h}" ${G.cash >= c ? '' : 'disabled'}>Zarf · ${money(c)} → −${h}</button>`).join('')}<button class="btn primary" data-s="close">Vazgeç</button></div>`);
    if (v.startsWith('b:')) { const [, c, h] = v.split(':'); addCash(-+c); G.heat = clamp(G.heat - +h, 0, 100); G.shadow += 2; MD.Audio.play('pay'); save(); }
    closeSheet(); renderTown();
  }
  async function endNight() {
    const N = G.night, runs = [], rep = [];
    for (const id of N.jobs) {
      const ids = (N.assign[id] || []).filter(x => crewById(x));
      if (!ids.length) continue;
      const job = jobById(id), p = chance(job, ids), ok = Math.random() < p;
      runs.push({ loc: job.loc, crew: ids.map(crewById), ok, job, ids });
    }
    if (runs.length) await MD.Town.runCrew(runs);
    const mult = id => (N.star === id ? 1.5 : 1);
    for (const r of runs) {
      const j = r.job;
      if (r.ok) {
        G.stats.jobs++; G.shadow += 5;
        if (j.cash) { const v = Math.round(rnd(j.cash[0], j.cash[1]) * mult(j.id)); G.cash += v; rep.push(`<li class="pos"><b>${j.t}:</b> başarılı, +${fmt(v)} L</li>`); }
        else {
          const n = j.items || 1, got = [];
          for (let i = 0; i < n; i++) {
            const it = D.makeItem(j.items ? { rar: ri(j.rar[0], j.rar[1]), stolen: true } : { rar: ri(j.item.rar[0], j.item.rar[1]), cats: null, cat: j.item.cats ? pick(j.item.cats) : undefined, stolen: true, cond: ri(2, 3) });
            it.k = { c: true, a: true, p: false }; it.paid = 0; it.day = G.day + 1;
            G.inv.push(it); got.push(it.name);
          }
          rep.push(`<li class="pos"><b>${j.t}:</b> başarılı, depoya ${got.join(', ')} (çalıntı)</li>`);
        }
        G.heat = clamp(G.heat + j.heat, 0, 100);
      } else {
        G.heat = clamp(G.heat + Math.round(j.heat * 0.6), 0, 100);
        const hasYan = r.ids.some(id => crewById(id).role === 'yankesici');
        const hurt = [];
        r.ids.forEach(id => {
          const c = crewById(id);
          if (Math.random() < (hasYan ? 0.06 : 0.12)) { c.jail = 3; hurt.push(c.name + ' nezarete düştü'); }
          else if (Math.random() < 0.35) { c.hurt = 2; hurt.push(c.name + ' yaralandı'); }
        });
        rep.push(`<li class="neg"><b>${j.t}:</b> başarısız${hurt.length ? '. ' + hurt.join(', ') : ''}</li>`);
      }
    }
    // sabah
    if (G.crew.length >= 2 && Math.random() < 0.07 + (G.heat > 60 ? 0.05 : 0)) {
      const cand = G.crew.filter(c => c.name !== 'Topal Hüsnü' && !c.jail);
      if (cand.length) {
        const tr = pick(cand);
        G.crew = G.crew.filter(c => c !== tr);
        if (Math.random() < 0.5) { const v = round5(G.cash * rnd(0.1, 0.2)); G.cash -= v; rep.push(`<li class="neg"><b>İhanet:</b> ${tr.name} kasadan ${fmt(v)} L alıp kayboldu.</li>`); }
        else { G.heat = clamp(G.heat + 15, 0, 100); rep.push(`<li class="neg"><b>İhanet:</b> ${tr.name} karakola ötüp kayboldu. Polis dikkati +15.</li>`); }
      }
    }
    G.inv.filter(x => x.restoring).forEach(it => { const from = D.COND[it.c].n; it.c = Math.min(3, it.c + 1); it.restoring = false; rep.push(`<li class="pos"><b>Usta Kâzım:</b> ${it.name} onarıldı (${from} → ${D.COND[it.c].n}).</li>`); });
    G.day++;
    G.orders.filter(o => o.due < G.day).forEach(o => { E.addRep(G, -3); rep.push(`<li class="neg"><b>Sipariş kaçtı:</b> ${o.name} beklediği ${D.CATS[o.cat].g.toLowerCase()} parçasını alamadı. İtibar −3.</li>`); });
    G.orders = G.orders.filter(o => o.due >= G.day);
    G.time = OPEN; G.phase = 'day'; G.night = null; G.tip = false; G.komiserToday = false; G.dayLog = [];
    G.crew.forEach(c => { if (c.hurt) c.hurt--; if (c.jail) c.jail--; });
    let wages = 0; const quit = [];
    G.crew = G.crew.filter(c => {
      if (c.jail) return true;
      if (G.cash >= c.wage) { G.cash -= c.wage; wages += c.wage; return true; }
      quit.push(c.name); return false;
    });
    const decay = 4 + 2 * G.crew.filter(c => c.role === 'kabadayi' && !c.jail).length;
    G.heat = clamp(G.heat - decay, 0, 100);
    G.trend = makeTrend();
    save();
    $('#town').hidden = true;
    if (G.heat >= 100) return arrested();
    await morningSheet(rep, wages, quit, decay);
    dayLoop();
  }
  async function morningSheet(rep, wages, quit, decay) {
    const d = new Date(1926, 4, 2 + G.day);
    const due = DUE[G.paidN];
    MD.Audio.play('page');
    MD.Shop.setTime(OPEN); hud();
    await openSheet(`<div class="paper">
      <div class="paper-mast">Galata Postası</div>
      <div class="paper-date">${d.getDate()} ${MON[d.getMonth()]} 1926 · ${DAYN[(G.day - 1) % 7]} · Fiyatı 5 kuruş</div>
      <h2 class="paper-head">${pick(D.HEADLINES)}</h2>
      <p class="paper-col"><b>Piyasa:</b> ${D.CATS[G.trend.up].g} rağbette, alıcılar %30 fazla veriyor. ${D.CATS[G.trend.down].g} ilgisi düştü (−%20).</p>
    </div>
    ${rep.length ? `<h3 class="sh-h3">Gece raporu</h3><ul class="report">${rep.join('')}</ul>` : ''}
    <div class="totals">
      ${wages ? `<div><span>Ekip yevmiyesi</span><b class="neg">−${fmt(wages)} L</b></div>` : ''}
      <div><span>Polis dikkati</span><b>${Math.round(G.heat)} <small>(−${decay})</small></b></div>
      <div><span>Kasa</span><b>${money(G.cash)}</b></div>
      ${due && !G.endless ? `<div><span>Nuri Efendi</span><b>${money(due.amt)} · ${due.day - G.day <= 0 ? 'bu akşam' : (due.day - G.day) + ' gün sonra'}</b></div>` : ''}
    </div>
    ${quit.length ? `<p class="warn">Yevmiye ödenemedi, ayrıldılar: ${quit.join(', ')}</p>` : ''}
    <div class="acts"><button class="btn primary" data-s="ok">Dükkânı aç</button></div>`, 'morning-sheet');
    closeSheet();
  }

  /* ---------- son ---------- */
  async function arrested() { await gameOver('Tutuklandın', 'Polis dikkati sınırı aştı. Komiser Cevdet kapıya dayandı ve defteri mühürledi.'); }
  async function gameOver(title, text) {
    G.over = title; clearSave();
    running = false;
    await openSheet(`<div class="end"><div class="seal red">${title.toUpperCase()}</div><p>${text}</p>
      <div class="totals"><div><span>Gün</span><b>${G.day}</b></div><div><span>Alınan / satılan</span><b>${G.stats.bought} / ${G.stats.sold}</b></div><div><span>Toplam kâr</span><b>${fmt(G.stats.profit)} L</b></div></div>
      <div class="acts"><button class="btn primary" data-s="new">Baştan başla</button></div></div>`, 'end-sheet');
    location.reload();
  }
  const ENDINGS = {
    durust: ['DÜRÜST TÜCCAR', 'Kara defteri Komiser Cevdet\'e verdin. Nuri Efendi o gece tutuklandı, kalan borcun defterle birlikte yandı. Rıza\'nın intikamı alındı; Galata seni namuslu bir antikacı olarak anacak.'],
    baba: ['GALATA\'NIN BABASI', 'Kara defteri Nuri Efendi\'ye geri verdin. Borcun silindi ve Nuri seni ortağı yaptı. Artık Galata\'da her fısıltı senin kulağına geliyor; ama Rıza\'nın hesabını hiç soramayacaksın.'],
    golge: ['GÖLGELERİN TÜCCARI', 'Dayının borcunu ödedin ama çalıntı mallar, gece işleri ve rüşvetlerle. Galata\'da adın saygıyla değil, korkuyla anılıyor.'],
    normal: ['DEFTER KAPANDI', 'Dayının borcunu ödedin. Galata\'da adın artık saygıyla anılıyor.'],
  };
  async function victory(kind, saved) {
    kind = kind || (G.shadow >= 40 ? 'golge' : 'normal');
    const [title, text] = ENDINGS[kind];
    const v = await openSheet(`<div class="end"><div class="seal ${kind === 'baba' || kind === 'golge' ? 'red' : ''}">${title}</div>
      <p>${text}</p>${saved ? `<p class="muted">Silinen borç: ${money(saved)}</p>` : ''}<p class="muted">${G.day}. gün · İtibar ${Math.round(G.rep)}</p>
      <div class="totals"><div><span>Kasa</span><b>${money(G.cash)}</b></div><div><span>Alınan / satılan</span><b>${G.stats.bought} / ${G.stats.sold}</b></div><div><span>Toplam kâr</span><b>${fmt(G.stats.profit)} L</b></div><div><span>Gece işleri</span><b>${G.stats.jobs}</b></div></div>
      <div class="acts"><button class="btn primary" data-s="go">Ticarete devam et</button><button class="btn" data-s="new">Yeni oyun</button></div></div>`, 'end-sheet');
    closeSheet();
    if (v === 'new') { clearSave(); location.reload(); return; }
    G.endless = true; save(); hud();
  }

  /* ---------- açılış ekranı ---------- */
  function titleScreen() {
    const t = $('#title');
    const has = load();
    $('#btnCont').hidden = !has;
    const svg = $('#titleScene');
    const a = new MD.Actor(Object.assign(NURI(), { acc: 'cigar' }));
    a.place(220, 604, 0.98); a.setPose('cigar'); a.setEmotion('sly');
    svg.querySelector('#titleActor').appendChild(a.el);
    const start = async fresh => {
      MD.Audio.unlock(); MD.Audio.play('stamp'); MD.haptic('medium');
      t.classList.add('out');
      setTimeout(() => { t.hidden = true; a.remove(); }, 500);
      if (fresh) { clearSave(); newGame(); } else { G = has; }
      hud();
      if (G.phase === 'night') { MD.Shop.setTime(CLOSE); MD.Shop.setShelf(G.inv); goNight(); }
      else dayLoop();
    };
    t.addEventListener('pointerdown', () => { MD.Music.unlock(); MD.Music.scene('title'); }, { once: true });
    $('#btnNew').onclick = () => start(true);
    $('#btnCont').onclick = () => start(false);
  }

  /* ---------- olaylar ---------- */
  function wire() {
    MD.Shop.init($('#scene'));
    MD.Town.init($('#townMap'), onPin);
    document.addEventListener('click', e => {
      const b = e.target.closest('#panel [data-act]');
      if (!b || b.disabled) return;
      MD.Audio.play('tap'); MD.haptic('light');
      if (typing) skipType = true;
      if (actRes) { const r = actRes; actRes = null; r(b.getAttribute('data-act')); }
      else queued = { id: panelId, act: b.getAttribute('data-act') };
    });
    $('#sheet').addEventListener('click', e => {
      const b = e.target.closest('[data-s]');
      if (b && !b.disabled) { MD.Audio.play('tap'); MD.haptic('light'); if (sheetRes) { const r = sheetRes; sheetRes = null; r(b.getAttribute('data-s')); } }
    });
    $('#stage').addEventListener('click', () => {
      if (typing) skipType = true;
      else if (tapWait) { const r = tapWait; tapWait = null; r(); }
    });
    document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      if (!G || !$('#sheet').hidden) return;
      MD.Audio.play('page');
      const k = b.getAttribute('data-open');
      if (k === 'depo') depoSheet(); else if (k === 'ekip') ekipSheet(); else if (k === 'dukkan') dukkanSheet(); else defterSheet();
    }));
    MD.Shop.ledger.addEventListener('click', () => { if (G && $('#sheet').hidden) { MD.Audio.play('page'); defterSheet(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  }

  window.addEventListener('DOMContentLoaded', () => { wire(); titleScreen(); });
  MD.Game = { get state() { return G; }, save };
})();
