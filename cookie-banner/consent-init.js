/* Согласие на cookie: отложенная загрузка.
   ───────────────────────────────────────────────────────────────────────────
   Зачем. Баннер выводится внизу справа, а на телефоне это почти половина
   экрана. Замер 11.19.2026 на 390×844: баннер перекрывал ВСЕ пять вариантов
   первого экрана — ни один не нажимался. Проверено попаданием в точку
   (elementFromPoint), а не на глаз. На десктопе перекрытий нет.

   Что сделано. Библиотека баннера грузится не сразу, а после первой прокрутки
   (или через 15 секунд, если человек читает не прокручивая). До этого первый
   экран свободен.

   Почему так можно. Consent Mode v2 стоит на denied по умолчанию: до согласия
   ничего не пишется и не отправляется. Закон требует спросить до записи, а не
   до показа страницы. Тому, кто уже ответил, библиотека грузится сразу —
   иначе его согласие применилось бы к счётчику только после прокрутки.

   Побочно чинится второй <h1>: окно настроек баннера содержит
   <h1>Customize your cookie preferences</h1>, который вставляется скриптом и
   оказывается ПЕРВЫМ h1 в разметке — раньше заголовка страницы. Понижаем до h2.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  var CSS = '/cookie-banner/silktide-consent-manager.css';
  var JS = '/cookie-banner/silktide-consent-manager.js';
  var CHOICE_KEY = 'silktideCookieBanner_InitialChoice';
  var SCROLL_PX = 100;
  var FALLBACK_MS = 15000;

  var started = false;
  var timer = null;

  function answeredBefore() {
    try {
      return localStorage.getItem(CHOICE_KEY) !== null;
    } catch (e) {
      return false; // приватный режим: спрашиваем заново
    }
  }

  function demoteModalHeading() {
    var all = document.querySelectorAll('h1');
    for (var i = 0; i < all.length; i++) {
      var h1 = all[i];
      if (!h1.closest || !h1.closest('[class*="silktide"], [id*="silktide"]')) continue;
      var h2 = document.createElement('h2');
      h2.innerHTML = h1.innerHTML;
      for (var a = 0; a < h1.attributes.length; a++) {
        h2.setAttribute(h1.attributes[a].name, h1.attributes[a].value);
      }
      h1.parentNode.replaceChild(h2, h1);
    }
  }

  function configure() {
    if (!window.silktideCookieBannerManager) return;

    window.silktideCookieBannerManager.updateCookieBannerConfig({
      background: { showBackground: false },
      position: { banner: 'bottomRight' },
      cookieIcon: { show: false },
      cookieTypes: [
        {
          id: 'necessary',
          name: 'Necessary',
          description: '<p>Required for the site to work. Always on.</p>',
          required: true
        },
        {
          id: 'analytics',
          name: 'Analytics',
          description: '<p>Helps us see which pages are useful, so we can improve them.</p>',
          onAccept: function () {
            if (typeof gtag === 'function') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          },
          onReject: function () {
            if (typeof gtag === 'function') {
              gtag('consent', 'update', { analytics_storage: 'denied' });
            }
          }
        }
      ]
    });

    demoteModalHeading();
  }

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (y > SCROLL_PX) start();
  }

  function start() {
    if (started) return;
    started = true;

    window.removeEventListener('scroll', onScroll);
    if (timer) clearTimeout(timer);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS;
    document.head.appendChild(link);

    var script = document.createElement('script');
    script.src = JS;
    script.onload = configure;
    document.head.appendChild(script);
  }

  if (answeredBefore()) {
    start();
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
    timer = setTimeout(start, FALLBACK_MS);
    onScroll(); // страница могла открыться уже прокрученной (переход по якорю)
  }
})();
