# TPE-01. Table des types permis par classe d'équipement (migration 0023)

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ, essai à l'écran validé)
- Agent : db-dev
- Branche : feat/types-par-equipement (worktree ../wt-tpe-01)
- Dépend de : ADR 0031 (point 1)
- Périmètre d'écriture : backend/alembic/versions/0023_*.py, backend/tests/ (tests de
  migration, version attendue du bootstrap), CHANGELOG.md, cette fiche. Exclu : code
  applicatif, schema.sql, base de dev.

## Critères d'acceptation

- [x] Migration `0023_types_par_classe` (id ≤ 32), down_revision `0022_auteur_des_journaux` :
      table `equipement_class_intervention_type (equipement_class_id uuid, intervention_type_code
      varchar)` (type de colonne aligné sur `intervention_type.code`), PK sur le couple, FK
      vers equipement_class (ON DELETE CASCADE) et intervention_type(code) (ON UPDATE
      CASCADE si le code est modifiable, sinon défaut), index utile pour la lecture par classe.
- [x] Idempotente, aucune ligne insérée ; downgrade : suppression de la table, documenté.
- [x] Droits du rôle applicatif sur la table alignés sur ceux des autres tables (voir
      comment les migrations précédentes ou le bootstrap accordent les droits).
- [x] Tests : migration rejouée deux fois, downgrade puis upgrade, contraintes présentes ;
      test_bootstrap_integration attend 0023.
- [x] scripts/check.sh vert ; test-integration.sh complet vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Migration 0023_types_par_classe livrée : table equipement_class_intervention_type (PK sur le
couple, FK classe ON DELETE CASCADE, FK type(code) ON UPDATE CASCADE car le code est
modifiable, index sur le code du type), vide, idempotente. Droits : aucun GRANT, les
privilèges par défaut du bootstrap les donnent au rôle applicatif (vérifié par un test).
Effet sur les données : aucun. Retour arrière : DROP TABLE de la table (listes saisies perdues).
Tests : test_tpe01_types_par_classe_integration.py (8), bootstrap attend 0023 ; intégration
complète 547 passed, 0 failed ; check.sh vert. Jouée uniquement sur bases jetables, jamais en dev.
