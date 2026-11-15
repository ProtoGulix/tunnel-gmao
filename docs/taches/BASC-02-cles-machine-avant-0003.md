# BASC-02. Clés de l'arbre des équipements avant la migration 0003

- Statut : faite (2026-11-15)
- Agent : principal
- Branche : fix/bascule-depuis-3.57
- Dépend de : BASC-01, spike 0003 section 3, migration 0003 (ADR 0011)
- Périmètre d'écriture : `deploy/rattrapage-029.sql`, `deploy/MIGRATION-v4.md`,
  `docs/spikes/0003-bascule-depuis-3.57.md`, `CHANGELOG.md`

## Contexte

La source 3.57.0 a déjà les 3 clés étrangères de `machine` (NO ACTION), dont deux sous
le nom exact que crée la migration 0003 : le bootstrap échoue (`already exists`).
Décision de l'utilisateur du 2026-11-15 : le rattrapage les retire, 0003 les recrée en
ON DELETE RESTRICT. Seule exception à la règle « aucun DROP » de BASC-01.

## Critères d'acceptation

- [x] `rattrapage-029.sql` retire `machine_equipement_class_id_fkey`,
      `machine_statut_id_fkey`, `machine_equipement_mere_foreign` (IF EXISTS), en fin de
      transaction, avec le motif en commentaire.
- [x] Répétition complète depuis une cible vide, sans retouche manuelle : script jusqu'à
      `7/7 terminé`, bootstrap jusqu'à la tête, les 3 clés présentes en RESTRICT.
- [x] MIGRATION-v4.md et CHANGELOG à jour.

## Compte rendu final

Répétition complète du 2026-11-15 (commit 1ed6a63, cible vide, aucune retouche) :
script `7/7 terminé` (866 objets de référence présents ; en plus : 89 contraintes,
66 index ; 67 tables aux lignes identiques ; empreinte des comptes identique), bootstrap
0003 à 0013 sans erreur, 3 clés de `machine` en ON DELETE RESTRICT, motifs TASK_* posés,
LEGACY_STATUS_CHANGE inactif, 10 comptes, 411 interventions, 1604 actions comme la source.
