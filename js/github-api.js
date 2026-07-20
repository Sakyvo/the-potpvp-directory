const GitHubAPI = (function() {
  'use strict';

  const API_BASE = 'https://api.github.com';
  const API_VERSION = '2022-11-28';
  const OWNER = 'Sakyvo';
  const REPO = 'the-potpvp-directory';
  const BRANCH = 'main';
  const TOKEN_KEY = 'github_token';
  const LEGACY_TOKEN_KEY = 'codeberg_token';

  try { localStorage.removeItem(LEGACY_TOKEN_KEY); } catch {}

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }

  function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  }

  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  }

  function encodeRepoPath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function utf8ToBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async function request(path, opts = {}, tokenOverride) {
    const token = tokenOverride === undefined ? getToken() : tokenOverride;
    const { headers: customHeaders = {}, ...fetchOpts } = opts;
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      ...customHeaders
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (fetchOpts.body) headers['Content-Type'] = 'application/json';

    const res = await fetch(API_BASE + path, { ...fetchOpts, headers });
    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch {}
      const detail = data && data.message ? data.message : res.statusText;
      const err = new Error(`GitHub API ${res.status}: ${detail}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async function verifyToken(token) {
    if (!token) return null;
    try {
      const repo = await request(`/repos/${OWNER}/${REPO}`, { cache: 'no-store' }, token);
      return repo.permissions && repo.permissions.push ? repo : null;
    } catch (err) {
      if ([401, 403, 404].includes(err.status)) return null;
      throw err;
    }
  }

  async function verifySavedToken() {
    const token = getToken();
    if (!token) return null;
    const verified = await verifyToken(token);
    if (!verified) clearToken();
    return verified;
  }

  async function getFileMetadata(path) {
    return request(`/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(BRANCH)}`);
  }

  async function getFile(path) {
    const file = await getFileMetadata(path);
    if (file && file.type === 'file' && file.encoding === 'none' && file.sha) {
      const blob = await request(`/repos/${OWNER}/${REPO}/git/blobs/${file.sha}`);
      return { ...file, content: blob.content, encoding: blob.encoding };
    }
    return file;
  }

  async function putFile(path, content, message, sha) {
    const body = {
      content: utf8ToBase64(content),
      message: message || `Update ${path}`,
      branch: BRANCH
    };
    if (sha) body.sha = sha;
    return request(`/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(path)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async function uploadImage(filename, base64Data, message) {
    const path = `images/${filename}`;
    let sha;
    try {
      const existing = await getFileMetadata(path);
      sha = existing.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
    }
    const body = {
      content: base64Data,
      message: message || `Upload image ${filename}`,
      branch: BRANCH
    };
    if (sha) body.sha = sha;
    return request(`/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(path)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async function deleteFile(path, sha, message) {
    return request(`/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(path)}`, {
      method: 'DELETE',
      body: JSON.stringify({
        sha,
        message: message || `Delete ${path}`,
        branch: BRANCH
      })
    });
  }

  return {
    getToken,
    setToken,
    clearToken,
    verifyToken,
    verifySavedToken,
    getFile,
    putFile,
    deleteFile,
    uploadImage,
    OWNER,
    REPO,
    BRANCH
  };
})();
