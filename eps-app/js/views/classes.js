(function (EPS) {
  const { esc, uid, initials, isoDate } = EPS.ui;
  const S = EPS.store;

  const levelsForSchool = () => {
    const t = S.state.profile.school.type;
    const used = new Set(S.state.classes.map((c) => c.level));
    const base = t === 'lycee' ? S.LEVELS_LYCEE : t === 'cite' ? S.LEVELS : S.LEVELS_COLLEGE;
    return S.LEVELS.filter((l) => base.includes(l) || used.has(l));
  };
  const avatar = (s, cls = '') => {
    const src = S.getFile(s.photoId);
    return src ? `<img class="avatar ${cls}" src="${src}" alt="">` : `<span class="avatar ${cls}">${esc(initials(s))}</span>`;
  };
  const isInapte = (s) => s.inapte && s.inapte.active && (!s.inapte.until || s.inapte.until >= isoDate(new Date()));
  const sortStudents = (list) => [...list].sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr') || a.firstName.localeCompare(b.firstName, 'fr'));

  EPS.views.classes = function (main, [level, classId]) {
    if (classId) return classView(main, level, classId);
    if (level) return levelView(main, level);
    return levelsView(main);
  };

  /* ---------- Niveaux ---------- */
  function levelsView(main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Classes' }]);
    const lv = levelsForSchool();
    main.innerHTML = `
      <div class="page-head"><div><h1>Mes classes</h1><p>Choisissez un niveau.</p></div>
        <button class="btn primary" id="create">＋ Créer des classes</button></div>
      <div class="grid grid-4">${lv.map((l) => {
        const cl = S.state.classes.filter((c) => c.level === l);
        const n = cl.reduce((s, c) => s + c.students.length, 0);
        return `<a class="tile" href="#/classes/${l}"><span class="bar" style="background:${S.LEVEL_COLOR[l]}"></span>
          <div class="tile-title" style="font-size:2rem;color:${S.LEVEL_COLOR[l]}">${esc(l)}</div>
          <div class="tile-sub">${esc(S.LEVEL_LABEL[l])} · ${cl.length} classe(s) · ${n} élève(s)</div>
          <div class="row" style="margin-top:8px">${S.sortClasses(cl).map((c) => `<span class="chip gray">${esc(c.section)}</span>`).join('')}</div></a>`;
      }).join('')}</div>
      <p class="muted small" style="margin-top:16px">Les niveaux affichés dépendent du type d'établissement choisi dans votre <a href="#/profil">profil</a>.</p>`;
    main.querySelector('#create').onclick = () => createClasses();
  }

  function createClasses(level) {
    EPS.ui.modal({
      title: 'Créer des classes',
      body: `<div class="form-grid">
        <label class="field">Niveau<select name="level">${S.LEVELS.map((l) => `<option ${l === level ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field">Sections (séparées par des virgules)<input type="text" name="sections" value="A, B, C, D"></label>
      </div><p class="muted small">Exemple : « A, B, C, D » crée 6e A, 6e B, 6e C et 6e D. Les classes existantes ne sont pas dupliquées.</p>`,
      actions: [{ label: 'Annuler' }, { label: 'Créer', primary: true, onClick: (m) => {
        const f = EPS.ui.formData(m);
        const secs = f.sections.split(/[,;\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);
        if (!secs.length) { EPS.ui.toast('Indiquez au moins une section', 'err'); return false; }
        let n = 0;
        secs.forEach((sec) => {
          if (!S.state.classes.find((c) => c.level === f.level && c.section === sec)) { S.state.classes.push({ id: uid(), level: f.level, section: sec, students: [] }); n++; }
        });
        S.save(); EPS.ui.toast(`${n} classe(s) créée(s)`); EPS.go(`#/classes/${f.level}`);
      } }],
    });
  }

  /* ---------- Sections d'un niveau ---------- */
  function levelView(main, level) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { href: '#/classes', label: 'Classes' }, { label: level }]);
    const cl = S.sortClasses(S.state.classes.filter((c) => c.level === level));
    main.innerHTML = `
      <div class="page-head"><div><h1 style="color:${S.LEVEL_COLOR[level]}">${esc(S.LEVEL_LABEL[level])}</h1><p>${cl.length} classe(s)</p></div>
        <button class="btn primary" id="create">＋ Ajouter une classe</button></div>
      ${cl.length ? `<div class="grid grid-4">${cl.map((c) => `
        <a class="tile" href="#/classes/${level}/${c.id}"><span class="bar" style="background:${S.LEVEL_COLOR[level]}"></span>
          <div class="tile-title">${esc(S.className(c))}</div>
          <div class="tile-sub">${c.students.length} élève(s)${c.students.filter(isInapte).length ? ` · ${c.students.filter(isInapte).length} inapte(s)` : ''}</div>
          <div class="row" style="margin-top:10px;gap:0">${sortStudents(c.students).slice(0, 8).map((s) => `<span style="margin-right:-8px;border:2px solid #fff;border-radius:50%">${avatar(s)}</span>`).join('')}${c.students.length > 8 ? `<span class="muted small" style="margin-left:14px">+${c.students.length - 8}</span>` : ''}</div>
        </a>`).join('')}</div>`
      : `<div class="card empty"><div class="big">👥</div>Aucune classe en ${esc(level)}.<br><br><button class="btn primary" id="create2">Créer les classes de ${esc(level)}</button></div>`}`;
    main.querySelector('#create').onclick = () => createClasses(level);
    const c2 = main.querySelector('#create2'); if (c2) c2.onclick = () => createClasses(level);
  }

  /* ---------- Une classe ---------- */
  function classView(main, level, classId) {
    const c = S.classById(classId);
    if (!c) { main.innerHTML = '<div class="card empty">Classe introuvable.</div>'; return; }
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { href: '#/classes', label: 'Classes' }, { href: `#/classes/${c.level}`, label: c.level }, { label: S.className(c) }]);
    const tab = EPS.query.tab || 'apercu';
    const slots = S.state.timetable.filter((e) => e.classId === c.id);
    const inaptes = c.students.filter(isInapte);

    main.innerHTML = `
      <div class="page-head">
        <div><h1><span style="color:${S.LEVEL_COLOR[c.level]}">●</span> ${esc(S.className(c))}</h1>
          <p>${c.students.length} élève(s)${inaptes.length ? ` · ${inaptes.length} inapte(s)` : ''}${slots.length ? ` · ${slots.map((e) => `${EPS.ui.DAYS[e.day]} ${EPS.ui.fmtTime(e.start)}`).join(', ')}` : ''}</p></div>
        <div class="row">
          <button class="btn primary" id="appel">Faire l'appel</button>
          <button class="btn" id="plan">＋ Séquence</button>
          <details class="menu"><summary class="btn" aria-label="Plus d'actions">Plus ▾</summary>
            <div class="menu-pop"><button class="btn ghost" id="rename">Renommer la classe</button><button class="btn ghost danger" id="delete">Supprimer la classe</button></div>
          </details>
        </div>
      </div>
      <div class="tabs">
        <button data-tab="apercu" class="${tab === 'apercu' ? 'active' : ''}">Vue d'ensemble</button>
        <button data-tab="eleves" class="${tab === 'eleves' ? 'active' : ''}">Élèves (${c.students.length})</button>
        <button data-tab="sequences" class="${tab === 'sequences' ? 'active' : ''}">Séquences</button>
        <button data-tab="calendrier" class="${tab === 'calendrier' ? 'active' : ''}">Calendrier</button>
        <button data-tab="ca" class="${tab === 'ca' ? 'active' : ''}">CA et évaluations</button>
        <button data-tab="creneaux" class="${tab === 'creneaux' ? 'active' : ''}">Créneaux</button>
      </div>
      <div id="tab"></div>`;
    main.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => EPS.go(`#/classes/${c.level}/${c.id}?tab=${b.dataset.tab}`); });
    main.querySelector('#plan').onclick = () => EPS.classProgram.sequenceModal(c);
    main.querySelector('#appel').onclick = () => EPS.att.modal(c);
    main.querySelector('#rename').onclick = () => EPS.ui.modal({
      title: 'Renommer la classe',
      body: `<div class="form-grid"><label class="field">Niveau<select name="level">${S.LEVELS.map((l) => `<option ${l === c.level ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="field">Section<input type="text" name="section" value="${esc(c.section)}"></label></div>`,
      actions: [{ label: 'Annuler' }, { label: 'Enregistrer', primary: true, onClick: (m) => { const f = EPS.ui.formData(m); c.level = f.level; c.section = f.section.toUpperCase(); S.save(); EPS.go(`#/classes/${c.level}/${c.id}`); } }],
    });
    main.querySelector('#delete').onclick = async () => {
      if (!(await EPS.ui.confirm(`Supprimer ${S.className(c)} et ses ${c.students.length} élève(s) ?`))) return;
      c.students.forEach((s) => S.deleteFile(s.photoId));
      S.state.classes = S.state.classes.filter((x) => x.id !== c.id);
      S.state.timetable.forEach((e) => { if (e.classId === c.id) { e.label = S.className(c); e.classId = ''; } });
      S.save(); EPS.go(`#/classes/${c.level}`);
    };

    const el = main.querySelector('#tab');
    if (tab === 'ca') return caTab(el, c);
    if (tab === 'creneaux') return slotsTab(el, c, slots);
    if (tab === 'sequences') return EPS.classProgram.sequencesTab(el, c);
    if (tab === 'calendrier') return EPS.classProgram.calendarTab(el, c);
    if (tab === 'eleves') return studentsTab(el, c);
    EPS.classProgram.overview(el, c);
  }

  function studentsTab(el, c) {
    const list = sortStudents(c.students);
    el.innerHTML = `
      <div class="row" style="margin-bottom:14px">
        <button class="btn primary" id="add">＋ Ajouter un élève</button>
        <button class="btn" id="bulk">Coller une liste</button>
        <label class="btn">Importer des photos<input type="file" accept="image/*" multiple id="photos" hidden></label>
        <span class="spacer"></span>
        <input type="text" id="search" placeholder="Rechercher…" style="max-width:220px">
      </div>
      ${list.length ? `<div class="students" id="grid">${list.map((s) => `
        <div class="student" data-id="${s.id}" data-q="${esc((s.lastName + ' ' + s.firstName).toLowerCase())}">
          ${isInapte(s) ? `<span class="badge chip ${s.inapte.type === 'partielle' ? 'warn' : 'danger'}" title="${esc(s.inapte.note || '')}">Inapte</span>` : ''}
          ${avatar(s)}
          <div class="name">${esc(s.lastName.toUpperCase())}</div><div class="first">${esc(s.firstName)}</div>
        </div>`).join('')}</div>`
      : '<div class="card empty"><div class="big">🧑‍🎓</div>Aucun élève dans cette classe.<br>Ajoutez-les un par un ou collez la liste exportée de votre logiciel de vie scolaire.</div>'}`;
    el.querySelector('#add').onclick = () => studentModal(c);
    el.querySelector('#bulk').onclick = () => bulkModal(c);
    el.querySelectorAll('.student').forEach((d) => { d.onclick = () => studentModal(c, c.students.find((s) => s.id === d.dataset.id)); });
    el.querySelector('#search').oninput = (e) => { const q = e.target.value.toLowerCase(); el.querySelectorAll('.student').forEach((d) => { d.style.display = d.dataset.q.includes(q) ? '' : 'none'; }); };
    el.querySelector('#photos').onchange = async (e) => {
      const files = [...e.target.files];
      const n = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
      let ok = 0;
      for (const f of files) {
        const fn = n(f.name.replace(/\.[^.]+$/, ''));
        const s = c.students.find((st) => fn.includes(n(st.lastName)) && fn.includes(n(st.firstName)));
        if (!s) continue;
        const data = await EPS.ui.resizeImage(f);
        s.photoId = s.photoId || `photo:${s.id}`;
        await S.putFile(s.photoId, data); ok++;
      }
      S.save();
      EPS.ui.toast(`${ok} photo(s) associée(s) sur ${files.length}${ok < files.length ? ' — nommez les fichiers « NOM_Prénom.jpg »' : ''}`);
      EPS.rerender();
    };
  }

  function studentModal(c, s) {
    const isNew = !s;
    const st = s ? JSON.parse(JSON.stringify(s)) : { id: uid(), lastName: '', firstName: '', photoId: '', birth: '', notes: '', inapte: { active: false, type: 'totale', until: '', note: '' } };
    let newPhoto = null;
    EPS.ui.modal({
      title: isNew ? 'Nouvel élève' : `${st.lastName.toUpperCase()} ${st.firstName}`,
      body: `
        <div class="row" style="align-items:flex-start;gap:18px">
          <div style="text-align:center">
            <div id="ph">${avatar(st, 'lg')}</div>
            <label class="btn sm" style="margin-top:8px">Changer la photo<input type="file" accept="image/*" capture="user" id="pf" hidden></label>
          </div>
          <div class="form-grid" style="flex:1;min-width:240px">
            <label class="field">Nom<input type="text" name="lastName" value="${esc(st.lastName)}"></label>
            <label class="field">Prénom<input type="text" name="firstName" value="${esc(st.firstName)}"></label>
            <label class="field">Date de naissance<input type="date" name="birth" value="${esc(st.birth || '')}"></label>
            <span></span>
            <label class="field full">Remarques (PAI, asthme, aménagements, AS…)<textarea name="notes">${esc(st.notes || '')}</textarea></label>
          </div>
        </div>
        ${isNew ? '' : (() => { const h = EPS.att.studentStats(c, st.id); const parts = EPS.att.STATUSES.filter((x) => x.id !== 'P' && h[x.id]).map((x) => `<span class="chip" style="background:${x.color}1a;color:${x.color}">${h[x.id]} ${x.label.toLowerCase()}</span>`); return `<div class="row" style="margin-top:12px"><span class="muted small">Suivi des appels :</span>${parts.join('') || `<span class="chip">${h.P || 0} présence(s), rien à signaler</span>`}</div>`; })()}
        <div class="card" style="margin-top:14px;background:var(--surface-2)">
          <label class="check"><input type="checkbox" name="inapte" ${st.inapte.active ? 'checked' : ''}> Inaptitude en cours</label>
          <div class="form-grid" style="margin-top:10px">
            <label class="field">Type<select name="itype"><option value="totale" ${st.inapte.type === 'totale' ? 'selected' : ''}>Totale</option><option value="partielle" ${st.inapte.type === 'partielle' ? 'selected' : ''}>Partielle</option></select></label>
            <label class="field">Jusqu'au<input type="date" name="iuntil" value="${esc(st.inapte.until || '')}"></label>
            <label class="field full">Détail (certificat, activités autorisées…)<input type="text" name="inote" value="${esc(st.inapte.note || '')}"></label>
          </div>
        </div>`,
      actions: [
        ...(isNew ? [] : [{ label: 'Supprimer', danger: true, onClick: async () => {
          if (!(await EPS.ui.confirm(`Supprimer ${st.firstName} ${st.lastName} ?`))) return false;
          S.deleteFile(st.photoId); c.students = c.students.filter((x) => x.id !== st.id); S.save(); EPS.rerender();
        } }]),
        { label: 'Annuler' },
        { label: 'Enregistrer', primary: true, onClick: async (m) => {
          const f = EPS.ui.formData(m);
          if (!f.lastName && !f.firstName) { EPS.ui.toast('Nom ou prénom requis', 'err'); return false; }
          Object.assign(st, { lastName: f.lastName, firstName: f.firstName, birth: f.birth, notes: f.notes, inapte: { active: f.inapte, type: f.itype, until: f.iuntil, note: f.inote } });
          if (newPhoto) { st.photoId = st.photoId || `photo:${st.id}`; await S.putFile(st.photoId, newPhoto); }
          if (isNew) c.students.push(st); else Object.assign(s, st);
          S.save(); EPS.rerender();
        } },
      ],
      onMount: (m) => {
        m.querySelector('#pf').onchange = async (e) => { const file = e.target.files[0]; if (!file) return; newPhoto = await EPS.ui.resizeImage(file); m.querySelector('#ph').innerHTML = `<img class="avatar lg" src="${newPhoto}" alt="">`; };
      },
    });
  }

  function bulkModal(c) {
    EPS.ui.modal({
      title: `Ajouter une liste d'élèves — ${S.className(c)}`,
      body: `<p class="muted small">Un élève par ligne : « NOM Prénom », « Nom;Prénom » ou copier-coller depuis un tableur (Pronote, ENT…).</p>
        <textarea name="list" style="min-height:220px" placeholder="DUPONT Léa&#10;MARTIN Hugo&#10;Benali;Inès"></textarea>`,
      actions: [{ label: 'Annuler' }, { label: 'Ajouter', primary: true, onClick: (m) => {
        const lines = m.querySelector('[name=list]').value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        let n = 0;
        for (const l of lines) {
          let last = '', first = '';
          if (/[;\t,]/.test(l)) { [last, first] = l.split(/[;\t,]/).map((x) => x.trim()); }
          else {
            const words = l.split(/\s+/);
            const up = words.filter((w) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w));
            if (up.length && up.length < words.length) { last = up.join(' '); first = words.filter((w) => !up.includes(w)).join(' '); }
            else { last = words[0]; first = words.slice(1).join(' '); }
          }
          if (!last && !first) continue;
          if (c.students.find((s) => s.lastName.toLowerCase() === last.toLowerCase() && s.firstName.toLowerCase() === (first || '').toLowerCase())) continue;
          c.students.push({ id: uid(), lastName: last, firstName: first || '', photoId: '', notes: '', inapte: { active: false, type: 'totale', until: '', note: '' } });
          n++;
        }
        S.save(); EPS.ui.toast(`${n} élève(s) ajouté(s)`); EPS.rerender();
      } }],
    });
  }

  function caTab(el, c) {
    const cas = EPS.prog.caForLevel(c.level);
    el.innerHTML = `
      <p class="muted">${EPS.store.isLycee(c.level) ? 'Au lycée : 5 champs d\'apprentissage.' : 'Au collège : 4 champs d\'apprentissage.'} Choisissez un CA, puis une activité : le plan de séquence et les plans de séance sont générés pour la ${esc(S.className(c))}.</p>
      <div class="grid grid-${cas.length === 5 ? '3' : '2'}">
        ${cas.map((ca) => `<a class="tile ca-card" href="#/ca/${ca.id}?niveau=${c.level}&classe=${c.id}"><span class="bar" style="background:${ca.color}"></span>
          <div class="ca-num" style="color:${ca.color}">${ca.id}</div>
          <div class="tile-title" style="font-size:1rem;margin-top:4px">${esc(ca.titre)}</div>
          <div class="tile-sub">${EPS.activities.byCA(ca.id).filter((a) => a.levels.includes(c.level)).length} activités</div></a>`).join('')}
      </div>
      <div class="card" style="margin-top:18px">
        <h2>Fiche d'évaluation par activité</h2>
        <p class="muted small">Ouvrez la grille d'évaluation d'une activité et positionnez chaque élève de la ${esc(S.className(c))}.</p>
        <div class="row"><select id="ev-act" style="max-width:340px">${cas.map((ca) => `<optgroup label="${ca.id} — ${esc(ca.court)}">${EPS.activities.byCA(ca.id).filter((a) => a.levels.includes(c.level)).map((a) => `<option value="${a.id}">${esc(a.nom)}</option>`).join('')}</optgroup>`).join('')}</select>
        <button class="btn primary" id="ev-go">Ouvrir la fiche</button></div>
        ${evaluatedList(c)}
      </div>`;
    el.querySelector('#ev-go').onclick = () => EPS.go(`#/evaluation/${el.querySelector('#ev-act').value}/${c.level}?classe=${c.id}`);
  }
  function evaluatedList(c) {
    const keys = Object.keys(S.state.evaluations).filter((k) => k.startsWith(c.id + '|'));
    if (!keys.length) return '';
    return `<div style="margin-top:12px" class="row"><span class="muted small">Évaluations en cours :</span>${keys.map((k) => { const a = EPS.activities.byId(k.split('|')[1]); return a ? `<a class="chip" href="#/evaluation/${a.id}/${c.level}?classe=${c.id}">${esc(a.nom)}</a>` : ''; }).join('')}</div>`;
  }

  function slotsTab(el, c, slots) {
    el.innerHTML = slots.length
      ? `<div class="card"><table class="tbl"><thead><tr><th>Jour</th><th>Horaire</th><th>Lieu</th><th>Semaine</th></tr></thead><tbody>${slots.sort((a, b) => a.day - b.day).map((e) => `<tr><td>${EPS.ui.DAYS[e.day]}</td><td>${EPS.ui.fmtTime(e.start)} – ${EPS.ui.fmtTime(e.end)}</td><td>${esc(e.place || '')}</td><td>${e.week && e.week !== '*' ? 'Semaine ' + e.week : 'Toutes'}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="card empty">Aucun créneau associé à cette classe.<br><br><a class="btn primary" href="#/emploi-du-temps">Importer / compléter mon emploi du temps</a></div>`;
  }

  EPS.classesUI = { avatar, isInapte, sortStudents, studentModal };
})(window.EPS);
