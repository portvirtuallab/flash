// Trainer pages (roulette, scoreboard): log in with the TRAINER code from Sheet2.
// The code is kept only for this browser tab (sessionStorage) and sent with every request;
// the Apps Script API checks it on each call.
const PVL_TRAINER = (() => {
  const KEY = 'pvlTrainerCode';
  const API = (window.PVL_CONFIG && window.PVL_CONFIG.apiUrl) || '';
  let code = null;
  try { code = sessionStorage.getItem(KEY); } catch (e) {}

  async function call(action, data) {
    if (!API) throw new Error('API URL not configured in config.js');
    const body = Object.assign({ action: 'trainer:' + action, code: code || '' }, data || {});
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function setCode(c) {
    code = c;
    try { c ? sessionStorage.setItem(KEY, c) : sessionStorage.removeItem(KEY); } catch (e) {}
  }

  // Shows the #gate form until a valid TRAINER code is entered, then calls onReady().
  function init(onReady) {
    const gate = document.getElementById('gate');
    const input = document.getElementById('gateCode');
    const error = document.getElementById('gateError');
    const btn = gate.querySelector('button');

    async function tryLogin(c, silent) {
      setCode(c);
      btn.disabled = true;
      try {
        const out = await call('login');
        if (out.ok) { gate.style.display = 'none'; onReady(); return; }
        setCode(null);
        if (!silent) error.textContent = out.error || 'Access denied.';
      } catch (e) {
        if (!silent) error.textContent = 'Could not connect to the server.';
      } finally {
        btn.disabled = false;
      }
      gate.style.display = 'flex';
      input.focus();
    }

    gate.addEventListener('submit', (e) => {
      e.preventDefault();
      const c = input.value.trim();
      if (!/^\d{4}$/.test(c)) { error.textContent = 'Enter the 4-digit TRAINER code.'; return; }
      error.textContent = '';
      tryLogin(c, false);
    });

    if (code) { gate.style.display = 'none'; tryLogin(code, true); }
    else { gate.style.display = 'flex'; input.focus(); }
  }

  function logout() { setCode(null); location.reload(); }

  function escape(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { call, init, logout, escape };
})();
