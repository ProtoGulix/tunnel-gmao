# SANTE-01. Test de santé du front web derrière Cloudflare Access

- Statut : faite, vérification à l'écran en attente (2026-11-15)
- Agent : principal
- Branche : fix/web-health-cookies (depuis develop)
- Dépend de : spike 0003 section 3 (constat pendant la répétition de bascule)
- Périmètre d'écriture : `web/src/lib/serverStatus.js`, nouveau
  `web/src/lib/healthRequest.js` et son test, `CHANGELOG.md`, `docs/ETAT.md`

## Contexte

Le test de santé du front web appelait `/api/health` en `no-cors` et
`credentials: 'omit'`. Derrière Cloudflare Access, la requête sans cookie est
redirigée vers la page de connexion d'Access, la CSP (`connect-src 'self'`) bloque la
redirection : bandeau « NetworkError » permanent alors que l'application fonctionne.
Le mobile (`credentials: 'include'`) n'est pas touché. Correction validée par
l'utilisateur le 2026-11-15.

## Critères d'acceptation

- [x] Les options du test de santé envoient les cookies du même domaine et ne sont plus
      en `no-cors` (`healthRequest.test.js`).
- [x] scripts/check.sh vert.
- [ ] Vérifié à l'écran derrière Cloudflare Access (après intégration, sur la dev).

## Compte rendu final

Options extraites dans `healthRequest.js` (module pur, testable sous `node --test`,
qui ne résout pas l'alias `@/`). Le test porte sur le nouveau module : il n'a pas pu
échouer avant le correctif, faute de module à tester. NON VÉRIFIÉ : comportement à
l'écran.
