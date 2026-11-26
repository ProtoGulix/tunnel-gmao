# CDL-03. Web et mobile : formulaire de constat, choix exclusif, constat sans demande

- Statut : faite (2026-11-26)
- Agent : frontend-dev (sonnet)
- Branche : feat/constat-demande-selon-levier-cdl03 (worktree depuis feat/constat-demande-selon-levier, après CDL-02)
- Dépend de : ADR 0045, contrat de CDL-02
- Périmètre d'écriture : composants, hooks et utilitaires du constat dans web/src/ et mobile/src/, leurs tests, docs/site/technicien/ et docs/site/responsable/ (pages du constat). Rien dans web/src/components/admin/ (CDL-05 en parallèle), rien dans backend/.

## Contexte

Le formulaire vient de l'API (questions et choix). Chaque choix porte désormais `is_exclusive` et
`creates_request` ; un constat peut n'avoir aucune demande (`request_id` null).

## Travail

1. Cocher un choix exclusif décoche les autres choix de la question ; cocher un autre choix décoche l'exclusif. Lu depuis `is_exclusive`, aucun code en dur.
2. Affichage d'un constat sans demande (bloc du constat sur l'intervention, web et mobile) : « Sans demande », sans lien ni statut ; correction proposée selon `can_correct`.
3. Rien ne suppose qu'un constat a une demande (pas de plantage sur null).
4. Guides : le levier « Rien ne l'aurait évité » ; seuls certains leviers créent une demande (réglage du référentiel).

## Critères d'acceptation

- [x] tests unitaires de la règle d'exclusivité (web et mobile)
- [x] constat sans demande affiché sans erreur (web et mobile)
- [x] npm test et npm run build verts (web et mobile) ; scripts/check.sh vert
- [x] guides à jour

## Compte rendu final

Fait. Règle d'exclusivité dans `toggleChoice` (web : constatRules.js ; mobile : utils/constat.js),
lue depuis `is_exclusive`, sans code en dur. Carte de constat web : « Demande : Sans demande »
sans lien ni statut quand `request_id` est absent ; « Corriger » reste selon `can_correct`.
Le mobile n'affiche aucune liste de constats (formulaire seul) : rien à adapter côté affichage.
Mobile : script `npm test` ajouté (node --test, aucune dépendance) avec utils/constat.test.js.
Guides : technicien/cloturer-rouvrir.md, responsable/demandes.md.

Fichiers : web/src/components/constats/{constatRules.js,constatRules.test.js,ConstatsList.jsx},
mobile/src/utils/{constat.js,constat.test.js}, mobile/package.json (script test), les deux pages docs/site.

NON VÉRIFIÉ : rendu réel à l'écran (web et mobile).
