# PREV-07. Mobile : préventif à faire et cloche de notifications

- Statut : faite (2026-11-18), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/preventif-automatise, worktree d'une sous-branche
  feat/preventif-automatise-prev07
- Dépend de : PREV-01 (route), PREV-04 et PREV-05 (notifications émises)
- Périmètre d'écriture : mobile/src/, tests mobile éventuels, CHANGELOG.md
  (« Non publié »). Exclu : backend, web.

## Contexte

Le mobile n'a aucun écran préventif ni aucune notification : un technicien sur le
terrain ne verrait ni un retard ni une relance. Accord de l'utilisateur du 2026-11-18
pour ajouter les deux dans ce chantier. Les routes `/notifications` existent et sont
ouvertes à tout utilisateur authentifié.

## Critères d'acceptation

- [x] Écran « Préventif à faire » : groupes « En retard » et « Cette semaine » issus de
      la route d'échéancier, lien vers l'intervention ou la demande ; lisible en moins
      d'une minute (terrain first)
- [x] Cloche : compteur des non lues (même intervalle que le web, 30 s), liste, tout
      marquer lu, ouverture de l'élément visé ; les quatre types de notification gérés
- [x] Conventions de docs/guides/conventions-mobile.md respectées
- [x] Essai à l'écran par l'utilisateur avant fusion (validé le 2026-11-18)
- [x] Build et lint mobile verts, scripts/check.sh vert ; CHANGELOG à jour

## Compte rendu final

Fait (branche feat/preventif-automatise-prev07) : écran `/preventif` (deux appels
`schedule?state=overdue` et `due_soon`, aucun calcul d'échéance côté client), cloche sur
l'en-tête de l'accueil (compteur relevé toutes les 30 s) et écran `/notifications` (liste,
tout marquer lu, marquage lu à l'ouverture). Navigation (`utils/notificationLink.js`) :
di_a_traiter vers `/intervention-requests/:id`, intervention_a_cloturer vers
`/interventions/:id`, preventif_echeance vers l'intervention, sinon la demande, sinon
`/preventif` ; pointage_demande (aucun écran mobile) reste sur la liste. Le compteur n'est
interrogé que depuis l'accueil (pas de cloche dans les autres écrans, hors périmètre).
Essai à l'écran : non fait.

Contrôle de l'agent principal (2026-11-18) : diff conforme au périmètre (mobile/,
CHANGELOG, fiche) ; pagination `skip` conforme à la route ; routes mobiles visées par les
liens présentes. Questions soumises à l'utilisateur : cloche sur tous les écrans (en-tête
commun), « charger plus » au-delà de 50 notifications. NON VÉRIFIÉ : rendu sur téléphone,
appels réels.
