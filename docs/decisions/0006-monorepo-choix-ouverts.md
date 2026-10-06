# 0006. Monorepo : mobile sous /m, HTTPS par proxy externe, nom tunnel-gmao

- Statut : accepté
- Date : 2026-10-06
- Affine : ADR 0002 (points non tranchés)

## Contexte

L'ADR 0002 laissait ouverts le mode de service du front mobile, la gestion du
HTTPS et le nom du dépôt. Une vérification préalable a aussi montré que
l'installation à vide est impossible aujourd'hui : schema_current.sql contient
41 contraintes UNIQUE malformées (bug de scripts/dump_schema.py) et aucune
donnée de référence.

## Décision

1. Le front mobile est servi par le même nginx sous le sous-chemin /m (base
   Vite '/m/', basename du routeur). Une seule origine : pas de CORS.
2. Le dépôt livre uniquement du HTTP. Le HTTPS est la responsabilité d'un proxy
   externe propre à chaque installation (Cloudflare, Traefik, Caddy...). La
   documentation d'installation l'explique et nginx transmet l'IP réelle depuis
   un en-tête de proxy de confiance configurable.
3. Le dépôt public s'appelle tunnel-gmao (GitHub ProtoGulix/tunnel-gmao). Ce
   nom est occupé par le front web actuel : le monorepo est construit dans
   ~/DEV/tunnel-gmao-monorepo, puis à l'étape 4 l'ancien dépôt est renommé et
   archivé, et les dossiers et services locaux basculent.
4. Le schéma de départ du monorepo est régénéré depuis la base de dev par
   pg_dump --schema-only (lecture seule), sans les tables de Directus, et
   accompagné de données de référence explicites. Critère : une installation
   neuve a le même schéma que la base de dev.

## Alternatives écartées

- Mobile sur un sous-domaine séparé : deux origines, CORS à maintenir.
- HTTPS intégré (Caddy d'office) : alertes de certificat sur les postes d'usine
  en réseau interne ; écarté par l'utilisateur.
- Réparer schema_current.sql à la main : 41 contraintes, et rien ne garantit
  que le reste du fichier soit fidèle.

## Conséquences

- Renommer un dépôt GitHub est une action de l'utilisateur (étape 4).
- Sans TLS intégré, une installation exposée sans proxy circulerait en clair :
  la documentation doit l'interdire explicitement.
