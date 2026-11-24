/* Import d'un emploi du temps PDF.
   1) pdf.js (chargé à la demande depuis cdnjs) extrait le texte et la position de chaque mot ;
   2) parseTimetable() repère les en-têtes de jours (colonnes), les heures (lignes),
      regroupe le texte de chaque case et en déduit jour, horaires, classe, lieu ;
   3) l'enseignant vérifie et corrige le résultat avant de l'enregistrer.
   parseTimetable() est une fonction pure (testable sans navigateur). */
(function (root) {
  const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
  const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const DAY_RE = /^(lun|mar|mer|jeu|ven|sam)(di|credi|dredi|edi)?\.?$/;
  const DAY_NUM = { lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
  const dayOf = (word) => { const m = norm(word).replace(/[^a-z.]/g, '').match(DAY_RE); return m ? DAY_NUM[m[1]] : 0; };

  const TIME_G = /(\d{1,2})\s*[hH:]\s*(\d{2})?/g;
  const RANGE_RE = /(\d{1,2})\s*[hH:]\s*(\d{2})?\s*(?:-|–|à|a|>)\s*(\d{1,2})\s*[hH:]\s*(\d{2})?/;
  const toHM = (h, m) => `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  const mins = (h, m) => Number(h) * 60 + Number(m || 0);
  const fromMin = (m) => toHM(Math.floor(m / 60), Math.round(m % 60));
  const validHour = (h) => h >= 6 && h <= 21;

  const SEC = '([A-H1-9])(?![\\dh:])';
  const CLASS_RES = [
    { re: /\b([3-6])\s*(?:e|eme|ème|em|°)?(?:\s*[-.]?\s*([A-H])|\s?([1-9]))(?![\dh:])/i, lvl: (m) => `${m[1]}e`, pick: (m) => m[2] || m[3] },
    { re: new RegExp(`\\b(?:2nde|2de|2nd|seconde)\\s*[-. ]{0,2}\\s*${SEC}`, 'i'), lvl: () => '2nde', sec: 1 },
    { re: new RegExp(`\\b(?:1re|1ere|1ère|premiere|première|1)\\s*[-. ]{0,2}\\s*([A-H])(?![\\dh:])`, 'i'), lvl: () => '1re', sec: 1 },
    { re: new RegExp(`\\b(?:tle|term|terminale)\\s*[-. ]{0,2}\\s*${SEC}`, 'i'), lvl: () => 'Tle', sec: 1 },
  ];
  function detectClass(text) {
    text = text.replace(/_/g, ' ');
    for (const c of CLASS_RES) {
      const m = text.match(c.re);
      if (m) return { level: c.lvl(m), section: (c.pick ? c.pick(m) : m[c.sec]).toUpperCase() };
    }
    return null;
  }
  const PLACE_RE = /\b(gymnase|gym|stade|piscine|dojo|piste|plateau|terrain|salle\s*[\w-]+|city|halle|mur d'escalade|complexe\s*\w+|parc\s*\w+)\b/i;
  function detectPlace(text, installations = []) {
    const lines = text.split(' / ').map((l) => l.trim());
    for (const l of lines) { const n = norm(l); if (installations.some((i) => i && n.includes(norm(i)))) return l; }
    for (const l of lines) { if (PLACE_RE.test(l) && l.length <= 40 && !/suppl/i.test(l)) return l.replace(/^_+/, ''); }
    const m = text.match(PLACE_RE);
    return m ? m[0].replace(/\s+/g, ' ') : '';
  }
  /** Nature du créneau (cours d'EPS, AS, concertation, surveillance…). */
  function detectKind(text) {
    if (/atelier/i.test(text)) return { type: 'cours', label: 'Atelier sportif' };
    if (/\b(AS|UNSS|association sportive)\b/i.test(text)) return { type: 'AS', label: 'AS / UNSS' };
    if (/\bd\.?\s?s\.?\s?t\b|devoir surveill/i.test(text)) return { type: 'autre', label: 'D.S.T (surveillance)' };
    if (/concertation|r[ée]union|conseil/i.test(text)) return { type: 'autre', label: (text.match(/concertation|r[ée]union|conseil[^/]*/i) || ['Réunion'])[0].replace(/^./, (c) => c.toUpperCase()) };
    if (/suppl[ée]ance|remplacement/i.test(text)) return { type: 'autre', label: 'Suppléance' };
    if (/perm(anence)?\b|vie de classe/i.test(text)) return { type: 'autre', label: 'Vie scolaire' };
    return { type: 'cours', label: '' };
  }
  function detectWeek(text) {
    const m = norm(text).match(/\b(?:sem(?:aine)?\.?\s*|s)([ab])\b|\bq([12])\b/);
    if (!m) return '*';
    if (m[1]) return m[1].toUpperCase();
    return m[2] === '1' ? 'A' : 'B';
  }

  /** Interpolation par morceaux y -> minutes à partir des étiquettes horaires
      (gère les grilles proportionnelles au temps comme les grilles à lignes égales). */
  function fit(anchors) {
    const pts = [...anchors].sort((a, b) => a.y - b.y).filter((p, i, arr) => i === 0 || p.y - arr[i - 1].y > 1);
    if (pts.length < 2) return null;
    for (let i = 1; i < pts.length; i++) if (pts[i].t <= pts[i - 1].t) return null; // le temps doit augmenter vers le bas
    return (y) => {
      let i = pts.findIndex((p) => p.y >= y);
      if (i <= 0) i = 1; else if (i === -1) i = pts.length - 1;
      if (y > pts[pts.length - 1].y) i = pts.length - 1;
      const a = pts[i - 1], b = pts[i];
      return a.t + ((y - a.y) * (b.t - a.t)) / (b.y - a.y);
    };
  }

  function linesOf(items, tol = 3) {
    const sorted = [...items].sort((a, b) => a.top - b.top || a.x - b.x);
    const lines = [];
    for (const it of sorted) {
      const l = lines.find((L) => Math.abs(L.top - it.top) <= tol);
      if (l) l.items.push(it); else lines.push({ top: it.top, items: [it] });
    }
    lines.forEach((l) => { l.items.sort((a, b) => a.x - b.x); l.text = l.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim(); });
    return lines;
  }

  function buildEntry(day, start, end, text, opts, confidence) {
    const kind = detectKind(text);
    const cls = detectClass(text);
    const clsName = cls ? `${cls.level} ${cls.section}` : '';
    let classId = '';
    if (cls && kind.type !== 'autre' && opts.classes) {
      const found = opts.classes.find((c) => c.level === cls.level && c.section.toUpperCase() === cls.section);
      if (found) classId = found.id;
    }
    const label = kind.type === 'autre'
      ? [kind.label, clsName].filter(Boolean).join(' ')
      : kind.label || clsName || text.split(' / ')[0].slice(0, 40);
    return {
      day, start, end, classId,
      detectedClass: kind.type === 'autre' ? '' : clsName,
      label,
      place: kind.type === 'autre' && /suppl/i.test(text) ? '' : detectPlace(text, opts.installations),
      week: detectWeek(text),
      type: kind.type,
      raw: text,
      confidence,
    };
  }

  /** Mode 1 : grille (jours en colonnes, heures en lignes). */
  function parseGrid(page, opts) {
    const items = page.items;
    // 1. En-têtes de jours
    const dayItems = items.map((it) => ({ ...it, day: dayOf(it.str.split(/\s+/)[0]) })).filter((it) => it.day);
    if (dayItems.length < 3) return null;
    const rows = linesOf(dayItems, 8).filter((l) => new Set(l.items.map((i) => i.day)).size >= 3);
    if (!rows.length) return null;
    const headerRow = rows[0];
    const cols = [];
    headerRow.items.forEach((it) => { if (!cols.find((c) => c.day === it.day)) cols.push({ day: it.day, cx: it.x + it.w / 2 }); });
    cols.sort((a, b) => a.cx - b.cx);
    const step = cols.length > 1 ? (cols[cols.length - 1].cx - cols[0].cx) / (cols.length - 1) : 100;
    cols.forEach((c, i) => {
      c.left = i === 0 ? c.cx - step / 2 : (cols[i - 1].cx + c.cx) / 2;
      c.right = i === cols.length - 1 ? c.cx + step / 2 : (c.cx + cols[i + 1].cx) / 2;
    });
    const headerBottom = Math.max(...headerRow.items.map((i) => i.top + i.h));
    const gridLeft = cols[0].left;

    // 2. Étiquettes horaires à gauche de la grille
    const anchors = [];
    const slotTimes = new Set();
    items.forEach((it) => {
      if (it.top < headerBottom - 2 || it.x + it.w / 2 > gridLeft + 4) return;
      const r = it.str.match(RANGE_RE);
      if (r && validHour(+r[1]) && validHour(+r[3])) {
        const a = mins(r[1], r[2]), b = mins(r[3], r[4]);
        anchors.push({ y: it.top + it.h / 2, t: (a + b) / 2 });
        slotTimes.add(a); slotTimes.add(b);
        return;
      }
      const all = [...it.str.matchAll(TIME_G)];
      if (all.length === 1 && validHour(+all[0][1]) && it.str.replace(TIME_G, '').trim().length <= 3) {
        const t = mins(all[0][1], all[0][2]);
        anchors.push({ y: it.top, t });
        slotTimes.add(t);
      }
    });
    const yToMin = fit(anchors);
    const slots = [...slotTimes].sort((a, b) => a - b);

    // 3. Contenu des cases
    const cellItems = items.filter((it) => it.top >= headerBottom - 1 && it.x + it.w / 2 > gridLeft && !dayOf(it.str));
    const entries = [];
    const PURE_TIME = /^\s*(\d{1,2})\s*[hH:]\s*(\d{2})\s*$/;
    for (const col of cols) {
      const inCol = cellItems.filter((it) => { const cx = it.x + it.w / 2; return cx >= col.left && cx < col.right; });
      // Mode « étiquettes dans la colonne » (Pronote / Index Education) : chaque case commence
      // par son heure de début et la case suivante (ou l'étiquette de fin) donne l'heure de fin.
      const labels = inCol.filter((it) => PURE_TIME.test(it.str) && validHour(+it.str.match(PURE_TIME)[1]))
        .map((it) => ({ top: it.top, t: mins(...it.str.match(PURE_TIME).slice(1, 3)) }))
        .sort((a, b) => a.top - b.top);
      if (labels.length >= 2) {
        const texts = inCol.filter((it) => !PURE_TIME.test(it.str));
        for (let i = 0; i < labels.length - 1; i++) {
          const a = labels[i], b = labels[i + 1];
          if (b.t <= a.t) continue;
          const inside = texts.filter((it) => it.top >= a.top - 3 && it.top < b.top - 3);
          if (!inside.length) continue;
          const text = linesOf(inside).map((l) => l.text).join(' / ');
          entries.push(buildEntry(col.day, fromMin(a.t), fromMin(b.t), text, opts, 'bonne'));
        }
        continue;
      }
      const lines = linesOf(inCol);
      if (!lines.length) continue;
      const lh = median(lines.map((l) => Math.max(...l.items.map((i) => i.h)))) || 10;
      const blocks = [];
      for (const l of lines) {
        const last = blocks[blocks.length - 1];
        const lineH = Math.max(...l.items.map((i) => i.h));
        const L = Math.min(...l.items.map((i) => i.x)), R = Math.max(...l.items.map((i) => i.x + i.w));
        if (last && l.top - last.bottom < lh * 0.9) { last.lines.push(l); last.bottom = l.top + lineH; last.left = Math.min(last.left, L); last.right = Math.max(last.right, R); } else blocks.push({ top: l.top, bottom: l.top + lineH, left: L, right: R, lines: [l] });
      }
      for (const b of blocks) {
        const text = b.lines.map((l) => l.text).join(' / ');
        let start, end, confidence = 'à vérifier';
        const r = text.match(RANGE_RE);
        const cell = (page.rects || []).filter((R) => R.x <= b.left + 1 && R.x + R.w >= b.right - 1 && R.top <= b.top + 1 && R.top + R.h >= b.bottom - 1
          && R.w < (col.right - col.left) * 1.4 && R.w > (col.right - col.left) * 0.35)
          .sort((p, q) => p.w * p.h - q.w * q.h)[0];
        const snap = (t) => { const near = slots.find((x) => Math.abs(x - t) <= 7); return near !== undefined ? near : Math.round(t / 5) * 5; };
        if (r && validHour(+r[1]) && validHour(+r[3])) {
          start = toHM(r[1], r[2]); end = toHM(r[3], r[4]); confidence = 'bonne';
        } else if (yToMin && cell) {
          start = fromMin(snap(yToMin(cell.top))); end = fromMin(snap(yToMin(cell.top + cell.h))); confidence = 'bonne';
        } else if (yToMin) {
          const tTop = yToMin(b.top);
          let s = slots.length ? slots.filter((x) => x <= tTop + 12).pop() : undefined;
          if (s === undefined) s = Math.round(tTop / 5) * 5;
          let e = s + (opts.defaultMinutes || 55);
          const near = slots.find((x) => Math.abs(x - e) <= 10);
          if (near !== undefined) e = near;
          start = fromMin(s); end = fromMin(e);
        } else continue;
        if (text.replace(RANGE_RE, '').trim().length < 2) continue;
        entries.push(buildEntry(col.day, start, end, text, opts, confidence));
      }
    }
    return entries;
  }

  /** Mode 2 : liste texte (« Lundi 08h00-09h55 6eA Gymnase »). */
  function parseList(page, opts) {
    const entries = [];
    let current = 0;
    for (const l of linesOf(page.items)) {
      const first = dayOf(l.text.split(/\s+/)[0]);
      if (first) current = first;
      const r = l.text.match(RANGE_RE);
      if (current && r && validHour(+r[1]) && validHour(+r[3])) {
        const rest = l.text.replace(r[0], ' ').replace(/^\s*\S+/, (w) => (dayOf(w) ? '' : w)).trim();
        entries.push(buildEntry(current, toHM(r[1], r[2]), toHM(r[3], r[4]), rest || l.text, opts, 'bonne'));
      }
    }
    return entries;
  }

  function median(a) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

  /**
   * @param pages [{ width, height, items: [{ str, x, top, w, h }] }]  (top : distance depuis le haut)
   * @param opts  { classes: [{id, level, section}], installations: [string] }
   */
  function parseTimetable(pages, opts = {}) {
    const all = [];
    let mode = 'aucun';
    for (const page of pages) {
      const items = page.items.filter((i) => i.str && i.str.trim());
      const p = { ...page, items };
      const grid = parseGrid(p, opts);
      if (grid && grid.length) { all.push(...grid); mode = 'grille'; continue; }
      const list = parseList(p, opts);
      if (list.length) { all.push(...list); if (mode === 'aucun') mode = 'liste'; }
    }
    // dédoublonnage
    const seen = new Set();
    const entries = all.filter((e) => { const k = `${e.day}|${e.start}|${e.end}|${e.label}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
    // Heures consécutives identiques (même classe, même lieu) = une seule séance
    const merged = [];
    for (const e of entries) {
      const last = merged[merged.length - 1];
      if (last && last.day === e.day && last.end === e.start && last.label === e.label && last.place === e.place && last.type === e.type && last.week === e.week) {
        last.end = e.end;
      } else merged.push({ ...e });
    }
    return { entries: merged, mode };
  }

  /* ---------- Côté navigateur : pdf.js ---------- */
  let pdfjsP = null;
  function loadPdfJs() {
    if (!pdfjsP) {
      pdfjsP = import(PDFJS_URL).then((m) => { m.GlobalWorkerOptions.workerSrc = WORKER_URL; return m; })
        .catch((e) => { pdfjsP = null; throw e; });
    }
    return pdfjsP;
  }
  async function extractPages(arrayBuffer) {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages = [];
    for (let n = 1; n <= Math.min(doc.numPages, 6); n++) {
      const page = await doc.getPage(n);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const items = tc.items.filter((i) => i.str !== undefined).map((i) => {
        const h = Math.hypot(i.transform[2], i.transform[3]) || i.height || 8;
        const [x, yBase] = vp.convertToViewportPoint(i.transform[4], i.transform[5]);
        return { str: i.str, x, top: yBase - h, w: i.width, h };
      });
      let rects = [];
      try { rects = await extractRects(pdfjs, page, vp); } catch { /* facultatif */ }
      pages.push({ width: vp.width, height: vp.height, items, rects });
    }
    return { doc, pages };
  }
  /** Rectangles dessinés sur la page (cases colorées de l'emploi du temps). */
  async function extractRects(pdfjs, page, vp) {
    const { OPS } = pdfjs;
    const ops = await page.getOperatorList();
    const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    const rects = [];
    const pt = (x, y) => vp.convertToViewportPoint(ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]);
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i], args = ops.argsArray[i];
      if (fn === OPS.save) stack.push(ctm);
      else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
      else if (fn === OPS.transform) ctm = mul(ctm, args);
      else if (fn === OPS.constructPath) {
        const [sub, coords] = args;
        let k = 0;
        for (const op of sub) {
          if (op === OPS.rectangle) {
            const [x, y, w, h] = coords.slice(k, k + 4);
            const p1 = pt(x, y), p2 = pt(x + w, y + h);
            const R = { x: Math.min(p1[0], p2[0]), top: Math.min(p1[1], p2[1]), w: Math.abs(p2[0] - p1[0]), h: Math.abs(p2[1] - p1[1]) };
            if (R.w > 15 && R.h > 8) rects.push(R);
            k += 4;
          } else if (op === OPS.moveTo || op === OPS.lineTo) k += 2;
          else if (op === OPS.curveTo) k += 6;
          else if (op === OPS.curveTo2 || op === OPS.curveTo3) k += 4;
        }
      }
    }
    return rects;
  }
  async function renderPage(doc, n, canvas, scale = 1.6) {
    const page = await doc.getPage(n);
    const vp = page.getViewport({ scale });
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  }

  const api = { parseTimetable, detectClass, detectPlace, detectKind, detectWeek, extractPages, renderPage, loadPdfJs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.EPS) root.EPS.pdf = api;
})(typeof window !== 'undefined' ? window : globalThis);
