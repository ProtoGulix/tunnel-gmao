# 0028. Rouvrir une intervention fermée exige un motif

- Statut : accepté (2026-11-20, décisions de l'utilisateur)
- Date : 2026-11-20
- Affine : ADR 0027 (une seule porte de clôture), CLAUDE.md 2.4

## Contexte

Rouvrir une intervention fermée est un changement hors du travail normal (CLAUDE.md 2.4).
Aujourd'hui il passe par le journal de statut (`POST /intervention-status-log`, sortie de
« ferme »), en `events_only`, sans motif ; la règle d'audit des interventions est
routinière. La demande liée reste « clôturée ». Base de dev, lecture seule, 2026-11-20 :
17 interventions rouvertes (19 passages depuis « ferme »), 2 interventions ouvertes dont la
demande est clôturée. Le statut « annulé » n'existe pas dans intervention_status_ref : le
journal le refuse déjà, rien à traiter.

## Décision

1. Le journal de statut refuse toute sortie de « ferme » (400), comme il refuse d'y entrer
   (ADR 0027). Rouvrir passe par `PUT /interventions/{id}`.
2. Une mise à jour qui fait sortir l'intervention de « ferme » exige un motif explicite de
   catégorie user ou manual dont `decision_types` contient `intervention_reopened` ; sans
   lui (ROUTINE injecté, motif auto ou system), réponse standard « motif requis » avec ces
   motifs (même mécanisme que la clôture directe d'une tâche, ADR 0016). OTHER exige un
   texte libre.
3. Motifs (migration 0021, données de départ) : « Clôturée par erreur »
   (INTERVENTION_CLOSED_BY_MISTAKE), « Travail à reprendre » (INTERVENTION_REWORK), et la
   décision `intervention_reopened` ajoutée à OTHER.
4. La demande liée clôturée repasse « acceptée » dans la même transaction, avec un
   événement du système (SYSTEM_CASCADE) ; elle se reclôturera avec l'intervention.
5. Web : la fenêtre de motif globale (useAuditGuard) traite la réponse sans changement.
   Mobile : la feuille de statut d'une intervention fermée passe par la mise à jour et la
   fenêtre de motif commune (AuditReasonSheet).

## Alternatives écartées

- Garder la réouverture par le journal en y ajoutant un motif : deux portes, la règle de la
  mise à jour et celle du journal à garder alignées (raison de l'ADR 0027).
- Laisser la demande clôturée : intervention ouverte sous une demande close, incohérence
  déjà présente en base.

## Conséquences

- Changement d'API et migration acceptés par l'utilisateur le 2026-11-20.
- L'occurrence préventive liée (passée à « completed » à la clôture) n'est pas modifiée par
  la réouverture : point noté au backlog.
