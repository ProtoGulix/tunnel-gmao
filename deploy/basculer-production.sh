#!/usr/bin/env bash
# Bascule automatique d'une production v4 (3.57.0 ou révision 030) vers la stack Compose
# du monorepo (ADR 0002, 0006). Fiche BASC-04. Procédure manuelle : MIGRATION-v4.md.
#
#   cd deploy
#   cp bascule.conf.example bascule.conf     # puis l'adapter (jamais versionné)
#   ./basculer-production.sh [--conf FICHIER] [--sans-confirmation]
#   ./basculer-production.sh --retour-arriere [DOSSIER_ARCHIVE] [--sans-confirmation]
#
# Étapes : 1 contrôles sans effet, 2 sauvegarde de l'ancienne base, 3 archive des
# configurations des anciens conteneurs, 4 reprise des clés dans le .env, 5 coupure
# (arrêt, jamais de suppression), 6 build, base seule, migrate-from-v4.sh, 7 démarrage
# et contrôles. Tout échec après la coupure déclenche le retour arrière : suppression de
# la NOUVELLE stack (down -v, projet explicite), déraccordement de l'ancienne base,
# redémarrage des conteneurs arrêtés. L'archive est toujours conservée.
#
# Les paramètres propres au serveur vivent dans bascule.conf (voir bascule.conf.example).
# Variables d'environnement : COMPOSE_PROJECT_NAME (projet de la nouvelle stack, défaut
# « tunnel »), ARCHIVES_DIR (défaut deploy/archives-bascule).
# Variable de test, inutile en exploitation : BASCULE_ECHEC_APRES_COUPURE=1 provoque un
# échec au début de l'étape 7 pour essayer le retour arrière.
#
# Secrets : le mot de passe de l'ancienne base est lu dans l'environnement de son
# conteneur et transmis par variable d'environnement (jamais dans une ligne de commande,
# jamais affiché). Les valeurs reprises passent par des fichiers en mode 600. Rapport et
# inventaire ne contiennent que des noms. L'archive, elle, contient des secrets (dump,
# docker inspect, .env copiés) : dossier en mode 700, à supprimer après validation.

set -euo pipefail

DIR=$(cd "$(dirname "$0")" && pwd)
cd "$DIR"
PROJECT="${COMPOSE_PROJECT_NAME:-tunnel}"
# Exporté : migrate-from-v4.sh et ses « docker compose » ciblent le même projet.
export COMPOSE_PROJECT_NAME="$PROJECT"
NETWORK="${PROJECT}_tunnel"
VOLUME="${PROJECT}_tunnel-db"
ARCHIVES_DIR="${ARCHIVES_DIR:-$DIR/archives-bascule}"
CONF="$DIR/bascule.conf"
ASSUME_YES=0
MODE_RETOUR=0
RETOUR_DIR=""

# Paramètres de bascule.conf (liste blanche, voir load_conf).
OLD_DB=""; OLD_USER=""; OLD_NAME=""; OLD_API=""; EXPOSED=""
TO_STOP=""; TO_ARCHIVE=""; ADMIN_EMAIL=""; PUBLIC_URL=""

ARCHIVE=""; REPORT=""; WORK=""
OLD_PW=""
CUT=0          # 1 dès le début de la coupure : l'échec déclenche alors le retour arrière
ENV_CREATED=0  # 1 si ce script a créé .env (à supprimer si on abandonne)
CONNECTED=0    # 1 si l'ancienne base a été raccordée au réseau de la nouvelle stack
STOPPED=""     # conteneurs arrêtés, dans l'ordre d'arrêt
KEPT_KEYS=""; MISSING_KEYS=""; OTHER_KEYS=""; PORTS_FREED=""
HTTP_BIND_VAL=""; HTTP_PORT_VAL=""

say() { printf '[bascule] %s\n' "$*"; }
warn() { printf '[bascule] ATTENTION : %s\n' "$*" >&2; }
die() { printf '[bascule] ERREUR : %s\n' "$*" >&2; exit 1; }
# Ligne écrite à l'écran et dans le rapport (jamais de valeur secrète).
rap() { printf '%s\n' "$*" | tee -a "$REPORT"; }

usage() { sed -n '2,28p' "$0"; }

# docker compose sur la nouvelle stack, projet toujours explicite.
dc() { docker compose -p "$PROJECT" "$@"; }

