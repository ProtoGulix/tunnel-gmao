# ACD-03. Web : urgences, blocages et préventif dans la file

- Statut : faite (2026-11-27)
- Agent : frontend-dev
- Branche : feat/accueil-direction-acd03
- Dépend de : ACD-01 (filtre `idle`), ACD-02 (structure de la file)
- Périmètre d'écriture : web/src/pages/home/, web/src/hooks/home/, web/src/components/home/, CHANGELOG.md, cette fiche. Exclu : backend, mobile, autres pages (composants existants réutilisés sans modification, sinon le signaler).

## Contexte

Suite de la file « à traiter » (ACD-02). Sources : `GET /interventions` (filtres `priority`,
`status`, `idle=true`, compteurs de demandes d'achat `pr_*` avec `include=stats`) et
`GET /preventive-occurrences/schedule?state=...` (lignes avec `occurrence_id`, `di_id`,
`intervention_id`). Bouton réutilisable : `components/equipements/AnticipatePlanButton.jsx`
(`POST /preventive-occurrences/anticipate` avec `plan_id` et `machine_id` de la ligne).

## Critères d'acceptation

- [x] section « Urgentes » : interventions ouvertes de priorité urgente, lien vers chacune
- [x] section « En attente » : interventions `attente_pieces` et `attente_prod` ; pour l'attente de pièces, nombre de demandes d'achat non reçues (achats qui bloquent), lien vers l'intervention
- [x] section « Sans action » : `idle=true`, avec le nombre de jours ; une intervention déjà listée plus haut n'est pas répétée
- [x] section « Préventif » : échéances `overdue` puis `due_soon` ; une échéance qui a déjà sa demande ou son intervention ouvre celle-ci, sinon « Lancer » (avec le droit `anticipate`)
- [x] filtre de site appliqué à chaque section ; section vide masquée
- [x] tests des règles pures (dédoublonnage, choix de l'action préventive) ; ESLint sans erreur nouvelle ; build Vite vert ; scripts/check.sh vert
- [x] textes sobres (CLAUDE.md 8.7) ; CHANGELOG à jour

## Compte rendu final

Fait : sources `useInterventionQueue` (urgentes `ouvert,attente_pieces,attente_prod` + priorité urgent, en attente, `idle=true`, échéancier `overdue` puis `due_soon` en deux appels car `state` n'accepte qu'une valeur), chargées par `Promise.allSettled` : un échec est signalé sans masquer les autres. Règles pures dans `requestQueue.js` (dédoublonnage, `preventiveAction`, notes). Achats non reçus = `total - received - rejected` (déjà calculé par le mapper en `purchasePending`), montrés en attente de pièces. Lancer : `AnticipatePlanButton` + `useQueueAnticipate` (plan et machine de la ligne, droit `PERM.preventive.anticipate`). Liens repris du front : `/interventions/:id`, `/interventions?tab=demandes&id=`.
Hors périmètre, minimal : `api/interventions.js` (paramètre `idle`) et `api/interventionMappers.js` (`daysWithoutAction`). Composants ajoutés : `SiteFilter` (extrait de la vue pour la complexité ESLint), `QueueSections`.
Tests : `npm test` 125 verts, build Vite vert, ESLint sans erreur sur les fichiers touchés (erreurs de complexité préexistantes de `interventions.js` et `interventionMappers.js` inchangées).
Non vérifié : parcours à l'écran (lancement, liens) ; limite de 200 lignes par source.


Contrôle de l'agent principal : diff conforme ; les deux lignes hors périmètre
(api/interventions.js `idle`, interventionMappers.js `daysWithoutAction`) sont acceptées,
nécessaires à la section. Corrigé : « Sans action » était chargée par date de signalement
décroissante (les plus anciennes coupées au plafond de 200) et non triée par inactivité ;
chargement par date croissante et tri par jours sans action décroissants (test ajouté).
Tests existants adaptés à la nouvelle signature sans affaiblissement. NON VÉRIFIÉ : écran (ACD-04).
