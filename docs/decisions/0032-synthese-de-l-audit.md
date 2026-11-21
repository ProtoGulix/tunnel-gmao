# 0032. Synthèse de l'audit et du partage des tâches

- Statut : accepté (2026-11-20, décisions de l'utilisateur)
- Date : 2026-11-20
- Prolonge : ADR 0021 (page « Organisation »), ADR 0029 (audit des cascades)

## Contexte

L'utilisateur a construit l'audit pour en tirer des pistes d'amélioration du service
(docs/backlog/page-synthese-audit.md). Depuis l'ADR 0029, les décisions et leurs
cascades sont tracées avec leur auteur. Sens des rôles dans le service (utilisateur,
2026-11-20) : la personne affectée à une tâche en est le garant ; les exécutants sont les
techniciens des actions liées ; plusieurs exécutants ou un tiers qui finit est un
fonctionnement normal. Base de dev, lecture seule, 3 derniers mois : 143 tâches, 6 sans
garant, 110 faites dont 26 sans action du garant, 70 repérées et faites par la même
personne ; `closed_by` rempli sur 12 seulement (fiable depuis l'ADR 0029).

## Décision

1. **Une page « Synthèse de l'audit »** du web, rangée à côté de la page « Organisation »,
   alimentée par `GET /stats/audit-synthese` (lecture seule, aucune migration). Ouverte à
   toute l'équipe (décision de l'utilisateur), droit `stats:get_audit_synthese` ouvert
   par défaut aux rôles qui lisent, comme `stats:get_organisation`.
2. **Uniquement des chiffres d'équipe** (règle de l'ADR 0021 point 2) : aucun nom,
   identifiant ni initiale, aucun classement par personne.
3. **Période par défaut : les 3 derniers mois** (décision de l'utilisateur), réglable ;
   chiffres par mois.
4. **Indicateurs**, chacun avec sa définition écrite à côté :
   - Tâches sans garant : tâches créées dans la période sans `assigned_to`.
   - Tâches faites sans action du garant : tâches « done » de la période dont le garant
     n'est le technicien d'aucune action liée (`intervention_action_task`).
   - Travail repéré sur le terrain : tâches « done » créées par leur garant, qui en est
     aussi l'un des exécutants.
   - Tâches partagées : tâches « done » avec au moins deux exécutants distincts.
   - Décisions hors travail normal : événements d'audit non système dont le motif est de
     catégorie user ou manual, par type de décision et par motif, par mois (clôtures,
     réouvertures, tâches ignorées ou closes sans action, occurrences ignorées...).
   - Part des modifications automatiques : événements système (`is_system`) parmi tous
     les événements, par mois, pour voir le poids des cascades.
5. **Lecture des chiffres anciens** : avant le 2026-11-20 (ADR 0029), `closed_by` et les
   cascades sont incomplets ; la page le signale pour les mois concernés. Les indicateurs
   de tâches s'appuient sur les techniciens des actions, présents depuis toujours, pas
   sur `closed_by`.

## Alternatives écartées

- Section ajoutée à la page « Organisation » : page déjà chargée ; l'utilisateur a demandé
  une page dédiée.
- Chiffres par technicien : contraire à l'ADR 0021 point 2 ; « affecté ≠ exécutant »
  n'est pas une faute.
- Réservée à RESP et ADMIN : écarté par l'utilisateur.

## Conséquences

- Nouvelle route en lecture seule, nouveau droit créé par le bootstrap (à rejouer en
  production à la mise à jour, comme pour l'ADR 0021).
