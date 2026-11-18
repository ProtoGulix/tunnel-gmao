# PREV-06. Web : échéancier, badges de retard, notifications

- Statut : faite (2026-11-18), essai à l'écran validé
- Agent : frontend-dev (sonnet)
- Branche : feat/preventif-automatise, worktree d'une sous-branche
  feat/preventif-automatise-prev06
- Dépend de : PREV-01 (route), PREV-04 et PREV-05 (types de notification émis)
- Périmètre d'écriture : web/src/ (pages/preventive, components/preventive,
  components/equipements/tabs/EquipementPreventifTab.jsx, components/organisation,
  components/layout/Notification*, hooks/preventive, api/preventive*), tests web
  éventuels, CHANGELOG.md (« Non publié »). Exclu : backend, mobile.

## Contexte

Le web ne montre que les plans et les occurrences déjà générées, sans retard ni vue à
venir. La cloche existe (interrogation toutes les 30 s) et prévoit l'icône de
`preventif_echeance`.

## Critères d'acceptation

- [x] Page Préventif : onglet « Échéancier » en trois groupes, « En retard », « Cette
      semaine », « À venir » (états de la route), avec plan, équipement (code cliquable,
      ADR 0009), échéance, jours de retard, lien vers la demande ou l'intervention ;
      plans par heures signalés « non calculé »
- [x] Onglet préventif d'un équipement : badge « en retard » et prochaine échéance
      issus de la route (filtre `machine_id`)
- [x] Page Organisation : tuile « Préventifs en retard » ; textes de définitions.js qui
      disent la génération manuelle corrigés
- [x] Cloche : `preventif_echeance` et `intervention_a_cloturer` affichés avec leur
      libellé et un lien vers l'occurrence ou l'intervention
- [x] Conventions de docs/guides/conventions-web.md respectées ; aucune règle de calcul
      d'échéance côté client (la route fait foi)
- [x] Essai à l'écran par l'utilisateur avant fusion (validé le 2026-11-18)
- [x] Build et lint web verts, scripts/check.sh vert ; CHANGELOG à jour

## Compte rendu final

Fait : page Préventif en deux onglets (Plans, Échéancier, paramètre d'URL `view` car `tab`
est pris par la fiche d'un plan) ; échéancier en groupes En retard, Cette semaine, À venir
puis « non calculé » (plans par heures), regroupement d'après `state` de la route, aucun calcul
d'échéance ; badge de retard et échéance par plan dans l'onglet préventif d'un équipement
(filtre `machine_id`) ; tuile « Préventifs en retard » (omise si la route est indisponible) et
textes de definitions.js corrigés ; cloche : icône et pastille pour `preventif_echeance` et
`intervention_a_cloturer`.

Choix du lien d'une notification d'occurrence : l'occurrence n'a pas de page propre. Le lien
suit `data.intervention_id` puis `data.di_id` s'ils sont présents, sinon ouvre
`/preventive?view=echeancier`. Aucune clé de `data` n'est exigée. Un `intervention_a_cloturer`
ouvre l'intervention (entity_type `intervention`, déjà géré).

Vérifié : scripts/check.sh vert (builds, eslint, 50 tests web). Non vérifié : rendu à l'écran,
formes réelles de `data` des notifications (backend PREV-04/05 en cours), résolution de lien
`resolveEntityPath` (pas de test automatique, fichier JSX).

Reste : essai à l'écran par l'utilisateur (Préventif > Échéancier, fiche équipement > Préventif,
Organisation, cloche).
