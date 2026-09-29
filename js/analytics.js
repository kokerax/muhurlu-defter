/* Oyun analitiği (GA4). Ölçüm kimliği boşken hiçbir şey yüklenmez ve olaylar sessizce düşer.
   Reklam/kişiselleştirme sinyalleri kapalı; yalnız oyun olayları gönderilir. */
(function () {
  const GA_ID = 'G-R7JWEZZKLR';
  const inApp = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.save);
  const on = GA_ID && !inApp && !/localhost|127\.0\.0\.1/.test(location.hostname);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  if (on) {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false,
      app_platform: window.webkit && window.webkit.messageHandlers ? 'ios' : 'web' });
  }
  MD.track = function (name, params = {}) {
    if (!on) return;
    try {
      const G = MD.Game && MD.Game.state;
      if (G) Object.assign(params, { day: G.day, cash: Math.round(G.cash), rep: Math.round(G.rep || 0) });
      gtag('event', name, params);
    } catch (e) { }
  };
})();
