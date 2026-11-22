# IRR-02. Fronts : une intervention archivée ne se rouvre pas, archivage dit irrévocable

- Statut : faite (2026-11-22)
- Agent : frontend-dev (sonnet)
- Branche : feat/archivage-irrevocable-irr02 (worktree depuis feat/archivage-irrevocable)
- Dépend de : ADR 0041 (IRR-01 porte la règle en base, développée en parallèle)
- Périmètre d'écriture : web/src/components/interventions/InterventionDetailPanel.jsx et
  l'en-tête qui affiche le sélecteur de statut (InterventionPanelHeader et ses sous-composants),
  web/src/components/interventions/ArchiveConfirmation.jsx, web/src/components/interventions/ExportBlocks.jsx
  (texte d'aide du bloc Archiver), mobile/src/pages/interventions/InterventionDetailPage.jsx (et
  le composant de statut qu'elle utilise), tests node éventuels, CHANGELOG.md.
  Exclus : backend, docs/site, toute autre partie des fronts.

## Contexte

ADR 0041 : l'archivage (`printed_fiche` vrai) est irrévocable et une intervention archivée
fermée ne peut pas être rouverte ; la base refuse (400, « Une intervention archivée ne peut pas
être rouverte »). Aujourd'hui le web laisse le statut modifiable une fois fermée
(`canChangeStatus`, InterventionDetailPanel.jsx, commentaire ADR 0028) et le mobile rouvre par
`submitReopen`. Le front reflète la règle pour ne pas proposer une action vouée à l'échec ; la
base reste seule juge. Champ côté web : `printedFiche` (web/src/api/interventionMappers.js) ;
côté mobile : `printed_fiche` brut.

## Critères d'acceptation

- [x] web : intervention fermée et archivée : le statut n'est plus modifiable ; une indication sobre (badge ou infobulle) dit « Archivée : ne peut pas être rouverte » ; une intervention fermée non archivée se rouvre comme avant
- [x] mobile : même règle sur la page de détail (pas de changement de statut proposé, même indication)
- [x] confirmation d'archivage (web) : « L'archivage est irrévocable : ces fiches ne pourront plus être rouvertes. » remplace « L'archivage ne se défait pas depuis l'écran. » ; texte d'aide du bloc Archiver cohérent
- [x] le message d'erreur du backend reste affiché tel quel si la base refuse malgré tout
- [x] eslint sans nouvelle erreur sur les fichiers touchés ; builds web et mobile ; scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») complété

## Compte rendu final


Fait : règle `isArchivedClosed` (archiveRules.js web et mobile) ; web : statut non modifiable et
badge « Archivée : ne peut pas être rouverte » dans l'en-tête, confirmation et aide du bloc
Archiver mises à jour ; mobile : bouton Statut masqué et mention sous le code. Le message d'erreur
du backend reste affiché par les chemins existants (inchangés). Non vérifié : rendu à l'écran.

Après essai (2026-11-22), à la demande de l'utilisateur : la mention est réduite à « Archivée »
(badge sans icône sur le web, texte court sur le mobile).
