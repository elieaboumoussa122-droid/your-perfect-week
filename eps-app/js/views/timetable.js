(function (EPS) {
  const { esc, uid, toMin, fmtTime, DAYS, isoDate } = EPS.ui;
  const S = EPS.store;
  const PX = 1.1; // pixels par minute

  const mondayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

  /** Grille semaine réutilisable. entries : [{...entry, _color, _title, _sub, _conflict}] */
  function weekGrid({ monday, entries, onClick, showDates = true, filterByDate = true }) {
    const pr = S.state.profile.prefs;
    const nDays = pr.showSaturday || entries.some((e) => e.day === 6) ? 6 : 5;
    let dayStart = toMin(pr.dayStart || '07:30'), dayEnd = toMin(pr.dayEnd || '18:30');
    entries.forEach((e) => { dayStart = Math.min(dayStart, toMin(e.start)); dayEnd = Math.max(dayEnd, toMin(e.end)); });
    dayStart = Math.floor(dayStart / 60) * 60; dayEnd = Math.ceil(dayEnd / 60) * 60;
    const H = (dayEnd - dayStart) * PX;
    const todayIso = isoDate(new Date());
    const days = [...Array(nDays)].map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
    const hours = []; for (let m = dayStart; m <= dayEnd; m += 60) hours.push(m);

    const wrap = document.createElement('div');
    wrap.className = 'tbl-wrap';
    wrap.innerHTML = `<div class="tt" style="--days:${nDays}">
      <div class="tt-head"></div>
      ${days.map((d) => `<div class="tt-head ${showDates && isoDate(d) === todayIso ? 'today' : ''}">${DAYS[d.getDay()]}${showDates ? ` <span class="muted" style="font-weight:400">${d.getDate()}/${d.getMonth() + 1}</span>` : ''}${showDates && S.isHoliday(d) ? '<br><span class="chip warn" style="font-size:.7rem">Vacances</span>' : ''}</div>`).join('')}
      <div class="tt-times" style="height:${H}px">${hours.map((m) => `<span class="tt-time" style="top:${(m - dayStart) * PX}px">${m / 60}h</span>`).join('')}</div>
      ${days.map((d) => {
        const list = filterByDate ? S.slotsOn(d, entries).map((e) => entries.find((x) => x === e)) : entries.filter((e) => e.day === d.getDay());
        return `<div class="tt-col ${showDates && isoDate(d) === todayIso ? 'today' : ''}" style="height:${H}px;background-size:100% ${60 * PX}px">
          ${list.map((e) => { const top = (toMin(e.start) - dayStart) * PX; const h = Math.max(18, (toMin(e.end) - toMin(e.start)) * PX - 2);
            const idx = entries.indexOf(e);
            return `<div class="tt-event ${e._conflict ? 'conflict' : ''} ${e.week === 'B' ? 'weekB' : ''}" data-i="${idx}" style="top:${top}px;height:${h}px;background:${e._color || S.entryColor(e)}${e._width ? `;left:${e._left}%;right:auto;width:${e._width}%` : ''}" title="${esc(`${e._title || S.entryLabel(e)} ${fmtTime(e.start)}–${fmtTime(e.end)} ${e.place || ''}`)}">
              <div class="t">${esc(e._title || S.entryLabel(e))}${e.week && e.week !== '*' ? ` <span style="opacity:.85">(${e.week})</span>` : ''}</div>
              <div>${fmtTime(e.start)} – ${fmtTime(e.end)}</div>${e._sub || e.place ? `<div style="opacity:.9">${esc(e._sub || e.place)}</div>` : ''}</div>`; }).join('')}
        </div>`;
      }).join('')}
    </div>`;
    if (onClick) wrap.querySelectorAll('.tt-event').forEach((d) => { d.onclick = () => onClick(entries[Number(d.dataset.i)]); });
    return wrap;
  }

  function classOptions(selected) {
    return `<option value="">— Autre (libellé libre) —</option>${S.sortClasses(S.state.classes).map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(S.className(c))}</option>`).join('')}`;
  }

  /** Modale d'ajout / modification d'un créneau. list : tableau cible (mon EDT ou celui d'un collègue). */
  function entryModal(list, entry, { withClasses = true, onSaved } = {}) {
    const isNew = !entry;
    const e = entry ? { ...entry } : { id: uid(), day: 1, start: '08:00', end: '09:55', classId: '', label: '', place: '', week: '*', type: 'cours' };
    const inst = S.state.profile.installations;
    EPS.ui.modal({
      title: isNew ? 'Nouveau créneau' : 'Modifier le créneau',
      body: `<div class="form-grid">
        <label class="field">Jour<select name="day">${[1, 2, 3, 4, 5, 6].map((d) => `<option value="${d}" ${e.day === d ? 'selected' : ''}>${DAYS[d]}</option>`).join('')}</select></label>
        <label class="field">Semaine<select name="week">${[['*', 'Toutes les semaines'], ['A', 'Semaine A'], ['B', 'Semaine B']].map(([v, l]) => `<option value="${v}" ${e.week === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field">Début<input type="time" name="start" value="${e.start}"></label>
        <label class="field">Fin<input type="time" name="end" value="${e.end}"></label>
        ${withClasses ? `<label class="field">Classe<select name="classId">${classOptions(e.classId)}</select></label>` : ''}
        <label class="field">Libellé ${withClasses ? '(si pas de classe)' : ''}<input type="text" name="label" value="${esc(e.label)}" placeholder="AS badminton, réunion…"></label>
        <label class="field">Lieu<input type="text" name="place" value="${esc(e.place)}" list="inst-dl"><datalist id="inst-dl">${inst.map((i) => `<option>${esc(i)}</option>`).join('')}</datalist></label>
        <label class="field">Type<select name="type">${[['cours', 'Cours d\'EPS'], ['AS', 'AS / UNSS'], ['autre', 'Autre']].map(([v, l]) => `<option value="${v}" ${e.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>`,
      actions: [
        ...(isNew ? [] : [{ label: 'Supprimer', danger: true, onClick: () => { const i = list.findIndex((x) => x.id === e.id); if (i >= 0) list.splice(i, 1); S.save(); onSaved ? onSaved() : EPS.rerender(); } }]),
        { label: 'Annuler' },
        { label: 'Enregistrer', primary: true, onClick: (m) => {
          const f = EPS.ui.formData(m);
          if (toMin(f.end) <= toMin(f.start)) { EPS.ui.toast('L\'heure de fin doit être après le début', 'err'); return false; }
          Object.assign(e, { ...f, day: Number(f.day), classId: f.classId || '' });
          if (isNew) list.push(e); else Object.assign(list.find((x) => x.id === e.id), e);
          S.save(); onSaved ? onSaved() : EPS.rerender();
        } },
      ],
    });
  }

  /* ---------- Import PDF ---------- */
  function importFlow({ title, list, pdfKey, withClasses = true, onDone }) {
    let rows = [];
    let pdfDoc = null;
    EPS.ui.modal({
      title,
      wide: true,
      body: `
        <div id="step1">
          <div class="dropzone" id="dz">📄 <strong>Déposez ici l'emploi du temps PDF</strong> donné par l'établissement<br><span class="small">ou cliquez pour choisir le fichier</span><input type="file" accept="application/pdf" id="file" hidden></div>
          <p class="muted small" style="margin-top:10px">L'application lit le PDF (jours, horaires, classes, salles) et vous propose un emploi du temps à vérifier. Le PDF original reste consultable dans l'application.</p>
        </div>
        <div id="step2" hidden>
          <div class="grid grid-2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)">
            <div><div class="muted small" style="margin-bottom:6px">PDF original</div><div class="pdf-preview" id="preview"></div></div>
            <div>
              <div id="status"></div>
              <div class="tbl-wrap"><table class="tbl" id="rows"><thead><tr><th></th><th>Jour</th><th>Début</th><th>Fin</th>${withClasses ? '<th>Classe</th>' : ''}<th>Libellé</th><th>Lieu</th><th>Sem.</th></tr></thead><tbody></tbody></table></div>
              <div class="row" style="margin-top:10px"><button class="btn sm" id="addrow">＋ Ajouter une ligne</button></div>
              <div class="stack" style="margin-top:14px">
                <label class="check"><input type="checkbox" id="replace" checked> Remplacer l'emploi du temps actuel (${list.length} créneau(x))</label>
                ${withClasses ? '<label class="check"><input type="checkbox" id="mkclasses" checked> Créer automatiquement les classes détectées qui n\'existent pas encore</label>' : ''}
              </div>
            </div>
          </div>
        </div>`,
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer l\'emploi du temps', primary: true, onClick: (m) => save(m) }],
      onMount: (m) => {
        const dz = m.querySelector('#dz'), input = m.querySelector('#file');
        dz.onclick = () => input.click();
        dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('over'); };
        dz.ondragleave = () => dz.classList.remove('over');
        dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) handle(m, e.dataTransfer.files[0]); };
        input.onchange = () => input.files[0] && handle(m, input.files[0]);
        m.querySelector('#addrow').onclick = () => { rows.push({ include: true, day: 1, start: '08:00', end: '09:55', classId: '', label: '', place: '', week: '*', type: 'cours' }); draw(m); };
      },
    });

    async function handle(m, file) {
      if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) { EPS.ui.toast('Choisissez un fichier PDF', 'err'); return; }
      m.querySelector('#step1').hidden = true;
      m.querySelector('#step2').hidden = false;
      const status = m.querySelector('#status');
      status.innerHTML = '<div class="notice">Lecture du PDF…</div>';
      const dataUrl = await EPS.ui.readAsDataURL(file);
      await S.putFile(pdfKey, dataUrl);
      const buf = await EPS.ui.readAsArrayBuffer(file);
      try {
        const { doc, pages } = await EPS.pdf.extractPages(buf);
        pdfDoc = doc;
        const canvas = document.createElement('canvas');
        m.querySelector('#preview').appendChild(canvas);
        EPS.pdf.renderPage(doc, 1, canvas);
        const res = EPS.pdf.parseTimetable(pages, { classes: S.state.classes, installations: S.state.profile.installations, defaultMinutes: S.state.profile.prefs.sessionMinutes });
        rows = res.entries.map((e) => ({ ...e, include: true }));
        status.innerHTML = rows.length
          ? `<div class="notice">✔ ${rows.length} créneau(x) détecté(s) (lecture « ${res.mode} »). Vérifiez les horaires et les classes, corrigez si besoin, puis enregistrez.</div>`
          : '<div class="notice warn">Aucun créneau n\'a pu être reconnu automatiquement (PDF scanné ou mise en page inhabituelle). Ajoutez vos créneaux avec « ＋ Ajouter une ligne » en vous aidant du PDF à gauche.</div>';
      } catch (err) {
        console.warn(err);
        m.querySelector('#preview').innerHTML = `<iframe src="${EPS.ui.blobUrl(dataUrl)}" style="width:100%;height:65vh;border:0"></iframe>`;
        status.innerHTML = '<div class="notice warn">Lecture automatique indisponible (connexion internet nécessaire pour le lecteur PDF). Le PDF est enregistré : saisissez vos créneaux avec « ＋ Ajouter une ligne ».</div>';
      }
      draw(m);
    }

    function draw(m) {
      const inst = S.state.profile.installations;
      m.querySelector('#rows tbody').innerHTML = rows.map((r, i) => `<tr style="${r.include ? '' : 'opacity:.45'}">
        <td><input type="checkbox" data-i="${i}" data-k="include" ${r.include ? 'checked' : ''} title="Inclure"></td>
        <td><select data-i="${i}" data-k="day">${[1, 2, 3, 4, 5, 6].map((d) => `<option value="${d}" ${r.day === d ? 'selected' : ''}>${DAYS[d].slice(0, 3)}</option>`).join('')}</select></td>
        <td><input type="time" data-i="${i}" data-k="start" value="${r.start}"></td>
        <td><input type="time" data-i="${i}" data-k="end" value="${r.end}"></td>
        ${withClasses ? `<td><select data-i="${i}" data-k="classId">${r.detectedClass && !r.classId ? `<option value="new:${esc(r.detectedClass)}" selected>＋ Créer ${esc(r.detectedClass)}</option>` : ''}${classOptions(r.classId)}</select></td>` : ''}
        <td><input type="text" data-i="${i}" data-k="label" value="${esc(r.label)}" title="${esc(r.raw || '')}"></td>
        <td><input type="text" data-i="${i}" data-k="place" value="${esc(r.place)}" list="inst-dl2" style="min-width:90px"></td>
        <td><select data-i="${i}" data-k="week">${['*', 'A', 'B'].map((w) => `<option ${r.week === w ? 'selected' : ''} value="${w}">${w === '*' ? 'Toutes' : w}</option>`).join('')}</select></td>
      </tr>`).join('') + `<datalist id="inst-dl2">${inst.map((x) => `<option>${esc(x)}</option>`).join('')}</datalist>`;
      m.querySelectorAll('#rows [data-i]').forEach((el) => {
        el.onchange = () => {
          const r = rows[Number(el.dataset.i)];
          r[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.dataset.k === 'day' ? Number(el.value) : el.value;
          if (el.dataset.k === 'include') draw(m);
        };
      });
    }

    function save(m) {
      const chosen = rows.filter((r) => r.include);
      if (!chosen.length) { EPS.ui.toast('Aucun créneau à enregistrer', 'err'); return false; }
      if (chosen.some((r) => toMin(r.end) <= toMin(r.start))) { EPS.ui.toast('Vérifiez les horaires (fin avant début)', 'err'); return false; }
      const mk = withClasses && m.querySelector('#mkclasses') && m.querySelector('#mkclasses').checked;
      if (m.querySelector('#replace').checked) list.splice(0, list.length);
      for (const r of chosen) {
        let classId = withClasses ? r.classId : '';
        if (classId && classId.startsWith('new:')) {
          const [level, section] = classId.slice(4).split(' ');
          let c = S.state.classes.find((x) => x.level === level && x.section === section);
          if (!c && mk) { c = { id: uid(), level, section, students: [] }; S.state.classes.push(c); }
          classId = c ? c.id : '';
          if (!c) r.label = `${level} ${section}`;
        }
        list.push({ id: uid(), day: r.day, start: r.start, end: r.end, classId, label: r.label, place: r.place, week: r.week || '*', type: r.type || 'cours' });
      }
      S.save();
      EPS.ui.toast(`Emploi du temps enregistré : ${chosen.length} créneau(x) ✔`);
      onDone ? onDone() : EPS.rerender();
    }
  }

  function showPdf(key, title) {
    const data = S.getFile(key);
    if (!data) { EPS.ui.toast('Aucun PDF enregistré', 'err'); return; }
    EPS.ui.modal({ title, wide: true, body: `<iframe src="${EPS.ui.blobUrl(data)}" style="width:100%;height:75vh;border:0;border-radius:8px"></iframe><p class="small"><a href="${data}" download="emploi-du-temps.pdf">Télécharger le PDF</a></p>` });
  }

  /* ---------- Vue « Mon emploi du temps » ---------- */
  EPS.views.timetable = function (main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Mon emploi du temps' }]);
    const offset = Number(EPS.query.s || 0);
    const monday = mondayOf(new Date()); monday.setDate(monday.getDate() + offset * 7);
    const tt = S.state.timetable;
    const wt = S.weekType(monday);
    const hasPdf = !!S.getFile('pdf:me');
    const totalMin = tt.filter((e) => e.type === 'cours' && (!e.week || e.week === '*')).reduce((s, e) => s + toMin(e.end) - toMin(e.start), 0);

    main.innerHTML = `
      <div class="page-head">
        <div><h1>Mon emploi du temps</h1><p>${tt.length} créneau(x) · ${Math.round(totalMin / 60 * 10) / 10} h de cours hebdomadaires (hors semaines A/B)</p></div>
        <div class="row">
          ${hasPdf ? '<button class="btn" id="pdf">📄 PDF original</button>' : ''}
          <button class="btn" id="add">＋ Créneau</button>
          <button class="btn primary" id="import">⬆ Importer mon emploi du temps (PDF)</button>
        </div>
      </div>
      ${tt.length ? '' : '<div class="notice" style="margin-bottom:14px">Importez le PDF fourni par votre établissement : vos créneaux apparaîtront ici et dans le calendrier, sans avoir à rouvrir le PDF.</div>'}
      <div class="row" style="margin-bottom:12px">
        <a class="btn sm" href="#/emploi-du-temps?s=${offset - 1}">‹</a>
        <a class="btn sm" href="#/emploi-du-temps?s=0">Cette semaine</a>
        <a class="btn sm" href="#/emploi-du-temps?s=${offset + 1}">›</a>
        <strong>Semaine du ${monday.getDate()} ${EPS.ui.MONTHS[monday.getMonth()]} ${monday.getFullYear()}</strong>
        ${wt ? `<span class="chip">Semaine ${wt}</span>` : ''}
        <span class="spacer"></span>
        <div class="legend">${S.LEVELS.filter((l) => tt.some((e) => S.entryColor(e) === S.LEVEL_COLOR[l])).map((l) => `<span><i style="background:${S.LEVEL_COLOR[l]}"></i>${l}</span>`).join('')}</div>
      </div>
      <div id="grid"></div>
      ${tt.length ? `<div class="row no-print" style="margin-top:14px"><span class="muted small">Cliquez sur un créneau pour le modifier.</span><span class="spacer"></span><button class="btn sm danger" id="clear">Effacer tout l'emploi du temps</button></div>` : ''}`;

    main.querySelector('#grid').appendChild(weekGrid({ monday, entries: tt, onClick: (e) => entryModal(tt, e) }));
    main.querySelector('#add').onclick = () => entryModal(tt);
    main.querySelector('#import').onclick = () => importFlow({ title: 'Importer mon emploi du temps', list: tt, pdfKey: 'pdf:me' });
    const pdfBtn = main.querySelector('#pdf'); if (pdfBtn) pdfBtn.onclick = () => showPdf('pdf:me', 'Mon emploi du temps (PDF)');
    const clr = main.querySelector('#clear');
    if (clr) clr.onclick = async () => { if (await EPS.ui.confirm('Effacer tous les créneaux de votre emploi du temps ?')) { tt.splice(0, tt.length); S.save(); EPS.rerender(); } };
  };

  EPS.tt = { weekGrid, entryModal, importFlow, showPdf, mondayOf };
})(window.EPS);
