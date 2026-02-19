(function() {
  'use strict';

  const $ = s => document.querySelector(s);
  const CACHE_PREFIX = 'ppd_draft_';
  let indexData = null;
  let currentFile = null;
  let currentSha = null;
  let vditor = null;
  let pendingImages = []; // { placeholder, base64, filename }

  // ── Login ──
  const loginScreen = $('#login-screen');
  const editorScreen = $('#editor-screen');
  const tokenInput = $('#token-input');
  const loginBtn = $('#login-btn');
  const loginError = $('#login-error');

  async function tryLogin(token) {
    loginError.textContent = '';
    loginBtn.disabled = true;
    loginBtn.textContent = '验证中...';
    try {
      const user = await CodebergAPI.verifyToken(token);
      if (!user) throw new Error('Token 无效');
      CodebergAPI.setToken(token);
      loginScreen.style.display = 'none';
      editorScreen.style.display = '';
      await initEditor();
    } catch(e) {
      loginError.textContent = e.message || '验证失败';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = '登录';
    }
  }

  loginBtn.addEventListener('click', () => tryLogin(tokenInput.value.trim()));
  tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(tokenInput.value.trim()); });

  // Auto-login if token exists
  const savedToken = CodebergAPI.getToken();
  if (savedToken) tryLogin(savedToken);

  // ── Editor Init ──
  async function initEditor() {
    // Load index
    try {
      const res = await fetch('../content/_index.json');
      indexData = await res.json();
    } catch {
      $('#footer-status').textContent = '无法加载内容索引';
      return;
    }
    buildFileTree();
    initVditor();
  }

  // ── File Tree ──
  function buildFileTree() {
    const tree = $('#file-tree');
    let html = '';
    for (const sec of indexData.sections) {
      if (sec.children) {
        html += `<li class="file-tree-part" data-toggle="${sec.id}">${sec.floor} ${sec.title}</li>`;
        for (const ch of sec.children) {
          html += `<li class="file-tree-item" data-file="${ch.file}" data-part="${sec.id}" data-title="${ch.title}">${ch.title}</li>`;
        }
      } else {
        html += `<li class="file-tree-single" data-file="${sec.file}" data-title="${sec.floor} ${sec.title}">${sec.floor} ${sec.title}</li>`;
      }
    }
    tree.innerHTML = html;

    tree.addEventListener('click', e => {
      const item = e.target;
      if (item.dataset.file) {
        loadFile(item.dataset.file, item.dataset.title);
        tree.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        // Close mobile sidebar
        $('#editor-sidebar').classList.remove('open');
      }
    });

    // Mobile toggle
    $('#sidebar-toggle-mobile').addEventListener('click', () => {
      $('#editor-sidebar').classList.toggle('open');
    });
  }

  // ── Vditor ──
  function initVditor() {
    vditor = new Vditor('vditor', {
      height: '100%',
      mode: 'wysiwyg',
      placeholder: '选择左侧目录项开始编辑...',
      cache: { enable: false },
      toolbar: [
        'headings', 'bold', 'italic', 'strike', '|',
        'list', 'ordered-list', 'check', '|',
        'quote', 'code', 'inline-code', '|',
        'link', 'upload', 'table', '|',
        'undo', 'redo', '|',
        'edit-mode', 'outline'
      ],
      upload: {
        handler: handleImageUpload,
        accept: 'image/*'
      },
      input: () => {
        if (currentFile) saveDraft();
      },
      after: () => {
        $('#footer-status').textContent = '编辑器就绪';
      }
    });
  }

  // ── Load File ──
  async function loadFile(filePath, title) {
    $('#editor-current').textContent = `编辑: ${title} (${filePath})`;
    $('#footer-status').textContent = '加载中...';
    $('#publish-btn').disabled = true;

    currentFile = filePath;
    currentSha = null;
    pendingImages = [];

    // Check local draft first
    const draft = localStorage.getItem(CACHE_PREFIX + filePath);
    if (draft) {
      vditor.setValue(draft);
      $('#footer-status').textContent = '已从本地草稿恢复';
      $('#status-text').textContent = '本地草稿';
      $('#publish-btn').disabled = false;
      return;
    }

    // Load from API
    try {
      const data = await CodebergAPI.getFile(filePath);
      currentSha = data.sha;
      const content = decodeURIComponent(escape(atob(data.content)));
      vditor.setValue(content);
      $('#footer-status').textContent = '已加载';
      $('#status-text').textContent = '';
    } catch(e) {
      // Fallback: fetch directly
      try {
        const res = await fetch('../' + filePath);
        const text = await res.text();
        vditor.setValue(text);
        $('#footer-status').textContent = '从本地文件加载（无 SHA）';
      } catch {
        vditor.setValue('*内容加载失败*');
        $('#footer-status').textContent = '加载失败';
      }
    }
    $('#publish-btn').disabled = false;
  }

  // ── Draft ──
  function saveDraft() {
    if (!currentFile) return;
    const content = vditor.getValue();
    localStorage.setItem(CACHE_PREFIX + currentFile, content);
    $('#status-text').textContent = '草稿已保存';
    $('#footer-status').textContent = `本地草稿已保存 | ${new Date().toLocaleTimeString()}`;
  }

  // ── Image Upload ──
  function handleImageUpload(files) {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Full = reader.result;
        const base64Data = base64Full.split(',')[1];
        const ext = file.name.split('.').pop();
        const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
        const placeholder = `![${file.name}](pending:${filename})`;

        pendingImages.push({ placeholder, base64Data, filename });

        // Insert as base64 preview in editor for now
        const imgUrl = base64Full;
        vditor.insertValue(`![${file.name}](${imgUrl})`);
      };
      reader.readAsDataURL(file);
    }
    return null;
  }

  // ── Publish ──
  $('#publish-btn').addEventListener('click', publish);

  async function publish() {
    if (!currentFile) return;
    const btn = $('#publish-btn');
    btn.disabled = true;
    btn.textContent = '发布中...';
    $('#footer-status').textContent = '正在发布...';

    try {
      let content = vditor.getValue();

      // Upload pending images (base64 in content)
      const base64Regex = /!\[([^\]]*)\]\(data:image\/[^;]+;base64,([^)]+)\)/g;
      let match;
      const uploads = [];
      while ((match = base64Regex.exec(content)) !== null) {
        const altText = match[1];
        const b64 = match[2];
        const ext = 'png';
        const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
        uploads.push({ full: match[0], altText, b64, filename });
      }

      for (const up of uploads) {
        try {
          await CodebergAPI.uploadImage(up.filename, up.b64, `Upload image: ${up.filename}`);
          const imgUrl = `https://codeberg.org/${CodebergAPI.OWNER}/${CodebergAPI.REPO}/raw/branch/main/assets/images/${up.filename}`;
          content = content.replace(up.full, `![${up.altText}](${imgUrl})`);
          $('#footer-status').textContent = `已上传图片: ${up.filename}`;
        } catch(e) {
          console.error('Image upload failed:', e);
          $('#footer-status').textContent = `图片上传失败: ${up.filename}`;
        }
      }

      // Get latest SHA if we don't have one
      if (!currentSha) {
        try {
          const data = await CodebergAPI.getFile(currentFile);
          currentSha = data.sha;
        } catch {}
      }

      // Update file
      const result = await CodebergAPI.putFile(currentFile, content, `Update ${currentFile}`, currentSha);
      currentSha = result.content.sha;

      // Clear draft
      localStorage.removeItem(CACHE_PREFIX + currentFile);

      // Update editor with clean content
      vditor.setValue(content);

      $('#status-text').textContent = '已发布';
      $('#footer-status').textContent = `发布成功 | ${new Date().toLocaleTimeString()}`;
    } catch(e) {
      console.error('Publish failed:', e);
      $('#footer-status').textContent = `发布失败: ${e.message}`;
      $('#status-text').textContent = '发布失败';
    } finally {
      btn.disabled = false;
      btn.textContent = '发布';
    }
  }
})();
