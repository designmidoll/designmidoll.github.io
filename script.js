
/* ── TOGGLE BEFORE/AFTER ── */
function initToggle() {
  document.querySelectorAll('.tg-wrap').forEach(wrap => {
    if (wrap._tgInit) return;
    wrap._tgInit = true;
    const tabs  = wrap.querySelectorAll('.tg-tab');
    const after = wrap.querySelector('.tg-after');
    const hint  = wrap.querySelector('.tg-hint');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        after.classList.toggle('tg-visible', tab.dataset.state === 'after');
      });
    });
  });
}
document.addEventListener('DOMContentLoaded', initToggle);

/* ── PAGE ROUTING ── */
history.scrollRestoration = 'manual';
window.addEventListener('load', () => window.scrollTo(0, 0));

function showPage(p) {
  const pageMap = { home: 'home-page', case: 'case-page', case2: 'case2-page', about: 'about-page' };
  const fileMap = { home: 'index.html', about: 'index.html', case: 'youtube.html', case2: 'nom.html' };
  const target = document.getElementById(pageMap[p]);
  if (!target) { window.location.href = fileMap[p] + (p === 'about' ? '#about' : ''); return; }
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  target.classList.add('active');
  window.scrollTo(0, 0);
  if (p === 'case' || p === 'case2') {
    setTimeout(() => initCaseSidenav(pageMap[p]), 100);
    setTimeout(initHighlights, 200);
    setTimeout(initToggle, 150);
  } else {
    document.getElementById('case-sidenav')?.classList.remove('visible');
    document.getElementById('case2-sidenav')?.classList.remove('visible');
  }
  // update nav active state
  document.querySelectorAll('#global-nav [data-page]').forEach(a => {
    a.classList.toggle('nav-active', a.dataset.page === p);
  });
}

/* ── SEOUL CLOCK ── */
function updateNavClock() {
  const now = new Date();
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  let h = kst.getHours(), m = kst.getMinutes(), s = kst.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const _clk = document.getElementById('nav-clock');
  if (_clk) _clk.textContent =
    `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} ${ampm}`;
}
updateNavClock();
setInterval(updateNavClock, 1000);
// set initial active state
document.querySelector('#global-nav [data-page="home"]')?.classList.add('nav-active');

function scrollToSec(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = document.getElementById('global-nav')?.offsetHeight || 0;
  const offset = 24; // extra breathing room below the nav
  const top = el.getBoundingClientRect().top + window.scrollY - navH - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

function initCaseSidenav(pageId) {
  pageId = pageId || 'case-page';
  const page = document.getElementById(pageId);
  if (!page) return;
  const navId = pageId === 'case2-page' ? 'case2-sidenav' : 'case-sidenav';
  const nav = document.getElementById(navId);
  if (!nav) return;

  // 다른 케이스 사이드내비는 숨김
  document.querySelectorAll('.case-sidenav').forEach(n => n.classList.remove('visible'));
  nav.classList.add('visible');

  // 이미 빌드된 경우 재빌드 생략 (단 visible 처리는 위에서 완료)
  if (nav._built) return;
  nav._built = true;

  // 섹션 레이블 정의 (표시 이름) — case 1 전용 allowlist
  const sectionMap = {
    'Problem': 'Problem',
    'Design & Research Process': 'Process',
    'Prototype': 'Prototype',
    'Usability Testing': 'Usability Testing',
    'Affinity Mapping': 'Affinity & Insights',
    'Design Solution': 'Final Design',
    'Reflection': 'Reflection'
  };

  const items = [];
  page.querySelectorAll('.cb-section').forEach((section) => {
    // data-nav 속성이 있으면 우선 사용, 없으면 sectionMap allowlist 사용
    let label = section.getAttribute('data-nav');
    if (!label) {
      const lbl = section.querySelector('.cb-label');
      if (!lbl) return;
      const raw = lbl.textContent.trim();
      if (!sectionMap[raw]) return;
      label = sectionMap[raw];
    }
    if (!section.id) {
      section.id = navId + '-' + label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    }
    items.push({ id: section.id, label });
  });

  nav.innerHTML = items.map(it =>
    `<button data-target="${it.id}" onclick="scrollToSec('${it.id}')">${it.label}</button>`
  ).join('');

  // 스크롤 트래킹
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        nav.querySelectorAll('button').forEach(btn => {
          btn.classList.toggle('snav-active', btn.dataset.target === entry.target.id);
        });
      }
    });
  }, { rootMargin: '-15% 0px -75% 0px' });

  items.forEach(it => {
    const el = document.getElementById(it.id);
    if (el) observer.observe(el);
  });
}

