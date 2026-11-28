# FTL-03. Guide : accepter une demande depuis l'accueil direction

- Statut : faite (2026-11-28)
- Agent : principal
- Branche : fix/acceptation-titre-long
- Dépend de : FTL-02
- Périmètre d'écriture : docs/site/responsable/, docs/site/scripts/captures.json et captures, cette fiche.

## Critères d'acceptation

- [x] le guide décrit l'acceptation par le formulaire de création d'intervention ; capture rejouée et relue
- [x] npm run docs:build sans lien mort ; check.sh vert

## Compte rendu

Guide : accueil (Accepter ouvre le formulaire de création), demandes (titre repris de la description, coupé à 200 caractères). Capture `web-direction-accueil-accepter` rejouée et relue (formulaire standard, demande choisie, priorité « Urgent » reprise de l'urgence). docs:build vert.
