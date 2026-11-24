/* Page de classe : vue d'ensemble (élèves + séquence en cours + calendrier),
   programmation des séquences et calendrier de la classe. */
(function (EPS) {
  const { esc, isoDate, parseISO, MONTHS, uid } = EPS.ui;
  const S = EPS.store;
  const fr = (iso) => EPS.seq.fr(iso);
  const statusChip = (s) => { const [l, cls] = EPS.seq.STATUS[s.status]; return `<span class="chip ${cls}">${l}</span>`; };
  const docLink = (c, s, doc) => `#/ca/${s.activity.ca}/${s.activity.id}/${c.level}?classe=${c.id}&debut=${s.start}&n=${s.sessions}&min=${s.minutes}${doc ? `&doc=${doc}` : ''}`;

  /** Lignes du plan de séances d'une séquence (phase, objectif, situation, critères). */
  function sessionRows(c, s) {
    const r = EPS.gen.resolve(s.activity, c.level);
    const plan = EPS.gen.plan(r, s.sessions);
    const crit = r.evaluation.map((e) => e.critere).join(' ; ');
    return {
      r,
      rows: plan.map((p) => {
        let situation, criteres;
        if (p.kind === 'learn') { const sit = p.etape.situations[p.repeat ? 1 % p.etape.situations.length : 0]; situation = sit.nom + (p.repeat ? ' (complexifiée)' : ''); criteres = sit.criteres; }
        else if (p.kind === 'conso') { situation = 'Situation de référence en conditions réelles'; criteres = 'Comparaison avec l\'évaluation diagnostique'; }
        else { situation = r.reference; criteres = p.kind === 'final' ? crit : 'Relevé du niveau initial'; }
        return { k: p.k, date: s.dates[p.k - 1] || '', phase: p.phase, objectif: p.objectif, situation, criteres };
      }),
    };
  }

  /* ---------- Vue d'ensemble ---------- */
  function overview(el, c) {
    const students = EPS.classesUI.sortStudents(c.students);
    const cur = EPS.seq.current(c);
    const today = isoDate(new Date());
    el.innerHTML = `
      <div class="card">
        <div class="card-head"><h2>Élèves (${students.length})</h2>
          <a class="btn sm" href="#/classes/${c.level}/${c.id}?tab=eleves">Gérer les élèves</a></div>
        ${students.length ? `<div class="students compact">${students.map((s) => `
          <div class="student" data-id="${s.id}">
            ${EPS.classesUI.isInapte(s) ? '<span class="badge chip danger">Inapte</span>' : ''}
            ${EPS.classesUI.avatar(s)}
            <div class="name">${esc(s.lastName.toUpperCase())}</div><div class="first">${esc(s.firstName)}</div>
          </div>`).join('')}</div>`
        : `<p class="muted">Aucun élève. <a href="#/classes/${c.level}/${c.id}?tab=eleves">Ajouter les élèves</a> (un par un ou en collant une liste).</p>`}
      </div>
      ${(() => {
        const iso = isoDate(new Date());
        const has = S.slotsOn(new Date()).some((e) => EPS.seq.isClassSession(e, c));
        if (!has) return '';
        const sm = EPS.att.summary(c, iso);
        return `<div class="notice ${sm ? '' : 'warn'} row" style="margin-top:16px"><span>Cours aujourd'hui · ${sm ? `Appel fait : ${esc(EPS.att.summaryText(sm))}` : 'Appel pas encore fait'}</span><span class="spacer"></span><button class="btn sm ${sm ? '' : 'primary'}" id="ov-att">${sm ? 'Modifier l\'appel' : 'Faire l\'appel'}</button></div>`;
      })()}
      <div id="seq"></div>
      <div class="card"><div class="card-head"><h2>Calendrier de la ${esc(S.className(c))}</h2><a class="btn sm" href="#/classes/${c.level}/${c.id}?tab=calendrier">Agrandir</a></div><div id="cal"></div></div>`;
    const ovAtt = el.querySelector('#ov-att'); if (ovAtt) ovAtt.onclick = () => EPS.att.modal(c);
    el.querySelectorAll('.student').forEach((d) => { d.onclick = () => EPS.classesUI.studentModal(c, c.students.find((x) => x.id === d.dataset.id)); });

    const seqEl = el.querySelector('#seq');
    if (!cur) {
      seqEl.innerHTML = `<div class="card empty"><div class="big">📋</div>Aucune séquence programmée pour cette classe.<br><br>
        <button class="btn primary" id="add-seq">＋ Programmer une séquence</button></div>`;
      seqEl.querySelector('#add-seq').onclick = () => sequenceModal(c);
    } else {
      const { r, rows } = sessionRows(c, cur);
      const next = rows.find((x) => x.date && x.date >= today);
      const pct = Math.round((cur.done / cur.sessions) * 100);
      seqEl.innerHTML = `
        <div class="card" style="border-top:4px solid ${cur.ca.color}">
          <div class="card-head">
            <div><div class="ca-num" style="color:${cur.ca.color}">${cur.ca.id} · ${cur.status === 'encours' ? 'Séquence en cours' : cur.status === 'avenir' ? 'Prochaine séquence' : 'Dernière séquence'}</div>
              <h2 style="margin:4px 0 0">${cur.activity.icon || ''} ${esc(cur.activity.nom)}</h2></div>
            <div class="row">${statusChip(cur)}
              <a class="btn sm" href="${docLink(c, cur, 'sequence')}">Plan de séquence</a>
              <a class="btn sm" href="${docLink(c, cur, 'seances')}">Plans de séance</a>
              <a class="btn sm" href="#/evaluation/${cur.activity.id}/${c.level}?classe=${c.id}">Évaluer</a></div>
          </div>
          <div class="grid grid-3 keep2" style="margin-bottom:14px">
            <div class="stat"><span class="l">Du</span><span class="v" style="font-size:1.15rem">${fr(cur.dates[0]) || '—'}</span></div>
            <div class="stat"><span class="l">Fin de la séquence</span><span class="v" style="font-size:1.15rem">${cur.complete ? `🏁 ${fr(cur.end)}` : '<span class="chip warn">Créneaux insuffisants</span>'}</span></div>
            <div class="stat"><span class="l">Avancement</span><span class="v" style="font-size:1.15rem">${cur.done} / ${cur.sessions} séances</span>
              <div class="progress"><i style="width:${pct}%;background:${cur.ca.color}"></i></div></div>
          </div>
          ${next ? `<div class="notice" style="margin-bottom:14px">Prochaine séance : <strong>S${next.k} — ${fr(next.date)}</strong> · ${esc(next.phase)} · ${esc(next.objectif)}</div>` : ''}
          <div class="grid grid-2">
            <div><h3>Compétences visées</h3><ul class="tight">${r.afc.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
            <div><h3>Critères d'évaluation</h3><ul class="tight">${r.evaluation.map((e) => `<li>${e.afl ? `<strong>${esc(e.afl)}</strong> ` : ''}${esc(e.critere)}</li>`).join('')}</ul>
              <p class="small muted" style="margin-top:6px"><strong>Situation de référence :</strong> ${esc(r.reference)}</p></div>
          </div>
          <h3 style="margin-top:14px">Séances à travailler</h3>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>Séance</th><th>Date</th><th>Phase / objectif</th><th>Situation</th><th>Critères de réussite</th></tr></thead>
            <tbody>${rows.map((x) => `<tr class="${x.date && x.date < today ? 'done' : ''} ${next && x.k === next.k ? 'next' : ''}">
              <td><a href="${docLink(c, cur, 'seances')}"><strong>S${x.k}</strong></a>${x.date && x.date < today ? ' ✓' : ''}</td><td style="white-space:nowrap">${fr(x.date) || '<span class="muted">—</span>'}</td>
              <td><strong>${esc(x.phase)}</strong><br><span class="muted small">${esc(x.objectif)}</span></td>
              <td>${esc(x.situation)}</td><td>${esc(x.criteres)}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>`;
    }
    classMonth(el.querySelector('#cal'), c, 0);
  }

  /* ---------- Programmation ---------- */
  function sequencesTab(el, c) {
    const list = EPS.seq.forClass(c);
    el.innerHTML = `
      <div class="row" style="margin-bottom:14px">
        <button class="btn primary" id="add">＋ Programmer une séquence</button>
        <span class="muted small">Les dates sont calculées d'après votre emploi du temps, hors vacances et après la fin de l'année scolaire.</span>
      </div>
      ${list.length ? `<div class="card"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>CA</th><th>Activité</th><th>Séances</th><th>Début</th><th>Fin</th><th>État</th><th></th></tr></thead>
        <tbody>${list.map((s) => `<tr>
          <td><span class="ca-num" style="color:${s.ca.color}">${s.ca.id}</span></td>
          <td><strong>${s.activity.icon || ''} ${esc(s.activity.nom)}</strong></td>
          <td>${s.done}/${s.sessions} · ${s.minutes} min</td>
          <td>${fr(s.dates[0]) || fr(s.start)}</td>
          <td>${s.complete ? fr(s.end) : '<span class="chip warn">incomplète</span>'}</td>
          <td>${statusChip(s)}</td>
          <td style="white-space:nowrap"><a class="btn sm" href="${docLink(c, s, 'sequence')}">Ouvrir</a> <button class="btn sm" data-edit="${s.id}">✎</button></td></tr>`).join('')}</tbody>
      </table></div></div>` : '<div class="card empty">Aucune séquence programmée. Programmez les séquences de l\'année : chaque séquence s\'enchaîne après la précédente.</div>'}`;
    el.querySelector('#add').onclick = () => sequenceModal(c);
    el.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => sequenceModal(c, (c.sequences || []).find((s) => s.id === b.dataset.edit)); });
  }

  function sequenceModal(c, seq, preset = {}) {
    const isNew = !seq;
    const pr = S.state.profile.prefs;
    const s = seq ? { ...seq } : { id: uid(), activityId: preset.activityId || '', start: EPS.seq.nextStart(c), sessions: pr.sessionsPerSequence || 8, minutes: pr.sessionMinutes || 110 };
    const cas = EPS.prog.caForLevel(c.level);
    EPS.ui.modal({
      title: isNew ? `Programmer une séquence — ${S.className(c)}` : 'Modifier la séquence',
      body: `<div class="form-grid">
        <label class="field full">Activité<select name="activityId">${cas.map((ca) => `<optgroup label="${ca.id} — ${esc(ca.court)}">${EPS.activities.byCA(ca.id).filter((a) => a.levels.includes(c.level)).map((a) => `<option value="${a.id}" ${a.id === s.activityId ? 'selected' : ''}>${esc(a.nom)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <label class="field">Première séance à partir du<input type="date" name="start" value="${esc(s.start)}"></label>
        <label class="field">Nombre de séances<input type="number" name="sessions" min="3" max="20" value="${s.sessions}"></label>
        <label class="field">Durée d'une séance (min)<input type="number" name="minutes" min="30" max="240" step="5" value="${s.minutes}"></label>
      </div><div id="preview" class="notice" style="margin-top:14px"></div>`,
      actions: [
        ...(isNew ? [] : [{ label: 'Supprimer', danger: true, onClick: () => { c.sequences = c.sequences.filter((x) => x.id !== s.id); S.save(); EPS.rerender(); } }]),
        { label: 'Annuler' },
        { label: 'Enregistrer', primary: true, onClick: (m) => {
          const f = EPS.ui.formData(m);
          if (!f.activityId || !f.start) { EPS.ui.toast('Choisissez une activité et une date', 'err'); return false; }
          Object.assign(s, { activityId: f.activityId, start: f.start, sessions: f.sessions || 8, minutes: f.minutes || 110 });
          c.sequences = c.sequences || [];
          if (isNew) c.sequences.push(s); else Object.assign(c.sequences.find((x) => x.id === s.id), s);
          S.save(); EPS.ui.toast('Séquence programmée ✔'); EPS.rerender();
        } },
      ],
      onMount: (m) => {
        const upd = () => {
          const f = EPS.ui.formData(m);
          const dates = EPS.seq.datesFor(c, f.start, f.sessions || 0);
          const box = m.querySelector('#preview');
          if (!S.state.timetable.some((e) => EPS.seq.isClassSession(e, c))) { box.className = 'notice warn'; box.textContent = 'Cette classe n\'a aucun créneau dans votre emploi du temps : les dates ne peuvent pas être calculées.'; return; }
          if (dates.length < (f.sessions || 0)) { box.className = 'notice warn'; box.textContent = `Seulement ${dates.length} séance(s) possible(s) avant la fin de l'année scolaire.`; return; }
          box.className = 'notice';
          box.innerHTML = `Du <strong>${fr(dates[0])}</strong> au <strong>${fr(dates[dates.length - 1])}</strong> · ${dates.length} séances<br><span class="small">${dates.map(fr).join(' · ')}</span>`;
        };
        m.querySelectorAll('[name]').forEach((i) => { i.oninput = upd; i.onchange = upd; });
        upd();
      },
    });
  }

  /* ---------- Calendrier de la classe ---------- */
  function classMonth(box, c, offset, big = false) {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const cells = [...Array(42)].map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    const n = cells[35].getMonth() !== first.getMonth() ? 35 : 42;
    const seqs = EPS.seq.forClass(c);
    const todayIso = isoDate(now);
    const periods = (S.state.schoolYear && S.state.schoolYear.periods) || [];
    box.innerHTML = `
      <div class="row" style="margin-bottom:10px">
        <button class="btn sm" data-m="-1">‹</button><button class="btn sm" data-m="0">Aujourd'hui</button><button class="btn sm" data-m="1">›</button>
        <strong style="text-transform:capitalize;margin-left:6px">${MONTHS[first.getMonth()]} ${first.getFullYear()}</strong>
        <span class="spacer"></span>
        <div class="legend">${seqs.map((s) => `<span><i style="background:${s.ca.color}"></i>${esc(s.activity.nom)}${s.complete ? ` (fin ${fr(s.end)})` : ''}</span>`).join('')}</div>
      </div>
      <div class="cal ${big ? '' : 'small'}">
        ${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.slice(0, n).map((d) => {
          const iso = isoDate(d);
          const hol = S.isHoliday(d);
          const per = periods.find((p) => p.from === iso);
          const items = [];
          seqs.forEach((s) => {
            const k = s.dates.indexOf(iso);
            if (k >= 0) items.push(`<div class="cal-item" style="background:${s.ca.color}" title="${esc(s.activity.nom)} — séance ${k + 1}/${s.sessions}">S${k + 1} · ${esc(s.activity.nom)}</div>`);
            if (s.complete && s.end === iso) items.push(`<div class="cal-flag">🏁 Fin ${esc(s.activity.nom)}</div>`);
          });
          S.state.events.filter((e) => e.date === iso).forEach((e) => items.push(`<div class="cal-item ev">${esc(e.title)}</div>`));
          return `<div class="cal-day ${d.getMonth() !== first.getMonth() ? 'other' : ''} ${iso === todayIso ? 'today' : ''} ${hol ? 'holiday' : ''}" style="cursor:default">
            <span class="num">${d.getDate()}</span>${per ? `<span class="chip" style="font-size:.65rem">${esc(per.label)}</span>` : ''}${hol && (d.getDay() === 1 || iso === hol.from) ? `<div class="small muted">${esc(hol.label)}</div>` : ''}${items.join('')}</div>`;
        }).join('')}
      </div>`;
    box.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => classMonth(box, c, b.dataset.m === '0' ? 0 : offset + Number(b.dataset.m), big); });
  }

  function calendarTab(el, c) {
    el.innerHTML = '<div class="card"><div id="cal"></div></div><p class="muted small" style="margin-top:10px">Vacances, jours fériés et périodes : <a href="#/calendrier?annee=1">calendrier de l\'année scolaire</a>.</p>';
    // Ouvre sur le mois de la prochaine séance programmée
    const today = isoDate(new Date());
    const nextDate = EPS.seq.forClass(c).flatMap((s) => s.dates).filter((d) => d >= today).sort()[0];
    let off = 0;
    if (nextDate) { const d = parseISO(nextDate), n = new Date(); off = (d.getFullYear() - n.getFullYear()) * 12 + d.getMonth() - n.getMonth(); }
    classMonth(el.querySelector('#cal'), c, off, true);
  }

  EPS.classProgram = { overview, sequencesTab, calendarTab, sequenceModal, classMonth };
})(window.EPS);
