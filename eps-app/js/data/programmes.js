/* Référentiel des programmes d'EPS : champs d'apprentissage (CA), attendus de fin de cycle (collège)
   et attendus de fin de lycée (AFL). Textes résumés d'après les programmes officiels (cycle 3, cycle 4,
   lycée général et technologique 2019) — à vérifier/compléter avec les textes du BO en vigueur. */
(function (EPS) {
  const CA = [
    {
      id: 'CA1', num: 1, color: '#e11d48',
      titre: 'Produire une performance optimale, mesurable à une échéance donnée',
      court: 'Performance',
      lycee: false,
      afc: {
        c3: [
          'Réaliser des efforts et enchaîner plusieurs actions motrices dans différentes familles pour aller plus vite, plus longtemps, plus haut, plus loin.',
          'Combiner une course, un saut, un lancer pour faire la meilleure performance cumulée.',
          'Mesurer et quantifier les performances, les enregistrer, les comparer, les classer, les traduire en représentations graphiques.',
          'Assumer les rôles de chronométreur et d\'observateur.',
        ],
        c4: [
          'Gérer son effort, faire des choix pour réaliser la meilleure performance dans au moins deux familles athlétiques et/ou au moins deux styles de nage.',
          'S\'engager dans un programme de préparation individuel ou collectif.',
          'Planifier et réaliser une épreuve combinée.',
          'S\'échauffer avant un effort.',
          'Aider ses camarades et assumer différents rôles sociaux (juge d\'appel et de déclenchement, starter, chronométreur, juge, aide).',
        ],
        ly: [
          'AFL1 — Produire et répartir intentionnellement ses efforts en mobilisant ses ressources pour gagner ou pour battre un record.',
          'AFL2 — Connaître et mobiliser les techniques efficaces pour produire la meilleure performance possible.',
          'AFL3 — Analyser sa performance pour adapter son projet et progresser.',
          'AFL4 — Assumer des rôles sociaux pour organiser une épreuve de production de performance, un concours.',
        ],
      },
    },
    {
      id: 'CA2', num: 2, color: '#16a34a',
      titre: 'Adapter ses déplacements à des environnements variés',
      court: 'Environnements',
      afc: {
        c3: [
          'Réaliser, seul ou à plusieurs, un parcours dans plusieurs environnements inhabituels, en milieu naturel aménagé ou artificiel.',
          'Connaître et respecter les règles de sécurité qui s\'appliquent à chaque environnement.',
          'Identifier la personne responsable à alerter ou la procédure en cas de problème.',
          'Valider l\'attestation scolaire du savoir nager (ASSN).',
        ],
        c4: [
          'Réussir un déplacement planifié dans un milieu naturel aménagé ou artificiel recréé plus ou moins connu.',
          'Gérer ses ressources pour réaliser en totalité un parcours sécurisé.',
          'Assurer la sécurité de son camarade.',
          'Respecter et faire respecter les règles de sécurité.',
        ],
        ly: [
          'AFL1 — S\'engager à l\'aide d\'une motricité spécifique pour réaliser en sécurité et à son meilleur niveau un itinéraire dans un contexte incertain.',
          'AFL2 — S\'entraîner individuellement et collectivement pour se déplacer de manière efficiente et en toute sécurité.',
          'AFL3 — Choisir et assumer les rôles qui permettent un fonctionnement collectif solidaire et sécurisé.',
        ],
      },
    },
    {
      id: 'CA3', num: 3, color: '#9333ea',
      titre: 'S\'exprimer devant les autres par une prestation artistique et/ou acrobatique',
      court: 'Artistique / acrobatique',
      afc: {
        c3: [
          'Réaliser en petits groupes deux séquences : une à visée acrobatique destinée à être jugée, une autre à visée artistique destinée à être appréciée et à émouvoir.',
          'Savoir filmer une prestation pour la revoir et la faire évoluer.',
          'Respecter les prestations des autres et accepter de se produire devant les autres.',
        ],
        c4: [
          'Mobiliser les capacités expressives du corps pour imaginer, composer et interpréter une séquence artistique ou acrobatique.',
          'Participer activement, au sein d\'un groupe, à l\'élaboration et à la formalisation d\'un projet artistique.',
          'Apprécier des prestations en utilisant différents supports d\'observation et d\'analyse.',
        ],
        ly: [
          'AFL1 — S\'engager pour composer et réaliser un enchaînement à visée esthétique ou acrobatique destiné à être jugé, en combinant des formes corporelles codifiées.',
          'AFL2 — Se préparer et s\'engager, individuellement et collectivement, pour s\'exprimer devant un public et susciter des émotions.',
          'AFL3 — Choisir et assumer les rôles qui permettent un fonctionnement collectif solidaire (chorégraphe, juge, spectateur, aide).',
        ],
      },
    },
    {
      id: 'CA4', num: 4, color: '#2563eb',
      titre: 'Conduire et maîtriser un affrontement collectif ou interindividuel',
      court: 'Affrontement',
      afc: {
        c3: [
          'S\'organiser tactiquement pour gagner le duel ou le match en identifiant les situations favorables de marque.',
          'Maintenir un engagement moteur efficace sur tout le temps de jeu prévu.',
          'Respecter les partenaires, les adversaires et l\'arbitre.',
          'Assurer différents rôles sociaux (joueur, arbitre, observateur) inhérents à l\'activité et à l\'organisation de la classe.',
          'Accepter le résultat de la rencontre et savoir l\'analyser avec objectivité.',
        ],
        c4: [
          'Réaliser des actions décisives en situation favorable afin de faire basculer le rapport de force en sa faveur ou en faveur de son équipe.',
          'Adapter son engagement moteur en fonction de son état physique et du rapport de force.',
          'Être solidaire de ses partenaires et respectueux de son (ses) adversaire(s) et de l\'arbitre.',
          'Observer et co-arbitrer.',
          'Accepter le résultat de la rencontre et être capable de le commenter.',
        ],
        ly: [
          'AFL1 — S\'engager pour gagner une rencontre en faisant des choix techniques et tactiques pertinents au regard de l\'analyse du rapport de force.',
          'AFL2 — Se préparer et s\'entraîner, individuellement ou collectivement, pour conduire et maîtriser un affrontement collectif ou interindividuel.',
          'AFL3 — Choisir et assumer les rôles qui permettent un fonctionnement collectif solidaire.',
        ],
      },
    },
    {
      id: 'CA5', num: 5, color: '#ea580c',
      titre: 'Réaliser et orienter son activité physique pour développer ses ressources et s\'entretenir',
      court: 'Entretien de soi',
      lyceeOnly: true,
      afc: {
        ly: [
          'AFL1 — S\'engager pour obtenir les effets recherchés selon son projet personnel, en faisant des choix de paramètres d\'entraînement cohérents avec le thème retenu.',
          'AFL2 — S\'entraîner, individuellement ou collectivement, pour développer ses ressources et s\'entretenir en fonction des effets recherchés.',
          'AFL3 — Coopérer pour faire progresser.',
        ],
      },
    },
  ];

  const CYCLE_LABEL = { c3: 'Cycle 3 (6e)', c4: 'Cycle 4 (5e – 3e)', ly: 'Lycée (2nde – Tle)' };

  /** Domaines du socle commun mobilisés en EPS (collège). */
  const SOCLE = [
    'D1 — Développer sa motricité et apprendre à s\'exprimer en utilisant son corps',
    'D2 — S\'approprier par la pratique physique et sportive des méthodes et outils',
    'D3 — Partager des règles, assumer des rôles et des responsabilités',
    'D4 — Apprendre à entretenir sa santé par une activité physique régulière',
    'D5 — S\'approprier une culture physique sportive et artistique',
  ];
  /** Objectifs généraux du lycée. */
  const OG_LYCEE = [
    'OG1 — Développer sa motricité',
    'OG2 — Savoir se préparer et s\'entraîner',
    'OG3 — Exercer sa responsabilité dans un engagement personnel et solidaire',
    'OG4 — Construire durablement sa santé',
    'OG5 — Accéder au patrimoine culturel',
  ];

  const DEGRES = ['Maîtrise insuffisante', 'Maîtrise fragile', 'Maîtrise satisfaisante', 'Très bonne maîtrise'];

  /** CA disponibles pour un niveau (6e–3e : CA1 à CA4 ; lycée : CA1 à CA5). */
  const caForLevel = (lvl) => CA.filter((c) => !c.lyceeOnly || EPS.store.isLycee(lvl));

  EPS.prog = { CA, CYCLE_LABEL, SOCLE, OG_LYCEE, DEGRES, caForLevel, caById: (id) => CA.find((c) => c.id === id) };
})(window.EPS);
