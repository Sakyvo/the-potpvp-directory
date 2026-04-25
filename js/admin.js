(function() {
  'use strict';

  const $ = s => document.querySelector(s);
  const DRAFT_KEY = 'ppd_global_draft';

  let indexData = null;
  let indexSha = null;
  let fileShas = {};
  let sourceBuffer = '';
  let currentView = 'rendered';
  let maintSha = null;
  let maintActive = false;
  let imageMap = {};
  let imageCounter = 0;
  let publishedBuffer = '';
  const publishedImageCache = new Map();

  function setStatus(t) { $('#footer-status').textContent = t; }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

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
    const lines = text.split('\n');
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^## .+/.test(lines[i])) {
        if (result.length === 0 && lines.slice(0, i).some(l => l.trim())) result.push(0);
        result.push(i);
      }
    }
    if (result.length === 0) result.push(0);
    return result;
  }

  function initViewToggle() {
    $('#view-toggle').addEventListener('click', e => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      const view = btn.dataset.view;
      if (view === currentView) return;

      let anchorIdx = 0;
      if (currentView === 'source') {
        const el = $('#source-editor');
        pushUndo();
        sourceBuffer = el.value;
        const lineH = parseFloat(getComputedStyle(el).lineHeight) || 24;
        const firstLine = Math.floor(el.scrollTop / lineH);
        const floorLines = getFloorLines(sourceBuffer);
        for (let k = floorLines.length - 1; k >= 0; k--) {
          if (floorLines[k] <= firstLine) { anchorIdx = k; break; }
        }
      } else {
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
          const el = $('#source-editor');
          const lineH = parseFloat(getComputedStyle(el).lineHeight) || 24;
          const floorLines = getFloorLines(sourceBuffer);
          const targetLine = anchorIdx < floorLines.length ? floorLines[anchorIdx] : 0;
          el.scrollTop = targetLine * lineH;
        } else {
          const floors = document.querySelectorAll('#rendered-preview .floor');
          if (floors[anchorIdx]) floors[anchorIdx].scrollIntoView({ block: 'start' });
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
      source.value = sourceBuffer;
      source.focus();
    } else {
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
    const md = expandImages(sourceBuffer.trim());

    if (!md) {
      container.innerHTML = '<div class="paste-hint">从石墨文档粘贴内容到此处 (Ctrl+V)</div>';
      return;
    }

    // Split by h2 and render as floors
    const hasH2 = /^## .+/m.test(md);
    if (hasH2) {
      const floors = splitByH2(md);
      let html = '';
      floors.forEach((floor, i) => {
        const title = floor.title || '序';
        html += `<div class="floor" id="admin-floor-${i}">
          <div class="floor-header">#${i}F &nbsp; ${title}</div>
          <div class="floor-body">${renderMd(floor.md)}</div>
        </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = `<div class="floor" id="admin-floor-0">
        <div class="floor-body">${renderMd(md)}</div>
      </div>`;
    }

    // External links → new tab
    container.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    buildAdminToc();
  }

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
        sourceBuffer = sourceEl.value;
        saveDraft();
        downloadShimoImages(sourceBuffer).then(updated => {
          if (updated !== sourceBuffer) {
            sourceBuffer = collapseImages(updated);
            sourceEl.value = sourceBuffer;
            saveDraft();
          }
        });
      }
      // If no HTML, let default plain text paste happen
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
        sourceBuffer += (sourceBuffer ? '\n\n' : '') + md;
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
      sourceBuffer = sourceEl.value;
      saveDraft();
    }, 1500));
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
        sourceBuffer = textarea.value;
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
        sourceBuffer += (sourceBuffer ? '\n\n' : '') + `![Image_${imageCounter}](img://${imageCounter})`;
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
    redoStack.push(sourceBuffer);
    sourceBuffer = undoStack.pop();
    renderPreview();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(sourceBuffer);
    sourceBuffer = redoStack.pop();
    renderPreview();
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
    if (currentView === 'source') {
      sourceBuffer = $('#source-editor').value;
    }

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
        title: indexData.title || 'pdir.cc.cd',
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

  function buildAdminToc() {
    const tocEl = $('#admin-toc');
    if (!tocEl) return;
    let html = '';
    document.querySelectorAll('#rendered-preview .floor').forEach((floorEl, i) => {
      const headerEl = floorEl.querySelector('.floor-header');
      let title = headerEl ? headerEl.textContent.trim() : '';
      title = title.replace(/^#\d+F[\s\u00a0]*/, '').trim() || '序';
      html += `<li><a class="toc-item toc-h2" data-target="admin-floor-${i}">#${i}F ${title}</a></li>`;
      floorEl.querySelectorAll('.floor-body h3, .floor-body h4, .floor-body h5, .floor-body h6').forEach((h, j) => {
        const level = h.tagName.toLowerCase();
        const hId = `admin-${i}-h${j}`;
        h.id = hId;
        html += `<li><a class="toc-item toc-${level}" data-target="${hId}">${h.textContent}</a></li>`;
      });
    });
    tocEl.innerHTML = html;
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

        if (currentView === 'source') {
          // Navigate within source editor
          const el = $('#source-editor');
          sourceBuffer = el.value;
          const lineH = parseFloat(getComputedStyle(el).lineHeight) || 24;
          const target = item.dataset.target;
          const floorMatch = target.match(/^admin-floor-(\d+)$/);

          if (floorMatch) {
            const floorIdx = parseInt(floorMatch[1]);
            const floorLines = getFloorLines(sourceBuffer);
            const targetLine = floorIdx < floorLines.length ? floorLines[floorIdx] : 0;
            el.scrollTop = targetLine * lineH;
          } else {
            // Sub-heading: find by text + level prefix
            const text = item.textContent.trim();
            const prefix = item.classList.contains('toc-h3') ? '### ' :
                           item.classList.contains('toc-h4') ? '#### ' :
                           item.classList.contains('toc-h5') ? '##### ' : '###### ';
            const lines = sourceBuffer.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith(prefix) && lines[i].includes(text)) {
                el.scrollTop = i * lineH;
                break;
              }
            }
          }
          closeAdminSidebar();
          return;
        }

        setTimeout(() => {
          const target = document.getElementById(item.dataset.target);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);

        closeAdminSidebar();
      });
    }

    // Scroll-based TOC active highlight
    const preview = $('#rendered-preview');
    if (preview) {
      preview.addEventListener('scroll', () => {
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
