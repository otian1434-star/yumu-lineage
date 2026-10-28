const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function openPage(file, query = '', now) {
  const { window } = parseHTML(read(file));
  const location = new URL(`http://localhost/${file}${query}`);
  window.location = location;
  window.matchMedia = () => ({ matches: false });
  window.scrollTo = () => {};
  window.scrollY = 0;
  const sandbox = {
    window, document: window.document, location,
    history: { replaceState: () => {} },
    URL, URLSearchParams, console, setTimeout: () => 1, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {}
  };
  if (now !== undefined) sandbox.Date = class extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  };
  vm.createContext(sandbox);
  for (const file of ['config.js', 'data/guides.js', 'assets/js/site.js']) vm.runInContext(read(file), sandbox, { filename: file });
  return { window, document: window.document, config: window.YUMU_CONFIG, guides: window.YUMU_GUIDES };
}

let assetChecks = 0;
let linkChecks = 0;
function validateDocument(document, file) {
  for (const element of document.querySelectorAll('[src],link[href],a[href]')) {
    const target = element.getAttribute('src') || element.getAttribute('href');
    if (!target || /^(https?:|data:|mailto:|tel:)/.test(target)) continue;
    if (target.startsWith('#')) {
      assert.ok(document.getElementById(decodeURIComponent(target.slice(1))), `Missing anchor ${target} in ${file}`);
      continue;
    }
    const url = new URL(target, `http://localhost/${file}`);
    const disk = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    assert.ok(disk.startsWith(root + path.sep), `Cross-project path: ${target}`);
    assert.ok(fs.existsSync(disk), `Missing file: ${target} in ${file}`);
    if (element.tagName === 'A') linkChecks++; else assetChecks++;
    if (url.pathname.endsWith('/guide.html')) {
      assert.ok(home.guides.some(guide => guide.id === url.searchParams.get('id')), `Missing guide ${target}`);
    }
  }
}

const home = openPage('index.html', '', Date.parse('2026-11-10T16:25:50+08:00'));
assert.equal(home.guides.length, 43);
assert.equal(home.config.announcements.length, 0);
assert.equal(home.config.downloads.length, 0);
assert.equal(home.config.updates.length, 0);
assert.equal(home.config.lineOfficial, 'https://lin.ee/6MBtAS7');
assert.equal(home.config.sponsorUrl, '');
assert.equal(home.config.openingDate, '2026-11-12T20:00:00+08:00');
assert.equal(home.document.getElementById('opening-date').textContent, '2026/11/12（四）20:00');
assert.deepEqual(['days', 'hours', 'minutes', 'seconds'].map(unit => home.document.getElementById(`opening-${unit}`).textContent), ['02', '03', '34', '10']);
for (const now of ['2026-11-12T20:00:00+08:00', '2026-11-13T20:00:00+08:00']) {
  const reached = openPage('index.html', '', Date.parse(now));
  assert.equal(reached.document.getElementById('opening-state').textContent, '開服時間已到');
  assert.deepEqual(['days', 'hours', 'minutes', 'seconds'].map(unit => reached.document.getElementById(`opening-${unit}`).textContent), ['00', '00', '00', '00']);
}
const oneSecond = openPage('index.html', '', Date.parse('2026-11-12T19:59:59+08:00'));
assert.equal(oneSecond.document.getElementById('opening-seconds').textContent, '01');
assert.equal(oneSecond.document.getElementById('opening-state').textContent, '距離正式開服');
const footerBanner = home.document.querySelector('.footer-partners a');
assert.equal(footerBanner.getAttribute('href'), 'https://www.gamex123.com/lineage.html');
assert.equal(footerBanner.getAttribute('target'), '_blank');
assert.ok(footerBanner.querySelector('img').getAttribute('src').endsWith('private-server-123.gif'));
assert.ok(fs.readFileSync(path.join(root, 'assets/reference/private-server-123.gif')).subarray(0, 6).toString().startsWith('GIF8'));
const versionContent = home.guides.find(guide => guide.id === 'version').text.replace(/\s+/g, '');
for (const setting of ['遊戲版本：3.81內掛版', '經驗倍率：15倍（內掛倍率：1倍）', '金幣倍率：6倍', '掉落倍率：5倍', '武防強化：2倍', '正義倍率：3倍', '負重倍率：4倍', '寵物經驗：3倍', '玩家等級上限：70級', '寵物等級上限：52級', '手點能力上限：25點', '萬能藥限制：10瓶', '素質總上限：35點']) assert.ok(versionContent.includes(setting), `Missing official setting: ${setting}`);
const newbieContent = home.guides.find(guide => guide.id === 'features-newbie-guide');
assert.ok(!newbieContent.html.includes('魔族拋棄地（開服暫未開放）'));
assert.ok(newbieContent.html.includes('<h3>魔族拋棄地</h3>'));
assert.ok(newbieContent.text.includes('原生魔族拋棄地') && newbieContent.text.includes('不死魔族拋棄地'));
validateDocument(home.document, 'index.html');

