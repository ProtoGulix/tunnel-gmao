# 0027. Une intervention ne se clôt que par sa route de mise à jour

- Statut : accepté (2026-11-20, décision de l'utilisateur)
- Date : 2026-11-20
- Affine : ADR 0025 point 5 (clôture proposée par le mobile)

## Contexte

Deux routes ferment une intervention. `PUT /interventions/{id}` avec `status_actual = 'ferme'`
refuse la clôture tant que des tâches non optionnelles sont à faire ou en cours
(`_check_closable`) et applique la règle d'audit de la clôture (fenêtre de motif commune).
`POST /intervention-status-log` avec `status_to = 'ferme'` clôt par le trigger
`trg_sync_status_log_to_intervention` sans ce contrôle, en `events_only` : aucun motif ne
serait demandé si la règle d'audit en exigeait un. Le bouton « Statut » du mobile l'utilise ;
le web ne s'en sert pas pour clore. Base de dev, lecture seule, 2026-11-20 : 398 clôtures
passées par le journal, 3 interventions fermées gardent des tâches obligatoires ouvertes.

## Décision

1. `POST /intervention-status-log` refuse `status_to = 'ferme'` (400, message qui renvoie à
   la clôture depuis la fiche de l'intervention). Les autres statuts ne changent pas.
2. Le bouton « Statut » du mobile clôt par `PUT /interventions/{id}`, comme le web et comme
   la proposition de clôture après la dernière tâche : contrôle des tâches, fenêtre de motif
   si la règle d'audit l'exige.
3. Les 3 interventions fermées avec des tâches ouvertes restent en l'état (décision de
   l'utilisateur) ; elles sont notées au backlog.

Changement d'API publique accepté par l'utilisateur le 2026-11-20.

## Alternatives écartées

- Appliquer le contrôle des tâches aussi dans la route du journal : deux voies de clôture à
  garder alignées, et la règle d'audit de la clôture n'y serait pas demandée.

## Conséquences

- Un client qui fermait par le journal reçoit 400 et doit passer par la mise à jour.
- La réouverture et l'annulation par le journal ne passent pas non plus par l'audit : point
  noté au backlog, hors de cette décision.
