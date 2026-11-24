(function (EPS) {
  const { esc, isoDate, parseISO, pad } = EPS.ui;
  const S = EPS.store;

  const schoolScope = () => {
    const t = S.state.profile.school.type;
    return EPS.query.portee || (t === 'lycee' ? 'lycee' : t === 'cite' ? 'tous' : 'college');
  };
  const qs = (extra = {}) => {
    const q = { ...EPS.query, ...extra };
    const s = Object.entries(q).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return s ? `?${s}` : '';
  };

  EPS.views.ca = function (main, [caId, actId, level]) {
    if (caId && actId && level) return docView(main, caId, actId, level);
    if (caId && actId) return levelPick(main, caId, actId);
    if (caId) return activityList(main, caId);
    return caHome(main);
  };

  /* ---------- Liste des CA ---------- */
  function caHome(main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Champs d\'apprentissage' }]);
    const scope = schoolScope();
    const lvl = EPS.query.niveau;
    const cas = EPS.prog.CA.filter((c) => (lvl ? !c.lyceeOnly || S.isLycee(lvl) : scope !== 'college' || !c.lyceeOnly));
    main.innerHTML = `
      <div class="page-head">
        <div><h1>Champs d'apprentissage</h1><p>${lvl ? `Niveau ${esc(lvl)} : ` : ''}${cas.length === 4 ? '6e, 5e, 4e, 3e : 4 champs d\'apprentissage' : '2nde, 1re, Tle : 5 champs d\'apprentissage'}</p></div>
        ${lvl ? '' : `<div class="seg">${[['college', 'Collège'], ['lycee', 'Lycée'], ['tous', 'Tous']].map(([v, l]) => `<button data-scope="${v}" class="${scope === v ? 'active' : ''}">${l}</button>`).join('')}</div>`}
      </div>
      <div class="grid grid-${cas.length === 5 ? '3' : '2'}">
        ${cas.map((c) => `<a class="tile ca-card" href="#/ca/${c.id}${qs()}"><span class="bar" style="background:${c.color}"></span>
          <div class="ca-num" style="color:${c.color}">${c.id}${c.lyceeOnly ? ' · lycée uniquement' : ''}</div>
          <div class="tile-title" style="font-size:1.05rem;margin-top:6px">${esc(c.titre)}</div>
          <div class="tile-sub">${EPS.activities.byCA(c.id).map((a) => a.nom).slice(0, 5).join(', ')}…</div></a>`).join('')}
      </div>
      <div class="card" style="margin-top:20px">
        <div class="card-head"><h2>✅ Fiche d'évaluation par activité</h2><a class="btn sm" href="#/evaluation">Toutes les fiches</a></div>
        <p class="muted small">Choisissez une activité et un niveau pour ouvrir la grille d'évaluation (critères et degrés d'acquisition).</p>
        <div class="row">
          <select id="ev-act" style="max-width:320px">${cas.map((c) => `<optgroup label="${c.id} — ${esc(c.court)}">${EPS.activities.byCA(c.id).map((a) => `<option value="${a.id}">${esc(a.nom)}</option>`).join('')}</optgroup>`).join('')}</select>
          <select id="ev-lvl" style="max-width:140px"></select>
          <button class="btn primary" id="ev-go">Ouvrir</button>
        </div>
      </div>`;
    main.querySelectorAll('[data-scope]').forEach((b) => { b.onclick = () => EPS.go(`#/ca${qs({ portee: b.dataset.scope })}`); });
    const act = main.querySelector('#ev-act'), lv = main.querySelector('#ev-lvl');
    const fillLv = () => { const a = EPS.activities.byId(act.value); lv.innerHTML = a.levels.filter((l) => !lvl || l === lvl).map((l) => `<option>${l}</option>`).join(''); };
    act.onchange = fillLv; fillLv();
    main.querySelector('#ev-go').onclick = () => EPS.go(`#/evaluation/${act.value}/${lv.value}${EPS.query.classe ? `?classe=${EPS.query.classe}` : ''}`);
  }

  /* ---------- Activités d'un CA ---------- */
  function activityList(main, caId) {
    const ca = EPS.prog.caById(caId);
    if (!ca) return EPS.go('#/ca');
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { href: `#/ca${qs()}`, label: 'Champs d\'apprentissage' }, { label: ca.id }]);
    const lvl = EPS.query.niveau;
    const acts = EPS.activities.byCA(caId).filter((a) => !lvl || a.levels.includes(lvl));
    const specs = S.state.profile.specialites;
    main.innerHTML = `
      <div class="page-head"><div>
        <div class="ca-num" style="color:${ca.color}">${ca.id}${lvl ? ` · ${esc(lvl)}` : ''}</div>
        <h1>${esc(ca.titre)}</h1><p>Choisissez une activité.</p></div></div>
      <div class="activity-list">${acts.map((a) => `
        <a class="tile" href="#/ca/${caId}/${a.id}${qs()}"><span class="bar" style="background:${ca.color}"></span>
          <div class="row"><span style="font-size:1.5rem">${a.icon || '•'}</span><div class="tile-title" style="font-size:1rem">${esc(a.nom)}</div></div>
          <div class="row" style="margin-top:8px">${a.rich ? '<span class="chip">Contenu détaillé</span>' : '<span class="chip gray">Trame à compléter</span>'}${specs.includes(a.nom) ? '<span class="chip warn">★ spécialité</span>' : ''}</div>
        </a>`).join('')}</div>
      <div class="card" style="margin-top:20px"><h2>Attendus</h2>
        ${['c3', 'c4', 'ly'].filter((c) => ca.afc[c] && (!lvl || S.cycleOf(lvl) === c)).map((c) => `<h3 style="margin-top:10px">${EPS.prog.CYCLE_LABEL[c]}</h3><ul>${ca.afc[c].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}
      </div>`;
  }

  /* ---------- Choix du niveau ---------- */
  function levelPick(main, caId, actId) {
    const ca = EPS.prog.caById(caId), a = EPS.activities.byId(actId);
    if (!a) return EPS.go(`#/ca/${caId}`);
    if (EPS.query.niveau && a.levels.includes(EPS.query.niveau)) return EPS.go(`#/ca/${caId}/${actId}/${EPS.query.niveau}${qs()}`);
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { href: '#/ca', label: 'Champs d\'apprentissage' }, { href: `#/ca/${caId}`, label: ca.id }, { label: a.nom }]);
    const scope = schoolScope();
    const levels = a.levels.filter((l) => scope === 'tous' || (scope === 'lycee' ? S.isLycee(l) : !S.isLycee(l)));
    const shown = levels.length ? levels : a.levels;
    main.innerHTML = `
      <div class="page-head"><div><div class="ca-num" style="color:${ca.color}">${ca.id}</div><h1>${a.icon || ''} ${esc(a.nom)}</h1><p>Pour quel niveau ?</p></div></div>
      <div class="level-pick">${shown.map((l) => `<a class="tile lvl" href="#/ca/${caId}/${actId}/${l}${qs()}" style="color:${S.LEVEL_COLOR[l]}"><span class="bar" style="background:${S.LEVEL_COLOR[l]}"></span>${esc(l)}</a>`).join('')}</div>
      ${shown.length < a.levels.length ? `<p class="muted small" style="margin-top:12px">Autres niveaux : ${a.levels.filter((l) => !shown.includes(l)).map((l) => `<a href="#/ca/${caId}/${actId}/${l}">${l}</a>`).join(', ')}</p>` : ''}`;
  }

  /** Dates des prochaines séances d'une classe d'après l'emploi du temps. */
  function sessionDates(classId, startIso, n) {
    if (!classId || !startIso) return [];
    const out = [];
    const d = parseISO(startIso);
    for (let i = 0; i < 370 && out.length < n; i++) {
      if (S.slotsOn(d).some((e) => e.classId === classId && e.type !== 'autre' && (!e.label || e.label === S.className(S.classById(classId))))) out.push(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`);
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function schoolYear() { const d = new Date(); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${y + 1}`; }

  /* ---------- Document : séquence / séances / évaluation ---------- */
  function docView(main, caId, actId, level) {
    const ca = EPS.prog.caById(caId), a = EPS.activities.byId(actId);
    if (!a || !ca) return EPS.go('#/ca');
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { href: '#/ca', label: 'CA' }, { href: `#/ca/${caId}`, label: ca.id }, { href: `#/ca/${caId}/${actId}`, label: a.nom }, { label: level }]);
    const pr = S.state.profile.prefs;
    const tab = EPS.query.doc || 'sequence';
    const classes = S.sortClasses(S.state.classes.filter((c) => c.level === level));
    const classId = EPS.query.classe && S.classById(EPS.query.classe) ? EPS.query.classe : '';
    const opts = {
      sessions: Number(EPS.query.n || pr.sessionsPerSequence || 8),
      minutes: Number(EPS.query.min || pr.sessionMinutes || 110),
      className: classId ? S.className(S.classById(classId)) : level,
      year: schoolYear(),
    };
    const startIso = EPS.query.debut || '';
    opts.dates = sessionDates(classId, startIso, opts.sessions);
    const key = `${actId}|${level}|${tab}`;
    const custom = S.state.customDocs[key];

    let html;
    if (custom) html = custom;
    else if (tab === 'seances') html = EPS.gen.sessions(a, level, opts).join('');
    else if (tab === 'evaluation') html = EPS.gen.evaluationSheet(a, level, opts).html;
    else html = EPS.gen.sequence(a, level, opts).html;

    main.innerHTML = `
      <div class="no-print">
        <div class="page-head">
          <div><div class="ca-num" style="color:${ca.color}">${ca.id} · ${esc(EPS.prog.CYCLE_LABEL[S.cycleOf(level)])}</div><h1>${a.icon || ''} ${esc(a.nom)} — ${esc(level)}</h1></div>
          <div class="row">
            <div class="seg">${a.levels.map((l) => `<button data-lvl="${l}" class="${l === level ? 'active' : ''}">${l}</button>`).join('')}</div>
          </div>
        </div>
        <div class="card" style="margin-bottom:14px">
          <div class="row">
            <label class="field" style="min-width:150px">Classe<select id="o-class"><option value="">${esc(level)} (générique)</option>${classes.map((c) => `<option value="${c.id}" ${c.id === classId ? 'selected' : ''}>${esc(S.className(c))}</option>`).join('')}</select></label>
            <label class="field">1re séance le<input type="date" id="o-start" value="${esc(startIso)}"></label>
            <label class="field" style="width:110px">Séances<input type="number" id="o-n" min="4" max="16" value="${opts.sessions}"></label>
            <label class="field" style="width:120px">Durée (min)<input type="number" id="o-min" min="30" max="240" step="5" value="${opts.minutes}"></label>
            <button class="btn" id="o-apply" style="align-self:flex-end">Appliquer</button>
          </div>
          ${classId && startIso && opts.dates.length < opts.sessions ? '<p class="muted small" style="margin:8px 0 0">Dates incomplètes : vérifiez que la classe a des créneaux dans votre emploi du temps.</p>' : ''}
          ${classId && !startIso ? '<p class="muted small" style="margin:8px 0 0">Indiquez la date de la 1re séance : les dates sont calculées d\'après votre emploi du temps (vacances exclues).</p>' : ''}
        </div>
        <div class="tabs">
          <button data-doc="sequence" class="${tab === 'sequence' ? 'active' : ''}">📋 Plan de séquence</button>
          <button data-doc="seances" class="${tab === 'seances' ? 'active' : ''}">🗓 Plans de séance (${opts.sessions})</button>
          <button data-doc="evaluation" class="${tab === 'evaluation' ? 'active' : ''}">✅ Fiche d'évaluation</button>
        </div>
        <div class="row" style="margin-bottom:12px">
          <button class="btn primary" id="print">🖨 Imprimer / PDF</button>
          <button class="btn" id="edit">✎ Personnaliser</button>
          ${custom ? '<span class="chip warn">Version personnalisée</span><button class="btn sm danger" id="reset">Revenir au modèle</button>' : ''}
          ${tab === 'evaluation' && classes.length ? `<span class="spacer"></span><a class="btn" href="#/evaluation/${actId}/${level}${classId ? `?classe=${classId}` : ''}">Évaluer les élèves →</a>` : ''}
        </div>
      </div>
      <div class="doc" id="doc">${html}</div>`;

    main.querySelectorAll('[data-lvl]').forEach((b) => { b.onclick = () => EPS.go(`#/ca/${caId}/${actId}/${b.dataset.lvl}${qs({ classe: undefined, niveau: undefined })}`); });
    main.querySelectorAll('[data-doc]').forEach((b) => { b.onclick = () => EPS.go(`#/ca/${caId}/${actId}/${level}${qs({ doc: b.dataset.doc })}`); });
    main.querySelector('#o-apply').onclick = () => EPS.go(`#/ca/${caId}/${actId}/${level}${qs({
      classe: main.querySelector('#o-class').value, debut: main.querySelector('#o-start').value,
      n: main.querySelector('#o-n').value, min: main.querySelector('#o-min').value,
    })}`);
    main.querySelector('#o-class').onchange = () => main.querySelector('#o-apply').click();
    main.querySelector('#print').onclick = () => EPS.ui.print();
    const doc = main.querySelector('#doc');
    const editBtn = main.querySelector('#edit');
    editBtn.onclick = () => {
      if (doc.isContentEditable) {
        doc.contentEditable = 'false';
        S.state.customDocs[key] = doc.innerHTML;
        S.save();
        EPS.ui.toast('Version personnalisée enregistrée ✔');
        EPS.rerender();
      } else {
        doc.contentEditable = 'true';
        doc.focus();
        editBtn.textContent = '💾 Enregistrer mes modifications';
        editBtn.classList.add('primary');
        EPS.ui.toast('Cliquez dans le document pour modifier le texte');
      }
    };
    const reset = main.querySelector('#reset');
    if (reset) reset.onclick = async () => { if (await EPS.ui.confirm('Supprimer vos modifications et revenir au modèle ?', { okLabel: 'Revenir au modèle' })) { delete S.state.customDocs[key]; S.save(); EPS.rerender(); } };
  }

  EPS.caUI = { sessionDates };
})(window.EPS);
