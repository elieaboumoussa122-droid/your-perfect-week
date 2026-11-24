/* Activités physiques, sportives et artistiques (APSA) par champ d'apprentissage.
   - « rich » : contenus détaillés (étapes, situations, évaluation) adaptés par niveau via {paramètres}.
   - les autres activités utilisent la trame générique du CA (generator.js), à personnaliser.
   Tous les textes sont modifiables dans l'application (bouton « Personnaliser »). */
(function (EPS) {
  const COL = ['6e', '5e', '4e', '3e'];
  const LY = ['2nde', '1re', 'Tle'];
  const ALL = [...COL, ...LY];

  const A = [];
  const add = (o) => A.push({ levels: o.ca === 'CA5' ? LY : ALL, ...o });

  /* =========================== CA1 =========================== */
  add({
    id: 'vitesse', nom: 'Course de vitesse', ca: 'CA1', rich: true, icon: '⚡',
    params: {
      '6e': { dist: '30 m', ref: '2 × 30 m départ debout', ecart: '1 m' },
      '5e': { dist: '40 m', ref: '2 × 40 m départ 3 appuis', ecart: '1,5 m' },
      '4e': { dist: '50 m', ref: '2 × 50 m départ en starting-blocks', ecart: '2 m' },
      '3e': { dist: '60 m', ref: '2 × 60 m départ en starting-blocks', ecart: '2 m' },
      '2nde': { dist: '60 m', ref: '3 × 60 m (prévoir sa performance)', ecart: '2 m' },
      '1re': { dist: '80 m', ref: '3 × 80 m (prévoir sa performance)', ecart: '2 m' },
      Tle: { dist: '80 m', ref: '3 × 80 m (prévoir sa performance)', ecart: '2 m' },
    },
    objet: 'Courir le plus vite possible sur {dist} en réagissant rapidement au signal de départ, en accélérant sans se relever trop tôt et en maintenant sa vitesse jusqu\'après la ligne d\'arrivée.',
    materiel: ['Plots et lattes', 'Chronomètres (1 pour 2 élèves)', 'Starting-blocks (à partir de la 4e)', 'Sifflet / claquoir', 'Fiches d\'observation et de résultats', 'Tablette pour la vidéo (facultatif)'],
    securite: ['Couloirs bien délimités et zone de décélération d\'au moins 20 m', 'Échauffement progressif des ischio-jambiers avant tout sprint', 'Pas de course à contresens pendant les départs', 'Sol sec et chaussures adaptées'],
    roles: ['Starter', 'Chronométreur', 'Juge d\'arrivée', 'Observateur (fiche critères)', 'Secrétaire'],
    echauffement: ['Footing 5 min + mobilisation articulaire (chevilles, genoux, hanches)', 'Gammes athlétiques : montées de genoux, talons-fesses, pas chassés, foulées bondissantes', '3 accélérations progressives sur {dist} (50 %, 70 %, 90 %)'],
    etapes: [
      { titre: 'Réagir au signal', objectif: 'Réduire le temps de réaction et partir dans l\'axe.',
        contenus: ['Attention dirigée vers le signal', 'Poussée simultanée des deux jambes', 'Premiers appuis courts et rapides, buste incliné'],
        situations: [
          { nom: 'Le jeu du béret-sprint', but: 'Partir le premier au signal sonore ou visuel.', organisation: 'Binômes face à face, 2 lignes à 10 m, départs variés (assis, couché, dos tourné).', consignes: 'Partir au signal et non à l\'anticipation ; courir jusqu\'au plot.', criteres: 'Arriver le premier 3 fois sur 5.', simplifier: 'Signal visuel, départ debout.', complexifier: 'Signal aléatoire (« ta »/« to »), départ couché.' },
          { nom: 'Départs à l\'aveugle', but: 'Améliorer la réaction au seul signal auditif.', organisation: 'Groupes de 4, départ sur 10 m, yeux fermés au départ.', consignes: 'Position de départ immobile, partir au claquement.', criteres: 'Aucun faux départ ; 1er appui dans l\'axe.', simplifier: 'Distance réduite à 5 m.', complexifier: 'Varier les délais entre « prêt » et le signal.' },
        ] },
      { titre: 'Accélérer', objectif: 'Construire une mise en action progressive (redressement du buste) sur les 15 à 20 premiers mètres.',
        contenus: ['Pousser loin derrière soi', 'Augmenter progressivement l\'amplitude', 'Se redresser progressivement'],
        situations: [
          { nom: 'Les lattes d\'accélération', but: 'Allonger progressivement les foulées.', organisation: '8 lattes espacées de façon croissante (de 3 à 6 pieds).', consignes: 'Un appui entre chaque latte, sans regarder ses pieds.', criteres: 'Toutes les lattes franchies sans piétiner ni bondir.', simplifier: 'Espacements réduits.', complexifier: 'Départ 3 appuis ou en blocks.' },
          { nom: 'Le chat et la souris', but: 'Rattraper un camarade parti avec un handicap.', organisation: 'Binômes, la souris part {ecart} devant, zone de 20 m.', consignes: 'Le chat accélère sans se relever trop vite.', criteres: 'Rattraper la souris avant la ligne 3 fois sur 5.', simplifier: 'Augmenter la distance de poursuite.', complexifier: 'Augmenter l\'écart de départ.' },
        ] },
      { titre: 'Maintenir sa vitesse', objectif: 'Courir relâché, en fréquence, sans freiner avant la ligne.',
        contenus: ['Pose de pied active sous le bassin (griffé)', 'Bras actifs d\'avant en arrière, épaules relâchées', 'Regard loin devant'],
        situations: [
          { nom: 'Le sprint « lancé »', but: 'Atteindre sa vitesse maximale dans une zone chronométrée.', organisation: '15 m d\'élan + zone de 20 m chronométrée.', consignes: 'Arriver lancé dans la zone, rester relâché.', criteres: 'Temps sur 20 m lancé amélioré ou stabilisé.', simplifier: 'Zone de 10 m.', complexifier: 'Zone de 30 m.' },
          { nom: 'Le duel de couloir', but: 'Battre un adversaire de niveau proche sur {dist}.', organisation: 'Poules de niveau, départ simultané.', consignes: 'Courir jusqu\'à 5 m après la ligne.', criteres: 'Gagner ou perdre de moins de 1 m.', simplifier: 'Handicap de départ.', complexifier: 'Départ en blocks.' },
        ] },
      { titre: 'Finir et franchir la ligne', objectif: 'Ne pas ralentir avant l\'arrivée et « casser » la ligne.',
        contenus: ['Fixer un repère 5 m après la ligne', 'Engager le buste en franchissant la ligne'],
        situations: [
          { nom: 'La ligne mobile', but: 'Courir au-delà de la ligne d\'arrivée.', organisation: 'Ligne à {dist} et plot 5 m plus loin.', consignes: 'Ralentir seulement après le plot.', criteres: 'Vitesse maintenue jusqu\'au plot (observateur).', simplifier: 'Plot à 3 m.', complexifier: 'Finir par un « casser » du buste.' },
        ] },
    ],
    reference: {
      c3: '{ref} chronométrés ; la meilleure performance est retenue. Rôles de starter et chronométreur assumés.',
      c4: '{ref} : meilleure performance + indice d\'efficacité du départ (observateur). Rôles de starter, chronométreur et juge.',
      ly: '{ref} : performance, régularité et projet de performance annoncé avant la course (écart prévu/réalisé).',
    },
    evaluation: {
      c3: [
        { critere: 'Performance sur {dist}', degres: ['Temps très éloigné de la référence', 'Temps proche de la référence', 'Temps atteint', 'Temps dépassé'] },
        { critere: 'Réaction et départ', degres: ['Départ tardif ou déséquilibré', 'Départ dans l\'axe mais lent', 'Départ rapide et équilibré', 'Départ explosif et dans l\'axe'] },
        { critere: 'Rôles (starter / chronométreur)', degres: ['Ne tient pas le rôle', 'Tient le rôle avec aide', 'Tient le rôle seul', 'Tient le rôle et conseille'] },
      ],
      c4: [
        { critere: 'Performance sur {dist} (barème établissement)', degres: ['< barème 1', 'Barème 1–2', 'Barème 3', 'Barème 4'] },
        { critere: 'Efficacité du départ et de l\'accélération', degres: ['Se relève immédiatement', 'Accélération courte', 'Redressement progressif', 'Accélération longue et efficace'] },
        { critere: 'Maintien de la vitesse et arrivée', degres: ['Ralentit avant la ligne', 'Crispation en fin de course', 'Maintien jusqu\'à la ligne', 'Course relâchée, franchit la ligne'] },
        { critere: 'Rôles sociaux et échauffement', degres: ['Absents', 'Partiels', 'Assurés', 'Assurés avec autonomie et conseils'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Performance et écart au projet annoncé', degres: ['Performance faible, projet non tenu', 'Performance moyenne, écart important', 'Bonne performance, écart réduit', 'Très bonne performance, projet tenu'] },
        { afl: 'AFL2', points: 4, critere: 'Mobilisation des techniques efficaces', degres: ['Techniques inefficaces', 'Quelques éléments efficaces', 'Techniques efficaces', 'Techniques optimisées'] },
        { afl: 'AFL3', points: 4, critere: 'Analyse de sa performance', degres: ['Pas d\'analyse', 'Analyse partielle', 'Analyse pertinente', 'Analyse et régulation du projet'] },
      ],
    },
  });

  add({
    id: 'demi-fond', nom: 'Course de demi-fond', ca: 'CA1', rich: true, icon: '⏱',
    params: {
      '6e': { ref: '3 × 400 m à allure régulière (récupération 3 min)', dist: '400 m' },
      '5e': { ref: '3 × 500 m à allure annoncée (récupération 3 min)', dist: '500 m' },
      '4e': { ref: '3 × 500 m à allures différenciées', dist: '500 m' },
      '3e': { ref: '3 × 500 m dont un à VMA', dist: '500 m' },
      '2nde': { ref: '3 × 500 m, projet d\'allures, récupération 4 min', dist: '500 m' },
      '1re': { ref: '3 × 600 m, projet d\'allures', dist: '600 m' },
      Tle: { ref: '3 × 500 m chronométrés (épreuve type bac)', dist: '500 m' },
    },
    objet: 'Courir à une allure choisie et régulière sur {dist}, en s\'appuyant sur des repères de temps, de distance et de ressentis, pour réaliser sa meilleure performance.',
    materiel: ['Plots tous les 25 ou 50 m', 'Chronomètres', 'Sifflet (signaux de passage)', 'Fiches de suivi des allures', 'Tableau de VMA'],
    securite: ['Évaluer la VMA avant de fixer les allures', 'Hydratation entre les répétitions', 'Adapter pour les élèves asthmatiques (PAI)', 'Pas de course en cas de forte chaleur sans aménagement'],
    roles: ['Coach (annonce les temps de passage)', 'Chronométreur', 'Secrétaire (relevé des temps)'],
    echauffement: ['Footing 6 min en aisance respiratoire', 'Gammes et mobilisations', '2 lignes droites progressives'],
    etapes: [
      { titre: 'Connaître sa VMA', objectif: 'Déterminer sa vitesse maximale aérobie et ses allures de travail.',
        contenus: ['Test de VMA (demi-Cooper ou VAMEVAL)', 'Calcul des allures en % de VMA'],
        situations: [{ nom: 'Le demi-Cooper', but: 'Parcourir la plus grande distance en 6 min.', organisation: 'Piste balisée tous les 25 m, binômes coureur/compteur.', consignes: 'Courir le plus loin possible sans s\'arrêter.', criteres: 'Distance relevée ; VMA = distance / 100.', simplifier: 'Marche autorisée.', complexifier: 'Annoncer sa distance avant le test.' }] },
      { titre: 'Courir régulier', objectif: 'Tenir une allure constante grâce aux repères de passage.',
        contenus: ['Repères sonores tous les 50 m', 'Ressenti respiratoire', 'Foulée économique'],
        situations: [{ nom: 'Le train des allures', but: 'Arriver au plot au coup de sifflet.', organisation: 'Plots tous les 50 m, sifflet selon l\'allure du groupe.', consignes: 'Ni en avance ni en retard au plot.', criteres: '4 passages sur 5 dans un écart de 2 s.', simplifier: 'Plots plus rapprochés.', complexifier: 'Supprimer le sifflet en fin de course.' }] },
      { titre: 'Gérer l\'effort fractionné', objectif: 'Enchaîner des efforts et récupérer activement.',
        contenus: ['Travail intermittent 30/30', 'Récupération active', 'Fréquence cardiaque'],
        situations: [{ nom: 'Le 30/30 aller-retour', but: 'Courir 30 s à 100 % VMA et récupérer 30 s.', organisation: 'Plots individualisés selon la VMA.', consignes: 'Atteindre son plot à chaque répétition.', criteres: '8 répétitions réussies sur 10.', simplifier: '15/15.', complexifier: '45/15.' }] },
      { titre: 'Construire son projet', objectif: 'Choisir et annoncer ses allures pour l\'épreuve finale.',
        contenus: ['Prévoir son temps', 'Analyser l\'écart prévu/réalisé'],
        situations: [{ nom: 'Le contrat-temps', but: 'Réaliser le temps annoncé à ± 3 s.', organisation: 'Binômes coureur/coach, fiche projet.', consignes: 'Le coach annonce les temps de passage.', criteres: 'Écart < 3 s sur chaque course.', simplifier: 'Écart toléré de 5 s.', complexifier: 'Allures différentes sur chaque course.' }] },
    ],
    reference: { c3: '{ref}', c4: '{ref} ; projet de temps annoncé et rôle de coach.', ly: '{ref} ; performance cumulée, respect du projet et analyse.' },
    evaluation: {
      c3: [
        { critere: 'Régularité de l\'allure', degres: ['Écarts > 10 s', 'Écarts de 6 à 10 s', 'Écarts de 3 à 5 s', 'Écarts < 3 s'] },
        { critere: 'Engagement dans l\'effort', degres: ['S\'arrête', 'Court en aisance sans engagement', 'Engagé sur toutes les courses', 'Engagé et gère sa récupération'] },
        { critere: 'Rôle de chronométreur / coach', degres: ['Absent', 'Avec aide', 'Autonome', 'Autonome et conseille'] },
      ],
      c4: [
        { critere: 'Performance cumulée (barème VMA)', degres: ['< 70 % de la cible', '70–85 %', '85–100 %', 'Cible dépassée'] },
        { critere: 'Respect du projet d\'allure', degres: ['Écarts > 8 s', '5–8 s', '2–4 s', '< 2 s'] },
        { critere: 'Coach : annonces et conseils', degres: ['Absent', 'Annonce les temps', 'Annonce et encourage', 'Annonce, analyse et conseille'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Performance cumulée et respect du projet', degres: ['Faible / projet non tenu', 'Moyenne / écarts importants', 'Bonne / écarts réduits', 'Très bonne / projet tenu'] },
        { afl: 'AFL2', points: 4, critere: 'Utilisation des repères (temps, ressentis)', degres: ['Aucun repère', 'Repères extérieurs seulement', 'Repères internes et externes', 'Régulation fine en course'] },
        { afl: 'AFL3', points: 4, critere: 'Analyse et ajustement du projet', degres: ['Pas d\'analyse', 'Constat simple', 'Analyse pertinente', 'Ajustement argumenté'] },
      ],
    },
  });

  add({
    id: 'longueur', nom: 'Saut en longueur', ca: 'CA1', rich: true, icon: '🦘',
    params: {
      '6e': { elan: '8 à 10 foulées', zone: 'zone d\'appel de 50 cm' }, '5e': { elan: '10 foulées', zone: 'zone d\'appel de 40 cm' },
      '4e': { elan: '10 à 12 foulées', zone: 'zone d\'appel de 30 cm' }, '3e': { elan: '12 foulées', zone: 'planche ou zone de 20 cm' },
      '2nde': { elan: '12 à 14 foulées', zone: 'planche' }, '1re': { elan: '14 foulées', zone: 'planche' }, Tle: { elan: '14 à 16 foulées', zone: 'planche' },
    },
    objet: 'Sauter le plus loin possible après une course d\'élan étalonnée de {elan}, en enchaînant course, impulsion d\'un pied dans une {zone} et réception équilibrée.',
    materiel: ['Fosse de sable ratissée', 'Décamètres', 'Plots de marque d\'élan', 'Râteaux', 'Fiche de concours'],
    securite: ['Fosse bêchée et sans objets', 'Un seul sauteur à la fois, râteaux hors de la zone', 'Réception sur deux pieds, chute vers l\'avant'],
    roles: ['Juge de planche', 'Mesureur', 'Râteleur', 'Secrétaire'],
    echauffement: ['Footing + gammes', 'Foulées bondissantes et multibonds', 'Sauts à cloche-pied'],
    etapes: [
      { titre: 'Impulser vers le haut et l\'avant', objectif: 'Coordonner impulsion d\'un pied et action du genou libre.',
        contenus: ['Pied d\'appel à plat, actif', 'Monter le genou libre et les bras'],
        situations: [{ nom: 'Le saut à l\'élastique', but: 'Passer au-dessus d\'un élastique placé à 1 m de l\'appel.', organisation: 'Élan réduit de 6 foulées.', consignes: 'Monter le genou libre.', criteres: 'Franchir l\'élastique sans le toucher.', simplifier: 'Élastique bas.', complexifier: 'Élastique plus haut et plus loin.' }] },
      { titre: 'Étalonner son élan', objectif: 'Construire une course d\'élan régulière et accélérée.',
        contenus: ['Étalonnage à l\'envers', 'Rythme des 3 dernières foulées'],
        situations: [{ nom: 'L\'élan régulier', but: 'Arriver dans la zone d\'appel 3 fois sur 4.', organisation: 'Binômes, observateur au niveau de la zone.', consignes: 'Toujours partir du même repère.', criteres: '3 appels réussis sur 4.', simplifier: 'Zone large.', complexifier: 'Zone étroite / planche.' }] },
      { titre: 'Optimiser la réception', objectif: 'Gagner des centimètres en ramenant les jambes devant.',
        contenus: ['Ramener les jambes devant', 'Chute vers l\'avant'],
        situations: [{ nom: 'La ligne à dépasser', but: 'Poser les pieds au-delà d\'un repère.', organisation: 'Repère adapté à chacun.', consignes: 'Ramener les deux pieds devant.', criteres: 'Ne pas retomber en arrière.', simplifier: 'Repère rapproché.', complexifier: 'Repère éloigné.' }] },
    ],
    reference: { c3: 'Concours : 3 essais avec {elan}, meilleur saut retenu.', c4: 'Concours : 4 essais, élan de {elan}, mesure depuis l\'appel réel ou la planche.', ly: 'Concours : 4 essais, projet de performance et rôle de juge.' },
    evaluation: {
      c3: [
        { critere: 'Performance (mètres)', degres: ['< barème 1', 'Barème 1–2', 'Barème 3', 'Barème 4'] },
        { critere: 'Enchaînement course-impulsion', degres: ['Arrêt avant l\'appel', 'Piétine', 'Enchaînement fluide', 'Impulsion dynamique'] },
        { critere: 'Rôle de juge / mesureur', degres: ['Absent', 'Avec aide', 'Autonome', 'Autonome et fiable'] },
      ],
      c4: [
        { critere: 'Performance (barème)', degres: ['< barème 1', 'Barème 1–2', 'Barème 3', 'Barème 4'] },
        { critere: 'Régularité de l\'élan', degres: ['Mordus fréquents', '1 essai sur 2 valide', '3 sur 4 valides', 'Tous valides, peu de perte'] },
        { critere: 'Rôles sociaux', degres: ['Absents', 'Partiels', 'Assurés', 'Assurés avec autonomie'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Performance et respect du projet', degres: ['Faible', 'Moyenne', 'Bonne', 'Très bonne'] },
        { afl: 'AFL2', points: 4, critere: 'Techniques (élan, impulsion, réception)', degres: ['Inefficaces', 'Partielles', 'Efficaces', 'Optimisées'] },
        { afl: 'AFL4', points: 4, critere: 'Rôles de juge', degres: ['Absent', 'Avec aide', 'Fiable', 'Fiable et autonome'] },
      ],
    },
  });

  ['Course de haies', 'Relais-vitesse', 'Saut en hauteur', 'Triple saut', 'Lancer de javelot', 'Lancer de poids', 'Lancer de disque', 'Natation de vitesse', 'Natation de distance', 'Pentabond'].forEach((nom) => add({ id: slug(nom), nom, ca: 'CA1' }));

  /* =========================== CA2 =========================== */
  add({
    id: 'orientation', nom: 'Course d\'orientation', ca: 'CA2', rich: true, icon: '🧭',
    params: {
      '6e': { milieu: 'l\'enceinte de l\'établissement', balises: '6 à 8 balises' }, '5e': { milieu: 'l\'établissement puis un parc proche', balises: '8 balises' },
      '4e': { milieu: 'un parc connu', balises: '10 balises' }, '3e': { milieu: 'un parc ou un bois peu connu', balises: '10 à 12 balises' },
      '2nde': { milieu: 'un milieu boisé peu connu', balises: '12 balises' }, '1re': { milieu: 'un milieu boisé inconnu', balises: '12 à 15 balises' }, Tle: { milieu: 'un milieu boisé inconnu', balises: '15 balises' },
    },
    objet: 'Réaliser un parcours de {balises} dans {milieu} en utilisant la carte et la boussole, en choisissant ses itinéraires et en gérant son effort, tout en respectant les règles de sécurité.',
    materiel: ['Cartes de l\'établissement / du parc (plusieurs échelles)', 'Balises et pinces', 'Cartons de contrôle', 'Boussoles', 'Chronomètres', 'Sifflets (élèves)'],
    securite: ['Limites de la zone connues de tous', 'Heure limite de retour, sifflet en cas de problème', 'Départs en binômes en début de cycle', 'Point de rassemblement et enseignant visible'],
    roles: ['Coureur', 'Contrôleur', 'Chronométreur', 'Poseur de balises'],
    echauffement: ['Footing avec lecture de carte (orienter la carte)', 'Jeu des « points de vue » : retrouver sur la carte où on se trouve'],
    etapes: [
      { titre: 'Lire et orienter la carte', objectif: 'Faire correspondre carte et terrain.', contenus: ['Légende et couleurs', 'Orienter la carte avec les éléments du terrain', 'Pouce sur la carte'],
        situations: [{ nom: 'Le jeu des photos', but: 'Retrouver sur la carte le lieu de chaque photo.', organisation: 'Groupes de 3, 8 photos.', consignes: 'Toujours orienter la carte.', criteres: '6 photos sur 8 situées.', simplifier: 'Zone réduite.', complexifier: 'Temps limité.' }] },
      { titre: 'Choisir un itinéraire', objectif: 'Choisir le chemin le plus sûr ou le plus rapide.', contenus: ['Lignes directrices (mains courantes)', 'Points d\'attaque'],
        situations: [{ nom: 'L\'étoile', but: 'Trouver des balises en partant toujours du centre.', organisation: 'Départ central, balises en étoile.', consignes: 'Revenir au centre après chaque balise.', criteres: 'Toutes les balises en moins de 20 min.', simplifier: 'En binôme.', complexifier: 'Seul, chronométré.' }] },
      { titre: 'Gérer sa course', objectif: 'Adapter son allure à la difficulté de lecture.', contenus: ['Ralentir à l\'approche du poste', 'Courir sur les lignes faciles'],
        situations: [{ nom: 'Le score', but: 'Trouver un maximum de balises en un temps limité.', organisation: 'Balises de valeurs différentes, 25 min.', consignes: 'Pénalité en cas de retard.', criteres: 'Retour à l\'heure avec un maximum de points.', simplifier: 'Temps plus long.', complexifier: 'Pénalités plus fortes.' }] },
    ],
    reference: { c3: 'Parcours de {balises} en binôme dans {milieu}, temps limité.', c4: 'Parcours individuel de {balises} dans {milieu} ; choix du niveau de difficulté.', ly: 'Parcours de {balises} en milieu inconnu, choix de difficulté et gestion du temps.' },
    evaluation: {
      c3: [
        { critere: 'Balises trouvées', degres: ['< 50 %', '50–75 %', '75–100 %', 'Toutes, dans le temps'] },
        { critere: 'Orientation de la carte', degres: ['Jamais orientée', 'Parfois', 'Souvent', 'Toujours'] },
        { critere: 'Respect des règles de sécurité', degres: ['Non respectées', 'Avec rappels', 'Respectées', 'Fait respecter'] },
      ],
      c4: [
        { critere: 'Parcours réalisé (niveau × réussite)', degres: ['Abandon / hors temps', 'Niveau facile réussi', 'Niveau moyen réussi', 'Niveau difficile réussi'] },
        { critere: 'Choix d\'itinéraires', degres: ['Au hasard', 'Lignes évidentes', 'Itinéraires pertinents', 'Itinéraires optimisés'] },
        { critere: 'Sécurité et gestion du temps', degres: ['Retard / hors zone', 'Juste à l\'heure', 'Gestion correcte', 'Gestion anticipée'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Itinéraire réalisé et niveau de difficulté', degres: ['Faible', 'Moyen', 'Bon', 'Très bon'] },
        { afl: 'AFL2', points: 4, critere: 'S\'entraîner : analyse des erreurs', degres: ['Aucune', 'Partielle', 'Pertinente', 'Exploitée'] },
        { afl: 'AFL3', points: 4, critere: 'Rôles et sécurité collective', degres: ['Absents', 'Partiels', 'Assurés', 'Moteur du groupe'] },
      ],
    },
  });

  add({
    id: 'escalade', nom: 'Escalade', ca: 'CA2', rich: true, icon: '🧗',
    params: {
      '6e': { voies: 'voies de cotation 3 à 4', mode: 'en moulinette' }, '5e': { voies: 'voies de 3+ à 4+', mode: 'en moulinette' },
      '4e': { voies: 'voies de 4 à 5a', mode: 'en moulinette, découverte de la tête protégée' }, '3e': { voies: 'voies de 4+ à 5b', mode: 'en moulinette ou en tête protégée' },
      '2nde': { voies: 'voies de 4+ à 5c', mode: 'en tête (ou moulinette selon le niveau)' }, '1re': { voies: 'voies de 5a à 6a', mode: 'en tête' }, Tle: { voies: 'voies de 5a à 6a+', mode: 'en tête' },
    },
    objet: 'Grimper {mode} des {voies} en choisissant un itinéraire à sa mesure, en économisant ses efforts, et assurer la sécurité de son partenaire.',
    materiel: ['Mur équipé (EPI vérifiés)', 'Baudriers, cordes, systèmes d\'assurage', 'Fiche de contrôle mutuel', 'Topo des voies'],
    securite: ['Nœud en huit contrôlé par le binôme et l\'enseignant', 'Contre-assureur obligatoire en début de cycle', 'Personne sous le grimpeur', 'Vérification visuelle du matériel à chaque séance'],
    roles: ['Grimpeur', 'Assureur', 'Contre-assureur', 'Observateur / conseiller'],
    echauffement: ['Mobilisation des épaules, poignets, doigts', 'Traversée basse sans corde', 'Une voie facile en début de séance'],
    etapes: [
      { titre: 'Sécurité et assurage', objectif: 'S\'encorder et assurer de façon fiable.', contenus: ['Nœud en huit et contrôle', 'Technique des 5 temps', 'Communication grimpeur/assureur'],
        situations: [{ nom: 'Le contrôle croisé', but: 'Vérifier le nœud et le baudrier de son partenaire.', organisation: 'Trinômes, check-list.', consignes: 'Aucun départ sans validation.', criteres: '100 % de vérifications.', simplifier: 'Avec l\'enseignant.', complexifier: 'Chronométré sans erreur.' }] },
      { titre: 'Grimper avec les jambes', objectif: 'Pousser sur les jambes, bras tendus.', contenus: ['Pieds précis', 'Bassin près du mur', 'Bras tendus en repos'],
        situations: [{ nom: 'Les prises de couleur', but: 'Grimper en n\'utilisant que des prises imposées pour les mains.', organisation: 'Voies faciles, contraintes de prises.', consignes: 'Regarder ses pieds avant de les poser.', criteres: 'Sommet atteint sans « pédaler ».', simplifier: 'Pas de contrainte.', complexifier: 'Mains limitées à une couleur.' }] },
      { titre: 'Lire et choisir sa voie', objectif: 'Anticiper l\'itinéraire et choisir une voie adaptée.', contenus: ['Lecture au sol', 'Repos sur bras tendus', 'Cotation'],
        situations: [{ nom: 'Le contrat de voie', but: 'Annoncer et réussir une voie de son niveau.', organisation: 'Topo, fiche de projet.', consignes: 'Lire la voie avant de grimper.', criteres: 'Voie annoncée réussie.', simplifier: 'Voie déjà connue.', complexifier: 'Voie à vue.' }] },
    ],
    reference: { c3: 'Grimper 2 {voies} {mode} et assurer un camarade.', c4: 'Choisir et réussir 2 {voies} {mode} ; assurage contrôlé.', ly: 'Réaliser 2 voies choisies ({voies}) {mode} ; projet et assurage autonome.' },
    evaluation: {
      c3: [
        { critere: 'Difficulté de la voie réussie', degres: ['Voie non terminée', 'Cotation 3', 'Cotation 4', 'Cotation 4+'] },
        { critere: 'Assurage', degres: ['Dangereux', 'Avec aide', 'Fiable', 'Fiable et réactif'] },
        { critere: 'Motricité (jambes)', degres: ['Tire avec les bras', 'Utilise parfois les jambes', 'Pousse sur les jambes', 'Grimpe fluide et économique'] },
      ],
      c4: [
        { critere: 'Voie réussie (cotation)', degres: ['< 4', '4', '4+ à 5a', '≥ 5b'] },
        { critere: 'Assurage et sécurité', degres: ['Dangereux', 'Avec rappels', 'Autonome', 'Autonome et vigilant pour les autres'] },
        { critere: 'Lecture et choix de voie', degres: ['Au hasard', 'Choix trop facile/difficile', 'Choix adapté', 'Choix optimal'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Difficulté et fluidité des voies réalisées', degres: ['Faible', 'Moyenne', 'Bonne', 'Très bonne'] },
        { afl: 'AFL2', points: 4, critere: 'S\'entraîner (projet, analyse)', degres: ['Absent', 'Partiel', 'Pertinent', 'Exploité'] },
        { afl: 'AFL3', points: 4, critere: 'Assurage et rôles', degres: ['Non fiable', 'Avec aide', 'Fiable', 'Fiable et conseil'] },
      ],
    },
  });
  ['Sauvetage aquatique', 'Savoir nager (ASSN)', 'Canoë-kayak', 'VTT', 'Randonnée'].forEach((nom) => add({ id: slug(nom), nom, ca: 'CA2' }));

  /* =========================== CA3 =========================== */
  add({
    id: 'acrosport', nom: 'Acrosport', ca: 'CA3', rich: true, icon: '🤸',
    params: {
      '6e': { groupe: 'trios', fig: '4 figures (dont 1 pyramide)', duree: '1 min' }, '5e': { groupe: 'trios ou quatuors', fig: '5 figures et 2 éléments gymniques', duree: '1 min 15' },
      '4e': { groupe: 'quatuors', fig: '5 figures de difficulté variée et 3 éléments gymniques', duree: '1 min 30' }, '3e': { groupe: 'quatuors ou quintettes', fig: '6 figures dont 2 dynamiques et 3 éléments gymniques', duree: '1 min 30 à 2 min' },
      '2nde': { groupe: 'groupes de 4 à 5', fig: '6 figures dont 2 dynamiques', duree: '2 min' }, '1re': { groupe: 'groupes de 4 à 5', fig: '7 figures dont 3 dynamiques', duree: '2 min' }, Tle: { groupe: 'groupes de 4 à 6', fig: '7 figures dont 3 dynamiques', duree: '2 à 2 min 30' },
    },
    objet: 'Composer et présenter en {groupe} un enchaînement de {duree} comprenant {fig}, en sécurité, devant des juges.',
    materiel: ['Tapis', 'Fiches de figures (codes de couleur)', 'Fiche de composition', 'Enceinte pour la musique', 'Tablette pour filmer'],
    securite: ['Montage et démontage contrôlés', 'Pareur désigné pour chaque figure', 'Appuis sur les zones solides (bassin, épaules)', 'Pas de chaussures, pas de bijoux'],
    roles: ['Voltigeur', 'Porteur', 'Pareur', 'Juge (difficulté / exécution)', 'Chorégraphe'],
    echauffement: ['Mobilisation du dos et gainage', 'Jeux de confiance (porteurs/voltigeurs)', 'Éléments gymniques simples'],
    etapes: [
      { titre: 'Gainage et placements', objectif: 'Construire des figures stables et sécurisées.', contenus: ['Dos plat des porteurs', 'Appuis sur zones solides', 'Gainage du voltigeur'],
        situations: [{ nom: 'Les figures de base', but: 'Réaliser et tenir 3 s des figures de niveau A.', organisation: 'Trios, fiches figures.', consignes: 'Montage – tenue 3 s – démontage contrôlé.', criteres: 'Figure tenue 3 s sans chute.', simplifier: 'Figures à 2.', complexifier: 'Figures de niveau B.' }] },
      { titre: 'Liaisons et éléments gymniques', objectif: 'Enchaîner les figures avec fluidité.', contenus: ['Transitions', 'Roulades, roues, sauts', 'Synchronisation'],
        situations: [{ nom: 'L\'enchaînement en continu', but: 'Lier 3 figures sans temps mort.', organisation: 'Groupe complet, musique.', consignes: 'Aucun arrêt entre les figures.', criteres: 'Enchaînement sans hésitation.', simplifier: '2 figures.', complexifier: 'Ajouter un élément dynamique.' }] },
      { titre: 'Composer et présenter', objectif: 'Construire un enchaînement original et le présenter.', contenus: ['Espace scénique, orientations', 'Début et fin marqués'],
        situations: [{ nom: 'La répétition générale', but: 'Présenter devant un groupe juge.', organisation: 'Passage devant 2 juges, fiche de jugement.', consignes: 'Respecter la fiche de composition.', criteres: 'Note des juges ; conseils exploités.', simplifier: 'Sans musique.', complexifier: 'Avec musique et thème.' }] },
    ],
    reference: { c3: 'Présentation en {groupe} : {fig}, {duree}, jugée par des camarades.', c4: 'Enchaînement de {duree} en {groupe} : {fig} ; rôle de juge.', ly: 'Enchaînement de {duree} en {groupe} : {fig}, avec projet de composition et jugement.' },
    evaluation: {
      c3: [
        { critere: 'Difficulté et tenue des figures', degres: ['Figures chutées', 'Figures A tenues', 'Figures A et B tenues', 'Figures B/C maîtrisées'] },
        { critere: 'Sécurité (pareurs, montage)', degres: ['Dangereux', 'Avec rappels', 'Assurée', 'Assurée et anticipée'] },
        { critere: 'Rôle de juge', degres: ['Absent', 'Avec aide', 'Fiable', 'Fiable et argumenté'] },
      ],
      c4: [
        { critere: 'Difficulté et exécution', degres: ['Insuffisante', 'Fragile', 'Satisfaisante', 'Très bonne'] },
        { critere: 'Composition (liaisons, espace, originalité)', degres: ['Juxtaposition', 'Quelques liaisons', 'Enchaînement fluide', 'Composition originale'] },
        { critere: 'Rôle de juge / pareur', degres: ['Absent', 'Partiel', 'Assuré', 'Assuré avec expertise'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Difficulté, exécution, composition', degres: ['Faible', 'Moyenne', 'Bonne', 'Très bonne'] },
        { afl: 'AFL2', points: 4, critere: 'Se préparer et répéter', degres: ['Peu engagé', 'Engagé', 'Efficace', 'Moteur du groupe'] },
        { afl: 'AFL3', points: 4, critere: 'Rôle de juge', degres: ['Erreurs nombreuses', 'Approximatif', 'Fiable', 'Expert'] },
      ],
    },
  });

  add({
    id: 'danse', nom: 'Danse', ca: 'CA3', rich: true, icon: '💃',
    params: {
      '6e': { duree: '1 min', groupe: 'groupes de 3 à 4' }, '5e': { duree: '1 min 30', groupe: 'groupes de 3 à 5' }, '4e': { duree: '1 min 30', groupe: 'groupes de 4 à 5' }, '3e': { duree: '2 min', groupe: 'groupes de 4 à 5' },
      '2nde': { duree: '2 min', groupe: 'groupes de 3 à 5' }, '1re': { duree: '2 min 30', groupe: 'groupes de 3 à 5' }, Tle: { duree: '2 min 30 à 3 min', groupe: 'groupes de 3 à 6' },
    },
    objet: 'Composer et interpréter en {groupe} une chorégraphie de {duree} à partir d\'un thème, en utilisant les composantes du mouvement (espace, temps, énergie) pour émouvoir un public.',
    materiel: ['Enceinte et musiques', 'Inducteurs (objets, images, textes)', 'Tablette pour filmer', 'Fiche du spectateur'],
    securite: ['Sol propre, pieds nus ou chaussons', 'Échauffement articulaire complet', 'Respect des prestations des autres'],
    roles: ['Danseur', 'Chorégraphe', 'Spectateur averti', 'Régisseur (musique)'],
    echauffement: ['Mobilisation segmentaire en musique', 'Jeux de miroir et d\'écoute', 'Traversées avec variations d\'énergie'],
    etapes: [
      { titre: 'Explorer le mouvement', objectif: 'Varier espace, temps et énergie.', contenus: ['Niveaux haut/moyen/bas', 'Lent/rapide, accéléré/arrêt', 'Fluide/saccadé'],
        situations: [{ nom: 'Les traversées', but: 'Traverser la salle en variant un paramètre imposé.', organisation: 'Vagues de 5 élèves.', consignes: 'Une variation imposée à chaque passage.', criteres: 'Variation visible par les spectateurs.', simplifier: 'Un seul paramètre.', complexifier: 'Combiner deux paramètres.' }] },
      { titre: 'Composer', objectif: 'Utiliser des procédés de composition.', contenus: ['Unisson, canon, cascade, question-réponse', 'Début et fin'],
        situations: [{ nom: 'La phrase partagée', but: 'Construire une phrase de 8 temps et la transformer.', organisation: 'Groupes, procédé tiré au sort.', consignes: 'Appliquer le procédé à la phrase.', criteres: 'Procédé lisible pour le public.', simplifier: 'Unisson seulement.', complexifier: '2 procédés.' }] },
      { titre: 'Interpréter', objectif: 'Être présent et concentré pour toucher le public.', contenus: ['Regard, concentration', 'Engagement du corps'],
        situations: [{ nom: 'Le spectacle-test', but: 'Présenter et recevoir des retours.', organisation: 'Moitié de classe spectatrice, fiche du spectateur.', consignes: 'Aucun rire, regard fixé.', criteres: 'Retours positifs des spectateurs.', simplifier: 'Petit public.', complexifier: 'Public plus large.' }] },
    ],
    reference: { c3: 'Chorégraphie de {duree} en {groupe}, présentée et appréciée par des spectateurs.', c4: 'Chorégraphie de {duree} en {groupe} sur un thème ; rôle de spectateur averti.', ly: 'Chorégraphie de {duree} en {groupe}, projet expressif écrit et présenté.' },
    evaluation: {
      c3: [
        { critere: 'Engagement et concentration', degres: ['Absent', 'Hésitant', 'Engagé', 'Engagé et expressif'] },
        { critere: 'Composition', degres: ['Mouvements quotidiens', 'Quelques variations', 'Procédés utilisés', 'Composition originale'] },
        { critere: 'Rôle de spectateur', degres: ['Ne respecte pas', 'Respecte', 'Observe avec critères', 'Argumente'] },
      ],
      c4: [
        { critere: 'Interprétation', degres: ['Insuffisante', 'Fragile', 'Satisfaisante', 'Très bonne'] },
        { critere: 'Composition (espace, temps, énergie, procédés)', degres: ['Insuffisante', 'Fragile', 'Satisfaisante', 'Très bonne'] },
        { critere: 'Spectateur averti', degres: ['Insuffisante', 'Fragile', 'Satisfaisante', 'Très bonne'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Composition et interprétation', degres: ['Faible', 'Moyenne', 'Bonne', 'Très bonne'] },
        { afl: 'AFL2', points: 4, critere: 'Se préparer pour s\'exprimer', degres: ['Peu engagé', 'Engagé', 'Efficace', 'Moteur'] },
        { afl: 'AFL3', points: 4, critere: 'Rôles (chorégraphe, spectateur)', degres: ['Absent', 'Partiel', 'Assuré', 'Expert'] },
      ],
    },
  });
  ['Gymnastique au sol', 'Gymnastique aux agrès', 'Arts du cirque', 'Mime / expression corporelle'].forEach((nom) => add({ id: slug(nom), nom, ca: 'CA3' }));

  /* =========================== CA4 =========================== */
  add({
    id: 'badminton', nom: 'Badminton', ca: 'CA4', rich: true, icon: '🏸',
    params: {
      '6e': { format: 'matchs en 1 contre 1 de 7 min', terrain: 'terrain réduit (simple court)' }, '5e': { format: 'matchs de 8 min', terrain: 'terrain de simple' },
      '4e': { format: 'matchs de 10 min ou en 15 points', terrain: 'terrain de simple' }, '3e': { format: 'matchs en 21 points ou 12 min', terrain: 'terrain de simple' },
      '2nde': { format: 'matchs en 21 points', terrain: 'terrain de simple' }, '1re': { format: 'matchs en 21 points', terrain: 'terrain de simple' }, Tle: { format: 'matchs en 21 points avec coaching', terrain: 'terrain de simple' },
    },
    objet: 'Gagner des {format} sur {terrain} en créant et exploitant des situations favorables de marque (déplacer l\'adversaire, varier longueur et hauteur, attaquer le volant haut).',
    materiel: ['Raquettes, volants', 'Filets et poteaux', 'Plots / cerceaux (cibles)', 'Fiches de score et d\'observation'],
    securite: ['Distance entre terrains', 'Ne pas passer derrière un joueur en train de jouer', 'Raquettes rangées pendant les consignes'],
    roles: ['Joueur', 'Arbitre', 'Observateur', 'Coach', 'Organisateur de tournoi'],
    echauffement: ['Déplacements (pas chassés, fentes)', 'Échanges coopératifs en « dégagé »', 'Mobilisation épaule et poignet'],
    etapes: [
      { titre: 'Renvoyer pour durer', objectif: 'Maîtriser le dégagé et le service.', contenus: ['Prise universelle', 'Frapper au-dessus de la tête', 'Replacement au centre'],
        situations: [{ nom: 'Les échanges en coopération', but: 'Réaliser 20 échanges sans faute.', organisation: 'Binômes, demi-terrain.', consignes: 'Volant haut et long.', criteres: '20 échanges consécutifs.', simplifier: 'Volant lancé à la main.', complexifier: 'Uniquement en dégagé fond de court.' }] },
      { titre: 'Déplacer l\'adversaire', objectif: 'Jouer loin de l\'adversaire, varier avant/arrière.', contenus: ['Amorti / dégagé', 'Lire la position adverse'],
        situations: [{ nom: 'Les zones bonus', but: 'Marquer plus de points en visant les zones arrière et avant.', organisation: 'Match en 1c1, zones à 2 points.', consignes: 'Jouer dans les zones bonus.', criteres: '50 % des volants dans les zones.', simplifier: 'Zones larges.', complexifier: 'Zones plus petites.' }] },
      { titre: 'Attaquer pour gagner', objectif: 'Rompre l\'échange sur un volant haut.', contenus: ['Smash et frappe à plat', 'Reconnaître le volant favorable'],
        situations: [{ nom: 'Le volant d\'or', but: 'Conclure le point dès qu\'un volant haut arrive à mi-court.', organisation: 'Matchs à thème.', consignes: 'Point double si gagné par smash.', criteres: 'Taux de réussite des attaques > 50 %.', simplifier: 'Volant d\'attaque lancé.', complexifier: 'Défense active de l\'adversaire.' }] },
      { titre: 'Gérer le match', objectif: 'Adapter son jeu au rapport de force et coacher.', contenus: ['Analyse des points gagnés/perdus', 'Plan de jeu'],
        situations: [{ nom: 'Le match coaché', but: 'Appliquer le conseil du coach à mi-match.', organisation: 'Trinômes joueur-joueur-coach.', consignes: 'Temps mort de 30 s.', criteres: 'Conseil appliqué et score amélioré.', simplifier: 'Coach guidé par une fiche.', complexifier: 'Coaching libre.' }] },
    ],
    reference: { c3: 'Tournoi de {format} sur {terrain} ; arbitrage par les élèves.', c4: 'Montante-descendante en {format} ; observation et co-arbitrage.', ly: 'Tournoi en {format} avec projet de jeu et coaching.' },
    evaluation: {
      c3: [
        { critere: 'Gain des rencontres', degres: ['Perd toutes', 'Gagne parfois', 'Gagne la moitié', 'Gagne la majorité'] },
        { critere: 'Renvoi et déplacement de l\'adversaire', degres: ['Renvoie au centre', 'Renvoie loin parfois', 'Varie longueur', 'Déplace l\'adversaire'] },
        { critere: 'Arbitrage', degres: ['Absent', 'Avec aide', 'Fiable', 'Fiable et respecté'] },
      ],
      c4: [
        { critere: 'Efficacité en match (gain, points marqués)', degres: ['Insuffisante', 'Fragile', 'Satisfaisante', 'Très bonne'] },
        { critere: 'Création / exploitation des situations favorables', degres: ['Absente', 'Rare', 'Fréquente', 'Systématique'] },
        { critere: 'Observation et co-arbitrage', degres: ['Absent', 'Partiel', 'Assuré', 'Assuré avec analyse'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Gain des rencontres et choix tactiques', degres: ['Faible', 'Moyen', 'Bon', 'Très bon'] },
        { afl: 'AFL2', points: 4, critere: 'Se préparer et s\'entraîner', degres: ['Absent', 'Partiel', 'Efficace', 'Autonome'] },
        { afl: 'AFL3', points: 4, critere: 'Rôles (arbitre, coach)', degres: ['Absent', 'Partiel', 'Fiable', 'Expert'] },
      ],
    },
  });

  add({
    id: 'handball', nom: 'Handball', ca: 'CA4', rich: true, icon: '🤾',
    params: {
      '6e': { format: '4 contre 4 + gardien', terrain: 'demi-terrain en largeur' }, '5e': { format: '5 contre 5 + gardien', terrain: 'terrain réduit' },
      '4e': { format: '5 contre 5 + gardien', terrain: 'terrain réduit' }, '3e': { format: '6 contre 6 + gardien', terrain: 'grand terrain' },
      '2nde': { format: '6 contre 6 + gardien', terrain: 'grand terrain' }, '1re': { format: '6 contre 6 + gardien', terrain: 'grand terrain' }, Tle: { format: '6 contre 6 + gardien', terrain: 'grand terrain' },
    },
    objet: 'En {format} sur {terrain}, gagner le match en progressant rapidement vers la cible pour tirer en position favorable, et en défendant collectivement pour récupérer la balle.',
    materiel: ['Ballons (taille adaptée)', 'Chasubles', 'Buts', 'Plots', 'Fiches d\'observation'],
    securite: ['Zone du gardien interdite', 'Pas de contact sur le tireur', 'Ballons taille 1 ou 2 selon l\'âge'],
    roles: ['Joueur', 'Arbitre', 'Observateur', 'Coach', 'Table de marque'],
    echauffement: ['Jeux de passes en mouvement', 'Gainage et mobilisation des épaules', 'Tirs progressifs sur gardien'],
    etapes: [
      { titre: 'Conserver et progresser', objectif: 'Faire avancer le ballon vers la cible.', contenus: ['Passe à un partenaire démarqué', 'Se démarquer vers l\'avant'],
        situations: [{ nom: 'La passe à 10', but: 'Réaliser 10 passes sans interception.', organisation: '4c4 dans un carré de 20 m.', consignes: 'Pas de dribble.', criteres: '10 passes = 1 point.', simplifier: 'Supériorité numérique.', complexifier: 'Interdiction de rendre au passeur.' }] },
      { titre: 'Tirer en position favorable', objectif: 'Choisir le moment et le lieu du tir.', contenus: ['Tir en suspension / en appui', 'Se rapprocher du but par le centre'],
        situations: [{ nom: 'Les zones de tir', but: 'Marquer depuis la zone favorable.', organisation: 'Attaque placée, zones colorées.', consignes: 'Tir réussi en zone centrale = 2 points.', criteres: '60 % des tirs en zone favorable.', simplifier: 'Défense passive.', complexifier: 'Défense active.' }] },
      { titre: 'Contre-attaquer', objectif: 'Gagner la course vers le but adverse.', contenus: ['Montée de balle rapide', 'Passe longue'],
        situations: [{ nom: 'La montée de balle en 3c2', but: 'Marquer en moins de 8 secondes.', organisation: 'Vagues successives.', consignes: 'Partir au signal de récupération.', criteres: 'But en moins de 8 s.', simplifier: '3c1.', complexifier: 'Défenseur qui revient.' }] },
      { titre: 'Défendre ensemble', objectif: 'Récupérer la balle et protéger son but.', contenus: ['Se placer entre l\'adversaire et le but', 'Harceler le porteur'],
        situations: [{ nom: 'La défense étagée', but: 'Récupérer le ballon avant le tir.', organisation: '5c5, défense individuelle puis de zone.', consignes: 'Un défenseur sur le porteur.', criteres: 'Nombre de récupérations.', simplifier: 'Attaquants limités.', complexifier: 'Défense à effectif réduit.' }] },
    ],
    reference: { c3: 'Matchs en {format} sur {terrain} ; arbitrage et observation.', c4: 'Tournoi en {format} sur {terrain} ; observation, co-arbitrage, coaching.', ly: 'Matchs en {format} avec projet tactique d\'équipe.' },
    evaluation: {
      c3: [
        { critere: 'Participation au jeu', degres: ['Absent du jeu', 'Reçoit peu', 'Participe', 'Joueur ressource'] },
        { critere: 'Choix (passer, tirer, progresser)', degres: ['Inadaptés', 'Parfois adaptés', 'Souvent adaptés', 'Toujours adaptés'] },
        { critere: 'Arbitrage et respect', degres: ['Conflits', 'Avec aide', 'Fiable', 'Fiable et respecté'] },
      ],
      c4: [
        { critere: 'Efficacité collective (gain, buts)', degres: ['Insuffisante', 'Fragile', 'Satisfaisante', 'Très bonne'] },
        { critere: 'Actions décisives en situation favorable', degres: ['Absentes', 'Rares', 'Fréquentes', 'Décisives'] },
        { critere: 'Rôles (arbitre, observateur)', degres: ['Absent', 'Partiel', 'Assuré', 'Expert'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Efficacité et choix tactiques', degres: ['Faible', 'Moyen', 'Bon', 'Très bon'] },
        { afl: 'AFL2', points: 4, critere: 'Se préparer et s\'entraîner', degres: ['Absent', 'Partiel', 'Efficace', 'Autonome'] },
        { afl: 'AFL3', points: 4, critere: 'Rôles', degres: ['Absent', 'Partiel', 'Fiable', 'Expert'] },
      ],
    },
  });

  add({
    id: 'basket', nom: 'Basket-ball', ca: 'CA4', rich: true, icon: '🏀',
    params: {
      '6e': { format: '3 contre 3', terrain: 'demi-terrain' }, '5e': { format: '3 contre 3 ou 4 contre 4', terrain: 'demi-terrain ou terrain réduit' },
      '4e': { format: '4 contre 4', terrain: 'terrain complet' }, '3e': { format: '4 contre 4 ou 5 contre 5', terrain: 'terrain complet' },
      '2nde': { format: '4 contre 4', terrain: 'terrain complet' }, '1re': { format: '5 contre 5', terrain: 'terrain complet' }, Tle: { format: '5 contre 5', terrain: 'terrain complet' },
    },
    objet: 'En {format} sur {terrain}, gagner le match en progressant vers le panier pour tirer en zone favorable, et en défendant pour récupérer la balle sans contact.',
    materiel: ['Ballons taille 5 ou 6', 'Chasubles', 'Panneaux (hauteur adaptée)', 'Plots', 'Fiches d\'observation'],
    securite: ['Pas de contact', 'Pas de suspension au cercle', 'Ballons rangés pendant les consignes'],
    roles: ['Joueur', 'Arbitre', 'Observateur (fiche de tirs)', 'Coach', 'Table de marque'],
    echauffement: ['Dribbles en déplacement', 'Passes à deux en course', 'Tirs en course (double-pas)'],
    etapes: [
      { titre: 'Progresser vers le panier', objectif: 'Enchaîner dribble et passe pour avancer.', contenus: ['Dribble de progression', 'Passe vers l\'avant'],
        situations: [{ nom: 'La remontée de terrain', but: 'Traverser le terrain en 3c2.', organisation: 'Vagues, terrain complet.', consignes: 'Passe vers l\'avant prioritaire.', criteres: 'Tir en moins de 10 s.', simplifier: '3c1.', complexifier: '3c3.' }] },
      { titre: 'Tirer en zone favorable', objectif: 'Tirer près du panier, en position d\'équilibre.', contenus: ['Double-pas', 'Tir en appui', 'Zone de 3 pas'],
        situations: [{ nom: 'Le tir à points', but: 'Marquer depuis les zones.', organisation: 'Atelier de tirs + match.', consignes: 'Tir uniquement en zone.', criteres: '50 % de réussite en zone proche.', simplifier: 'Panier abaissé.', complexifier: 'Défenseur.' }] },
      { titre: 'Créer le surnombre', objectif: 'Utiliser le démarquage et le jeu à 2.', contenus: ['Donne-et-va', 'Écarter le jeu'],
        situations: [{ nom: 'Le 2c1 en continu', but: 'Marquer en profitant du surnombre.', organisation: 'Couloirs, rotation continue.', consignes: 'Fixer le défenseur avant la passe.', criteres: '7 paniers sur 10 tentatives.', simplifier: 'Défenseur passif.', complexifier: '3c2.' }] },
    ],
    reference: { c3: 'Matchs en {format} sur {terrain} ; arbitrage.', c4: 'Tournoi en {format} sur {terrain} ; observation des tirs.', ly: 'Matchs en {format} avec projet tactique et coaching.' },
    evaluation: {
      c3: [
        { critere: 'Participation au jeu', degres: ['Absent', 'Reçoit peu', 'Participe', 'Ressource'] },
        { critere: 'Tirs en position favorable', degres: ['Aucun', 'Loin / déséquilibré', 'Proche', 'Proche et réussi'] },
        { critere: 'Arbitrage', degres: ['Absent', 'Avec aide', 'Fiable', 'Fiable et respecté'] },
      ],
      c4: [
        { critere: 'Efficacité (gain, paniers)', degres: ['Insuffisante', 'Fragile', 'Satisfaisante', 'Très bonne'] },
        { critere: 'Choix et actions décisives', degres: ['Inadaptés', 'Parfois', 'Souvent', 'Toujours'] },
        { critere: 'Rôles sociaux', degres: ['Absent', 'Partiel', 'Assuré', 'Expert'] },
      ],
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Efficacité et choix tactiques', degres: ['Faible', 'Moyen', 'Bon', 'Très bon'] },
        { afl: 'AFL2', points: 4, critere: 'S\'entraîner', degres: ['Absent', 'Partiel', 'Efficace', 'Autonome'] },
        { afl: 'AFL3', points: 4, critere: 'Rôles', degres: ['Absent', 'Partiel', 'Fiable', 'Expert'] },
      ],
    },
  });
  ['Volley-ball', 'Football', 'Futsal', 'Rugby', 'Ultimate', 'Tennis de table', 'Tennis', 'Judo', 'Lutte', 'Boxe française (savate)', 'Hockey'].forEach((nom) => add({ id: slug(nom), nom, ca: 'CA4' }));

  /* =========================== CA5 (lycée) =========================== */
  add({
    id: 'musculation', nom: 'Musculation', ca: 'CA5', rich: true, icon: '🏋',
    params: {
      '2nde': { mobiles: 'au choix : tonification, volume, puissance', duree: '45 min' }, '1re': { mobiles: 'au choix : tonification, volume, puissance', duree: '50 min' }, Tle: { mobiles: 'au choix : tonification, volume, puissance, force', duree: '50 min' },
    },
    objet: 'Concevoir, réaliser et réguler une séance de {duree} selon un mobile ({mobiles}), en choisissant les paramètres d\'entraînement (charges, séries, répétitions, récupération) et en exécutant en sécurité.',
    materiel: ['Postes de musculation, haltères, élastiques', 'Tapis', 'Carnet d\'entraînement', 'Fiches des exercices', 'Chronomètres'],
    securite: ['Placement du dos (dos plat, gainage)', 'Respiration (expirer à l\'effort)', 'Pareur sur les charges lourdes', 'Échauffement spécifique avant chaque exercice'],
    roles: ['Pratiquant', 'Pareur', 'Observateur (placements)', 'Coach'],
    echauffement: ['Cardio 6 min (vélo, corde)', 'Mobilisation articulaire', 'Séries légères sur chaque exercice'],
    etapes: [
      { titre: 'Postures et sécurité', objectif: 'Maîtriser les placements des exercices de base.', contenus: ['Squat, développé, tirage, gainage', 'Respiration'],
        situations: [{ nom: 'Le circuit des postures', but: 'Réaliser 6 exercices avec placements validés.', organisation: 'Trinômes, fiche critères.', consignes: 'L\'observateur valide chaque poste.', criteres: '6 postes validés.', simplifier: 'Poids du corps.', complexifier: 'Charges légères.' }] },
      { titre: 'Choisir ses paramètres', objectif: 'Relier mobile et paramètres de charge.', contenus: ['% de 1 RM ou RPE', 'Séries, répétitions, récupération'],
        situations: [{ nom: 'Le test de charge', but: 'Déterminer sa charge de travail.', organisation: 'Test indirect (10 RM).', consignes: 'Respecter les placements.', criteres: 'Charge déterminée et notée.', simplifier: 'Échelle RPE.', complexifier: 'Calcul du % de 1 RM.' }] },
      { titre: 'Planifier et réguler', objectif: 'Construire sa séance et l\'ajuster selon ses ressentis.', contenus: ['Carnet d\'entraînement', 'Ressentis musculaires et fatigue'],
        situations: [{ nom: 'Ma séance', but: 'Réaliser sa séance et noter ses ressentis.', organisation: 'Individuel, carnet.', consignes: 'Ajuster une variable si nécessaire.', criteres: 'Séance réalisée et analysée.', simplifier: 'Séance guidée.', complexifier: 'Séance totalement autonome.' }] },
    ],
    reference: { ly: 'Réaliser sa séance de {duree} (mobile choisi) et présenter son carnet ; analyser les effets ressentis.' },
    evaluation: {
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Cohérence mobile / paramètres et qualité d\'exécution', degres: ['Incohérent', 'Partiellement cohérent', 'Cohérent', 'Cohérent et argumenté'] },
        { afl: 'AFL2', points: 4, critere: 'Carnet d\'entraînement et régulation', degres: ['Absent', 'Incomplet', 'Complet', 'Complet et analysé'] },
        { afl: 'AFL3', points: 4, critere: 'Coopérer (pareur, observateur)', degres: ['Absent', 'Partiel', 'Fiable', 'Moteur'] },
      ],
    },
  });

  add({
    id: 'course-duree', nom: 'Course en durée', ca: 'CA5', rich: true, icon: '🏃',
    params: { '2nde': { duree: '30 min' }, '1re': { duree: '35 min' }, Tle: { duree: '40 min' } },
    objet: 'Concevoir et réaliser une séance de course de {duree} en choisissant ses allures (en % de VMA) selon un mobile (entretien, endurance, perte de masse grasse, performance) et en régulant à partir de ses ressentis.',
    materiel: ['Plots tous les 25 m', 'Chronomètres / cardiofréquencemètres', 'Carnet d\'entraînement', 'Tableau de VMA'],
    securite: ['Hydratation', 'Adapter en cas de chaleur', 'Connaître les élèves asthmatiques (PAI)'],
    roles: ['Coureur', 'Coach', 'Observateur'],
    echauffement: ['Footing 8 min', 'Gammes et lignes droites'],
    etapes: [
      { titre: 'Connaître ses allures', objectif: 'Tester sa VMA et ressentir les allures.', contenus: ['Test de VMA', 'Échelle de ressenti (RPE)'],
        situations: [{ nom: 'Le test VAMEVAL / demi-Cooper', but: 'Déterminer sa VMA.', organisation: 'Piste balisée.', consignes: 'Effort maximal.', criteres: 'VMA calculée.', simplifier: 'Demi-Cooper.', complexifier: 'VAMEVAL.' }] },
      { titre: 'Programmer', objectif: 'Relier mobile et paramètres (durée, intensité, récupération).', contenus: ['Continu / intermittent', 'Zones de fréquence cardiaque'],
        situations: [{ nom: 'Mon programme', but: 'Construire puis réaliser une séance-type.', organisation: 'Individuel, carnet.', consignes: 'Respecter son programme.', criteres: 'Séance réalisée, ressentis notés.', simplifier: 'Programme proposé.', complexifier: 'Programme autonome.' }] },
    ],
    reference: { ly: 'Réaliser sa séance de {duree} (mobile choisi), carnet d\'entraînement et analyse.' },
    evaluation: {
      ly: [
        { afl: 'AFL1', points: 12, critere: 'Cohérence mobile / paramètres et réalisation', degres: ['Incohérent', 'Partiel', 'Cohérent', 'Cohérent et argumenté'] },
        { afl: 'AFL2', points: 4, critere: 'Carnet et régulation', degres: ['Absent', 'Incomplet', 'Complet', 'Analysé'] },
        { afl: 'AFL3', points: 4, critere: 'Coopérer pour faire progresser', degres: ['Absent', 'Partiel', 'Fiable', 'Moteur'] },
      ],
    },
  });
  ['Step', 'Yoga', 'Natation en durée', 'Cross training', 'Pilates'].forEach((nom) => add({ id: slug(nom), nom, ca: 'CA5' }));

  function slug(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  EPS.activities = {
    list: A,
    byCA: (ca) => A.filter((a) => a.ca === ca),
    byId: (id) => A.find((a) => a.id === id),
    slug,
  };
})(window.EPS);
