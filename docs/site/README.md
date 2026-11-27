# Guide utilisateur : captures d'écran

Les captures du guide sont prises par script sur une démonstration jetable (ADR 0037) et
enregistrées dans `public/captures/<identifiant>.webp`.

## Prérequis

- Docker et le plugin Compose v2, `flock` (util-linux), `git`.
- Chromium du cache Playwright (`~/.cache/ms-playwright/chromium_headless_shell-*`) ou la
  variable `TUNNEL_CHROMIUM` vers un exécutable Chromium.
- `npm install` dans `docs/site/`.

## Commande

```sh
cd docs/site
npm run docs:screenshots
```

Durée mesurée : environ 2 minutes avec les images déjà en cache (la première construction des
images est plus longue). Ajouter une capture : ajouter une entrée dans `scripts/captures.json`
(le format est décrit dans son champ `_aide`), puis la citer dans la page. Une entrée peut se
limiter à une zone de l'écran (un formulaire, une carte) avec `zone`, et remplir des champs
avec l'étape `saisir`.

À reprendre avant chaque version (CLAUDE.md, section 12). `scripts/check.sh` lance
`scripts/verifier-captures.mjs` : il échoue si une image citée n'a pas d'entrée, si une entrée
n'est citée nulle part, ou si un fichier est absent ou orphelin.

Options de mise au point : `CAPTURES_ONLY=id1,id2` ne prend que ces captures,
`CAPTURES_DEBUG_DIR=<dossier>` y enregistre une image de la page en cas d'échec.

## Garde-fous

- Projet Compose `tunnel-demo-guide`, port libre à partir de 18190, fichier d'environnement
  temporaire (secrets aléatoires, jamais versionné). Le script refuse les projets `tunnel` et
  `tunnel-demo`, et les ports 8080 et 8090 : ni la base de dev ni la démonstration publique ne
  sont touchées.
- En fin d'exécution, même en cas d'erreur ou d'interruption : `docker compose -p
  tunnel-demo-guide down -v` et suppression du fichier d'environnement. Aucune image n'est
  supprimée : `docker-compose.demo.yml` fixe les étiquettes `tunnel-demo-api:local` et
  `tunnel-demo-web:local`, partagées avec la démonstration publique.
- Compte administrateur (`compte` : `admin` dans le manifeste) : il n'existe que sur cette
  instance jetable (`admin@guide.example.com`), son mot de passe aléatoire est lu dans les
  journaux de son API. Aucun accès à la démonstration publique ni à la base de dev.
- Les données sont celles du scénario fictif : relire chaque capture avant publication.
