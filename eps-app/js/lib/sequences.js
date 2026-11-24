/* Séquences programmées par classe : dates des séances (d'après l'emploi du temps,
   vacances et fin d'année exclues), état d'avancement, séance du jour. */
(function (EPS) {
  const S = EPS.store;
  const { isoDate, parseISO } = EPS.ui;

  /** Un créneau compte comme séance de la classe : cours d'EPS de cette classe (pas atelier, D.S.T…). */
  const isClassSession = (e, c) => e.classId === c.id && e.type !== 'autre' && (!e.label || e.label === S.className(c));

  /** Dates (ISO) des n prochaines séances de la classe à partir de startIso. */
  function datesFor(c, startIso, n) {
    if (!c || !startIso) return [];
    const out = [];
    const end = S.state.schoolYear && S.state.schoolYear.end;
    const d = parseISO(startIso);
    for (let i = 0; i < 400 && out.length < n; i++) {
      const iso = isoDate(d);
      if (end && iso > end) break;
      if (S.slotsOn(d).some((e) => isClassSession(e, c))) out.push(iso);
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  /** Séquences de la classe enrichies : dates, fin, statut, séances faites. */
  function forClass(c) {
    const today = isoDate(new Date());
    return (c.sequences || []).map((s) => {
      const activity = EPS.activities.byId(s.activityId);
      const dates = datesFor(c, s.start, s.sessions);
      const done = dates.filter((d) => d < today).length;
      const end = dates[dates.length - 1] || '';
      const status = !dates.length || dates[0] > today ? 'avenir' : end < today && dates.length >= s.sessions ? 'terminee' : 'encours';
      return { ...s, activity, ca: activity && EPS.prog.caById(activity.ca), dates, end, done, status, complete: dates.length >= s.sessions };
    }).filter((s) => s.activity).sort((a, b) => a.start.localeCompare(b.start));
  }

  /** Séquence en cours, sinon la prochaine à venir, sinon la dernière. */
  function current(c) {
    const list = forClass(c);
    return list.find((s) => s.status === 'encours') || list.find((s) => s.status === 'avenir') || list[list.length - 1] || null;
  }

  /** Date de début proposée pour une nouvelle séquence : après la dernière séquence, sinon aujourd'hui. */
  function nextStart(c) {
    const list = forClass(c);
    const last = list[list.length - 1];
    if (last && last.end) { const d = parseISO(last.end); d.setDate(d.getDate() + 1); return isoDate(d); }
    const y = S.state.schoolYear && S.state.schoolYear.start;
    const today = isoDate(new Date());
    return y && y > today ? y : today;
  }

  /** Séance prévue un jour donné pour la classe : { seq, k } (k à partir de 1). */
  function sessionOn(c, iso) {
    for (const s of forClass(c)) {
      const k = s.dates.indexOf(iso);
      if (k >= 0) return { seq: s, k: k + 1 };
    }
    return null;
  }

  const fr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
  const STATUS = { avenir: ['À venir', 'gray'], encours: ['En cours', ''], terminee: ['Terminée', 'warn'] };

  EPS.seq = { isClassSession, datesFor, forClass, current, nextStart, sessionOn, fr, STATUS };
})(window.EPS);
