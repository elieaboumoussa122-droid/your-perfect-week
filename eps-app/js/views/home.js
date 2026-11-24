(function (EPS) {
  const { esc, fmtTime, longDate, isoDate, toMin, parseISO } = EPS.ui;
  const S = EPS.store;

  EPS.views.home = function (main) {
    EPS.ui.setCrumbs([{ label: 'Accueil' }]);
    const st = S.state;
    const p = st.profile;
    const now = new Date();
    const todayIso = isoDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const hello = now.getHours() < 18 ? 'Bonjour' : 'Bonsoir';
    const per = (st.schoolYear.periods || []).find((x) => x.from <= todayIso && todayIso <= x.to);

    // Journée affichée : aujourd'hui, ou le prochain jour avec des cours
    let day = new Date(now), slots = S.slotsOn(day), isToday = true;
    if (!slots.length) {
      for (let d = 1; d < 15; d++) { const x = new Date(now); x.setDate(now.getDate() + d); const l = S.slotsOn(x); if (l.length) { day = x; slots = l; isToday = false; break; } }
    }
    const dayIso = isoDate(day);
    const nextIdx = isToday ? slots.findIndex((e) => toMin(e.end) > nowMin) : 0;

    // Mise en route
    const steps = [
      { ok: !!(p.firstName && p.school.name), label: 'Compléter mon profil et mon établissement', href: '#/profil' },
      { ok: !!(st.schoolYear.start && st.schoolYear.end), label: 'Renseigner l\'année scolaire (rentrée, vacances)', href: '#/calendrier?annee=1' },
      { ok: st.timetable.length > 0, label: 'Importer mon emploi du temps (PDF)', href: '#/emploi-du-temps' },
      { ok: st.classes.length > 0 && st.classes.every((c) => c.students.length), label: 'Ajouter les élèves de chaque classe', href: '#/classes' },
      { ok: st.classes.some((c) => (c.sequences || []).length), label: 'Programmer une première séquence', href: '#/classes' },
    ];
    const done = steps.filter((s) => s.ok).length;

    // À faire
    const todo = [];
    const epsClasses = S.sortClasses(st.classes).filter((c) => st.timetable.some((e) => EPS.seq.isClassSession(e, c)));
    S.slotsOn(now).forEach((e) => {
      const c = e.classId && S.classById(e.classId);
      if (c && c.students.length && EPS.seq.isClassSession(e, c) && toMin(e.start) <= nowMin && !EPS.att.get(c, todayIso)) todo.push({ tone: 'warn', html: `Appel non fait : <strong>${esc(S.className(c))}</strong> (${fmtTime(e.start)})`, act: `att:${c.id}` });
    });
    st.classes.forEach((c) => {
      EPS.seq.forClass(c).forEach((s) => {
        if (s.complete && s.end >= todayIso && (parseISO(s.end) - now) / 864e5 <= 10) todo.push({ tone: '', html: `Évaluation finale <strong>${esc(s.activity.nom)}</strong> en ${esc(S.className(c))} le ${EPS.seq.fr(s.end)}`, href: `#/evaluation/${s.activity.id}/${c.level}?classe=${c.id}` });
        if (!s.complete) todo.push({ tone: 'warn', html: `Séquence <strong>${esc(s.activity.nom)}</strong> (${esc(S.className(c))}) : pas assez de créneaux avant la fin d'année`, href: `#/classes/${c.level}/${c.id}?tab=sequences` });
      });
    });
    const noSeq = epsClasses.filter((c) => !EPS.seq.forClass(c).some((s) => s.status !== 'terminee'));
    if (noSeq.length) todo.push({ tone: '', html: `Aucune séquence programmée : ${noSeq.map((c) => `<a href="#/classes/${c.level}/${c.id}?tab=sequences">${esc(S.className(c))}</a>`).join(', ')}` });
    const noStud = epsClasses.filter((c) => !c.students.length);
    if (noStud.length) todo.push({ tone: '', html: `Classes sans élèves : ${noStud.map((c) => `<a href="#/classes/${c.level}/${c.id}?tab=eleves">${esc(S.className(c))}</a>`).join(', ')}` });
    const inaptes = st.classes.flatMap((c) => c.students.filter(EPS.classesUI.isInapte).map((s) => ({ s, c })));
    if (inaptes.length) todo.push({ tone: '', html: `Inaptitudes en cours : ${inaptes.map(({ s, c }) => `${esc(s.firstName)} ${esc(s.lastName.toUpperCase())} (${esc(S.className(c))}${s.inapte.until ? `, jusqu'au ${EPS.seq.fr(s.inapte.until)}` : ''})`).join(' · ')}` });
    p.qualifs.filter((q) => q.until && (parseISO(q.until) - now) / 864e5 < 60).forEach((q) => todo.push({ tone: 'warn', html: `Qualification à renouveler : <strong>${esc(q.name)}</strong> (${EPS.seq.fr(q.until)})`, href: '#/profil' }));
    const in14 = new Date(now); in14.setDate(now.getDate() + 14);
    st.events.filter((e) => e.date >= todayIso && e.date <= isoDate(in14)).sort((a, b) => a.date.localeCompare(b.date))
      .forEach((e) => todo.push({ tone: 'event', html: `${EPS.seq.fr(e.date)} — <strong>${esc(e.title)}</strong> <span class="muted">${esc(e.type || '')}</span>`, href: '#/calendrier' }));

    main.innerHTML = `
      <div class="page-head">
        <div><h1>${hello}${p.firstName ? ' ' + esc(p.firstName) : ''}</h1>
          <p>${esc(longDate(now))}${S.weekType(now) ? ` · Semaine ${S.weekType(now)}` : ''}${per ? ` · ${esc(per.label)}` : ''}${S.isHoliday(now) ? ` · ${esc(S.isHoliday(now).label)}` : ''}</p></div>
      </div>

      ${done < steps.length ? `<div class="card setup">
        <div class="card-head"><h2>Mise en route</h2><span class="muted small">${done} / ${steps.length} étapes</span></div>
        <div class="progress" style="margin:-4px 0 12px"><i style="width:${(done / steps.length) * 100}%;background:var(--primary)"></i></div>
        <ol class="steps">${steps.map((s) => `<li class="${s.ok ? 'ok' : ''}"><span class="dot">${s.ok ? '✓' : ''}</span>${s.ok ? esc(s.label) : `<a href="${s.href}">${esc(s.label)}</a>`}</li>`).join('')}</ol>
      </div>` : ''}

      <div class="home-grid">
        <section class="card">
          <div class="card-head"><h2>${isToday ? 'Aujourd\'hui' : `Prochains cours — ${esc(longDate(day))}`}</h2><a class="btn sm" href="#/emploi-du-temps">Emploi du temps</a></div>
          ${slots.length ? `<div class="timeline">${slots.map((e, i) => slotRow(e, i)).join('')}</div>` : '<p class="muted">Aucun cours dans les deux prochaines semaines.</p>'}
        </section>
        <section class="card">
          <div class="card-head"><h2>À faire</h2>${todo.length ? `<span class="chip gray">${todo.length}</span>` : ''}</div>
          ${todo.length ? `<ul class="todo">${todo.map((t, i) => `<li class="${t.tone}">${t.href ? `<a class="todo-link" href="${t.href}">${t.html}</a>` : t.act ? `<button class="todo-link" data-todo="${i}">${t.html}</button>` : t.html}</li>`).join('')}</ul>` : '<p class="muted">Rien en attente. Les appels à faire, évaluations finales proches, inaptitudes et événements apparaîtront ici.</p>'}
        </section>
      </div>

      ${epsClasses.length ? `<section class="card" style="margin-top:16px">
        <div class="card-head"><h2>Mes classes</h2><a class="btn sm" href="#/programmation">Programmation EPS</a></div>
        <div class="class-strip">${epsClasses.map((c) => { const s = EPS.seq.current(c); return `
          <a class="class-pill" href="#/classes/${c.level}/${c.id}" style="--lv:${S.LEVEL_COLOR[c.level]}">
            <strong>${esc(S.className(c))}</strong>
            <span>${s ? `${esc(s.activity.nom)} · ${s.done}/${s.sessions}` : '<em>Aucune séquence</em>'}</span>
          </a>`; }).join('')}</div>
      </section>` : ''}`;

    main.querySelectorAll('[data-todo]').forEach((b) => { b.onclick = () => { const t = todo[Number(b.dataset.todo)]; const c = S.classById(t.act.split(':')[1]); EPS.att.modal(c, todayIso); }; });
    main.querySelectorAll('[data-att]').forEach((b) => { b.onclick = () => EPS.att.modal(S.classById(b.dataset.att), dayIso); });

    function slotRow(e, i) {
      const c = e.classId && S.classById(e.classId);
      const eps = c && EPS.seq.isClassSession(e, c);
      const ses = eps && EPS.seq.sessionOn(c, dayIso);
      const live = isToday && toMin(e.start) <= nowMin && nowMin < toMin(e.end);
      const past = isToday && toMin(e.end) <= nowMin;
      const sm = c && EPS.att.summary(c, dayIso);
      const tag = live ? '<span class="chip">En cours</span>' : i === nextIdx && !past ? '<span class="chip gray">À suivre</span>' : '';
      return `<div class="tl-row ${eps ? '' : 'muted-row'} ${past ? 'past' : ''} ${live ? 'live' : ''}" style="--c:${S.entryColor(e)}">
        <div class="tl-time">${fmtTime(e.start)}<span>${fmtTime(e.end)}</span></div>
        <div class="tl-body">
          <div class="row" style="gap:8px">${c ? `<a href="#/classes/${c.level}/${c.id}"><strong>${esc(S.entryLabel(e))}</strong></a>` : `<strong>${esc(S.entryLabel(e))}</strong>`}${tag}</div>
          <div class="muted small">${[e.place, ses ? `Séance ${ses.k}/${ses.seq.sessions} · ${ses.seq.activity.nom}` : eps ? 'Pas de séquence programmée' : '', sm ? EPS.att.summaryText(sm) : ''].filter(Boolean).map(esc).join(' · ')}</div>
        </div>
        ${eps ? `<div class="tl-actions">
          ${c.students.length ? `<button class="btn sm ${sm ? '' : 'primary'}" data-att="${c.id}">${sm ? 'Appel ✓' : 'Faire l\'appel'}</button>` : `<a class="btn sm" href="#/classes/${c.level}/${c.id}?tab=eleves">Ajouter les élèves</a>`}
          ${ses ? `<a class="btn sm" href="#/ca/${ses.seq.activity.ca}/${ses.seq.activity.id}/${c.level}?classe=${c.id}&debut=${ses.seq.start}&n=${ses.seq.sessions}&min=${ses.seq.minutes}&doc=seances">Séance</a>` : ''}
        </div>` : ''}
      </div>`;
    }
  };
})(window.EPS);
