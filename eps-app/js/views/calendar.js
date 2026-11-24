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
    const todayIso = isoDate(now);

    main.innerHTML = `
      <div class="page-head">
        <div><h1>Calendrier</h1><p>Votre emploi du temps est reporté automatiquement chaque semaine (hors vacances, semaines A/B gérées).</p></div>
        <div class="row"><button class="btn" id="holidays">🏖 Vacances</button><button class="btn primary" id="add">＋ Événement</button></div>
      </div>
      <div class="row" style="margin-bottom:12px">
        <a class="btn sm" href="#/calendrier?m=${off - 1}">‹</a>
        <a class="btn sm" href="#/calendrier?m=0">Aujourd'hui</a>
        <a class="btn sm" href="#/calendrier?m=${off + 1}">›</a>
        <h2 style="margin:0 8px;text-transform:capitalize">${MONTHS[first.getMonth()]} ${first.getFullYear()}</h2>
      </div>
      <div class="cal">
        ${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.slice(0, weeks).map((d) => {
          const iso = isoDate(d);
          const slots = S.slotsOn(d);
          const evs = S.state.events.filter((e) => e.date === iso);
          const hol = S.isHoliday(d);
          const items = [...evs.map((e) => `<div class="cal-item ev" title="${esc(e.title)}">${e.start ? fmtTime(e.start) + ' ' : ''}${esc(e.title)}</div>`),
            ...slots.map((e) => `<div class="cal-item" style="background:${S.entryColor(e)}" title="${esc(S.entryLabel(e))}">${fmtTime(e.start)} ${esc(S.entryLabel(e))}</div>`)];
          return `<div class="cal-day ${d.getMonth() !== first.getMonth() ? 'other' : ''} ${iso === todayIso ? 'today' : ''} ${hol ? 'holiday' : ''}" data-d="${iso}">
            <span class="num">${d.getDate()}</span>${hol && d.getDay() === 1 ? `<span class="small muted"> ${esc(hol.label)}</span>` : ''}
            ${items.slice(0, 4).join('')}${items.length > 4 ? `<div class="cal-more">+${items.length - 4}</div>` : ''}
          </div>`;
        }).join('')}
      </div>`;

    main.querySelectorAll('.cal-day').forEach((c) => { c.onclick = () => dayModal(parseISO(c.dataset.d)); });
    main.querySelector('#add').onclick = () => eventModal({ date: isoDate(now) });
    main.querySelector('#holidays').onclick = holidaysModal;
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

  function holidaysModal() {
    const list = JSON.parse(JSON.stringify(S.state.holidays));
    const draw = (m) => {
      m.querySelector('tbody').innerHTML = list.map((h, i) => `<tr>
        <td><input type="text" data-i="${i}" data-k="label" value="${esc(h.label)}"></td>
        <td><input type="date" data-i="${i}" data-k="from" value="${esc(h.from)}"></td>
        <td><input type="date" data-i="${i}" data-k="to" value="${esc(h.to)}"></td>
        <td><button class="btn sm danger" data-del="${i}">✕</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Aucune période.</td></tr>';
      m.querySelectorAll('[data-i]').forEach((el) => { el.oninput = () => { list[el.dataset.i][el.dataset.k] = el.value; }; });
      m.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { list.splice(Number(b.dataset.del), 1); draw(m); }; });
    };
    EPS.ui.modal({
      title: 'Vacances et jours sans cours',
      body: `<p class="muted small">Pendant ces périodes, l'emploi du temps n'est pas affiché dans le calendrier (vacances scolaires, jours fériés, stages, examens…).</p>
        <table class="tbl"><thead><tr><th>Libellé</th><th>Du</th><th>Au</th><th></th></tr></thead><tbody></tbody></table>
        <button class="btn sm" id="addh" style="margin-top:10px">＋ Ajouter une période</button>`,
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer', primary: true, onClick: () => { S.state.holidays = list.filter((h) => h.from); S.save(); EPS.rerender(); } }],
      onMount: (m) => { draw(m); m.querySelector('#addh').onclick = () => { list.push({ id: uid(), label: 'Vacances', from: '', to: '' }); draw(m); }; },
    });
  }
})(window.EPS);
