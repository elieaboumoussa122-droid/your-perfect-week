/* Routeur (hash) et mise en page générale. */
(function (EPS) {
  const routes = {
    '': 'home', profil: 'profile', classes: 'classes', calendrier: 'calendar', 'emploi-du-temps': 'timetable',
    equipe: 'team', ca: 'ca', evaluation: 'evaluation', sauvegarde: 'backup',
  };

  function render() {
    const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
    EPS.query = Object.fromEntries(new URLSearchParams(qs || ''));
    const parts = decodeURIComponent(path).split('/').filter(Boolean);
    const key = parts[0] || '';
    const view = EPS.views[routes[key]] || EPS.views.home;
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === (key || 'home')));
    const main = document.getElementById('main');
    main.innerHTML = '';
    window.scrollTo(0, 0);
    try { view(main, parts.slice(1)); } catch (e) { console.error(e); main.innerHTML = `<div class="card"><h2>Oups</h2><p class="muted">${EPS.ui.esc(e.message)}</p></div>`; }
    document.getElementById('sidebar').classList.remove('open');
    refreshChrome();
  }

  function refreshChrome() {
    const p = EPS.store.state.profile;
    document.getElementById('brand-school').textContent = p.school.name || 'Espace enseignant';
    document.getElementById('topbar-date').textContent = EPS.ui.longDate(new Date());
    const who = [p.firstName, p.lastName].filter(Boolean).join(' ');
    document.getElementById('sidebar-foot').innerHTML = who ? `Connecté : <strong>${EPS.ui.esc(who)}</strong><br>Données enregistrées sur cet appareil` : 'Données enregistrées sur cet appareil';
  }

  EPS.go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };
  EPS.rerender = render;

  document.getElementById('menu-btn').onclick = () => document.getElementById('sidebar').classList.toggle('open');
  window.addEventListener('hashchange', render);
  EPS.store.loadFiles().then(render);
})(window.EPS);
