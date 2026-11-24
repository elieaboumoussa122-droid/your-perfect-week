/* Routeur (hash) et mise en page générale. */
(function (EPS) {
  const routes = {
    '': 'home', profil: 'profile', classes: 'classes', calendrier: 'calendar', 'emploi-du-temps': 'timetable',
    equipe: 'team', ca: 'ca', evaluation: 'evaluation', sauvegarde: 'backup', programmation: 'programmation',
  };

  // Dans une page intégrée, l'adresse (#/...) n'est pas fiable : la route est gardée en mémoire.
  let current = EPS.ui.inFrame ? '#/' : (location.hash || '#/');
  // Historique de navigation pour le bouton « Retour »
  const stack = [];
  let goingBack = false;
  const parentOf = (h) => {
    const path = h.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
    return path.length ? `#/${path.slice(0, -1).join('/')}` : null;
  };
  function render() {
    if (!EPS.ui.inFrame) current = location.hash || '#/';
    if (goingBack) goingBack = false;
    else if (stack[stack.length - 1] !== current) stack.push(current);
    if (stack.length > 50) stack.shift();
    const back = document.getElementById('back-btn');
    const target = stack.length > 1 ? stack[stack.length - 2] : parentOf(current);
    back.hidden = !target;
    const [path, qs] = current.replace(/^#\/?/, '').split('?');
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

  EPS.go = (hash) => {
    if (EPS.ui.inFrame) { current = hash; render(); return; }
    if (location.hash === hash) render(); else location.hash = hash;
  };
  if (EPS.ui.inFrame) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#/"], a[href="#"]');
      if (!a) return;
      e.preventDefault();
      EPS.go(a.getAttribute('href'));
    });
  }
  EPS.back = () => {
    let target;
    if (stack.length > 1) { stack.pop(); target = stack[stack.length - 1]; } else { target = parentOf(current); stack.pop(); }
    if (!target) return;
    if (stack[stack.length - 1] !== target) stack.push(target);
    goingBack = true;
    EPS.go(target);
  };
  document.getElementById('back-btn').onclick = () => EPS.back();
  EPS.rerender = render;

  document.getElementById('menu-btn').onclick = () => document.getElementById('sidebar').classList.toggle('open');
  if (!EPS.ui.inFrame) window.addEventListener('hashchange', render);
  EPS.store.loadFiles().then(render);
})(window.EPS);
