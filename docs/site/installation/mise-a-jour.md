# Mise à jour et sauvegarde

## Sauvegarder avant de mettre à jour

Faites toujours une sauvegarde avant une mise à jour : les migrations de la base s'appliquent
au démarrage de l'API.

```sh
# Depuis le dossier deploy/
docker compose exec -T db pg_dump -U tunnel_owner -d tunnel | gzip > tunnel-$(date +%F).sql.gz
```

À planifier régulièrement, par exemple avec cron. Conservez les sauvegardes **hors de la
machine**.

Sauvegardez aussi le fichier `deploy/.env`. Sans `JWT_SECRET_KEY` et sans les mots de passe
de la base, une restauration demande de les régénérer.

## Mettre à jour

```sh
cd tunnel-gmao
git pull
cd deploy
docker compose up -d --build
```

Au démarrage, l'API applique les migrations de la base. Les données sont conservées.

## Restaurer une sauvegarde

À faire dans une installation vide, API arrêtée :

```sh
docker compose stop api
gunzip -c tunnel-AAAA-MM-JJ.sql.gz | docker compose exec -T db psql -U tunnel_owner -d tunnel
docker compose start api
```

Remplacez `AAAA-MM-JJ` par la date du fichier à restaurer.

## Voir aussi

Les nouveautés de chaque version sont dans le fichier `CHANGELOG.md` du dépôt et dans
l'écran « Nouveautés » de Tunnel.
