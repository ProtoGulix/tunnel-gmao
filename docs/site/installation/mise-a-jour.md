# Mise à jour et sauvegarde

Deux scripts du dossier `deploy/` font le travail : `sauvegarder.sh` sauvegarde la base,
`repeter-mise-a-jour.sh` essaie la mise à jour sur une copie avant de la faire pour de vrai.
Ils se lancent depuis n'importe quel dossier.

## En bref

```sh
cd tunnel-gmao
git pull                                    # 1. récupérer la nouvelle version
deploy/sauvegarder.sh                       # 2. sauvegarder la base
deploy/repeter-mise-a-jour.sh ~/sauvegardes-tunnel/tunnel-AAAA-MM-JJ-HHMM.sql.gz   # 3. répéter
cd deploy && docker compose up -d --build   # 4. seulement si la répétition a réussi
```

À l'étape 3, indiquez le fichier affiché par l'étape 2.

## Pourquoi répéter la mise à jour

Au démarrage, l'API met la base à jour : elle joue les **migrations** de la nouvelle version,
puis complète les données de référence. Les données sont conservées.

Si une migration échoue, par exemple sur une donnée ancienne qu'elle n'attendait pas, l'API
ne démarre pas : Tunnel reste indisponible tant que le problème n'est pas réglé. La répétition
découvre ce problème **avant**, sur une copie, pendant que la production tourne normalement.

## Sauvegarder

```sh
deploy/sauvegarder.sh            # dans ~/sauvegardes-tunnel/
deploy/sauvegarder.sh /un/dossier   # ou dans le dossier de votre choix
```

Le script écrit un fichier `tunnel-AAAA-MM-JJ-HHMM.sql.gz` et affiche son chemin et sa taille.

- Il vérifie que la sauvegarde est complète et lisible. Si quelque chose échoue (base
  arrêtée, disque plein…), il le dit et **ne laisse aucun fichier** : un fichier présent est
  une sauvegarde valable.
- Le fichier n'est lisible que par vous : il contient toutes les données de l'entreprise.
- Il ne remplace jamais une sauvegarde existante. Deux sauvegardes dans la même minute : la
  seconde est refusée, relancez une minute plus tard.

N'utilisez pas un simple `pg_dump | gzip` : en cas d'échec, il laisse un fichier vide qui a
l'air bon.

**Conservez les sauvegardes hors de la machine** (autre serveur, disque externe…). Sauvegardez
aussi le fichier `deploy/.env`, que le script ne copie pas : sans `JWT_SECRET_KEY` et sans les
mots de passe de la base, une restauration demande de les régénérer.

### Sauvegarder chaque nuit

Avec cron (`crontab -e`), par exemple tous les jours à 2 h :

Lancez d'abord une sauvegarde à la main : elle crée le dossier `~/sauvegardes-tunnel/`, où
cron écrira son journal (sans ce dossier, la tâche échoue sans laisser de trace). Puis, avec
`crontab -e` sur le compte qui lance habituellement `docker`, par exemple tous les jours à
2 h :

```sh
0 2 * * * /home/exploitant/tunnel-gmao/deploy/sauvegarder.sh >> $HOME/sauvegardes-tunnel/journal.txt 2>&1
```

Remplacez le chemin par le chemin complet de votre dossier `tunnel-gmao`. Le lendemain,
vérifiez qu'un nouveau fichier est apparu dans `~/sauvegardes-tunnel/`. Pensez à supprimer
de temps en temps les sauvegardes les plus anciennes.

## Répéter la mise à jour

```sh
deploy/repeter-mise-a-jour.sh ~/sauvegardes-tunnel/tunnel-AAAA-MM-JJ-HHMM.sql.gz
```

Une fois le `git pull` fait, le script :

1. construit la nouvelle version de l'API, sans rien arrêter ni redémarrer ;
2. restaure la sauvegarde dans une base **jetable**, isolée du réseau ;
3. y joue la mise à jour exactement comme au démarrage de l'API ;
4. affiche le résultat, puis supprime la base jetable, dans tous les cas.

Rien de ce qui tourne n'est arrêté ni modifié : Tunnel continue de fonctionner pendant la
répétition. Comptez quelques minutes, et de la place sur le disque pour une copie de la base.

### Lire le résultat

En cas de réussite, la dernière ligne commence par `[répétition] mise à jour réussie` et
indique la version de la base avant et après. Lancez alors l'étape 4 :

```sh
cd deploy && docker compose up -d --build
```

Le script affiche aussi le nombre d'interventions par priorité. Les seules valeurs attendues
sont `faible`, `normal`, `important` et `urgent`.

En cas d'échec, le script affiche `ÉCHEC de la mise à jour`, avec plus haut le message de la
migration en cause (par exemple une valeur qu'elle ne reconnaît pas).

- **Ne lancez pas l'étape 4** : l'API ne démarrerait pas.
- Tunnel continue de fonctionner normalement. Évitez seulement de redémarrer Tunnel ou le
  serveur avant la correction : la nouvelle version de l'API est déjà construite, et un
  redémarrage la lancerait, avec la mise à jour qui échoue.
- Gardez la sortie du script et signalez le problème
  ([dépôt GitHub](https://github.com/ProtoGulix/tunnel-gmao/issues)). Avant de la publier,
  relisez-la et masquez toute valeur propre à l'entreprise (noms, codes, textes) ; ne joignez
  jamais la sauvegarde. Attendez ensuite la correction indiquée avant de recommencer.

## Restaurer une sauvegarde

Sur une installation neuve : `install.sh` fait, avec le `.env` d'origine remis en place, et
Tunnel jamais démarré. Depuis le dossier `deploy/` :

```sh
docker compose up -d db
docker compose exec -T db psql -U tunnel_owner -d tunnel -c "CREATE ROLE tunnel_app LOGIN"
gunzip -c ~/sauvegardes-tunnel/tunnel-AAAA-MM-JJ-HHMM.sql.gz | docker compose exec -T db psql -U tunnel_owner -d tunnel -v ON_ERROR_STOP=1 --single-transaction
docker compose up -d --build
```

Remplacez le nom par celui du fichier à restaurer. La deuxième ligne crée le compte de
l'application, auquel la sauvegarde donne des droits ; au démarrage, Tunnel lui remet son mot
de passe et ses droits. Si une erreur apparaît, la restauration s'arrête sans rien laisser à
moitié fait. Pour vérifier qu'une sauvegarde se restaure
bien sans toucher à la production, lancez sur elle `repeter-mise-a-jour.sh` : il fait
précisément cette restauration dans une base jetable.

## Voir aussi

Les nouveautés de chaque version sont dans le fichier `CHANGELOG.md` du dépôt et dans
l'écran « Nouveautés » de Tunnel.
