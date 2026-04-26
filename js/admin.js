(function() {
  'use strict';

  const $ = s => document.querySelector(s);
  const DRAFT_KEY = 'ppd_global_draft';
  const ADMIN_MODE_KEY = 'ppdir-admin-view-mode';

  let indexData = null;
  let indexSha = null;
  let fileShas = {};
  let sourceBuffer = '';
  let currentView = 'rendered';
  let adminMode = getSavedAdminMode();
  let activeSegmentKey = '';
  let activeEditRange = null;
  let adminDoc = null;
  let maintSha = null;
  let maintActive = false;
  let imageMap = {};
  let imageCounter = 0;
  let publishedBuffer = '';
  const publishedImageCache = new Map();

  function setStatus(t) { $('#footer-status').textContent = t; }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

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

  function stripHeadingMarkup(text) {
    return stripHtml((text || '').replace(/[*_`~]/g, ' ').replace(/\[(.*?)\]\((.*?)\)/g, '$1')).replace(/\s+/g, ' ').trim();
  }

  function getSavedAdminMode() {
    try {
      return localStorage.getItem(ADMIN_MODE_KEY) === 'part' ? 'part' : 'all';
    } catch {
      return 'all';
    }
  }

  function saveAdminMode(mode) {
    try {
      localStorage.setItem(ADMIN_MODE_KEY, mode);
    } catch {}
  }

  // ═══ Base64 UTF-8 helpers ═══

  function decodeBase64Utf8(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function normalizeBase64Content(b64) {
    return (b64 || '').replace(/\s/g, '');
  }

  function isWhiteColor(value) {
    return /^(?:white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(?:1|1\.0+)\s*\)|hsl\(\s*0\s*,\s*0%\s*,\s*100%\s*\))$/i.test((value || '').trim());
  }

  function isBlackColor(value) {
    return /^(?:black|#000(?:000)?|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*(?:1|1\.0+)\s*\))$/i.test((value || '').trim());
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

  function repoImagePathFromSrc(src) {
    const match = (src || '').trim().match(/^(?:\.\.\/|\/)?(images\/[^)\s?#]+)$/i);
    return match ? match[1] : '';
  }

  function extractMarkdownImages(md) {
    const re = /!\[([^\]]*)\]\(([^)\r\n]+)\)/g;
    const images = [];
    let match;
    let order = 0;
    while ((match = re.exec(md))) {
      const src = match[2].trim();
      let kind = 'other';
      if (/^data:image\/([^;]+);base64,/i.test(src)) {
        kind = 'data';
      } else if (/^https?:\/\//i.test(src)) {
        kind = 'external';
      } else if (repoImagePathFromSrc(src)) {
        kind = 'repo';
      }
      images.push({
        order: order++,
        full: match[0],
        alt: match[1],
        src,
        start: match.index,
        end: match.index + match[0].length,
        kind
      });
    }
    return images;
  }

  function dataUrlToImageData(src) {
    const match = (src || '').match(/^data:image\/([^;]+);base64,(.+)$/i);
    if (!match) return null;
    return {
      ext: match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase(),
      b64: normalizeBase64Content(match[2])
    };
  }

  async function getPublishedImageBase64(src) {
    const path = repoImagePathFromSrc(src);
    if (!path) return null;
    if (publishedImageCache.has(path)) return publishedImageCache.get(path);
    try {
      const file = await CodebergAPI.getFile(path);
      const content = normalizeBase64Content(file.content);
      publishedImageCache.set(path, content);
      return content;
    } catch {
      publishedImageCache.set(path, null);
      return null;
    }
  }

  function rebuildMarkdownWithImageReplacements(md, images) {
    let cursor = 0;
    let result = '';
    for (const image of images) {
      result += md.slice(cursor, image.start);
      result += image.replacement || image.full;
      cursor = image.end;
    }
    return result + md.slice(cursor);
  }

  function renderStyledInline(inner, style, extraColor) {
    const parts = [];
    const styleText = [style || '', extraColor ? `color:${extraColor}` : ''].filter(Boolean).join(';');
    const colorMatch = styleText.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const bgMatch = styleText.match(/(?:^|;)\s*background-color\s*:\s*([^;]+)/i);
    const fsMatch = styleText.match(/(?:^|;)\s*font-size\s*:\s*([^;]+)/i);

    if (colorMatch) {
      const color = colorMatch[1].trim();
      if (isWhiteColor(color)) {
        parts.push('color:inherit');
      } else if (!isBlackColor(color)) {
        parts.push(`color:${color}`);
      }
    }
    if (bgMatch) {
      const bg = bgMatch[1].trim();
      if (!/^(transparent|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0(?:\.0+)?\s*\)|inherit|initial)$/i.test(bg) && !isWhiteColor(bg)) {
        parts.push(`background-color:${bg}`);
      }
    }
    if (fsMatch) {
      const fs = fsMatch[1].trim();
      if (!/^(14px|1em|medium|inherit|initial)$/i.test(fs)) {
        parts.push(`font-size:${fs}`);
      }
    }

    return parts.length ? `<span style="${parts.join(';')}">${inner}</span>` : inner;
  }

  function wrapDelimited(inner, token) {
    const value = inner || '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    return `${leading}${token}${trimmed}${token}${trailing}`;
  }

  function wrapHtmlTag(inner, tag) {
    const value = inner || '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    return `${leading}<${tag}>${trimmed}</${tag}>${trailing}`;
  }

  function needsDelimiterGap(prev, next) {
    if (!prev || !next) return false;
    if (/\s$/.test(prev) || /^\s/.test(next)) return false;
    return /(?:\*{1,3}|_{1,3}|~~)$/.test(prev) && /^(?:\*{1,3}|_{1,3}|~~)/.test(next);
  }

  function appendChunk(result, chunk) {
    if (!chunk) return result;
    if (!result) return chunk;
    return needsDelimiterGap(result, chunk) ? `${result} ${chunk}` : result + chunk;
  }

  function normalizeComparableText(text) {
    return (text || '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/[`*_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parsePlainListLine(line, prevDepth) {
    const raw = (line || '').replace(/\u00a0/g, ' ');
    const leading = raw.match(/^\s*/)?.[0].length || 0;
    const trimmed = raw.trimStart();
    let match = trimmed.match(/^([•●◦○·▪▫\-*+])\s+(.+)$/);
    if (match) {
      let depth = Math.floor(leading / 2);
      if (/[◦○·▪▫]/.test(match[1]) && depth === 0) depth = prevDepth > 0 ? prevDepth : 1;
      return { depth, marker: '- ', text: match[2].trim() };
    }
    match = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (match) {
      return { depth: Math.floor(leading / 2), marker: `${match[1]}. `, text: match[2].trim() };
    }
    return null;
  }

  function extractPlainTextListBlocks(text) {
    const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      let prevDepth = 0;
      const first = parsePlainListLine(lines[i], prevDepth);
      if (!first) {
        i++;
        continue;
      }

      const blockLines = [];
      while (i < lines.length) {
        const parsed = parsePlainListLine(lines[i], prevDepth);
        if (parsed) {
          prevDepth = parsed.depth;
          blockLines.push(`${'  '.repeat(parsed.depth)}${parsed.marker}${parsed.text}`);
          i++;
          continue;
        }

        const raw = lines[i] || '';
        const trimmed = raw.trim();
        const leading = raw.match(/^\s*/)?.[0].length || 0;
        if (!trimmed) break;
        if (!blockLines.length) break;
        if (leading === 0) break;

        blockLines[blockLines.length - 1] += `\n${'  '.repeat(prevDepth)}  ${trimmed}`;
        i++;
      }

      if (blockLines.length) {
        blocks.push({
          lines: blockLines,
          topTexts: blockLines
            .filter(line => /^(?:- |\d+\. )/.test(line))
            .map(line => normalizeComparableText(line.replace(/^(?:- |\d+\. )/, ''))),
          hasNested: blockLines.some(line => /^\s{2,}(?:- |\d+\. )/.test(line))
        });
      }
    }

    return blocks;
  }

  function extractMarkdownListBlocks(md) {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      if (!/^\s*(?:- |\d+\. )/.test(lines[i])) {
        i++;
        continue;
      }
      const start = i;
      i++;
      while (i < lines.length) {
        const line = lines[i];
        if (/^\s*(?:- |\d+\. )/.test(line) || /^\s{2,}\S/.test(line)) {
          i++;
          continue;
        }
        if (!line.trim() && i + 1 < lines.length && /^\s*(?:- |\d+\. )/.test(lines[i + 1])) {
          i++;
          continue;
        }
        break;
      }

      const end = i - 1;
      const blockLines = lines.slice(start, end + 1);
      blocks.push({
        start,
        end,
        topTexts: blockLines
          .filter(line => /^(?:- |\d+\. )/.test(line))
          .map(line => normalizeComparableText(line.replace(/^(?:- |\d+\. )/, '')))
      });
    }

    return blocks;
  }

  function recoverListBlocksFromPlainText(md, plainText) {
    const plainBlocks = extractPlainTextListBlocks(plainText).filter(block => block.hasNested && block.topTexts.length);
    if (!plainBlocks.length) return md;

    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const mdBlocks = extractMarkdownListBlocks(md);
    const replacements = [];

    for (const plainBlock of plainBlocks) {
      const target = mdBlocks.find(block => {
        if (block.used || block.topTexts.length !== plainBlock.topTexts.length) return false;
        return block.topTexts.every((text, idx) => text === plainBlock.topTexts[idx]);
      });
      if (!target) continue;
      target.used = true;
      replacements.push({ start: target.start, end: target.end, lines: plainBlock.lines });
    }

    replacements.sort((a, b) => b.start - a.start).forEach(replacement => {
      lines.splice(replacement.start, replacement.end - replacement.start + 1, ...replacement.lines);
    });

    return lines.join('\n');
  }

  // ═══ Marked config ═══

  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs && hljs.getLanguage && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    },
    breaks: true
  });

  // ═══ Login ═══

  async function tryLogin(token) {
    const storedToken = CodebergAPI.getToken();
    $('#login-error').textContent = '';
    $('#login-btn').disabled = true;
    $('#login-btn').textContent = '验证中...';
    try {
      const d = await CodebergAPI.verifyToken(token);
      if (!d) throw new Error('Token 无效');
      CodebergAPI.setToken(token);
      $('#login-screen').style.display = 'none';
      $('#editor-screen').style.display = '';
      initEditor();
    } catch(e) {
      if (token && token === storedToken) CodebergAPI.clearToken();
      $('#login-screen').style.display = '';
      $('#login-error').textContent = e.message || '验证失败';
    } finally {
      $('#login-btn').disabled = false;
      $('#login-btn').textContent = '登录';
    }
  }

  $('#login-btn').addEventListener('click', () => tryLogin($('#token-input').value.trim()));
  $('#token-input').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin($('#token-input').value.trim()); });

  const saved = CodebergAPI.getToken();
  if (saved) tryLogin(saved);

  // ═══ Init Editor ═══

  async function initEditor() {
    setStatus('加载内容...');
    await loadIndex();
    sourceBuffer = await loadAllContent();
    publishedBuffer = sourceBuffer;
    publishedImageCache.clear();

    // Draft saving disabled for now
    // const draft = localStorage.getItem(DRAFT_KEY);
    // if (draft && confirm('发现本地未发布的草稿，是否恢复？\n选择「取消」将从服务器重新加载。')) {
    //   sourceBuffer = draft;
    //   setStatus('已恢复本地草稿');
    // } else {
    //   localStorage.removeItem(DRAFT_KEY);
    // }
    setStatus('就绪');

    initAdminModeToggle();
    updateView();
    initViewToggle();
    initPasteHandler();
    initAdminSidebar();
    await loadMaintenance();
  }

  async function loadIndex() {
    try {
      const data = await CodebergAPI.getFile('content/_index.json');
      indexSha = data.sha;
      indexData = JSON.parse(decodeBase64Utf8(data.content));
    } catch {
      const res = await fetch('../content/_index.json');
      indexData = await res.json();
    }
    if (!indexSha) {
      try {
        const data = await CodebergAPI.getFile('content/_index.json');
        indexSha = data.sha;
      } catch {}
    }
  }

  function flatFiles() {
    if (indexData.file) return [{ file: indexData.file }];
    const list = [];
    for (const sec of indexData.sections) {
      if (sec.children) {
        for (const ch of sec.children) list.push(ch);
      } else {
        list.push(sec);
      }
    }
    return list;
  }

  async function loadAllContent() {
    // Single file mode
    if (indexData.file) {
      try {
        const data = await CodebergAPI.getFile(indexData.file);
        fileShas[indexData.file] = data.sha;
        return decodeBase64Utf8(data.content);
      } catch {
        try {
          const res = await fetch('../' + indexData.file);
          return await res.text();
        } catch { return ''; }
      }
    }
    // Multi-file mode
    const flat = flatFiles();
    const results = await Promise.all(flat.map(async f => {
      try {
        const data = await CodebergAPI.getFile(f.file);
        fileShas[f.file] = data.sha;
        return decodeBase64Utf8(data.content);
      } catch {
        try {
          const res = await fetch('../' + f.file);
          return await res.text();
        } catch { return ''; }
      }
    }));
    return results.join('\n\n');
  }

  // ═══ View Toggle ═══

  function getFloorLines(text) {
    return parseAdminDoc(text).sections.map(section => section.startLine);
  }

  function parseAdminDoc(md) {
    const normalized = (md || '').replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    const headings = [];
    let inCode = false;

    lines.forEach((line, lineIndex) => {
      if (/^```/.test(line.trim())) inCode = !inCode;
      if (inCode) return;
      const match = line.match(/^(#{2,6})\s+(.+)/);
      if (!match) return;
      const rawTitle = match[2].trim();
      headings.push({
        level: match[1].length,
        rawTitle,
        title: stripHeadingMarkup(rawTitle) || rawTitle,
        lineIndex
      });
    });

    const h2s = headings.filter(heading => heading.level === 2);
    const sections = [];

    function addSection(startLine, endLine, heading, index) {
      const hasHeading = !!heading;
      const title = heading ? heading.title : '序';
      const rawTitle = heading ? heading.rawTitle : '序';
      const section = {
        key: `section-${index}`,
        index,
        floorNum: `#${index}F`,
        title,
        rawTitle,
        startLine,
        contentStartLine: hasHeading ? heading.lineIndex + 1 : startLine,
        endLine,
        hasHeading,
        childLevel: 0,
        children: [],
        entries: []
      };
      const nested = headings.filter(item => item.level > 2 && item.lineIndex >= section.contentStartLine && item.lineIndex < endLine);
      if (nested.length) section.childLevel = nested[0].level;
      const childHeadings = section.childLevel ? nested.filter(item => item.level === section.childLevel) : [];
      section.segmentStartLine = startLine;
      section.segmentEndLine = childHeadings.length ? childHeadings[0].lineIndex : endLine;
      childHeadings.forEach((childHeading, childIndex) => {
        const nextChild = childHeadings[childIndex + 1];
        section.children.push({
          key: `${section.key}-child-${childIndex}`,
          index: childIndex,
          section,
          title: childHeading.title,
          rawTitle: childHeading.rawTitle,
          startLine: childHeading.lineIndex,
          endLine: nextChild ? nextChild.lineIndex : endLine
        });
      });
      nested.forEach((heading, nestedIndex) => {
        let segmentKey = section.key;
        if (section.childLevel) {
          const owner = section.children.find(child => heading.lineIndex >= child.startLine && heading.lineIndex < child.endLine);
          if (owner) segmentKey = owner.key;
        }
        section.entries.push({
          level: heading.level,
          label: heading.title,
          rawTitle: heading.rawTitle,
          lineIndex: heading.lineIndex,
          sectionKey: section.key,
          segmentKey,
          target: `admin-${section.index}-h${nestedIndex}`
        });
      });
      sections.push(section);
    }

    if (h2s.length) {
      let index = 0;
      if (h2s[0].lineIndex > 0 && lines.slice(0, h2s[0].lineIndex).some(line => line.trim())) {
        addSection(0, h2s[0].lineIndex, null, index++);
      }
      h2s.forEach((heading, idx) => {
        const next = h2s[idx + 1];
        addSection(heading.lineIndex, next ? next.lineIndex : lines.length, heading, index++);
      });
    } else {
      addSection(0, lines.length, null, 0);
    }

    const entries = [];
    const segments = [];
    sections.forEach(section => {
      const sectionSegment = {
        key: section.key,
        type: 'section',
        section,
        title: section.title,
        startLine: section.segmentStartLine,
        endLine: section.segmentEndLine
      };
      segments.push(sectionSegment);
      entries.push({
        level: 2,
        label: `${section.floorNum} ${section.title}`,
        lineIndex: section.startLine,
        sectionKey: section.key,
        segmentKey: section.key,
        target: `admin-floor-${section.index}`
      });
      section.children.forEach(child => {
        segments.push({
          key: child.key,
          type: 'child',
          section,
          child,
          title: child.title,
          startLine: child.startLine,
          endLine: child.endLine
        });
      });
      section.entries.forEach(entry => entries.push(entry));
    });

    return {
      lines,
      sections,
      entries,
      segmentMap: new Map(segments.map(segment => [segment.key, segment])),
      firstSegmentKey: segments[0]?.key || ''
    };
  }

  function getAdminDoc() {
    adminDoc = parseAdminDoc(sourceBuffer);
    return adminDoc;
  }

  function ensureActiveSegment(doc = getAdminDoc()) {
    if (adminMode !== 'part') return null;
    if (!activeSegmentKey || !doc.segmentMap.has(activeSegmentKey)) activeSegmentKey = doc.firstSegmentKey;
    return doc.segmentMap.get(activeSegmentKey) || null;
  }

  function getSegmentMarkdown(segment, doc = getAdminDoc()) {
    if (!segment) return '';
    return doc.lines.slice(segment.startLine, segment.endLine).join('\n');
  }

  function replaceSegmentMarkdown(segment, value) {
    if (!segment) return;
    const lines = sourceBuffer.replace(/\r\n/g, '\n').split('\n');
    replaceLineRange(lines, segment.startLine, segment.endLine, value);
    sourceBuffer = lines.join('\n');
  }

  function replaceLineRange(lines, startLine, endLine, value) {
    const nextLines = (value || '').replace(/\r\n/g, '\n').split('\n');
    lines.splice(startLine, Math.max(endLine - startLine, 0), ...nextLines);
  }

  function syncSourceEditorToBuffer() {
    if (currentView !== 'source') return;
    const source = $('#source-editor');
    if (!source) return;
    if (adminMode === 'part') {
      const doc = adminDoc || getAdminDoc();
      const segment = ensureActiveSegment(doc);
      if (!activeEditRange && segment) {
        activeEditRange = {
          key: segment.key,
          startLine: segment.startLine,
          endLine: segment.endLine
        };
      }
      const range = activeEditRange || segment;
      if (!range) return;
      const startLine = range.startLine || 0;
      const lines = sourceBuffer.replace(/\r\n/g, '\n').split('\n');
      replaceLineRange(lines, range.startLine, range.endLine, source.value);
      sourceBuffer = lines.join('\n');
      const nextDoc = getAdminDoc();
      const nextSegment = [...nextDoc.segmentMap.values()].find(item => startLine >= item.startLine && startLine < item.endLine);
      if (nextSegment) activeSegmentKey = nextSegment.key;
      if (activeEditRange) {
        const delta = source.value.replace(/\r\n/g, '\n').split('\n').length - (activeEditRange.endLine - activeEditRange.startLine);
        activeEditRange.endLine += delta;
      }
      ensureActiveSegment(nextDoc);
    } else {
      sourceBuffer = source.value;
      getAdminDoc();
    }
  }

  function scrollSourceToLine(lineIndex) {
    const el = $('#source-editor');
    if (!el) return;
    const lines = el.value.split('\n');
    lineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));
    el.scrollTop = measureTextareaLineTop(el, lineIndex);
    let pos = 0;
    for (let i = 0; i < Math.min(lineIndex, lines.length); i++) pos += lines[i].length + 1;
    el.selectionStart = el.selectionEnd = Math.min(pos, el.value.length);
    el.focus();
  }

  function measureTextareaLineTop(textarea, lineIndex) {
    const style = getComputedStyle(textarea);
    const mirror = document.createElement('div');
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.pointerEvents = 'none';
    mirror.style.left = '-9999px';
    mirror.style.top = '0';
    mirror.style.width = `${textarea.clientWidth}px`;
    mirror.style.boxSizing = 'border-box';
    mirror.style.whiteSpace = textarea.wrap === 'off' ? 'pre' : 'pre-wrap';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.wordBreak = style.wordBreak;
    mirror.style.font = style.font;
    mirror.style.letterSpacing = style.letterSpacing;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.padding = style.padding;
    mirror.style.border = style.border;
    mirror.style.tabSize = style.tabSize;

    const lines = textarea.value.split('\n');
    const before = lines.slice(0, lineIndex).join('\n') + (lineIndex > 0 ? '\n' : '');
    mirror.textContent = before;
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);
    document.body.appendChild(mirror);
    const top = marker.offsetTop - (parseFloat(style.paddingTop) || 0) - 4;
    mirror.remove();
    return Math.max(0, top);
  }

  function getTextareaCaretLine(textarea) {
    return textarea.value.slice(0, textarea.selectionStart || 0).split('\n').length - 1;
  }

  function findEntryAtLine(doc, lineIndex) {
    if (!doc?.entries?.length) return null;
    let current = doc.entries[0];
    for (const entry of doc.entries) {
      if (entry.lineIndex <= lineIndex) current = entry;
      else break;
    }
    return current;
  }

  function getPreviewAnchorEntry(doc) {
    const preview = $('#rendered-preview');
    if (!preview || !doc?.entries?.length) return null;
    const threshold = preview.getBoundingClientRect().top + 32;
    let bestAbove = null;
    let firstBelow = null;
    for (const entry of doc.entries) {
      const target = document.getElementById(entry.target);
      if (!target) continue;
      const top = target.getBoundingClientRect().top;
      if (top <= threshold) {
        const distance = threshold - top;
        if (!bestAbove || distance < bestAbove.distance) bestAbove = { entry, distance };
      } else if (!firstBelow || top < firstBelow.top) {
        firstBelow = { entry, top };
      }
    }
    return bestAbove?.entry || firstBelow?.entry || doc.entries[0] || null;
  }

  function setActiveSegmentFromItem(item) {
    const segmentKey = item.dataset.segmentKey;
    if (segmentKey) activeSegmentKey = segmentKey;
  }

  function updateAdminModeButton() {
    const btn = $('#admin-mode-toggle');
    if (!btn) return;
    btn.textContent = adminMode;
    btn.dataset.mode = adminMode;
    btn.setAttribute('aria-pressed', adminMode === 'part' ? 'true' : 'false');
  }

  function initAdminModeToggle() {
    const btn = $('#admin-mode-toggle');
    if (!btn) return;
    updateAdminModeButton();
    btn.addEventListener('click', () => {
      syncSourceEditorToBuffer();
      adminMode = adminMode === 'all' ? 'part' : 'all';
      activeEditRange = null;
      saveAdminMode(adminMode);
      updateAdminModeButton();
      const doc = getAdminDoc();
      if (adminMode === 'part') {
        const floorLines = getFloorLines(sourceBuffer);
        let firstLine = 0;
        if (currentView === 'source') {
          const source = $('#source-editor');
          firstLine = source ? getTextareaCaretLine(source) : 0;
        } else {
          const preview = $('#rendered-preview');
          const floors = preview ? [...preview.querySelectorAll('.floor')] : [];
          floors.forEach((floor, idx) => {
            if (preview && floor.offsetTop - 60 <= preview.scrollTop) firstLine = floorLines[idx] || 0;
          });
        }
        let sectionIdx = 0;
        for (let i = floorLines.length - 1; i >= 0; i--) {
          if (floorLines[i] <= firstLine) { sectionIdx = i; break; }
        }
        activeSegmentKey = doc.sections[Math.max(sectionIdx, 0)]?.key || doc.firstSegmentKey;
      }
      ensureActiveSegment(doc);
      updateView();
    });
  }

  function initViewToggle() {
    $('#view-toggle').addEventListener('click', e => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      const view = btn.dataset.view;
      if (view === currentView) return;

      let anchorIdx = 0;
      let anchorLine = 0;
      let anchorTarget = '';
      if (currentView === 'source') {
        const el = $('#source-editor');
        pushUndo();
        syncSourceEditorToBuffer();
        const doc = getAdminDoc();
        const segment = adminMode === 'part' ? (activeEditRange || ensureActiveSegment(doc)) : null;
        const firstLine = (segment?.startLine || 0) + getTextareaCaretLine(el);
        const entry = findEntryAtLine(doc, firstLine);
        anchorLine = entry ? entry.lineIndex : firstLine;
        anchorTarget = entry?.target || '';
        const floorLines = doc.sections.map(section => section.startLine);
        for (let k = floorLines.length - 1; k >= 0; k--) {
          if (floorLines[k] <= firstLine) { anchorIdx = k; break; }
        }
      } else {
        const doc = getAdminDoc();
        const entry = getPreviewAnchorEntry(doc);
        if (entry) {
          anchorLine = entry.lineIndex;
          anchorTarget = entry.target;
        }
        const preview = $('#rendered-preview');
        const floors = preview.querySelectorAll('.floor');
        const scrollTop = preview.scrollTop;
        floors.forEach((floor, i) => {
          if (floor.offsetTop - 60 <= scrollTop) anchorIdx = i;
        });
      }

      currentView = view;
      $('#view-toggle').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateView();

      setTimeout(() => {
        if (currentView === 'source') {
          if (adminMode === 'part') {
            const doc = getAdminDoc();
            const segment = ensureActiveSegment(doc);
            scrollSourceToLine(segment ? Math.max(0, anchorLine - segment.startLine) : 0);
            return;
          }
          scrollSourceToLine(anchorLine);
        } else {
          const target = anchorTarget ? document.getElementById(anchorTarget) : null;
          if (target) target.scrollIntoView({ block: 'start' });
          else {
            const floors = document.querySelectorAll('#rendered-preview .floor');
            if (floors[anchorIdx]) floors[anchorIdx].scrollIntoView({ block: 'start' });
          }
        }
      }, 50);
    });
  }

  function updateView() {
    const source = $('#source-editor');
    const rendered = $('#rendered-preview');

    if (currentView === 'source') {
      source.style.display = '';
      rendered.style.display = 'none';
      const doc = getAdminDoc();
      const segment = ensureActiveSegment(doc);
      activeEditRange = adminMode === 'part' && segment ? {
        key: segment.key,
        startLine: segment.startLine,
        endLine: segment.endLine
      } : null;
      source.value = adminMode === 'part' && segment ? getSegmentMarkdown(segment, doc) : sourceBuffer;
      source.focus();
    } else {
      activeEditRange = null;
      source.style.display = 'none';
      rendered.style.display = '';
      renderPreview();
    }
  }

  // ═══ Rendered Preview ═══

  const IMG_URL_RE = /(https?:\/\/[^\s<>)\]"']+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?[^\s<>)\]"']*)?)/gi;
  const WORD_JOINER = '\u2060';

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

    // Auto-convert bare image URLs, protect lone "-"
    let inCode = false;
    md = md.split('\n').map(line => {
      if (/^```/.test(line)) inCode = !inCode;
      if (inCode) return line;
      if (/^\s*-\s*$/.test(line)) return '\uFFFC';
      if (/^\s{4}/.test(line) || /!\[.*?\]\(/.test(line)) return line;
      return line.replace(IMG_URL_RE, '![image]($1)');
    }).join('\n');

    // Protect fenced code blocks
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

  function renderPreview() {
    const container = $('#rendered-preview');
    const doc = getAdminDoc();
    const md = expandImages(sourceBuffer.trim());

    if (!md) {
      container.innerHTML = '<div class="paste-hint">从石墨文档粘贴内容到此处 (Ctrl+V)</div>';
      buildAdminToc(doc);
      return;
    }

    if (adminMode === 'part') {
      const segment = ensureActiveSegment(doc);
      container.innerHTML = segment ? renderAdminPartPreview(segment, doc) : '<div class="paste-hint">没有可预览的分段。</div>';
    } else {
      container.innerHTML = doc.sections.map(section => renderAdminSectionPreview(section, doc, false)).join('');
    }
    assignAdminPreviewAnchors(doc);

    container.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    buildAdminToc(doc);
  }

  function renderAdminSectionPreview(section, doc, partMode) {
    let bodyHtml;
    if (partMode && section.children.length) {
      bodyHtml = `<div class="part-grid">${section.children.map((child, idx) => `
        <a class="part-nav-card" href="#" data-segment-key="${escapeHtml(child.key)}">
          <span class="part-nav-index">${String(idx + 1).padStart(2, '0')}</span>
          <span class="part-nav-title">${escapeHtml(child.title)}</span>
        </a>`).join('')}</div>`;
    } else {
      const start = section.hasHeading ? section.contentStartLine : section.startLine;
      const bodyMd = doc.lines.slice(start, section.endLine).join('\n');
      bodyHtml = renderMd(expandImages(bodyMd));
    }
    return `<div class="floor${partMode ? ' floor-part' : ''}" id="admin-floor-${section.index}">
      <div class="floor-header">${escapeHtml(section.floorNum)} &nbsp; ${escapeHtml(section.title)}</div>
      <div class="floor-body">${bodyHtml}</div>
    </div>`;
  }

  function renderAdminPartPreview(segment, doc) {
    if (segment.type === 'section') return renderAdminSectionPreview(segment.section, doc, true);
    const md = getSegmentMarkdown(segment, doc);
    return `<div class="floor floor-part" id="admin-floor-${segment.section.index}">
      <div class="floor-header">${escapeHtml(segment.section.floorNum)} &nbsp; ${escapeHtml(segment.section.title)}</div>
      <div class="floor-body">${renderMd(expandImages(md))}</div>
    </div>`;
  }

  function assignAdminPreviewAnchors(doc) {
    const preview = $('#rendered-preview');
    if (!preview || !doc) return;
    doc.sections.forEach(section => {
      const floor = preview.querySelector(`#admin-floor-${section.index}`);
      if (!floor) return;
      const headings = [...floor.querySelectorAll('.floor-body h3, .floor-body h4, .floor-body h5, .floor-body h6')];
      const used = new Set();
      section.entries.forEach(entry => {
        if (adminMode === 'part' && activeSegmentKey && entry.segmentKey !== activeSegmentKey && entry.level > 2) return;
        const target = headings.find((h, idx) => !used.has(idx) && h.tagName.toLowerCase() === `h${entry.level}` && stripHeadingMarkup(h.textContent) === entry.label);
        if (target) used.add(headings.indexOf(target));
        if (target) target.id = entry.target;
      });
    });
  }

  // ═══ Paste Handler ═══

  function initPasteHandler() {
    const sourceEl = $('#source-editor');
    const renderedEl = $('#rendered-preview');

    // Paste in source textarea
    sourceEl.addEventListener('paste', e => {
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      const files = e.clipboardData.files;

      // Handle pasted images
      if (files && files.length > 0) {
        e.preventDefault();
        handlePastedImages(files, sourceEl);
        return;
      }

      if (html && html.trim()) {
        e.preventDefault();
        const md = htmlToMarkdown(html, text);
        insertAtCursor(sourceEl, md);
        syncSourceEditorToBuffer();
        buildAdminToc(adminDoc);
        saveDraft();
        downloadShimoImages(sourceBuffer).then(updated => {
          if (updated !== sourceBuffer) {
            sourceBuffer = collapseImages(updated);
            updateView();
            saveDraft();
          }
        });
      }
      setTimeout(() => {
        syncSourceEditorToBuffer();
        buildAdminToc(adminDoc);
        saveDraft();
      }, 0);
    });

    // Paste in rendered preview
    renderedEl.addEventListener('paste', e => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      const files = e.clipboardData.files;

      // Handle pasted images
      if (files && files.length > 0) {
        handlePastedImagesBuffer(files);
        return;
      }

      let md = '';
      if (html && html.trim()) {
        md = htmlToMarkdown(html, text);
      } else if (text) {
        md = text;
      }

      if (md) {
        pushUndo();
        appendMarkdownToActiveContext(md);
        renderPreview();
        saveDraft();
        downloadShimoImages(sourceBuffer).then(updated => {
          if (updated !== sourceBuffer) {
            sourceBuffer = collapseImages(updated);
            renderPreview();
            saveDraft();
          }
        });
      }
    });

    // Also handle paste on source input change
    sourceEl.addEventListener('input', debounce(() => {
      syncSourceEditorToBuffer();
      buildAdminToc(adminDoc);
      saveDraft();
    }, 1500));
  }

  function appendMarkdownToActiveContext(md) {
    if (adminMode === 'part') {
      const doc = getAdminDoc();
      const segment = ensureActiveSegment(doc);
      const current = getSegmentMarkdown(segment, doc);
      replaceSegmentMarkdown(segment, current + (current ? '\n\n' : '') + md);
      getAdminDoc();
      return;
    }
    sourceBuffer += (sourceBuffer ? '\n\n' : '') + md;
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + text + after;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  function handlePastedImages(files, textarea) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        imageCounter++;
        const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        imageMap[imageCounter] = { data: reader.result, ext };
        insertAtCursor(textarea, `![Image_${imageCounter}](img://${imageCounter})`);
        syncSourceEditorToBuffer();
        saveDraft();
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePastedImagesBuffer(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        imageCounter++;
        const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        imageMap[imageCounter] = { data: reader.result, ext };
        appendMarkdownToActiveContext(`![Image_${imageCounter}](img://${imageCounter})`);
        renderPreview();
        saveDraft();
      };
      reader.readAsDataURL(file);
    }
  }

  function collapseImages(md) {
    return md.replace(/!\[([^\]]*)\]\((data:image\/([^;]+);base64,[^)]+)\)/g, (m, alt, dataUrl, ext) => {
      imageCounter++;
      imageMap[imageCounter] = { data: dataUrl, ext: ext === 'jpeg' ? 'jpg' : ext };
      return `![Image_${imageCounter}](img://${imageCounter})`;
    });
  }

  function expandImages(md) {
    return md.replace(/!\[Image_(\d+)\]\(img:\/\/(\d+)\)/g, (m, _, id) => {
      const img = imageMap[+id];
      return img ? `![Image_${id}](${img.data})` : m;
    });
  }

  // ═══ HTML to Markdown Converter ═══

  function htmlToMarkdown(html, plainText = '') {
    const div = document.createElement('div');
    div.innerHTML = html;
    // Clean up Shimo/Google Docs wrapper elements
    removeEmptySpans(div);
    let result = recoverListBlocksFromPlainText(processNode(div), plainText);
    // Clean up excessive blank lines (max 2 consecutive)
    return normalizeWhiteTextStyles(result.trim());
  }

  function removeEmptySpans(el) {
    el.querySelectorAll('span').forEach(span => {
      if (!span.getAttribute('style') && !span.className && span.childNodes.length === 1 && span.firstChild.nodeType === Node.TEXT_NODE) {
        span.replaceWith(span.firstChild);
      }
    });
  }

  function processNode(node) {
    let result = '';
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        result = appendChunk(result, child.textContent);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        result = appendChunk(result, processElement(child));
      }
    }
    return result;
  }

  function processList(el, depth = 0, ordered = false) {
    const items = [];
    Array.from(el.children).forEach((child, index) => {
      if (!child.tagName || child.tagName.toLowerCase() !== 'li') return;
      const item = processListItem(child, depth, ordered, index);
      if (item) items.push(item);
    });
    return items.join('\n') + (items.length ? '\n\n' : '');
  }

  function processListItem(li, depth, ordered, index) {
    const indent = '  '.repeat(depth);
    const marker = ordered ? `${index + 1}. ` : '- ';
    let inline = '';
    const nestedBlocks = [];

    for (const child of li.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        inline = appendChunk(inline, child.textContent);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') {
        const nested = processList(child, depth + 1, tag === 'ol').trimEnd();
        if (nested) nestedBlocks.push(nested);
      } else {
        inline = appendChunk(inline, processElement(child));
      }
    }

    const text = inline.replace(/\n{3,}/g, '\n\n').trim();
    let line = `${indent}${marker}`.trimEnd();
    if (text) {
      const lines = text.split('\n').map(part => part.trim());
      line = `${indent}${marker}${lines[0]}`;
      for (let i = 1; i < lines.length; i++) {
        line += `\n${indent}  ${lines[i]}`;
      }
    }
    if (nestedBlocks.length) line += `\n${nestedBlocks.join('\n')}`;
    return line;
  }

  function processElement(el) {
    const tag = el.tagName.toLowerCase();
    const inner = processNode(el);

    switch (tag) {
      case 'h1': return `# ${inner.trim()}\n`;
      case 'h2': return `## ${inner.trim()}\n`;
      case 'h3': return `### ${inner.trim()}\n`;
      case 'h4': return `#### ${inner.trim()}\n`;
      case 'h5': return `##### ${inner.trim()}\n`;
      case 'h6': return `###### ${inner.trim()}\n`;

      case 'p': {
        const trimmed = inner.trim();
        if (!trimmed) return '\n';
        return `${trimmed}\n`;
      }

      case 'br': return '\n';
      case 'hr': return '\n---\n\n';

      case 'strong': case 'b':
        return wrapDelimited(inner, '**');
      case 'em': case 'i':
        return wrapDelimited(inner, '*');
      case 'u':
        return wrapHtmlTag(inner, 'u');
      case 's': case 'del': case 'strike':
        return wrapDelimited(inner, '~~');

      case 'a': {
        const href = el.getAttribute('href');
        if (href && inner.trim()) return `[${inner.trim()}](${href})`;
        return inner;
      }

      case 'img': {
        const src = el.getAttribute('src');
        if (!src) return '';
        if (/^data:image\/([^;]+);base64,/.test(src)) {
          imageCounter++;
          const ext = RegExp.$1 === 'jpeg' ? 'jpg' : RegExp.$1;
          imageMap[imageCounter] = { data: src, ext };
          return `![Image_${imageCounter}](img://${imageCounter})`;
        }
        const alt = el.getAttribute('alt') || 'image';
        return `![${alt}](${src})`;
      }

      case 'ul':
        return processList(el, 0, false);

      case 'ol':
        return processList(el, 0, true);

      case 'li':
        return inner;

      case 'blockquote': {
        const lines = inner.trim().split('\n');
        return lines.map(l => `> ${l}`).join('\n') + '\n\n';
      }

      case 'code': {
        if (el.parentElement && el.parentElement.tagName.toLowerCase() === 'pre') {
          return inner;
        }
        return `\`${inner}\``;
      }

      case 'pre': {
        const codeEl = el.querySelector('code');
        const lang = codeEl ? (codeEl.className.match(/language-(\w+)/)?.[1] || '') : '';
        const content = codeEl ? codeEl.textContent : inner;
        return `\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
      }

      case 'span':
        return renderStyledInline(inner, el.getAttribute('style') || '');

      case 'font':
        return renderStyledInline(inner, el.getAttribute('style') || '', el.getAttribute('color') || '');

      case 'div': {
        const trimmed = inner.trim();
        if (!trimmed) return '\n';
        return trimmed + '\n';
      }

      case 'table': return processTable(el);
      case 'thead': case 'tbody': case 'tfoot': return inner;
      case 'tr': case 'th': case 'td': return inner;

      case 'sup': return `<sup>${inner}</sup>`;
      case 'sub': return `<sub>${inner}</sub>`;

      default: return inner;
    }
  }

  function processTable(table) {
    const rows = table.querySelectorAll('tr');
    if (!rows.length) return '';

    const data = [];
    rows.forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(cell => {
        cells.push(processNode(cell).trim().replace(/\|/g, '\\|'));
      });
      data.push(cells);
    });

    if (!data.length) return '';

    const colCount = Math.max(...data.map(r => r.length));
    let md = '';

    // Header row
    md += '| ' + data[0].map(c => c || ' ').join(' | ') + ' |\n';
    md += '| ' + Array(colCount).fill('---').join(' | ') + ' |\n';

    // Data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      while (row.length < colCount) row.push(' ');
      md += '| ' + row.map(c => c || ' ').join(' | ') + ' |\n';
    }

    return md + '\n';
  }

  // ═══ Auto Save (disabled for now) ═══

  // function initAutoSave() {
  //   setInterval(() => {
  //     if (currentView === 'source') {
  //       sourceBuffer = $('#source-editor').value;
  //     }
  //   }, 5000);
  // }

  function saveDraft() {
    // Draft saving disabled for now
    // localStorage.setItem(DRAFT_KEY, sourceBuffer);
    // setStatus(`草稿已保存 | ${new Date().toLocaleTimeString()}`);
  }

  // ═══ Undo / Redo ═══

  let undoStack = [];
  let redoStack = [];

  function pushUndo() {
    undoStack.push(sourceBuffer);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
  }

  function undo() {
    if (!undoStack.length) return;
    syncSourceEditorToBuffer();
    redoStack.push(sourceBuffer);
    sourceBuffer = undoStack.pop();
    updateView();
  }

  function redo() {
    if (!redoStack.length) return;
    syncSourceEditorToBuffer();
    undoStack.push(sourceBuffer);
    sourceBuffer = redoStack.pop();
    updateView();
  }

  document.addEventListener('keydown', e => {
    if (currentView === 'source') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
  });

  // Undo/Redo buttons
  const undoBtn = $('#undo-btn');
  const redoBtn = $('#redo-btn');
  if (undoBtn) undoBtn.addEventListener('click', undo);
  if (redoBtn) redoBtn.addEventListener('click', redo);

  // ═══ Shimo Image Download ═══

  async function fetchAsDataUrl(url) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {}
    // Fallback: canvas approach
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
      });
    } catch {}
    return null;
  }

  async function downloadShimoImages(md) {
    const re = /(!\[[^\]]*\]\()(https?:\/\/[^\s)]*(?:shimonote\.com|shimo\.im)[^\s)]*\))/gi;
    const matches = [...md.matchAll(re)];
    if (!matches.length) return md;
    setStatus(`下载石墨图片 (0/${matches.length})...`);
    let result = md;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const url = m[2].slice(0, -1); // remove trailing )
      setStatus(`下载石墨图片 (${i + 1}/${matches.length})...`);
      const dataUrl = await fetchAsDataUrl(url);
      if (dataUrl) {
        result = result.replace(m[0], `${m[1]}${dataUrl})`);
      }
    }
    setStatus('就绪');
    return result;
  }

  // ═══ Publish ═══

  const publishModal = $('#publish-modal');
  const publishTitle = $('#publish-modal .publish-modal-title');
  const publishSteps = $('#publish-steps');
  const publishProgressTrack = $('#publish-progress-track');
  const publishProgressBar = $('#publish-progress-bar');
  const publishProgressText = $('#publish-progress-text');
  const publishFooter = $('#publish-modal-footer');
  const publishCloseBtn = $('#publish-close-btn');
  if (publishCloseBtn) publishCloseBtn.addEventListener('click', () => { publishModal.style.display = 'none'; });

  let stepEls = [];
  function updatePublishProgress() {
    const total = stepEls.length;
    const completed = stepEls.filter(el => el.classList.contains('done') || el.classList.contains('error')).length;
    const percent = total ? Math.round(completed / total * 100) : 0;
    if (publishProgressTrack) publishProgressTrack.setAttribute('aria-valuenow', String(percent));
    if (publishProgressBar) publishProgressBar.style.width = `${percent}%`;
    if (publishProgressText) publishProgressText.textContent = `${completed} / ${total}`;
  }
  function initSteps(names) {
    stepEls = [];
    publishSteps.innerHTML = '';
    names.forEach(name => {
      const div = document.createElement('div');
      div.className = 'publish-step pending';
      div.innerHTML = `<span class="step-icon"></span><span class="step-label">${name}</span>`;
      publishSteps.appendChild(div);
      stepEls.push(div);
    });
    publishSteps.scrollTop = 0;
    updatePublishProgress();
  }
  function setStep(idx, state) {
    if (stepEls[idx]) stepEls[idx].className = `publish-step ${state}`;
    updatePublishProgress();
  }

  $('#publish-btn').addEventListener('click', publish);

  async function publish() {
    syncSourceEditorToBuffer();

    const btn = $('#publish-btn');
    btn.disabled = true;

    let md = expandImages(sourceBuffer);
    const images = extractMarkdownImages(md);
    const publishedImages = extractMarkdownImages(publishedBuffer);
    const pendingImages = images.filter(img => img.kind === 'data' || img.kind === 'external');

    const stepNames = [];
    pendingImages.forEach((_, i) => stepNames.push(`处理图片 ${i + 1}/${pendingImages.length}`));
    stepNames.push('上传内容');
    stepNames.push('更新索引');

    if (publishTitle) publishTitle.textContent = '发布中';
    initSteps(stepNames);
    publishFooter.style.display = 'none';
    publishModal.style.display = '';
    let si = 0;

    try {
      for (const img of images) {
        if (img.kind !== 'data' && img.kind !== 'external') continue;
        setStep(si, 'running');
        try {
          let payload = null;
          if (img.kind === 'data') {
            payload = dataUrlToImageData(img.src);
          } else {
            const dataUrl = await fetchAsDataUrl(img.src);
            payload = dataUrl ? dataUrlToImageData(dataUrl) : null;
          }
          if (!payload) throw new Error('图片读取失败');

          const original = publishedImages[img.order];
          const originalPath = original ? repoImagePathFromSrc(original.src) : '';
          const originalB64 = originalPath ? await getPublishedImageBase64(original.src) : null;
          if (originalB64 && originalB64 === payload.b64) {
            img.replacement = `![${img.alt}](/${originalPath})`;
          } else {
            const fname = `${img.order + 1}.${payload.ext}`;
            await CodebergAPI.uploadImage(fname, payload.b64, `Upload ${fname}`);
            img.replacement = `![${img.alt}](/images/${fname})`;
          }
          setStep(si, 'done');
        } catch(e) {
          console.error('Image processing failed:', e);
          setStep(si, 'error');
        }
        si++;
      }
      if (pendingImages.length) {
        md = rebuildMarkdownWithImageReplacements(md, images);
        sourceBuffer = md;
      }

      // Save content
      setStep(si, 'running');
      const mainFile = 'content/main.md';
      try {
        if (!fileShas[mainFile]) {
          try {
            const existing = await CodebergAPI.getFile(mainFile);
            fileShas[mainFile] = existing.sha;
          } catch {}
        }
        const result = await CodebergAPI.putFile(mainFile, md, 'Update content', fileShas[mainFile]);
        fileShas[mainFile] = result.content.sha;
        setStep(si, 'done');
      } catch(e) {
        console.error('Save content failed:', e);
        setStep(si, 'error');
        throw e;
      }
      si++;

      // Update index
      setStep(si, 'running');
      const newIndex = {
        title: indexData.title || 'The PotPvP Directory ~ 漠海拾遗',
        file: mainFile
      };
      try {
        const result = await CodebergAPI.putFile(
          'content/_index.json',
          JSON.stringify(newIndex, null, 2),
          'Update index to single file mode',
          indexSha
        );
        indexSha = result.content.sha;
        indexData = newIndex;
        setStep(si, 'done');
      } catch(e) {
        try {
          const fresh = await CodebergAPI.getFile('content/_index.json');
          const result = await CodebergAPI.putFile('content/_index.json', JSON.stringify(newIndex, null, 2), 'Update index', fresh.sha);
          indexSha = result.content.sha;
          indexData = newIndex;
          setStep(si, 'done');
        } catch(e2) { console.error('Index update failed:', e2); setStep(si, 'error'); }
      }

      localStorage.removeItem(DRAFT_KEY);
      publishedBuffer = md;
      publishedImageCache.clear();
      imageMap = {};
      imageCounter = 0;
      if (publishTitle) publishTitle.textContent = '发布成功';
      setStatus(`发布成功 | ${new Date().toLocaleTimeString()}`);
      $('#status-text').textContent = '已发布';
    } catch(e) {
      console.error('Publish failed:', e);
      if (publishTitle) publishTitle.textContent = '发布失败';
      setStatus(`发布失败: ${e.message}`);
    } finally {
      btn.disabled = false;
      publishFooter.style.display = '';
    }
  }

  // ═══ Maintenance Mode ═══

  async function loadMaintenance() {
    try {
      const data = await CodebergAPI.getFile('maintenance.json');
      maintSha = data.sha;
      const parsed = JSON.parse(decodeBase64Utf8(data.content));
      maintActive = !!parsed.active;
    } catch {
      maintActive = false;
    }
    updateMaintBtn();
  }

  function updateMaintBtn() {
    const btn = $('#maint-toggle');
    if (!btn) return;
    btn.classList.toggle('active', maintActive);
    btn.textContent = maintActive ? '维护中' : '维护';
    btn.title = maintActive ? '关闭维护模式' : '开启维护模式';
    const badge = $('#admin-maint-badge');
    if (badge) badge.hidden = !maintActive;
  }

  $('#maint-toggle').addEventListener('click', async () => {
    const newState = !maintActive;
    const msg = newState
      ? '确定开启维护模式？\n开启后用户将无法访问文档主页。'
      : '确定关闭维护模式？\n关闭后文档主页将恢复正常访问。';
    if (!confirm(msg)) return;
    const btn = $('#maint-toggle');
    btn.disabled = true;
    try {
      maintActive = !maintActive;
      const content = JSON.stringify({ active: maintActive });
      const result = await CodebergAPI.putFile('maintenance.json', content, maintActive ? 'Enable maintenance' : 'Disable maintenance', maintSha);
      maintSha = result.content.sha;
      updateMaintBtn();
      setStatus(maintActive ? '已开启维护模式' : '已关闭维护模式');
    } catch (e) {
      maintActive = !maintActive;
      console.error('Toggle maintenance failed:', e);
      setStatus('维护模式切换失败: ' + e.message);
    } finally {
      btn.disabled = false;
    }
  });

  // ═══ Admin Sidebar & TOC ═══

  function buildAdminToc(doc = getAdminDoc()) {
    const tocEl = $('#admin-toc');
    if (!tocEl) return;
    const segment = adminMode === 'part' ? ensureActiveSegment(doc) : null;
    tocEl.innerHTML = doc.entries.map(entry => {
      const classes = ['toc-item', `toc-h${entry.level}`];
      if (segment) {
        if (entry.level === 2 && entry.sectionKey === segment.section.key) classes.push('active');
        else if (entry.segmentKey === segment.key) classes.push('active-sub');
      }
      return `<li><a class="${classes.join(' ')}" data-target="${escapeHtml(entry.target)}" data-level="${entry.level}" data-label="${escapeHtml(entry.label)}" data-line="${entry.lineIndex}" data-segment-key="${escapeHtml(entry.segmentKey)}">${escapeHtml(entry.label)}</a></li>`;
    }).join('');
  }

  function findEntryForItem(doc, item) {
    const target = item.dataset.target || '';
    const level = Number(item.dataset.level || 0);
    const label = item.dataset.label || '';
    const oldLine = Number(item.dataset.line || 0);
    const matches = doc.entries.filter(entry => entry.level === level && entry.label === label);
    if (matches.length) {
      return matches.reduce((best, entry) => Math.abs(entry.lineIndex - oldLine) < Math.abs(best.lineIndex - oldLine) ? entry : best, matches[0]);
    }
    return doc.entries.find(entry => entry.target === target) || null;
  }

  function scrollPreviewToTarget(targetId) {
    setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function initAdminSidebar() {
    const menuBtn = $('#admin-menu-btn');
    const overlay = $('#sidebar-overlay');
    const sidebar = $('#sidebar');

    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.contains('open') ? closeAdminSidebar() : openAdminSidebar();
      });
    }
    if (overlay) {
      overlay.addEventListener('click', closeAdminSidebar);
    }

    const tocEl = $('#admin-toc');
    if (tocEl) {
      tocEl.addEventListener('click', e => {
        const item = e.target.closest('[data-target]');
        if (!item) return;
        e.preventDefault();
        const oldLine = Number(item.dataset.line || 0);
        let doc;

        if (currentView === 'source') {
          syncSourceEditorToBuffer();
          doc = getAdminDoc();
          const freshEntry = findEntryForItem(doc, item);
          const lineIndex = freshEntry ? freshEntry.lineIndex : oldLine;
          if (adminMode === 'part') {
            if (freshEntry) activeSegmentKey = freshEntry.segmentKey;
            else setActiveSegmentFromItem(item);
            activeEditRange = null;
            const segment = ensureActiveSegment(doc);
            updateView();
            setTimeout(() => scrollSourceToLine(segment ? Math.max(0, lineIndex - segment.startLine) : 0), 0);
          } else {
            scrollSourceToLine(lineIndex);
          }
          closeAdminSidebar();
          return;
        }

        if (adminMode === 'part') {
          doc = getAdminDoc();
          const freshEntry = findEntryForItem(doc, item);
          if (freshEntry) activeSegmentKey = freshEntry.segmentKey;
          else setActiveSegmentFromItem(item);
          activeEditRange = null;
          updateView();
        }

        scrollPreviewToTarget(item.dataset.target);

        closeAdminSidebar();
      });
    }

    // Scroll-based TOC active highlight
    const preview = $('#rendered-preview');
    if (preview) {
      preview.addEventListener('click', e => {
        const card = e.target.closest('.part-nav-card[data-segment-key]');
        if (!card) return;
        e.preventDefault();
        activeSegmentKey = card.dataset.segmentKey;
        activeEditRange = null;
        updateView();
      });

      preview.addEventListener('scroll', () => {
        if (adminMode === 'part') return;
        const floors = document.querySelectorAll('#rendered-preview .floor');
        const scrollTop = preview.scrollTop;
        let activeIdx = 0;
        floors.forEach((floor, i) => {
          if (floor.offsetTop - 60 <= scrollTop) activeIdx = i;
        });
        const allItems = document.querySelectorAll('#admin-toc .toc-item');
        allItems.forEach(item => { item.classList.remove('active'); item.classList.remove('active-sub'); });
        const tocH2s = document.querySelectorAll('#admin-toc .toc-h2');
        if (tocH2s[activeIdx]) {
          tocH2s[activeIdx].classList.add('active');
          // Sub-heading ancestry highlight
          const subItems = [];
          let sib = tocH2s[activeIdx].closest('li')?.nextElementSibling;
          while (sib) {
            const a = sib.querySelector('.toc-item');
            if (!a || a.classList.contains('toc-h2')) break;
            subItems.push(a);
            sib = sib.nextElementSibling;
          }
          if (subItems.length) {
            const containerRect = preview.getBoundingClientRect();
            let currentSub = null;
            for (const item of subItems) {
              const target = document.getElementById(item.dataset.target);
              if (target && target.getBoundingClientRect().top <= containerRect.top + 60) currentSub = item;
            }
            if (currentSub) {
              currentSub.classList.add('active-sub');
              const level = currentSub.classList.contains('toc-h6') ? 6 :
                            currentSub.classList.contains('toc-h5') ? 5 :
                            currentSub.classList.contains('toc-h4') ? 4 : 3;
              if (level > 3) {
                let prev = currentSub.closest('li')?.previousElementSibling;
                let needH5 = level >= 6, needH4 = level >= 5, needH3 = true;
                while (prev && (needH3 || needH4 || needH5)) {
                  const a = prev.querySelector('.toc-item');
                  if (!a || a.classList.contains('toc-h2')) break;
                  if (needH5 && a.classList.contains('toc-h5')) { a.classList.add('active-sub'); needH5 = false; }
                  if (needH4 && a.classList.contains('toc-h4')) { a.classList.add('active-sub'); needH4 = false; }
                  if (needH3 && a.classList.contains('toc-h3')) { a.classList.add('active-sub'); needH3 = false; }
                  prev = prev.previousElementSibling;
                }
              }
            }
          }
        }
      });
    }
  }

  function openAdminSidebar() {
    $('#sidebar').classList.add('open');
    $('#sidebar-overlay').classList.add('open');
  }

  function closeAdminSidebar() {
    $('#sidebar').classList.remove('open');
    $('#sidebar-overlay').classList.remove('open');
  }
})();
