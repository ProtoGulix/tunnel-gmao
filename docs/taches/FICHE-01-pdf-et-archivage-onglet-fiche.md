# FICHE-01. Onglet Fiche : PDF affiché et archivage à l'unité

- Statut : faite (2026-11-27)
- Agent : principal
- Branche : fix/fiche-pdf-et-archivage (depuis develop)
- Dépend de : signalement et accord de l'utilisateur du 2026-11-27 (correctif et politique partielle en dev) ; ADR 0041
- Périmètre d'écriture : deploy/nginx/tunnel.conf.template et tunnel.dev.conf.template (en-tête Content-Security-Policy seulement), web/src/components/interventions/ (SheetTab, InterventionDetailPanel, archiveRules et son test), docs/site/responsable/interventions-taches.md, CHANGELOG.md, docs/ETAT.md, cette fiche. Exclus : backend, mobile.

## Contexte

Depuis la 5.0.0, en production et en démonstration, l'onglet Fiche affiche « Votre navigateur
ne peut pas afficher le PDF » : la CSP du proxy porte `object-src 'none'`. Le proxy de dev
n'a pas de CSP, d'où un bug invisible en dev. Le bouton « Marquer comme imprimée » n'est
passé que si l'intervention n'est pas verrouillée ; or une intervention fermée l'est
toujours, et c'est le seul cas où le marquage archive (ADR 0041).

## Critères d'acceptation

- [x] CSP de production : `object-src blob:; frame-src blob:` (Chromium charge le PDF d'un `<object>` dans un cadre interne : `object-src` seul ne suffit pas, constaté par essai)
- [x] CSP partielle en dev (directives que Vite ne touche pas), en-tête servi par le proxy de dev
- [x] bouton visible si fiche non imprimée et droit `interventions.update`, fermée ou non ; confirmation avant archivage sur une fermée
- [x] tests `archiveRules.test.js` (affichage du bouton, archivage seulement si fermée)
- [x] scripts/check.sh vert ; CHANGELOG (« Non publié ») et guide à jour

## Compte rendu final

Fait : CSP de production et de dev ; règles `canMarkPrinted` et `markPrintedArchives`
(archiveRules.js) ; sous-composant `MarkPrinted` avec confirmation dans SheetTab ; guide
(archivage à l'unité) ; CHANGELOG.

Vérifications : essai dans Chromium (Playwright, page de test servie avec la CSP) :
`object-src 'none'` bloque (violation `object-src`), `object-src blob:` seul bloque
encore (violation `frame-src`), `object-src blob:; frame-src blob:` sans violation ;
la CSP partielle de dev sans violation. Proxy de dev redémarré : nginx accepte le gabarit,
en-tête servi, /docs/ répond 200. check.sh vert (117 tests web), ESLint propre sur les
fichiers touchés, build Vite vert.

Commandes en échec, corrigées : premier lancement de Playwright sans chemin du navigateur
(version de navigateur attendue absente) ; ESLint `complexity` 13 sur SheetTab, corrigé
en sortant `MarkPrinted`.

NON VÉRIFIÉ : affichage réel du PDF dans l'application en production (à constater après
reconstruction du conteneur web) ; gabarit de production non passé à `nginx -t` (seule la
valeur de l'en-tête change). Hors périmètre : `PdfViewer` de GenericTabComponents.jsx est
inutilisé.

Reviewer : APPROUVÉ AVEC RÉSERVES. Double ligne vide corrigée, ETAT.md mis à jour ;
archivage à l'unité sans décision d'audit `printed_fiche_changed` reporté
(docs/backlog/archivage-unitaire-sans-decision-d-audit.md).
