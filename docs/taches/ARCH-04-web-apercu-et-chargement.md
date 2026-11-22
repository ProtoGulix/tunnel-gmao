# ARCH-04. Web : aperçu, délai de saisie, indicateur de chargement

- Statut : faite (2026-11-22)
- Agent : frontend-dev (sonnet)
- Branche : feat/archivage-en-masse-arch04 (worktree depuis feat/archivage-en-masse)
- Dépend de : ARCH-03 (contrat ci-dessous, développés en parallèle)
- Périmètre d'écriture : web/src/components/interventions/ExportClosedInterventionsDialog.jsx,
  ArchiveConfirmation.jsx, ExportFeedback.jsx, nouveaux sous-composants dans le même dossier,
  web/src/hooks/interventions/ (hook existant et nouveau hook d'aperçu), web/src/api/interventions.js
  (fonction d'appel), tests node web éventuels, CHANGELOG.md. Exclus : backend, mobile, docs/site.

## Contexte

Remarques de l'utilisateur après essai (2026-11-22) : (1) on ne voit pas combien de fiches
seront traitées avant de cliquer ; (2) la saisie des dates ne doit pas noyer l'API (délai) ;
(3) pendant l'archivage, le simple texte est maigre, il faut un vrai indicateur de chargement.
Capture : les boutons du pied de fenêtre s'étalent sur trois lignes.

## Contrat de la route (commun à ARCH-03 et ARCH-04)

`GET /exports/interventions/closed/preview?date_from=AAAA-MM-JJ&date_to=AAAA-MM-JJ[&equipement_id=<uuid>][&include_printed=true|false]`

- Même sélection que l'export et le marquage (période de fermeture, équipement, `include_printed`
  par défaut false), même validation des paramètres (période invalide ou UUID invalide : 400).
- Réponse 200, enveloppe `single` comme `mark-printed` : `{"count": n, "max": 100, "over_limit": bool}`.
  `count` est le nombre de fiches sélectionnées, borné à `max` ; `over_limit` est vrai au-delà de
  `max` (la requête lit au plus max + 1 lignes). Aucune fiche : `count` 0, pas de 404.
- Droits : ADMIN et RESP seulement (ajout à `BULK_EXPORT_PATHS`), limite 30/minute, aucun effet
  de bord, aucun audit (lecture).

## Critères d'acceptation

- [x] aperçu appelé seulement quand les deux dates sont valides, 500 ms après la dernière modification (dates, équipement, case) ; une réponse périmée (critères changés entre-temps) est ignorée
- [x] affichage : « N fiche(s) seront traitées », « Aucune fiche sur cette période », « Plus de 100 fiches : réduisez la période ou choisissez un équipement » ; erreur du backend affichée telle quelle ; état de chargement discret pendant l'aperçu
- [x] export et archivage grisés si l'aperçu donne 0, dépasse le plafond, ou n'est pas encore connu ; le backend reste juge (pas de règle ajoutée : le front lit `count` et `over_limit`)
- [x] la confirmation d'archivage rappelle le nombre de fiches
- [x] pendant export et archivage : Spinner Radix sur le bouton en cours (prop `loading`) et bandeau de progression avec Spinner à la place du texte seul ; fenêtre non fermable pendant l'opération
- [x] pied de fenêtre en deux groupes : « Fermer » à gauche ; « Archiver sans exporter », « Imprimer (PDF) », « Télécharger (ZIP) » à droite ; « Marquer ces fiches comme imprimées » après export reste proposé
- [x] eslint sans nouvelle erreur sur les fichiers touchés ; build du web ; scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») complété

## Compte rendu final

Fait : fonction `fetchClosedInterventionsPreview` (api/interventions.js) ; hook `useClosedExportPreview`
(délai 500 ms, dates complètes seulement, réponse rangée sous la clé des critères donc une réponse
périmée est ignorée) ; sous-composants `ExportPreview` et `ExportDialogActions` (pied en deux
groupes) ; `ExportProgress` (bandeau avec Spinner) dans ExportFeedback ; confirmation d'archivage
avec le nombre de fiches ; actions grisées si l'aperçu est inconnu, à 0 ou au-delà du plafond ;
fenêtre non fermable pendant export et archivage. Spinner et `loading` des Button vérifiés dans la
version installée. CHANGELOG complété.
Vérification : eslint sans erreur sur les fichiers touchés (interventions.js garde ses 2 erreurs de
complexité antérieures) ; build web OK ; check.sh vert. Non vérifié : rendu à l'écran et appel réel
de la route (ARCH-03 en parallèle).

Note (2026-11-22) : le libellé de l'aperçu (« N fiche(s) seront traitées ») et le pied de
fenêtre en deux groupes sont remplacés par ARCH-05 (résumé « N fiche(s) fermée(s) du … »,
deux blocs, seul « Fermer » en pied), à la demande de l'utilisateur.
