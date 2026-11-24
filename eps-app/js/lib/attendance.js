/* Appel en cours d'EPS : présence, retard, tenue, inaptitude, par classe et par date. */
(function (EPS) {
  const S = EPS.store;
  const { esc, isoDate } = EPS.ui;

  const STATUSES = [
    { id: 'P', label: 'Présent', short: 'P', color: '#16a34a' },
    { id: 'R', label: 'Retard', short: 'R', color: '#ca8a04' },
    { id: 'T', label: 'Sans tenue', short: 'T', color: '#ea580c' },
    { id: 'I', label: 'Inapte', short: 'I', color: '#7c3aed' },
    { id: 'A', label: 'Absent', short: 'A', color: '#dc2626' },
  ];
  const byId = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

  const get = (c, iso) => (c.attendance && c.attendance[iso]) || null;

  /** Résumé d'un appel : { P: n, A: n, ... , total } */
  function summary(c, iso) {
    const a = get(c, iso);
    if (!a) return null;
    const out = { total: 0 };
    STATUSES.forEach((s) => { out[s.id] = 0; });
    Object.values(a).forEach((v) => { if (out[v] !== undefined) { out[v]++; out.total++; } });
    return out;
  }
  const summaryText = (sm) => (sm ? STATUSES.filter((s) => s.id !== 'P' && sm[s.id]).map((s) => `${sm[s.id]} ${s.label.toLowerCase()}`).join(' · ') || 'Tous présents' : '');

  /** Historique d'un élève : nombre de séances par statut. */
  function studentStats(c, sid) {
    const out = {};
    Object.values(c.attendance || {}).forEach((day) => { const v = day[sid]; if (v) out[v] = (out[v] || 0) + 1; });
    return out;
  }

  /** Fenêtre d'appel pour une classe et une date. */
  function modal(c, iso = isoDate(new Date()), onDone) {
    const students = EPS.classesUI.sortStudents(c.students);
    if (!students.length) { EPS.ui.toast('Ajoutez d\'abord les élèves de la classe', 'err'); return; }
    const saved = get(c, iso) || {};
    const cur = {};
    students.forEach((s) => { cur[s.id] = saved[s.id] || (EPS.classesUI.isInapte(s) ? 'I' : 'P'); });
    const ses = EPS.seq.sessionOn(c, iso);
    const draw = (m) => {
      const sm = { P: 0, R: 0, T: 0, I: 0, A: 0 };
      Object.values(cur).forEach((v) => { sm[v]++; });
      m.querySelector('#att-sum').innerHTML = STATUSES.map((s) => `<span class="chip" style="background:${s.color}1a;color:${s.color}">${sm[s.id]} ${s.label.toLowerCase()}</span>`).join('');
      m.querySelectorAll('.att-row').forEach((row) => {
        row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', cur[row.dataset.s] === b.dataset.v));
      });
    };
    EPS.ui.modal({
      title: `Appel — ${S.className(c)}`,
      wide: true,
      body: `
        <div class="row" style="margin-bottom:10px">
          <strong>${esc(EPS.ui.longDate(EPS.ui.parseISO(iso)))}</strong>
          ${ses ? `<span class="chip">Séance ${ses.k}/${ses.seq.sessions} · ${esc(ses.seq.activity.nom)}</span>` : ''}
          <span class="spacer"></span>
          <button class="btn sm" id="all-p">Tous présents</button>
        </div>
        <div class="row" id="att-sum" style="margin-bottom:12px"></div>
        <div class="att-list">${students.map((s) => `
          <div class="att-row" data-s="${s.id}">
            ${EPS.classesUI.avatar(s)}
            <div class="att-name"><strong>${esc(s.lastName.toUpperCase())}</strong> ${esc(s.firstName)}${EPS.classesUI.isInapte(s) ? ` <span class="chip danger" title="${esc(s.inapte.note || '')}">inapte ${esc(s.inapte.type || '')}</span>` : ''}</div>
            <div class="att-btns" role="group" aria-label="Statut de ${esc(s.firstName)}">${STATUSES.map((st) => `<button type="button" data-v="${st.id}" style="--c:${st.color}" title="${st.label}">${st.short}<span>${st.label}</span></button>`).join('')}</div>
          </div>`).join('')}</div>`,
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer l\'appel', primary: true, onClick: () => {
        c.attendance = c.attendance || {};
        c.attendance[iso] = { ...cur };
        S.save(); EPS.ui.toast('Appel enregistré ✔');
        onDone ? onDone() : EPS.rerender();
      } }],
      onMount: (m) => {
        m.querySelectorAll('.att-row button').forEach((b) => { b.onclick = () => { cur[b.closest('.att-row').dataset.s] = b.dataset.v; draw(m); }; });
        m.querySelector('#all-p').onclick = () => { students.forEach((s) => { if (cur[s.id] !== 'I') cur[s.id] = 'P'; }); draw(m); };
        draw(m);
      },
    });
  }

  EPS.att = { STATUSES, byId, get, summary, summaryText, studentStats, modal };
})(window.EPS);
