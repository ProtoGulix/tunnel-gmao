# Contraintes : comparer aussi par définition

Relecture de CONT-01 (2026-11-19). La migration 0018 et son test comparent les contraintes et
index par nom (ADR 0024) : sur une base de contributeur, un objet de même nom mais de
définition différente est ignoré en silence. Pistes : journaliser un avertissement dans 0018
pour un écart de définition, et un test d'intégration qui compare pg_get_constraintdef et
pg_get_indexdef aux définitions de la migration. Un test qui empêche une route classée
NO_WRITE dans api/audits/exclusions.py de se mettre à écrire serait utile aussi.
