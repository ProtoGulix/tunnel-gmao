# ADT-06. Guide et captures de l'accueil direction

- Statut : faite
- Agent : doc-writer (haiku), captures par l'agent principal
- Branche : feat/accueil-direction-a-trancher
- Dépend de : ADT-04, ADT-05
- Périmètre d'écriture : docs/site/ (pages responsable, demande d'intervention), docs/site/scripts/captures.json, scénario de démonstration si une donnée manque (urgence, blocages de plus de N jours), deploy/README.md (vérification), CHANGELOG.md, cette fiche.

## Critères d'acceptation

- [x] page d'accueil direction réécrite (ligne de bilan, À trancher, cartes, côté maintenance, où), urgence d'une demande décrite là où se crée une demande
- [x] captures reprises sur la démonstration jetable et relues ; npm run docs:build sans lien mort ; check.sh vert

## Compte rendu

- Scénario : `priorite` sur dix demandes ouvertes (2 urgentes, 3 importantes), trois demandes ouvertes de plus de 90 jours (I208 à I210), une intervention en attente de la production depuis plus de 7 jours avec note (I211). Le chargeur lit `priorite` et la `note` d'un statut.
- Guide : accueil.md réécrit ; urgence décrite dans demandes.md et technicien/signaler-un-probleme.md ; index.md ajusté. Le bouton « En attente » (accueil seulement) remplace l'avertissement de demandes.md.
- Captures : accueil, accueil-bilan (remplace accueil-liste, supprimée), accueil-blocages, demande-urgence, rejouées et relues.
- docs:build sans lien mort ; check.sh vert.