const menuButton = home.document.querySelector('.menu-toggle');
menuButton.click(); assert.equal(menuButton.getAttribute('aria-expanded'), 'true');
menuButton.click(); assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
for (const button of home.document.querySelectorAll('[data-class]')) {
  button.click();
  assert.equal(button.getAttribute('aria-selected'), 'true');
  assert.equal(home.document.getElementById('class-panel').getAttribute('aria-labelledby'), button.id);
  assert.ok(home.document.getElementById('class-image').getAttribute('src').includes(button.dataset.class));
}
validateDocument(home.document, 'index.html');
const searchDialog = home.document.querySelector('dialog');
searchDialog.showModal = () => { searchDialog.open = true; };
home.document.querySelector('.search-open').click();
assert.equal(searchDialog.open, true);
const globalSearch = home.document.getElementById('global-search');
globalSearch.value = '魔眼'; globalSearch.dispatchEvent(new home.window.Event('input'));
assert.ok(home.document.querySelectorAll('.search-result').length > 0);
globalSearch.value = 'zzzz-no-guide'; globalSearch.dispatchEvent(new home.window.Event('input'));
assert.ok(home.document.getElementById('search-count').textContent.includes('沒有找到'));

const library = openPage('pages/library.html', '?category=equipment');
assert.equal(library.document.querySelectorAll('.guide-card').length, 18);
library.document.querySelector('[data-category="maps"]').click();
assert.equal(library.document.querySelectorAll('.guide-card').length, 5);
const libraryInput = library.document.getElementById('library-query');
libraryInput.value = 'zzzz-no-guide'; libraryInput.dispatchEvent(new library.window.Event('input'));
assert.equal(library.document.querySelectorAll('.guide-card').length, 0);
library.document.getElementById('clear-filters').click();
assert.equal(library.document.querySelectorAll('.guide-card').length, 43);
validateDocument(library.document, 'pages/library.html');

let tableChecks = 0;
for (const guide of home.guides) {
  assert.ok(!/曜舞|cloud-shield|lin\.ee|09\/20|七夕|父親節|中秋/.test(guide.html), `Old site content in ${guide.id}`);
  assert.ok(!/<script|<iframe|onerror=|onclick=|style=/.test(guide.html), `Unsanitized guide: ${guide.id}`);
  const article = openPage('pages/guide.html', `?id=${guide.id}`);
  assert.equal(article.document.getElementById('article-title').textContent, guide.title);
  if (guide.notice) assert.equal(article.document.querySelector('.draft-note p').textContent, guide.notice);
  assert.equal(article.document.querySelector('.footer-partners a').getAttribute('href'), 'https://www.gamex123.com/lineage.html');
  assert.ok(article.document.getElementById('article-body').textContent.trim().length > 40);
  for (const table of article.document.querySelectorAll('table')) {
    assert.ok(table.parentElement.classList.contains('table-scroll'), `Uncontained table: ${guide.id}`);
    assert.equal(table.parentElement.getAttribute('tabindex'), '0');
    tableChecks++;
  }
  validateDocument(article.document, 'pages/guide.html');
}
const missing = openPage('pages/guide.html', '?id=missing');
assert.ok(missing.document.getElementById('article-title').textContent.includes('還沒收錄'));
for (const id of ['events', 'download', 'updates']) {
  const empty = openPage(`pages/${id}.html`);
  assert.ok(empty.document.querySelector('.empty-state'));
  assert.equal(empty.document.querySelectorAll('.article-body').length, 0);
  validateDocument(empty.document, `pages/${id}.html`);
}
console.log(`PASS: 43 guide routes, ${tableChecks} scrollable tables, ${linkChecks} local links, ${assetChecks} asset references.`);
console.log('PASS: search, category filters, empty results, menu, 7 class tabs, unknown guide route, and intentionally empty announcements/downloads/updates.');
console.log('PASS: official server rates and limits, open training area, Taiwan opening countdown boundaries, and linked GIF banner on all guide pages.');
console.log('Visual layout and remote video playback still require browser verification.');
