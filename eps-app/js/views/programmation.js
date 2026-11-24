/* Programmation EPS (vue référent) : couverture des champs d'apprentissage par classe. */
(function (EPS) {
  const { esc } = EPS.ui;
  const S = EPS.store;

  EPS.views.programmation = function (main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Programmation EPS' }]);
    const classes = S.sortClasses(S.state.classes);
    const hasLycee = classes.some((c) => S.isLycee(c.level));
    const cas = EPS.prog.CA.filter((c) => !c.lyceeOnly || hasLycee);
    const rows = classes.map((c) => {
      const seqs = EPS.seq.forClass(c);
      const allowed = EPS.prog.caForLevel(c.level).map((x) => x.id);
      const cells = Object.fromEntries(cas.map((ca) => [ca.id, seqs.filter((s) => s.activity.ca === ca.id)]));
      const missing = allowed.filter((id) => !cells[id].length);
      return { c, seqs, cells, allowed, missing };
    });
    const total = rows.reduce((n, r) => n + r.allowed.length, 0);
    const covered = rows.reduce((n, r) => n + r.allowed.length - r.missing.length, 0);

    main.innerHTML = `
      <div class="page-head">
        <div><h1>Programmation EPS</h1><p>Couverture des champs d'apprentissage sur l'année, classe par classe. Collège : 4 CA ; lycée : 5 CA.</p></div>
      </div>
      ${classes.length ? `
      <div class="grid grid-3 keep2" style="margin-bottom:16px">
        <div class="card stat"><span class="l">CA couverts</span><span class="v">${covered} / ${total}</span><div class="progress"><i style="width:${total ? (covered / total) * 100 : 0}%;background:var(--primary)"></i></div></div>
        <div class="card stat"><span class="l">Séquences programmées</span><span class="v">${rows.reduce((n, r) => n + r.seqs.length, 0)}</span></div>
        <div class="card stat"><span class="l">Classes à compléter</span><span class="v">${rows.filter((r) => r.missing.length).length}</span></div>
      </div>
      <div class="card"><div class="tbl-wrap"><table class="tbl prog">
        <thead><tr><th>Classe</th>${cas.map((ca) => `<th style="color:${ca.color}">${ca.id}<br><span class="th-sub">${esc(ca.court)}</span></th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>
          <td><a href="#/classes/${r.c.level}/${r.c.id}?tab=sequences"><strong>${esc(S.className(r.c))}</strong></a><div class="muted small">${r.c.students.length} élèves</div></td>
          ${cas.map((ca) => {
            if (!r.allowed.includes(ca.id)) return '<td class="na">—</td>';
            const list = r.cells[ca.id];
            return `<td class="${list.length ? '' : 'gap'}">${list.map((s) => `<a class="prog-item" href="#/classes/${r.c.level}/${r.c.id}?tab=sequences" style="--c:${ca.color}">${esc(s.activity.nom)}<span>${s.dates[0] ? EPS.seq.fr(s.dates[0]).slice(0, 5) : ''}${s.end ? ' → ' + EPS.seq.fr(s.end).slice(0, 5) : ''} · ${EPS.seq.STATUS[s.status][0].toLowerCase()}</span></a>`).join('')}
              <button class="btn sm ghost add-ca" data-c="${r.c.id}" data-ca="${ca.id}">＋ ${list.length ? '' : 'Programmer'}</button></td>`;
          }).join('')}
        </tr>`).join('')}</tbody>
      </table></div></div>
      <p class="muted small" style="margin-top:10px">Cases orange : champ d'apprentissage pas encore programmé cette année. Cette vue couvre vos classes ; pour l'équipe entière, chaque collègue partage sa sauvegarde.</p>`
      : '<div class="card empty">Aucune classe. <a href="#/classes">Créer vos classes</a> puis programmez vos séquences.</div>'}`;

    main.querySelectorAll('.add-ca').forEach((b) => {
      b.onclick = () => {
        const c = S.classById(b.dataset.c);
        const first = EPS.activities.byCA(b.dataset.ca).find((a) => a.levels.includes(c.level) && a.rich) || EPS.activities.byCA(b.dataset.ca).find((a) => a.levels.includes(c.level));
        EPS.classProgram.sequenceModal(c, null, { activityId: first && first.id });
      };
    });
  };
})(window.EPS);
