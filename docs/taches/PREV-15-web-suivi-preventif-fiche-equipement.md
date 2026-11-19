# PREV-15. Web : suivi du préventif sur la fiche équipement

- Statut : faite (2026-11-19), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/preventif-suivi-equipement (depuis develop), worktree de la sous-branche
  feat/preventif-suivi-equipement-prev15
- Dépend de : PREV-14 (contrat d'API fixé dans sa fiche)
- Périmètre d'écriture : web/src/components/equipements/ (EquipementActivity, onglet ou
  fenêtre Préventif, nouveaux composants), web/src/hooks/preventive/,
  web/src/api/preventiveOccurrences.js, web/src/config/preventiveConfig.js, tests front
  éventuels, cette fiche. Exclu : backend, mobile, toute nouvelle dépendance (recharts est
  déjà là).

## Contexte

Demande de l'utilisateur du 2026-11-19, web seulement. L'état du préventif n'est visible
aujourd'hui que dans la fenêtre « Détail » du bloc Préventif de la fiche équipement
(EquipementActivity.jsx, EquipementPreventifTab.jsx).

## Critères d'acceptation

- [x] Bloc Préventif de la fiche : pastille visible sans rien ouvrir, « Préventif à jour »
      (vert) ou « N en retard » (rouge), d'après l'échéancier ; rien d'affiché (pas
      d'erreur) sans le droit de l'échéancier
- [x] Liste dédiée « Interventions préventives » (GET history) : plan, échéance,
      réalisation, écart en pastille (« −5 j » en avance, « +12 j » en retard, « à
      l'heure » à 0), état, lien vers l'intervention ou la demande
- [x] Courbe recharts de l'écart par réalisation : une série par plan, ligne zéro =
      échéance, avance en dessous, retard au-dessus, info-bulle avec date et écart ; état
      vide lisible sans réalisation
- [x] Bouton « Lancer en avance » par plan (plans à périodicité, sans occurrence en cours),
      avec confirmation, visible seulement avec le droit d'anticipate ; après succès,
      échéancier et historique rafraîchis ; erreurs 409 et 422 affichées en clair
- [x] Conventions de docs/guides/conventions-web.md et architecture-web.md
- [x] Build web vert, lint sans nouvelle erreur, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur avant fusion (validé le 2026-11-19, après le déplacement de la section Préventif avant « État et évolution »)

## Compte rendu final


Fait : pastille d'état dans le bloc Préventif (EquipementActivity, hook usePreventiveFollow) ;
liste « Interventions préventives » et courbe d'écart recharts chargée à la demande
(EquipementPreventifHistory, EquipementPreventifChart) dans la fenêtre Détail ; bouton
« Lancer en avance » avec confirmation (AnticipatePlanButton), erreurs 409 et 422 affichées
via le message du backend ; échéancier et historique rafraîchis après succès. Le résumé
« en attente » du bloc (donnée de GET /equipements/{id}) n'est pas rechargé après un
lancement : il se met à jour à la réouverture de la fiche.

Droits : noms `preventive_occurrences:get_history` et
`preventive_occurrences:anticipate_occurrence` (auth/permissionCodes.js), confirmés
contre les fonctions de route de PREV-14 à l'intégration. Sans le droit : pastille, historique et bouton absents.

Vérifié : npm test (52 verts, dont deltaBadgeLabel et historyChartData), npm run build,
npm run lint (509 problèmes avant et après), scripts/check.sh vert. Non vérifié : rendu à
l'écran, contrat réel du backend.
