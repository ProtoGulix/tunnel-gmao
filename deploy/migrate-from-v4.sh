#!/usr/bin/env bash
# Bascule d'une instance Tunnel v4 vers la stack Compose du monorepo (ADR 0002, 0006).
#
#   cd deploy
#   export SOURCE_URL='postgresql://UTILISATEUR:MOT_DE_PASSE@HOTE:5432/directus'
#   ./migrate-from-v4.sh [--dump-file sauvegarde.dump] [--backup-dir DOSSIER]
#
# Étapes : contrôles préalables, dump complet de la source (lecture seule), restauration
# dans la base VIDE de la nouvelle stack, rattrapage du schéma si la source est à la
# révision 029 (rattrapage-029.sql), contrôle « la cible contient au moins le schéma d'une
# installation neuve » (backend/db/schema.sql), comparaison des données, puis alembic stamp.
# Le script NE DÉMARRE PAS l'api et ne lance JAMAIS le bootstrap : à faire à la main
# ensuite (voir MIGRATION-v4.md).
#
# Décisions (justifiées dans MIGRATION-v4.md) :
#  - les 26 tables directus_* ne sont pas restaurées (aucune dépendance, ADR 0006) ;
#  - les tables alembic_version et alembic_version_backend ne sont pas restaurées :
#    le stamp recrée alembic_version_backend avec la révision 0002_donnees_reference ;
#    schema_migrations (historique hérité) fait partie du schéma 0001 : conservée telle quelle ;
#  - tout est restauré par tunnel_owner (--no-owner --no-privileges) : il possède tout, le
#    rôle tunnel_app est créé et doté de ses droits par le bootstrap ;
#  - sources acceptées : révision 030_intervention_status_ref_code, ou exactement
#    002_create_missing_tables + 029_home_view (production 3.57.0, spike 0003) ; dans ce
#    second cas, rattrapage-029.sql est appliqué à la CIBLE après la restauration ;
#  - le stamp n'a lieu que si la cible contient tout le schéma de référence (colonnes,
#    contraintes, index, fonctions, déclencheurs, vues identiques) ; ce qui manque ou
#    diffère est affiché et le script s'arrête. Ce qui est en plus (contraintes et index
#    de l'ancienne base) est compté, sans bloquer.
#
# La source n'est jamais modifiée : pg_dump et SELECT, session en lecture seule.
# SOURCE_URL est visible dans la liste des processus pendant l'exécution : le lancer
# sur une machine de confiance.
#
# Variables de test (inutiles en exploitation) : DB_EXEC (défaut « docker compose exec -T db »),
# SOURCE_PSQL (commande psql de la source, remplace SOURCE_URL), STAMP_CMD, TARGET_DB, TARGET_USER.

set -euo pipefail

DIR=$(cd "$(dirname "$0")" && pwd)
SCHEMA_SQL="${SCHEMA_SQL:-$DIR/../backend/db/schema.sql}"
SOURCE_REV_030="030_intervention_status_ref_code"
SOURCE_REV_029="002_create_missing_tables,029_home_view"
RATTRAPAGE_SQL="${RATTRAPAGE_SQL:-$DIR/rattrapage-029.sql}"
SEED_SQL="${SEED_SQL:-$DIR/../backend/db/seed_reference.sql}"
# Tables créées par le rattrapage : absentes d'une source à 029, hors comparaison des lignes.
RATTRAPAGE_TABLES="amelioration_category_ref amelioration_sous_statut_ref request_type_ref"
SOURCE_MODE=""
TARGET_REV="0002_donnees_reference"
TARGET_DB="${TARGET_DB:-tunnel}"
TARGET_USER="${TARGET_USER:-tunnel_owner}"
DB_EXEC="${DB_EXEC:-docker compose exec -T db}"
STAMP_CMD="${STAMP_CMD:-docker compose run --rm --no-deps --entrypoint alembic api stamp $TARGET_REV}"
BACKUP_DIR="$DIR/backups-v4"
DUMP_FILE=""
REF_DB="tunnel_ref_$$"
WORK=""

say() { printf '[migrate-v4] %s\n' "$*"; }
die() { printf '[migrate-v4] ERREUR : %s\n' "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
    case "$1" in
        --dump-file) DUMP_FILE="${2:?--dump-file demande un fichier}"; shift 2 ;;
        --backup-dir) BACKUP_DIR="${2:?--backup-dir demande un dossier}"; shift 2 ;;
        -h|--help) sed -n '2,36p' "$0"; exit 0 ;;
        *) die "option inconnue : $1" ;;
    esac
done

