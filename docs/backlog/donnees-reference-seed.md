# Données de référence à corriger (tri du 2026-11-19)

backend/db/seed_reference.sql (réserve de l'étape 3c) :
- purchase_status : code, label et order_index à NULL, libellé dans `value` (l.261-265).
- Statuts d'intervention sans libellé ni couleur (l.251-254) : voir
  referentiel-types-statuts-en-base.md.
- complexity_factor : fautes et casse (« piéces », « veillisante »..., l.221-223).
- audit_reason_code : accents manquants (« ete », « assigne », « nest », « priorite », ~l.169-171).
- Table héritée `schema_migrations` encore présente (db/schema.sql:2481).
Une correction des libellés en production passe par une migration (accord requis).
