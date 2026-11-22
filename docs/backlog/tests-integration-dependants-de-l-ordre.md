TRAITÉ (2026-11-22) : les tests de retour arrière de 0021 et 0027 vérifient que les motifs
déjà cités par le journal sont gardés et les autres retirés, quel que soit l'ordre des fichiers
(prouvé en lançant d'abord les tests qui écrivent dans le journal).

# Tests d'intégration dépendants de l'ordre des fichiers

Constat du reviewer, chantier IRR (2026-11-22). Gravité : dette de tests.

`test_motifs_reouverture_migration_integration.py::test_retour_arriere_puis_remontee` exige
qu'aucune ligne d'audit ne référence encore les motifs de réouverture : le retour arrière de la
migration 0021 garde, à dessein, un motif déjà utilisé. Les fichiers qui rouvrent des
interventions avec motif (test_reouverture_integration.py, test_reouverture_archivee_irrevocable_integration.py)
ne passent que parce que leur nom les range après. Un renommage casserait la suite sans signal.

Correctif proposé : faire tourner ce test de retour arrière sur un état connu (motifs non
référencés), par exemple en lui faisant créer puis vérifier son propre état, ou en le
déclarant explicitement en tête de suite ; toucher à cette assertion existante demande
l'accord de l'utilisateur (CLAUDE.md 7.4).

Même cas pour la migration 0027 (chantier REM) : test_motifs_remise_a_faire_migration_integration.py
avant test_taches_remise_a_faire_integration.py.
