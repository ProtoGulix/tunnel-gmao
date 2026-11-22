# GUIDE-06. Guide aligné sur les libellés de la 5.13.0

- Statut : faite (2026-11-22)
- Agent : doc-writer (sonnet : distinguer tâche et occurrence demande du jugement)
- Branche : fix/libelles-annulee-et-guide (depuis develop, ADR 0008)
- Dépend de : ADR 0039, PRIO-03, PRIO-04, CLAUDE.md 12.3 (documentation avant la version)
- Périmètre d'écriture : docs/site/**/*.md (hors node_modules), docs/site/public/schemas/*.svg.
  Exclu : code, captures d'écran (prises par script sur la démonstration), CHANGELOG, ETAT.

## Contexte

La 5.13.0 a changé des libellés sans que le guide suive (constat du 2026-11-22) :
- tâche `skipped` : « Annulée » partout (était « Ignorée »), bouton « Annuler » (était
  « Ignorer ») sur le web et le mobile, fenêtre de motif du mobile « Pourquoi annuler cette
  tâche ? » ; tâche `done` « Terminée », `todo` « À faire » ; étapes de gamme « À faire »,
  « Terminée », « Annulée » ;
- statut d'intervention : un seul jeu de libellés partout, « Ouvert », « Attente pièces »,
  « Attente production », « Fermé » ;
- Coordination : affiche aussi les interventions en attente de pièces ou de production ;
- priorité : « Normale » (valeur `normal`), refus d'une valeur inconnue.

Ne change PAS ce qui concerne les **occurrences préventives** : « Ignorer une occurrence »,
statut « Ignorée » d'une occurrence, bouton **Ignorer** de la page des occurrences restent
tels quels (code inchangé). Les lignes « ignorées » de l'import CSV des achats aussi.

## Critères d'acceptation

- [x] Plus aucune mention d'une tâche « ignorée » ni d'un bouton « Ignorer » pour une tâche
      dans docs/site (grep), schémas SVG compris (cycle-tache.svg et autres) ; les ancres et
      titres de section renommés sans casser de lien.
- [x] responsable/coordination.md : libellés identiques à la fiche, interventions en attente
      visibles ; ce qui reste vrai (échec silencieux d'un changement en ligne) est gardé.
- [x] Chaque affirmation modifiée vérifiée dans le code (web/src, mobile/src) ; rien de non
      livré ajouté (ADR 0037).
- [x] `npm run docs:build` dans docs/site passe sans lien mort.

## Compte rendu final

Fait (doc-writer, sonnet) : 13 pages et 2 schémas SVG (texte seul) ; tâche « annulée » et
bouton « Annuler » vérifiés dans web/src et mobile/src ; Coordination décrite avec les
interventions en attente (requête vérifiée), échec silencieux en ligne gardé ; section
« Annuler une tâche » sans lien entrant cassé. Restes justifiés de « ignorer » : occurrences
préventives, import CSV, une phrase qui cite les deux cas. L'agent n'avait pas de terminal :
construction et commit faits par l'agent principal.

Compléments de l'agent principal, sur les constats de l'agent : priorité « Normale » sur le
web (« Normal » auparavant), « Attente production » sur le mobile, occurrence `completed`
« Clôturée » dans le guide (libellé réel du web) ; avant, dans la même branche : quatre
libellés « ignorée » de tâche restés dans les fronts. Guide construit sans lien mort, 88
tests web, builds web et mobile verts.

NON VÉRIFIÉ : captures d'écran du guide (prises par script sur la démonstration) qui
peuvent montrer d'anciens libellés ; à reprendre avec GUIDE-04.
