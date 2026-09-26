/* Kapalıçarşı mezadı: cumartesi kapanışta 3 parça, rakip teklifçilerle canlı artırma.
   MD.Auction.run({cash, lots, vo}) → Promise<[{item, price}]>. */
(function () {
  const { rnd, ri, pick, round5, sleep, fmt, money, shuffle } = MD.U;
  const D = MD.D;
  const RIVALS = ['Kirkor Efendi', 'Madam Sofia', 'Hacı Tevfik', 'Mösyö Lévy', 'Yorgo Usta', 'Nesim Bey'];

  function mezatciSpec() {
    return MD.People.randSpec({ f: false, old: false, skin: '#d2a278', hair: '#3a2414', hs: 'slick', hat: 'fez', mus: 'handle', gls: 'none', coat: '#6a2e29', vest: true, bow: true, tie: '#1a1a22', w: 1.05 });
  }

  function run({ cash, lots, vo }) {
    return new Promise(async resolve => {
      const won = [];
      let money_ = cash;
      const root = document.createElement('div');
      root.id = 'auction';
      root.innerHTML = `<div class="auc-card">
        <div class="auc-head"><b>Kapalıçarşı Mezadı</b><span id="aLot">1/3</span></div>
        <div class="auc-stage"><svg id="aScene" viewBox="-110 -290 220 200" preserveAspectRatio="xMidYMax meet"></svg>
          <div class="auc-call" id="aCall">Hoş geldiniz!</div></div>
        <div id="aBody"></div>
      </div>`;
      document.getElementById('app').appendChild(root);
      requestAnimationFrame(() => root.classList.add('open'));
      MD.Music && MD.Music.scene('auction');
      const svg = root.querySelector('#aScene');
      svg.innerHTML = `<rect x="-110" y="-290" width="220" height="200" fill="#3a2416"/>
        <path d="M-110,-150 H110 V-90 H-110Z" fill="#5a371f" stroke="#24160d" stroke-width="2"/>
        <path d="M-60,-150 L-50,-175 H50 L60,-150Z" fill="#6e4727" stroke="#24160d" stroke-width="2"/>`;
      const act = new MD.Actor(mezatciSpec());
      act.place(0, 20, 0.62);
      svg.insertBefore(act.el, svg.children[1]);
      const hammer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      hammer.innerHTML = `<rect x="40" y="-178" width="6" height="30" fill="#6b4524" stroke="#24160d"/><rect x="30" y="-186" width="26" height="12" rx="2" fill="#8a5a2e" stroke="#24160d"/>`;
      svg.appendChild(hammer);
      const call = t => { root.querySelector('#aCall').textContent = t; act.talking = true; setTimeout(() => { act.talking = false; }, 700); };
      const bang = () => {
        MD.Audio.play('stamp'); MD.haptic('heavy');
        MD.tween(0.25, p => hammer.setAttribute('transform', `rotate(${Math.sin(p * Math.PI) * -35} 43 -150)`));
      };
      act.setPose('present'); act.setEmotion('happy');
      vo('a_hi'); call('Hoş geldiniz efendiler! Bugünün parçaları özel.');
      await sleep(1800);

      for (let li = 0; li < lots.length; li++) {
        const lot = lots[li];
        root.querySelector('#aLot').textContent = `${li + 1}/${lots.length}`;
        const rivals = shuffle(RIVALS).slice(0, lot.caps.length).map((n, i) => ({ n, cap: lot.caps[i] }));
        let cur = lot.start, leader = null, count = 0, done = false, playerIn = false;
        const it = lot.item;
        const est = D.estimate(it);
        const step = () => round5(Math.max(5, cur * 0.08));
        const render = () => {
          const R = D.RAR[it.r];
          root.querySelector('#aBody').innerHTML = `
            <div class="auc-lot" style="--rar:${R.c}">
              <div class="auc-art">${MD.Art.item(it)}</div>
              <div><div class="card-name">${it.name}</div>
                <div class="card-rar"><span style="color:${R.c}">${R.n}</span> · ${D.CATS[it.cat].g} · ${D.COND[it.c].n}</div>
                <div class="auc-est">Tahmin ${fmt(est[0])}–${fmt(est[1])} L · <i>özgünlük bilinmiyor</i></div></div>
            </div>
            <div class="auc-bid"><span>${leader ? (leader === 'sen' ? 'En yüksek: <b>SEN</b>' : 'En yüksek: ' + leader) : 'Açılış'}</span><b>${money(cur)}</b></div>
            <div class="auc-rivals">${rivals.map(r => `<span class="${leader === r.n ? 'lead' : ''}">${r.n}</span>`).join('')}</div>
            <div class="auc-count">${['', 'Bir…', 'Bir… İki…', 'SATILDI!'][count] || ''}</div>
            <div class="acts">
              <button class="btn primary" data-a="bid" ${done || leader === 'sen' || cur + (leader ? step() : 0) > money_ ? 'disabled' : ''}>Teklif ver · ${money(cur + (leader ? step() : 0))}</button>
              <button class="btn" data-a="pass" ${done ? 'disabled' : ''}>Pas</button>
            </div>
            <p class="muted">Kasa: ${money(money_)}</p>`;
        };
        render();
        vo('a_open'); call(`${it.name}! Açılış ${fmt(cur)} lira. Kim artırır?`);
        let passed = false;
        const onClick = e => {
          const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
          MD.Audio.play('tap');
          if (b.dataset.a === 'bid') {
            if (leader) cur += step();
            leader = 'sen'; count = 0; playerIn = true; MD.haptic('light');
            act.setEmotion('delight', 900); call('Beyefendi artırdı!');
          } else { passed = true; }
          render();
        };
        root.addEventListener('click', onClick);
        while (!done) {
          await sleep(passed ? 350 : 1200);
          const bidders = rivals.filter(r => r.n !== leader && r.cap >= cur + step());
          if (bidders.length && Math.random() < (passed ? 0.9 : 0.6)) {
            const r = pick(bidders);
            if (leader) cur += step();
            leader = r.n; count = 0;
            MD.Audio.play('tick'); call(`${r.n} ${fmt(cur)} dedi!`);
          } else {
            count++;
            if (count === 1) { vo('a_one'); call('Bir…'); }
            if (count === 2) { vo('a_two'); call('İki…'); }
            if (count >= 3) {
              done = true; bang();
              if (!leader) { vo('a_none'); call('Alıcı çıkmadı. Sıradaki parça!'); }
              else if (leader === 'sen') { vo('a_sold'); call('Satıldı! Hayırlı olsun.'); money_ -= cur; won.push({ item: it, price: cur }); MD.Audio.play('pay'); }
              else { vo('a_sold'); call(`Satıldı, ${leader}!`); }
            }
          }
          render();
        }
        root.removeEventListener('click', onClick);
        await sleep(1500);
      }
      call('Mezat kapandı. Allah bereket versin!');
      root.querySelector('#aBody').innerHTML = `<div class="auc-sum">${won.length ? won.map(w => `<div><span>${w.item.name}</span><b>${money(w.price)}</b></div>`).join('') : '<p class="muted">Bu hafta mezattan bir şey almadın.</p>'}</div>
        <div class="acts"><button class="btn primary" data-a="end">Dükkâna dön</button></div>`;
      root.addEventListener('click', e => {
        if (!e.target.closest('[data-a="end"]')) return;
        MD.Audio.play('tap');
        root.classList.remove('open');
        setTimeout(() => { act.remove(); root.remove(); }, 250);
        resolve(won);
      });
    });
  }
  MD.Auction = { run };
})();