# psql sur l'ancienne base, session en lecture seule, SELECT uniquement. Le mot de passe
# passe par PGPASSWORD (nom seul après -e : docker lit la valeur dans notre environnement).
old_psql() {
    PGPASSWORD="$OLD_PW" docker exec -e PGPASSWORD -e PGOPTIONS="-c default_transaction_read_only=on" \
        "$OLD_DB" psql -U "$OLD_USER" -d "$OLD_NAME" -X -At -v ON_ERROR_STOP=1 "$@"
}
new_psql() { dc exec -T db psql -U tunnel_owner -d tunnel -X -At -v ON_ERROR_STOP=1 "$@"; }

# --- Lecture de fichiers de paramètres ---------------------------------------------------
# Analyse KEY=VALEUR sans jamais exécuter le fichier. $1 fichier, $2 clés autorisées.
# Le dernier doublon l'emporte. Résultat : variables du script portant le nom de la clé.
parse_kv() {
    local file="$1" allowed=" $2 " line key val
    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in ''|'#'*) continue ;; esac
        key=${line%%=*}; val=${line#*=}
        [ "$key" != "$line" ] || die "$file : ligne illisible (KEY=VALEUR attendu)"
        case "$allowed" in *" $key "*) ;; *) die "$file : paramètre inconnu $key" ;; esac
        case "$val" in
            \"*\") val=${val#\"}; val=${val%\"} ;;
            \'*\') val=${val#\'}; val=${val%\'} ;;
        esac
        printf -v "$key" '%s' "$val"
    done < "$file"
}

CONF_KEYS="ANCIENNE_DB_CONTENEUR ANCIENNE_DB_UTILISATEUR ANCIENNE_DB_NOM ANCIENNE_API_CONTENEUR CONTENEUR_EXPOSE CONTENEURS_A_ARRETER CONTENEURS_A_ARCHIVER ADMIN_EMAIL PUBLIC_URL"
ANCIENNE_DB_CONTENEUR=""; ANCIENNE_DB_UTILISATEUR=""; ANCIENNE_DB_NOM=""; ANCIENNE_API_CONTENEUR=""
CONTENEUR_EXPOSE=""; CONTENEURS_A_ARRETER=""; CONTENEURS_A_ARCHIVER=""

