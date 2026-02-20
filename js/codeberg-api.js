const CodebergAPI = (function() {
  'use strict';

  const API_BASE = 'https://codeberg.org/api/v1';
  const OWNER = 'Sakyvo';
  const REPO = 'pages';
  const TOKEN_KEY = 'codeberg_token';

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  async function request(path, opts = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'token ' + token;
    const res = await fetch(API_BASE + path, { ...opts, headers: { ...headers, ...opts.headers } });
    if (!res.ok) {
      const err = new Error(`API ${res.status}: ${res.statusText}`);
      err.status = res.status;
      try { err.data = await res.json(); } catch {}
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async function verifyToken(token) {
    const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}`, { headers: { 'Authorization': 'token ' + token } });
    if (!res.ok) return null;
    return res.json();
  }

  async function getFile(path) {
    return request(`/repos/${OWNER}/${REPO}/contents/${path}`);
  }

  async function putFile(path, content, message, sha) {
    const body = {
      content: btoa(unescape(encodeURIComponent(content))),
      message: message || `Update ${path}`
    };
    if (sha) {
      body.sha = sha;
      return request(`/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    }
    // No SHA → create new file via POST
    return request(`/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async function uploadImage(filename, base64Data, message) {
    const path = `images/${filename}`;
    let sha;
    try {
      const existing = await getFile(path);
      sha = existing.sha;
    } catch {}
    const body = {
      content: base64Data,
      message: message || `Upload image ${filename}`
    };
    if (sha) {
      body.sha = sha;
      return request(`/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    }
    return request(`/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async function deleteFile(path, sha, message) {
    return request(`/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({ sha, message: message || `Delete ${path}` })
    });
  }

  return { getToken, setToken, clearToken, verifyToken, getFile, putFile, deleteFile, uploadImage, OWNER, REPO };
})();
