/* Ekonomi çekirdeği: müşteri pazarlık parametreleri, itibar, geliştirmeler, restorasyon, mezat.
   Oyun (game.js) ve denge simülasyonu (tools/denge_sim.js) aynı fonksiyonları kullanır. */
(function () {
  const { rnd, ri, pick, wpick, clamp, round5 } = MD.U;
  const D = MD.D;

  const C = {
    OPEN: 540, CLOSE: 1080,
    DUE: [{ day: 7, amt: 900 }, { day: 14, amt: 1700 }, { day: 21, amt: 2600 }],
    START_CASH: 400, START_REP: 30,
    INSPECT_MIN: 10, HAGGLE_MIN: 10, ARRIVE_MIN: 10, DEAL_MIN: 5, GAP: [5, 20],
    HEAT_DECAY: 4, KABADAYI_DECAY: 2,
    AUCTION_DAY: 6,           // haftanın 6. günü (cumartesi) kapanışta mezat
  };

  /* ---- dükkân geliştirmeleri ---- */
  const UPG = {
    vitrin: { n: 'Cam Vitrin', d: 'Daha çok alıcı uğrar, alıcılar biraz daha fazla öder.', lv: [300, 750, 1500], fx: l => `Alıcı payı +${l * 6}%, teklif +${l * 4}%` },
    lup: { n: 'Kuyumcu Lupu', d: 'İnceleme daha kısa sürer.', lv: [250, 650], fx: l => `İnceleme ${10 - l * 3} dk` },
    tabela: { n: 'Pirinç Tabela', d: 'Dükkânın adı duyulur, itibar kalıcı olarak artar.', lv: [400], fx: () => 'İtibar +12, taban 20' },
    kasa: { n: 'Çelik Kasa', d: 'Polis aramasında çalıntı malların yarısı gözden kaçar.', lv: [500], fx: () => 'Arama riski yarıya iner' },
    gramofon: { n: 'Gramofon', d: 'Dükkânda müzik çalar; müşterilerin sabrı artar.', lv: [200], fx: () => 'Müşteri sabrı +1' },
  };
  const upg = (G, k) => (G.upg && G.upg[k]) || 0;
  const upgCost = (G, k) => UPG[k].lv[upg(G, k)];
  const inspectMin = G => C.INSPECT_MIN - upg(G, 'lup') * 3;

  /* ---- itibar ---- */
  const repFloor = G => (upg(G, 'tabela') ? 20 : 0);
  function addRep(G, v) { G.rep = clamp((G.rep ?? C.START_REP) + v, repFloor(G), 100); return G.rep; }
  const repMult = G => 1 + ((G.rep ?? C.START_REP) - 30) / 220;
  function repTitle(r) {
    if (r >= 80) return 'Galata\'nın gözbebeği';
    if (r >= 60) return 'Sözü senet';
    if (r >= 40) return 'Güvenilir esnaf';
    if (r >= 20) return 'Tanınmayan dükkân';
    return 'Adı çıkmış';
  }

  /* ---- satıcı ---- */
  function sellerDeal(G) {
    const type = wpick(['saf', 'normal', 'uyanik', 'dolandirici', 'tekinsiz'], [18, 40, 20, G.day < 2 ? 8 : 13, G.day < 2 ? 4 : 9]);
    const rw = G.day < 4 ? [60, 28, 10, 2] : [48, 31, 16, 5];
    const it = D.makeItem({ rw, fake: type === 'dolandirici', stolen: type === 'tekinsiz' });
    const av = D.authVal(it);
    let ask, min;
    if (type === 'saf') { ask = av * rnd(0.45, 0.7); min = ask * rnd(0.8, 0.92); }
    else if (type === 'normal') { ask = av * rnd(0.8, 1.02); min = ask * rnd(0.72, 0.88); }
    else if (type === 'uyanik') { ask = av * rnd(1.0, 1.3); min = ask * rnd(0.8, 0.9); }
    else if (type === 'dolandirici') { ask = av * rnd(0.6, 0.85); min = ask * rnd(0.6, 0.75); }
    else { ask = av * rnd(0.35, 0.55); min = ask * rnd(0.75, 0.9); }
    ask = round5(ask); min = Math.min(ask, round5(min));
    const pat = ri(2, 4) + (upg(G, 'gramofon') ? 1 : 0);
    return { kind: 'seller', type, item: it, ask, min, pat, patMax: pat };
  }

  /* ---- alıcı ---- */
  function buyerDeal(G, perks = {}, forceItem = null, forceType = null) {
    const type = forceType || wpick(['koleksiyoncu', 'turist', 'normal', 'tuccar'], [18, 16, 40, 26]);
    const pool = G.inv.filter(x => !x.restoring);
    const it = forceItem || wpick(pool, pool.map(x => type === 'koleksiyoncu' ? 1 + x.r * 2 : 1));
    const av = D.authVal(it), tv = D.trueVal(it);
    const tr = G.trend && G.trend.up === it.cat ? 1.3 : G.trend && G.trend.down === it.cat ? 0.8 : 1;
    let max;
    if (type === 'koleksiyoncu') max = av * rnd(1.3, 1.8);
    else if (type === 'turist') max = av * rnd(1.2, 1.6);
    else if (type === 'normal') max = av * rnd(1.0, 1.3);
    else max = av * rnd(0.85, 1.05);
    max = round5(max * tr * repMult(G) * (1 + upg(G, 'vitrin') * 0.04));
    const offer = Math.max(1, round5(max * rnd(0.55, 0.78)));
    const pat = ri(2, 4) + (upg(G, 'gramofon') ? 1 : 0);
    return { kind: 'buyer', type, item: it, max, offer, pat, patMax: pat };
  }

  function respond(c, o) {
    if (c.kind === 'seller') {
      if (o >= c.min) return { type: 'accept', price: o };
      const gap = (c.min - o) / c.min;
      c.pat -= gap > 0.3 ? 2 : 1;
      if (c.pat <= 0) return { type: 'leave' };
      c.ask = Math.max(c.min, Math.min(c.ask, round5(c.ask - (c.ask - o) * rnd(0.3, 0.5))));
      return { type: 'counter', price: c.ask, insult: gap > 0.3 };
    }
    if (o <= c.max) return { type: 'accept', price: o };
    const gap = (o - c.max) / c.max;
    c.pat -= gap > 0.3 ? 2 : 1;
    if (c.pat <= 0) return { type: 'leave' };
    c.offer = Math.min(c.max, Math.max(c.offer, round5(c.offer + (o - c.offer) * rnd(0.3, 0.5))));
    return { type: 'counter', price: c.offer, insult: gap > 0.3 };
  }

  /* sahte malı fark etme olasılığı (alıcı türüne göre) */
  const FAKE_EYE = { koleksiyoncu: 0.85, tuccar: 0.5, normal: 0.35, turist: 0.1 };
  const fakeSpot = (type, perks = {}) => (perks.kalpazan ? 0.5 : 1) * FAKE_EYE[type];
  const RETURN_P = 0.3;   // fark edilmeden satılan sahtenin sonradan iade gelme olasılığı

  /* sıradaki ziyaretçi türü (özel olaylar game.js'te seçilir) */
  function tradeKind(G) {
    if (!G.inv.some(x => !x.restoring)) return 'seller';
    let pBuy = (G.inv.length > 7 ? 0.68 : 0.55) + upg(G, 'vitrin') * 0.06 + ((G.rep ?? 30) - 30) / 400;
    return Math.random() < clamp(pBuy, 0.3, 0.8) ? 'buyer' : 'seller';
  }

  /* ---- restorasyon ---- */
  function restoreCost(it) {
    if (it.c >= 3) return null;
    const base = D.CATS[it.cat].base * D.RAR[it.r].m;
    return round5(Math.max(8, base * (D.COND[it.c + 1].m - D.COND[it.c].m) * 0.45));
  }

  /* ---- siparişler ---- */
  function makeOrder(G) {
    const cat = pick(Object.keys(D.CATS));
    const minR = wpick([0, 1, 2], [30, 50, 20]);
    return { id: MD.U.uid(), cat, minR, due: G.day + ri(2, 4), mult: rnd(1.45, 1.8) };
  }
  const orderFits = (o, it) => it.cat === o.cat && it.r >= o.minR && !it.fake && !it.restoring;

  /* ---- mezat ---- */
  function auctionLots(G) {
    return [0, 1, 2].map(i => {
      const it = D.makeItem({ rw: i === 2 ? [0, 30, 50, 20] : [20, 45, 28, 7], fake: Math.random() < 0.12 });
      it.k.c = true;
      const av = D.authVal(it);
      const rivals = ri(1, 3);
      const caps = Array.from({ length: rivals }, () => round5(av * rnd(0.55, 1.05)));
      return { item: it, start: round5(av * rnd(0.3, 0.45)), caps };
    });
  }

  /* ---- gece işi şansı ---- */
  function jobChance(job, crew, star) {
    if (!crew.length) return 0;
    const power = crew.reduce((s, c) => s + job.key.reduce((q, k) => q + c[k], 0), 0);
    return clamp(0.45 + (power - job.diff) * 0.1 + (star ? 0.15 : 0), 0.05, 0.95);
  }

  MD.E = { FAKE_EYE, fakeSpot, RETURN_P, C, UPG, upg, upgCost, inspectMin, addRep, repMult, repTitle, sellerDeal, buyerDeal, respond, tradeKind, restoreCost, makeOrder, orderFits, auctionLots, jobChance };
})();
