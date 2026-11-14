# 0019. Une intervention vient toujours d'une demande

- Statut : accepté (2026-11-14, décisions de l'utilisateur)
- Date : 2026-11-14
- Affine : ADR 0018 (étape 2), CLAUDE.md section 2 point 4

## Contexte

Essai à l'écran de l'étape 1 d'AUDC (2026-11-14) : la suppression de l'intervention
L014-PRE-20260616-QC a laissé sa demande DI-2026-0167 « acceptée » vers une intervention
qui n'existe plus. `InterventionRepository.delete` ne regarde pas la demande liée, et
`intervention_request.intervention_id` n'a pas de clé étrangère.

Règle métier de l'utilisateur : une intervention vient toujours d'une demande. Elle n'est
pas appliquée : `POST /interventions` accepte une intervention sans demande, et 198
interventions sur 321 en base de dev (2026-11-14) n'ont pas de demande. Ce sont les
données d'avant la séparation de l'intervention et de la demande.

## Décision

1. `POST /interventions` exige une demande (`request_id` obligatoire). Changement d'API
   publique accepté par l'utilisateur.
2. Supprimer une intervention oblige à choisir l'issue de sa demande, avec un motif :
   a) rouvrir la demande : retour à « nouvelle », lien retiré, événement d'audit sur la
      demande ;
   b) supprimer la demande en cascade : ligne `deleted` pour l'intervention et pour la
      demande.
   Chaque issue est tout ou rien dans la transaction de requête (ADR 0018). Sans choix
   explicite, la suppression est refusée. Les règles actuelles restent : pas de
   suppression d'une intervention qui a des actions ou des achats liés. Une intervention
   fermée ne se supprime pas (règle de l'utilisateur, 2026-11-14 : le code l'autorisait,
   4 cas possibles en base de dev). Une demande liée à une occurrence préventive ne se
   supprime pas en cascade ; sa réouverture remet l'occurrence à « generated ». Le front propose
   les deux issues dans la fenêtre de suppression.
3. Les interventions sans demande existantes restent telles quelles : aucune demande
   reconstituée, aucune contrainte en base qui les refuserait. La règle est tenue par
   l'API pour les nouvelles interventions. Une intervention ancienne sans demande se
   supprime sans choix d'issue.

## Alternatives écartées

- Refuser toute suppression d'intervention (clôture ou annulation seulement) : écarté par
  l'utilisateur, une intervention ouverte par erreur doit pouvoir disparaître.
- Rouvrir la demande sans laisser le choix : ne couvre pas la demande elle-même créée
  par erreur.
- Clé étrangère et intervention_id NOT NULL côté intervention : impossible sans toucher
  aux 198 interventions historiques, refusé par l'utilisateur.

## Conséquences

- Les fronts qui créent une intervention sans demande doivent passer par une demande
  (à recenser écran par écran, AUDC-27).
- La route de suppression prend un paramètre d'issue ; un client ancien qui ne l'envoie
  pas reçoit une erreur 400 explicite pour une intervention liée à une demande.