/* ── CHAT ── */
const responses = {
  default: '안녕하세요! 저는 Miseon Park의 포트폴리오 AI입니다. 리서치 방법론, 프로젝트, 또는 협업에 대해 무엇이든 물어보세요!',
  research: '사용자가 말하는 불편함을 그대로 받아들이지 않습니다. 인터뷰와 행동 관찰을 통해 맥락을 파악하고, 진정한 문제가 무엇인지 검증합니다. 올바른 문제 정의가 좋은 디자인의 시작이라고 믿기 때문입니다.',
  designer: '상황에 맞는 검증 방법을 선택합니다. 실무에서는 GA와 Clarity를 통해 사용자 행동 데이터를 분석하고 A/B 테스트로 검증합니다. 리서치 프로젝트에서는 사용자 인터뷰, 사용성 테스트, SUS 설문을 활용합니다. 방법은 다르지만, 가설을 세우고 데이터로 판단하는 원칙은 일관됩니다.',
  youtube: 'YouTube Shorts의 쇼핑 스티커 기능이 시청 경험을 방해하는 문제를 해결하기 위해 시작한 프로젝트입니다. 8명의 사용자 인터뷰를 통해 "광고로 인식되어 즉시 무시된다"는 핵심 문제를 발견했고, 이를 바탕으로 스티커 이동 기능과 My Products를 설계했습니다. 리서치부터 최종 디자인 출시까지 전체 과정을 주도했습니다.',
  ai: '리서치 데이터 정리와 패턴 파악에 AI를 활용하고, Figma AI로 초기 시안을 빠르게 잡습니다. 이 포트폴리오 사이트도 Claude로 직접 만들었습니다.',
};

function getResponse(text) {
  const t = text.toLowerCase();
  if (t.includes('define') || t.includes('problem') || t.includes('문제') || t.includes('정의')) return responses.research;
  if (t.includes('validate') || t.includes('검증') || t.includes('데이터')) return responses.designer;
  if (t.includes('youtube') || t.includes('shorts') || t.includes('쇼츠') || t.includes('프로젝트')) return responses.youtube;
  if (t.includes('ai') || t.includes('인공지능') || t.includes('claude') || t.includes('활용')) return responses.ai;
  return responses.default;
}

