(function (EPS) {
  const { esc, uid, toMin } = EPS.ui;
  const S = EPS.store;
  const PALETTE = ['#0f766e', '#2563eb', '#9333ea', '#e11d48', '#ea580c', '#16a34a', '#0891b2', '#a16207', '#be185d', '#4f46e5'];

  const me = () => {
    const p = S.state.profile;
    return { id: 'me', firstName: p.firstName || 'Moi', lastName: p.lastName || '', color: PALETTE[0], timetable: S.state.timetable, isMe: true };
  };
  const everyone = () => [me(), ...S.state.team];
  const fullName = (t) => `${t.firstName} ${t.lastName}`.trim();
  const normPlace = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const weeksCompatible = (a, b) => !a.week || !b.week || a.week === '*' || b.week === '*' || a.week === b.week;
  const overlap = (a, b) => a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end) && weeksCompatible(a, b);

  /** Répartit en colonnes les créneaux qui se chevauchent (même jour). */
  function lanes(entries) {
    for (let d = 1; d <= 6; d++) {
      const day = entries.filter((e) => e.day === d).sort((a, b) => toMin(a.start) - toMin(b.start));
      let group = [], groupEnd = -1;
      const flush = () => {
        const cols = [];
        group.forEach((e) => { let c = cols.findIndex((end) => end <= toMin(e.start)); if (c === -1) { c = cols.length; cols.push(0); } cols[c] = toMin(e.end); e._lane = c; });
        group.forEach((e) => { e._width = 100 / cols.length - 1; e._left = e._lane * (100 / cols.length) + 0.5; });
        group = [];
      };
      day.forEach((e) => { if (toMin(e.start) >= groupEnd && group.length) flush(); group.push(e); groupEnd = Math.max(groupEnd, toMin(e.end)); });
      if (group.length) flush();
    }
    entries.forEach((e) => { if (e._width > 98) { delete e._width; delete e._left; } });
    return entries;
  }

  EPS.views.team = function (main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Emplois du temps des profs' }]);
    const view = EPS.query.vue || 'equipe';
    const all = everyone();
    const hidden = new Set((EPS.query.masquer || '').split(',').filter(Boolean));

    main.innerHTML = `
      <div class="page-head">
        <div><h1>Emplois du temps de l'équipe EPS</h1><p>${all.length} enseignant(s) · vue d'ensemble, conflits d'installations</p></div>
        <div class="row">
          <button class="btn" id="share">⇄ Partager / recevoir</button>
          <button class="btn primary" id="add">＋ Ajouter un collègue</button>
        </div>
      </div>
      <div class="grid grid-4" id="people">${all.map((t) => `
        <div class="card" style="border-top:4px solid ${t.color}">
          <div class="row"><strong>${esc(fullName(t))}</strong>${t.isMe ? '<span class="chip">moi</span>' : ''}</div>
          <div class="muted small">${t.timetable.length} créneau(x) · ${Math.round(t.timetable.reduce((s, e) => s + toMin(e.end) - toMin(e.start), 0) / 6) / 10} h</div>
          <div class="row" style="margin-top:8px">
            ${t.isMe ? '<a class="btn sm" href="#/emploi-du-temps">Ouvrir</a>' : `<button class="btn sm" data-imp="${t.id}">⬆ PDF</button><button class="btn sm" data-addslot="${t.id}">＋</button>${S.getFile('pdf:' + t.id) ? `<button class="btn sm" data-pdf="${t.id}">📄</button>` : ''}<button class="btn sm" data-edit="${t.id}">✎</button>`}
          </div>
        </div>`).join('')}</div>

      <div class="row" style="margin:20px 0 10px">
        <div class="seg">
          <button data-vue="equipe" class="${view === 'equipe' ? 'active' : ''}">Vue d'équipe</button>
          <button data-vue="installations" class="${view === 'installations' ? 'active' : ''}">Par installation</button>
        </div>
        <span class="spacer"></span>
        <div class="row">${all.map((t) => `<label class="check small"><input type="checkbox" data-toggle="${t.id}" ${hidden.has(t.id) ? '' : 'checked'}><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${t.color}"></i>${esc(t.firstName)}</label>`).join('')}</div>
      </div>
      <div id="content"></div>`;

    // Créneaux de tous, avec détection des conflits d'installation
    const entries = [];
    all.filter((t) => !hidden.has(t.id)).forEach((t) => t.timetable.forEach((e) => entries.push({ ...e, _owner: t, _color: t.color, _title: `${t.firstName} · ${S.entryLabel(e)}`, _sub: e.place })));
    let conflicts = 0;
    entries.forEach((a, i) => entries.forEach((b, j) => {
      if (i < j && a._owner !== b._owner && normPlace(a.place) && normPlace(a.place) === normPlace(b.place) && overlap(a, b)) { a._conflict = b._conflict = true; conflicts++; }
    }));

    const content = main.querySelector('#content');
    if (conflicts) content.insertAdjacentHTML('beforeend', `<div class="notice warn" style="margin-bottom:12px">⚠️ ${conflicts} conflit(s) d'installation : deux enseignants au même endroit au même moment (encadrés en rouge).</div>`);
    if (view === 'installations') {
      const places = [...new Set(entries.map((e) => e.place || 'Lieu non précisé'))].sort();
      content.insertAdjacentHTML('beforeend', places.map((pl) => `<h2 style="margin-top:18px">📍 ${esc(pl)}</h2><div data-place="${esc(pl)}"></div>`).join('') || '<div class="card empty">Aucun créneau.</div>');
      places.forEach((pl) => {
        const list = lanes(entries.filter((e) => (e.place || 'Lieu non précisé') === pl));
        content.querySelector(`[data-place="${CSS.escape(pl)}"]`).appendChild(EPS.tt.weekGrid({ monday: EPS.tt.mondayOf(new Date()), entries: list, showDates: false, filterByDate: false }));
      });
    } else {
      content.appendChild(EPS.tt.weekGrid({ monday: EPS.tt.mondayOf(new Date()), entries: lanes(entries), showDates: false, filterByDate: false }));
    }

    main.querySelectorAll('[data-vue]').forEach((b) => { b.onclick = () => EPS.go(`#/equipe?vue=${b.dataset.vue}&masquer=${[...hidden].join(',')}`); });
    main.querySelectorAll('[data-toggle]').forEach((c) => { c.onchange = () => { c.checked ? hidden.delete(c.dataset.toggle) : hidden.add(c.dataset.toggle); EPS.go(`#/equipe?vue=${view}&masquer=${[...hidden].join(',')}`); }; });
    main.querySelector('#add').onclick = () => memberModal();
    main.querySelector('#share').onclick = shareModal;
    const byId = (id) => S.state.team.find((t) => t.id === id);
    main.querySelectorAll('[data-imp]').forEach((b) => { b.onclick = () => { const t = byId(b.dataset.imp); EPS.tt.importFlow({ title: `Emploi du temps de ${fullName(t)}`, list: t.timetable, pdfKey: 'pdf:' + t.id, withClasses: false }); }; });
    main.querySelectorAll('[data-addslot]').forEach((b) => { b.onclick = () => EPS.tt.entryModal(byId(b.dataset.addslot).timetable, null, { withClasses: false }); });
    main.querySelectorAll('[data-pdf]').forEach((b) => { b.onclick = () => EPS.tt.showPdf('pdf:' + b.dataset.pdf, `Emploi du temps — ${fullName(byId(b.dataset.pdf))}`); });
    main.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => memberModal(byId(b.dataset.edit)); });
  };

  function memberModal(t) {
    const isNew = !t;
    const m0 = t || { id: uid(), firstName: '', lastName: '', color: PALETTE[(S.state.team.length + 1) % PALETTE.length], timetable: [] };
    EPS.ui.modal({
      title: isNew ? 'Ajouter un collègue' : fullName(m0),
      body: `<div class="form-grid">
        <label class="field">Prénom<input type="text" name="firstName" value="${esc(m0.firstName)}"></label>
        <label class="field">Nom<input type="text" name="lastName" value="${esc(m0.lastName)}"></label>
        <label class="field">Couleur<input type="color" name="color" value="${m0.color}" style="height:40px;padding:2px"></label></div>
        ${isNew ? '<p class="muted small">Vous pourrez ensuite importer son emploi du temps PDF.</p>' : `<h3 style="margin-top:14px">Créneaux (${m0.timetable.length})</h3>${m0.timetable.map((e) => `<div class="row small"><span>${EPS.ui.DAYS[e.day]} ${EPS.ui.fmtTime(e.start)}–${EPS.ui.fmtTime(e.end)}</span><strong>${esc(e.label)}</strong><span class="muted">${esc(e.place || '')}</span><span class="spacer"></span><button class="btn sm" data-slot="${e.id}">Modifier</button></div>`).join('')}`}`,
      actions: [
        ...(isNew ? [] : [{ label: 'Retirer de l\'équipe', danger: true, onClick: async () => { if (!(await EPS.ui.confirm(`Retirer ${fullName(m0)} ?`))) return false; S.state.team = S.state.team.filter((x) => x.id !== m0.id); S.deleteFile('pdf:' + m0.id); S.save(); EPS.rerender(); } }]),
        { label: 'Annuler' },
        { label: 'Enregistrer', primary: true, onClick: (m) => {
          const f = EPS.ui.formData(m);
          if (!f.firstName && !f.lastName) { EPS.ui.toast('Nom requis', 'err'); return false; }
          Object.assign(m0, f);
          if (isNew) S.state.team.push(m0);
          S.save(); EPS.rerender();
        } },
      ],
      onMount: (m, close) => { m.querySelectorAll('[data-slot]').forEach((b) => { b.onclick = () => { close(); EPS.tt.entryModal(m0.timetable, m0.timetable.find((e) => e.id === b.dataset.slot), { withClasses: false }); }; }); },
    });
  }

  /** Partage sans serveur : chaque prof exporte son emploi du temps (fichier), les collègues l'importent. */
  function shareModal() {
    EPS.ui.modal({
      title: 'Partager les emplois du temps',
      body: `<p>Les données restent sur chaque appareil. Pour constituer la vue d'équipe :</p>
        <ol><li><strong>Exportez</strong> votre emploi du temps et envoyez le fichier à vos collègues (mail, ENT, clé USB).</li>
        <li><strong>Importez</strong> les fichiers reçus : chaque collègue est ajouté (ou mis à jour) automatiquement.</li></ol>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="exp">⬇ Exporter mon emploi du temps</button>
        <label class="btn">⬆ Importer un fichier de collègue<input type="file" accept=".json,application/json" id="imp" hidden multiple></label></div>`,
      actions: [{ label: 'Fermer' }],
      onMount: (m) => {
        m.querySelector('#exp').onclick = () => {
          const p = S.state.profile;
          const data = { app: 'eps-pro-edt', from: { firstName: p.firstName, lastName: p.lastName }, timetable: S.state.timetable.map((e) => ({ ...e, label: S.entryLabel(e), classId: '' })) };
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
          a.download = `edt-${(p.lastName || 'prof').toLowerCase()}.json`;
          a.click();
        };
        m.querySelector('#imp').onchange = async (e) => {
          let n = 0;
          for (const f of e.target.files) {
            try {
              const d = JSON.parse(await f.text());
              if (d.app !== 'eps-pro-edt') continue;
              let t = S.state.team.find((x) => x.firstName === d.from.firstName && x.lastName === d.from.lastName);
              if (!t) { t = { id: uid(), firstName: d.from.firstName, lastName: d.from.lastName, color: PALETTE[(S.state.team.length + 1) % PALETTE.length], timetable: [] }; S.state.team.push(t); }
              t.timetable = d.timetable.map((x) => ({ ...x, id: uid() }));
              n++;
            } catch { /* fichier ignoré */ }
          }
          S.save(); EPS.ui.toast(`${n} emploi(s) du temps importé(s)`); EPS.rerender();
        };
      },
    });
  }
})(window.EPS);
