# SAUV-01. Script de sauvegarde de la base

- Statut : faite (2026-11-22)
- Agent : db-dev
- Branche : feat/scripts-sauvegarde (depuis develop, ADR 0008)
- Dépend de : décision de l'utilisateur du 2026-11-22 (plan validé)
- Périmètre d'écriture : deploy/sauvegarder.sh (nouveau), deploy/README.md (sections
  « Mise à jour » et « Sauvegarde et restauration »). Exclu : docker-compose*.yml, .env*,
  backend/, toute écriture en base.

## Contexte

La commande documentée dans deploy/README.md (`docker compose exec -T db pg_dump ... | gzip >
...`) a échoué en production le 2026-11-22 : lancée hors de deploy/, elle ne trouve pas le
Compose et laisse un fichier .sql.gz vide qui a l'air bon (pas de pipefail). Il faut un script
aussi simple qu'install.sh pour une PME sans informaticien.

## Critères d'acceptation

- [x] `deploy/sauvegarder.sh [dossier]` se lance depuis n'importe quel répertoire (trouve
      deploy/docker-compose.yml par son propre chemin), POSIX sh et `set -eu` comme install.sh.
- [x] Écrit `tunnel-AAAA-MM-JJ-HHMM.sql.gz` (format SQL compressé, compatible avec la
      restauration documentée) dans `~/sauvegardes-tunnel/` par défaut ou dans le dossier
      donné (créé au besoin, droits 700), fichier en droits 600 ; ne remplace jamais un
      fichier existant.
- [x] Échec de pg_dump ou du service db (arrêté, absent) : message clair, code de sortie non
      nul, fichier partiel supprimé (POSIX sh n'a pas pipefail : passer par un fichier
      temporaire ou contrôler le code de pg_dump autrement).
- [x] Contrôles en fin : archive valide (`gunzip -t`), non vide, contient la fin normale d'un
      dump PostgreSQL ; affiche chemin et taille ; rappelle de garder une copie hors de la
      machine et de sauvegarder `deploy/.env` à part (le script ne le copie pas).
- [x] Essai réel sur la stack de dev de cette machine (projet Compose `tunnel`, service `db`) :
      lecture seule, aucun service arrêté, recréé ni redémarré ; essai d'échec (par exemple
      nom de service ou de base erroné via une variable de test, ou Compose introuvable).
- [x] deploy/README.md : sauvegarde par le script, restauration inchangée ou ajustée au nom de
      fichier.
- [x] scripts/check.sh vert ; `sh -n` sur le script ; shellcheck s'il est installé (ne pas
      l'installer).

## Compte rendu final

Fait (db-dev, sonnet) : deploy/sauvegarder.sh (POSIX sh, dump brut dans un fichier
temporaire pour contrôler pg_dump, fin de dump vérifiée avant et après compression,
`gunzip -t`, droits 700 et 600, `ln` qui refuse d'écraser, trap de nettoyage ; variables de
test TUNNEL_DB_SERVICE et TUNNEL_DB_NAME) ; README de deploy/. Essais de l'agent : sauvegarde
réelle de la base de dev depuis `/` (1,4 Mo), relance dans la même minute refusée, service
et base inconnus refusés sans fichier, script sans Compose refusé. Aucune commande en échec
hors essais. Nom à la minute : deux sauvegardes dans la même minute, la seconde est refusée
(voulu).

Contrôle de l'agent principal : périmètre conforme, script relu, sauvegarde relancée
(code 0, 1,4 Mo, droits 600), essai supprimé. NON VÉRIFIÉ : serveur de production réel,
base volumineuse, COMPOSE_FILE ou COMPOSE_PROJECT_NAME personnalisés.