function addMsg(text, who) {
  const wrap = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + who;
  const av = document.createElement('div');
  av.className = 'msg-avatar ' + (who === 'user' ? 'me' : 'ai');
  av.textContent = who === 'user' ? '🙂' : '✦';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble ' + (who === 'user' ? 'me' : 'ai');
  if (who === 'ai' && text === '...') {
    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    bubble.appendChild(dots);
  } else {
    bubble.textContent = text;
  }
  div.appendChild(av); div.appendChild(bubble);
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

function handleChatSend() {
  const inp = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';
  addMsg(text, 'user');
  const typing = addMsg('...', 'ai');
  setTimeout(() => {
    typing.remove();
    addMsg(getResponse(text), 'ai');
  }, 900);
}

function handleChatKey(e) { if (e.key === 'Enter' && !e.isComposing) handleChatSend(); }

function sendAsk(text) {
  const inp = document.getElementById('chat-input');
  inp.value = text;
  handleChatSend();
  document.getElementById('chat-input').focus();
}

/* ── PROCESS STEPPER ── */
const procSteps = [
  { title:'Experience Analysis', sub:'Step 1 of 6 — 기존 사용자 경험 분석', desc:'YouTube Shorts 쇼핑 기능의 UX를 직접 사용하며 문제를 탐색했습니다. 스티커 배치, 바텀시트 구조, 구매 연결 플로우를 관찰하며 개선이 필요한 지점을 파악했습니다.', chips:["쇼핑 스티커 UX 분석", "사용자 행동 흐름 관찰", "문제 지점 탐색"] },
  { title:'UX Strategy', sub:'Step 2 of 6 — UX 개선 방향 정의', desc:'기존 경험 분석에서 발견한 Pain Point를 바탕으로 해결 방향을 설정하고, 핵심 기능 4가지의 우선순위를 정의했습니다. 각 기능이 어떤 문제를 해결하는지 명확히 한 뒤 프로토타입 설계로 넘어갔습니다.', chips:["스티커 위치 제어", "저장 기능 설계", "제품 뱃지 + 타임스탬프", "My Products 설계"] },
  { title:'Prototyping', sub:'Step 3 of 6 — 프로토타입 설계', desc:'Lo-fi 와이어프레임으로 핵심 플로우를 빠르게 구조화한 뒤, Hi-fi 디자인으로 구체화했습니다. 스티커 이동 인터랙션과 바텀시트 플로우를 중심으로 Figma 프로토타입을 제작해 UT에 직접 활용했습니다.', chips:["Lo-fi 와이어프레임", "Hi-fi UI 디자인", "Figma 프로토타입"] },
  { title:'Usability Testing', sub:'Step 4 of 6 — 사용성 테스트', desc:'사전 스크리너를 활용한 목적적 표집으로 쇼핑 경험 유무에 따라 각 4명씩 총 8명을 모집했습니다. 최근 1개월 내 Shorts 시청, 제품 스티커 인지, 스마트폰 주 사용자를 기준으로 참가자를 한정했습니다. Figma 프로토타입 기반 7개 태스크를 Think-Aloud 방식으로 수행하며 완료 시간과 오류 횟수를 기록했고, 15초 이상 침묵 시 중립적 질문으로 발화를 유도했습니다. 세션 후 SUS 설문과 심층 인터뷰로 마무리했습니다.', chips:["Purposive Sampling", "Think-Aloud", "7개 태스크", "SUS 설문", "심층 인터뷰"] },
  { title:'Affinity Mapping', sub:'Step 5 of 6 — 피드백 구조화', desc:'8명의 발화 데이터를 포스트잇으로 옮겨 유사한 패턴끼리 그룹핑했습니다. 스티커 오클릭, 행선지 불안, 저장 기능 부재 등 주요 Pain Point 카테고리를 도출하고 Key Insights로 정제했습니다.', chips:["발화 데이터 그룹핑", "Pain Point 범주화", "어피니티 다이어그램"] },
  { title:'Final Design', sub:'Step 6 of 6 — 최종 디자인 완성', desc:'UT와 어피니티 매핑에서 도출한 인사이트를 바탕으로 디자인을 개선해 최종 프로토타입을 완성했습니다.', chips:["8가지 디자인 결정", "최종 디자인 완성"] }
];
let cur = 0;
function selectStep(idx) {
  cur = idx;
  document.querySelectorAll('.proc-step').forEach((el,i) => { el.classList.remove('active','done'); if(i===idx) el.classList.add('active'); else if(i<idx) el.classList.add('done'); });
  for(let i=0;i<5;i++){const c=document.getElementById('conn-'+i);if(c)c.classList.toggle('done',i<idx);}
  const s=procSteps[idx];
  document.getElementById('pd-badge').textContent=(idx+1)+'.';
  document.getElementById('pd-title').textContent=s.title;
  document.getElementById('pd-sub').textContent=s.sub;
  document.getElementById('pd-desc').textContent=s.desc;
  const dotsEl = document.getElementById('pd-dots');
  if (dotsEl.children.length === 0) {
    for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = 'pd-dot'; dotsEl.appendChild(d); }
  }
  Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle('active', i === idx));
  document.getElementById('pd-chips').innerHTML=s.chips.map(c=>'<span class="chip">'+c+'</span>').join('');
  document.getElementById('btn-prev').disabled=idx===0;
  document.getElementById('btn-next').disabled=idx===5;
}
function stepNav(dir){const n=cur+dir;if(n>=0&&n<6)selectStep(n);}
if (document.getElementById('pd-badge')) selectStep(0);

