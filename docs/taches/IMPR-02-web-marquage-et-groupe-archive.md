# IMPR-02. Web : proposer le marquage après export, « À archiver » sans les imprimées

- Statut : faite (2026-11-17)
- Agent : frontend-dev (sonnet)
- Branche : feat/fiches-imprimees-archive (depuis develop, ADR 0008), worktree de la
  sous-branche feat/fiches-imprimees-archive-impr02
- Dépend de : IMPR-01 (contrat de la route ci-dessous, développés en parallèle)
- Périmètre d'écriture : web/src/components/interventions/ExportClosedInterventionsDialog.jsx
  (et un sous-composant nouveau si la limite de 200 lignes l'exige),
  web/src/api/ (fonction d'appel de la route), web/src/hooks/interventions/useInterventionsList.js,
  web/src/components/interventions/InterventionsTabContent.jsx, tests node éventuels,
  ajoutés au contrôle (nécessaires aux critères de rafraîchissement) :
  InterventionDetailPanel.jsx, pages/interventions/InterventionsListPage.jsx,
  hooks/interventions/useMarkExportedPrinted.js et ExportFeedback.jsx (nouveaux),
  CHANGELOG.md (« Non publié »). Exclu : backend, mobile.

## Contexte

Décisions de l'utilisateur du 2026-11-17 :
1. Après un export de masse réussi (ZIP ou PDF), la fenêtre propose « Marquer ces
   fiches comme imprimées ». Route : `POST /exports/interventions/closed/mark-printed`,
   corps `{ date_from, date_to, equipement_id? }` (mêmes valeurs que l'export), réponse
   `{ marked, total }` (le client web déballe déjà `{ data }`, ADR 0022).
2. Le groupe « À archiver » ne garde que les interventions fermées ou annulées dont la
   fiche n'est pas imprimée (`printedFiche` faux). Les imprimées restent visibles dans
   « Tout » (dans un bloc à part, en dernier) et par la recherche, mais ne comptent plus
   dans « À archiver ».

## Critères d'acceptation

- [x] Après un export réussi, bouton « Marquer ces fiches comme imprimées » dans la
      fenêtre ; jamais avant l'export ni après une erreur ; message de résultat
      (« N fiches marquées imprimées ») ; erreur du backend affichée telle quelle
- [x] La liste des interventions se rafraîchit après le marquage (le nombre « À
      archiver » baisse sans recharger la page)
- [x] « À archiver » : fermées ou annulées non imprimées seulement ; nombre du
      sélecteur cohérent
- [x] « Tout » : les imprimées apparaissent dans un dernier bloc « Archivées » ; la
      recherche les trouve
- [x] Bouton « marquer imprimée » d'une fiche seule : la fiche quitte « À archiver »
- [x] Respect de docs/guides/conventions-web.md ; eslint sans nouvelle erreur sur les
      fichiers touchés ; scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur (le marquage écrit dans la base de dev :
      accord de l'utilisateur au moment de l'essai)
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Client : `markClosedInterventionsPrinted` (api/interventions.js), hook
`useMarkExportedPrinted` et sous-composant `ExportFeedback` (limites de complexité),
bouton affiché seulement après un export réussi pour les mêmes critères. La page
incrémente `refreshToken`, l'onglet relance la liste. Hook liste : bloc `imprimees`
(hors sélecteur, visible dans « Tout »). Marquage unitaire : appelle `onRefreshList`.
Contrôle de l'agent principal : intégration des deux sous-branches (conflit CHANGELOG
résolu), check.sh et test-integration.sh verts (352), reviewer APPROUVÉ. Corrigés
ensuite par l'agent principal : bouton de marquage encore proposé après un export en
échec (constat du reviewer) ; après l'essai à l'écran, bloc d'équipement qui débordait
de la fenêtre (EquipementSearch partagé, passage à la ligne), résultat qui précise les
fiches déjà imprimées, « Fermer » en action principale après marquage.
Essai à l'écran le 2026-11-17 avec l'accord de l'utilisateur (API de dev redémarrée,
256 endpoints synchronisés ; une fiche marquée dans la base de dev) : validé.
Corrigé ensuite par IMPR-03 : le bloc « Archivées » restait toujours vide (l'API ne renvoie
pas les archivées par défaut), il est retiré.
NON VÉRIFIÉ : sur la capture de l'essai, les dates de la fenêtre apparaissaient vides
après le marquage ; aucune remise à zéro dans le code, cause non établie.
