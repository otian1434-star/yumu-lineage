const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function openPage(file, query = '') {
  const { window } = parseHTML(read(file));
  const location = new URL(`http://localhost/${file}${query}`);
  window.location = location;
  window.matchMedia = () => ({ matches: false });
  window.scrollTo = () => {};
  window.scrollY = 0;
  const sandbox = {
    window, document: window.document, location,
    history: { replaceState: () => {} },
    URL, URLSearchParams, console, setTimeout: () => 1, clearTimeout: () => {}
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

const home = openPage('index.html');
assert.equal(home.guides.length, 42);
assert.equal(home.config.announcements.length, 0);
assert.equal(home.config.downloads.length, 0);
assert.equal(home.config.updates.length, 0);
assert.equal(home.config.lineOfficial, '');
assert.equal(home.config.sponsorUrl, '');
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
assert.equal(library.document.querySelectorAll('.guide-card').length, 42);
validateDocument(library.document, 'pages/library.html');

let tableChecks = 0;
for (const guide of home.guides) {
  assert.ok(!/曜舞|cloud-shield|lin\.ee|09\/20|七夕|父親節|中秋/.test(guide.html), `Old site content in ${guide.id}`);
  assert.ok(!/<script|<iframe|onerror=|onclick=|style=/.test(guide.html), `Unsanitized guide: ${guide.id}`);
  const article = openPage('pages/guide.html', `?id=${guide.id}`);
  assert.equal(article.document.getElementById('article-title').textContent, guide.title);
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
console.log(`PASS: 42 guide routes, ${tableChecks} scrollable tables, ${linkChecks} local links, ${assetChecks} asset references.`);
console.log('PASS: search, category filters, empty results, menu, 7 class tabs, unknown guide route, and intentionally empty announcements/downloads/updates.');
console.log('Visual layout and remote video playback still require browser verification.');
