# ARCH-05. Web : fenêtre « Fiches fermées » en deux blocs d'action

- Statut : faite (2026-11-22)
- Agent : frontend-dev (sonnet)
- Branche : feat/archivage-en-masse-arch05 (worktree depuis feat/archivage-en-masse)
- Dépend de : ARCH-02, ARCH-04
- Périmètre d'écriture : web/src/components/interventions/ExportClosedInterventionsDialog.jsx,
  ArchiveConfirmation.jsx, ExportFeedback.jsx, ExportPreview.jsx, ExportDialogActions.jsx
  (à remplacer ou supprimer si inutile), nouveaux sous-composants dans le même dossier,
  CHANGELOG.md (compléter l'entrée existante). Exclus : backend, mobile, docs/site, hooks
  (sauf correction indispensable signalée), EquipementSearch et tout composant partagé.

## Contexte

Second essai de l'utilisateur (2026-11-22) : fonctionnel, mais intégration, position des
boutons et textes à revoir (fenêtre étroite, boutons sur trois lignes). Mise en page choisie
par l'utilisateur, à suivre :

    Fiches fermées : exporter ou archiver
    Période de fermeture, 100 fiches au maximum.

    Fermées du [date]   au [date]
    Équipement  [champ existant, inchangé]
    [x] Inclure les fiches déjà imprimées

    ┌ 16 fiches fermées du 01/11 au 22/11/2026 ┐   (résumé de l'aperçu)

    ┌ Exporter ───────────┐ ┌ Archiver ───────────┐
    │ Pour imprimer ou    │ │ Sortir les fiches   │
    │ classer les fiches. │ │ de la liste, sans   │
    │ [Imprimer (PDF)]    │ │ les imprimer.       │
    │ [Télécharger (ZIP)] │ │ [Archiver 16 fiches]│
    └─────────────────────┘ └─────────────────────┘
                                         [Fermer]

Choix de l'utilisateur : le champ équipement (EquipementSearch) n'est pas modifié.

## Critères d'acceptation

- [x] fenêtre élargie (de l'ordre de 640 px) ; sur écran étroit, les deux blocs passent l'un sous l'autre
- [x] titre « Fiches fermées : exporter ou archiver » et description courte comme ci-dessus
- [x] résumé de l'aperçu dans un encadré (Callout ou Card Radix) : « N fiche(s) fermée(s) du JJ/MM au JJ/MM/AAAA » (dates au format français), et les états existants (calcul en cours avec Spinner, aucune fiche, plus de 100, erreur du backend telle quelle)
- [x] bloc Exporter : phrase d'aide, « Imprimer (PDF) », « Télécharger (ZIP) » ; après un export réussi, « Marquer ces fiches comme imprimées » et son résultat s'affichent dans ce bloc
- [x] bloc Archiver : phrase d'aide, bouton « Archiver N fiche(s) » (couleur orange existante) ; la confirmation s'affiche dans ce bloc, dates au format français, avec le rappel que l'archivage ne se défait pas depuis l'écran ; le résultat de l'archivage s'affiche dans ce bloc
- [x] seul « Fermer » reste en pied de fenêtre, à droite
- [x] comportement inchangé : aperçu avec délai, boutons grisés si aperçu inconnu, à 0 ou au-delà du plafond, Spinner sur le bouton en cours, fenêtre non fermable pendant une opération, recalcul de l'aperçu après marquage
- [x] eslint sans erreur sur les fichiers touchés (complexité ≤ 10) ; build du web ; scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») : entrée existante ajustée aux nouveaux libellés

## Compte rendu final

Fait : fenêtre à 640 px, titre et description de la maquette, résumé dans un Callout (dates
JJ/MM/AAAA via formatInterventionDate ; année du premier jour omise si identique), deux blocs
Exporter et Archiver (Grid 1 colonne sur écran étroit, 2 dès « sm »), « Fermer » seul en pied.
Le résultat d'un marquage ou d'un archivage s'affiche dans le bloc qui l'a lancé. L'erreur et
la progression restent au-dessus des blocs. Hooks inchangés. ExportDialogActions supprimé,
ExportBlocks créé. Vérifié : eslint, npm run build et scripts/check.sh verts. Non essayé à
l'écran (rendu, passage en une colonne, aperçu après marquage).
