#!/usr/bin/env bash
# Spike 3a : régénère 01_schema.sql, 02_seed_reference.sql, 03_seed_douteux.sql
# depuis la base de dev, en LECTURE SEULE (pg_dump uniquement).
set -euo pipefail
cd "$(dirname "$0")"
DEV=gmao-mvp-db-1
EXCL=(-T 'directus_*' -T alembic_version -T alembic_version_backend)
dump() { docker exec "$DEV" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" '"$*"; }

REF=(tunnel_role request_status_ref request_type_ref home_view_ref intervention_status_ref
     purchase_status audit_reason_code audit_rule action_category action_category_meta
     action_subcategory complexity_factor anomaly_threshold equipement_statuts
     amelioration_category_ref amelioration_sous_statut_ref action_classification_probe)
DOUTEUX=(service equipement_class stock_family stock_sub_family part_template
         part_template_field part_template_field_enum preventive_rule)
tflags() { for t in "$@"; do printf -- "-t public.%s " "$t"; done; }

{ echo "-- Schéma de départ Tunnel (spike 3a). Généré par pg_dump --schema-only de la dev,"
  echo "-- sans tables Directus ni alembic_version*. Extensions : unaccent, uuid-ossp."
  dump "--schema-only --no-owner --no-privileges ${EXCL[*]@Q}" \
    | grep -vE '^\\(restrict|unrestrict)'; } > 01_schema.sql

emit() { # fichier titre tables...
  local f=$1 title=$2; shift 2
  { echo "-- $title (idempotent : ON CONFLICT DO NOTHING). Généré par extract.sh."
    dump "--data-only --no-owner --no-privileges --inserts --on-conflict-do-nothing $(tflags "$@")" \
      | grep -vE '^\\(restrict|unrestrict)|^SELECT pg_catalog.set_config'
  } > "$f"
}
emit 02_seed_reference.sql "Données de RÉFÉRENCE (nécessaires au fonctionnement)" "${REF[@]}"
emit 03_seed_douteux.sql "Référentiels DOUTEUX (propres à l'usine d'origine, à valider avant livraison)" "${DOUTEUX[@]}"

# Remise à niveau des séquences des tables à identifiant serial
for f in 02_seed_reference.sql 03_seed_douteux.sql; do
  case $f in
   02*) T="action_category action_subcategory action_classification_probe anomaly_threshold audit_reason_code audit_rule equipement_statuts";;
   03*) T="preventive_rule";;
  esac
  for t in $T; do
    echo "SELECT setval(pg_get_serial_sequence('public.$t','id'), COALESCE(MAX(id),0)+1, false) FROM public.$t;" >> $f
  done
done
