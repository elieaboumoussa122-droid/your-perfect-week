(function (EPS) {
  const { esc, fmtTime, longDate, isoDate, toMin } = EPS.ui;
  const S = EPS.store;

  EPS.views.home = function (main) {
    EPS.ui.setCrumbs([{ label: 'Accueil' }]);
    const st = S.state;
    const p = st.profile;
    const now = new Date();
    const hour = now.getHours();
    const hello = hour < 18 ? 'Bonjour' : 'Bonsoir';
    const students = st.classes.reduce((n, c) => n + c.students.length, 0);
    const inaptes = st.classes.reduce((n, c) => n + c.students.filter((s) => s.inapte && s.inapte.active && (!s.inapte.until || s.inapte.until >= isoDate(now))).length, 0);

    // Aujourd'hui + prochain cours
    const today = S.slotsOn(now);
    let next = null;
    for (let d = 0; d < 14 && !next; d++) {
      const day = new Date(now); day.setDate(now.getDate() + d);
      const list = S.slotsOn(day).filter((e) => d > 0 || toMin(e.start) > now.getHours() * 60 + now.getMinutes());
      if (list.length) next = { date: day, e: list[0] };
    }
    const weekSlots = (() => { let n = 0; const m = new Date(now); m.setDate(now.getDate() - ((now.getDay() + 6) % 7)); for (let i = 0; i < 6; i++) { const d = new Date(m); d.setDate(m.getDate() + i); n += S.slotsOn(d).length; } return n; })();

    const in14 = new Date(now); in14.setDate(now.getDate() + 14);
    const events = st.events.filter((e) => e.date >= isoDate(now) && e.date <= isoDate(in14)).sort((a, b) => a.date.localeCompare(b.date));
    const expiring = p.qualifs.filter((q) => q.until && (new Date(q.until) - now) / 864e5 < 60);
    const profileDone = p.firstName && p.school.name;
    const caList = EPS.prog.CA.filter((c) => p.school.type !== 'college' || !c.lyceeOnly);

    main.innerHTML = `
      <div class="page-head">
        <div><h1>${hello}${p.firstName ? ' ' + esc(p.firstName) : ''} 👋</h1><p>${esc(longDate(now))}${S.weekType(now) ? ` · Semaine ${S.weekType(now)}` : ''}${S.isHoliday(now) ? ` · ${esc(S.isHoliday(now).label)}` : ''}</p></div>
        <a class="btn primary" href="#/ca">🏅 Préparer une séquence</a>
      </div>
      ${profileDone ? '' : `<div class="notice" style="margin-bottom:16px">Bienvenue dans EPS Pro ! Commencez par <a href="#/profil">compléter votre profil</a>, <a href="#/classes">créer vos classes</a> puis <a href="#/emploi-du-temps">importer votre emploi du temps (PDF)</a>.</div>`}
      ${expiring.length ? `<div class="notice warn" style="margin-bottom:16px">⚠️ Qualification à renouveler : ${expiring.map((q) => `${esc(q.name)} (${esc(q.until)})`).join(', ')}</div>` : ''}

      <div class="grid grid-4 keep2">
        <div class="card stat"><span class="v">${st.classes.length}</span><span class="l">classes</span></div>
        <div class="card stat"><span class="v">${students}</span><span class="l">élèves</span></div>
        <div class="card stat"><span class="v">${weekSlots}</span><span class="l">créneaux cette semaine</span></div>
        <div class="card stat"><span class="v">${inaptes}</span><span class="l">élève(s) inapte(s)</span></div>
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <div class="card">
          <div class="card-head"><h2>Aujourd'hui</h2><a class="btn sm" href="#/emploi-du-temps">Emploi du temps</a></div>
          ${today.length ? `<div class="stack">${today.map(slotRow).join('')}</div>` : `<p class="muted">Pas de cours aujourd'hui.</p>`}
          ${next ? `<div class="notice" style="margin-top:14px">Prochain cours : <strong>${esc(S.entryLabel(next.e))}</strong> — ${esc(longDate(next.date))} à ${fmtTime(next.e.start)}${next.e.place ? ` (${esc(next.e.place)})` : ''}</div>` : ''}
        </div>
        <div class="card">
          <div class="card-head"><h2>À venir (14 jours)</h2><a class="btn sm" href="#/calendrier">Calendrier</a></div>
          ${events.length ? `<div class="stack">${events.map((e) => `<div class="row"><span class="chip">${esc(e.date.split('-').reverse().join('/'))}</span><strong>${esc(e.title)}</strong><span class="muted small">${esc(e.type || '')}</span></div>`).join('')}</div>` : '<p class="muted">Aucun événement. Ajoutez compétitions UNSS, sorties, conseils de classe… dans le calendrier.</p>'}
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-head"><h2>Champs d'apprentissage</h2><a class="btn sm" href="#/evaluation">Fiches d'évaluation</a></div>
        <div class="grid grid-${caList.length === 5 ? '3' : '4'}">
          ${caList.map((c) => `<a class="tile" href="#/ca/${c.id}"><span class="bar" style="background:${c.color}"></span><div class="ca-num" style="color:${c.color}">${c.id}${c.lyceeOnly ? ' · lycée' : ''}</div><div class="tile-sub" style="color:var(--text)">${esc(c.titre)}</div></a>`).join('')}
        </div>
      </div>`;

    function slotRow(e) {
      const c = e.classId && S.classById(e.classId);
      return `<div class="row" style="border-left:4px solid ${S.entryColor(e)};padding-left:10px">
        <strong style="min-width:110px">${fmtTime(e.start)} – ${fmtTime(e.end)}</strong>
        ${c ? `<a href="#/classes/${c.level}/${c.id}"><strong>${esc(S.entryLabel(e))}</strong></a>` : `<strong>${esc(S.entryLabel(e))}</strong>`}
        <span class="muted small">${esc(e.place || '')}</span>
        ${c ? `<span class="spacer"></span><span class="chip gray">${c.students.length} élèves</span>` : ''}
      </div>`;
    }
  };
})(window.EPS);