/* ── SCROLL REVEAL ── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)';}});
}, {threshold:0.07});
document.querySelectorAll('.case-card,.cb-section,.pain-card,.insight-item,.opp-card,.ref-card,.sol-card,.meta-cell').forEach(el=>{
  el.style.opacity='0';el.style.transform='translateY(14px)';el.style.transition='opacity 0.5s ease,transform 0.5s ease';
  io.observe(el);
});

/* ── HIGHLIGHT DRAW-IN ── */
const hlObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('hl-visible'), 150);
      hlObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5, rootMargin: '0px 0px -60px 0px' });

function initHighlights() {
  document.querySelectorAll('mark.hl').forEach(el => {
    el.classList.remove('hl-visible');
    hlObs.observe(el);
  });
}
// 케이스 페이지 진입 시 하이라이트 재초기화
const _origShowPage = showPage;
window.addEventListener('load', () => {
  const origShow = showPage;
});

// ── LIGHTBOX ──
var lbZoomed = false;
var panX = 0, panY = 0;
var SCALE = 2.2;

// 드래그 상태
var imgDragging = false, lbDragging = false;
var imgDragStartX, imgDragStartY, imgDragStartPanX, imgDragStartPanY;
var lbDragStartX, lbDragStartY, lbDragStartPanX, lbDragStartPanY;
var imgDragMoved = false;

// RAF 배치
var _rafPending = false, _rafPanX = 0, _rafPanY = 0;

function _getImg()      { return document.getElementById('lb-img'); }
function _getMinimap()  { return document.getElementById('lb-minimap'); }
function _getBox()      { return document.getElementById('lb-minimap-box'); }

function _clamp(px, py) {
  var img = _getImg();
  var mx = img.offsetWidth  * (SCALE - 1) / 2;
  var my = img.offsetHeight * (SCALE - 1) / 2;
  return { x: Math.max(-mx, Math.min(mx, px)), y: Math.max(-my, Math.min(my, py)) };
}

function _applyTransform(px, py, instant) {
  var img = _getImg();
  img.style.transition     = instant ? 'none' : 'transform 0.18s ease';
  img.style.transformOrigin = '50% 50%';
  img.style.transform      = 'translate(' + px + 'px,' + py + 'px) scale(' + SCALE + ')';
  _updateBox(px, py);
}

function _scheduleApply(px, py) {
  _rafPanX = px; _rafPanY = py;
  if (_rafPending) return;
  _rafPending = true;
  requestAnimationFrame(function() {
    _rafPending = false;
    panX = _rafPanX; panY = _rafPanY;
    _applyTransform(panX, panY, true);
  });
}

function _updateBox(px, py) {
  var img  = _getImg();
  var box  = _getBox();
  var imgW = img.offsetWidth, imgH = img.offsetHeight;
  var cx   = 0.5 - px / (SCALE * imgW);
  var cy   = 0.5 - py / (SCALE * imgH);
  var visW = 1 / SCALE, visH = 1 / SCALE;
  box.style.left   = Math.max(0, Math.min(cx - visW/2, 1 - visW)) * 100 + '%';
  box.style.top    = Math.max(0, Math.min(cy - visH/2, 1 - visH)) * 100 + '%';
  box.style.width  = visW * 100 + '%';
  box.style.height = visH * 100 + '%';
}

function openTgLB(btn) {
  var wrap = btn.closest('.tg-img-wrap');
  if (!wrap) return;
  var after = wrap.querySelector('.tg-after');
  var before = wrap.querySelector('.tg-before');
  var target = (after && after.classList.contains('tg-visible')) ? after : before;
  if (target) openLBThis(target);
}

