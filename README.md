# Tunnel GMAO

GMAO (gestion de maintenance assistée par ordinateur) open source pour les PME
industrielles de 10 à 100 machines et les équipes de maintenance de 1 à 10
personnes. L'action est l'unité de travail réel : temps, complexité et pièces
sont tracés là où le travail se fait.

> Version 5.1.0. Installation : voir `deploy/README.md`.

## Contenu

- `backend/` : API FastAPI + PostgreSQL, source de vérité unique
- `web/` : front web (bureau, responsables, acheteurs)
- `mobile/` : front mobile des techniciens, servi sous `/m`
- `docs/` : philosophie, décisions d'architecture, guides

## Sécurité

Tunnel sert du HTTP. Une instance accessible hors du réseau de l'usine doit
toujours être placée derrière un proxy HTTPS (ADR 0006).

## Licence

AGPL-3.0. Les données appartiennent à l'entreprise qui les produit : aucune
collecte, aucune transmission vers l'extérieur.
