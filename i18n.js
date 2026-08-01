/* ═══════════════════════════════════════════════════════════
   i18n — KOR / ENG 언어 토글
   ───────────────────────────────────────────────────────────
   · 기준 언어(원본)는 KOR. 현재 페이지에 있는 글이 곧 KOR 버전입니다.
   · ENG 번역은 i18n-dict.js 의 en 값에만 채워 넣습니다.
   · en 값이 비어 있으면 KOR 원문을 그대로 보여줍니다(폴백).
     → 번역을 채운 부분만 순차적으로 영문화됩니다.
   ═══════════════════════════════════════════════════════════ */
(function () {
  var STORE_KEY = 'mp-lang';
  var DICT = window.I18N_DICT || {};

  function getLang() {
    try { return localStorage.getItem(STORE_KEY) === 'en' ? 'en' : 'ko'; }
    catch (e) { return 'ko'; }
  }
  function setLang(lang) {
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
  }

  /* 원문(KOR)을 최초 1회 기억해 둔다 — 되돌릴 때 사용 */
  function cacheOriginals() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (el.dataset.i18nKo === undefined) el.dataset.i18nKo = el.innerHTML;
    });
    /* placeholder 속성용 (예: 검색창 안내문구) */
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      if (el.dataset.i18nPhKo === undefined) el.dataset.i18nPhKo = el.getAttribute('placeholder') || '';
    });
  }

  function apply(lang) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var entry = DICT[key];
      if (lang === 'en' && entry && entry.en) {
        el.innerHTML = entry.en;            // 번역이 있으면 교체
      } else {
        el.innerHTML = el.dataset.i18nKo;   // 없으면 원문(KOR) 유지
      }
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      var entry = DICT[key];
      if (lang === 'en' && entry && entry.en) {
        el.setAttribute('placeholder', entry.en);
      } else {
        el.setAttribute('placeholder', el.dataset.i18nPhKo);
      }
    });
    document.documentElement.lang = (lang === 'en') ? 'en' : 'ko';
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('lang-active', b.dataset.lang === lang);
    });
  }

  function buildToggle() {
    /* 토글은 홈/About(index.html)에만 노출.
       케이스 상세 페이지에서는 UI만 감추고, 저장된 언어는 그대로 적용됩니다. */
    if (!document.getElementById('home-page')) return;

    var nav = document.getElementById('global-nav');
    if (!nav || nav.querySelector('.lang-toggle')) return;

    var wrap = document.createElement('div');
    wrap.className = 'lang-toggle';
    wrap.innerHTML =
      '<button class="lang-btn" data-lang="ko" type="button">KOR</button>' +
      '<span class="lang-sep"></span>' +
      '<button class="lang-btn" data-lang="en" type="button">ENG</button>';

    /* #global-nav 은 space-between(자식 2개) 구조라, 요소를 그냥 추가하면
       로고/메뉴 간격이 틀어짐 → 메뉴와 토글을 오른쪽 그룹으로 묶어 자식 수를 유지 */
    var pills = nav.querySelector('.global-nav-pills');
    if (pills && pills.parentNode === nav) {
      var right = document.createElement('div');
      right.className = 'nav-right';
      nav.insertBefore(right, pills);
      right.appendChild(wrap);    /* 토글이 탭바 왼쪽 */
      right.appendChild(pills);
    } else if (pills && pills.parentNode) {
      pills.parentNode.insertBefore(wrap, pills.nextSibling);
    } else {
      nav.appendChild(wrap);
    }

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-btn');
      if (!btn) return;
      var lang = btn.dataset.lang;
      setLang(lang);
      apply(lang);
    });
  }

  function init() {
    cacheOriginals();
    buildToggle();
    apply(getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* 다른 스크립트가 DOM을 새로 그린 뒤 다시 적용할 수 있게 노출 */
  window.applyLang = function () { cacheOriginals(); apply(getLang()); };

  /* JS 안의 문자열(캐릭터 말풍선·챗봇 답변) 번역.
     한글 원문을 그대로 키로 씁니다 → script.js 구조를 바꾸지 않아도 됩니다. */
  window.tr = function (s) {
    if (getLang() !== 'en') return s;
    var e = (window.I18N_JS || {})[s];
    return (e && e.en) ? e.en : s;
  };
  window.getLang = getLang;
})();
