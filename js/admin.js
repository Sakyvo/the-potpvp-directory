(function() {
  'use strict';

  const $ = s => document.querySelector(s);
  const DRAFT_KEY = 'ppd_global_draft';

  let indexData = null;
  let indexSha = null;
  let fileShas = {};
  let sourceBuffer = '';
  let currentView = 'rendered';

  function setStatus(t) { $('#footer-status').textContent = t; }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  // ═══ Base64 UTF-8 helpers ═══

  function decodeBase64Utf8(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
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
    // initAutoSave(); // Draft saving disabled for now
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

  function initViewToggle() {
    $('#view-toggle').addEventListener('click', e => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      const view = btn.dataset.view;
      if (view === currentView) return;

      // Sync source buffer from textarea if switching away from source
      if (currentView === 'source') {
        sourceBuffer = $('#source-editor').value;
      }

      currentView = view;
      $('#view-toggle').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateView();
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

  function renderMd(md) {
    md = md.replace(/\r\n/g, '\n');

    // Convert lone "-" to horizontal rule
    md = md.split('\n').map(line => /^\s*-\s*$/.test(line) ? '---' : line).join('\n');

    // Auto-convert bare image URLs
    let inCode = false;
    md = md.split('\n').map(line => {
      if (/^```/.test(line)) inCode = !inCode;
      if (inCode || /^\s{4}/.test(line) || /!\[.*?\]\(/.test(line)) return line;
      return line.replace(IMG_URL_RE, '![image]($1)');
    }).join('\n');

    // Protect fenced code blocks
    const codeBlocks = [];
    md = md.replace(/```[\s\S]*?```/g, m => {
      codeBlocks.push(m);
      return `%%CB${codeBlocks.length - 1}%%`;
    });

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

  function renderPreview() {
    const container = $('#rendered-preview');
    const md = sourceBuffer.trim();

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
        html += `<div class="floor">
          <div class="floor-header">#${i}F &nbsp; ${title}</div>
          <div class="floor-body">${renderMd(floor.md)}</div>
        </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = `<div class="floor">
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
      const files = e.clipboardData.files;

      // Handle pasted images
      if (files && files.length > 0) {
        e.preventDefault();
        handlePastedImages(files, sourceEl);
        return;
      }

      if (html && html.trim()) {
        e.preventDefault();
        const md = htmlToMarkdown(html);
        insertAtCursor(sourceEl, md);
        sourceBuffer = sourceEl.value;
        saveDraft();
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
        md = htmlToMarkdown(html);
      } else if (text) {
        md = text;
      }

      if (md) {
        sourceBuffer += (sourceBuffer ? '\n\n' : '') + md;
        renderPreview();
        saveDraft();
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
        const md = `![${file.name || 'image'}](${reader.result})`;
        insertAtCursor(textarea, md);
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
        const md = `![${file.name || 'image'}](${reader.result})`;
        sourceBuffer += (sourceBuffer ? '\n\n' : '') + md;
        renderPreview();
        saveDraft();
      };
      reader.readAsDataURL(file);
    }
  }

  // ═══ HTML to Markdown Converter ═══

  function htmlToMarkdown(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    // Clean up Shimo/Google Docs wrapper elements
    removeEmptySpans(div);
    const result = processNode(div);
    // Clean up excessive blank lines (max 2 consecutive)
    return result.trim();
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
        result += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        result += processElement(child);
      }
    }
    return result;
  }

  function processElement(el) {
    const tag = el.tagName.toLowerCase();
    const inner = processNode(el);

    switch (tag) {
      case 'h1': return `# ${inner.trim()}\n\n`;
      case 'h2': return `## ${inner.trim()}\n\n`;
      case 'h3': return `### ${inner.trim()}\n\n`;
      case 'h4': return `#### ${inner.trim()}\n\n`;
      case 'h5': return `##### ${inner.trim()}\n\n`;
      case 'h6': return `###### ${inner.trim()}\n\n`;

      case 'p': {
        const trimmed = inner.trim();
        if (!trimmed) return '\n';
        return `${trimmed}\n\n`;
      }

      case 'br': return '\n';
      case 'hr': return '\n---\n\n';

      case 'strong': case 'b':
        return inner.trim() ? `**${inner}**` : '';
      case 'em': case 'i':
        return inner.trim() ? `*${inner}*` : '';
      case 'u':
        return inner.trim() ? `<u>${inner}</u>` : '';
      case 's': case 'del': case 'strike':
        return inner.trim() ? `~~${inner}~~` : '';

      case 'a': {
        const href = el.getAttribute('href');
        if (href && inner.trim()) return `[${inner.trim()}](${href})`;
        return inner;
      }

      case 'img': {
        const src = el.getAttribute('src');
        const alt = el.getAttribute('alt') || 'image';
        if (src) return `![${alt}](${src})`;
        return '';
      }

      case 'ul': {
        let items = '';
        for (const li of el.children) {
          if (li.tagName && li.tagName.toLowerCase() === 'li') {
            items += `- ${processNode(li).trim()}\n`;
          }
        }
        return items + '\n';
      }

      case 'ol': {
        let items = '';
        let idx = 1;
        for (const li of el.children) {
          if (li.tagName && li.tagName.toLowerCase() === 'li') {
            items += `${idx++}. ${processNode(li).trim()}\n`;
          }
        }
        return items + '\n';
      }

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

      case 'span': {
        const style = el.getAttribute('style') || '';
        const colorMatch = style.match(/color:\s*([^;]+)/i);
        const bgMatch = style.match(/background-color:\s*([^;]+)/i);

        if (colorMatch) {
          const color = colorMatch[1].trim();
          // Skip black/default colors
          if (!/^(rgb\(0,?\s*0,?\s*0\)|#000|black)$/i.test(color)) {
            return `<span style="color:${color}">${inner}</span>`;
          }
        }
        if (bgMatch) {
          const bg = bgMatch[1].trim();
          if (!/^(transparent|rgba?\(0,?\s*0,?\s*0,?\s*0\))$/i.test(bg)) {
            return `<span style="background-color:${bg}">${inner}</span>`;
          }
        }
        return inner;
      }

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

  // ═══ Publish ═══

  $('#publish-btn').addEventListener('click', publish);

  async function publish() {
    // Sync from textarea if in source view
    if (currentView === 'source') {
      sourceBuffer = $('#source-editor').value;
    }

    const btn = $('#publish-btn');
    btn.disabled = true;
    btn.textContent = '发布中...';

    try {
      let md = sourceBuffer;

      // Upload base64 images to images/ folder
      const imgRe = /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([^)]+)\)/g;
      let im;
      const imgs = [];
      while ((im = imgRe.exec(md))) {
        imgs.push({ full: im[0], alt: im[1], ext: im[2] === 'jpeg' ? 'jpg' : im[2], b64: im[3] });
      }
      for (const img of imgs) {
        const fname = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${img.ext}`;
        setStatus(`上传图片: ${fname}...`);
        try {
          await CodebergAPI.uploadImage(fname, img.b64, `Upload ${fname}`);
          const url = `https://codeberg.org/${CodebergAPI.OWNER}/${CodebergAPI.REPO}/raw/branch/pages/images/${fname}`;
          md = md.replace(img.full, `![${img.alt}](${url})`);
        } catch(e) { console.error('Image upload failed:', e); }
      }
      if (imgs.length) sourceBuffer = md;

      // Save to content/main.md
      const mainFile = 'content/main.md';
      setStatus('上传内容...');
      try {
        // Try to get existing file SHA first
        if (!fileShas[mainFile]) {
          try {
            const existing = await CodebergAPI.getFile(mainFile);
            fileShas[mainFile] = existing.sha;
          } catch {} // File doesn't exist yet, that's fine
        }
        const result = await CodebergAPI.putFile(mainFile, md, 'Update content', fileShas[mainFile]);
        fileShas[mainFile] = result.content.sha;
      } catch(e) {
        console.error('Save content failed:', e, e.data);
        throw e;
      }

      // Update _index.json to single file mode
      const newIndex = {
        title: indexData.title || 'The PotPvP Directory ~ 漠海拾遗',
        file: mainFile
      };
      setStatus('更新索引...');
      try {
        const result = await CodebergAPI.putFile(
          'content/_index.json',
          JSON.stringify(newIndex, null, 2),
          'Update index to single file mode',
          indexSha
        );
        indexSha = result.content.sha;
        indexData = newIndex;
      } catch(e) {
        try {
          const fresh = await CodebergAPI.getFile('content/_index.json');
          const result = await CodebergAPI.putFile('content/_index.json', JSON.stringify(newIndex, null, 2), 'Update index', fresh.sha);
          indexSha = result.content.sha;
          indexData = newIndex;
        } catch(e2) { console.error('Index update failed:', e2); }
      }

      localStorage.removeItem(DRAFT_KEY);
      setStatus(`发布成功 | ${new Date().toLocaleTimeString()}`);
      $('#status-text').textContent = '已发布';
    } catch(e) {
      console.error('Publish failed:', e);
      setStatus(`发布失败: ${e.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = '发布';
    }
  }
})();
