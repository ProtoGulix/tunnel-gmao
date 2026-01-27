---
applyTo: '**'
---

# Copilot Instructions - Tunnel GMAO

## Objectif

Stabiliser les suggestions Copilot selon nos conventions pour produire un code simple, maintenable, humain et intelligent. Les règles suivantes priment, quel que soit le modèle d'IA.

## Contexte produit

- Domaine: GMAO tunnel, interventions, actions, stock.
- Source metier obligatoire: docs/REGLES_METIER.md avant toute feature.
- Source technique: docs/tech/CONVENTIONS.md (document maitre), API_CONTRACTS.md, features/standard-specs.md.

## Architecture et structure

- Respecter l'arborescence standard (pages/, components/, hooks/, contexts/, lib/api/, config/). Ne jamais recréer des dossiers ad hoc.
- Utiliser les alias d'import `@/*`. Pas d'import relatif profond.
- Preferez la composition: petits composants focalises, helpers utilitaires dans lib/utils, adapters API dans lib/api/adapters.
- Ne pas dupliquer: factoriser les blocs communs (helpers, hooks, ui wrappers).

## Style et conventions de code

- Interdiction d'emojis dans le code; utiliser les icones Lucide via components/ui.
- Ordre d'import strict: React -> React Router -> libs externes -> UI Radix -> icones -> composants internes -> hooks -> utils -> config.
- Nommer: composants en PascalCase, hooks en camelCase prefixe `use`, constantes en SCREAMING_SNAKE_CASE si globales sinon camelCase.
- Propriete `key` toujours stable (id, jamais index) dans les listes.
- JSDoc obligatoire pour helpers et composants communs; commenter le pourquoi, pas le quoi.

## React et state

- Preferez les composants controles, pas de state implicite.
- Hooks maison: reutiliser `useApiCall`, `useEquipements`, `useInterventionStatusRefs`, `useAuth`, `useError`, `useCache` avant d'en creer de nouveaux.
- Effets: deps completes; proteger les appels initiaux pour eviter les doubles executions (StrictMode). Memoiser les calculs couteux (`useMemo`, `useCallback`).

## API, donnees, erreurs

- Adapter pattern obligatoire: lib/api/adapters/\* mappe les DTOs selon API_CONTRACTS.md; aucune logique metier dans les pages.
- **PHILOSOPHIE ARCHITECTURE: "L'API est la source de vérité, zéro calcul frontend"**
  - **Stats métier** (action_count, total_time, avg_complexity, etc): viennent UNIQUEMENT de l'API via le mapper, jamais recalculées en frontend.
  - **Pas d'agrégations**: interdiction de re-calculer des totaux, moyennes, comptages à partir des données brutes.
  - **Timeline/grouping UI uniquement**: le groupement par jour est strictement pour l'affichage UI, jamais pour la logique métier.
  - **Principe**: frontend reçoit des données COMPLÈTES et CALCULÉES du backend → affiche seulement, ne dérive/re-calcule rien.
  - **Exemple MAUVAIS**: `const totalTime = useMemo(() => calculateTotalTime(actions), ...)` (calcul frontend).
  - **Exemple BON**: `<Text>{interv.stats?.total_time || 0}h</Text>` (donnée API directe).
- Validation et sanitization: utiliser utils htmlUtils (stripHtml, sanitizeHtml) et helpers de validation (ex email) avant envoi.
- Erreurs: utiliser ErrorDisplay/ErrorNotification; pas de `alert/confirm/prompt`. Fournir retry quand pertinent.

## UX, accessibilite, responsivite

- Radix UI: preferer composants natifs Radix et wrappers ui/; props responsive mobile-first (`initial`, `sm`, `md`...).
- Accessibilite: labels explicites, aria-label sur boutons icone, HTML semantique, navigation clavier preservee.
- Pagination ou lazy loading pour listes >100 elements. Eviter les flood API (cache, debounce, status refs caches).

## Performance et securite

- Pas de valeurs sensibles en dur; utiliser env Vite. Sanitizer pour HTML riche. Ne pas faire confiance au client.
- Eviter le rendu inutile: memoisation, suspense de chargement, split logique (tabs lazy-load).

## Formulaires

- Champs controles, erreurs inline avec Callout/AlertTriangle. Un seul systeme de notification unifie.

## Git et livraison

- Messages de commit conventionnel (feat, fix, chore, refactor). Pas d amend sans demande.
- Avant PR: verifier lint/tests si disponibles; maintenir CHANGELOG user-facing.

## Ce que Copilot doit toujours faire

1. Lire/aligner avec docs/tech/CONVENTIONS.md et API_CONTRACTS.md avant de suggerer.
2. **Appliquer la philosophie "API source de vérité"**: stats et métriques métier viennent UNIQUEMENT de l'API, zéro recalculs frontend.
3. Reutiliser composants, hooks, helpers existants au lieu de recréer.
4. Proposer code simple et decoupable, evitant duplication.
5. Expliquer brièvement les choix lorsque la logique est non evidente (commentaire concis).

## Ce que Copilot ne doit jamais faire

- Introduire emojis ou dialogues natifs navigateur.
- Ajouter des dependances sans approbation explicite.
- Ignorer les validations/metiers de REGLES_METIER.md.
- Hardcoder des secrets, URLs, ou bypasser les adapters API.
- **Recalculer des métriques métier en frontend** (stats, totaux, moyennes): utiliser l'API comme source unique de vérité.
- **Créer des helpers/utils pour agréger des données métier** (ex: calculateTotalTime, getUniqueTechs): ces calculs doivent être au backend.

## Gabarit d'instruction Copilot (a coller dans VS Code)

- Contexte: Projet Tunnel GMAO React/Radix. Sources de verite: docs/tech/CONVENTIONS.md, API_CONTRACTS.md, REGLES_METIER.md.
- Style: imports ordonnes, alias @, pas d emojis, composants petits et DRY.
- Patterns: adapters API, hooks existants, error handling unifie, accessibilite obligatoire.
- Attentes: code simple, maintenable, reutilisable; commentaires pour expliquer les decisions non evidentes.
- Interdits: alert/confirm/prompt, duplication de code, hardcode secrets, nouvelles deps sans accord.

## Architecture d'instruction (pour prompts Copilot)

- Cadre: rappeler en tete le domaine (GMAO tunnel) et les sources de verite obligatoires.
- But: decrire l'objectif utilisateur en une phrase, puis les contraintes metier/tech (imports, adapters, accessibilite, pas d emojis).
- Plan d'action: demander a Copilot de proposer une solution DRY, composee de petits blocs reutilisables, en citant les hooks/composants existants a reutiliser.
- Garde-fous: verifier accessibilite, sanitization, pas de dependances nouvelles ni de secrets en dur; preferer caches et pagination pour performance.
- Sortie attendue: code concis et commentes seulement quand la logique n est pas evidente, plus une courte liste de verifications (tests/lint) si pertinent.