[ -f "$SCHEMA_SQL" ] || die "backend/db/schema.sql introuvable (lancer depuis un clone complet)"
[ -f "$RATTRAPAGE_SQL" ] || die "rattrapage-029.sql introuvable"
[ -f "$SEED_SQL" ] || die "backend/db/seed_reference.sql introuvable (lancer depuis un clone complet)"
[ -n "${SOURCE_PSQL:-}" ] || [ -n "${SOURCE_URL:-}" ] || die "SOURCE_URL manquante (URL de la base v4)"
read -r -a DBX <<<"$DB_EXEC"

# psql / pg_dump / pg_restore de la base cible, exécutés dans le conteneur db.
tpsql() { local db="$1"; shift; "${DBX[@]}" psql -U "$TARGET_USER" -d "$db" -X -At -v ON_ERROR_STOP=1 "$@"; }
# psql de la source : session en lecture seule, SELECT uniquement.
RO_OPTIONS="-c default_transaction_read_only=on"
spsql() {
    if [ -n "${SOURCE_PSQL:-}" ]; then
        read -r -a SX <<<"$SOURCE_PSQL"
        PGOPTIONS="$RO_OPTIONS" "${SX[@]}" -X -At -v ON_ERROR_STOP=1 "$@"
    else
        "${DBX[@]}" env PGOPTIONS="$RO_OPTIONS" psql "$SOURCE_URL" -X -At -v ON_ERROR_STOP=1 "$@"
    fi
}

cleanup() {
    "${DBX[@]}" sh -c 'rm -f /tmp/v4.dump /tmp/v4.list' >/dev/null 2>&1 || true
    tpsql postgres -c "DROP DATABASE IF EXISTS \"$REF_DB\"" >/dev/null 2>&1 || true
    [ -z "$WORK" ] || rm -rf "$WORK"
}
trap cleanup EXIT
WORK=$(mktemp -d)

# Empreintes comparables source/cible : lignes par table et contenu des comptes
# (hachages de mots de passe inclus, comparés tels quels). Source à 029 : les tables du
# rattrapage sont exclues des deux côtés (absentes de la source, contrôlées à part).
count_sql() {
    local excl="" t
    if [ "$SOURCE_MODE" = "029" ]; then
        for t in $RATTRAPAGE_TABLES; do excl="$excl, '$t'"; done
    fi
    printf '%s' "SELECT table_name || '|' || (xpath('/row/c/text()', query_to_xml(
    format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'directus\\_%' AND table_name NOT IN ('alembic_version', 'alembic_version_backend'$excl)
  ORDER BY 1"
}
USERS_SQL="SELECT md5(coalesce(string_agg(u::text, '|' ORDER BY u.id), '')) FROM tunnel_user u"

# 1. Contrôles préalables -----------------------------------------------------
say "1/7 contrôles préalables"
tpsql "$TARGET_DB" -c "SELECT 1" >/dev/null || die "base cible $TARGET_DB injoignable (docker compose up -d db ?)"
tables=$(tpsql "$TARGET_DB" -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
[ "$tables" = "0" ] || die "la base cible $TARGET_DB n'est pas vide ($tables tables). Repartir d'une base vide : docker compose down -v (efface le volume de la NOUVELLE stack uniquement)."
if [ "$DB_EXEC" = "docker compose exec -T db" ] && [ -n "$(docker compose ps --status running -q api 2>/dev/null)" ]; then
    die "le service api de la nouvelle stack tourne : l'arrêter (docker compose stop api), il aurait installé une base neuve"
fi
src_rev=$(spsql -c "SELECT string_agg(version_num, ',' ORDER BY version_num) FROM alembic_version_backend") || die "source illisible"
case "$src_rev" in
    "$SOURCE_REV_030") SOURCE_MODE="030" ;;
    "$SOURCE_REV_029") SOURCE_MODE="029" ;;
    *) die "révision de la source '$src_rev', attendue '$SOURCE_REV_030' ou '$SOURCE_REV_029' : mettre la v4 à jour avant la bascule" ;;
esac
src_admins=$(spsql -c "SELECT count(*) FROM tunnel_user u JOIN tunnel_role r ON r.id = u.role_id WHERE r.code = 'ADMIN' AND u.is_active")
[ "$src_admins" -ge 1 ] || die "aucun admin actif dans la source : le bootstrap créerait un nouvel admin, bascule refusée"
spsql -c "$(count_sql)" > "$WORK/count.src"
src_users=$(spsql -c "$USERS_SQL")
say "source à la révision $src_rev (mode $SOURCE_MODE), $src_admins admin(s) actif(s), $(wc -l < "$WORK/count.src") tables métier"

