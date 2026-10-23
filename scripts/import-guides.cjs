const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(root, '..');
const groups = {
  basics: ['version', 'features-newbie-guide', 'features-class-power', 'features-class-skills', 'job-transfer', 'rules', 'faq'],
  systems: ['features-dragon-whisper', 'items-dragon-eye', 'dolls-guide', 'features-pet', 'features-daily-quest', 'features-level-rewards', 'features-transform-fusion', 'transform-guide', 'features-equipment-collection', 'features-hecate', 'features-zodiac', 'features-mage-summon'],
  equipment: ['weapons-enhance', 'armor-accessory-enhance', 'armor-enhance-protect', 'armor-roomtis-earring', 'armor-snappers-ring', 'armor-shoulder-guard', 'armor-einhasad-belt', 'armor-anti-magic', 'armor-special-shield', 'armor-stat-shirt', 'armor-stat-pants', 'armor-stat-boots', 'armor-level-badge', 'equipment-dragon-seal', 'equipment-arrogance-gem', 'equipment-hero-badge', 'equipment-fishing-talisman', 'items-candle'],
  maps: ['map-training', 'map-elemental-prison', 'map-dream-island', 'features-domination-tower', 'features-infinite-battle']
};
const allowed = new Set(Object.values(groups).flat());
const mediaRoot = path.join(root, 'assets', 'game');
fs.mkdirSync(mediaRoot, { recursive: true });
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
const cleanText = value => value.replace(/<[^>]+>/g, ' ').replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').replace(/\s+/g, ' ').trim();

function extractContent(document) {
  const match = /<div\b[^>]*\bid=["']page-content["'][^>]*>/i.exec(document);
  if (!match) throw new Error('Missing page-content');
  const start = match.index + match[0].length;
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 1;
  let tag;
  while ((tag = tags.exec(document))) {
    depth += /^<\/div/i.test(tag[0]) ? -1 : 1;
    if (depth === 0) return document.slice(start, tag.index);
  }
  throw new Error('Unbalanced content div');
}

const importedAssets = new Map();
const guides = [];
for (const [category, ids] of Object.entries(groups)) {
  for (const id of ids) {
    const sourceFile = path.join(sourceRoot, 'pages', `${id}.html`);
    const source = fs.readFileSync(sourceFile, 'utf8');
    const title = cleanText((/<title>([\s\S]*?)<\/title>/i.exec(source) || [])[1] || id).replace(/\s*[-–—]\s*曜舞天堂.*$/, '');
    let html = extractContent(source);
    const heading = /<div\b[^>]*class=["'][^"']*page-hdr[^"']*["'][^>]*>[\s\S]*?<\/div>/i.exec(html);
    const description = heading ? cleanText((/<p[^>]*>([\s\S]*?)<\/p>/i.exec(heading[0]) || [])[1] || '') : '';
    if (heading) html = html.replace(heading[0], '');
    html = html.replace(/<(script|style|iframe|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<!--([\s\S]*?)-->/g, '')
      .replace(/\s(?:style|on\w+|width|height|hidden|data-[\w-]+)=(?:"[^"]*"|'[^']*')/gi, '')
      .replace(/<button\b[^>]*>([\s\S]*?)<\/button>/gi, '<span>$1</span>')
      .replace(/曜舞天堂|曜舞/g, '雨沐天堂')
      .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '');
    html = html.replace(/\bhref=["']([^"']+)["']/gi, (_, target) => {
      if (target.startsWith('#')) return `href="${target}"`;
      const stem = path.basename(target.split('#')[0], '.html');
      if (allowed.has(stem)) return `href="guide.html?id=${stem}"`;
      return 'aria-disabled="true"';
    });
    html = html.replace(/\bsrc=["']([^"']+)["']/gi, (_, location) => {
      if (/^(https?:|data:)/i.test(location)) return 'data-unavailable-image="true"';
      const original = path.resolve(path.dirname(sourceFile), location);
      if (!original.startsWith(sourceRoot + path.sep) || !fs.existsSync(original)) return 'data-unavailable-image="true"';
      const suffix = path.extname(original);
      const fileName = `${crypto.createHash('sha256').update(location).digest('hex').slice(0, 10)}${suffix}`;
      const target = path.join(mediaRoot, fileName);
      if (!importedAssets.has(original)) {
        fs.copyFileSync(original, target);
        importedAssets.set(original, target);
      }
      return `src="../assets/game/${fileName}" loading="lazy"`;
    });
    html = html.replace(/<img\b[^>]*data-unavailable-image[^>]*>/gi, '');
    if (cleanText(html).length < 40) throw new Error(`Empty content: ${id}`);
    guides.push({ id, title, description, category, html, text: cleanText(html) });
  }
}
fs.writeFileSync(path.join(root, 'data', 'guides.js'), `window.YUMU_GUIDES = ${JSON.stringify(guides, null, 2)};\n`);
fs.writeFileSync(path.join(root, 'design', 'content-sources.json'), JSON.stringify({
  note: '內容參考工作區既有曜舞遊戲指南，整理為雨沐版本草案。未匯入活動公告、下載連結、更新歷程、社群連結、贊助入口與攻城日期。',
  guides: guides.map(({ id, title, category }) => ({ id, title, category, source: `pages/${id}.html` })),
  assets: [...importedAssets.keys()].map(file => path.relative(sourceRoot, file))
}, null, 2));
console.log(`Imported ${guides.length} guides and ${importedAssets.size} local images into 雨沐天堂.`);
