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
(le format est décrit dans son champ `_aide`).

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
- Les données sont celles du scénario fictif : relire chaque capture avant publication.
