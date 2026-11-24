(function (EPS) {
  const { esc } = EPS.ui;
  const S = EPS.store;
  const FRAC = [0.2, 0.45, 0.7, 1]; // part des points attribuée par degré (barème indicatif lycée)

  EPS.views.evaluation = function (main, [actId, level]) {
    if (actId && level) return sheet(main, actId, level);
    return home(main);
  };

  function home(main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Fiches d\'évaluation' }]);
    const inProgress = Object.entries(S.state.evaluations).map(([k, v]) => { const [cid, aid] = k.split('|'); return { c: S.classById(cid), a: EPS.activities.byId(aid), n: Object.keys(v).length }; }).filter((x) => x.c && x.a);
    main.innerHTML = `
      <div class="page-head"><div><h1>Fiches d'évaluation par activité</h1><p>Grilles critériées par niveau ; positionnez vos élèves directement dans l'application.</p></div></div>
      ${inProgress.length ? `<div class="card"><h2>Évaluations en cours</h2><div class="row">${inProgress.map((x) => `<a class="chip" href="#/evaluation/${x.a.id}/${x.c.level}?classe=${x.c.id}">${esc(x.a.nom)} · ${esc(S.className(x.c))} (${x.n})</a>`).join('')}</div></div>` : ''}
      ${EPS.prog.CA.map((ca) => `<div class="card">
        <div class="ca-num" style="color:${ca.color}">${ca.id}</div><h3>${esc(ca.titre)}</h3>
        <div class="tbl-wrap"><table class="tbl"><tbody>${EPS.activities.byCA(ca.id).map((a) => `<tr><td style="width:40%"><strong>${a.icon || ''} ${esc(a.nom)}</strong>${a.rich ? '' : ' <span class="chip gray">générique</span>'}</td><td>${a.levels.map((l) => `<a class="btn sm" href="#/evaluation/${a.id}/${l}">${l}</a>`).join(' ')}</td></tr>`).join('')}</tbody></table></div>
      </div>`).join('')}`;
  }

  function sheet(main, actId, level) {
    const a = EPS.activities.byId(actId);
    if (!a) return EPS.go('#/evaluation');
    const ca = EPS.prog.caById(a.ca);
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { href: '#/evaluation', label: 'Fiches d\'évaluation' }, { label: `${a.nom} — ${level}` }]);
    const classes = S.sortClasses(S.state.classes.filter((c) => c.level === level));
    const c = EPS.query.classe && S.classById(EPS.query.classe);
    const ly = S.isLycee(level);
    const { html, resolved } = EPS.gen.evaluationSheet(a, level, { className: c ? S.className(c) : level });
    const crit = resolved.evaluation;

    main.innerHTML = `
      <div class="page-head no-print">
        <div><div class="ca-num" style="color:${ca.color}">${ca.id}</div><h1>${a.icon || ''} ${esc(a.nom)} — ${esc(level)}</h1></div>
        <div class="row">
          <label class="field" style="min-width:180px">Classe à évaluer<select id="cls"><option value="">— Choisir —</option>${classes.map((x) => `<option value="${x.id}" ${c && x.id === c.id ? 'selected' : ''}>${esc(S.className(x))}</option>`).join('')}</select></label>
          <a class="btn" style="align-self:flex-end" href="#/ca/${a.ca}/${a.id}/${level}${c ? `?classe=${c.id}` : ''}">Séquence →</a>
          <button class="btn primary" style="align-self:flex-end" id="print">🖨 Imprimer</button>
        </div>
      </div>
      <div class="doc">${html}</div>
      <div id="grid"></div>`;
    main.querySelector('#print').onclick = () => EPS.ui.print(main.querySelector('.doc'), `evaluation ${a.nom} ${level}`);
    main.querySelector('#cls').onchange = (e) => EPS.go(`#/evaluation/${actId}/${level}${e.target.value ? `?classe=${e.target.value}` : ''}`);

    const grid = main.querySelector('#grid');
    if (!c) {
      grid.innerHTML = classes.length ? '<div class="card empty no-print" style="margin-top:16px">Choisissez une classe pour positionner les élèves.</div>'
        : `<div class="card empty no-print" style="margin-top:16px">Aucune classe de ${esc(level)}. <a href="#/classes">Créer une classe</a></div>`;
      return;
    }
    const key = `${c.id}|${actId}`;
    const data = S.state.evaluations[key] || {};
    const students = EPS.classesUI.sortStudents(c.students);
    if (!students.length) { grid.innerHTML = `<div class="card empty" style="margin-top:16px">Aucun élève dans la ${esc(S.className(c))}. <a href="#/classes/${c.level}/${c.id}">Ajouter des élèves</a></div>`; return; }

    const result = (r) => {
      if (!r || r.abs) return r && r.abs ? (r.abs === 'inapte' ? 'Inapte' : 'Absent') : '—';
      const vals = crit.map((_, i) => r[i]).filter(Boolean);
      if (!vals.length) return '—';
      if (ly) { const pts = crit.reduce((s, cr, i) => s + (r[i] ? cr.points * FRAC[r[i] - 1] : 0), 0); return `${Math.round(pts * 2) / 2} / ${crit.reduce((s, cr) => s + cr.points, 0)}`; }
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      return EPS.prog.DEGRES[Math.min(3, Math.round(avg) - 1)];
    };

    grid.innerHTML = `
      <div class="card" style="margin-top:16px">
        <div class="card-head"><h2>Positionnement — ${esc(S.className(c))}</h2>
          <div class="row no-print"><span class="muted small">1 = ${esc(EPS.prog.DEGRES[0])} … 4 = ${esc(EPS.prog.DEGRES[3])}</span><button class="btn sm" id="csv">⬇ Export CSV</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Élève</th>${crit.map((cr) => `<th title="${esc(cr.critere)}">${ly ? esc(cr.afl) + ' /' + cr.points : esc(cr.critere.length > 38 ? cr.critere.slice(0, 36) + '…' : cr.critere)}</th>`).join('')}<th>Abs./Inapte</th><th>Résultat</th></tr></thead>
          <tbody>${students.map((s) => { const r = data[s.id] || {}; return `<tr data-s="${s.id}">
            <td><div class="row" style="flex-wrap:nowrap">${EPS.classesUI.avatar(s)}<div><strong>${esc(s.lastName.toUpperCase())}</strong> ${esc(s.firstName)}${EPS.classesUI.isInapte(s) ? ' <span class="chip danger">inapte</span>' : ''}</div></div></td>
            ${crit.map((_, i) => `<td><div class="deg">${[1, 2, 3, 4].map((d) => `<button class="d${d} ${r[i] === d ? 'on' : ''}" data-c="${i}" data-d="${d}">${d}</button>`).join('')}</div></td>`).join('')}
            <td><select data-abs style="width:auto"><option value="">—</option><option value="absent" ${r.abs === 'absent' ? 'selected' : ''}>Absent</option><option value="inapte" ${r.abs === 'inapte' ? 'selected' : ''}>Inapte</option></select></td>
            <td class="res"><strong>${esc(result(r))}</strong></td></tr>`; }).join('')}</tbody>
        </table></div>
        ${ly ? '<p class="muted small">Résultat indicatif : degré 1 = 20 %, 2 = 45 %, 3 = 70 %, 4 = 100 % des points de l\'AFL. À ajuster selon le référentiel de l\'établissement.</p>' : ''}
      </div>`;

    const persist = () => { S.state.evaluations[key] = data; S.save(); };
    grid.querySelectorAll('tr[data-s]').forEach((tr) => {
      const sid = tr.dataset.s;
      tr.querySelectorAll('.deg button').forEach((b) => {
        b.onclick = () => {
          const r = data[sid] = data[sid] || {};
          const i = Number(b.dataset.c), d = Number(b.dataset.d);
          r[i] = r[i] === d ? undefined : d;
          tr.querySelectorAll(`[data-c="${i}"]`).forEach((x) => x.classList.toggle('on', Number(x.dataset.d) === r[i]));
          tr.querySelector('.res').innerHTML = `<strong>${esc(result(r))}</strong>`;
          persist();
        };
      });
      tr.querySelector('[data-abs]').onchange = (e) => { const r = data[sid] = data[sid] || {}; r.abs = e.target.value || undefined; tr.querySelector('.res').innerHTML = `<strong>${esc(result(r))}</strong>`; persist(); };
    });
    grid.querySelector('#csv').onclick = () => {
      const head = ['Nom', 'Prénom', ...crit.map((cr) => (ly ? `${cr.afl} ${cr.critere}` : cr.critere)), 'Absence', 'Résultat'];
      const rows = students.map((s) => { const r = data[s.id] || {}; return [s.lastName, s.firstName, ...crit.map((_, i) => r[i] || ''), r.abs || '', result(r)]; });
      const csv = [head, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
      EPS.ui.download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `evaluation-${actId}-${S.className(c).replace(/\s/g, '')}.csv`);
    };
  }
})(window.EPS);
