# PREV-16. Santé d'un équipement : préventif en retard

- Statut : faite (2026-11-19)
- Agent : principal
- Branche : feat/preventif-suivi-equipement
- Dépend de : PREV-14 (échéancier partagé)
- Périmètre d'écriture : backend/api/equipements/ (santé), backend/api/preventive_occurrences/repo.py
  (requête de l'échéancier partagée), tests d'intégration, docs/api/endpoints/equipements.md,
  CHANGELOG, ETAT, cette fiche.

## Contexte

Retour de l'utilisateur à l'essai (2026-11-19, capture mobile) : un équipement dont le
préventif est en retard reste « OK » côté santé. Le statut de marche (En service) n'est
pas concerné : c'est un choix humain. Choix de l'utilisateur : un préventif en retard met la
santé en « Attention » (warning), sauf niveau plus grave.

## Critères d'acceptation

- [x] Règle `OVERDUE_PREVENTIVE > 0` : warning, raison « N préventif(s) en retard », si le
      niveau était ok ou maintenance (test d'intégration)
- [x] Préventif à jour : santé inchangée (test d'intégration)
- [x] Même règle que l'échéancier (requête partagée), calcul en lot pour les listes
- [x] Champ `overdue_preventive_count` dans la santé, doc d'endpoint à jour
- [x] check.sh et test-integration.sh verts

## Compte rendu final

Requête de l'échéancier extraite (`_fetch_schedule_rows`), réutilisée par
`overdue_counts(cur, machine_ids, today)` ; `_fetch_health_inputs` y ajoute
`overdue_preventive_count` pour tous les appels (liste, détail, /health, interventions).
« Travaux en cours sans affectation » garde sa raison quand les deux règles jouent (même
niveau, testée après). check.sh vert, 425 tests d'intégration verts. Non vérifié : rendu à
l'écran, temps de réponse de la liste des équipements sur la base de dev.
