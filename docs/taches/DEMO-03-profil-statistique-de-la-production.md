# DEMO-03. Profil statistique de la production

- Statut : faite (2026-11-21)
- Agent : principal (jamais un subagent : données réelles)
- Branche : feat/base-demonstration
- Dépend de : ADR 0036 point 1
- Périmètre d'écriture : docs/spikes/0005-profil-statistique-demo.md ; base de dev en lecture seule (SELECT d'agrégats uniquement)

## Contexte

Le scénario fictif doit ressembler à une vraie maintenance. On mesure la production (copie
en base de dev) par des agrégats, sans rien en extraire d'identifiable.

## Critères d'acceptation

- [x] requêtes SELECT d'agrégats seulement, listées dans le spike ; aucune écriture, aucune transaction ouverte en écriture
- [x] chiffres arrondis : interventions par mois et par type, actions par intervention, distribution des temps et des scores de complexité, part de chaque catégorie, facteurs les plus fréquents (par code générique du référentiel), demandes d'achat par action, délais de commande, attente de pièces, avance et retard du préventif, profondeur et largeur de l'arbre des équipements, taille de l'équipe
- [x] aucun texte libre, nom, code d'équipement, fournisseur ni date précise dans le spike (relu par l'agent principal)

## Compte rendu final

Profil écrit dans docs/spikes/0005-profil-statistique-demo.md, requêtes dans le .sql voisin ;
exécution en transaction lecture seule forcée (default_transaction_read_only), aucune
erreur. Relu par l'agent principal : chiffres arrondis, aucun texte, nom, code ni date
précise. Écarts de données notés (priorités en double, scores 0 anciens).
