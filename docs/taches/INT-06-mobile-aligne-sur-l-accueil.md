# INT-06. Mobile : création alignée sur le formulaire de l'accueil

- Statut : faite (2026-11-20), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/creation-intervention-atomique, worktree de la sous-branche
  feat/creation-intervention-atomique-int06
- Dépend de : INT-03, ADR 0025 (point 4 révisé)
- Périmètre d'écriture : mobile/src/components/actions/ (InterventionCreateForm.jsx,
  ActionForm.jsx partie création seulement), mobile/src/api/, cette fiche. Exclu : backend,
  web, CloseInterventionPrompt, dépendances.

## Contexte

Décision de l'utilisateur du 2026-11-20 après l'essai à l'écran : la référence est le
formulaire de l'accueil du web (DayContextRightColumn), pas la fenêtre de Coordination
suivie par INT-03.

## Critères d'acceptation

- [x] Mêmes champs et règles que l'accueil : demande existante choisie, ou saisie
      (demandeur, service facultatif, description obligatoires comme à l'accueil) ; titre =
      description de la demande, pas de champ titre ; date de prise en charge ; technicien
      pilote ; type (verrouillé pour une demande système avec type suggéré) ; priorité
- [x] Pas de tâches à la création
- [x] Création toujours proposée, un seul appel, saisie conservée après erreur (acquis
      d'INT-03 gardés)
- [x] Build mobile, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-20)

## Compte rendu final

2026-11-20 : InterventionCreateForm.jsx réécrit sur le modèle de l'accueil : demande choisie
(type suggéré prérempli, verrouillé si demande système) ou saisie (demandeur et description
obligatoires, service facultatif), titre = description, date de prise en charge (jour,
reported_date), technicien pilote, type, priorité, status_actual « ouvert », reported_by
comme l'accueil. Plus de titre ni de tâches. Un seul appel, saisie conservée après erreur.
Build mobile et scripts/check.sh verts. Écart : la date est un jour (comme le web, qui
tronque à la date), le mobile n'a pas d'heure.