load_conf() {
    [ -f "$CONF" ] || die "$CONF introuvable (copier bascule.conf.example)"
    parse_kv "$CONF" "$CONF_KEYS"
    OLD_DB=$ANCIENNE_DB_CONTENEUR; OLD_USER=$ANCIENNE_DB_UTILISATEUR; OLD_NAME=$ANCIENNE_DB_NOM
    OLD_API=$ANCIENNE_API_CONTENEUR; EXPOSED=$CONTENEUR_EXPOSE
    TO_STOP=$CONTENEURS_A_ARRETER; TO_ARCHIVE=$CONTENEURS_A_ARCHIVER
    local k v
    for k in $CONF_KEYS; do
        v=${!k}
        [ -n "$v" ] || die "paramètre $k manquant dans $CONF : aucune action n'a été faite"
    done
    local n
    for n in $OLD_DB $OLD_API $EXPOSED $TO_STOP $TO_ARCHIVE; do
        [[ "$n" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]] || die "nom de conteneur invalide : $n"
    done
    [[ "$OLD_USER" =~ ^[A-Za-z0-9_]+$ ]] || die "ANCIENNE_DB_UTILISATEUR invalide"
    [[ "$OLD_NAME" =~ ^[A-Za-z0-9_]+$ ]] || die "ANCIENNE_DB_NOM invalide"
    [[ "$ADMIN_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$ ]] || die "ADMIN_EMAIL invalide"
    [[ "$PUBLIC_URL" =~ ^https?://[A-Za-z0-9:/._-]+$ ]] || die "PUBLIC_URL invalide"
    in_list "$OLD_API" "$TO_STOP" || die "l'ancienne API ($OLD_API) doit figurer dans CONTENEURS_A_ARRETER (sinon elle écrit pendant la bascule)"
    in_list "$EXPOSED" "$TO_STOP" || die "le conteneur exposé ($EXPOSED) doit figurer dans CONTENEURS_A_ARRETER (sinon son port n'est pas libéré)"
    ! in_list "$OLD_DB" "$TO_STOP" || die "l'ancienne base ($OLD_DB) ne doit pas être arrêtée : elle est la source"
}

in_list() { local x; for x in $2; do [ "$x" != "$1" ] || return 0; done; return 1; }

# Valeur d'une variable dans un fichier KEY=VALEUR (premier résultat), vide sinon.
file_value() { grep -m1 "^$2=" "$1" | cut -d= -f2- || true; }

# Variable d'environnement d'un conteneur, lue sans passer par la ligne de commande
# d'un autre programme : seul « docker inspect » reçoit le nom du conteneur.
dump_env() { docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$1" > "$2"; chmod 600 "$2"; }

confirm() {
    [ "$ASSUME_YES" = 1 ] && return 0
    local answer
    printf '[bascule] %s Taper OUI pour continuer : ' "$1"
    read -r answer || answer=""
    [ "$answer" = "OUI" ]
}

# --- Retour arrière ------------------------------------------------------------------
# Ne touche que la nouvelle stack (projet explicite), l'ancienne base (déraccordement) et
# les conteneurs arrêtés par la bascule. Chaque étape tolère l'échec : on va au bout.
rollback() {
    local c failed=0
    say "retour arrière : projet $PROJECT"
    if [ "$CONNECTED" = 1 ]; then
        docker network disconnect -f "$NETWORK" "$OLD_DB" >/dev/null 2>&1 \
            && say "ancienne base déraccordée de $NETWORK" || { warn "déraccordement de $OLD_DB impossible"; failed=1; }
    fi
    # Le déraccordement vient avant : un réseau avec un conteneur raccordé ne se supprime pas.
    # -p explicite : jamais le projet par défaut du dossier.
    dc down -v --remove-orphans >/dev/null 2>&1 \
        && say "nouvelle stack supprimée (conteneurs, réseau, volume)" || { warn "docker compose -p $PROJECT down -v a échoué"; failed=1; }
    if [ "$ENV_CREATED" = 1 ]; then rm -f "$DIR/.env"; say ".env créé par la bascule supprimé"; fi
    for c in $(printf '%s\n' $STOPPED | tac); do
        docker start "$c" >/dev/null 2>&1 && say "redémarré : $c" || { warn "redémarrage de $c impossible"; failed=1; }
    done
    [ "$failed" = 0 ] || warn "retour arrière incomplet : reprendre à la main (MIGRATION-v4.md, section Retour arrière)"
    return "$failed"
}

on_exit() {
    local rc=$?
    trap - EXIT
    if [ "$rc" -ne 0 ]; then
        if [ "$CUT" = 1 ]; then
            say "ÉCHEC après la coupure (code $rc) : retour arrière automatique"
            rollback || true
            [ -z "$REPORT" ] || printf 'ÉCHEC après la coupure, retour arrière effectué. Archive conservée : %s\n' "$ARCHIVE" >> "$REPORT"
        elif [ "$ENV_CREATED" = 1 ]; then
            rm -f "$DIR/.env"
            say "abandon avant la coupure : .env créé par la bascule supprimé, rien d'autre n'a changé"
        fi
        [ -z "$ARCHIVE" ] || say "archive conservée : $ARCHIVE"
    fi
    [ -z "$WORK" ] || rm -rf "$WORK"
    exit "$rc"
}

# --- Retour arrière manuel --------------------------------------------------------------
manual_rollback() {
    local dir="$RETOUR_DIR"
    if [ -z "$dir" ]; then
        dir=$(find "$ARCHIVES_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -n 1)
    fi
    [ -n "$dir" ] && [ -f "$dir/etat.env" ] || die "archive de bascule introuvable (préciser le dossier)"
    ARCHIVE="$dir"
    local PROJET="" ANCIENNE_DB="" ARRETES="" ENV_CREE="0" RACCORDE="0"
    parse_kv "$dir/etat.env" "PROJET ANCIENNE_DB ARRETES ENV_CREE RACCORDE"
    # Le projet vient de l'état enregistré : pas de down -v sur un autre projet que celui de la bascule.
    PROJECT=$PROJET; export COMPOSE_PROJECT_NAME="$PROJECT"; NETWORK="${PROJECT}_tunnel"
    OLD_DB=$ANCIENNE_DB; STOPPED=$ARRETES; ENV_CREATED=$ENV_CREE; CONNECTED=$RACCORDE
    say "retour arrière manuel depuis $dir"
    warn "les saisies faites dans la nouvelle stack depuis la bascule seront PERDUES (volume supprimé) ; l'ancienne base n'a pas reçu ces saisies"
    say "sera supprimée : la stack $PROJECT et son volume. Sera redémarré : ${STOPPED:-rien}"
    confirm "Confirmer le retour arrière ?" || die "retour arrière annulé"
    rollback || exit 1
    say "terminé. L'archive $dir est conservée."
}

# --- Étape 1 : contrôles sans effet -------------------------------------------------
step1() {
    say "1/7 contrôles préalables (aucun effet)"
    command -v docker >/dev/null || die "docker introuvable"
    local v; v=$(docker compose version --short 2>/dev/null) || die "docker compose v2 introuvable"
    [ "$(printf '%s' "${v#v}" | cut -d. -f1)" -ge 2 ] || die "docker compose v2 requis (trouvé $v)"
    command -v curl >/dev/null || die "curl introuvable"
    [ -f "$DIR/docker-compose.yml" ] && [ -x "$DIR/install.sh" ] && [ -x "$DIR/migrate-from-v4.sh" ] || die "lancer depuis un clone complet du dépôt (deploy/)"
    [ ! -e "$DIR/.env" ] || die "$DIR/.env existe déjà : install.sh ne ferait rien. Pas de bascule sur une stack déjà installée."
    # Un ancien projet de même nom serait détruit par le down -v du retour arrière.
    [ -z "$(docker ps -a -q --filter "label=com.docker.compose.project=$PROJECT")" ] \
        || die "des conteneurs du projet Compose « $PROJECT » existent déjà : le retour arrière les supprimerait. Choisir un autre COMPOSE_PROJECT_NAME ou les retirer."
    docker volume inspect "$VOLUME" >/dev/null 2>&1 && die "le volume $VOLUME existe déjà"
    docker network inspect "$NETWORK" >/dev/null 2>&1 && die "le réseau $NETWORK existe déjà"
    local n
    for n in $OLD_DB $OLD_API $EXPOSED $TO_STOP $TO_ARCHIVE; do
        docker inspect "$n" >/dev/null 2>&1 || die "conteneur $n introuvable"
    done
    [ "$(docker inspect -f '{{.State.Running}}' "$OLD_DB")" = true ] || die "l'ancienne base $OLD_DB ne tourne pas"
    OLD_PW=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$OLD_DB" | sed -n 's/^POSTGRES_PASSWORD=//p' | head -n 1)
    [ -n "$OLD_PW" ] || warn "POSTGRES_PASSWORD absent de $OLD_DB : connexion sans mot de passe"
    local rev
    rev=$(old_psql -c "SELECT string_agg(version_num, ',' ORDER BY version_num) FROM alembic_version_backend") \
        || die "ancienne base illisible (utilisateur, base ou mot de passe)"
    case "$rev" in
        030_intervention_status_ref_code|002_create_missing_tables,029_home_view) ;;
        *) die "révision de l'ancienne base « $rev » : 029 ou 030 attendue" ;;
    esac
    local size_kb free_kb root="$ARCHIVES_DIR"
    size_kb=$(( $(old_psql -c "SELECT pg_database_size(current_database())") / 1024 ))
    while [ ! -d "$root" ]; do root=$(dirname "$root"); done
    free_kb=$(df -Pk "$root" | awk 'NR == 2 { print $4 }')
    # Deux dumps (avant et après la coupure) ; le format -Fc est compressé, c'est une marge.
    [ "$free_kb" -gt $(( size_kb * 2 + 51200 )) ] || die "espace disque insuffisant dans $root (${free_kb} Ko libres, ${size_kb} Ko de base)"
    # Le port du front serait pris par un conteneur qui ne s'arrête pas.
    read_publication
    local other
    for other in $(docker ps --filter "publish=$HTTP_PORT_VAL" --format '{{.Names}}'); do
        in_list "$other" "$TO_STOP" || die "le port $HTTP_PORT_VAL est publié par $other, qui n'est pas dans CONTENEURS_A_ARRETER"
    done
    say "contrôles réussis : ancienne base à la révision $rev, ${size_kb} Ko, ${free_kb} Ko libres"
}

# Publication du conteneur exposé (HostConfig.PortBindings) : adresse et port d'écoute.
read_publication() {
    local first
    first=$(docker inspect -f '{{range $p, $b := .HostConfig.PortBindings}}{{range $b}}{{.HostIp}}|{{.HostPort}}{{"\n"}}{{end}}{{end}}' "$EXPOSED" | head -n 1)
    [ -n "$first" ] || die "le conteneur exposé $EXPOSED ne publie aucun port"
    HTTP_BIND_VAL=${first%%|*}; HTTP_PORT_VAL=${first#*|}
    [ -n "$HTTP_BIND_VAL" ] || HTTP_BIND_VAL=0.0.0.0
    [[ "$HTTP_BIND_VAL" =~ ^[0-9.]+$ ]] && [[ "$HTTP_PORT_VAL" =~ ^[0-9]+$ ]] || die "publication de $EXPOSED illisible (IPv4 et port attendus)"
}

# --- Étape 2 : sauvegarde ------------------------------------------------------------
dump_old() {
    ( umask 077
      PGPASSWORD="$OLD_PW" docker exec -e PGPASSWORD -e PGOPTIONS="-c default_transaction_read_only=on" \
          "$OLD_DB" pg_dump -Fc -U "$OLD_USER" -d "$OLD_NAME" > "$1" )
    [ -s "$1" ] || die "dump vide : $1"
    say "dump écrit : $1 ($(du -h "$1" | cut -f1))"
}

step2() {
    say "2/7 sauvegarde complète de l'ancienne base"
    ARCHIVE="$ARCHIVES_DIR/$(date +%Y%m%d-%H%M%S)"
    ( umask 077; mkdir -p "$ARCHIVE" )
    # Seulement le dossier daté : ARCHIVES_DIR peut être un dossier existant du serveur.
    chmod 700 "$ARCHIVE"
    REPORT="$ARCHIVE/rapport.txt"; : > "$REPORT"; chmod 600 "$REPORT"
    dump_old "$ARCHIVE/ancienne-base-avant-coupure.dump"
}

# --- Étape 3 : archive des configurations --------------------------------------------
archive_container() {
    local n="$1" out="$ARCHIVE/config/$1" wd src size i=0 line
    mkdir -p "$out"
    docker inspect "$n" > "$out/inspect.json"
    dump_env "$n" "$out/environnement.txt"
    printf '== %s\n' "$n" >> "$ARCHIVE/inventaire.txt"
    printf '  variables d environnement : %s (noms dans le rapport, valeurs dans environnement.txt)\n' \
        "$(wc -l < "$out/environnement.txt")" >> "$ARCHIVE/inventaire.txt"
    wd=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' "$n")
    if [ -n "$wd" ] && [ -d "$wd" ]; then
        mkdir -p "$out/projet"
        find "$wd" -maxdepth 1 -type f \( -name '.env*' -o -name 'docker-compose*.y*ml' \) -exec cp -p {} "$out/projet/" \;
        printf '  dossier du projet Compose %s : %s fichier(s) copié(s)\n' "$wd" "$(find "$out/projet" -type f | wc -l)" >> "$ARCHIVE/inventaire.txt"
    elif [ -n "$wd" ]; then
        printf '  dossier du projet Compose %s : absent de cette machine\n' "$wd" >> "$ARCHIVE/inventaire.txt"
    fi
    while IFS='|' read -r kind src; do
        [ "$kind" = bind ] || continue
        i=$((i + 1))
        if [ ! -e "$src" ] || [ -S "$src" ]; then
            printf '  montage %s : non copié (absent ou socket)\n' "$src" >> "$ARCHIVE/inventaire.txt"; continue
        fi
        size=$(du -sk "$src" 2>/dev/null | cut -f1 || true)
        if [ -n "$size" ] && [ "$size" -lt 51200 ]; then
            mkdir -p "$out/montages/$i"
            if cp -a "$src" "$out/montages/$i/" 2>/dev/null; then line="copié ($size Ko)"; else line="copie incomplète (droits ?), vérifier à la main"; fi
        else
            line="NON copié (${size:-taille inconnue} Ko, 50 Mo ou plus) : à sauvegarder à la main"
        fi
        printf '  montage %s : %s\n' "$src" "$line" >> "$ARCHIVE/inventaire.txt"
    done < <(docker inspect -f '{{range .Mounts}}{{.Type}}|{{.Source}}{{"\n"}}{{end}}' "$n")
}

step3() {
    say "3/7 archive des configurations des anciens conteneurs"
    : > "$ARCHIVE/inventaire.txt"; chmod 600 "$ARCHIVE/inventaire.txt"
    local n
    for n in $TO_ARCHIVE; do archive_container "$n"; say "archivé : $n"; done
    say "inventaire : $ARCHIVE/inventaire.txt"
}

# --- Étape 4 : reprise des clés ------------------------------------------------------
# Écrit KEY=VALEUR dans .env (remplace la ligne existante) sans mettre la valeur dans une
# ligne de commande : printf est interne à bash, le fichier est en mode 600.
set_env() {
    local key="$1" val="$2" tmp
    case "$val" in *\'*|*$'\n'*) return 1 ;; esac
    tmp=$(umask 077; mktemp "$DIR/.env.bascule.XXXXXX")
    { grep -v "^$key=" "$DIR/.env" || true; } > "$tmp"
    if [[ "$val" =~ ^[A-Za-z0-9._:/@+-]*$ ]]; then printf '%s=%s\n' "$key" "$val" >> "$tmp"
    else printf "%s='%s'\n" "$key" "$val" >> "$tmp"; fi
    chmod 600 "$tmp"; mv "$tmp" "$DIR/.env"
}

step4() {
    say "4/7 création du .env et reprise des clés de l'ancienne API"
    # Drapeau avant l'appel : un install.sh qui échoue après avoir écrit .env ne le laisse
    # pas derrière lui (l'étape 1 a vérifié que .env n'existait pas).
    ENV_CREATED=1
    ADMIN_EMAIL="$ADMIN_EMAIL" PUBLIC_URL="$PUBLIC_URL" ./install.sh "$ADMIN_EMAIL" >/dev/null
    local envf="$WORK/api.env" line key
    dump_env "$OLD_API" "$envf"
    while IFS= read -r line; do
        key=${line%%=*}
        # L'API refuse de démarrer en production avec une clé de moins de 32 caractères :
        # mieux vaut s'arrêter ici, avant la coupure, qu'au retour arrière de l'étape 7.
        if [ "$key" = JWT_SECRET_KEY ] && [ "${#line}" -lt $((${#key} + 1 + 32)) ]; then
            die "JWT_SECRET_KEY de $OLD_API fait moins de 32 caractères : l'API v5 refuserait de démarrer. En poser une plus longue (déconnecte les sessions) avant de relancer."
        fi
        case "$key" in
            JWT_SECRET_KEY|MAIL_ENABLED|SMTP_*|ACCESS_TOKEN_EXPIRE_MINUTES|REFRESH_TOKEN_EXPIRE_HOURS)
                if set_env "$key" "${line#*=}"; then KEPT_KEYS="$KEPT_KEYS $key"
                else MISSING_KEYS="$MISSING_KEYS $key(valeur non reprenable)"; fi ;;
            *) OTHER_KEYS="$OTHER_KEYS $key" ;;
        esac
    done < "$envf"
    for key in JWT_SECRET_KEY MAIL_ENABLED SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_FROM; do
        case " $KEPT_KEYS " in *" $key "*) ;; *) MISSING_KEYS="$MISSING_KEYS $key"; warn "$key introuvable dans $OLD_API : non repris" ;; esac
    done
    set_env API_ENV production
    set_env HTTP_BIND "$HTTP_BIND_VAL"
    set_env HTTP_PORT "$HTTP_PORT_VAL"
    KEPT_KEYS="$KEPT_KEYS API_ENV HTTP_BIND HTTP_PORT"
    say "clés reprises : $(printf '%s' "$KEPT_KEYS" | wc -w) (noms dans le rapport)"
}

# --- Étape 5 : coupure -----------------------------------------------------------------
save_state() {
    printf 'PROJET=%s\nANCIENNE_DB=%s\nARRETES=%s\nENV_CREE=%s\nRACCORDE=%s\n' \
        "$PROJECT" "$OLD_DB" "${STOPPED# }" "$ENV_CREATED" "$CONNECTED" > "$ARCHIVE/etat.env"
    chmod 600 "$ARCHIVE/etat.env"
}

step5() {
    say "5/7 coupure : arrêt (sans suppression) de : $TO_STOP"
    confirm "Les anciens services vont être ARRÊTÉS (service coupé pour les utilisateurs)." \
        || die "bascule annulée avant la coupure"
    local n
    # Mémoriser la liste avant d'arrêter : l'état permet le retour arrière manuel.
    STOPPED=""; for n in $TO_STOP; do [ "$(docker inspect -f '{{.State.Running}}' "$n")" = true ] && STOPPED="$STOPPED $n"; done
    STOPPED=${STOPPED# }
    save_state
    # CUT avant le premier arrêt : un arrêt partiel est lui aussi rattrapé.
    CUT=1
    for n in $STOPPED; do docker stop "$n" >/dev/null; say "arrêté : $n"; done
    # Ports libérés, relevés maintenant (HostConfig reste lisible sur un conteneur arrêté).
    PORTS_FREED=$(for n in $STOPPED; do
        docker inspect -f '{{.Name}}{{range $p, $b := .HostConfig.PortBindings}}{{range $b}} {{if .HostIp}}{{.HostIp}}{{else}}0.0.0.0{{end}}:{{.HostPort}}->{{$p}}{{end}}{{end}}' "$n"
    done | sed 's|^/||')
}

# --- Étape 6 : nouvelle base et migration ---------------------------------------------
step6() {
    say "6/7 build, base seule, migration"
    dc build
    dc up -d --wait db
    CONNECTED=1; save_state
    docker network connect "$NETWORK" "$OLD_DB"
    say "ancienne base raccordée à $NETWORK"
    # Second dump après la coupure : rien n'a pu être écrit entre le premier et l'arrêt.
    local final="$ARCHIVE/ancienne-base-apres-coupure.dump"
    dump_old "$final"
    # Aucun mot de passe dans une ligne de commande : l'URL n'en contient pas, PGPASSWORD
    # est transmis au conteneur db par « -e PGPASSWORD » (valeur lue dans l'environnement).
    PGPASSWORD="$OLD_PW" SOURCE_URL="postgresql://$OLD_USER@$OLD_DB:5432/$OLD_NAME" \
        DB_EXEC="docker compose -p $PROJECT exec -T -e PGPASSWORD db" \
        ./migrate-from-v4.sh --dump-file "$final"
    # La nouvelle stack n'a plus besoin de l'ancienne base (superuser) : on la retire de son
    # réseau. Les contrôles de l'étape 7 la lisent par docker exec, sans réseau.
    docker network disconnect "$NETWORK" "$OLD_DB"
    CONNECTED=0; save_state
    say "ancienne base déraccordée de $NETWORK"
}

# --- Étape 7 : démarrage et contrôles -------------------------------------------------
check() { # description, valeur obtenue, valeur attendue
    [ "$2" = "$3" ] || die "contrôle échoué : $1 (obtenu « $2 », attendu « $3 »)"
    say "contrôle réussi : $1"
}

wait_health() {
    local url="$1" i code=""
    for i in $(seq 1 45); do
        code=$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)
        [ "$code" = 200 ] && return 0
        sleep 2
    done
    die "$url ne répond pas 200 (dernier code $code)"
}

step7() {
    say "7/7 démarrage de la nouvelle stack"
    [ "${BASCULE_ECHEC_APRES_COUPURE:-0}" != 1 ] || die "échec injecté (BASCULE_ECHEC_APRES_COUPURE=1)"
    confirm "La nouvelle stack va démarrer sur $HTTP_BIND_VAL:$HTTP_PORT_VAL." || die "démarrage refusé"
    dc up -d
    local host="$HTTP_BIND_VAL"; [ "$host" != 0.0.0.0 ] || host=127.0.0.1
    wait_health "http://$host:$HTTP_PORT_VAL/api/health"
    check "révision alembic" "$(new_psql -c "SELECT string_agg(version_num, ',') FROM alembic_version_backend")" "0013_motifs_cloture"
    check "/api/health" "$(curl -s -o /dev/null -w '%{http_code}' "http://$host:$HTTP_PORT_VAL/api/health")" 200
    local docs; docs=$(curl -s -o /dev/null -w '%{http_code}' "http://$host:$HTTP_PORT_VAL/api/docs" || true)
    [ "$docs" != 200 ] || die "contrôle échoué : /api/docs répond 200 en production"
    say "contrôle réussi : /api/docs ferme (code $docs)"
    check "tunnel_app sans superuser" "$(new_psql -c "SELECT rolsuper FROM pg_roles WHERE rolname = 'tunnel_app'")" f
    local t
    for t in tunnel_user intervention intervention_action; do
        check "lignes de $t identiques à l'ancienne base" \
            "$(new_psql -c "SELECT count(*) FROM $t")" "$(old_psql -c "SELECT count(*) FROM $t")"
    done
    [ "$(new_psql -c "SELECT count(*) FROM audit_reason_code WHERE code IN ('TASK_DONE_UNRECORDED','TASK_HANDLED_ELSEWHERE','TASK_NO_LONGER_NEEDED','TASK_DUPLICATE')")" = 4 ] \
        || die "contrôle échoué : motifs TASK_* incomplets"
    say "contrôle réussi : motifs TASK_* présents"
}

# --- Rapport ---------------------------------------------------------------------------
final_report() {
    rap ""
    rap "=== Rapport de bascule ($(date '+%Y-%m-%d %H:%M')) ==="
    rap "Fait : sauvegardes, archive des configurations, nouvelle stack $PROJECT migrée et démarrée sur $HTTP_BIND_VAL:$HTTP_PORT_VAL, contrôles réussis."
    rap "Arrêtés (non supprimés) : ${STOPPED:-aucun}"
    rap "Clés reprises (noms) :$KEPT_KEYS"
    rap "Clés attendues non reprises (noms) :${MISSING_KEYS:- aucune}"
    rap "Autres variables de l'ancienne API, non reprises (noms) :${OTHER_KEYS:- aucune}"
    rap "Ports libérés par les anciens conteneurs :"
    printf '%s\n' "$PORTS_FREED" | grep -- '->' | sed 's/^/  /' | tee -a "$REPORT" || true
    rap "  Un domaine (Cloudflare, proxy) qui pointait sur l'un de ces ports est à rediriger vers la nouvelle stack ; l'ancien mobile devient /m sur la nouvelle adresse."
    rap "Archive (contient des secrets, dossier en mode 700) : $ARCHIVE"
    rap "À faire à la main :"
    rap "  - Grafana et autres lecteurs de l'ancienne base : nouvelle source ou abandon."
    rap "  - Clients MCP : nouvelle URL d'API et nouvelle clé d'API."
    rap "  - Directus : arrêté avec les anciens services, sa base reste dans l'ancienne base."
    rap "  - Cache des postes : l'ancien service worker doit être vidé (ou rechargement forcé)."
    rap "  - Cloudflare Access ou proxy : règles et domaines vers la nouvelle adresse."
    rap "  - ACCESS_TOKEN_EXPIRE_MINUTES et REFRESH_TOKEN_EXPIRE_HOURS : reportées dans .env, mais docker-compose.yml ne les transmet pas à l'api (constaté) : sans effet, valeurs par défaut de l'API, tant que le compose n'est pas complété."
    rap "  - Après quelques jours : supprimer les anciens conteneurs et l'archive (dump complet, secrets)."
    rap "  - Retour à l'ancienne production si besoin : ./basculer-production.sh --retour-arriere (les saisies faites dans la nouvelle stack seraient perdues)."
}

# --- Programme -----------------------------------------------------------------------
while [ $# -gt 0 ]; do
    case "$1" in
        --conf) CONF="${2:?--conf demande un fichier}"; shift 2 ;;
        --sans-confirmation) ASSUME_YES=1; shift ;;
        --retour-arriere)
            MODE_RETOUR=1; shift
            if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then RETOUR_DIR="$1"; shift; fi ;;
        -h|--help) usage; exit 0 ;;
        *) die "option inconnue : $1" ;;
    esac
done

WORK=$(mktemp -d)
trap on_exit EXIT
trap 'exit 130' INT TERM

if [ "$MODE_RETOUR" = 1 ]; then manual_rollback; exit 0; fi

load_conf
step1
step2
step3
step4
step5
step6
step7
CUT=0
final_report
say "bascule terminée. Les anciens conteneurs sont arrêtés, pas supprimés."
