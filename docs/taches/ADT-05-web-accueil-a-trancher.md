# ADT-05. Web : accueil « Ce qui attend votre décision »

- Statut : fait (à relire à l'écran)
- Agent : frontend-dev
- Branche : feat/accueil-direction-a-trancher
- Dépend de : ADT-02, ADT-03, ADR 0047 point 1 ; maquette de l'utilisateur du 2026-11-28 (référence de structure, pas de CSS repris)
- Périmètre d'écriture : web/src/pages/home/TechnicalDirectionHomeView.jsx, web/src/components/home/, web/src/hooks/home/, web/src/api/ (nouvelle lecture), tests front, CHANGELOG.md, cette fiche. Exclu : backend, autres accueils.

## Critères d'acceptation

- [x] ligne de bilan depuis `/stats/demandes` (weeks=8) : à qualifier, plus de 90 jours, entrées, sorties, sens de la tendance ; lien qui déplie le bilan détaillé existant
- [x] « À trancher » : Urgentes, puis plus anciennes d'abord ; plus de 90 jours regroupées, tronquées avec « Voir les N autres » ; boutons selon `allowed_transitions` ; Accepter par AcceptRequestDialog, Rejeter par la fenêtre d'audit commune ; la ligne quitte la liste après succès
- [x] cartes « À voir avec l'acheteur » et « À voir avec la production » depuis `/stats/blocages` : seuil lu dans la réponse, badge Urgente, durée, causes ; carte vide factuelle ; clic vers l'intervention
- [x] « Côté maintenance » : sans action et préventifs en retard, liens vers leur liste ; « Où ça s'entasse » : sites puis équipements, vers la liste filtrée
- [x] filtre de site appliqué à tous les blocs ; tuiles et repli de l'ADR 0046 retirés, code mort supprimé
- [x] lisible à 375 px de large et en 1366×768 ; textes sobres (CLAUDE.md 8.7) ; aucun chiffre par personne
- [x] règles pures testées (tri, regroupement, libellés de cause) ; npm run lint et tests verts ; CHANGELOG

## Compte rendu final

Fait : accueil refait sur l'ADR 0047 (page, BilanLine, ToDecideList, DecisionRow, BlockCard, MaintenanceSide, PileUp ; hooks useBlocages, useMaintenanceSide, useDirectionHome, règles pures dans decisionQueue.js). Client `api/blocages.js` ; option `sort` de fetchInterventionRequests (ajout minimal, commun avec ADT-04). Supprimés : tuiles, repli du bilan, liste et détail filtrés, sélection par adresse, filtre du bilan, leurs tests. DemandBilan et BarList conservés, sans clic de filtre.

Choix : regroupement par `from_days` de la dernière tranche de l'API ; ordre de l'API conservé. Liens « Où ça s'entasse » vers `/equipements?id=` (la liste des demandes n'accepte pas de filtre d'équipement dans l'adresse). « Sans action » mène à `/interventions` (pas de filtre `idle` dans l'adresse), « en retard » à `/preventive`. Pas de table front des statuts d'achat dérivés : libellés courts dans decisionQueue.js. « Revue par lot » de la maquette non faite (backlog, ADR 0047).

Non vérifié : rendu à l'écran (375 px, 1366x768), aucun serveur lancé. Le compte « sans action » plafonne à 200.
