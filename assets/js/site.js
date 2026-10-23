(function () {
  'use strict';

  const config = window.YUMU_CONFIG || {};
  const guides = window.YUMU_GUIDES || [];
  const page = document.body.dataset.page || 'home';
  const prefix = page === 'home' ? '' : '../';
  const categories = { all: '全部指南', basics: '新手與職業', systems: '特色與養成', equipment: '裝備與道具', maps: '地圖與挑戰' };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const guideUrl = id => `${prefix}pages/guide.html?id=${encodeURIComponent(id)}`;
  const libraryUrl = category => `${prefix}pages/library.html${category ? '?category=' + category : ''}`;

  const header = document.getElementById('site-header');
  if (header) header.innerHTML = `<header class="header-inner">
    <a class="brand" href="${prefix}index.html" aria-label="雨沐天堂首頁"><img src="${prefix}assets/brand/雨沐天堂-logo-v3-中英精品版.png" alt="雨沐天堂 YUMU LINEAGE" width="184" height="76"></a>
    <nav class="main-nav" id="main-nav" aria-label="主要導覽">
      <a href="${prefix}index.html" ${page === 'home' ? 'aria-current="page"' : ''}>首頁</a>
      <details class="nav-group"><summary>遊戲介紹</summary><div class="nav-popover"><a href="${guideUrl('version')}">版本設定</a><a href="${prefix}index.html#classes">七大職業</a><a href="${libraryUrl('systems')}">遊戲特色</a><a href="${libraryUrl('maps')}">地圖與挑戰</a></div></details>
      <a href="${libraryUrl()}" ${['library', 'guide'].includes(page) ? 'aria-current="page"' : ''}>冒險指南</a>
      <details class="nav-group"><summary>官方消息</summary><div class="nav-popover"><a href="${prefix}pages/events.html">活動公告</a><a href="${prefix}pages/updates.html">更新歷程</a></div></details>
      <a href="${prefix}pages/download.html" ${page === 'download' ? 'aria-current="page"' : ''}>遊戲下載</a>
    </nav>
    <div class="header-tools"><button class="search-open" type="button" aria-label="搜尋遊戲指南"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg></button><button class="contact-button" type="button" disabled title="雨沐官方 LINE 連結尚未公布">LINE 敬請期待</button><button class="menu-toggle" type="button" aria-label="開啟導覽選單" aria-controls="main-nav" aria-expanded="false"><span></span><span></span><span></span></button></div>
  </header>`;

  const footer = document.getElementById('site-footer');
  if (footer) footer.innerHTML = `<footer class="site-footer"><div class="footer-brand"><a href="${prefix}index.html" aria-label="雨沐天堂首頁"><img src="${prefix}assets/brand/雨沐天堂-logo-v3-中英精品版.png" alt="雨沐天堂" loading="lazy"></a><p>雨過天晴，與你重返亞丁。</p></div><nav class="footer-links" aria-label="頁尾導覽"><a href="${libraryUrl()}">冒險指南</a><a href="${guideUrl('rules')}">遊戲規章</a><a href="${guideUrl('faq')}">常見問題</a></nav><div class="footer-legal"><span>© ${new Date().getFullYear()} 雨沐天堂 · YUMU LINEAGE</span><span>指南內容為設定草案，實際開放內容以正式公告為準。</span></div></footer>`;

  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  function closeMenu() {
    nav?.classList.remove('is-open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', '開啟導覽選單');
  }
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.querySelectorAll('.nav-group').forEach(group => group.addEventListener('toggle', () => {
    if (group.open) document.querySelectorAll('.nav-group').forEach(other => { if (other !== group) other.open = false; });
  }));
  document.addEventListener('click', event => {
    if (!header?.contains(event.target)) {
      closeMenu();
      document.querySelectorAll('.nav-group').forEach(group => { group.open = false; });
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); document.querySelectorAll('.nav-group').forEach(group => { group.open = false; }); } });

  function findGuides(query, category = 'all') {
    const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return guides.filter(guide => (category === 'all' || guide.category === category) && tokens.every(token => `${guide.title} ${guide.description} ${guide.text}`.toLocaleLowerCase().includes(token)))
      .sort((a, b) => {
        if (!query.trim()) return 0;
        const score = guide => (guide.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 0) + (guide.description.toLowerCase().includes(query.toLowerCase()) ? 1 : 0);
        return score(b) - score(a);
      });
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'search-dialog';
  dialog.setAttribute('aria-labelledby', 'search-title');
  dialog.innerHTML = '<div class="search-dialog-head"><h2 id="search-title">雨沐資料室</h2><button class="search-close" type="button" aria-label="關閉搜尋">×</button></div><div class="search-dialog-body"><label for="global-search">尋找職業、裝備、地圖與道具</label><input id="global-search" type="search" placeholder="輸入關鍵字…" autocomplete="off"><div id="search-results" class="search-results" role="region" aria-label="搜尋結果"></div><p class="search-status" role="status" id="search-count"></p></div>';
  document.body.append(dialog);
  const globalInput = dialog.querySelector('input');
  function renderSearch() {
    const query = globalInput.value;
    const matches = query.trim() ? findGuides(query) : guides.filter(guide => ['features-newbie-guide', 'items-dragon-eye', 'features-dragon-whisper', 'dolls-guide'].includes(guide.id));
    dialog.querySelector('#search-results').innerHTML = matches.slice(0, 12).map(guide => `<a class="search-result" href="${guideUrl(guide.id)}"><small>${categories[guide.category]}</small><b>${escape(guide.title)}</b></a>`).join('');
    dialog.querySelector('#search-count').textContent = query.trim() ? (matches.length ? `找到 ${matches.length} 篇指南${matches.length > 12 ? '，顯示前 12 篇' : ''}` : '沒有找到相關內容，試試其他關鍵字。') : '先從熱門指南開始，或輸入關鍵字搜尋。';
  }
  document.querySelector('.search-open')?.addEventListener('click', () => { renderSearch(); dialog.showModal(); globalInput.focus(); });
  dialog.querySelector('.search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  globalInput.addEventListener('input', renderSearch);

  if (page === 'library') {
    const params = new URLSearchParams(location.search);
    let category = Object.hasOwn(categories, params.get('category')) ? params.get('category') : 'all';
    const query = document.getElementById('library-query');
    query.value = params.get('q') || '';
    function renderLibrary(updateUrl = false) {
      document.getElementById('category-filters').innerHTML = Object.entries(categories).map(([id, name]) => `<button class="category-button" type="button" data-category="${id}" aria-pressed="${category === id}">${name}<small>${id === 'all' ? guides.length : guides.filter(guide => guide.category === id).length}</small></button>`).join('');
      const matches = findGuides(query.value, category);
      document.getElementById('results-title').textContent = categories[category];
      document.getElementById('results-count').textContent = `${matches.length} 篇指南`;
      document.getElementById('guide-list').innerHTML = matches.length ? matches.map(guide => `<a class="guide-card" href="${guideUrl(guide.id)}"><small>${categories[guide.category]}</small><h3>${escape(guide.title)}</h3><p>${escape(guide.description)}</p><span class="link-arrow" aria-hidden="true">↗</span></a>`).join('') : '<div class="no-results"><p>沒有找到符合的指南，試著換個關鍵字。</p><button class="button" id="clear-filters" type="button">清除篩選</button></div>';
      document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; renderLibrary(true); }));
      document.getElementById('clear-filters')?.addEventListener('click', () => { query.value = ''; category = 'all'; renderLibrary(true); query.focus(); });
      if (updateUrl) { const next = new URLSearchParams(); if (category !== 'all') next.set('category', category); if (query.value) next.set('q', query.value); history.replaceState(null, '', location.pathname + (next.size ? '?' + next.toString() : '')); }
    }
    query.addEventListener('input', () => renderLibrary(true));
    renderLibrary();
  }

  if (page === 'guide') {
    const guide = guides.find(item => item.id === new URLSearchParams(location.search).get('id'));
    if (!guide) {
      document.title = '找不到指南｜雨沐天堂';
      document.getElementById('article-title').textContent = '這篇指南還沒收錄。';
      document.getElementById('article-description').textContent = '可以回到資料室，找找其他冒險線索。';
      document.querySelector('.draft-note').hidden = true;
      document.getElementById('article-body').innerHTML = '<a class="button primary" href="library.html">查看全部指南 →</a>';
    } else {
      document.title = `${guide.title}｜雨沐天堂`;
      document.getElementById('article-category').textContent = categories[guide.category];
      document.getElementById('article-title').textContent = guide.title;
      document.getElementById('article-description').textContent = guide.description;
      document.querySelector('.breadcrumb>span:last-child').textContent = guide.title;
      const sidebar = document.getElementById('guide-sidebar');
      sidebar.innerHTML = `<p>${categories[guide.category]}</p>` + guides.filter(item => item.category === guide.category).map(item => `<a href="${guideUrl(item.id)}" ${item.id === guide.id ? 'aria-current="page"' : ''}>${escape(item.title)}</a>`).join('') + `<a class="sidebar-back" href="${libraryUrl(guide.category)}">← 查看全部分類</a>`;
      const article = document.getElementById('article-body');
      article.innerHTML = guide.html;
      article.querySelectorAll('table').forEach(table => {
        if (!table.parentElement.classList.contains('table-scroll')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-scroll';
          wrapper.tabIndex = 0;
          wrapper.setAttribute('role', 'region');
          wrapper.setAttribute('aria-label', '資料表，可左右捲動查看完整內容');
          table.before(wrapper);
          wrapper.append(table);
          const hint = document.createElement('p');
          hint.className = 'table-hint';
          hint.textContent = '表格可左右滑動查看完整內容。';
          wrapper.before(hint);
        }
      });
      const headings = [...article.querySelectorAll('h2')];
      headings.forEach((heading, index) => { if (!heading.id) heading.id = `section-${index + 1}`; });
      document.getElementById('article-toc').innerHTML = headings.slice(0, 14).map(heading => `<a href="#${heading.id}">${escape(heading.textContent.trim())}</a>`).join('');
      if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    }
  }

  const classData = {
    royal: { name: '王族', english: 'ROYAL', role: '血盟的旗幟，眾人前進的方向。', description: '以號召與領導凝聚夥伴，在攻城與團隊戰鬥中，成為血盟的核心。', tags: ['血盟領導', '團隊核心'] },
    knight: { name: '騎士', english: 'KNIGHT', role: '站上前線，守住每一份託付。', description: '以堅韌防禦與近戰技巧迎向敵人，為隊友爭取空間，讓戰線穩穩向前。', tags: ['近戰防禦', '前線壓制'] },
    elf: { name: '妖精', english: 'ELF', role: '與元素同行，讓每一箭更有方向。', description: '結合弓術與精靈魔法，依不同元素選擇戰術，在遠程輸出與隊伍支援間取得平衡。', tags: ['遠程弓術', '元素魔法'] },
    wizard: { name: '法師', english: 'WIZARD', role: '知識化為力量，魔法改變戰局。', description: '從攻擊魔法到治療與輔助，以豐富的法術選擇，回應每一場戰鬥的變化。', tags: ['魔法輸出', '治療輔助'] },
    'dark-elf': { name: '黑暗妖精', english: 'DARK ELF', role: '沉靜之中，藏著致命的決斷。', description: '運用雙刀、鋼爪與黑暗精靈魔法，掌握近身交戰的節奏，將機會轉化為爆發。', tags: ['近戰爆發', '黑暗魔法'] },
    'dragon-knight': { name: '龍騎士', english: 'DRAGON KNIGHT', role: '承接龍族之力，直面下一場挑戰。', description: '以龍族力量與獨特的武器技巧連續進攻，在正面戰場展現持續施壓的能力。', tags: ['連續進攻', '龍族力量'] },
    illusionist: { name: '幻術師', english: 'ILLUSIONIST', role: '看見另一種可能，改寫戰鬥節奏。', description: '以幻術、增益與干擾影響戰局，將戰術選擇化為團隊的優勢。', tags: ['幻術控制', '戰術支援'] }
  };
  const classButtons = [...document.querySelectorAll('[data-class]')];
  function selectClass(button) {
    const data = classData[button.dataset.class];
    classButtons.forEach(tab => { const selected = tab === button; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    document.getElementById('class-panel').setAttribute('aria-labelledby', button.id);
    const image = document.getElementById('class-image'); image.src = `${prefix}assets/classes/${button.dataset.class}.jpg`; image.alt = `${data.name}職業形象`;
    ['english', 'name', 'role', 'description'].forEach(key => { document.getElementById(`class-${key}`).textContent = data[key]; });
    document.getElementById('class-tags').innerHTML = data.tags.map(tag => `<span>${tag}</span>`).join('');
  }
  classButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectClass(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? classButtons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + classButtons.length) % classButtons.length;
      classButtons[next].focus(); selectClass(classButtons[next]);
    });
  });

  const sceneButton = document.getElementById('scene-toggle');
  if (sceneButton) {
    let frame = null;
    let player = null;
    let enabled = false;
    let fallbackTimer;
    let sequence = 0;
    let apiPromise;
    const hero = document.querySelector('.hero-banner');
    const status = document.getElementById('scene-status');
    function loadPlayerApi() {
      if (window.YT?.Player) return Promise.resolve();
      if (apiPromise) return apiPromise;
      apiPromise = new Promise((resolve, reject) => {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { if (typeof previous === 'function') previous(); resolve(); };
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.addEventListener('error', () => { apiPromise = null; script.remove(); reject(new Error('Scene API unavailable')); });
        document.head.append(script);
      });
      return apiPromise;
    }
    function stopScene() {
      sequence++;
      enabled = false;
      clearTimeout(fallbackTimer);
      hero.classList.remove('is-scene-playing');
      sceneButton.setAttribute('aria-pressed', 'false');
      sceneButton.innerHTML = '<span class="play-symbol" aria-hidden="true">▷</span> 動態場景';
      player?.destroy(); player = null;
      frame?.remove(); frame = null;
    }
    sceneButton.addEventListener('click', async () => {
      if (enabled) { stopScene(); status.textContent = '已停止動態場景。'; return; }
      enabled = true;
      const current = ++sequence;
      sceneButton.setAttribute('aria-pressed', 'true');
      sceneButton.innerHTML = '<span class="play-symbol" aria-hidden="true">Ⅱ</span> 停止場景';
      status.textContent = '正在載入動態場景。';
      fallbackTimer = setTimeout(() => { if (!hero.classList.contains('is-scene-playing') && current === sequence) { stopScene(); status.textContent = '場景影片未能載入，已保留雨沐主視覺。'; } }, 14000);
      try { await loadPlayerApi(); } catch { if (current === sequence) { stopScene(); status.textContent = '場景影片目前無法載入，已保留雨沐主視覺。'; } return; }
      if (!enabled || current !== sequence) return;
      frame = document.createElement('iframe');
      const id = config.sceneVideo?.youtubeId || 'dFlKOUeNczg';
      const origin = /^https?:$/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) : '';
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&loop=1&playlist=${id}${origin}`;
      frame.title = '經典天堂世界動態場景'; frame.tabIndex = -1; frame.allow = 'autoplay; encrypted-media'; frame.referrerPolicy = 'strict-origin-when-cross-origin';
      document.getElementById('scene-video').append(frame);
      player = new window.YT.Player(frame, { events: {
        onReady: event => { if (enabled && current === sequence) { event.target.mute(); event.target.playVideo(); } },
        onStateChange: event => { if (event.data === 1 && enabled && current === sequence) { clearTimeout(fallbackTimer); hero.classList.add('is-scene-playing'); status.textContent = '動態場景播放中，可再次按下按鈕停止。'; } },
        onError: () => { if (current === sequence) { stopScene(); status.textContent = '場景影片目前無法播放，已保留雨沐主視覺。'; } }
      } });
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && enabled) stopScene(); });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) sceneButton.hidden = true;
  }

  const topButton = document.createElement('button');
  topButton.className = 'back-top'; topButton.type = 'button'; topButton.setAttribute('aria-label', '回到頁首'); topButton.textContent = '↑';
  document.body.append(topButton);
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  const updateTopButton = () => topButton.classList.toggle('is-visible', window.scrollY > 600);
  window.addEventListener('scroll', updateTopButton, { passive: true }); updateTopButton();
})();
