# ADB-03. Guide : bilan de l'accueil direction

- Statut : faite (2026-11-27)
- Agent : principal
- Branche : feat/accueil-direction-bilan
- Dépend de : ADB-02
- Périmètre d'écriture : docs/site/responsable/accueil.md, docs/site/responsable/index.md, captures et docs/site/scripts/captures.json, docs/ETAT.md, cette fiche.

## Critères d'acceptation

- [x] page réécrite : bilan, tuiles, liste au clic
- [x] captures reprises et relues ; npm run docs:build sans lien mort ; scripts/check.sh

## Compte rendu final

Page « Accueil direction technique » réécrite (bilan, tuiles, ouvrir une liste, qualifier,
préventif), index aligné. Captures `web-direction-accueil` (bilan) et
`web-direction-accueil-liste` (nouvelle : tranche 7–30 j, demande choisie) prises sur
démonstration jetable et relues. npm run docs:build sans lien mort.

Contrôle d'ADB-02 par l'agent principal : diff dans le périmètre, aucune assertion retirée ;
écran vu sur démonstration (bilan, filtre par tranche, détail avec Accepter et Rejeter).
NON VÉRIFIÉ : clics d'écriture, rendu sur données réelles (dev, à l'utilisateur).

Revue de la branche : APPROUVÉ AVEC RÉSERVES. Traitées : jour courant lu dans la base
(`current_date`, bornes de semaine dans le fuseau de la session PostgreSQL) ; tests ajoutés
(tranche inconnue, libellés d'un site et d'une tranche absents). Sans objet : la liste ne
charge que les demandes à qualifier, jusqu'à 500 (maximum de l'API).
