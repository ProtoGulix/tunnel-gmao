# 0040. Archiver une intervention, c'est marquer sa fiche imprimée

- Statut : accepté (2026-11-22)
- Date : 2026-11-22
- Affine : ADR 0030 (verrouillage d'une intervention fermée), chantier IMPR (marquage après export)

## Contexte

Le besoin « archivage en masse des interventions fermées » était noté sans définition
(ARCH-01). Dans le code, rien ne s'appelle archive : une intervention fermée est verrouillée
et rangée dans le groupe « À archiver » tant que sa fiche n'est pas marquée imprimée
(`intervention.printed_fiche`) ; marquée, elle sort des listes par défaut et l'historique de
l'équipement l'affiche « Archivée ». Le marquage de masse n'existait qu'après un export
réussi de la même sélection.

## Décision

Décisions de l'utilisateur du 2026-11-22.

1. Une intervention archivée est une intervention dont la fiche est marquée imprimée
   (`printed_fiche = TRUE`). Pas de colonne ni de statut d'archive ; la date et l'auteur
   de l'archivage sont ceux de la ligne d'audit du marquage (règle routinière existante).
2. L'archivage en masse réutilise la route `POST /exports/interventions/closed/mark-printed` :
   même sélection que l'export (période de fermeture, équipement), même plafond de 100
   fiches par appel, mêmes droits (ADMIN, RESP), une ligne d'audit par fiche. Le web permet
   de l'appeler sans exporter d'abord.
3. Pas de filtre « archivées » dans la liste ni de désarchivage en masse : l'historique
   d'un équipement montre les archivées. Constat du 2026-11-22 : aucun écran ne retire le
   marquage (l'onglet Fiche ne propose que « Marquer comme imprimée ») ; seul le PUT de
   l'API le permet. La fenêtre de confirmation et le guide le disent.

## Alternatives écartées

Une notion d'archive séparée (colonnes `archived_at`, `archived_by`, distinctes de
« imprimée ») : migration, reprise des fiches déjà imprimées et double vocabulaire, pour un
besoin que l'audit couvre déjà.

## Conséquences

- Aucune migration, aucun changement de l'API.
- Le guide (responsable, interventions) définit « archivée » comme « fiche marquée imprimée ».
