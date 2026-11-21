const article = document.querySelector('.guide-article');
const toc = document.querySelector('.toc');
const topics = document.querySelector('.topics');

function responsiveDisclosure(details, query) {
  const breakpoint = matchMedia(query);
  const setOpen = () => { details.open = !breakpoint.matches; };
  setOpen();
  breakpoint.addEventListener('change', setOpen);
  return breakpoint;
}

responsiveDisclosure(topics, '(max-width: 48rem)');
const compactToc = responsiveDisclosure(toc, '(max-width: 64rem)');
const sections = [...article.querySelectorAll('.article-body :is(h2, h3)')];
const outline = [...toc.querySelectorAll('li a')];
let activeIndex = -1;
let pendingScroll = false;

function updateOutline() {
  pendingScroll = false;
  const offset = document.querySelector('.site-header').offsetHeight + 28;
  let index = sections.findLastIndex(heading => heading.getBoundingClientRect().top <= offset);
  const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
  if (window.scrollY > 0 && remaining < 2) index = sections.length - 1;
  if (index === activeIndex) return;
  outline[activeIndex]?.removeAttribute('aria-current');
  outline[index]?.setAttribute('aria-current', 'location');
  activeIndex = index;
}

function scheduleOutline() {
  if (pendingScroll) return;
  pendingScroll = true;
  requestAnimationFrame(updateOutline);
}

window.addEventListener('scroll', scheduleOutline, { passive: true });
window.addEventListener('resize', scheduleOutline);
window.addEventListener('hashchange', scheduleOutline);
scheduleOutline();

toc.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !compactToc.matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  toc.open = false;
  const target = document.getElementById(link.hash.slice(1));
  if (target) {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
});

const source = JSON.parse(document.querySelector('#page-source').textContent);
const tools = document.querySelector('.page-tools');
const raw = tools.querySelector('[data-page-markdown]');
const copyPage = tools.querySelector('[data-page-copy]');
const copyStatus = document.querySelector('#copy-status');
raw.href = URL.createObjectURL(new Blob([source], { type: 'text/markdown;charset=utf-8' }));
copyPage.hidden = !navigator.clipboard?.writeText;
tools.hidden = false;

let resetCopyLabel;
copyPage.addEventListener('click', async () => {
  const label = copyPage.querySelector('span');
  clearTimeout(resetCopyLabel);
  try {
    await navigator.clipboard.writeText(source);
    label.textContent = 'Copied';
    copyStatus.textContent = 'Page copied as Markdown.';
  } catch {
    label.textContent = 'Copy failed';
    copyStatus.textContent = 'Could not copy. Use Download Markdown to get a copy of the page.';
  }
  resetCopyLabel = setTimeout(() => { label.textContent = 'Copy page'; }, 2000);
});

const trigger = document.querySelector('[data-search-trigger]');
const dialog = document.querySelector('#docs-search');
const input = dialog.querySelector('input');
const results = dialog.querySelector('.search-results');
const searchStatus = dialog.querySelector('.search-status');
const indexUrl = new URL(dialog.dataset.index, document.baseURI);
const docsUrl = new URL('.', indexUrl);

let searchIndex;
let loadingIndex;
let searchError = false;

function renderResults() {
  results.replaceChildren();
  const query = input.value.trim().toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  if (!searchIndex) {
    searchStatus.textContent = searchError ? 'Search is unavailable. Close search and try again.' : 'Loading the search index…';
    return;
  }
  if (!words.length) {
    searchStatus.textContent = 'Enter a topic, heading, or command.';
    return;
  }

  const matches = searchIndex.flatMap(entry => {
    if (!words.every(word => entry.searchText.includes(word))) return [];
    const score = (entry.titleLower.includes(query) ? 12 : 0)
      + (entry.searchText.includes(query) ? 5 : 0)
      + words.filter(word => entry.titleLower.includes(word)).length * 3;
    return [{ entry, score }];
  }).sort((a, b) => b.score - a.score).slice(0, 12);

  for (const { entry } of matches) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const title = document.createElement('strong');
    link.href = new URL(entry.href, docsUrl).href;
    title.textContent = entry.title;
    link.append(title);
    if (entry.title !== entry.page) {
      const page = document.createElement('span');
      page.textContent = entry.page;
      link.append(page);
    }
    item.append(link);
    results.append(item);
  }
  searchStatus.textContent = matches.length === 0 ? 'No matches found.' : `${matches.length} ${matches.length === 1 ? 'result' : 'results'}.`;
}

function openSearch() {
  if (!dialog.open) dialog.showModal();
  input.focus();
  if (!searchIndex && !loadingIndex) {
    searchError = false;
    loadingIndex = fetch(indexUrl)
      .then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      })
      .then(entries => {
        searchIndex = entries.map(entry => ({
          ...entry,
          titleLower: entry.title.toLowerCase(),
          searchText: `${entry.title} ${entry.page} ${entry.text}`.toLowerCase(),
        }));
      })
      .catch(() => { searchError = true; })
      .finally(() => {
        loadingIndex = undefined;
        renderResults();
      });
  }
  renderResults();
}

if (typeof dialog.showModal === 'function') {
  trigger.hidden = false;
  trigger.addEventListener('click', openSearch);
  trigger.querySelector('kbd').textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k' && !event.isComposing) {
      event.preventDefault();
      if (!dialog.open) trigger.focus();
      openSearch();
    }
  });
  input.addEventListener('input', renderResults);
  results.addEventListener('click', event => {
    if (event.target.closest('a')) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape' && document.activeElement === input) {
      event.preventDefault();
      dialog.close();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
    const links = [...results.querySelectorAll('a')];
    if (!links.length) return;
    const selected = links.indexOf(document.activeElement);
    if (event.key === 'Enter') {
      if (document.activeElement === input) {
        event.preventDefault();
        links[0].click();
      }
      return;
    }
    if (selected < 0 && document.activeElement !== input) return;
    event.preventDefault();
    const next = event.key === 'ArrowDown' ? Math.min(selected + 1, links.length - 1) : selected - 1;
    (links[next] ?? input).focus();
  });
}
