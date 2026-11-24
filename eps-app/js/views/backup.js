(function (EPS) {
  const S = EPS.store;
  EPS.views.backup = function (main) {
    EPS.ui.setCrumbs([{ href: '#/', label: 'Accueil' }, { label: 'Sauvegarde' }]);
    const st = S.state;
    main.innerHTML = `
      <div class="page-head"><div><h1>Sauvegarde</h1><p>Toutes vos données sont enregistrées dans ce navigateur, sur cet appareil.</p></div></div>
      <div class="grid grid-2">
        <div class="card">
          <h2>⬇ Exporter</h2>
          <p class="muted">Un fichier unique contenant profil, classes, élèves (avec photos), emplois du temps, événements, documents personnalisés et évaluations. Pensez à le faire régulièrement, ou pour passer sur un autre ordinateur.</p>
          <button class="btn primary" id="exp">Télécharger ma sauvegarde</button>
        </div>
        <div class="card">
          <h2>⬆ Restaurer</h2>
          <p class="muted">Remplace les données actuelles par celles d'un fichier de sauvegarde.</p>
          <label class="btn">Choisir un fichier…<input type="file" accept=".json,application/json" id="imp" hidden></label>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h2>Contenu actuel</h2>
        <p>${st.classes.length} classe(s) · ${st.classes.reduce((n, c) => n + c.students.length, 0)} élève(s) · ${st.timetable.length} créneau(x) · ${st.team.length} collègue(s) · ${st.events.length} événement(s) · ${Object.keys(st.customDocs).length} document(s) personnalisé(s)</p>
        <button class="btn danger" id="reset">Tout effacer sur cet appareil</button>
      </div>`;
    main.querySelector('#exp').onclick = () => {
      EPS.ui.download(new Blob([S.exportAll()], { type: 'application/json' }), `eps-pro-sauvegarde-${EPS.ui.isoDate(new Date())}.json`);
    };
    main.querySelector('#imp').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!(await EPS.ui.confirm('Remplacer toutes les données actuelles par cette sauvegarde ?', { okLabel: 'Restaurer' }))) return;
      try { await S.importAll(await f.text()); EPS.ui.toast('Sauvegarde restaurée ✔'); EPS.go('#/'); } catch (err) { EPS.ui.toast(`Fichier invalide : ${err.message}`, 'err'); }
    };
    main.querySelector('#reset').onclick = async () => {
      if (!(await EPS.ui.confirm('Effacer définitivement toutes les données de cet appareil ? Exportez une sauvegarde avant.'))) return;
      await S.resetAll(); EPS.go('#/');
    };
  };
})(window.EPS);