# 2. Dump complet de la source ----------------------------------------------
say "2/7 dump de la source"
if [ -z "$DUMP_FILE" ]; then
    [ -n "${SOURCE_URL:-}" ] || die "sans SOURCE_URL, fournir --dump-file"
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
    DUMP_FILE="$BACKUP_DIR/v4-$(date +%Y%m%d-%H%M%S).dump"
    ( umask 077; "${DBX[@]}" env PGOPTIONS="$RO_OPTIONS" pg_dump -Fc "$SOURCE_URL" > "$DUMP_FILE" )
    say "dump complet (avec directus_*) : $DUMP_FILE : à conserver, il contient toutes les données"
else
    [ -s "$DUMP_FILE" ] || die "dump introuvable ou vide : $DUMP_FILE"
    say "dump fourni : $DUMP_FILE"
fi

# 3. Restauration par le propriétaire, sans directus_* ni tables de version -------
say "3/7 restauration dans $TARGET_DB (propriétaire $TARGET_USER, une seule transaction)"
"${DBX[@]}" sh -c 'cat > /tmp/v4.dump' < "$DUMP_FILE"
"${DBX[@]}" sh -c '
    set -e
    pg_restore -l /tmp/v4.dump | grep -Ev " (directus_|alembic_version)" > /tmp/v4.list
    pg_restore --single-transaction --exit-on-error --no-owner --no-privileges \
        -U "$1" -d "$2" -L /tmp/v4.list /tmp/v4.dump
' sh "$TARGET_USER" "$TARGET_DB" || die "restauration échouée : rien n'a été écrit (transaction annulée)"
if [ "$SOURCE_MODE" = "029" ]; then
    say "rattrapage de la cible (source 029) : $(basename "$RATTRAPAGE_SQL"), une transaction"
    tpsql "$TARGET_DB" -f - < "$RATTRAPAGE_SQL" >/dev/null || die "rattrapage échoué : transaction annulée, la cible contient la copie brute. Retour arrière : docker compose down -v"
fi
foreign=$(tpsql "$TARGET_DB" -c "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relowner <> (SELECT oid FROM pg_roles WHERE rolname = current_user)")
[ "$foreign" = "0" ] || die "$foreign objets n'appartiennent pas à $TARGET_USER"

# 4. Schéma restauré contre une installation neuve (0001) ----------------------------
say "4/7 comparaison du schéma avec une installation neuve (backend/db/schema.sql)"
tpsql postgres -c "CREATE DATABASE \"$REF_DB\"" >/dev/null
tpsql "$REF_DB" -f - < "$SCHEMA_SQL" >/dev/null
# Le contrôle porte sur le catalogue, pas sur un diff de pg_dump : l'ancienne base a plus
# de contraintes et d'index que la référence, et un diff de texte bougerait pour une
# simple contrainte en plus. Une ligne par objet : « catégorie|clé|définition ».
CATALOG_SQL=$(cat <<'EOSQL'
WITH t AS (
  SELECT c.oid, c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname NOT LIKE 'directus\_%' AND c.relname NOT LIKE 'alembic\_version%'
)
SELECT 'colonne|' || t.relname || '.' || a.attname || '|' || format_type(a.atttypid, a.atttypmod)
    || ' notnull=' || a.attnotnull || ' defaut=' || coalesce(pg_get_expr(d.adbin, d.adrelid), '')
    || ' identite=' || a.attidentity::text || ' generee=' || a.attgenerated::text
  FROM t JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE t.relkind IN ('r', 'p')
UNION ALL
SELECT 'contrainte|' || t.relname || '.' || k.conname || '|' || pg_get_constraintdef(k.oid)
  FROM t JOIN pg_constraint k ON k.conrelid = t.oid
UNION ALL
SELECT 'index|' || i.indexname || '|' || i.indexdef
  FROM pg_indexes i WHERE i.schemaname = 'public'
    AND i.tablename NOT LIKE 'directus\_%' AND i.tablename NOT LIKE 'alembic\_version%'
UNION ALL
SELECT 'fonction|' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')|'
    || replace(pg_get_functiondef(p.oid), chr(10), '\n')
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')
    AND NOT EXISTS (SELECT 1 FROM pg_depend e WHERE e.objid = p.oid AND e.deptype = 'e')
UNION ALL
SELECT 'declencheur|' || t.relname || '.' || g.tgname || '|' || pg_get_triggerdef(g.oid)
  FROM t JOIN pg_trigger g ON g.tgrelid = t.oid WHERE NOT g.tgisinternal
UNION ALL
SELECT 'vue|' || t.relname || '|' || replace(pg_get_viewdef(t.oid), chr(10), '\n')
  FROM t WHERE t.relkind IN ('v', 'm')
EOSQL
)
tpsql "$REF_DB" -c "$CATALOG_SQL" > "$WORK/catalog.ref"
tpsql "$TARGET_DB" -c "$CATALOG_SQL" > "$WORK/catalog.dst"
# Sortie de l'awk : MANQUANT / DIFFÉRENT (bloquants, un par ligne) puis « extra|catégorie|n ».
awk -F'|' '
    function key(line) { split(line, f, "|"); return f[1] "|" f[2] }
    NR == FNR { ref[key($0)] = $0; next }
    { dst[key($0)] = $0; split($0, g, "|"); cat[key($0)] = g[1] }
    END {
        for (k in ref) {
            if (!(k in dst)) print "MANQUANT   " substr(ref[k], 1, 300)
            else if (ref[k] != dst[k]) {
                print "DIFFÉRENT  attendu : " substr(ref[k], 1, 300)
                print "           trouvé  : " substr(dst[k], 1, 300)
            }
        }
        for (k in dst) if (!(k in ref)) extra[cat[k]]++
        for (c in extra) print "extra|" c "|" extra[c]
    }' "$WORK/catalog.ref" "$WORK/catalog.dst" > "$WORK/catalog.diff"
