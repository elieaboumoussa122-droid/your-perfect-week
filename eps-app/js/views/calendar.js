(function (EPS) {
  const { esc, uid, isoDate, parseISO, fmtTime, MONTHS, DAYS, longDate } = EPS.ui;
  const S = EPS.store;
  const EVENT_TYPES = ['Compétition UNSS', 'Sortie / voyage', 'Conseil de classe', 'Réunion', 'Évaluation', 'Formation', 'Autre'];

  EPS.views.calendar = function (main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Calendrier' }]);
    const now = new Date();
    const off = Number(EPS.query.m || 0);
    const first = new Date(now.getFullYear(), now.getMonth() + off, 1);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const cells = [...Array(42)].map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    const weeks = cells[35].getMonth() !== first.getMonth() ? 35 : 42;
    const all = EPS.query.tout === '1';
    const todayIso = isoDate(now);

    main.innerHTML = `
      <div class="page-head">
        <div><h1>Calendrier</h1><p>Votre emploi du temps est reporté automatiquement chaque semaine (hors vacances, semaines A/B gérées).</p></div>
        <div class="row"><button class="btn" id="holidays">Année scolaire</button><button class="btn primary" id="add">＋ Événement</button></div>
      </div>
      ${yearCard(now)}
      <div class="row" style="margin-bottom:12px">
        <a class="btn sm" href="#/calendrier?m=${off - 1}${all ? '&tout=1' : ''}" aria-label="Mois précédent">‹</a>
        <a class="btn sm" href="#/calendrier?m=0${all ? '&tout=1' : ''}">Aujourd'hui</a>
        <a class="btn sm" href="#/calendrier?m=${off + 1}${all ? '&tout=1' : ''}" aria-label="Mois suivant">›</a>
        <h2 style="margin:0 8px;text-transform:capitalize">${MONTHS[first.getMonth()]} ${first.getFullYear()}</h2>
        <span class="spacer"></span>
        <div class="seg" role="group" aria-label="Créneaux affichés"><a class="seg-a ${all ? '' : 'active'}" href="#/calendrier?m=${off}">Cours d'EPS</a><a class="seg-a ${all ? 'active' : ''}" href="#/calendrier?m=${off}&tout=1">Tout</a></div>
      </div>
      <div class="cal">
        ${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.slice(0, weeks).map((d) => {
          const iso = isoDate(d);
          const slots = S.slotsOn(d).filter((e) => all || e.type !== 'autre');
          const evs = S.state.events.filter((e) => e.date === iso);
          const hol = S.isHoliday(d);
          const items = [...evs.map((e) => `<div class="cal-item ev" title="${esc(e.title)}">${e.start ? fmtTime(e.start) + ' ' : ''}${esc(e.title)}</div>`),
            ...slots.map((e) => { const c = e.classId && S.classById(e.classId); const ses = c && EPS.seq.isClassSession(e, c) && EPS.seq.sessionOn(c, iso);
              return `<div class="cal-item" style="background:${S.entryColor(e)}" title="${esc(`${fmtTime(e.start)} ${S.entryLabel(e)}${ses ? ` — séance ${ses.k}/${ses.seq.sessions} ${ses.seq.activity.nom}` : ''}`)}">${fmtTime(e.start)} ${esc(c ? S.className(c) : S.entryLabel(e))}${ses ? ` · S${ses.k}` : ''}</div>`; })];
          return `<div class="cal-day ${d.getMonth() !== first.getMonth() ? 'other' : ''} ${iso === todayIso ? 'today' : ''} ${hol ? 'holiday' : ''}" data-d="${iso}">
            <span class="num">${d.getDate()}</span>${(S.state.schoolYear.periods || []).filter((p) => p.from === iso).map((p) => `<span class="chip" style="font-size:.65rem">${esc(p.label)}</span>`).join('')}${hol && (d.getDay() === 1 || iso === hol.from) ? `<span class="small muted"> ${esc(hol.label)}</span>` : ''}
            ${items.slice(0, 4).join('')}${items.length > 4 ? `<div class="cal-more">+${items.length - 4}</div>` : ''}
          </div>`;
        }).join('')}
      </div>`;

    main.querySelectorAll('.cal-day').forEach((c) => { c.onclick = () => dayModal(parseISO(c.dataset.d)); });
    main.querySelector('#add').onclick = () => eventModal({ date: isoDate(now) });
    main.querySelector('#holidays').onclick = yearModal;
    main.querySelectorAll('[data-year]').forEach((b) => { b.onclick = yearModal; });
    const docBtn = main.querySelector('#year-doc'); if (docBtn) docBtn.onclick = showYearDoc;
    if (EPS.query.annee) yearModal();
  };

  function dayModal(d) {
    const iso = isoDate(d);
    const slots = S.slotsOn(d);
    const evs = S.state.events.filter((e) => e.date === iso);
    const wt = S.weekType(d);
    EPS.ui.modal({
      title: longDate(d).replace(/^./, (c) => c.toUpperCase()),
      body: `
        ${S.isHoliday(d) ? `<div class="notice warn">${esc(S.isHoliday(d).label)}</div>` : ''}
        ${wt ? `<p class="muted small">Semaine ${wt}</p>` : ''}
        <h3>Cours</h3>
        ${slots.length ? slots.map((e) => { const c = e.classId && S.classById(e.classId); return `<div class="row" style="border-left:4px solid ${S.entryColor(e)};padding:4px 10px;margin-bottom:6px"><strong>${fmtTime(e.start)} – ${fmtTime(e.end)}</strong>${c ? `<a href="#/classes/${c.level}/${c.id}">${esc(S.entryLabel(e))}</a>` : esc(S.entryLabel(e))}<span class="muted small">${esc(e.place || '')}</span></div>`; }).join('') : '<p class="muted">Aucun cours.</p>'}
        <h3 style="margin-top:14px">Événements</h3>
        ${evs.length ? evs.map((e) => `<div class="row" style="margin-bottom:6px"><span class="chip warn">${esc(e.type || 'Événement')}</span><strong>${esc(e.title)}</strong><span class="muted small">${e.start ? fmtTime(e.start) : ''}${e.end ? ' – ' + fmtTime(e.end) : ''}</span><span class="spacer"></span><button class="btn sm" data-ev="${e.id}">Modifier</button></div>`).join('') : '<p class="muted">Aucun événement.</p>'}`,
      actions: [{ label: 'Fermer' }, { label: '＋ Ajouter un événement', primary: true, onClick: () => { setTimeout(() => eventModal({ date: iso }), 0); } }],
      onMount: (m, close) => { m.querySelectorAll('[data-ev]').forEach((b) => { b.onclick = () => { close(); eventModal(S.state.events.find((e) => e.id === b.dataset.ev)); }; }); },
    });
  }

  function eventModal(ev) {
    const isNew = !ev.id;
    const e = { id: uid(), title: '', type: 'Compétition UNSS', date: '', start: '', end: '', note: '', ...ev };
    EPS.ui.modal({
      title: isNew ? 'Nouvel événement' : 'Modifier l\'événement',
      body: `<div class="form-grid">
        <label class="field full">Titre<input type="text" name="title" value="${esc(e.title)}" placeholder="Cross départemental, conseil de classe 3e B…"></label>
        <label class="field">Type<select name="type">${EVENT_TYPES.map((t) => `<option ${t === e.type ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="field">Date<input type="date" name="date" value="${esc(e.date)}"></label>
        <label class="field">Début<input type="time" name="start" value="${esc(e.start)}"></label>
        <label class="field">Fin<input type="time" name="end" value="${esc(e.end)}"></label>
        <label class="field full">Notes<textarea name="note">${esc(e.note)}</textarea></label></div>`,
      actions: [
        ...(isNew ? [] : [{ label: 'Supprimer', danger: true, onClick: () => { S.state.events = S.state.events.filter((x) => x.id !== e.id); S.save(); EPS.rerender(); } }]),
        { label: 'Annuler' },
        { label: 'Enregistrer', primary: true, onClick: (m) => {
          const f = EPS.ui.formData(m);
          if (!f.title || !f.date) { EPS.ui.toast('Titre et date requis', 'err'); return false; }
          Object.assign(e, f);
          if (isNew) S.state.events.push(e); else Object.assign(S.state.events.find((x) => x.id === e.id), e);
          S.save(); EPS.rerender();
        } },
      ],
    });
  }

  /** Bandeau de l'année scolaire : période en cours, prochaines vacances, fin d'année. */
  function yearCard(now) {
    const y = S.state.schoolYear;
    const iso = isoDate(now);
    const days = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
    if (!y.start && !y.end && !S.state.holidays.length && !(y.periods || []).length) {
      return `<div class="notice" style="margin-bottom:14px">Ajoutez le <strong>calendrier de l'année scolaire</strong> (rentrée, trimestres, vacances, jours fériés) : les séquences de vos classes en tiennent compte. <button class="btn sm" data-year>Compléter</button></div>`;
    }
    const per = (y.periods || []).find((p) => p.from <= iso && iso <= p.to);
    const nextHol = [...S.state.holidays].filter((h) => (h.to || h.from) >= iso).sort((a, b) => a.from.localeCompare(b.from))[0];
    const items = [
      y.start && y.end ? `<div class="stat"><span class="l">Année scolaire</span><span class="v" style="font-size:1.05rem">${EPS.seq.fr(y.start)} → ${EPS.seq.fr(y.end)}</span></div>` : '',
      per ? `<div class="stat"><span class="l">Période en cours</span><span class="v" style="font-size:1.05rem">${esc(per.label)} (fin ${EPS.seq.fr(per.to)})</span></div>` : '',
      nextHol ? `<div class="stat"><span class="l">Prochaines vacances</span><span class="v" style="font-size:1.05rem">${esc(nextHol.label)} — ${nextHol.from <= iso ? 'en cours' : `dans ${days(iso, nextHol.from)} j`}</span></div>` : '',
      y.end && y.end >= iso ? `<div class="stat"><span class="l">Fin de l'année</span><span class="v" style="font-size:1.05rem">dans ${days(iso, y.end)} jours</span></div>` : '',
    ].filter(Boolean);
    return `<div class="card" style="margin-bottom:14px"><div class="card-head"><h2>Année scolaire</h2><div class="row">${y.docId && S.getFile(y.docId) ? `<button class="btn sm" id="year-doc">Calendrier officiel</button>` : ''}<button class="btn sm" data-year>Modifier</button></div></div>
      <div class="grid grid-4 keep2">${items.join('')}</div></div>`;
  }

  function showYearDoc() {
    const y = S.state.schoolYear;
    const data = S.getFile(y.docId);
    if (!data) return;
    if (data.startsWith('data:application/pdf')) return EPS.tt.showPdf(y.docId, y.docName || 'Calendrier de l\'année scolaire');
    EPS.ui.modal({ title: y.docName || 'Calendrier de l\'année scolaire', wide: true, body: `<img src="${data}" alt="Calendrier de l'année scolaire" style="width:100%;border-radius:8px">` });
  }

  /** Calendrier de l'année scolaire : dates, périodes, vacances / jours fériés, document officiel. */
  function yearModal() {
    const y = JSON.parse(JSON.stringify(S.state.schoolYear));
    y.periods = y.periods || [];
    const hol = JSON.parse(JSON.stringify(S.state.holidays));
    let newDoc = null;
    const table = (list, key, labelPh) => `<table class="tbl"><thead><tr><th>Libellé</th><th>Du</th><th>Au</th><th></th></tr></thead><tbody>${list.map((h, i) => `<tr>
      <td><input type="text" data-l="${key}" data-i="${i}" data-k="label" value="${esc(h.label)}" placeholder="${labelPh}"></td>
      <td><input type="date" data-l="${key}" data-i="${i}" data-k="from" value="${esc(h.from)}"></td>
      <td><input type="date" data-l="${key}" data-i="${i}" data-k="to" value="${esc(h.to)}"></td>
      <td><button class="btn sm danger" data-del="${key}" data-i="${i}" aria-label="Supprimer">✕</button></td></tr>`).join('') || `<tr><td colspan="4" class="muted">Aucune ligne.</td></tr>`}</tbody></table>`;
    const lists = { periods: y.periods, hol };
    const draw = (m) => {
      m.querySelector('#t-periods').innerHTML = table(y.periods, 'periods', 'Trimestre 1');
      m.querySelector('#t-hol').innerHTML = table(hol, 'hol', 'Vacances de Noël');
      m.querySelectorAll('[data-l]').forEach((el) => { el.oninput = () => { lists[el.dataset.l][el.dataset.i][el.dataset.k] = el.value; }; });
      m.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { lists[b.dataset.del].splice(Number(b.dataset.i), 1); draw(m); }; });
    };
    EPS.ui.modal({
      title: 'Calendrier de l\'année scolaire',
      wide: true,
      body: `
        <div class="form-grid">
          <label class="field">Rentrée des élèves<input type="date" id="y-start" value="${esc(y.start)}"></label>
          <label class="field">Fin des cours<input type="date" id="y-end" value="${esc(y.end)}"></label>
        </div>
        <div class="row" style="margin-top:18px"><h3 style="margin:0">Périodes (trimestres / semestres)</h3><span class="spacer"></span>
          <button class="btn sm" id="tri">Créer 3 trimestres</button><button class="btn sm" id="add-p">＋ Période</button></div>
        <div class="tbl-wrap" id="t-periods" style="margin-top:8px"></div>
        <div class="row" style="margin-top:18px"><h3 style="margin:0">Vacances et jours fériés</h3><span class="spacer"></span><button class="btn sm" id="add-h">＋ Ajouter</button></div>
        <p class="muted small" style="margin:4px 0 8px">Pas de cours ces jours-là : ils n'apparaissent pas dans le calendrier et ne comptent pas dans les séquences.</p>
        <div class="tbl-wrap" id="t-hol"></div>
        <h3 style="margin-top:18px">Calendrier officiel de l'établissement</h3>
        <div class="row"><label class="btn">Joindre le PDF ou une image<input type="file" accept="application/pdf,image/*" id="y-doc" hidden></label>
          <span class="muted small" id="y-docname">${y.docName ? esc(y.docName) : 'Aucun document'}</span></div>`,
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer', primary: true, onClick: async (m) => {
        y.start = m.querySelector('#y-start').value; y.end = m.querySelector('#y-end').value;
        if (y.start && y.end && y.end < y.start) { EPS.ui.toast('La fin de l\'année doit être après la rentrée', 'err'); return false; }
        if (newDoc) { y.docId = y.docId || 'doc:schoolyear'; await S.putFile(y.docId, newDoc.data); y.docName = newDoc.name; }
        y.periods = y.periods.filter((p) => p.from && p.to);
        S.state.schoolYear = y;
        S.state.holidays = hol.filter((h) => h.from).map((h) => ({ ...h, to: h.to || h.from }));
        S.save(); EPS.ui.toast('Année scolaire enregistrée ✔'); EPS.go('#/calendrier');
      } }],
      onMount: (m) => {
        draw(m);
        m.querySelector('#add-p').onclick = () => { y.periods.push({ id: uid(), label: `Trimestre ${y.periods.length + 1}`, from: '', to: '' }); draw(m); };
        m.querySelector('#add-h').onclick = () => { hol.push({ id: uid(), label: 'Vacances', from: '', to: '' }); draw(m); };
        m.querySelector('#tri').onclick = () => {
          const a = m.querySelector('#y-start').value, b = m.querySelector('#y-end').value;
          if (!a || !b) { EPS.ui.toast('Indiquez d\'abord la rentrée et la fin des cours', 'err'); return; }
          const t0 = parseISO(a).getTime(), t1 = parseISO(b).getTime(), step = (t1 - t0) / 3;
          const at = (t) => isoDate(new Date(t));
          y.periods.splice(0, y.periods.length, ...[0, 1, 2].map((i) => ({ id: uid(), label: `Trimestre ${i + 1}`, from: at(t0 + step * i + (i ? 864e5 : 0)), to: at(t0 + step * (i + 1)) })));
          draw(m);
          EPS.ui.toast('Trois trimestres égaux créés : ajustez les dates à celles de l\'établissement.');
        };
        m.querySelector('#y-doc').onchange = async (e) => {
          const f = e.target.files[0]; if (!f) return;
          newDoc = { data: await EPS.ui.readAsDataURL(f), name: f.name };
          m.querySelector('#y-docname').textContent = f.name;
        };
      },
    });
  }
})(window.EPS);
