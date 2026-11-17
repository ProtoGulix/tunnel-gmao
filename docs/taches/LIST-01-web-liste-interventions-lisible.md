# LIST-01. Rendre la liste des interventions plus lisible

- Statut : faite (2026-11-17)
- Agent : principal
- Branche : feat/liste-interventions-lisible (depuis develop, ADR 0008)
- Dépend de : rien
- Périmètre d'écriture : web/src/components/interventions/InterventionsTabContent.jsx et
  InterventionListItem.jsx (nouveau, limite de 200 lignes), InterventionPanelHeader.jsx
  et InterventionPanelHeaderParts.jsx (en-tête du panneau, demande du 2026-11-17),
  web/src/api/interventions.js et web/src/lib/api/singleBody.js (+ test) pour le bug
  d'en-tête vidé signalé par l'utilisateur le 2026-11-17 (commit fix séparé),
  cette fiche, docs/ETAT.md, CHANGELOG.md, docs/backlog/ ; ni API, ni backend, ni données

## Contexte

Dans la liste maître de la page Interventions, le titre passe après deux badges pleins
(code intervention et code machine), les badges flottent à des positions variables
(`justify="between"`), le statut « Ouvert » ou « Fermé » est répété sur chaque ligne
alors que le groupe le dit déjà, et « RETARD » s'affiche en rouge plein sur des
interventions fermées. Proposition validée par l'utilisateur le 2026-11-17.

## Critères d'acceptation

- [x] Ligne 1 : titre en gras sur toute la largeur, échéance à droite seulement si
      l'intervention n'est ni fermée ni annulée
- [x] Ligne 2 alignée : équipement mis en valeur à gauche (code machine en badge à
      contraste fort, nom lisible) ; date de signalement à droite, au format de la liste
      des DI (le code reste dans le panneau de détail et la recherche ; retours de
      l'utilisateur du 2026-11-17)
- [x] Statut affiché seulement s'il n'est ni « Ouvert » ni « Fermé »
- [x] Sélecteur sous la recherche (À faire, Bloqué, Projets, À archiver, Tout) avec
      les nombres ; « À faire » par défaut ; séparateurs de groupe seulement dans
      « Tout » (demande de l'utilisateur du 2026-11-17)
- [x] Lignes un peu plus aérées que la densité partagée (réglage local à la liste)
- [x] En-tête du panneau : équipement mis en valeur comme dans la liste, code
      intervention lisible, titre plus grand, type en clair (Projet, Curatif...)
- [x] Changement de statut ou de priorité : l'en-tête reste complet (test
      singleBody.test.js, vérifié à l'écran)
- [x] Liseré gauche de priorité avec infobulle ; sélection inchangée
- [x] Vérifié à l'écran par l'utilisateur
- [x] scripts/check.sh vert ; lint du front sans nouvelle erreur
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait par l'agent principal, en cinq allers-retours avec l'utilisateur à l'écran :
liste à deux lignes (titre et échéance ; équipement en valeur et date de signalement),
sélecteur de groupe sous la recherche (« À faire » par défaut), lignes plus aérées
(réglage local), en-tête du panneau retravaillé (équipement, code lisible, titre plus
grand, type en clair). Bug signalé en cours de route et corrigé à part (commit fix) :
en-tête vidé après un changement de statut ou de priorité, cause dans l'intercepteur
du client (réglée par l'ADR 0022, ENV-01 et ENV-02).

Fichiers : InterventionsTabContent.jsx, InterventionListItem.jsx (nouveau),
InterventionPanelHeader.jsx, InterventionPanelHeaderParts.jsx, api/interventions.js,
lib/api/singleBody.js et son test, CHANGELOG, deux notes de backlog.

Tests : scripts/check.sh vert (pytest 369, node 45 dont 3 nouveaux singleBody) ; eslint
sans erreur sur les fichiers créés ou réécrits. Commandes en échec en cours de route :
eslint sur InterventionsTabContent.jsx (complexité 11 et caractère « · » interdit),
puis sur InterventionPanelHeader.jsx (complexité 11), corrigées en découpant. Erreurs
eslint préexistantes laissées en l'état : api/interventions.js ligne 55 (complexité),
et d'autres fichiers du dossier interventions.

Choix laissés à l'utilisateur, non faits : mémoriser le groupe choisi entre deux visites.
NON VÉRIFIÉ : le nom de machine « 0 » de certains équipements est une donnée de base, à
corriger dans la fiche équipement, pas dans l'affichage.
