# EPS Pro — application de l'équipe EPS

Application web pour les professeurs d'EPS d'un établissement : profil, classes et élèves avec photos, emploi du temps importé depuis le PDF de l'établissement, calendrier, emplois du temps de l'équipe, champs d'apprentissage avec plans de séquence, plans de séance et fiches d'évaluation.

## Lancer l'application

Aucune installation : ouvrez `index.html` dans Chrome, Edge, Firefox ou Safari (double-clic).
Pour l'utiliser depuis plusieurs appareils, déposez le dossier sur n'importe quel hébergement statique (ENT, GitHub Pages, Netlify…).

Les données sont enregistrées **dans le navigateur, sur l'appareil** (localStorage + IndexedDB pour les photos et les PDF). Menu **Sauvegarde** pour exporter ou restaurer un fichier de sauvegarde.

## Fonctionnalités

| Menu | Contenu |
|---|---|
| Accueil | Cours du jour, prochain cours, événements à venir, statistiques, accès aux CA |
| Profil | Identité, établissement, périodes travaillées, statut et corps, missions, AS/UNSS, spécialités APSA, installations, qualifications secourisme (alerte d'échéance), préférences |
| Classes | Niveaux → classes (6e A, B…) → élèves avec photo, inaptitudes, remarques. Collage d'une liste d'élèves, import de photos en lot (fichiers `NOM_Prénom.jpg`). Dans chaque classe : onglet **Champs d'apprentissage** (4 CA au collège, 5 au lycée) et **fiche d'évaluation par activité** |
| Calendrier | Vue mensuelle : l'emploi du temps est reporté chaque semaine (semaines A/B, vacances exclues) + événements (UNSS, sorties, conseils…) |
| Mon emploi du temps | Import du **PDF** de l'établissement : lecture automatique (jours, horaires, classes, lieux, semaine A/B), vérification puis enregistrement. Le PDF original reste consultable |
| Emplois du temps des profs | Vue d'équipe et vue par installation, **détection des conflits** (deux profs au même endroit au même moment). Partage par fichier entre collègues |
| Champs d'apprentissage | CA → activité → niveau → **plan de séquence**, **plans de séance** (un par séance, minutage, consignes, critères, variables) et **fiche d'évaluation**. Dates calculées d'après l'emploi du temps de la classe. Bouton **Personnaliser** pour réécrire directement le document, **Imprimer / PDF** |
| Fiches d'évaluation | Grilles critériées par activité et niveau (4 degrés au collège ; AFL et points au lycée), positionnement des élèves, export CSV |

## Contenus pédagogiques

- `js/data/programmes.js` : CA1 à CA5, attendus de fin de cycle (cycles 3 et 4) et attendus de fin de lycée (AFL). Textes résumés d'après les programmes : **à vérifier avec les textes officiels en vigueur**.
- `js/data/activities.js` : activités par CA. 12 activités ont un contenu détaillé et adapté à chaque niveau (course de vitesse, demi-fond, saut en longueur, course d'orientation, escalade, acrosport, danse, badminton, handball, basket-ball, musculation, course en durée). Les autres activités utilisent une trame générique, à compléter.
- `js/data/generator.js` : mise en forme des documents (inspirée du modèle « Programmation – Atelier sportif 5e »).

Pour ajouter ou enrichir une activité, copiez le bloc d'une activité détaillée dans `activities.js` (les `{paramètres}` comme `{dist}` sont remplacés selon le niveau).

## Import du PDF d'emploi du temps

`js/lib/timetable-pdf.js` charge pdf.js depuis cdnjs (connexion internet nécessaire pour cette étape), lit les positions du texte et les cases dessinées, repère les colonnes de jours et les étiquettes horaires, puis en déduit chaque créneau. Le résultat est toujours présenté pour vérification. Si le PDF est scanné (image), la saisie se fait à la main à côté de l'aperçu du PDF.

## Évolutions possibles

- Compte en ligne et partage en temps réel de l'équipe (ex. Supabase), au lieu du partage par fichier.
- Appel en début de cours, suivi des inaptitudes avec certificats, AS (licenciés, résultats).
- Application installable (PWA) avec mode hors ligne complet.
