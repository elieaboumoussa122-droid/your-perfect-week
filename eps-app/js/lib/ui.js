/* Petits utilitaires d'interface partagés par toutes les vues. */
window.EPS = window.EPS || {};
window.EPS.views = window.EPS.views || {};
(function (EPS) {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const longDate = (d) => `${DAYS[d.getDay()].toLowerCase()} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const toMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`;
  const fmtTime = (t) => (t ? t.replace(':', 'h') : '');

  const initials = (s) => `${(s.firstName || '')[0] || ''}${(s.lastName || '')[0] || ''}`.toUpperCase() || '?';

  function modal({ title, body, wide = false, actions = [], onMount, onClose }) {
    const root = document.getElementById('modal-root');
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>${esc(title)}</h2><button class="btn ghost" data-x aria-label="Fermer">✕</button></div>
        <div class="modal-body">${body}</div>
        ${actions.length ? `<div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''} ${a.danger ? 'danger' : ''}" data-a="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
      </div>`;
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
    back.querySelector('[data-x]').onclick = close;
    back.querySelectorAll('[data-a]').forEach((b) => {
      b.onclick = async () => {
        const a = actions[Number(b.dataset.a)];
        if (!a.onClick) return close();
        const res = await a.onClick(back.querySelector('.modal'), close);
        if (res !== false) close();
      };
    });
    root.appendChild(back);
    onMount && onMount(back.querySelector('.modal'), close);
    const first = back.querySelector('input, select, textarea');
    if (first) setTimeout(() => first.focus(), 30);
    return close;
  }

  function confirm(message, { okLabel = 'Supprimer', danger = true } = {}) {
    return new Promise((resolve) => {
      let done = false;
      modal({
        title: 'Confirmation',
        body: `<p>${esc(message)}</p>`,
        actions: [
          { label: 'Annuler', onClick: () => { done = true; resolve(false); } },
          { label: okLabel, primary: !danger, danger, onClick: () => { done = true; resolve(true); } },
        ],
        onClose: () => { if (!done) resolve(false); },
      });
    });
  }

  function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.getElementById('toast-root').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  const readAsDataURL = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  const readAsArrayBuffer = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(file); });

  /** URL blob: affichable dans une iframe à partir d'une data URL (Chrome bloque les PDF en data:). */
  function blobUrl(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  }

  /** Redimensionne une photo (carrée, centrée) pour qu'elle reste légère. */
  async function resizeImage(file, size = 240) {
    const url = await readAsDataURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const side = Math.min(img.width, img.height);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.82);
  }

  /** Lit un formulaire en objet simple (cases à cocher -> booléens). */
  function formData(root) {
    const out = {};
    root.querySelectorAll('[name]').forEach((el) => {
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'number') out[el.name] = el.value === '' ? null : Number(el.value);
      else out[el.name] = el.value.trim();
    });
    return out;
  }

  /** Vrai quand l'application est affichée dans une page intégrée (ex. lien claude.ai). */
  const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();
  /** Enregistre un fichier : lien classique en local, capacité « downloads » sur la version en ligne. */
  async function download(blob, name) {
    if (!inFrame) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; a.click();
      return true;
    }
    let d = null;
    try { d = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch { d = null; }
    if (!d) { toast('Téléchargement indisponible ici : ouvrez la version installée (index.html).', 'err'); return; }
    try { await d.save({ filename: name, data: blob }); toast('Fichier enregistré ✔'); return true; } catch (e) {
      if (e && e.code === 'declined') return false;
      toast(e && e.code === 'rate_limited' ? 'Une demande est déjà ouverte, réessayez dans un instant.' : 'Le fichier n\'a pas pu être enregistré ici.', 'err');
    }
  }
  /** Impression : directe en local ; sur la version en ligne, fichier HTML du document qui s'imprime à l'ouverture. */
  function print(el, title = 'document') {
    if (!inFrame || !el) { window.print(); return; }
    const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}\nbody{background:#fff;padding:16px}.doc{border:0;box-shadow:none}</style></head><body><div class="doc">${el.innerHTML}</div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;
    const fname = `${title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'document'}.html`;
    download(new Blob([html], { type: 'text/html' }), fname).then((ok) => ok && toast('Ouvrez le fichier enregistré : l\'impression se lance.'));
  }

  function setCrumbs(items) {
    const el = document.getElementById('crumbs');
    el.innerHTML = items.map((it, i) => (i === items.length - 1
      ? `<strong>${esc(it.label)}</strong>`
      : `<a href="${it.href}">${esc(it.label)}</a><span class="sep">›</span>`)).join('');
  }

  EPS.ui = {
    esc, uid, DAYS, MONTHS, pad, isoDate, parseISO, longDate, toMin, fromMin, fmtTime, initials,
    modal, confirm, toast, inFrame, download, print, readAsDataURL, readAsArrayBuffer, resizeImage, blobUrl, formData, setCrumbs,
  };
})(window.EPS);