function openLBThis(el) {
  var overlay = document.getElementById('lb-overlay');
  var img = _getImg();
  img.src = el.src;
  img.style.transform = '';
  img.style.transition = '';
  img.style.cursor = 'zoom-in';
  lbZoomed = false; panX = 0; panY = 0;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLB() {
  document.getElementById('lb-overlay').classList.remove('active');
  document.body.style.overflow = '';
  lbZoomed = false; panX = 0; panY = 0;
  _getMinimap().style.display = 'none';
  setTimeout(function() {
    var img = _getImg();
    img.src = '';
    img.style.transform = '';
  }, 300);
}

function toggleZoom(e) {
  e.stopPropagation();
  if (imgDragMoved) { imgDragMoved = false; return; }
  var img  = _getImg();
  var mm   = _getMinimap();
  if (!lbZoomed) {
    var rect = img.getBoundingClientRect();
    var cx   = e.clientX - rect.left;
    var cy   = e.clientY - rect.top;
    var c    = _clamp((img.offsetWidth/2  - cx) * SCALE,
                      (img.offsetHeight/2 - cy) * SCALE);
    panX = c.x; panY = c.y;
    _applyTransform(panX, panY, false);
    lbZoomed = true;
    img.style.cursor = 'grab';
    mm.style.display = 'block';
    document.getElementById('lb-minimap-img').src = img.src;
  } else {
    img.style.transition = 'transform 0.18s ease';
    img.style.transform  = '';
    img.style.cursor     = 'zoom-in';
    lbZoomed = false; panX = 0; panY = 0;
    mm.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var box    = _getBox();
  var mm     = _getMinimap();
  var img    = _getImg();

  box.style.cursor = 'grab';

  // ── 이미지 드래그 ─────────────────────────────────────────────
  img.addEventListener('mousedown', function(e) {
    if (!lbZoomed) return;
    imgDragging = true; imgDragMoved = false;
    imgDragStartX = e.clientX; imgDragStartY = e.clientY;
    imgDragStartPanX = panX;   imgDragStartPanY = panY;
    img.style.transition = 'none';
    img.style.cursor = 'grabbing';
    e.stopPropagation();
  });

  // ── 미니맵 드래그 ─────────────────────────────────────────────
  box.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    lbDragging = true;
    lbDragStartX = e.clientX; lbDragStartY = e.clientY;
    lbDragStartPanX = panX;   lbDragStartPanY = panY;
    box.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', function(e) {
    // 이미지 드래그
    if (imgDragging && lbZoomed) {
      if (!(e.buttons & 1)) { imgDragging = false; img.style.cursor = 'grab'; return; }
      var dx = e.clientX - imgDragStartX;
      var dy = e.clientY - imgDragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) imgDragMoved = true;
      if (!imgDragMoved) return;
      var c = _clamp(imgDragStartPanX + dx, imgDragStartPanY + dy);
      _scheduleApply(c.x, c.y);
      return;
    }
    // 미니맵 드래그
    if (!lbDragging || !lbZoomed) return;
    var mmRect = mm.getBoundingClientRect();
    var c = _clamp(
      lbDragStartPanX - (e.clientX - lbDragStartX) / mmRect.width  * SCALE * img.offsetWidth,
      lbDragStartPanY - (e.clientY - lbDragStartY) / mmRect.height * SCALE * img.offsetHeight
    );
    _scheduleApply(c.x, c.y);
  });

  document.addEventListener('mouseup', function() {
    if (imgDragging) {
      imgDragging = false;
      if (lbZoomed) img.style.cursor = 'grab';
    }
    if (lbDragging) {
      lbDragging = false;
      box.style.cursor = 'grab';
    }
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLB();
});




