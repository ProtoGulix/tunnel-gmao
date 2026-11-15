# SUIT-03. Finitions avant la version 5.3.0

- Statut : faite (2026-11-15), validée par l'utilisateur (envoi de tech_id NON VÉRIFIÉ à l'écran)
- Agent : principal (check.sh, sous-catégories) ; doc-writer (point 7)
- Branche : fix/finitions-avant-version
- Dépend de : SUIT-01, SUIT-02 ; accord de l'utilisateur du 2026-11-15
- Périmètre d'écriture : scripts/check.sh, web/eslint.undef.config.mjs, web/src (écran
  Référentiel, commentaires eslint morts), docs/api/endpoints, docstrings des routes,
  docs/backlog/suites-audc-etape-2.md, CHANGELOG.md. Exclus : code backend exécutable.

## Contexte

Points retenus par l'utilisateur avant la version : documentation des routes
routinières (point 7), import manquant que check.sh ne voyait pas (point 8), échec sans
message à la création ou modification d'une sous-catégorie d'action.

## Critères d'acceptation

- [x] check.sh lance eslint limité aux noms non définis (no-undef, react/jsx-no-undef)
      sur web/src et mobile/src ; vert sur develop ; un composant non importé le fait échouer
- [x] Sous-catégorie d'action : un échec de création ou de modification affiche un message
- [x] Point 7 : aucune doc ni docstring ne dit « reason_code obligatoire » pour une route
      routinière
- [x] Mobile : création d'intervention depuis une action envoie `tech_id` (ajout du
      2026-11-15, accord de l'utilisateur ; constat de l'inventaire
      docs/backlog/creation-interventions-harmonisation.md)
- [x] scripts/check.sh vert ; CHANGELOG à jour

## Compte rendu final

check.sh lance eslint (config web/eslint.undef.config.mjs) sur web/src et mobile/src,
fichiers .js et .jsx ; les 11 fichiers .ts/.tsx du web ne sont pas couverts (parseur
TypeScript non chargé). Vérifié : un composant non importé fait échouer le contrôle.
Deux commentaires eslint-disable morts (jsx-a11y, règle non configurée) retirés de
TasksPane.jsx. Sous-catégories d'action : échec notifié (onNotify). Point 7 (doc-writer) :
docstrings de 4 fichiers routes.py et 6 pages docs/api/endpoints corrigées, section
commune d'audit-log.md réécrite ; le motif exigé pour une tâche passée directement à
done/skipped vient du contrôle de la route (ADR 0016), pas d'une règle d'audit.
Mobile : `tech_id` envoyé à POST /interventions depuis le formulaire inline (lu dans le
code ; refus 422 NON VÉRIFIÉ à l'exécution avant correctif). check.sh vert ; reviewer
APPROUVÉ AVEC RÉSERVES (couverture .ts, fiche à compléter : traitées ici).
