# Prérequis et installation

## Prérequis

- Une machine Linux avec Docker et le plugin Docker Compose (version 2).
- 2 Go de mémoire libre.
- `git`.

## Installer

Depuis un terminal sur le serveur :

```sh
git clone https://github.com/ProtoGulix/tunnel-gmao.git
cd tunnel-gmao/deploy
./install.sh admin@example.com
docker compose up -d --build
```

1. `git clone` télécharge Tunnel.
2. `install.sh` prépare le fichier `deploy/.env`. Il y met des mots de passe de base et une
   clé de signature tirés au hasard, ainsi que le courriel du premier administrateur. Si
   vous ne donnez pas de courriel, le script le demande.
3. `docker compose up -d --build` construit et démarre les services. La première
   construction prend quelques minutes.

`install.sh` ne remplace jamais un fichier `.env` qui existe déjà : vos secrets restent
valables. Ce fichier est lisible par vous seul. Ne le partagez pas et ne le mettez jamais
dans git.

## Ouvrir Tunnel

Depuis la machine elle-même :

- front web : `http://127.0.0.1:8080`
- front mobile : `http://127.0.0.1:8080/m/`

Par défaut, le port n'écoute que sur la machine. Pour l'ouvrir aux autres postes, lisez
la section suivante.

## Premier administrateur

Au premier démarrage, Tunnel crée le compte de l'adresse `ADMIN_EMAIL` avec un mot de passe
aléatoire. Il est affiché **une seule fois** dans les journaux de l'API :

```sh
docker compose logs api
```

Connectez-vous avec ce courriel et ce mot de passe, puis changez le mot de passe.

Si vous avez perdu ce mot de passe avant la première connexion, la seule solution est de
supprimer la base et de recommencer :

```sh
docker compose down -v
```

::: danger Efface toutes les données
Cette commande supprime la base. Ne l'utilisez que sur une installation vide.
:::

Ensuite, créez les autres comptes : voir [Utilisateurs](../administrateur/utilisateurs).

## HTTPS : obligatoire hors du réseau interne

Tunnel ne fournit que du HTTP. Sans HTTPS, les mots de passe et les jetons de connexion
circulent en clair. **Ne publiez jamais le port directement sur Internet.**

Deux cas, réglés dans `deploy/.env` :

- **Réseau interne de l'usine seulement.** Mettez `HTTP_BIND=0.0.0.0`. Tunnel devient
  accessible depuis tout le réseau local, sans chiffrement.
- **Accès depuis Internet.** Placez un proxy HTTPS devant Tunnel (Cloudflare Tunnel, Caddy,
  Traefik, nginx...). Gardez `HTTP_BIND=127.0.0.1` et renseignez `PUBLIC_URL` (l'adresse
  HTTPS publique), `TRUSTED_PROXIES` et `REAL_IP_HEADER`.

Après toute modification de `.env`, relancez :

```sh
docker compose up -d
```

### L'adresse IP des utilisateurs

Tunnel enregistre l'IP de chaque connexion. Derrière un proxy, toutes les connexions
semblent venir du proxy. Indiquez alors ses adresses dans `TRUSTED_PROXIES` et l'en-tête
qui porte la vraie IP dans `REAL_IP_HEADER`. Exemple pour un Cloudflare Tunnel installé sur
la même machine :

```sh
TRUSTED_PROXIES=172.16.0.0/12
REAL_IP_HEADER=CF-Connecting-IP
```

L'en-tête n'est lu que si la connexion vient d'une adresse de `TRUSTED_PROXIES`. Après une
connexion, contrôlez le résultat dans les journaux de l'API.

## Les autres réglages

Tous les réglages sont commentés dans `deploy/.env.example`. Les principaux :

| Réglage | Rôle |
| --- | --- |
| `HTTP_BIND`, `HTTP_PORT` | Adresse et port d'écoute. |
| `PUBLIC_URL` | Adresse telle que tapée dans le navigateur ; sert aux QR codes imprimés. |
| `CLIENT_MAX_BODY_SIZE` | Taille maximale d'un envoi (import CSV, pièces jointes). |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_HOURS` | Durée des sessions (renouvelées automatiquement tant que la session dure). |
| `SCHEDULED_JOBS_ENABLED`, `SCHEDULED_JOBS_HOUR` | Tâche quotidienne : préventif généré une semaine avant l'échéance, notifications des retards. L'heure est celle du conteneur (UTC par défaut). |
| `MAIL_ENABLED`, `SMTP_*` | Envoi de courriels, facultatif. |

Changer `JWT_SECRET_KEY` déconnecte tout le monde.