(function() {
  const messages = {
    'Problem':                    '직접 느꼈던 불편함에서 출발했어요 🧐',
    'Design & Research Process':  '6단계로 꼼꼼하게 접근했어요!',
    'Prototype':                  'Lo-fi부터 Hi-fi까지 직접 만들었어요 ✏️',
    'Low-Fidelity':               '각 카드에 마우스를 올려보세요 👆',
    'Usability Testing':          '8명이랑 직접 테스트했어요!',
    'Affinity Mapping':           '발화 데이터에서 인사이트를 찾아냈어요 🔍',
    'Design Solution':            'UT 결과를 반영하여 최종 디자인했어요.',
    'Reflection':                 '많이 배우고 성장했답니다 :)',
    'Background':                 '데이터에서 문제를 발견했어요 📉',
    'Hypothesis':                 '가설을 세우고 검증 방향을 잡았어요 🎯',
    'Solution':                   '화면을 다시 설계했어요! Before & After 눌러보세요 👆',
    'Validation':                 '실제 데이터로 효과를 검증했어요 📊',
    'Insights':                   '두 지표가 같은 방향을 가리켰어요 ✨',
    'Limitations':                '솔직하게 한계도 적어뒀어요 🙏',
    'Conclusion':                 '개선 UI 유지로 결론 냈어요!',
    'Next Steps':                 '다음엔 이걸 해보고 싶어요 🚀'
  };

  const widget = document.getElementById('char-widget');
  const bubble = document.getElementById('char-bubble');

  function showMsg(text) {
    bubble.classList.remove('show');
    setTimeout(() => {
      bubble.textContent = text;
      bubble.classList.add('show');
    }, 200);
  }

  // Show/hide widget based on case-page or case2-page visibility
  const casePage  = document.getElementById('case-page');
  const case2Page = document.getElementById('case2-page');
  function updateVisibility() {
    const on = (casePage && casePage.classList.contains('active')) ||
               (case2Page && case2Page.classList.contains('active'));
    widget.classList.toggle('visible', on);
    if (!on) bubble.classList.remove('show');
  }
  const pageObserver = new MutationObserver(updateVisibility);
  if (casePage)  pageObserver.observe(casePage,  { attributes: true, attributeFilter: ['class'] });
  if (case2Page) pageObserver.observe(case2Page, { attributes: true, attributeFilter: ['class'] });
  updateVisibility(); // initial check (case files load already-active)

  // Watch each cb-section
  const secObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        let key;
        if (entry.target.classList.contains('cb-label')) {
          key = entry.target.textContent.trim();
        } else {
          const label = entry.target.querySelector('.cb-label');
          if (!label) return;
          key = label.textContent.trim();
        }
        if (messages[key]) showMsg(messages[key]);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.cb-section').forEach(sec => secObserver.observe(sec));

  // Sublabels need a separate observer (small elements, use threshold:0 + rootMargin)
  const sublabelObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const key = entry.target.textContent.trim();
        if (messages[key]) showMsg(messages[key]);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
  document.querySelectorAll('.cb-sublabel').forEach(el => sublabelObserver.observe(el));
})();

// Scroll FAB — down to Selected Work / up to top
function scrollFab() {
  const fab = document.getElementById('scroll-fab');
  if (fab && fab.classList.contains('up')) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const work = document.getElementById('work-section');
    if (work) work.scrollIntoView({ behavior: 'smooth' });
  }
}
window.addEventListener('scroll', () => {
  const fab = document.getElementById('scroll-fab');
  if (!fab) return;
  fab.classList.toggle('up', window.scrollY > window.innerHeight * 0.5);
}, { passive: true });


/* ── MULTI-FILE INIT (split build) ── */
document.addEventListener('DOMContentLoaded', () => {
  const cp = document.getElementById('case-page') ? 'case-page'
           : (document.getElementById('case2-page') ? 'case2-page' : null);
  if (cp) {
    try { initCaseSidenav(cp); } catch(e){}
    try { if (typeof initHighlights === 'function') initHighlights(); } catch(e){}
  }
  if (location.hash === '#about' && document.getElementById('about-page')) {
    try { showPage('about'); } catch(e){}
  }
});
