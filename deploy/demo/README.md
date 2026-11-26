# Instance de démonstration

Base fictive de 12 mois, rechargée chaque nuit (ADR 0036). Ce dossier contient le scénario
(`scenario/`), le chargeur (`load_demo.py`), la surcharge Compose (`docker-compose.demo.yml`),
le script de réinitialisation (`reset-demo.sh`) et le modèle d'environnement
(`.env.demo.example`).

L'instance est un **projet Compose isolé** nommé `tunnel-demo` : son réseau, son volume et ses
images (`tunnel-demo-api:local`, `tunnel-demo-web:local`) lui sont propres. Aucun port de base
ni d'API n'est publié ; seul le proxy web l'est, sur `127.0.0.1:8090`. Elle peut tourner sur
la même machine qu'une autre installation Tunnel sans la toucher : le script n'agit que sur le
projet `tunnel-demo` et refuse tout autre nom.

## Commande Compose de la démonstration

Pour inspecter l'instance (depuis `deploy/demo/`), toujours avec le projet et les fichiers de
la démonstration :

```sh
dcd() { docker compose -p tunnel-demo --env-file .env.demo \
        -f ../docker-compose.yml -f docker-compose.demo.yml "$@"; }
```

## Installation

Prérequis : Docker et le plugin Compose v2, `git`, et `flock` (paquet util-linux).

```sh
cd tunnel-gmao/deploy/demo
cp .env.demo.example .env.demo && chmod 600 .env.demo
```

Remplir `.env.demo` : `ADMIN_EMAIL`, `DEMO_PASSWORD` (mot de passe commun des trois comptes
publics : 8 caractères, une majuscule, un chiffre) et trois secrets aléatoires :

```sh
r() { LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$1"; }
sed -i -e "s|^DB_OWNER_PASSWORD=.*|DB_OWNER_PASSWORD=$(r 32)|" \
       -e "s|^DB_APP_PASSWORD=.*|DB_APP_PASSWORD=$(r 32)|" \
       -e "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$(r 64)|" .env.demo
```

Ne pas changer `DEMO_MODE`, `MAIL_ENABLED`, `API_ENV` ni le nom de base (il doit contenir
`demo`) : le script refuse de tourner sinon. `.env.demo` n'est jamais versionné.

## Premier chargement

```sh
./reset-demo.sh
```

Le script contrôle l'environnement, recrée la base, laisse l'API s'installer (migrations,
droits, données de référence : un compte ADMIN est créé, son mot de passe aléatoire reste dans
`dcd logs api` et n'est pas publié), charge le scénario avec les dates
recalées sur le jour du chargement (articles chargés comme pièces : `part`, référence
fabricant, références fournisseur), redémarre l'API pour que sa tâche quotidienne voie le
scénario (notifications de retard), puis publie le proxy web. Compter quelques minutes la
première fois (construction des images). Il peut être relancé à tout moment : il repart
toujours d'une base neuve. En cas d'échec il s'arrête sans publier le web.

Comptes publics : `technicien@demo.frezille.fr`, `acheteur@demo.frezille.fr`,
`direction@demo.frezille.fr`, avec `DEMO_PASSWORD`.

## Réinitialisation nocturne

Cron (utilisateur qui lance Docker), par exemple à 3 h, avant la tâche quotidienne de l'API.
La démonstration suit `main` : le cron récupère d'abord la dernière version publiée (clone
en HTTPS anonyme, sans clé), puis réinitialise. Si la récupération échoue, la
réinitialisation tourne sur le code actuel et le journal le signale.

```cron
0 3 * * * { date; cd /chemin/tunnel-gmao && git pull -q --ff-only origin main || echo "reset-demo : code non mis à jour, code actuel conservé"; /chemin/tunnel-gmao/deploy/demo/reset-demo.sh; } >> /var/log/tunnel-demo-reset.log 2>&1
```

Le clone est sur `main`, sans modification locale (`.env.demo` est ignoré par git) :
`git clone -b main https://github.com/ProtoGulix/tunnel-gmao.git`.

Ou un timer systemd : un service `Type=oneshot` dont `ExecStart` est le script, et un timer
`OnCalendar=*-*-* 03:00:00` avec `Persistent=true`.

## Vérification

```sh
dcd ps                                                # db, api, web : healthy
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/api/health   # 200
```

Se connecter avec `direction@demo.frezille.fr` : l'accueil est la vue « direction technique »,
le Bilan couvre 12 mois, l'échéancier du préventif montre des retards. Tout changement de mot
de passe, de compte, de droit ou de clé répond 403 (mode démo).

## Dépannage

- « ne contient pas demo » ou « projet refusé » : garde-fous du script, corriger `.env.demo`.
- Le chargeur refuse une base qui n'est pas vide ou dont le nom ne contient pas `demo` : il ne
  recharge jamais par-dessus des données ; relancer `reset-demo.sh` qui recrée la base.
- Arrêter la démonstration : `dcd stop`. Supprimer ses données : `dcd down -v` (la fonction
  `dcd` impose `-p tunnel-demo` : jamais de `down` sans `-p`).
