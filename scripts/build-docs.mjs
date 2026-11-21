import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, Renderer } from 'marked';

const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
const homepage = 'https://adembilge.github.io/claude-themes/';
const repository = 'https://github.com/adembilge/claude-themes';
const groups = {
  'Getting started': ['index', 'installation'],
  Guides: ['themes', 'theme-maker', 'import-export', 'terminal'],
  Reference: ['commands', 'troubleshooting'],
};
const aliases = {
  installation: { 'install-the-plugin': 'install' },
  themes: { 'open-the-gallery': 'browse', 'find-and-save-palettes': 'favorites', 'switch-from-the-prompt': 'switch' },
  'theme-maker': { 'build-a-theme': 'build', 'tune-appearance': 'appearance', 'set-day-night-and-folder-themes': 'day-night' },
  'import-export': { 'import-a-palette': 'import', 'export-a-palette': 'export', 'share-a-theme': 'share' },
  terminal: { 'match-the-terminal': 'enable', 'refresh-after-switching': 'refresh' },
  commands: { 'browse-and-apply': 'themes', 'import-and-export': 'sharing', 'follow-system-and-reset': 'appearance' },
};

const md = new Marked();
const sitePath = id => id === 'index' ? 'guide/' : `guide/${id}/`;
const slug = text => text.trim().toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');
const escapeHtml = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function plain(token) {
  const parts = [];
  md.walkTokens([token], child => {
    if (['text', 'codespan', 'code'].includes(child.type) && !child.tokens?.length) parts.push(child.text);
  });
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const pages = await Promise.all(Object.entries(groups).flatMap(([group, ids]) => ids.map(async id => {
  const source = await readFile(`${root}docs/handbook/${id}.md`, 'utf8');
  const tokens = md.lexer(source);
  const [title, lead, ...body] = tokens.filter(token => token.type !== 'space');
  if (title?.type !== 'heading' || title.depth !== 1 || lead?.type !== 'paragraph') {
    throw new Error(`${id}.md needs one title followed by an introductory paragraph.`);
  }
  const headings = new Map();
  const entries = [{ id: '', title: title.text, text: plain(lead) }];
  for (const token of body) {
    if (token.type === 'heading') {
      const anchor = slug(token.text);
      if (![2, 3].includes(token.depth) || !anchor || headings.has(anchor)) {
        throw new Error(`Invalid or duplicate heading in ${id}.md: ${token.text}`);
      }
      headings.set(anchor, token);
      entries.push({ id: anchor, title: token.text, text: '' });
    } else {
      entries.at(-1).text += ` ${plain(token)}`;
    }
  }
  return { id, group, title: title.text, lead, body, headings, entries, source };
})));
const byId = new Map(pages.map(page => [page.id, page]));

function docHref(page, target, fragment = '') {
  const path = posix.relative(sitePath(page.id), sitePath(target.id));
  return (path ? `${path}/` : './') + fragment;
}

function makeRenderer(page) {
  const renderer = new Renderer();
  const relativeRoot = page.id === 'index' ? '../' : '../../';
  renderer.heading = ({ depth, text, tokens }) => {
    const id = slug(text);
    const alias = aliases[page.id]?.[id];
    return `${alias ? `<span id="${alias}" class="old-anchor" aria-hidden="true"></span>` : ''}<h${depth} id="${id}">${renderer.parser.parseInline(tokens)} <a class="heading-link" href="#${id}" aria-label="Link to ${escapeHtml(text)}">#</a></h${depth}>\n`;
  };
  renderer.link = token => {
    const [name, anchor] = token.href.split('#');
    const target = name.endsWith('.md') && byId.get(name.slice(0, -3));
    if (target || name === '') {
      const destination = target || page;
      if (anchor && !destination.headings.has(anchor)) throw new Error(`${page.id}.md links to an unknown heading: ${token.href}`);
      const fragment = anchor ? `#${anchor}` : '';
      const href = destination === page && fragment ? fragment : docHref(page, destination, fragment);
      return Renderer.prototype.link.call(renderer, { ...token, href });
    }
    if (name.startsWith('../media/')) {
      return Renderer.prototype.link.call(renderer, { ...token, href: relativeRoot + token.href.slice(3) });
    }
    if (!/^https:\/\//.test(token.href)) throw new Error(`${page.id}.md has an unrecognized link: ${token.href}`);
    return Renderer.prototype.link.call(renderer, token);
  };
  renderer.image = token => {
    if (!token.href.startsWith('../media/')) throw new Error(`${page.id}.md has an unrecognized image: ${token.href}`);
    return `<img class="guide-image" src="${escapeHtml(relativeRoot + token.href.slice(3))}" alt="${escapeHtml(token.text)}" loading="lazy" decoding="async">`;
  };
  renderer.html = ({ text }) => escapeHtml(text);
  renderer.code = token => `<div class="command guide-command">${Renderer.prototype.code.call(renderer, token)}<button class="copy" type="button" hidden>Copy</button></div>\n`;
  return renderer;
}

const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m16 16 4 4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.6-3.2 1.9 1.9 0 0 1 1.6-3H18a3 3 0 0 0 3-3c0-4.9-4-8.8-9-8.8Z"/><path d="M7.5 11h.01m3-3.5h.01m4 0h.01m3 3.5h.01" stroke-width="2.6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

function render(page, index) {
  const directory = sitePath(page.id);
  const asset = page.id === 'index' ? '../' : '../../';
  const intro = docHref(page, pages[0]);
  const canonical = homepage + directory;
  const description = escapeHtml(plain(page.lead));
  const renderer = makeRenderer(page);
  const article = md.parser(page.body, { renderer });
  const lead = md.parser([page.lead], { renderer });
  const sidebar = Object.entries(groups).map(([group, ids]) => `        <p class="rail-group">${group}</p>\n        <ul>${ids.map(id => `<li><a href="${docHref(page, byId.get(id))}"${id === page.id ? ' aria-current="page"' : ''}>${escapeHtml(byId.get(id).title)}</a></li>`).join('')}</ul>`).join('\n');
  const outline = [...page.headings].map(([id, token]) => `<li${token.depth === 3 ? ' class="toc-nested"' : ''}><a href="#${id}">${escapeHtml(token.text)}</a></li>`).join('');
  const adjacent = (target, direction) => target ? `<a class="page-link page-link-${direction.toLowerCase()}" href="${docHref(page, target)}"><span>${direction}</span><strong>${escapeHtml(target.title)}</strong>${icon('arrow')}</a>` : '';
  const pageLinks = [adjacent(pages[index - 1], 'Previous'), adjacent(pages[index + 1], 'Next')].filter(Boolean);
  const source = JSON.stringify(page.source).replace(/</g, '\\u003c');
  return `<!doctype html>
<!-- Generated from docs/handbook/${page.id}.md. Run npm run build:docs after editing. -->
<html lang="en" data-type="software">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="page-type" content="software">
  <meta name="site-kind" content="software">
  <meta name="description" content="${description}">
  <meta property="og:title" content="${escapeHtml(page.title)} · Claude-Themes Docs">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <link rel="canonical" href="${canonical}">
  <title>${escapeHtml(page.title)} · Claude-Themes Docs</title>
  <link rel="icon" href="${asset}media/logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${asset}site.css">
  <link rel="stylesheet" href="${intro}guide.css">
  <script src="${asset}site-palettes.js"></script>
  <script src="${asset}site.js"></script>
  <script src="${intro}guide.js" defer></script>
</head>
<body class="guide" id="top">
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="guide-topbar guide-wrap">
      <a class="wordmark" href="${asset}"><img class="mark" src="${asset}media/theme-mark.svg" alt="" width="24" height="24">Claude-Themes</a>
      <button class="guide-search guide-control" type="button" aria-haspopup="dialog" aria-controls="docs-search" data-search-trigger hidden>${icon('search')}<span>Search docs</span><kbd aria-hidden="true">Ctrl K</kbd></button>
      <div class="guide-header-actions">
        <a class="guide-control guide-github" href="${repository}">GitHub <span aria-hidden="true">↗</span></a>
        <button class="guide-control" id="themes-button" type="button" aria-label="Documentation theme" popovertarget="site-picker" aria-controls="site-picker" hidden>${icon('palette')}<span class="guide-themes-label">Themes</span></button>
        <div class="picker theme-picker" id="site-picker" popover hidden>
          <p class="picker-title">Documentation theme</p>
          <p class="picker-help" id="active-look"></p>
          <div class="picker-field"><label for="palette">Palette</label><select id="palette"></select></div>
          <div class="picker-field"><label for="mode">Mode</label><select id="mode"><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></div>
        </div>
      </div>
    </div>
  </header>
  <div class="guide-layout guide-wrap">
    <details class="doc-rail topics" open>
      <summary>Docs topics ${icon('chevron')}</summary>
      <nav aria-label="Documentation topics">
${sidebar}
      </nav>
    </details>
    <details class="doc-rail toc" open>
      <summary>On this page ${icon('chevron')}</summary>
      <nav aria-label="On this page">
        <p class="rail-group">On this page</p>
        <ul>${outline}</ul>
        <a class="guide-top-link" href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </nav>
    </details>
    <main class="guide-article" id="main" tabindex="-1">
      <header class="article-header" data-enter>
        <p class="breadcrumb"><a href="${intro}">Docs</a><span aria-hidden="true">/</span>${page.group}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <div class="guide-lede">${lead}</div>
        <div class="page-tools" hidden>
          <button class="guide-control" type="button" data-page-copy>${icon('copy')}<span>Copy page</span></button>
          <a class="guide-control" data-page-markdown download="${page.id}.md">Download Markdown</a>
        </div>
      </header>
      <div class="article-body">
${article.trimEnd()}
      </div>
      <nav class="page-nav" aria-label="Adjacent documentation">
${pageLinks.map(link => `        ${link}`).join('\n')}
      </nav>
    </main>
  </div>
  <dialog class="search-dialog" id="docs-search" aria-labelledby="search-title" data-index="${intro}search-index.json">
    <div class="search-header">
      <h2 id="search-title" class="visually-hidden">Search the documentation</h2>
      <label class="search-field">${icon('search')}<span class="visually-hidden">Search topics, headings, and commands</span><input type="search" placeholder="Search topics and commands" autofocus></label>
      <form method="dialog"><button class="guide-control search-close" aria-label="Close search">${icon('close')}</button></form>
    </div>
    <p class="search-status" role="status"></p>
    <ul class="search-results" aria-label="Search results"></ul>
  </dialog>
  <p id="copy-status" class="visually-hidden" role="status"></p>
  <script type="application/json" id="page-source">${source}</script>
</body>
</html>
`;
}

const output = pages.map((page, index) => [sitePath(page.id) + 'index.html', render(page, index)]);
const search = pages.flatMap(page => page.entries.map(({ id, title, text }) => ({
  href: sitePath(page.id).slice('guide/'.length) + (id ? `#${id}` : '') || './',
  page: page.title,
  title,
  text: text.trim(),
})));
output.push(['guide/search-index.json', JSON.stringify(search, null, 2) + '\n']);

for (const page of pages) {
  for (const match of page.source.matchAll(/\]\((\.\.\/media\/[^)#]+)\)/g)) {
    await access(`${root}docs/handbook/${match[1]}`);
  }
}

const stale = [];
for (const [path, contents] of output) {
  const file = `${root}docs/${path}`;
  if (check) {
    const existing = await readFile(file, 'utf8').catch(error => {
      if (error.code !== 'ENOENT') throw error;
      return '';
    });
    if (existing !== contents) stale.push(`docs/${path}`);
  } else {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, contents);
  }
}

if (stale.length) {
  console.error(`Run npm run build:docs to update:\n${stale.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`${check ? 'Verified' : 'Generated'} ${pages.length} guide pages and ${search.length} search entries.`);
}
