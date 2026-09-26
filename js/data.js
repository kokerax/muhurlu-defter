/* Mühürlü Defter — veri, yardımcılar ve üreticiler */
window.MD = window.MD || {};

MD.U = {
  rnd: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  wpick(items, weights) {
    const sum = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  },
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  ease: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  round5: v => v >= 100 ? Math.round(v / 5) * 5 : Math.max(1, Math.round(v)),
  fmt: v => Math.round(v).toLocaleString('tr-TR'),
  money: v => Math.round(v).toLocaleString('tr-TR') + ' L',
  sleep: ms => new Promise(r => setTimeout(r, ms)),
  uid: () => Math.random().toString(36).slice(2, 9),
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  hhmm: m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'),
};

(function () {
  const { rnd, ri, pick, wpick, round5, uid } = MD.U;

  const RAR = [
    { n: 'Sıradan', c: '#6f6a5c', m: 1 },
    { n: 'Nadir', c: '#2f6aa3', m: 2.2 },
    { n: 'Epik', c: '#7d3aa8', m: 4.5 },
    { n: 'Efsanevi', c: '#b8791a', m: 9 },
  ];
  const COND = [
    { n: 'Hurda', c: '#9a2b1e', m: 0.35 },
    { n: 'Yıpranmış', c: '#9a5f22', m: 0.7 },
    { n: 'İyi', c: '#3d6a34', m: 1 },
    { n: 'Kusursuz', c: '#23676a', m: 1.45 },
  ];
  const GOLD = '#d6aa4c', SILVER = '#c3c8cb', BRONZE = '#a0673a', BRASS = '#c49a45', COPPER = '#b8683b';

  const CATS = {
    ring: { g: 'Mücevher', base: 90, art: 'ring', v: [
      { n: 'Yakut Mühür Yüzük', metal: GOLD, gem: '#b3202c' },
      { n: 'Zümrüt Yüzük', metal: GOLD, gem: '#1f8a55' },
      { n: 'Safir Yüzük', metal: SILVER, gem: '#2a4fb0' },
      { n: 'Akik Mühür Yüzük', metal: SILVER, gem: '#c0602a' },
      { n: 'Pırlanta Tektaş', metal: SILVER, gem: '#dff3f7' }] },
    necklace: { g: 'Mücevher', base: 130, art: 'necklace', v: [
      { n: 'İnci Gerdanlık', metal: GOLD, gem: '#f3ecdf' },
      { n: 'Mercan Kolye', metal: GOLD, gem: '#c9493a' },
      { n: 'Firuze Kolye', metal: SILVER, gem: '#3fa7a0' }] },
    watch: { g: 'Saat', base: 105, art: 'watch', v: [
      { n: 'Gümüş Cep Saati', metal: SILVER, gem: '#f4ecd8' },
      { n: 'Altın Cep Saati', metal: GOLD, gem: '#f4ecd8' },
      { n: 'Mineli Cep Saati', metal: GOLD, gem: '#dfe9f3' }] },
    vase: { g: 'Porselen', base: 70, art: 'vase', v: [
      { n: 'Kütahya Çini Vazo', metal: '#f1ead8', gem: '#2c5fa8' },
      { n: 'İznik Desenli Vazo', metal: '#f3eee2', gem: '#b33a2c' },
      { n: 'Çin Porseleni Vazo', metal: '#eef0ee', gem: '#24438f' },
      { n: 'Bohem Kristal Vazo', metal: '#cfe3e6', gem: '#7a3a8f' }] },
    painting: { g: 'Tablo', base: 135, art: 'painting', v: [
      { n: 'Boğaz Manzarası', metal: GOLD, gem: '#7fa6c4' },
      { n: 'Haliç\'te Gün Batımı', metal: GOLD, gem: '#e0925a' },
      { n: 'Galata Gecesi', metal: BRONZE, gem: '#3a4a6e' }] },
    bust: { g: 'Heykel', base: 120, art: 'bust', v: [
      { n: 'Bronz Büst', metal: BRONZE, gem: '#6b4524' },
      { n: 'Mermer Büst', metal: '#e4ded0', gem: '#b8b0a0' },
      { n: 'Alçı Büst', metal: '#efe8da', gem: '#c9bfae' }] },
    pistol: { g: 'Silah', base: 110, art: 'pistol', v: [
      { n: 'Kakmalı Kubur Tabanca', metal: SILVER, gem: '#6b3d1f' },
      { n: 'Gümüş İşlemeli Tabanca', metal: SILVER, gem: '#3a2414' }] },
    dagger: { g: 'Silah', base: 100, art: 'dagger', v: [
      { n: 'Gümüş Kınlı Hançer', metal: SILVER, gem: '#6b3d1f' },
      { n: 'Fildişi Saplı Hançer', metal: GOLD, gem: '#efe6cf' },
      { n: 'Mercan Saplı Hançer', metal: GOLD, gem: '#b8443a' }] },
    book: { g: 'Kitap', base: 80, art: 'book', v: [
      { n: 'Tezhipli Divan', metal: GOLD, gem: '#6b2a1c' },
      { n: 'El Yazması Tarih', metal: GOLD, gem: '#2c4a3a' },
      { n: 'Deri Ciltli Atlas', metal: BRASS, gem: '#3a2c1c' }] },
    candle: { g: 'Aydınlatma', base: 65, art: 'candle', v: [
      { n: 'Gümüş Şamdan', metal: SILVER, gem: '#f3ead5' },
      { n: 'Pirinç Şamdan', metal: BRASS, gem: '#f3ead5' },
      { n: 'Bronz Şamdan', metal: BRONZE, gem: '#efe2c6' }] },
    gramophone: { g: 'Mekanik', base: 150, art: 'gramophone', v: [
      { n: 'Borulu Gramofon', metal: BRASS, gem: '#5a3a22' },
      { n: 'Pathé Gramofon', metal: COPPER, gem: '#3a2414' }] },
    coffee: { g: 'Mutfak', base: 50, art: 'coffee', v: [
      { n: 'Bakır Cezve Takımı', metal: COPPER, gem: '#f1ead8' },
      { n: 'Gümüş Zarflı Fincanlar', metal: SILVER, gem: '#f3eee2' }] },
  };

  function makeItem(o = {}) {
    const cat = o.cat || pick(Object.keys(CATS));
    const C = CATS[cat];
    const vi = o.vi != null ? o.vi : ri(0, C.v.length - 1);
    const r = o.rar != null ? o.rar : wpick([0, 1, 2, 3], o.rw || [56, 29, 12, 3]);
    const c = o.cond != null ? o.cond : wpick([0, 1, 2, 3], [18, 35, 33, 14]);
    return {
      id: uid(), cat, vi, name: C.v[vi].n, r, c,
      fake: !!o.fake, stolen: !!o.stolen,
      noise: rnd(0.78, 1.22),
      k: { c: false, a: false, p: false },
      paid: 0, day: 0,
    };
  }
  const variant = it => CATS[it.cat].v[it.vi];
  const authVal = it => Math.round(CATS[it.cat].base * RAR[it.r].m * COND[it.c].m);
  const trueVal = it => Math.round(authVal(it) * (it.fake ? 0.12 : 1));

  function estimate(it) {
    const base = CATS[it.cat].base * RAR[it.r].m;
    const v = base * (it.k.c ? COND[it.c].m : 1) * (it.k.a && it.fake ? 0.12 : 1);
    let spread = 0.5 - (it.k.c ? 0.2 : 0) - (it.k.p ? 0.22 : 0);
    spread = Math.max(0.07, spread);
    const n = it.k.p ? 1 : it.noise;
    return [round5(v * n * (1 - spread)), round5(v * n * (1 + spread))];
  }

  const FIRST_M = ['Rıfat', 'Cemil', 'Hayri', 'Şükrü', 'Agop', 'Yorgo', 'Nesim', 'Kirkor', 'Vasil', 'Refik', 'Tevfik', 'Halit', 'İsak', 'Dimitri', 'Selim', 'Kâzım', 'Şevket', 'Mösyö Pierre', 'Hasan', 'Zekâi', 'Avram', 'Stelyo', 'Bedri', 'Nazım'];
  const FIRST_F = ['Nazlı', 'Feride', 'Madam Anjel', 'Sofia', 'Rebeka', 'Nermin', 'Leman', 'Mari', 'Fitnat', 'Zehra', 'Beatris', 'Seniha', 'Eleni', 'Mükerrem', 'Suzan', 'Matild'];
  const NICK = ['Topal', 'Kör', 'Sarı', 'Çakır', 'Tırnak', 'Ördek', 'Kibar', 'Sessiz', 'Deli', 'Kara', 'Uzun', 'Kıvırcık', 'Pire', 'Gölge', 'Tilki', 'Bıçkın'];

  const ROLES = {
    kabadayi: { n: 'Kabadayı', main: 'kas', perk: 'Polis dikkati her sabah 2 puan daha hızlı düşer.' },
    yankesici: { n: 'Yankesici', main: 'sin', perk: 'Başarısız işte yakalanma riski yarıya iner.' },
    kalpazan: { n: 'Kalpazan', main: 'akl', perk: 'Koleksiyoncular sahte malı fark etmez.' },
    eksper: { n: 'Eksper', main: 'akl', perk: 'Satıcının getirdiği eşyanın durumu bedava görünür.' },
  };

  function makeCrew(role, o = {}) {
    role = role || pick(Object.keys(ROLES));
    const f = o.f != null ? o.f : Math.random() < 0.25;
    const st = { kas: ri(1, 2), sin: ri(1, 2), akl: ri(1, 2) };
    st[ROLES[role].main] = ri(3, 5);
    const total = st.kas + st.sin + st.akl;
    const wage = 6 + total * 2 + ri(0, 4);
    return Object.assign({
      id: uid(), role, f,
      name: pick(NICK) + ' ' + pick(f ? FIRST_F.filter(n => !n.startsWith('Madam')) : FIRST_M.filter(n => !n.startsWith('Mösyö'))),
      kas: st.kas, sin: st.sin, akl: st.akl, wage,
      hire: wage * 4, hurt: 0, jail: 0,
      spec: MD.People.randSpec({ f, old: Math.random() < 0.2 }),
    }, o);
  }

  const JOBS = [
    { id: 'rihtim', loc: 'rihtim', t: 'Kaçak Tütün Yükü', d: 'Gece yarısı rıhtıma yanaşan mavnadan sandıkları indir. Gümrükçüler uyuyor, umarız.', key: ['kas'], diff: 3, slots: 2, cash: [120, 220], heat: 8, minDay: 1 },
    { id: 'carsi', loc: 'carsi', t: 'Sahte Tapu Mührü', d: 'Çarşıdaki bir sarraf, eski bir tapunun mührünü kopyalatmak istiyor. Temiz iş, az kan.', key: ['akl'], diff: 3, slots: 1, cash: [100, 180], heat: 5, minDay: 1 },
    { id: 'tahsilat', loc: 'kumar', t: 'Kumar Borcu Tahsilatı', d: 'Kumarhanenin arka odasında borcunu unutan bir kalantor var. Hatırlatmak gerek.', key: ['kas'], diff: 4, slots: 1, cash: [130, 210], heat: 7, minDay: 2 },
    { id: 'konak', loc: 'konak', t: 'Paşa Konağı', d: 'Emekli paşa Yalova kaplıcasında. Kasasındaki mücevherler sahipsiz kaldı sayılır.', key: ['sin'], diff: 5, slots: 2, item: { rar: [2, 3], cats: ['ring', 'necklace', 'watch'] }, heat: 15, minDay: 2 },
    { id: 'gumruk', loc: 'gumruk', t: 'Mühürlü Sandıklar', d: 'Gümrük deposunda sahibi çıkmayan iki sandık var. İçinde ne olduğunu kimse bilmiyor.', key: ['kas', 'sin'], diff: 7, slots: 2, items: 2, rar: [1, 2], heat: 12, minDay: 3 },
    { id: 'muze', loc: 'muze', t: 'Müzeden Emanet', d: 'Bekçi Hasan her gece ikide uyuklar. Vitrindeki eser bir koleksiyoncuyu bekliyor.', key: ['sin', 'akl'], diff: 9, slots: 2, item: { rar: [3, 3] }, heat: 22, minDay: 5 },
    { id: 'banka', loc: 'banka', t: 'Kasa Dairesi', d: 'Bankanın alt katındaki kasa dairesi. Üç kişi, dört dakika, tek çıkış.', key: ['kas', 'sin', 'akl'], diff: 17, slots: 3, cash: [1100, 1700], heat: 32, minDay: 8 },
  ];

  const LOCS = {
    rihtim: 'Galata Rıhtımı', carsi: 'Kapalıçarşı', kumar: 'Tünel Kumarhanesi', meyhane: 'Madam Despina Meyhanesi', konak: 'Pera Konağı',
    gumruk: 'Gümrük Deposu', muze: 'Müze-i Hümayun', banka: 'Osmanlı Bankası', karakol: 'Beyoğlu Karakolu', dukkan: 'Mühürlü Defter',
  };

  const HEADLINES = [
    'Galata\'da gece bekçileri çoğaltılıyor.',
    'Pera\'da bir baloda elmas gerdanlık kayboldu.',
    'Rıhtımda kaçak tütün yakalandı, sahipleri aranıyor.',
    'Avrupalı koleksiyoncular Şehre akın ediyor.',
    'Borsa\'da altın fiyatları yükselişte.',
    'Beyoğlu\'nda yeni bir sinema açıldı: halk izdiham hâlinde.',
    'Vapur seferlerine yeni tarife: Karaköy iskelesi kalabalık.',
    'Müze-i Hümayun\'a yeni eserler getirildi.',
    'Komiser Cevdet: "Şehirde çalıntı mal ticaretine göz yummayacağız."',
    'Kapalıçarşı\'da sarraflar arasında kavga çıktı.',
  ];

  MD.D = { RAR, COND, CATS, ROLES, JOBS, LOCS, HEADLINES, FIRST_M, FIRST_F, makeItem, makeCrew, variant, authVal, trueVal, estimate };
})();
