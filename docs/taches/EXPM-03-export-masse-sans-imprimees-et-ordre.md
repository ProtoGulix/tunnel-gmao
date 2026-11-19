# EXPM-03. Export de masse : fiches imprimées exclues, ordre par équipement

- Statut : faite (2026-11-19), essai à l'écran validé
- Agent : principal
- Branche : fix/export-masse-imprimees-et-ordre (depuis develop)
- Dépend de : EXPM-01, EXPM-02, IMPR-01, IMPR-02
- Périmètre d'écriture : backend/api/exports/, tests d'export, web/src (dialogue d'export,
  hook de marquage, api/interventions.js), docs/api/endpoints/exports.md, CHANGELOG, ETAT,
  cette fiche.

## Contexte

Constat de l'utilisateur en production le 2026-11-19 : l'export de masse sort toutes les
fiches fermées de la période, y compris celles déjà imprimées (archivées), et l'ordre de
sortie n'est pas compréhensible (date du dernier passage à « fermé », puis code ; le ZIP
est rangé par nom). Choix de l'utilisateur : imprimées exclues par défaut avec une case pour
les inclure ; ordre par équipement puis date de fermeture, fichiers du ZIP numérotés.

## Critères d'acceptation

- [x] Par défaut, les fiches `printed_fiche` sont exclues ; `include_printed=true` les
      inclut ; message 404 explicite quand seules des imprimées existent (tests)
- [x] Ordre : code d'équipement (sans équipement en dernier), date de fermeture, code
      (test d'intégration)
- [x] ZIP : noms numérotés `001_<code>.pdf` dans l'ordre de sortie (tests)
- [x] Marquage « imprimées » : même sélection que l'export (même `include_printed`)
- [x] Web : case « Inclure les fiches déjà imprimées », transmise à l'export et au marquage
- [x] check.sh et test-integration.sh verts, build web vert, lint sans nouvelle erreur
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-19)

## Compte rendu final

`list_closed_interventions` reçoit `include_printed` (filtre `printed_fiche IS NOT TRUE`)
et trie par `m.code NULLS LAST, closed_at, i.code`. Route GET : paramètre
`include_printed` ; POST mark-printed : champ du même nom. Deux assertions existantes
adaptées au nouveau comportement voulu (noms numérotés ; test de marquage qui inclut
désormais explicitement les imprimées pour garder sa vérification d'idempotence).
Relecture APPROUVÉ ; ajout d'un départage par `m.id` (équipements de même code) après la relecture.
