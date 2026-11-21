# DEMO-02. Données de référence sans donnée réelle

- Statut : faite (2026-11-21)
- Agent : Explore (inventaire), puis principal (tri)
- Branche : feat/base-demonstration
- Dépend de : ADR 0036
- Périmètre d'écriture : aucun pour l'inventaire ; une correction de backend/db/seed_reference.sql demande l'accord de l'utilisateur (données de départ de toute installation)

## Contexte

La démonstration est installée comme toute instance : elle reçoit seed_reference.sql. Il ne
doit contenir que des référentiels génériques (motifs, catégories, types), aucun nom de
personne, de site, de fournisseur ou d'équipement de l'usine (voir aussi backlog
donnees-reference-seed).

## Critères d'acceptation

- [x] inventaire des tables remplies par seed_reference.sql, avec pour chacune : générique ou propre à l'usine
- [x] liste des lignes à retirer ou à neutraliser, soumise à l'utilisateur avant toute modification
- [x] grep de contrôle des noms réels connus (sites, entreprise) dans backend/db : vide après correction

## Compte rendu final

Inventaire Explore (sonnet) : 17 tables remplies par seed_reference.sql, toutes génériques
(motifs, catégories, types, statuts, facteurs, rôles) ; aucune personne, site, fournisseur,
article ni équipement ; bootstrap et default_permissions sans donnée réelle. Contre-vérifié
par l'agent principal : git grep des codes et noms de site réels vide dans backend/db.
Aucune ligne à retirer. Corrections de libellés (accents, NULL) déjà au backlog
donnees-reference-seed, hors de ce chantier. Point d'attention : l'INSERT ... SELECT des
types inactifs (fin du fichier) est sans effet sur une base vide.
