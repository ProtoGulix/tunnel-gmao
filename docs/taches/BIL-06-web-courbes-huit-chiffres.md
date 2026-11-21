# BIL-06. Web : courbe et tendance sur les huit chiffres

- Statut : faite
- Agent : frontend-dev
- Branche : feat/bilan-etat-allege (depuis develop, ADR 0008)
- Dépend de : ADR 0034 point 12 ; BIL-05 (en parallèle, forme fixée par l'ADR)
- Périmètre d'écriture : web/src/components/bilan/, web/src/api/service-status.js,
  web/src/hooks/bilan/, web/src/hooks/service-status/, CHANGELOG.md (« Non publié »), cette
  fiche. Exclus : onglets Audit et Qualité, backend/, mobile/, dépendances.

## Contexte

Les cartes charge, fragmentation, pilotage et attente de pièces n'ont ni courbe ni tendance.
L'API les ajoute (ADR 0034 point 12) : `monthly` et `trends` dans /stats/service-status,
`waiting_parts_count` mensuel et `trends.waiting_parts_count` dans /stats/organisation.

## Critères d'acceptation

- [x] Les huit cartes ont la même présentation : mini-courbe et flèche de tendance grise
      quand les données existent, rien sinon (ancienne API ou série trop courte).
- [x] api/service-status.js expose `monthly` et `trends` ; absence tolérée.
- [x] Description accessible de la courbe au bon format pour chaque chiffre (%, nombre).
- [x] Tests `node --test` des fonctions pures touchées ; tests existants inchangés.
- [x] `cd web && npm test && npm run build` verts ; aucune nouvelle erreur eslint dans les
      fichiers touchés ; scripts/check.sh vert ; CHANGELOG à jour.

## Compte rendu final

Les trois cartes de /stats/service-status lisent `monthly` et `trends` (api/service-status.js,
pourcentage null conservé, absence tolérée) ; la carte d'attente de pièces lit
`monthly[].waiting_parts_count` et `trends.waiting_parts_count` de /stats/organisation.
Unités : les deux endpoints renvoient des pourcentages de 0 à 100 (la part d'organisation est
aussi arrondie de 100 x part), donc formatPct partout. Pas de nouveau test : aucune fonction
pure ajoutée (le mappage est dans le module d'API, non importable sous node --test).
Fichiers : api/service-status.js, ServiceKeyFigures.jsx, CHANGELOG.md, cette fiche.
