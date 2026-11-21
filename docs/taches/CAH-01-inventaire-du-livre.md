# CAH-01. Inventaire du livré au tag v5.11.0

- Statut : faite (2026-11-21)
- Agent : Explore (sonnet), quatre explorations parallèles en lecture seule
- Branche : docs/cahier-fonctionnel (depuis develop, ADR 0008)
- Dépend de : rien
- Périmètre d'écriture : aucun (lecture seule) ; le compte rendu est intégré par l'agent principal

## Contexte

Le cahier fonctionnel (docs/cahier-fonctionnel.md) ne doit présenter comme livré que ce qui
est vérifié dans le code. Le code de develop est identique à celui du tag v5.11.0
(`git diff --stat v5.11.0 develop -- backend web mobile deploy` vide le 2026-11-21).

Quatre domaines : ① chaîne demande → intervention → tâches → actions → demandes d'achat,
journal des statuts ; ② préventif ; ③ équipements, Organisation, Bilan, mobile, rôles ;
④ articles et stock, audit.

## Critères d'acceptation

- [x] chaque fonction livrée citée avec une preuve : table ou migration, route, écran, ADR
- [x] version d'arrivée indiquée quand le CHANGELOG ou un ADR la donne, sinon « version NON VÉRIFIÉE »
- [x] le stock est qualifié exactement (tables et routes de mouvements présentes ou absentes)
- [x] les affirmations reprises sur le site sont contre-vérifiées par l'agent principal (CAH-02)

## Compte rendu final

Quatre explorations Explore (sonnet) en lecture seule, sans écriture ni commande en échec.
Résultats intégrés dans docs/cahier-fonctionnel.md, sections 1 et 2. Contre-vérifié par
l'agent principal : absence de toute table ou route de mouvement de stock, motif exigé pour
ignorer une occurrence (rapport de backlog périmé), activation de la tâche quotidienne par
défaut dans Compose (défaut inverse hors Compose), présence des tables du modèle au tag
v5.0.0, libellés des catégories d'action, versions de l'export de masse, chemins cités en
preuve. Découvertes : noms réels des sites codés en dur dans le front web (backlog
sites-codes-en-dur) ; page /public/purchase-request sans ouverture d'API trouvée (NON VÉRIFIÉ).
Restent NON VÉRIFIÉS : test de rôle par endpoint, audit de la demande créée par le préventif.
