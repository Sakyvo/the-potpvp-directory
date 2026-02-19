(async function() {
  'use strict';

  // ── marked config ──
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    },
    breaks: true
  });

  // ── Markdown preprocessor ──
  const IMG_URL_RE = /(https?:\/\/[^\s<>)\]"']+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:![a-zA-Z]+)?(?:\?[^\s<>)\]"']*)?)/gi;

  function preprocessMd(md) {
    md = md.replace(/\r\n/g, '\n');
    // Preserve extra blank lines as &nbsp; paragraphs
    md = md.replace(/\n{3,}/g, m => '\n\n' + '&nbsp;\n\n'.repeat(m.length - 2));
    // Auto-convert bare image URLs to rendered images
    let inCode = false;
    md = md.split('\n').map(line => {
      if (/^```/.test(line)) inCode = !inCode;
      if (inCode || /^\s{4}/.test(line) || /!\[.*?\]\(/.test(line)) return line;
      return line.replace(IMG_URL_RE, '![image]($1)');
    }).join('\n');
    return md;
  }

  // ── DOM refs ──
  const $ = s => document.querySelector(s);
  const contentEl = $('#content');
  const tocEl = $('#toc');
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');
  const searchPanel = $('#search-panel');
  const searchInput = $('#search-input');
  const searchCount = $('#search-count');

  // ── Load index ──
  let indexData;
  try {
    const res = await fetch('content/_index.json');
    indexData = await res.json();
  } catch(e) {
    contentEl.innerHTML = '<p style="padding:40px;color:red;">无法加载内容索引。</p>';
    return;
  }

  // ── Fetch markdown ──
  async function fetchMd(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return '*内容加载失败*';
      return await res.text();
    } catch { return '*内容加载失败*'; }
  }

  // ── Build floors ──
  const sectionIds = [];

  async function buildContent() {
    const fragments = [];
    const tocItems = [];
    const fetchTasks = [];

    for (const sec of indexData.sections) {
      if (sec.children) {
        // Part with children
        const childTasks = sec.children.map(ch => fetchMd(ch.file).then(md => ({ ...ch, md })));
        fetchTasks.push(Promise.all(childTasks).then(children => ({ ...sec, childrenData: children })));
      } else {
        fetchTasks.push(fetchMd(sec.file).then(md => ({ ...sec, md })));
      }
    }

    const sections = await Promise.all(fetchTasks);

    for (const sec of sections) {
      if (sec.childrenData) {
        // Part floor
        let childrenHtml = '';
        const tocChildren = [];
        for (const ch of sec.childrenData) {
          sectionIds.push(ch.id);
          childrenHtml += `
            <div class="section-card" id="section-${ch.id}" data-section-id="${ch.id}">
              <div class="section-title">${ch.title}</div>
              <div class="section-body">${marked.parse(preprocessMd(ch.md))}</div>
            </div>`;
          tocChildren.push(`<a class="toc-item" data-target="section-${ch.id}">${ch.title}</a>`);
        }
        fragments.push(`
          <div class="floor" id="floor-${sec.id}">
            <div class="floor-header">#${sec.floor} &nbsp; ${sec.title}</div>
            ${childrenHtml}
          </div>`);
        tocItems.push(`<li class="toc-part">${sec.floor} ${sec.title}</li>`);
        tocItems.push(...tocChildren.map(c => `<li>${c}</li>`));
      } else {
        // Single section floor
        sectionIds.push(sec.id);
        fragments.push(`
          <div class="floor" id="floor-${sec.id}">
            <div class="floor-header">#${sec.floor} &nbsp; ${sec.title}</div>
            <div class="section-card" id="section-${sec.id}" data-section-id="${sec.id}">
              <div class="section-title">${sec.title}</div>
              <div class="section-body">${marked.parse(preprocessMd(sec.md))}</div>
            </div>
          </div>`);
        tocItems.push(`<li><a class="toc-single" data-target="section-${sec.id}">${sec.floor} ${sec.title}</a></li>`);
      }
    }

    contentEl.innerHTML = fragments.join('');
    tocEl.innerHTML = tocItems.join('');
    initInteraction();
  }

  // ── Interaction setup ──
  function initInteraction() {
    // TOC click → scroll
    tocEl.addEventListener('click', e => {
      const item = e.target.closest('[data-target]');
      if (!item) return;
      const target = document.getElementById(item.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeSidebar();
      }
    });

    // IntersectionObserver for TOC highlight + URL hash
    const observer = new IntersectionObserver(entries => {
      let topId = null;
      let topRatio = 0;
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > topRatio) {
          topRatio = entry.intersectionRatio;
          topId = entry.target.dataset.sectionId;
        }
      }
      if (topId) {
        history.replaceState(null, '', '#' + topId);
        tocEl.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        const active = tocEl.querySelector(`[data-target="section-${topId}"]`);
        if (active) active.classList.add('active');
      }
    }, { rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')} 0px -60% 0px`, threshold: [0, 0.25, 0.5] });

    document.querySelectorAll('[data-section-id]').forEach(el => observer.observe(el));

    // Initial hash scroll
    if (location.hash) {
      const target = document.getElementById('section-' + location.hash.slice(1));
      if (target) setTimeout(() => target.scrollIntoView({ block: 'start' }), 100);
    }
  }

  // ── Sidebar ──
  function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('open'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); }
  $('#menu-btn').addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  overlay.addEventListener('click', closeSidebar);

  // ── Search ──
  let searchMarks = [];
  let currentMarkIdx = -1;

  function openSearch() {
    searchPanel.classList.add('open');
    searchInput.focus();
  }
  function closeSearch() {
    searchPanel.classList.remove('open');
    clearSearch();
  }
  function clearSearch() {
    searchMarks.forEach(m => {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
    searchMarks = [];
    currentMarkIdx = -1;
    searchCount.textContent = '';
  }

  function doSearch(query) {
    clearSearch();
    if (!query.trim()) return;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const node of textNodes) {
      const text = node.textContent;
      if (!regex.test(text)) continue;
      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(text))) {
        if (match.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        const mark = document.createElement('mark');
        mark.className = 'search-hl';
        mark.textContent = match[0];
        frag.appendChild(mark);
        searchMarks.push(mark);
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      node.parentNode.replaceChild(frag, node);
    }

    searchCount.textContent = searchMarks.length ? `${searchMarks.length} 个结果` : '无结果';
    if (searchMarks.length) navigateMark(0);
  }

  function navigateMark(idx) {
    if (!searchMarks.length) return;
    if (currentMarkIdx >= 0 && searchMarks[currentMarkIdx]) searchMarks[currentMarkIdx].classList.remove('current');
    currentMarkIdx = ((idx % searchMarks.length) + searchMarks.length) % searchMarks.length;
    const m = searchMarks[currentMarkIdx];
    m.classList.add('current');
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchCount.textContent = `${currentMarkIdx + 1} / ${searchMarks.length}`;
  }

  $('#search-btn').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', closeSearch);
  $('#search-prev').addEventListener('click', () => navigateMark(currentMarkIdx - 1));
  $('#search-next').addEventListener('click', () => navigateMark(currentMarkIdx + 1));

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(searchInput.value), 300);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); openSearch(); }
  });

  // ── Init ──
  await buildContent();
})();
