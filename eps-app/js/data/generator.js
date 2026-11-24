/* Générateur de documents pédagogiques : plan de séquence, plans de séance, fiche d'évaluation.
   Mise en forme inspirée du modèle de programmation fourni (tableau de synthèse + progression séance par séance). */
(function (EPS) {
  const { esc } = EPS.ui;

  /* ---------- Trames génériques par CA (activités sans contenu détaillé) ---------- */
  const GENERIC = {
    CA1: [
      { titre: 'Découvrir les techniques de base', objectif: 'Identifier les éléments techniques essentiels de l\'activité.', contenus: ['Règles et formes de pratique', 'Gestes techniques fondamentaux'] },
      { titre: 'Produire une performance', objectif: 'Coordonner les actions pour aller plus vite / plus loin / plus haut.', contenus: ['Enchaîner les actions motrices', 'Repères de réussite'] },
      { titre: 'S\'entraîner et progresser', objectif: 'Répéter avec des repères pour stabiliser ses progrès.', contenus: ['Volume et répétitions', 'Récupération'] },
      { titre: 'Construire son projet de performance', objectif: 'Prévoir sa performance et analyser l\'écart.', contenus: ['Projet annoncé', 'Analyse des résultats'] },
    ],
    CA2: [
      { titre: 'Connaître le milieu et la sécurité', objectif: 'Identifier les règles de sécurité propres au milieu.', contenus: ['Règles de sécurité', 'Matériel et vérifications'] },
      { titre: 'Se déplacer efficacement', objectif: 'Construire une motricité adaptée au milieu.', contenus: ['Techniques de déplacement', 'Économie d\'effort'] },
      { titre: 'Choisir son itinéraire', objectif: 'Lire le milieu et choisir un itinéraire adapté à ses ressources.', contenus: ['Lecture du milieu', 'Choix argumenté'] },
      { titre: 'Gérer ses ressources', objectif: 'Réaliser un parcours complet en sécurité.', contenus: ['Gestion de l\'effort', 'Entraide et sécurité collective'] },
    ],
    CA3: [
      { titre: 'Explorer', objectif: 'Explorer les possibilités motrices et expressives.', contenus: ['Espace, temps, énergie', 'Formes corporelles'] },
      { titre: 'Construire des éléments', objectif: 'Stabiliser des éléments ou figures de référence.', contenus: ['Exécution', 'Sécurité et parade'] },
      { titre: 'Composer', objectif: 'Organiser les éléments en un enchaînement.', contenus: ['Procédés de composition', 'Début, fin, liaisons'] },
      { titre: 'Présenter et apprécier', objectif: 'Se produire devant les autres et juger avec des critères.', contenus: ['Interprétation', 'Rôle de juge / spectateur'] },
    ],
    CA4: [
      { titre: 'Conserver et progresser', objectif: 'Faire progresser l\'engin / se placer pour attaquer.', contenus: ['Conservation', 'Progression vers la cible'] },
      { titre: 'Marquer en situation favorable', objectif: 'Identifier et exploiter les situations favorables de marque.', contenus: ['Lecture du rapport de force', 'Action décisive'] },
      { titre: 'Défendre', objectif: 'Empêcher l\'adversaire de marquer et récupérer.', contenus: ['Placement défensif', 'Récupération'] },
      { titre: 'Gérer le rapport de force', objectif: 'Adapter son plan de jeu à l\'adversaire.', contenus: ['Analyse du score', 'Plan de jeu, coaching'] },
    ],
    CA5: [
      { titre: 'Connaître ses ressources', objectif: 'Évaluer ses capacités et identifier ses besoins.', contenus: ['Tests', 'Ressentis'] },
      { titre: 'Choisir ses paramètres', objectif: 'Relier le mobile choisi aux paramètres d\'entraînement.', contenus: ['Intensité, durée, récupération', 'Sécurité'] },
      { titre: 'Planifier et réguler', objectif: 'Concevoir sa séance et l\'ajuster.', contenus: ['Carnet d\'entraînement', 'Analyse des effets'] },
    ],
  };
  const GENERIC_SECURITE = ['Échauffement adapté à l\'activité', 'Espaces de pratique délimités', 'Vérification du matériel', 'Hydratation planifiée'];
  const GENERIC_ROLES = { CA1: ['Chronométreur', 'Juge', 'Secrétaire'], CA2: ['Assureur / contrôleur', 'Observateur'], CA3: ['Juge', 'Spectateur', 'Pareur'], CA4: ['Arbitre', 'Observateur', 'Coach'], CA5: ['Coach', 'Observateur', 'Pareur'] };

  function genericSituation(a, et, i) {
    return {
      nom: `${et.titre} — situation ${i + 1}`,
      but: et.objectif,
      organisation: 'Groupes de niveau homogène, espace délimité, rotation des rôles.',
      consignes: `À compléter : consignes spécifiques en ${a.nom}.`,
      criteres: 'À compléter : critère de réussite observable (ex. 3 réussites sur 5).',
      simplifier: 'Réduire la distance / la vitesse / le nombre d\'adversaires.',
      complexifier: 'Ajouter une contrainte de temps, d\'espace ou d\'opposition.',
    };
  }

  /** Activité complétée : contenus génériques si nécessaire, paramètres résolus pour le niveau. */
  function resolve(activity, level) {
    const cycle = EPS.store.cycleOf(level);
    const p = (activity.params && activity.params[level]) || {};
    const fill = (s) => String(s ?? '').replace(/\{(\w+)\}/g, (m, k) => (p[k] !== undefined ? p[k] : m));
    const ca = EPS.prog.caById(activity.ca);
    const rich = !!activity.rich;
    const etapes = rich ? activity.etapes : GENERIC[activity.ca].map((et) => ({ ...et, situations: [genericSituation(activity, et, 0), genericSituation(activity, et, 1)] }));
    const afc = ca.afc[cycle] || [];
    const evaluation = (activity.evaluation && activity.evaluation[cycle])
      || (cycle === 'ly'
        ? afc.slice(0, 3).map((t, i) => ({ afl: `AFL${i + 1}`, points: i === 0 ? 12 : 4, critere: t.replace(/^AFL\d — /, ''), degres: EPS.prog.DEGRES }))
        : afc.slice(0, 4).map((t) => ({ critere: t, degres: EPS.prog.DEGRES })));
    const deep = (o) => JSON.parse(JSON.stringify(o), (k, v) => (typeof v === 'string' ? fill(v) : v));
    return {
      ...activity, rich, cycle, ca, afc,
      objet: fill(activity.objet || `Pratiquer ${activity.nom.toLowerCase()} en réalisant les attendus du ${ca.id} : ${ca.titre.toLowerCase()}.`),
      materiel: deep(activity.materiel || ['Matériel spécifique à l\'activité', 'Chasubles, plots', 'Fiches d\'observation']),
      securite: deep(activity.securite || GENERIC_SECURITE),
      roles: deep(activity.roles || GENERIC_ROLES[activity.ca]),
      echauffement: deep(activity.echauffement || ['Mise en train progressive (5 min)', 'Mobilisation articulaire', 'Éducatifs spécifiques à l\'activité']),
      etapes: deep(etapes),
      reference: fill((activity.reference && activity.reference[cycle]) || `Situation de référence en ${activity.nom.toLowerCase()} adaptée au niveau ${level} (à préciser).`),
      evaluation: deep(evaluation),
    };
  }

  /** Découpage du temps d'une séance. */
  function timing(D) {
    const accueil = D >= 80 ? 5 : 3;
    const ech = Math.max(8, Math.min(20, Math.round(D * 0.14)));
    const bilan = D >= 80 ? 10 : 5;
    const rest = D - accueil - ech - bilan;
    const s1 = Math.round(rest * 0.35), s2 = Math.round(rest * 0.3);
    return { accueil, ech, s1, s2, ref: rest - s1 - s2, bilan };
  }

  /** Plan des N séances : phase, étape travaillée, objectif. */
  function plan(r, N) {
    const out = [];
    const M = Math.max(1, N - 3);
    const E = r.etapes.length;
    for (let k = 1; k <= N; k++) {
      if (k === 1) out.push({ k, phase: 'Évaluation diagnostique', objectif: 'Situer le niveau initial de chaque élève, présenter la séquence et constituer les groupes.', kind: 'diag' });
      else if (k === N) out.push({ k, phase: 'Évaluation finale', objectif: 'Évaluer les acquis dans la situation de référence et faire le bilan de la séquence.', kind: 'final' });
      else if (k === N - 1 && N >= 4) out.push({ k, phase: 'Consolidation / pré-évaluation', objectif: 'Stabiliser les acquis et se tester en conditions d\'évaluation.', kind: 'conso' });
      else {
        const idx = Math.min(E - 1, Math.floor(((k - 2) * E) / M));
        const prevIdx = k > 2 ? Math.min(E - 1, Math.floor(((k - 3) * E) / M)) : -1;
        const et = r.etapes[idx];
        out.push({ k, phase: `Apprentissage — ${et.titre}`, objectif: et.objectif, kind: 'learn', etape: et, repeat: prevIdx === idx });
      }
    }
    return out;
  }

  const list = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const blankDate = '__ / __ / ____';

  function header(r, level, opts, title) {
    const pr = EPS.store.state.profile;
    const teacher = [pr.civilite, pr.firstName, pr.lastName].filter(Boolean).join(' ');
    return `
      ${r.rich ? '' : '<div class="generic-banner no-print">Trame générique : les situations de cette activité sont à compléter. Cliquez sur « Personnaliser » pour écrire directement dans le document.</div>'}
      <h1>${esc(title)} — ${esc(r.nom)}</h1>
      <div class="doc-sub">${esc(r.ca.id)} : ${esc(r.ca.titre)}</div>
      <div class="doc-meta">Classe de ${esc(opts.className || level)} · ${esc(EPS.prog.CYCLE_LABEL[r.cycle])} · Un cycle de ${opts.sessions} séances de ${opts.minutes} minutes
        ${pr.school.name ? ` · ${esc(pr.school.name)}` : ''}${teacher ? ` · ${esc(teacher)}` : ''}${opts.year ? ` · Année scolaire ${esc(opts.year)}` : ''}</div>`;
  }

  function sequence(activity, level, opts) {
    const r = resolve(activity, level);
    const P = plan(r, opts.sessions);
    const dates = opts.dates || [];
    const socle = r.cycle === 'ly' ? EPS.prog.OG_LYCEE : EPS.prog.SOCLE;
    const html = `
      ${header(r, level, opts, 'Plan de séquence')}
      <table>
        <thead><tr><th class="title" colspan="7">${esc(r.nom.toUpperCase())} — ${esc(level)}</th></tr>
        <tr><th>APSA / volume</th><th>Objet d'enseignement</th><th>Objectifs / apprentissages</th><th>Organisation</th><th>Supports et matériel</th><th>Compétences visées</th><th>Évaluation</th></tr></thead>
        <tbody><tr>
          <td><strong>${esc(r.nom)}</strong><br>${opts.sessions} séances de ${opts.minutes} min<br><br><strong>Dates :</strong><br>du ${esc(dates[0] || blankDate)}<br>au ${esc(dates[opts.sessions - 1] || blankDate)}</td>
          <td>${esc(r.objet)}</td>
          <td>${list(r.etapes.map((e) => `${e.titre} : ${e.objectif}`))}</td>
          <td>Groupes de niveau ou hétérogènes selon les situations. Rôles tournants : ${esc(r.roles.join(', '))}.</td>
          <td>${list(r.materiel)}</td>
          <td>${list(r.afc)}</td>
          <td><strong>Séance 1 :</strong> évaluation diagnostique.<br><strong>Séance ${opts.sessions} :</strong> ${esc(r.reference)}</td>
        </tr></tbody>
      </table>

      <h2>Progression des ${opts.sessions} séances</h2>
      <table>
        <thead><tr><th>Séance</th><th>Date</th><th>Phase</th><th>Objectif de la séance</th><th>Contenus / situations</th><th>Critères de réussite</th><th>Traces produites</th></tr></thead>
        <tbody>${P.map((s) => {
          let contenu, crit, traces;
          if (s.kind === 'diag') { contenu = `Présentation de l'activité et des règles de sécurité ; situation de référence : ${r.reference}`; crit = 'Relevé des performances / comportements initiaux.'; traces = 'Fiche d\'évaluation diagnostique'; }
          else if (s.kind === 'final') { contenu = `Situation de référence : ${r.reference} Bilan collectif et auto-évaluation.`; crit = r.evaluation.map((e) => e.critere).join(' ; '); traces = 'Fiche d\'évaluation finale ; auto-évaluation'; }
          else if (s.kind === 'conso') { contenu = 'Rappel des contenus clés ; situation de référence en conditions réelles ; rôles d\'évaluateur.'; crit = 'Comparaison avec l\'évaluation diagnostique.'; traces = 'Fiche d\'auto-évaluation'; }
          else { const sit = s.etape.situations[s.repeat ? 1 % s.etape.situations.length : 0]; contenu = `${s.etape.contenus.join(' ; ')}. Situation : « ${sit.nom} »${s.repeat ? ' (complexifiée)' : ''}.`; crit = sit.criteres; traces = 'Fiche d\'observation / carnet de bord'; }
          return `<tr><td><strong>S${s.k}</strong></td><td>${esc(dates[s.k - 1] || blankDate)}</td><td>${esc(s.phase)}</td><td>${esc(s.objectif)}</td><td>${esc(contenu)}</td><td>${esc(crit)}</td><td>${esc(traces)}</td></tr>`;
        }).join('')}</tbody>
      </table>

      <div class="grid grid-2" style="gap:14px">
        <div><h2>${r.cycle === 'ly' ? 'Attendus de fin de lycée' : 'Attendus de fin de cycle'}</h2>${list(r.afc)}</div>
        <div><h2>${r.cycle === 'ly' ? 'Objectifs généraux' : 'Domaines du socle'}</h2>${list(socle)}</div>
        <div><h2>Sécurité</h2>${list(r.securite)}</div>
        <div><h2>Rôles sociaux</h2>${list(r.roles)}</div>
      </div>
      <p class="note">Différenciation : groupes de besoin, variables « simplifier / complexifier » dans chaque plan de séance. Élèves inaptes partiels : adaptation des situations ou attribution de rôles (observateur, juge, chronométreur).</p>
      <p class="note">Le plan de séquence et les ${opts.sessions} plans de séance détaillent chaque étape.</p>`;
    return { html, resolved: r, plan: P };
  }

  function sessions(activity, level, opts) {
    const r = resolve(activity, level);
    const P = plan(r, opts.sessions);
    const t = timing(opts.minutes);
    const dates = opts.dates || [];
    const row = (moment, duree, sit, consignes, crit, vars) => `<tr><td class="moment">${esc(moment)}</td><td>${duree} min</td><td>${sit}</td><td>${esc(consignes)}</td><td>${esc(crit)}</td><td>${vars}</td></tr>`;
    const sitCell = (s) => `<strong>${esc(s.nom)}</strong><br><em>But :</em> ${esc(s.but)}<br><em>Organisation :</em> ${esc(s.organisation)}`;
    const varCell = (s, harder) => `<em>−</em> ${esc(s.simplifier)}<br><em>+</em> ${esc(s.complexifier)}${harder ? '<br><strong>Cette séance : version complexifiée.</strong>' : ''}`;
    const refSit = { nom: 'Situation de référence', but: r.reference, organisation: 'Groupes, rôles attribués (voir fiche).', consignes: 'Respecter les conditions de l\'évaluation.', criteres: r.evaluation.map((e) => e.critere).join(' ; '), simplifier: 'Aménagements pour les élèves en difficulté / inaptes partiels.', complexifier: 'Contraintes supplémentaires pour les plus avancés.' };

    return P.map((s, i) => {
      let rows = row('Accueil', t.accueil, 'Appel, tenue, présentation de l\'objectif de la séance.', 'Annoncer l\'objectif et les critères de réussite.', 'Élèves en tenue, à l\'écoute.', '—');
      rows += row('Échauffement', t.ech, list(r.echauffement), 'Progressivité, échauffement conduit par les élèves en fin de cycle.', 'Échauffement complet et adapté.', '—');
      if (s.kind === 'learn') {
        const sits = s.etape.situations;
        const a = sits[s.repeat ? 1 % sits.length : 0];
        const b = sits.length > 1 ? sits[s.repeat ? 0 : 1] : null;
        rows += row('Situation 1', t.s1, sitCell(a), a.consignes, a.criteres, varCell(a, s.repeat));
        if (b) rows += row('Situation 2', t.s2, sitCell(b), b.consignes, b.criteres, varCell(b, false));
        else rows += row('Situation 2', t.s2, `<strong>Ateliers de remédiation</strong><br>Groupes de besoin autour de : ${esc(s.etape.contenus.join(', '))}.`, 'Chaque groupe travaille son point faible identifié.', 'Progrès visible sur le critère travaillé.', varCell(a, false));
        rows += row('Situation de référence', t.ref, sitCell(refSit), 'Réinvestir les contenus de la séance.', refSit.criteres, varCell(refSit, false));
      } else {
        const label = s.kind === 'diag' ? 'Évaluation diagnostique' : s.kind === 'final' ? 'Évaluation finale' : 'Pré-évaluation';
        rows += row('Présentation', t.s1, `<strong>${esc(label)}</strong><br>${s.kind === 'diag' ? 'Présentation de la séquence, des règles de sécurité et des rôles.' : 'Rappel des critères d\'évaluation et des rôles.'}`, 'Expliquer les conditions de l\'épreuve.', 'Chacun connaît son rôle et son ordre de passage.', '—');
        rows += row(label, t.s2 + t.ref, sitCell(refSit), refSit.consignes, refSit.criteres, varCell(refSit, false));
      }
      rows += row('Retour au calme et bilan', t.bilan, 'Étirements légers, bilan collectif, rangement du matériel.', 'Chaque élève formule ce qu\'il a appris.', 'Bilan oral ou écrit (carnet de bord).', '—');
      return `
        <div class="${i ? 'page-break' : ''}" style="margin-top:${i ? '28px' : '0'}">
          ${i === 0 ? header(r, level, opts, 'Plans de séance') : ''}
          <table>
            <thead><tr><th class="title" colspan="6">SÉANCE ${s.k} / ${opts.sessions} — ${esc(s.phase)}</th></tr>
            <tr><td colspan="6"><strong>Date :</strong> ${esc(dates[i] || blankDate)} &nbsp;·&nbsp; <strong>Classe :</strong> ${esc(opts.className || level)} &nbsp;·&nbsp; <strong>Durée :</strong> ${opts.minutes} min &nbsp;·&nbsp; <strong>Objectif :</strong> ${esc(s.objectif)}</td></tr>
            <tr><th>Moment</th><th>Durée</th><th>Situation et organisation</th><th>Consignes</th><th>Critères de réussite</th><th>Variables (− / +)</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="note"><strong>Sécurité :</strong> ${esc(r.securite.join(' ; '))}. <strong>Rôles :</strong> ${esc(r.roles.join(', '))}.</p>
        </div>`;
    });
  }

  function evaluationSheet(activity, level, opts = {}) {
    const r = resolve(activity, level);
    const ly = r.cycle === 'ly';
    const total = ly ? r.evaluation.reduce((s, e) => s + (e.points || 0), 0) : 0;
    const html = `
      ${header(r, level, { ...opts, sessions: opts.sessions || 8, minutes: opts.minutes || 110 }, 'Fiche d\'évaluation')}
      <table><tbody><tr><th style="width:24%">Situation d'évaluation</th><td>${esc(r.reference)}</td></tr>
      <tr><th>Rôles</th><td>${esc(r.roles.join(', '))}</td></tr></tbody></table>
      <table>
        <thead><tr><th>${ly ? 'AFL' : 'Élément évalué'}</th>${ly ? '<th>Points</th>' : ''}${EPS.prog.DEGRES.map((d, i) => `<th>Degré ${i + 1}<br><span style="font-weight:400">${esc(d)}</span></th>`).join('')}</tr></thead>
        <tbody>${r.evaluation.map((e) => `<tr><td><strong>${ly ? esc(e.afl) + ' — ' : ''}${esc(e.critere)}</strong></td>${ly ? `<td>/${e.points}</td>` : ''}${e.degres.map((d) => `<td>${esc(d)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      ${ly ? `<p class="note">Barème indicatif sur ${total} points (AFL1 sur 12, autres AFL sur 8 au total). Répartition des points AFL2/AFL3 à adapter selon le choix de l'élève (référentiel de l'établissement).</p>` : '<p class="note">Positionnement sur 4 degrés d\'acquisition (socle commun). Un barème chiffré peut être défini par l\'équipe EPS.</p>'}`;
    return { html, resolved: r };
  }

  EPS.gen = { resolve, sequence, sessions, evaluationSheet, timing, plan };
})(window.EPS);
