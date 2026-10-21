// Fills every [data-f="path.to.value"] element from window.CASE, computes dates and derived
// figures, and adds the screen toolbar (back to the list + print / save as PDF).
(function () {
  const C = window.CASE;
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  const shift = (n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
  const ddmmyyyy = (d) => d.toLocaleDateString('en-GB');
  const long = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const g = C.goods;
  const vol = (b) => Math.round(b.l * b.w * b.h * 100) / 100;
  C.calc = {
    total: g.qty * g.unitPrice,
    boxVolume: vol(g.box),
    gross: g.machine.kg + g.box.kg,
    machineDims: `${fix(g.machine.l)} × ${fix(g.machine.w)} × ${fix(g.machine.h)} m`,
    boxDims: `${fix(g.box.l)} × ${fix(g.box.w)} × ${fix(g.box.h)} m`,
    boxDimsCm: `${Math.round(g.box.l * 100)} × ${Math.round(g.box.w * 100)} × ${Math.round(g.box.h * 100)} cm`,
    limit20: Math.round(g.qty * g.unitPrice * 0.2)
  };
  C.date = {};
  C.dateLong = {};
  Object.keys(C.dates).forEach((k) => { const d = shift(C.dates[k]); C.date[k] = ddmmyyyy(d); C.dateLong[k] = long(d); });

  function fix(n) { return Number(n).toFixed(2); }
  const formats = {
    eur: (v) => '€' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    eures: (v) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €',
    kg: (v) => Number(v).toLocaleString('en-GB') + ' kg',
    m3: (v) => Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + ' m³',
    num: (v) => Number(v).toLocaleString('en-GB')
  };
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), C);

  document.querySelectorAll('[data-f]').forEach((el) => {
    const v = get(el.dataset.f);
    if (v == null) { el.textContent = '⚠ ' + el.dataset.f; el.style.color = '#c00'; return; }
    el.textContent = el.dataset.fmt && formats[el.dataset.fmt] ? formats[el.dataset.fmt](v) : v;
  });

  // Screen-only toolbar
  const bar = document.createElement('div');
  bar.className = 'doc-toolbar';
  bar.innerHTML = '<a href="./">← All documents</a><button type="button">Print / Save as PDF</button>';
  bar.querySelector('button').addEventListener('click', () => window.print());
  document.body.prepend(bar);
})();
