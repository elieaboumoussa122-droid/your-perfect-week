(function (EPS) {
  const { esc, uid } = EPS.ui;
  const S = EPS.store;

  EPS.views.profile = function (main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Profil' }]);
    const p = JSON.parse(JSON.stringify(S.state.profile)); // copie de travail
    const photo = S.getFile(p.photoId);
    const classes = S.sortClasses(S.state.classes);
    const opt = (v, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(v || '—')}</option>`;

    main.innerHTML = `
      <div class="page-head"><div><h1>Mon profil</h1><p>Vos informations restent sur cet appareil.</p></div>
        <button class="btn primary" id="save">Enregistrer</button></div>

      <div class="grid" style="grid-template-columns: 260px minmax(0,1fr)">
        <div class="card" style="text-align:center;align-self:start">
          <div id="photo-wrap">${photo ? `<img class="avatar lg" src="${photo}" alt="">` : `<div class="avatar lg" style="margin:0 auto">${esc(EPS.ui.initials(p))}</div>`}</div>
          <h2 style="margin-top:12px">${esc([p.civilite, p.firstName, p.lastName].filter(Boolean).join(' ') || 'Professeur d\'EPS')}</h2>
          <p class="muted small">${esc(p.school.name || 'Établissement non renseigné')}</p>
          <label class="btn sm" style="margin-top:6px">📷 Changer la photo<input type="file" accept="image/*" id="photo" hidden></label>
          <div style="margin-top:16px;text-align:left">
            <div class="muted small" style="margin-bottom:6px">Mes classes (${classes.length})</div>
            <div class="row">${classes.map((c) => `<a class="chip" style="background:${S.LEVEL_COLOR[c.level]}22;color:${S.LEVEL_COLOR[c.level]}" href="#/classes/${c.level}/${c.id}">${esc(S.className(c))}</a>`).join('') || '<span class="muted small">Aucune — <a href="#/classes">créer</a></span>'}</div>
          </div>
        </div>

        <div>
          <div class="card">
            <h2>Identité</h2>
            <div class="form-grid">
              <label class="field">Civilité<select name="civilite">${['', 'M.', 'Mme'].map((v) => opt(v, p.civilite)).join('')}</select></label>
              <span></span>
              <label class="field">Prénom<input type="text" name="firstName" value="${esc(p.firstName)}"></label>
              <label class="field">Nom<input type="text" name="lastName" value="${esc(p.lastName)}"></label>
              <label class="field">E-mail professionnel<input type="email" name="email" value="${esc(p.email)}"></label>
              <label class="field">Téléphone<input type="tel" name="phone" value="${esc(p.phone)}"></label>
              <label class="field">Statut<select name="statut">${['', 'Titulaire', 'Titulaire sur zone de remplacement (TZR)', 'Contractuel', 'Stagiaire', 'Vacataire'].map((v) => opt(v, p.statut)).join('')}</select></label>
              <label class="field">Corps / grade<select name="corps">${['', 'Professeur certifié d\'EPS (CAPEPS)', 'Professeur agrégé d\'EPS', 'Professeur de sport', 'Professeur contractuel', 'Autre'].map((v) => opt(v, p.corps)).join('')}</select></label>
              <label class="field full">Diplômes et formations (STAPS, brevets fédéraux, formations continues…)<input type="text" name="diplomes" value="${esc(p.diplomes)}"></label>
            </div>
          </div>

          <div class="card">
            <h2>Établissement actuel</h2>
            <div class="form-grid">
              <label class="field full">Nom de l'établissement<input type="text" name="school.name" value="${esc(p.school.name)}" placeholder="Collège / Lycée …"></label>
              <label class="field">Type<select name="school.type">${[['college', 'Collège (6e – 3e)'], ['lycee', 'Lycée (2nde – Tle)'], ['cite', 'Cité scolaire (collège + lycée)']].map(([v, l]) => `<option value="${v}" ${p.school.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
              <label class="field">Ville<input type="text" name="school.city" value="${esc(p.school.city)}"></label>
              <label class="field">Académie / zone<input type="text" name="school.academie" value="${esc(p.school.academie)}"></label>
              <label class="field">Code établissement (UAI / RNE)<input type="text" name="school.uai" value="${esc(p.school.uai)}"></label>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h2>Parcours — périodes travaillées</h2><button class="btn sm" id="add-period">＋ Ajouter</button></div>
            <div class="tbl-wrap"><table class="tbl" id="periods"><thead><tr><th>Établissement</th><th>De</th><th>À</th><th>Fonction / remarques</th><th></th></tr></thead><tbody></tbody></table></div>
          </div>

          <div class="card">
            <h2>Missions et responsabilités</h2>
            <label class="field">Coordonnateur EPS, professeur principal, référent sécurité, tuteur de stagiaire…<input type="text" name="missions" value="${esc(p.missions)}"></label>
            <h3 style="margin-top:16px">Association sportive (UNSS)</h3>
            <div class="form-grid">
              <label class="check full"><input type="checkbox" name="as.coordinateur" ${p.as.coordinateur ? 'checked' : ''}> Je suis coordonnateur / coordonnatrice de l'AS</label>
              <label class="field">Activités encadrées à l'AS<input type="text" name="as.activites" value="${esc(p.as.activites)}" placeholder="Badminton, cross…"></label>
              <label class="field">Créneaux AS<input type="text" name="as.creneaux" value="${esc(p.as.creneaux)}" placeholder="Mercredi 13h–16h"></label>
            </div>
          </div>

          <div class="card">
            <h2>Spécialités (APSA)</h2>
            <p class="muted small">Activités dans lesquelles vous êtes spécialiste ou que vous aimez enseigner.</p>
            <div class="row" id="spec-chips"></div>
            <div class="row" style="margin-top:10px"><select id="spec-add" style="max-width:320px"><option value="">＋ Ajouter une activité…</option>${EPS.prog.CA.map((c) => `<optgroup label="${c.id}">${EPS.activities.byCA(c.id).map((a) => `<option>${esc(a.nom)}</option>`).join('')}</optgroup>`).join('')}</select></div>
          </div>

          <div class="card">
            <h2>Installations sportives</h2>
            <p class="muted small">Utilisées pour reconnaître les lieux dans l'emploi du temps et repérer les conflits d'installations entre collègues.</p>
            <div class="row" id="inst-chips"></div>
            <div class="row" style="margin-top:10px"><input type="text" id="inst-add" placeholder="Ex. Gymnase Jean Moulin, Piscine municipale" style="max-width:320px"><button class="btn sm" id="inst-btn">Ajouter</button></div>
          </div>

          <div class="card">
            <div class="card-head"><h2>Qualifications sécurité / secourisme</h2><button class="btn sm" id="add-qualif">＋ Ajouter</button></div>
            <p class="muted small">PSC1, SST, PSE1, BNSSA, qualification d'encadrement (escalade, natation)… Une alerte s'affiche à l'accueil 2 mois avant l'échéance.</p>
            <div class="tbl-wrap"><table class="tbl" id="qualifs"><thead><tr><th>Qualification</th><th>Obtenue le</th><th>Valable jusqu'au</th><th></th></tr></thead><tbody></tbody></table></div>
          </div>

          <div class="card">
            <h2>Préférences</h2>
            <div class="form-grid">
              <label class="field">Durée d'une séance (min)<input type="number" min="30" max="240" step="5" name="prefs.sessionMinutes" value="${p.prefs.sessionMinutes}"></label>
              <label class="field">Séances par séquence<input type="number" min="4" max="16" name="prefs.sessionsPerSequence" value="${p.prefs.sessionsPerSequence}"></label>
              <label class="field">Une semaine A (n'importe quel jour)<input type="date" name="prefs.weekARef" value="${esc(p.prefs.weekARef)}"></label>
              <label class="check" style="align-self:end"><input type="checkbox" name="prefs.showSaturday" ${p.prefs.showSaturday ? 'checked' : ''}> Afficher le samedi</label>
              <label class="field">Début de journée<input type="time" name="prefs.dayStart" value="${esc(p.prefs.dayStart)}"></label>
              <label class="field">Fin de journée<input type="time" name="prefs.dayEnd" value="${esc(p.prefs.dayEnd)}"></label>
            </div>
          </div>
        </div>
      </div>`;

    if (window.innerWidth < 760) main.querySelector('.grid').style.gridTemplateColumns = 'minmax(0,1fr)';

    /* ----- listes dynamiques ----- */
    const drawPeriods = () => {
      main.querySelector('#periods tbody').innerHTML = p.periods.map((r, i) => `<tr>
        <td><input type="text" data-p="${i}" data-k="school" value="${esc(r.school)}"></td>
        <td><input type="text" data-p="${i}" data-k="from" value="${esc(r.from)}" placeholder="2022"></td>
        <td><input type="text" data-p="${i}" data-k="to" value="${esc(r.to)}" placeholder="aujourd'hui"></td>
        <td><input type="text" data-p="${i}" data-k="role" value="${esc(r.role)}"></td>
        <td><button class="btn sm danger" data-del-p="${i}">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Aucune période. Ajoutez vos établissements précédents.</td></tr>';
    };
    const drawQualifs = () => {
      main.querySelector('#qualifs tbody').innerHTML = p.qualifs.map((q, i) => `<tr>
        <td><input type="text" data-q="${i}" data-k="name" value="${esc(q.name)}" list="qualif-list"></td>
        <td><input type="date" data-q="${i}" data-k="date" value="${esc(q.date || '')}"></td>
        <td><input type="date" data-q="${i}" data-k="until" value="${esc(q.until || '')}"></td>
        <td><button class="btn sm danger" data-del-q="${i}">✕</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Aucune qualification renseignée.</td></tr>';
    };
    const drawChips = (sel, arr) => {
      main.querySelector(sel).innerHTML = arr.map((v, i) => `<span class="chip">${esc(v)}<button data-i="${i}" aria-label="Retirer">×</button></span>`).join('') || '<span class="muted small">Aucune</span>';
      main.querySelectorAll(`${sel} button`).forEach((b) => { b.onclick = () => { arr.splice(Number(b.dataset.i), 1); drawChips(sel, arr); }; });
    };
    main.insertAdjacentHTML('beforeend', '<datalist id="qualif-list"><option>PSC1</option><option>SST</option><option>PSE1</option><option>PSE2</option><option>BNSSA</option><option>Qualification escalade (SAE)</option></datalist>');
    drawPeriods(); drawQualifs(); drawChips('#spec-chips', p.specialites); drawChips('#inst-chips', p.installations);

    main.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.p !== undefined) p.periods[t.dataset.p][t.dataset.k] = t.value;
      if (t.dataset.q !== undefined) p.qualifs[t.dataset.q][t.dataset.k] = t.value;
    });
    main.addEventListener('click', (e) => {
      const t = e.target;
      if (t.dataset.delP !== undefined) { p.periods.splice(Number(t.dataset.delP), 1); drawPeriods(); }
      if (t.dataset.delQ !== undefined) { p.qualifs.splice(Number(t.dataset.delQ), 1); drawQualifs(); }
    });
    main.querySelector('#add-period').onclick = () => { p.periods.push({ id: uid(), school: '', from: '', to: '', role: '' }); drawPeriods(); };
    main.querySelector('#add-qualif').onclick = () => { p.qualifs.push({ id: uid(), name: '', date: '', until: '' }); drawQualifs(); };
    main.querySelector('#spec-add').onchange = (e) => { const v = e.target.value; if (v && !p.specialites.includes(v)) p.specialites.push(v); e.target.value = ''; drawChips('#spec-chips', p.specialites); };
    const addInst = () => { const i = main.querySelector('#inst-add'); const v = i.value.trim(); if (v && !p.installations.includes(v)) p.installations.push(v); i.value = ''; drawChips('#inst-chips', p.installations); };
    main.querySelector('#inst-btn').onclick = addInst;
    main.querySelector('#inst-add').onkeydown = (e) => { if (e.key === 'Enter') addInst(); };

    main.querySelector('#photo').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const data = await EPS.ui.resizeImage(f, 320);
      const id = p.photoId || `photo:prof:${uid()}`;
      await S.putFile(id, data);
      p.photoId = id;
      main.querySelector('#photo-wrap').innerHTML = `<img class="avatar lg" src="${data}" alt="">`;
    };

    main.querySelector('#save').onclick = () => {
      main.querySelectorAll('[name]').forEach((el) => {
        const path = el.name.split('.');
        let o = p;
        while (path.length > 1) o = o[path.shift()];
        o[path[0]] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value.trim();
      });
      S.state.profile = p;
      S.save();
      EPS.ui.toast('Profil enregistré ✔');
      EPS.rerender();
    };
  };
})(window.EPS);
