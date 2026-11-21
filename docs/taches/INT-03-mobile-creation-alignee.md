# INT-03. Mobile : création d'intervention alignée sur le web

- Statut : faite (2026-11-20), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/creation-intervention-atomique, worktree de la sous-branche
  feat/creation-intervention-atomique-int03
- Dépend de : INT-01, ADR 0025
- Périmètre d'écriture : mobile/src/components/actions/ActionForm.jsx (DIInlineForm,
  InterventionInlineForm), mobile/src/api/, composants mobiles nouveaux de création,
  tests éventuels, cette fiche. Exclu : backend, web, dépendances, clôture (INT-04).

## Contexte

Décisions de l'utilisateur du 2026-11-20 : le mobile s'aligne sur la fenêtre de création
du web et permet toujours de créer une intervention. Aujourd'hui (ActionForm.jsx l.520)
la création n'est proposée que sans intervention ouverte, la demande se crée à part, le
technicien est forcé, le type par défaut est le premier de la liste, pas de tâches.

## Critères d'acceptation

- [x] Création proposée même si l'équipement a des interventions ouvertes
- [x] Un seul appel `POST /interventions` : demande existante (nouvelle ou en attente) ou
      nouvelle demande dans le même formulaire, tâches facultatives
- [x] Technicien au choix (utilisateur connecté par défaut), titre obligatoire, type CUR
      par défaut, demandeur : saisie sinon nom du technicien, comme le web
- [x] Erreur affichée sans rien créer ; saisie en moins d'une minute conservée (CLAUDE.md 2.2)
- [x] Build (pas de lint dans mobile), lint sans nouvelle erreur, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-20)

## Compte rendu final

Fait. Nouveau composant `mobile/src/components/actions/InterventionCreateForm.jsx` (un
formulaire, un appel `POST /interventions`) qui remplace DIInlineForm et
InterventionInlineForm ; `ActionForm.jsx` propose toujours « Nouvelle intervention » (même
avec des interventions ouvertes). `getActiveUsers` ajouté à `mobile/src/api/planning.js`.
Demande existante (nouvelle ou en attente) ou nouvelle demande (demandeur, service ; droit
`createRequest` exigé), technicien au choix (défaut : utilisateur connecté), type CUR par
défaut, titre obligatoire, tâches facultatives, `tech_initials` plus envoyé. Erreur : message
affiché, saisie conservée. Écarts : date de signalement retirée du formulaire (le backend
la défaute) ; en mode nouvelle demande, le titre sert de description de la demande (comme le
web). Vérifié : `npm run build` ; pas de script lint ni test dans mobile. Essai à l'écran à faire.
