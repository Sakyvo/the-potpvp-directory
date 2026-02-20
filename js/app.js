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

  // ── Markdown renderer (preserves all blank lines) ──
  const IMG_URL_RE = /(https?:\/\/[^\s<>)\]"']+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:![a-zA-Z]+)?(?:\?[^\s<>)\]"']*)?)/gi;

  function renderMd(md) {
    md = md.replace(/\r\n/g, '\n');
    md = md.split('\n').map(l => l.trimEnd()).join('\n');

    // Auto-convert bare image URLs, escape lone "-"
    let inCode = false;
    md = md.split('\n').map(line => {
      if (/^```/.test(line)) inCode = !inCode;
      if (inCode) return line;
      if (/^\s*-\s*$/.test(line)) return '<span>-</span>';
      if (/^\s{4}/.test(line) || /!\[.*?\]\(/.test(line)) return line;
      return line.replace(IMG_URL_RE, '![image]($1)');
    }).join('\n');

    // Protect fenced code blocks from blank-line splitting
    const codeBlocks = [];
    md = md.replace(/```[\s\S]*?```/g, m => {
      codeBlocks.push(m);
      return `%%CB${codeBlocks.length - 1}%%`;
    });

    // Escape < outside code blocks and known HTML tags
    const protectedHtml = [];
    md = md.replace(/`[^`]+`/g, m => { protectedHtml.push(m); return `%%PH${protectedHtml.length - 1}%%`; });
    md = md.replace(/<(\/?)(span|u|sup|sub|br|hr|a|img|b|i|em|strong|s|del|mark)(\s[^>]*)?\/?>/gi, m => { protectedHtml.push(m); return `%%PH${protectedHtml.length - 1}%%`; });
    md = md.replace(/</g, '&lt;');
    md = md.replace(/%%PH(\d+)%%/g, (_, k) => protectedHtml[+k]);

    // Split by blank lines, keeping separators to count them
    const parts = md.split(/(\n{2,})/);
    let html = '';
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        const n = parts[i].length - 1;
        for (let j = 0; j < n; j++) html += '<div class="bl"></div>';
      } else {
        let block = parts[i].trim();
        if (!block) continue;
        block = block.replace(/%%CB(\d+)%%/g, (_, k) => codeBlocks[+k]);
        html += marked.parse(block);
      }
    }
    return html;
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
      if (!res.ok) return '';
      return await res.text();
    } catch { return ''; }
  }

  // ── Slugify for IDs ──
  function slugify(text) {
    return text.replace(/[^\w\u4e00-\u9fff\s-]/g, '').replace(/\s+/g, '-').substring(0, 40) || 'floor';
  }

  // ── Split markdown by h2 headings ──
  function splitByH2(md) {
    const lines = md.split('\n');
    const floors = [];
    let current = { title: '', lines: [] };

    for (const line of lines) {
      const m = line.match(/^## (.+)/);
      if (m) {
        if (current.title || current.lines.some(l => l.trim())) {
          floors.push({ title: current.title, md: current.lines.join('\n') });
        }
        current = { title: m[1].trim(), lines: [] };
      } else {
        current.lines.push(line);
      }
    }
    if (current.title || current.lines.some(l => l.trim())) {
      floors.push({ title: current.title, md: current.lines.join('\n') });
    }

    return floors;
  }

  // ── Load all content files ──
  async function loadAllMd() {
    // Single file mode
    if (indexData.file) {
      return await fetchMd(indexData.file);
    }
    // Multi-file mode (legacy)
    const files = [];
    for (const sec of indexData.sections) {
      if (sec.children) {
        for (const ch of sec.children) files.push(ch.file);
      } else if (sec.file) {
        files.push(sec.file);
      }
    }
    const contents = await Promise.all(files.map(f => fetchMd(f)));
    return contents.join('\n\n');
  }

  // ── Build content ──
  async function buildContent() {
    const allMd = await loadAllMd();

    // Check if content has h2 headings for auto-splitting
    const hasH2 = /^## .+/m.test(allMd);

    if (hasH2) {
      buildH2Floors(allMd);
    } else {
      buildLegacyFloors(allMd);
    }

    initInteraction();
  }

  // ── H2-based floor building ──
  function buildH2Floors(allMd) {
    const floors = splitByH2(allMd);
    let html = '';

    floors.forEach((floor, i) => {
      const id = floor.title ? slugify(floor.title) : `floor-${i}`;
      const floorNum = `#${i}F`;
      const title = floor.title || '序';

      html += `
        <div class="floor" id="floor-${id}" data-section-id="${id}">
          <div class="floor-header">${floorNum} &nbsp; ${title}</div>
          <div class="floor-body">${renderMd(floor.md)}</div>
        </div>`;
    });

    contentEl.innerHTML = html;
    buildToc();
  }

  // ── Build hierarchical TOC from h2-h5 ──
  function buildToc() {
    let tocHtml = '';
    document.querySelectorAll('.floor').forEach((floorEl, i) => {
      const id = floorEl.dataset.sectionId || `floor-${i}`;
      const floorNum = `#${i}F`;
      const headerEl = floorEl.querySelector('.floor-header');
      let title = headerEl ? headerEl.textContent.trim() : '';
      title = title.replace(/^#\d+F[\s\u00a0]*/, '').trim() || '序';

      tocHtml += `<li><a class="toc-item toc-h2" data-target="floor-${id}">${floorNum} ${title}</a></li>`;

      floorEl.querySelectorAll('.floor-body h3, .floor-body h4, .floor-body h5').forEach((h, j) => {
        const level = h.tagName.toLowerCase();
        const hId = `${id}-h${j}`;
        h.id = hId;
        tocHtml += `<li><a class="toc-item toc-${level}" data-target="${hId}">${h.textContent}</a></li>`;
      });
    });
    tocEl.innerHTML = tocHtml;
  }

  // ── Legacy floor building (no h2 splitting, uses _index.json structure) ──
  function buildLegacyFloors(allMd) {
    // Fall back to _index.json based structure
    if (indexData.file) {
      // Single file, no h2 → one big floor
      contentEl.innerHTML = `
        <div class="floor" id="floor-main" data-section-id="main">
          <div class="floor-header">#0F &nbsp; ${indexData.title || '内容'}</div>
          <div class="floor-body">${renderMd(allMd)}</div>
        </div>`;
      buildToc();
      return;
    }

    // Multi-file legacy mode - build from _index.json sections
    const fetchTasks = [];
    for (const sec of indexData.sections) {
      if (sec.children) {
        const childTasks = sec.children.map(ch => fetchMd(ch.file).then(md => ({ ...ch, md })));
        fetchTasks.push(Promise.all(childTasks).then(children => ({ ...sec, childrenData: children })));
      } else {
        fetchTasks.push(fetchMd(sec.file).then(md => ({ ...sec, md })));
      }
    }

    Promise.all(fetchTasks).then(sections => {
      let html = '';

      for (const sec of sections) {
        if (sec.childrenData) {
          let bodyHtml = '';
          for (const ch of sec.childrenData) {
            bodyHtml += renderMd(ch.md);
          }
          const id = sec.id;
          html += `
            <div class="floor" id="floor-${id}" data-section-id="${id}">
              <div class="floor-header">#${sec.floor} &nbsp; ${sec.title}</div>
              <div class="floor-body">${bodyHtml}</div>
            </div>`;
        } else {
          const id = sec.id;
          html += `
            <div class="floor" id="floor-${id}" data-section-id="${id}">
              <div class="floor-header">#${sec.floor} &nbsp; ${sec.title}</div>
              <div class="floor-body">${renderMd(sec.md)}</div>
            </div>`;
        }
      }

      contentEl.innerHTML = html;
      buildToc();
    });
  }

  // ── Interaction setup ──
  function initInteraction() {
    // External links → new tab
    contentEl.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

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
        const active = tocEl.querySelector(`[data-target="floor-${topId}"]`);
        if (active) active.classList.add('active');
      }
    }, { rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')} 0px -60% 0px`, threshold: [0, 0.25, 0.5] });

    document.querySelectorAll('[data-section-id]').forEach(el => observer.observe(el));

    // Initial hash scroll
    if (location.hash) {
      const target = document.getElementById('floor-' + location.hash.slice(1));
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
