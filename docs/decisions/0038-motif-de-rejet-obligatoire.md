# 0038. Rejeter une demande d'intervention exige un motif choisi

- Statut : accepté (2026-11-21, accord de l'utilisateur)
- Date : 2026-11-21
- Affine : CLAUDE.md section 2.4 ; ADR 0017, 0018 (audit centralisé) ; DEMO-08 (règle
  `request.status_to` routinière)

## Contexte

Les transitions d'une demande (mise en attente, acceptation, rejet) passent par une seule
règle d'audit, sur le champ `request.status_to`. Routinière (production, et données de
départ depuis DEMO-08), elle laisse passer un rejet sans motif ; non routinière, elle
demandait un motif absurde à chaque acceptation. Le web compte sur cette règle pour
demander le motif de rejet. Un rejet est une décision hors du travail normal : il doit
avoir un motif (CLAUDE.md 2.4), lisible par le demandeur et par l'analyse.

## Décision

1. Le statut cible `rejetee` exige un motif choisi, quelle que soit la règle
   `request.status_to` : l'API refuse le rejet sans motif avec la réponse habituelle
   « motif requis » (même contrat que les autres décisions, la fenêtre commune du front
   s'ouvre), et seuls les motifs de rejet sont proposés.
2. Motifs de rejet en données de référence, ajoutés par une migration idempotente :
   « Hors du périmètre de la maintenance », « Doublon d'une demande existante », « Déjà
   traité », « Demande incomplète ou incompréhensible », et « Autre raison » (texte
   obligatoire, comportement existant).
3. Les autres transitions (mise en attente, acceptation) restent routinières.

## Alternatives écartées

- Règle d'audit par valeur de champ (statut cible) : extension du mécanisme des règles
  pour un seul cas.
- Fenêtre de rejet propre au front : un second chemin de saisie à côté de la fenêtre
  commune, interdit par CLAUDE.md 2.4.
- Rendre `request.status_to` non routinière : chaque acceptation redemanderait un motif.

## Conséquences

- Migration de données de référence (motifs), jouée au démarrage de l'API.
- Les rejets passés sans motif restent tels quels (aucune reprise).
