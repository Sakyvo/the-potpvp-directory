(function() {
  'use strict';

  const $ = s => document.querySelector(s);
  const DRAFT_KEY = 'ppd_global_draft';
  const INDEX_KEY = 'ppd_index_draft';

  let indexData = null;
  let indexSha = null;
  let fileShas = {};
  let vditor = null;
  let deletedFiles = [];

  function setStatus(t) { $('#footer-status').textContent = t; }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

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

  // ═══ Init ═══

  async function initEditor() {
    setStatus('加载索引...');
    await loadIndex();
    buildTOC();
    initVditor();
  }

  async function loadIndex() {
    const draftIdx = localStorage.getItem(INDEX_KEY);
    if (draftIdx) {
      try { indexData = JSON.parse(draftIdx); } catch {}
    }
    if (!indexData) {
      try {
        const data = await CodebergAPI.getFile('content/_index.json');
        indexSha = data.sha;
        indexData = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      } catch {
        const res = await fetch('../content/_index.json');
        indexData = await res.json();
      }
    }
    // Always try to get latest SHA for index
    if (!indexSha) {
      try {
        const data = await CodebergAPI.getFile('content/_index.json');
        indexSha = data.sha;
      } catch {}
    }
  }

  function flatFiles() {
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

  // ═══ Vditor ═══

  function initVditor() {
    vditor = new Vditor('vditor', {
      height: '100%',
      mode: 'ir',
      placeholder: '加载中...',
      cache: { enable: false },
      toolbar: [
        'headings', 'bold', 'italic', 'strike', '|',
        'list', 'ordered-list', 'check', '|',
        'quote', 'code', 'inline-code', '|',
        'link', 'upload', 'table', '|',
        'undo', 'redo', '|',
        'edit-mode', 'outline'
      ],
      upload: { handler: handleImageUpload, accept: 'image/*' },
      input: debounce(saveDraft, 1500),
      after: () => {
        loadContent();
        // Intercept paste to preserve blank lines from Shimo etc.
        setTimeout(() => {
          const el = document.querySelector('#vditor .vditor-reset');
          if (el) el.addEventListener('paste', e => {
            let text = e.clipboardData.getData('text/plain');
            if (!text || !/\n\s*\n\s*\n/.test(text)) return;
            e.preventDefault();
            e.stopPropagation();
            text = text.replace(/\r\n/g, '\n');
            const processed = text.replace(/\n{3,}/g, m => '\n\n' + '&nbsp;\n\n'.repeat(m.length - 2));
            vditor.insertValue(processed);
          }, true);
        }, 300);
      }
    });
  }

  async function loadContent() {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && confirm('发现本地未发布的草稿，是否恢复？\n选择「取消」将从服务器重新加载。')) {
      vditor.setValue(draft);
      setStatus('已恢复本地草稿');
    } else {
      localStorage.removeItem(DRAFT_KEY);
      setStatus('加载内容...');
      const content = await loadAllContent();
      vditor.setValue(content);
      setStatus('就绪');
    }
  }

  async function loadAllContent() {
    const flat = flatFiles();
    const results = await Promise.all(flat.map(async f => {
      try {
        const data = await CodebergAPI.getFile(f.file);
        fileShas[f.file] = data.sha;
        return { file: f.file, content: decodeURIComponent(escape(atob(data.content))) };
      } catch {
        try {
          const res = await fetch('../' + f.file);
          return { file: f.file, content: await res.text() };
        } catch {
          return { file: f.file, content: '' };
        }
      }
    }));
    return results.map(r => `<!-- @file: ${r.file} -->\n\n${r.content.trim()}`).join('\n\n---\n\n');
  }

  function splitDocument(md) {
    const regex = /<!-- @file:\s*(.+?)\s*-->/g;
    const markers = [];
    let m;
    while ((m = regex.exec(md))) {
      markers.push({ file: m[1], start: m.index, end: m.index + m[0].length });
    }
    if (markers.length > 0) {
      return markers.map((mk, i) => {
        const start = mk.end;
        const end = i + 1 < markers.length ? markers[i + 1].start : md.length;
        return { file: mk.file, content: md.slice(start, end).replace(/^\s+/, '').replace(/\s*---\s*$/, '').trim() };
      });
    }
    // Fallback: order-based
    const flat = flatFiles();
    const chunks = md.split(/\n{2,}---\n{2,}/);
    return chunks.map((c, i) => ({
      file: flat[i] ? flat[i].file : `content/unknown-${i}.md`,
      content: c.replace(/<!-- @file:.*?-->/g, '').trim()
    }));
  }

  function rebuildDocument() {
    const sections = splitDocument(vditor.getValue());
    const contentMap = {};
    for (const sec of sections) contentMap[sec.file] = sec.content;

    const flat = flatFiles();
    const parts = flat.map(f => {
      const content = contentMap[f.file] || '*新建章节，待编辑...*';
      return `<!-- @file: ${f.file} -->\n\n${content}`;
    });
    vditor.setValue(parts.join('\n\n---\n\n'));
  }

  // ═══ TOC ═══

  function buildTOC() {
    const tree = $('#file-tree');
    let html = '';
    for (const sec of indexData.sections) {
      if (sec.children) {
        html += `<li class="tree-group">
          <div class="tree-part" data-id="${sec.id}" data-type="part">
            <span class="tree-text">${sec.floor} ${sec.title}</span>
            <button class="tree-add" data-parent="${sec.id}" title="添加子项">+</button>
          </div>
          <ul class="tree-children">`;
        for (const ch of sec.children) {
          html += `<li class="tree-child" data-id="${ch.id}" data-file="${ch.file}" data-type="child">
            <span class="tree-text">${ch.title}</span>
          </li>`;
        }
        html += `</ul></li>`;
      } else {
        html += `<li class="tree-single" data-id="${sec.id}" data-file="${sec.file}" data-type="single">
          <span class="tree-text">${sec.floor} ${sec.title}</span>
        </li>`;
      }
    }
    html += `<li class="tree-action"><button id="add-part-btn">+ 添加 Part</button></li>`;
    tree.innerHTML = html;
    bindTreeEvents();
  }

  function bindTreeEvents() {
    const tree = $('#file-tree');

    tree.addEventListener('click', e => {
      // Add child button
      const addBtn = e.target.closest('.tree-add');
      if (addBtn) {
        e.stopPropagation();
        showModal('添加子章节', '', title => {
          if (title.trim()) addChild(addBtn.dataset.parent, title.trim());
        });
        return;
      }
      // Navigate to section
      const item = e.target.closest('[data-file]');
      if (item) {
        scrollToSection(item.dataset.file);
        tree.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        $('#editor-sidebar').classList.remove('open');
        return;
      }
      // Part click → scroll to first child
      const part = e.target.closest('.tree-part');
      if (part) {
        const sec = indexData.sections.find(s => s.id === part.dataset.id);
        if (sec && sec.children && sec.children[0]) scrollToSection(sec.children[0].file);
      }
    });

    // Right-click context menu
    tree.addEventListener('contextmenu', e => {
      const item = e.target.closest('[data-id]');
      if (!item) return;
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, item.dataset.id, item.dataset.type);
    });

    // Add Part button
    const addPartBtn = $('#add-part-btn');
    if (addPartBtn) {
      addPartBtn.addEventListener('click', () => {
        showModal('添加 Part', '', title => {
          if (title.trim()) addPart(title.trim());
        });
      });
    }

    // Mobile toggle
    const toggle = $('#sidebar-toggle-mobile');
    if (toggle) toggle.addEventListener('click', () => $('#editor-sidebar').classList.toggle('open'));
  }

  function scrollToSection(file) {
    const flat = flatFiles();
    const idx = flat.findIndex(f => f.file === file);
    if (idx < 0) return;

    const editorEl = document.querySelector('#vditor .vditor-ir .vditor-reset')
      || document.querySelector('#vditor .vditor-wysiwyg .vditor-reset')
      || document.querySelector('#vditor .vditor-sv .vditor-reset');
    if (!editorEl) return;

    if (idx === 0) { editorEl.scrollTop = 0; return; }

    const hrs = editorEl.querySelectorAll('hr');
    if (hrs[idx - 1]) hrs[idx - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ═══ Context Menu ═══

  function showContextMenu(x, y, id, type) {
    const menu = $('#ctx-menu');
    menu.innerHTML = '';
    const add = (label, action, cls) => {
      const d = document.createElement('div');
      d.className = 'ctx-item' + (cls ? ' ' + cls : '');
      d.textContent = label;
      d.addEventListener('click', () => { hideContextMenu(); action(); });
      menu.appendChild(d);
    };

    add('重命名', () => {
      const item = findById(id);
      if (!item) return;
      const cur = item.title.replace(/^\d+F\s*/, '');
      showModal('重命名', cur, val => { if (val.trim()) renameItem(id, val.trim()); });
    });

    if (type === 'part') {
      add('添加子项', () => {
        showModal('添加子章节', '', title => { if (title.trim()) addChild(id, title.trim()); });
      });
    }

    add('删除', () => {
      if (confirm('确认删除？此操作将在发布时生效。')) deleteItem(id);
    }, 'ctx-danger');

    // Position
    menu.style.left = Math.min(x, window.innerWidth - 140) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 100) + 'px';
    menu.style.display = 'block';
    setTimeout(() => document.addEventListener('click', hideContextMenu, { once: true }));
  }

  function hideContextMenu() { $('#ctx-menu').style.display = 'none'; }

  // ═══ Modal ═══

  function showModal(title, defaultVal, onConfirm) {
    const modal = $('#modal');
    $('#modal-title').textContent = title;
    const input = $('#modal-input');
    input.value = defaultVal;
    modal.classList.add('open');
    setTimeout(() => input.focus(), 50);

    let done = false;
    const finish = (confirmed) => {
      if (done) return;
      done = true;
      modal.classList.remove('open');
      if (confirmed) onConfirm(input.value);
      cleanup();
    };
    const onKey = e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); };
    const onConfirmClick = () => finish(true);
    const onCancelClick = () => finish(false);

    const cleanup = () => {
      $('#modal-confirm').removeEventListener('click', onConfirmClick);
      $('#modal-cancel').removeEventListener('click', onCancelClick);
      input.removeEventListener('keydown', onKey);
    };

    $('#modal-confirm').addEventListener('click', onConfirmClick);
    $('#modal-cancel').addEventListener('click', onCancelClick);
    input.addEventListener('keydown', onKey);
  }

  // ═══ CRUD ═══

  function findById(id) {
    for (const sec of indexData.sections) {
      if (sec.id === id) return sec;
      if (sec.children) for (const ch of sec.children) { if (ch.id === id) return ch; }
    }
    return null;
  }

  function slugify(t) {
    return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 30) || 'untitled';
  }

  function renumberFloors() {
    indexData.sections.forEach((s, i) => { s.floor = i + 'F'; });
  }

  function addChild(parentId, title) {
    const parent = indexData.sections.find(s => s.id === parentId);
    if (!parent || !parent.children) return;

    const partIdx = indexData.sections.filter(s => s.children).indexOf(parent) + 1;
    const childNum = parent.children.length + 1;
    const id = `${partIdx}.${childNum}`;
    const slug = slugify(title);
    const file = `content/part${partIdx}/${id}-${slug}.md`;

    parent.children.push({ id, title: `${id} ${title}`, file });
    rebuildDocument();
    buildTOC();
    saveIndexDraft();
    setStatus(`已添加: ${id} ${title}`);
  }

  function addPart(title) {
    const partCount = indexData.sections.filter(s => s.children).length;
    const newPart = {
      id: `part${partCount + 1}`,
      floor: '',
      title: `Part ${partCount + 1}. ${title}`,
      children: []
    };
    const epilogueIdx = indexData.sections.findIndex(s => s.id === 'epilogue');
    if (epilogueIdx >= 0) indexData.sections.splice(epilogueIdx, 0, newPart);
    else indexData.sections.push(newPart);

    renumberFloors();
    buildTOC();
    saveIndexDraft();
    setStatus(`已添加: ${newPart.title}`);
  }

  function renameItem(id, newTitle) {
    const item = findById(id);
    if (!item) return;

    if (item.children !== undefined) {
      // Part
      const num = item.title.match(/Part\s*(\d+)/);
      item.title = num ? `Part ${num[1]}. ${newTitle}` : newTitle;
    } else {
      const pre = item.title.match(/^(\d+\.\d+)\s/);
      item.title = pre ? `${pre[1]} ${newTitle}` : newTitle;
      // Single floor items (preface/epilogue)
      const sec = indexData.sections.find(s => s.id === id && !s.children);
      if (sec) sec.title = newTitle;
    }

    buildTOC();
    saveIndexDraft();
    setStatus(`已重命名: ${item.title}`);
  }

  function deleteItem(id) {
    for (let i = 0; i < indexData.sections.length; i++) {
      const sec = indexData.sections[i];
      if (sec.id === id) {
        if (sec.children) sec.children.forEach(ch => { if (ch.file) deletedFiles.push(ch.file); });
        else if (sec.file) deletedFiles.push(sec.file);
        indexData.sections.splice(i, 1);
        break;
      }
      if (sec.children) {
        const ci = sec.children.findIndex(ch => ch.id === id);
        if (ci >= 0) {
          if (sec.children[ci].file) deletedFiles.push(sec.children[ci].file);
          sec.children.splice(ci, 1);
          break;
        }
      }
    }
    renumberFloors();
    rebuildDocument();
    buildTOC();
    saveIndexDraft();
    setStatus('已删除，发布时生效');
  }

  // ═══ Image Upload ═══

  function handleImageUpload(files) {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => vditor.insertValue(`![${file.name}](${reader.result})`);
      reader.readAsDataURL(file);
    }
    return null;
  }

  // ═══ Draft ═══

  function saveDraft() {
    if (!vditor) return;
    localStorage.setItem(DRAFT_KEY, vditor.getValue());
    setStatus(`草稿已保存 | ${new Date().toLocaleTimeString()}`);
  }

  function saveIndexDraft() {
    localStorage.setItem(INDEX_KEY, JSON.stringify(indexData));
  }

  function clearDrafts() {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(INDEX_KEY);
  }

  // ═══ Publish ═══

  $('#publish-btn').addEventListener('click', publish);

  async function publish() {
    const btn = $('#publish-btn');
    btn.disabled = true;
    btn.textContent = '发布中...';

    try {
      let md = vditor.getValue();

      // Upload base64 images
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
          const url = `https://codeberg.org/${CodebergAPI.OWNER}/${CodebergAPI.REPO}/raw/branch/pages/assets/images/${fname}`;
          md = md.replace(img.full, `![${img.alt}](${url})`);
        } catch(e) { console.error('Image upload failed:', e); }
      }
      if (imgs.length) vditor.setValue(md);

      // Split & upload files
      const sections = splitDocument(md);
      const total = sections.length;
      for (let i = 0; i < total; i++) {
        const sec = sections[i];
        setStatus(`上传 ${sec.file} (${i + 1}/${total})...`);
        try {
          const result = await CodebergAPI.putFile(sec.file, sec.content, `Update ${sec.file}`, fileShas[sec.file]);
          fileShas[sec.file] = result.content.sha;
        } catch(e) {
          if (e.status === 422 || e.status === 409) {
            try {
              const fresh = await CodebergAPI.getFile(sec.file);
              const result = await CodebergAPI.putFile(sec.file, sec.content, `Update ${sec.file}`, fresh.sha);
              fileShas[sec.file] = result.content.sha;
            } catch(e2) {
              // New file — create without sha
              try {
                const result = await CodebergAPI.putFile(sec.file, sec.content, `Create ${sec.file}`);
                fileShas[sec.file] = result.content.sha;
              } catch(e3) { console.error(`Failed: ${sec.file}`, e3); }
            }
          }
        }
      }

      // Delete removed files
      for (const file of deletedFiles) {
        if (fileShas[file]) {
          setStatus(`删除 ${file}...`);
          try {
            await CodebergAPI.deleteFile(file, fileShas[file], `Delete ${file}`);
            delete fileShas[file];
          } catch(e) { console.error(`Failed to delete ${file}:`, e); }
        }
      }
      deletedFiles = [];

      // Update _index.json
      setStatus('更新索引...');
      try {
        const result = await CodebergAPI.putFile(
          'content/_index.json',
          JSON.stringify(indexData, null, 2),
          'Update content index',
          indexSha
        );
        indexSha = result.content.sha;
      } catch(e) {
        // SHA conflict, retry
        try {
          const fresh = await CodebergAPI.getFile('content/_index.json');
          const result = await CodebergAPI.putFile('content/_index.json', JSON.stringify(indexData, null, 2), 'Update content index', fresh.sha);
          indexSha = result.content.sha;
        } catch(e2) { console.error('Index update failed:', e2); }
      }

      clearDrafts();
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