if grep -Ev '^extra\|' "$WORK/catalog.diff" > "$WORK/catalog.bad"; then
    cat "$WORK/catalog.bad" >&2
    die "la cible ne contient pas tout le schéma de référence (écarts ci-dessus) : stamp REFUSÉ. La base cible contient la copie : ne pas démarrer l'api. Retour arrière : docker compose down -v"
fi
extras=$(awk -F'|' '$1 == "extra" { printf "%s%s : %s", sep, $2, $3; sep = ", " }' "$WORK/catalog.diff")
say "la cible contient tout le schéma de référence ($(wc -l < "$WORK/catalog.ref") objets comparés) ; en plus dans la cible, non bloquant : ${extras:-rien}"

# 5. Données ------------------------------------------------------------------
say "5/7 comparaison des données"
tpsql "$TARGET_DB" -c "$(count_sql)" > "$WORK/count.dst"
if ! diff "$WORK/count.src" "$WORK/count.dst" > "$WORK/count.diff"; then
    cat "$WORK/count.diff" >&2
    die "nombres de lignes différents entre source et cible (< source, > cible) : stamp REFUSÉ"
fi
if [ "$SOURCE_MODE" = "029" ]; then
    # Les 3 tables du rattrapage doivent contenir exactement les lignes de départ.
    for t in $RATTRAPAGE_TABLES; do
        expected=$(grep -c "^INSERT INTO public\.$t " "$SEED_SQL" || true)
        got=$(tpsql "$TARGET_DB" -c "SELECT count(*) FROM public.$t")
        [ "$expected" -ge 1 ] && [ "$got" = "$expected" ] || die "$t contient $got ligne(s), $expected attendue(s) d'après seed_reference.sql : stamp REFUSÉ"
    done
fi
dst_users=$(tpsql "$TARGET_DB" -c "$USERS_SQL")
[ "$src_users" = "$dst_users" ] || die "contenu de tunnel_user (hachages compris) différent : stamp REFUSÉ"
bad_status=$(tpsql "$TARGET_DB" -c "SELECT count(*) FROM intervention_status_ref WHERE code IS DISTINCT FROM id")
[ "$bad_status" = "0" ] || die "intervention_status_ref.code différent de id sur $bad_status ligne(s) : corriger avant le stamp"
dst_admins=$(tpsql "$TARGET_DB" -c "SELECT count(*) FROM tunnel_user u JOIN tunnel_role r ON r.id = u.role_id WHERE r.code = 'ADMIN' AND u.is_active")
say "$(wc -l < "$WORK/count.dst") tables : nombres de lignes identiques ; comptes identiques (empreinte) ; $dst_admins admin(s) actif(s)"

# 6. Stamp --------------------------------------------------------------------
say "6/7 alembic stamp $TARGET_REV"
$STAMP_CMD
rev=$(tpsql "$TARGET_DB" -c "SELECT string_agg(version_num, ',') FROM alembic_version_backend")
[ "$rev" = "$TARGET_REV" ] || die "alembic_version_backend contient '$rev' au lieu de $TARGET_REV"

# 7. Suite --------------------------------------------------------------------
say "7/7 terminé. Étape suivante, à faire à la main : docker compose up -d"
say "Le bootstrap créera tunnel_app, ne créera aucun admin, ne modifiera aucune donnée."
