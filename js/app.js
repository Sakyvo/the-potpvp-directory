(async function() {
  'use strict';

  function isWhiteColor(value) {
    return /^(?:white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(?:1|1\.0+)\s*\)|hsl\(\s*0\s*,\s*0%\s*,\s*100%\s*\))$/i.test((value || '').trim());
  }

  function normalizeStyleAttr(style) {
    if (!style) return '';
    const normalized = [];
    for (const part of style.split(';')) {
      const idx = part.indexOf(':');
      if (idx === -1) continue;
      const name = part.slice(0, idx).trim().toLowerCase();
      let value = part.slice(idx + 1).trim();
      if (!name || !value) continue;
      if (name === 'color' && isWhiteColor(value)) value = 'inherit';
      normalized.push(`${name}:${value}`);
    }
    return normalized.join(';');
  }

  function normalizeWhiteTextStyles(md) {
    return md.replace(/style="([^"]*)"/gi, (_, style) => {
      const normalized = normalizeStyleAttr(style);
      return normalized ? `style="${normalized}"` : '';
    });
  }

  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    },
    breaks: true
  });

  const IMG_URL_RE = /(https?:\/\/[^\s<>)\]"']+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:![a-zA-Z]+)?(?:\?[^\s<>)\]"']*)?)/gi;
  const WORD_JOINER = '\u2060';
  const VIEW_MODE_KEY = 'ppdir-view-mode';
  const TOC_DEPTH_KEY = 'ppdir-toc-depth';
  const TOC_TRACK_KEY = 'ppdir-toc-track';
  const TOC_LEGACY_COLLAPSED_KEY = 'ppdir-toc-collapsed';
  const JUMP_FLASH_MS = 1400;
  const HASH_SCROLL_STABILIZE_MS = 1200;

  function escapeHtml(text) {
    return (text || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || '';
  }

  function normalizeCjkStrong(md) {
    return md.replace(/\*\*([^\n]*?)\*\*/gu, (match, inner, offset, source) => {
      if (!inner) return match;
      const prev = offset > 0 ? source[offset - 1] : '\n';
      const next = source[offset + match.length] || '\n';
      const startsWithPunct = /^\p{P}/u.test(inner);
      const endsWithPunct = /\p{P}$/u.test(inner);
      const prevNeedsSplit = prev && !/[\s\p{P}]/u.test(prev);
      const nextNeedsSplit = next && !/[\s\p{P}]/u.test(next);
      let normalized = inner;
      if (startsWithPunct && prevNeedsSplit) normalized = WORD_JOINER + normalized;
      if (endsWithPunct && nextNeedsSplit) normalized += WORD_JOINER;
      return normalized === inner ? match : `**${normalized}**`;
    });
  }

  function renderMd(md) {
    md = md.replace(/\r\n/g, '\n');
    md = md.split('\n').map(l => l.trimEnd()).join('\n');

    let inCode = false;
    md = md.split('\n').map(line => {
      if (/^```/.test(line)) inCode = !inCode;
      if (inCode) return line;
      if (/^\s*-\s*$/.test(line)) return '\uFFFC';
      if (/^\s{4}/.test(line) || /!\[.*?\]\(/.test(line)) return line;
      return line.replace(IMG_URL_RE, '![image]($1)');
    }).join('\n');

    const codeBlocks = [];
    md = md.replace(/```[\s\S]*?```/g, m => {
      codeBlocks.push(m);
      return `%%CB${codeBlocks.length - 1}%%`;
    });

    const protectedHtml = [];
    md = md.replace(/`[^`]+`/g, m => {
      protectedHtml.push(m);
      return `%%PH${protectedHtml.length - 1}%%`;
    });
    md = md.replace(/<(\/?)(span|u|sup|sub|br|hr|a|img|b|i|em|strong|s|del|mark)(\s[^>]*)?\/?>/gi, m => {
      protectedHtml.push(m);
      return `%%PH${protectedHtml.length - 1}%%`;
    });
    md = md.replace(/</g, '&lt;');
    md = md.replace(/%%PH(\d+)%%/g, (_, k) => protectedHtml[+k]);
    md = normalizeWhiteTextStyles(md);
    md = normalizeCjkStrong(md);

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
    return html.replace(/\uFFFC/g, '-').replace(/\u2060/g, '');
  }

  async function loadMaintenanceState() {
    try {
      const url = new URL('maintenance.json', location.href);
      url.searchParams.set('_', Date.now().toString());
      const maintResp = await fetch(url.toString(), { cache: 'no-store' });
      if (!maintResp.ok) return { active: false };
      const maintData = await maintResp.json();
      return { active: !!maintData.active };
    } catch {
      return { active: false };
    }
  }

  let showMaintBadge = false;
  const maintenanceState = await loadMaintenanceState();
  if (maintenanceState.active) {
    const isAdmin = !!(await GitHubAPI.verifySavedToken());
    if (!isAdmin) {
      location.replace('maintenance.html');
      return;
    }
    showMaintBadge = true;
  }

  const $ = s => document.querySelector(s);
  const contentEl = $('#content');
  const tocEl = $('#toc');
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');
  const searchPanel = $('#search-panel');
  const searchInput = $('#search-input');
  const searchCount = $('#search-count');
  const searchPrevBtn = $('#search-prev');
  const searchNextBtn = $('#search-next');
  const searchResultsEl = $('#search-results');
  const modeToggle = $('#mode-toggle');
  const tocDepthControl = $('#toc-depth-control');
  const tocTrackToggle = $('#toc-track-toggle');
  if (showMaintBadge) {
    const badge = $('#maint-badge');
    if (badge) badge.hidden = false;
  }

  const COPY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

  function setCodeCopyButtonState(button, copied) {
    button.classList.toggle('is-copied', copied);
    button.innerHTML = copied ? CHECK_ICON : COPY_ICON;
    button.title = copied ? '已复制' : '复制代码';
    button.setAttribute('aria-label', button.title);
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Copy failed');
  }

  function enhanceCodeBlocks(root = contentEl) {
    root.querySelectorAll('.floor-body pre > code').forEach(code => {
      const pre = code.parentElement;
      if (!pre || pre.closest('.code-copy-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'code-copy-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-btn';
      setCodeCopyButtonState(button, false);
      button.addEventListener('click', async () => {
        try {
          await copyTextToClipboard(code.textContent || '');
          setCodeCopyButtonState(button, true);
          clearTimeout(button.copyTimer);
          button.copyTimer = setTimeout(() => setCodeCopyButtonState(button, false), 1200);
        } catch {
          button.classList.add('is-error');
          clearTimeout(button.copyTimer);
          button.copyTimer = setTimeout(() => button.classList.remove('is-error'), 1200);
        }
      });
      wrap.appendChild(button);
    });
  }

  function enhanceScrollableTables(root = contentEl) {
    root.querySelectorAll('.floor-body table').forEach(table => {
      if (table.closest('.table-scroll-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  let indexData;
  try {
    const res = await fetch('content/_index.json');
    indexData = await res.json();
  } catch {
    contentEl.innerHTML = '<p style="padding:40px;color:red;">无法加载内容索引。</p>';
    return;
  }

  async function fetchMd(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return '';
      return await res.text();
    } catch {
      return '';
    }
  }

  function slugify(text) {
    return (text || '').replace(/[^\w\u4e00-\u9fff\s-]/g, '').replace(/\s+/g, '-').substring(0, 40) || 'floor';
  }

  function slugifyUrl(text) {
    return (text || '').trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u4e00-\u9fff.\-()（）]/g, '').replace(/\.-/g, '-').replace(/\.+$/, '').substring(0, 80) || 'section';
  }

  function stripHeadingMarkup(text) {
    return stripHtml((text || '').replace(/[*_`~]/g, ' ').replace(/\[(.*?)\]\((.*?)\)/g, '$1')).replace(/\s+/g, ' ').trim();
  }

  function extractHeadingBlocks(md, minLevel) {
    const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let current = null;
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      if (match) {
        const level = match[1].length;
        if (level > minLevel) {
          if (current) {
            current.md = current.lines.join('\n').trim();
            blocks.push(current);
          }
          current = {
            level,
            rawTitle: match[2].trim(),
            title: stripHeadingMarkup(match[2]),
            lines: []
          };
          continue;
        }
      }
      if (current) current.lines.push(line);
    }
    if (current) {
      current.md = current.lines.join('\n').trim();
      blocks.push(current);
    }
    return blocks;
  }

  function flattenHeadingBlocks(blocks, prefixParts) {
    const entries = [];
    const stack = [];
    (blocks || []).forEach(block => {
      while (stack.length && stack[stack.length - 1].level >= block.level) stack.pop();
      const pathParts = [...prefixParts, ...stack.map(item => item.urlSlug), block.urlSlug];
      entries.push({
        level: 'h' + block.level,
        label: block.title,
        pathParts,
        path: pathParts.join('/')
      });
      stack.push(block);
    });
    return entries;
  }

  function getSavedMode() {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (saved === 'part') return 'part';
      if (saved === 'all') localStorage.setItem(VIEW_MODE_KEY, 'full');
      return 'full';
    } catch {
      return 'full';
    }
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {}
  }

  function getSavedTocDepth() {
    try {
      const saved = Number(localStorage.getItem(TOC_DEPTH_KEY));
      if (saved >= 1 && saved <= 3) return saved;
      return localStorage.getItem(TOC_LEGACY_COLLAPSED_KEY) === '0' ? 3 : 1;
    } catch {
      return 1;
    }
  }

  function saveTocDepth(depth) {
    try {
      localStorage.setItem(TOC_DEPTH_KEY, String(depth));
    } catch {}
  }

  function getSavedTocTrack() {
    try {
      return localStorage.getItem(TOC_TRACK_KEY) === '1';
    } catch {
      return false;
    }
  }

  function saveTocTrack(enabled) {
    try {
      localStorage.setItem(TOC_TRACK_KEY, enabled ? '1' : '0');
    } catch {}
  }

  function getTocItemLevel(item) {
    const match = [...(item?.classList || [])].join(' ').match(/\btoc-h([2-6])\b/);
    return match ? Number(match[1]) : 0;
  }

  function getTocScrollAnchorItem() {
    const currentItem = tocEl.querySelector('.toc-item.toc-current') || tocEl.querySelector('.toc-item.active-sub') || tocEl.querySelector('.toc-item.active');
    if (!currentItem) return null;
    const maxVisibleLevel = tocDepth === 1 ? 3 : tocDepth === 2 ? 4 : 6;
    if (getTocItemLevel(currentItem) <= maxVisibleLevel) return currentItem;
    return getTocAncestors(currentItem).reverse().find(item => getTocItemLevel(item) <= maxVisibleLevel) || getTocActiveH2(currentItem) || currentItem;
  }

  function getTocCurrentItem() {
    return tocEl.querySelector('.toc-item.toc-current') || tocEl.querySelector('.toc-item.active-sub') || tocEl.querySelector('.toc-item.active');
  }

  function scrollActiveTocItemIntoView(alignTop) {
    if (!sidebar || !tocEl) return;
    const activeItem = getTocScrollAnchorItem();
    if (!activeItem) return;
    if (alignTop) {
      const tocRect = tocEl.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const visibleTrackItems = [...tocEl.querySelectorAll('.toc-track-visible')].filter(item => item.offsetParent !== null);
      const lastTrackItem = visibleTrackItems[visibleTrackItems.length - 1];
      const lastRect = lastTrackItem?.getBoundingClientRect();
      const availableHeight = tocRect.height - 8;
      const trackHeight = lastRect ? lastRect.bottom - itemRect.top : itemRect.height;
      const alignBottom = trackHeight > availableHeight && lastRect;
      const nextTop = alignBottom
        ? tocEl.scrollTop + (lastRect.bottom - tocRect.bottom) + 8
        : tocEl.scrollTop + (itemRect.top - tocRect.top) - 8;
      tocEl.scrollTo({ top: Math.max(nextTop, 0), behavior: 'auto' });
      return;
    }
    activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function applyTocTrackState() {
    if (!tocEl) return;
    tocEl.querySelectorAll('.toc-track-visible').forEach(item => item.classList.remove('toc-track-visible'));
    if (!tocTrackEnabled) return;
    const rootItem = getTocCurrentItem();
    const rootPath = rootItem?.dataset.path || '';
    if (!rootPath) return;
    rootItem.classList.add('toc-track-visible');
    getTocAncestors(rootItem).forEach(item => item.classList.add('toc-track-visible'));
    tocEl.querySelectorAll('.toc-item').forEach(item => {
      const itemPath = item.dataset.path || '';
      if (itemPath.startsWith(rootPath + '/')) item.classList.add('toc-track-visible');
    });
  }

  function applyTocDepthState(alignTop) {
    if (!tocEl || !tocDepthControl) return;
    tocEl.dataset.depth = String(tocDepth);
    tocEl.classList.toggle('track', tocTrackEnabled);
    tocDepthControl.querySelectorAll('[data-toc-depth]').forEach(btn => {
      const active = Number(btn.dataset.tocDepth) === tocDepth;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (tocTrackToggle) tocTrackToggle.checked = tocTrackEnabled;
    applyTocTrackState();
    if (alignTop) requestAnimationFrame(() => scrollActiveTocItemIntoView(true));
  }

  function getTopbarHeight() {
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h'), 10) || 48;
  }

  let hashSyncLockUntil = 0;
  let scrollJumpSeq = 0;
  const SCROLL_JUMP_CANCEL_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

  function lockHashSync(ms) {
    hashSyncLockUntil = Math.max(hashSyncLockUntil, Date.now() + ms);
  }

  function isHashSyncLocked() {
    return Date.now() < hashSyncLockUntil;
  }

  function scrollToElement(target, smooth, extraOffset = 0) {
    if (!target) return;
    const topbarH = getTopbarHeight();
    const top = window.scrollY + target.getBoundingClientRect().top - topbarH - extraOffset - 8;
    window.scrollTo({ top: Math.max(top, 0), behavior: smooth ? 'smooth' : 'auto' });
  }

  function watchScrollJumpCancel(jumpSeq) {
    const cancel = () => {
      if (jumpSeq === scrollJumpSeq) scrollJumpSeq++;
      unwatch();
    };
    const unwatch = () => {
      SCROLL_JUMP_CANCEL_EVENTS.forEach(type => window.removeEventListener(type, cancel, true));
    };
    SCROLL_JUMP_CANCEL_EVENTS.forEach(type => window.addEventListener(type, cancel, { capture: true, passive: true }));
    return unwatch;
  }

  function scrollToHashTarget(target, enableFlash, stabilize) {
    if (!target) return;
    const jumpSeq = ++scrollJumpSeq;
    lockHashSync(stabilize ? HASH_SCROLL_STABILIZE_MS : 350);
    scrollToElement(target, false);
    if (enableFlash) flashJumpTarget(target);
    if (!stabilize) return;

    const startedAt = Date.now();
    const unwatchScrollJumpCancel = watchScrollJumpCancel(jumpSeq);
    const realign = () => {
      if (jumpSeq !== scrollJumpSeq || Date.now() - startedAt > HASH_SCROLL_STABILIZE_MS || !document.body.contains(target)) return;
      lockHashSync(250);
      scrollToElement(target, false);
    };
    requestAnimationFrame(() => requestAnimationFrame(realign));
    [120, 360, 800].forEach(delay => window.setTimeout(realign, delay));
    window.setTimeout(unwatchScrollJumpCancel, HASH_SCROLL_STABILIZE_MS);
    contentEl.querySelectorAll('img').forEach(img => {
      if (img.complete || !(img.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      img.addEventListener('load', realign, { once: true });
    });
  }

  function flashJumpTarget(target) {
    if (!target) return;
    target.classList.remove('jump-flash');
    void target.offsetWidth;
    target.classList.add('jump-flash');
    window.setTimeout(() => target.classList.remove('jump-flash'), JUMP_FLASH_MS);
  }

  function getTocAncestors(item) {
    const path = item?.dataset.path || '';
    if (!path) return [];
    return [...tocEl.querySelectorAll('.toc-item')].filter(candidate => {
      const candidatePath = candidate.dataset.path || '';
      return candidatePath && candidatePath !== path &&
        !candidate.classList.contains('toc-h2') &&
        path.startsWith(candidatePath + '/');
    }).sort((a, b) => (a.dataset.path || '').length - (b.dataset.path || '').length);
  }

  function getTocActiveH2(item) {
    if (!item) return null;
    if (item.classList.contains('toc-h2')) return item;
    let prev = item.closest('li')?.previousElementSibling;
    while (prev) {
      const a = prev.querySelector('.toc-item');
      if (a?.classList.contains('toc-h2')) return a;
      prev = prev.previousElementSibling;
    }
    return null;
  }

  function setTocProgress(activeH2, currentItem) {
    const items = [...tocEl.querySelectorAll('.toc-item')];
    items.forEach(item => item.classList.remove('active', 'active-sub', 'toc-read', 'toc-ancestor', 'toc-current'));
    if (!activeH2 && currentItem) activeH2 = getTocActiveH2(currentItem);
    if (activeH2) activeH2.classList.add('active');
    currentItem = currentItem || activeH2;
    const ancestors = currentItem && currentItem !== activeH2 ? getTocAncestors(currentItem) : [];
    const currentIndex = items.indexOf(currentItem);
    if (currentIndex >= 0) {
      items.slice(0, currentIndex).forEach(item => {
        if (item !== activeH2) item.classList.add('toc-read');
      });
    }
    if (currentItem && currentItem !== activeH2) {
      ancestors.forEach(item => item.classList.add('toc-ancestor'));
      currentItem.classList.add('active-sub', 'toc-current');
    }
    applyTocTrackState();
    return ancestors;
  }

  function setTocProgressByPath(path) {
    if (!path) return;
    const items = [...tocEl.querySelectorAll('.toc-item')];
    const currentItem = items.find(item => item.dataset.path === path) ||
      items.filter(item => {
        const itemPath = item.dataset.path || '';
        return itemPath && path.startsWith(itemPath + '/');
      }).sort((a, b) => (b.dataset.path || '').length - (a.dataset.path || '').length)[0];
    if (!currentItem) return;
    const activeH2 = currentItem.classList.contains('toc-h2') ? currentItem : getTocActiveH2(currentItem);
    setTocProgress(activeH2, currentItem);
  }

  function splitMarkdownSections(md) {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const sections = [];
    let currentH2 = null;
    let currentChild = null;
    let bufferBeforeFirstH2 = [];

    function createSection(title, rawTitle, index) {
      return {
        title: title || '序',
        rawTitle: rawTitle || title || '序',
        floorIndex: index,
        floorNum: `#${index}F`,
        id: slugify(title || `floor-${index}`),
        urlSlug: slugifyUrl(stripHeadingMarkup(rawTitle || title || '序')),
        intro: '',
        children: [],
        childMap: new Map()
      };
    }

    function flushChild() {
      if (!currentChild || !currentH2) return;
      currentChild.md = currentChild.lines.join('\n').trim();
      currentChild.searchText = stripHeadingMarkup(currentChild.title + '\n' + currentChild.md);
      currentChild.searchPath = [currentH2.urlSlug, currentChild.urlSlug].filter(Boolean).join('/');
      currentChild.blocks = extractHeadingBlocks(currentChild.md, currentH2.childLevel || 3).map(block => ({
        ...block,
        urlSlug: slugifyUrl(block.title)
      }));
      currentH2.children.push(currentChild);
      currentH2.childMap.set(currentChild.urlSlug, currentChild);
      currentChild = null;
    }

    function flushSection() {
      if (!currentH2) return;
      flushChild();
      currentH2.intro = currentH2.introLines.join('\n').trim();
      delete currentH2.introLines;
      sections.push(currentH2);
      currentH2 = null;
    }

    let h2Index = 0;
    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)/);
      if (h2Match) {
        flushSection();
        const title = stripHeadingMarkup(h2Match[1]);
        currentH2 = createSection(title, h2Match[1].trim(), h2Index++);
        currentH2.introLines = bufferBeforeFirstH2.length && h2Index === 1 ? bufferBeforeFirstH2.splice(0) : [];
        continue;
      }

      if (!currentH2) {
        bufferBeforeFirstH2.push(line);
        continue;
      }

      const childLevel = currentH2.children.length ? 3 : 6;
      const childMatch = line.match(new RegExp(`^#{3,6}\\s+(.+)`));
      if (childMatch) {
        const hashes = line.match(/^#+/)[0].length;
        const isFirstLevelChild = currentH2.children.length === 0 ? hashes >= 3 : hashes === currentH2.childLevel;
        if (currentH2.childLevel == null && hashes >= 3) currentH2.childLevel = hashes;
        if (isFirstLevelChild && hashes === currentH2.childLevel) {
          flushChild();
          const rawTitle = childMatch[1].trim();
          const title = stripHeadingMarkup(rawTitle);
          currentChild = {
            title,
            rawTitle,
            urlSlug: slugifyUrl(title),
            id: `${currentH2.id}-${slugify(title)}`,
            lines: []
          };
          continue;
        }
      }

      if (currentChild) currentChild.lines.push(line);
      else currentH2.introLines.push(line);
    }

    flushSection();
    return sections.filter(section => section.title || section.intro || section.children.length);
  }

  function buildSearchIndex(sections) {
    const results = [];
    function getChildLeadMarkdown(child, childLevel) {
      const lines = (child.md || '').replace(/\r\n/g, '\n').split('\n');
      if ((childLevel || 3) >= 6) return child.md || '';
      const nestedRe = new RegExp(`^#{${(childLevel || 3) + 1},6}\\s+`);
      const lead = [];
      for (const line of lines) {
        if (nestedRe.test(line)) break;
        lead.push(line);
      }
      return lead.join('\n').trim();
    }

    sections.forEach(section => {
      const sectionText = section.floorIndex !== 0 && section.children.length
        ? stripHeadingMarkup([section.title, ...section.children.map(child => child.title)].join('\n'))
        : stripHeadingMarkup([section.title, section.intro].filter(Boolean).join('\n'));
      results.push({
        type: 'section',
        path: section.urlSlug,
        pageName: section.title,
        pathLabel: section.floorNum + ' ' + section.title,
        text: sectionText,
        title: section.title
      });
      section.children.forEach((child, idx) => {
        const blockText = stripHeadingMarkup([
          section.title,
          child.title,
          getChildLeadMarkdown(child, section.childLevel || 3)
        ].filter(Boolean).join('\n'));
        results.push({
          type: 'child',
          path: [section.urlSlug, child.urlSlug].filter(Boolean).join('/'),
          pageName: child.title,
          parentName: section.title,
          pathLabel: `${section.floorNum} ${section.title} / ${idx + 1}. ${child.title}`,
          text: blockText,
          title: child.title
        });
        child.blocks.forEach(block => {
          results.push({
            type: 'block',
            path: [section.urlSlug, child.urlSlug, block.urlSlug].filter(Boolean).join('/'),
            pageName: block.title,
            parentName: child.title,
            pathLabel: `${section.floorNum} ${section.title} / ${child.title} / ${block.title}`,
            text: stripHeadingMarkup([section.title, child.title, block.title, block.md].filter(Boolean).join('\n')),
            title: block.title
          });
        });
      });
    });
    return results;
  }

  function makeExcerpt(text, query) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const lower = clean.toLowerCase();
    const q = query.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return clean.slice(0, 110);
    const start = Math.max(0, idx - 36);
    const end = Math.min(clean.length, idx + query.length + 64);
    const prefix = start > 0 ? '…' : '';
    const suffix = end < clean.length ? '…' : '';
    return prefix + clean.slice(start, end) + suffix;
  }

  function parseHashPath() {
    const raw = location.hash.replace(/^#/, '').trim();
    if (!raw) return [];
    return raw.split('/').map(decodeURIComponent).filter(Boolean);
  }

  function buildHash(parts) {
    const normalized = (parts || []).filter(Boolean).map(part => encodeURIComponent(part));
    return normalized.length ? '#' + normalized.join('/') : '';
  }

  function setHash(parts, replace) {
    const nextHash = buildHash(parts);
    const nextUrl = nextHash || location.pathname + location.search;
    if ((location.hash || '') === nextHash) return;
    if (replace) history.replaceState(null, '', nextUrl);
    else history.pushState(null, '', nextUrl);
  }

  function firstNavigablePage(sections) {
    return sections[0] ? [sections[0].urlSlug] : [];
  }

  function buildPartPagerPages(sections) {
    const pages = [];
    sections.forEach(section => {
      pages.push({
        type: 'section',
        pathParts: [section.urlSlug],
        name: section.title
      });
      section.children.forEach(child => {
        pages.push({
          type: 'child',
          pathParts: [section.urlSlug, child.urlSlug],
          name: child.title
        });
      });
    });
    return pages;
  }

  function buildTocEntries(sections) {
    const entries = [];
    sections.forEach(section => {
      entries.push({
        level: 'h2',
        label: `${section.floorNum} ${section.title}`,
        pathParts: [section.urlSlug],
        path: section.urlSlug,
        section
      });
      section.children.forEach(child => {
        const childPath = [section.urlSlug, child.urlSlug];
        entries.push({
          level: 'h3',
          label: child.title,
          pathParts: childPath,
          path: childPath.join('/'),
          section,
          child
        });
        entries.push(...flattenHeadingBlocks(child.blocks, childPath));
      });
    });
    return entries;
  }

  function findPageMeta(pages, parts) {
    const key = (parts || []).join('/');
    return pages.findIndex(page => page.pathParts.join('/') === key);
  }

  function buildPagerHtml(currentPathParts, partPages) {
    const idx = findPageMeta(partPages, currentPathParts);
    const prev = idx > 0 ? partPages[idx - 1] : null;
    const next = idx >= 0 && idx < partPages.length - 1 ? partPages[idx + 1] : null;
    return `
      <nav class="part-pager">
        ${prev ? `<a class="part-pager-link" href="${buildHash(prev.pathParts)}"><span class="part-pager-dir">Last</span><span class="part-pager-name">${escapeHtml(prev.name)}</span></a>` : '<div class="part-pager-spacer"><span class="part-pager-dir">Last</span><span class="part-pager-name"></span></div>'}
        ${next ? `<a class="part-pager-link" href="${buildHash(next.pathParts)}"><span class="part-pager-dir">Next</span><span class="part-pager-name">${escapeHtml(next.name)}</span></a>` : '<div class="part-pager-spacer"><span class="part-pager-dir">Next</span><span class="part-pager-name"></span></div>'}
      </nav>`;
  }

  function renderPartSectionPage(section, partPages) {
    const showSummaryOnly = section.floorIndex !== 0 && section.children.length;
    const navCards = section.children.length
      ? section.children.map((child, idx) => `
        <a class="part-nav-card" href="${buildHash([section.urlSlug, child.urlSlug])}" data-nav-path="${[section.urlSlug, child.urlSlug].join('/')}">
          <span class="part-nav-index">${String(idx + 1).padStart(2, '0')}</span>
          <span class="part-nav-title">${escapeHtml(child.title)}</span>
        </a>`).join('')
      : `<div class="search-empty">该页面没有可展开的标题3导航。</div>`;

    const bodyHtml = showSummaryOnly
      ? `<div class="part-grid">${navCards}</div>`
      : renderMd(section.intro || '');

    return `
      <div class="floor floor-part" id="floor-${escapeHtml(section.id)}" data-section-id="${escapeHtml(section.id)}" data-url-slug="${escapeHtml(section.urlSlug)}">
        <div class="floor-header">${escapeHtml(section.floorNum)} &nbsp; ${escapeHtml(section.title)}</div>
        <div class="floor-body" data-anchor-base="${escapeHtml(section.id)}">
          ${bodyHtml}
        </div>
      </div>
      ${buildPagerHtml([section.urlSlug], partPages)}`;
  }

  function renderPartChildPage(section, child, partPages) {
    const childHeadingLevel = '#'.repeat(section.childLevel || 3);
    const childMd = `${childHeadingLevel} ${child.rawTitle}\n\n${child.md}`;
    return `
      <div class="floor floor-part" id="floor-${escapeHtml(section.id)}" data-section-id="${escapeHtml(section.id)}" data-url-slug="${escapeHtml(section.urlSlug)}">
        <div class="floor-header">${escapeHtml(section.floorNum)} &nbsp; ${escapeHtml(section.title)}</div>
        <div class="floor-body" data-anchor-base="${escapeHtml(child.id)}">
          ${renderMd(childMd)}
        </div>
      </div>
      ${buildPagerHtml([section.urlSlug, child.urlSlug], partPages)}`;
  }

  function renderAllPage(sections) {
    const html = sections.map(section => `
      <div class="floor" id="floor-${escapeHtml(section.id)}" data-section-id="${escapeHtml(section.id)}" data-url-slug="${escapeHtml(section.urlSlug)}">
        <div class="floor-header">${escapeHtml(section.floorNum)} &nbsp; ${escapeHtml(section.title)}</div>
        <div class="floor-body">${renderMd([section.intro, ...section.children.map(child => `${'#'.repeat(section.childLevel || 3)} ${child.rawTitle}\n${child.md}`)].filter(Boolean).join('\n\n'))}</div>
      </div>`).join('');
    contentEl.innerHTML = html;
    const targetByPath = new Map();
    const allIds = new Set();
    document.querySelectorAll('.floor').forEach((floorEl, i) => {
      const id = floorEl.dataset.sectionId || `floor-${i}`;
      const sectionSlug = sections[i]?.urlSlug || '';
      targetByPath.set(sectionSlug, { target: `floor-${id}`, urlSlug: sectionSlug });
      const parentSlug = { h3: '', h4: '', h5: '' };
      const headingStack = [];
      floorEl.querySelectorAll('.floor-body h3, .floor-body h4, .floor-body h5, .floor-body h6').forEach((h, j) => {
        const level = h.tagName.toLowerCase();
        const levelNum = Number(level.slice(1));
        const headingText = stripHeadingMarkup(h.textContent);
        const hSlug = slugify(headingText);
        const urlSlug = slugifyUrl(headingText);
        while (headingStack.length && headingStack[headingStack.length - 1].level >= levelNum) headingStack.pop();
        if (level === 'h3') {
          parentSlug.h3 = hSlug;
          parentSlug.h4 = '';
          parentSlug.h5 = '';
        } else if (level === 'h4') {
          parentSlug.h4 = hSlug;
          parentSlug.h5 = '';
        }
        else if (level === 'h5') parentSlug.h5 = hSlug;
        let base;
        if (level === 'h3' || level === 'h4') base = `${id}-${hSlug || `h${j}`}`;
        else if (level === 'h5') base = parentSlug.h4 ? `${parentSlug.h4}-${hSlug || `h${j}`}` : `${id}-${hSlug || `h${j}`}`;
        else base = parentSlug.h5 ? `${parentSlug.h5}-${hSlug || `h${j}`}` : `${id}-${hSlug || `h${j}`}`;
        let hId = base;
        let n = 2;
        while (allIds.has(hId)) hId = `${base}-${n++}`;
        allIds.add(hId);
        h.id = hId;
        h.dataset.urlSlug = urlSlug;
        h.dataset.path = [sectionSlug, ...headingStack.map(item => item.urlSlug), urlSlug].filter(Boolean).join('/');
        targetByPath.set(h.dataset.path, { target: hId, urlSlug });
        headingStack.push({ level: levelNum, urlSlug });
      });
    });
    renderToc(appState.tocEntries, { mode: 'full', targetByPath });
  }

  function renderToc(entries, options = {}) {
    const currentPath = parseHashPath().join('/');
    const mode = options.mode || activeMode;
    const targetByPath = options.targetByPath || new Map();
    tocEl.innerHTML = entries.map(entry => {
      const targetMeta = targetByPath.get(entry.path);
      const classes = ['toc-item', `toc-${entry.level}`];
      const attrs = mode === 'full' && targetMeta
        ? `data-target="${escapeHtml(targetMeta.target)}" data-url-slug="${escapeHtml(targetMeta.urlSlug || '')}" data-path="${escapeHtml(entry.path)}"`
        : `href="${buildHash(entry.pathParts)}" data-path="${escapeHtml(entry.path)}"`;
      return `<li><a class="${classes.join(' ')}" ${attrs}>${escapeHtml(entry.label)}</a></li>`;
    }).join('');
    setTocProgressByPath(currentPath);
  }

  function renderPartToc(sections, activeSection, activeChild) {
    renderToc(appState.tocEntries, { mode: 'part' });
  }

  function setExternalLinks() {
    contentEl.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });
  }

  let activeMode = getSavedMode();
  let searchMarks = [];
  let currentMarkIdx = -1;
  let observer = null;
  let updateTocSubHandler = null;
  let searchTimer = null;
  let tocDepth = getSavedTocDepth();
  let tocTrackEnabled = getSavedTocTrack();
  let sidebarScrollY = 0;
  let skipSidebarScrollRestore = false;
  let pendingPartSearchQuery = '';
  let fullModeSearchQuery = '';
  let searchOpenMode = activeMode;

  function assignNestedAnchors(root, baseId) {
    if (!root) return;
    const used = new Set();
    root.querySelectorAll('h2, h3, h4, h5, h6').forEach((heading, idx) => {
      const slug = slugify(stripHeadingMarkup(heading.textContent)) || `sub-${idx}`;
      let id = `${baseId}-${slug}`;
      let n = 2;
      while (used.has(id) || document.getElementById(id)) id = `${baseId}-${slug}-${n++}`;
      used.add(id);
      heading.id = id;
      heading.dataset.urlSlug = slugifyUrl(stripHeadingMarkup(heading.textContent));
    });
  }

  function scrollPartSearchMatch(enableFlash) {
    if (!pendingPartSearchQuery) return false;
    const query = pendingPartSearchQuery;
    pendingPartSearchQuery = '';
    highlightPartSearchTerm(query);
    const partSearchMarks = [...searchMarks];
    const firstMark = partSearchMarks[0];
    if (!firstMark) return false;
    currentMarkIdx = -1;
    scrollToHashTarget(firstMark, enableFlash, true);
    window.setTimeout(() => {
      if (partSearchMarks.every(mark => searchMarks.includes(mark))) clearAllModeSearch();
    }, JUMP_FLASH_MS);
    return true;
  }

  function scrollPartTarget(section, child, parts, enableFlash) {
    const floor = contentEl.querySelector('.floor.floor-part');
    const body = contentEl.querySelector('.floor.floor-part .floor-body');
    if (scrollPartSearchMatch(enableFlash)) return;
    if (parts.length > 2 && child && body) {
      let target = body;
      for (let i = 2; i < parts.length; i++) {
        const next = body.querySelector(`[data-url-slug="${CSS.escape(parts[i])}"]`);
        if (!next) break;
        target = next;
      }
      scrollToHashTarget(target, enableFlash, true);
      return;
    }
    if (parts.length > 1 && !child && body) {
      let target = body;
      for (let i = 1; i < parts.length; i++) {
        const next = body.querySelector(`[data-url-slug="${CSS.escape(parts[i])}"]`);
        if (!next) break;
        target = next;
      }
      scrollToHashTarget(target, enableFlash, true);
      return;
    }
    if (body && child) {
      const childHeading = body.querySelector(`[data-url-slug="${CSS.escape(parts[1] || child.urlSlug || '')}"]`) || body.querySelector('h3, h4, h5, h6');
      const target = childHeading || floor || body;
      scrollToHashTarget(target, enableFlash, true);
      return;
    }
    if (body && !child && section && !section.children.length) {
      scrollToHashTarget(floor || body, enableFlash, true);
      return;
    }
    if (parts.length > 2 && child) {
      const childBody = contentEl.querySelector(`#${CSS.escape(child.id)}`);
      if (childBody) {
        let target = childBody;
        for (let i = 2; i < parts.length; i++) {
          const next = childBody.querySelector(`[data-url-slug="${CSS.escape(parts[i])}"]`);
          if (!next) break;
          target = next;
        }
        scrollToHashTarget(target, enableFlash, true);
        return;
      }
    }
    if (parts.length > 1 && !child) {
      const sectionBody = contentEl.querySelector('.floor.floor-part .floor-body');
      if (sectionBody) {
        let target = sectionBody;
        for (let i = 1; i < parts.length; i++) {
          const next = sectionBody.querySelector(`[data-url-slug="${CSS.escape(parts[i])}"]`);
          if (!next) break;
          target = next;
        }
        scrollToHashTarget(target, enableFlash, true);
        return;
      }
    }
    const focusTarget = child
      ? (contentEl.querySelector('.floor.floor-part') || contentEl.querySelector('.floor.floor-part .floor-body'))
      : contentEl.querySelector(`#floor-${CSS.escape(section?.id || '')}`);
    if (focusTarget) {
      scrollToHashTarget(focusTarget, enableFlash, true);
    }
  }

  function clearAllModeSearch() {
    searchMarks.forEach(m => {
      const parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
    searchMarks = [];
    currentMarkIdx = -1;
  }

  function clearSearchUi() {
    clearAllModeSearch();
    searchCount.textContent = '';
    searchResultsEl.hidden = true;
    searchResultsEl.innerHTML = '';
    searchPrevBtn.disabled = activeMode === 'part';
    searchNextBtn.disabled = activeMode === 'part';
  }

  function getOpenSearchPanelHeight() {
    return searchPanel.classList.contains('open') ? searchPanel.getBoundingClientRect().height : 0;
  }

  function restoreSearchInputForMode() {
    searchInput.value = activeMode === 'full' ? fullModeSearchQuery : '';
  }

  function renderPartSearchResults(results, query) {
    if (!query.trim()) {
      searchResultsEl.hidden = true;
      searchResultsEl.innerHTML = '';
      searchCount.textContent = '';
      return;
    }
    searchCount.textContent = results.length ? `${results.length} 个结果` : '无结果';
    searchPrevBtn.disabled = true;
    searchNextBtn.disabled = true;
    searchResultsEl.hidden = false;
    if (!results.length) {
      searchResultsEl.innerHTML = '<div class="search-empty">没有找到对应文档位置。</div>';
      return;
    }
    searchResultsEl.innerHTML = `<div class="search-results-list">${results.map(result => `
      <button class="search-result-item" type="button" data-path="${escapeHtml(result.path)}" data-query="${escapeHtml(query.trim())}">
        <span class="search-result-path">${escapeHtml(result.pathLabel)}</span>
        <span class="search-result-title">${escapeHtml(result.title)}</span>
        <span class="search-result-excerpt">${escapeHtml(makeExcerpt(result.text, query))}</span>
      </button>`).join('')}</div>`;
  }

  function highlightPartSearchTerm(query) {
    clearAllModeSearch();
    const q = (query || '').trim();
    if (!q) return;
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      if (!node.parentNode || /^(script|style|mark)$/i.test(node.parentNode.nodeName)) continue;
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
  }

  function doAllModeSearch(query) {
    fullModeSearchQuery = query;
    clearAllModeSearch();
    searchResultsEl.hidden = true;
    searchResultsEl.innerHTML = '';
    searchPrevBtn.disabled = false;
    searchNextBtn.disabled = false;
    if (!query.trim()) {
      searchCount.textContent = '';
      return;
    }
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      if (!node.parentNode || /^(script|style|mark)$/i.test(node.parentNode.nodeName)) continue;
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

  function doPartModeSearch(query, searchIndex) {
    const q = query.trim().toLowerCase();
    if (!q) {
      renderPartSearchResults([], query);
      return;
    }
    const results = searchIndex.filter(entry => entry.text.toLowerCase().includes(q)).slice(0, 80);
    renderPartSearchResults(results, query);
  }

  function navigateMark(idx) {
    if (!searchMarks.length) return;
    if (currentMarkIdx >= 0 && searchMarks[currentMarkIdx]) searchMarks[currentMarkIdx].classList.remove('current');
    currentMarkIdx = ((idx % searchMarks.length) + searchMarks.length) % searchMarks.length;
    const mark = searchMarks[currentMarkIdx];
    mark.classList.add('current');
    scrollToElement(mark, true, getOpenSearchPanelHeight());
    searchCount.textContent = `${currentMarkIdx + 1} / ${searchMarks.length}`;
  }

  function openSearch() {
    const wasOpen = searchPanel.classList.contains('open');
    searchOpenMode = activeMode;
    if (!wasOpen) restoreSearchInputForMode();
    searchPanel.classList.add('open');
    if (activeMode === 'full' && searchInput.value.trim() && (!wasOpen || !searchMarks.length)) doAllModeSearch(searchInput.value);
    searchInput.focus();
    searchInput.select();
  }

  function closeSearch() {
    if (searchPanel.classList.contains('open') && searchOpenMode === 'full') fullModeSearchQuery = searchInput.value;
    searchPanel.classList.remove('open');
    clearSearchUi();
    restoreSearchInputForMode();
  }

  function closeSidebar() {
    const wasOpen = sidebar.classList.contains('open');
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    if (!wasOpen) return;
    document.body.classList.remove('sidebar-lock');
    document.body.style.top = '';
    if (!skipSidebarScrollRestore) window.scrollTo(0, sidebarScrollY);
    skipSidebarScrollRestore = false;
  }

  function openSidebar() {
    if (sidebar.classList.contains('open')) return;
    skipSidebarScrollRestore = false;
    sidebarScrollY = window.scrollY;
    document.body.style.top = `-${sidebarScrollY}px`;
    document.body.classList.add('sidebar-lock');
    sidebar.classList.add('open');
    overlay.classList.add('open');
    applyTocDepthState(true);
  }

  function bindStaticEvents() {
    $('#menu-btn').addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
    overlay.addEventListener('click', closeSidebar);
    $('#search-btn').addEventListener('click', openSearch);
    $('#search-close').addEventListener('click', closeSearch);
    tocDepthControl.addEventListener('click', e => {
      const btn = e.target.closest('[data-toc-depth]');
      if (!btn) return;
      const keepTop = tocEl.scrollTop;
      tocDepth = Math.min(3, Math.max(1, Number(btn.dataset.tocDepth) || 1));
      saveTocDepth(tocDepth);
      applyTocDepthState(false);
      requestAnimationFrame(() => { tocEl.scrollTop = keepTop; });
    });
    tocTrackToggle.addEventListener('change', () => {
      tocTrackEnabled = tocTrackToggle.checked;
      saveTocTrack(tocTrackEnabled);
      applyTocDepthState(false);
    });
    searchPrevBtn.addEventListener('click', () => navigateMark(currentMarkIdx - 1));
    searchNextBtn.addEventListener('click', () => navigateMark(currentMarkIdx + 1));
    searchResultsEl.addEventListener('click', e => {
      const item = e.target.closest('[data-path]');
      if (!item) return;
      pendingPartSearchQuery = activeMode === 'part' ? (item.dataset.query || searchInput.value || '') : '';
      setHash(item.dataset.path.split('/'), false);
      closeSearch();
      renderApp(true);
    });
    searchInput.addEventListener('input', () => {
      if (activeMode === 'full') fullModeSearchQuery = searchInput.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (activeMode === 'part') doPartModeSearch(searchInput.value, appState.searchIndex);
        else doAllModeSearch(searchInput.value);
      }, 200);
    });
    document.addEventListener('pointerdown', e => {
      if (!searchPanel.classList.contains('open')) return;
      if (searchPanel.contains(e.target) || e.target.closest('#search-btn')) return;
      closeSearch();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (searchPanel.classList.contains('open')) closeSearch();
        else closeSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openSearch();
      }
    });
    modeToggle.addEventListener('click', () => {
      activeMode = activeMode === 'full' ? 'part' : 'full';
      saveMode(activeMode);
      lockHashSync(HASH_SCROLL_STABILIZE_MS);
      if (activeMode === 'part') {
        const parts = parseHashPath();
        if (!parts.length || (parts.length === 1 && appState.sections.find(sec => sec.floorIndex === 0 && sec.urlSlug === parts[0]))) {
          setHash(firstNavigablePage(appState.sections), true);
        }
      }
      closeSearch();
      renderApp({ scrollToHash: true, flash: false });
    });
    window.addEventListener('hashchange', () => renderApp({ scrollToHash: true, flash: true }));
  }

  function teardownDynamicEvents() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (updateTocSubHandler) {
      window.removeEventListener('scroll', updateTocSubHandler);
      updateTocSubHandler = null;
    }
  }

  function findAllModeHashTarget(parts) {
    const path = (parts || []).join('/');
    if (!path) return null;
    const tocItem = tocEl.querySelector(`[data-path="${CSS.escape(path)}"][data-target]`);
    const tocTarget = tocItem?.dataset.target ? document.getElementById(tocItem.dataset.target) : null;
    if (tocTarget) return tocTarget;

    const exactTarget = contentEl.querySelector(`[data-path="${CSS.escape(path)}"]`);
    if (exactTarget) return exactTarget;

    const floorEl = contentEl.querySelector(`.floor[data-url-slug="${CSS.escape(parts[0])}"]`);
    if (floorEl) {
      let target = floorEl;
      for (let i = 1; i < parts.length; i++) {
        const subPath = parts.slice(0, i + 1).join('/');
        const sub = floorEl.querySelector(`[data-path="${CSS.escape(subPath)}"]`) ||
          floorEl.querySelector(`[data-url-slug="${CSS.escape(parts[i])}"]`);
        if (!sub) break;
        target = sub;
      }
      return target;
    }

    return contentEl.querySelector(`[data-url-slug="${CSS.escape(parts[parts.length - 1])}"]`);
  }

  function initAllModeInteraction(enableFlash) {
    const parts = parseHashPath();
    if (parts.length) lockHashSync(HASH_SCROLL_STABILIZE_MS);

    tocEl.onclick = e => {
      const item = e.target.closest('[data-target]');
      if (!item) return;
      e.preventDefault();
      const target = document.getElementById(item.dataset.target);
      if (!target) return;
      lockHashSync(HASH_SCROLL_STABILIZE_MS);
      skipSidebarScrollRestore = true;
      closeSidebar();
      if (item.dataset.path) setHash(item.dataset.path.split('/'), true);
      setTocProgress(item.classList.contains('toc-h2') ? item : getTocActiveH2(item), item);
      requestAnimationFrame(() => {
        scrollToHashTarget(target, true, true);
      });
    };

    const rootMargin = `-${getTopbarHeight()}px 0px -60% 0px`;
    observer = new IntersectionObserver(entries => {
      let topId = null;
      let topRatio = 0;
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > topRatio) {
          topRatio = entry.intersectionRatio;
          topId = entry.target.dataset.sectionId;
        }
      }
      if (!topId) return;
      if (isHashSyncLocked()) return;
      const active = tocEl.querySelector(`[data-target="floor-${topId}"]`);
      if (active) {
        setTocProgress(active, active);
        if (active.dataset.urlSlug) setHash([active.dataset.urlSlug], true);
      }
      updateTocSubHandler();
    }, { rootMargin, threshold: [0, 0.25, 0.5] });

    document.querySelectorAll('[data-section-id]').forEach(el => observer.observe(el));

    updateTocSubHandler = function() {
      if (isHashSyncLocked()) return;
      const activeH2 = tocEl.querySelector('.toc-item.active');
      if (!activeH2) return;
      const subItems = [];
      let sib = activeH2.closest('li')?.nextElementSibling;
      while (sib) {
        const a = sib.querySelector('.toc-item');
        if (!a || a.classList.contains('toc-h2')) break;
        subItems.push(a);
        sib = sib.nextElementSibling;
      }
      if (!subItems.length) return;
      let currentSub = null;
      const topbarH = getTopbarHeight();
      for (const item of subItems) {
        const target = document.getElementById(item.dataset.target);
        if (target && target.getBoundingClientRect().top <= topbarH + 20) currentSub = item;
      }
      if (!currentSub) return;
      const ancestors = setTocProgress(activeH2, currentSub);
      const floorSlug = activeH2.dataset.urlSlug || '';
      const pathParts = currentSub.dataset.path
        ? currentSub.dataset.path.split('/')
        : [floorSlug, ...ancestors.map(a => a.dataset.urlSlug || ''), currentSub.dataset.urlSlug || ''].filter(Boolean);
      if (pathParts.length) setHash(pathParts, true);
    };
    window.addEventListener('scroll', updateTocSubHandler);

    if (parts.length) {
      const target = findAllModeHashTarget(parts);
      if (target) {
        scrollToHashTarget(target, enableFlash, true);
      }
    }
  }

  function initPartModeInteraction(activeSection, activeChild, enableFlash) {
    tocEl.onclick = e => {
      const link = e.target.closest('[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      skipSidebarScrollRestore = true;
      closeSidebar();
      location.hash = href;
    };
    document.querySelectorAll('.part-pager-link, .part-nav-card, .part-section-title a').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        e.preventDefault();
        location.hash = href;
      });
    });
    const currentPath = parseHashPath().join('/');
    setTocProgressByPath(currentPath);
    scrollPartTarget(activeSection, activeChild, parseHashPath(), enableFlash);
  }

  const rawMd = await fetchMd(indexData.file || 'content/main.md');
  const sections = splitMarkdownSections(rawMd);
  const appState = {
    sections,
    searchIndex: buildSearchIndex(sections),
    partPages: buildPartPagerPages(sections),
    tocEntries: buildTocEntries(sections)
  };

  function renderPartPage(enableFlash) {
    let parts = parseHashPath();
    if (!parts.length) {
      parts = firstNavigablePage(appState.sections);
      setHash(parts, true);
    }
    let section = appState.sections.find(sec => sec.urlSlug === parts[0]);
    if (!section) {
      parts = firstNavigablePage(appState.sections);
      setHash(parts, true);
      section = appState.sections.find(sec => sec.urlSlug === parts[0]);
    }
    if (!section) {
      contentEl.innerHTML = '<p style="padding:40px;color:red;">无法定位页面。</p>';
      tocEl.innerHTML = '';
      return;
    }
    const child = parts[1] ? section.childMap.get(parts[1]) : null;
    if (parts[1] && !child && section.children.length) {
      setHash([section.urlSlug], true);
      contentEl.innerHTML = renderPartSectionPage(section, appState.partPages);
      renderPartToc(appState.sections, section, null);
      return initPartModeInteraction(section, null, enableFlash);
    }
    contentEl.innerHTML = child
      ? renderPartChildPage(section, child, appState.partPages)
      : renderPartSectionPage(section, appState.partPages);
    contentEl.querySelectorAll('.floor.floor-part .floor-body').forEach(el => assignNestedAnchors(el, el.dataset.anchorBase || section.id));
    renderPartToc(appState.sections, section, child);
    initPartModeInteraction(section, child, enableFlash);
  }

  function renderApp(options) {
    teardownDynamicEvents();
    clearSearchUi();
    modeToggle.textContent = activeMode;
    modeToggle.dataset.mode = activeMode;
    searchInput.placeholder = activeMode === 'part' ? '搜索文档位置...' : '搜索内容...';
    const enableFlash = typeof options === 'object' && options !== null ? !!options.flash : !!options;
    if (activeMode === 'part') renderPartPage(enableFlash);
    else {
      renderAllPage(appState.sections);
      initAllModeInteraction(enableFlash);
    }
    enhanceScrollableTables(contentEl);
    enhanceCodeBlocks(contentEl);
    applyTocDepthState();
    setExternalLinks();
  }

  bindStaticEvents();
  renderApp(false);

  const siteFooter = document.getElementById('site-footer');
  if (siteFooter) {
    const footerObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        siteFooter.classList.toggle('is-visible', entry.isIntersecting);
        siteFooter.setAttribute('aria-hidden', entry.isIntersecting ? 'false' : 'true');
      });
    }, { threshold: 0.05 });
    footerObserver.observe(siteFooter);
  }
})();
