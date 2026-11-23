# CSV-02. Web : vues du constat et de la demande, couleurs de statut

- Statut : faite
- Agent : frontend-dev (sonnet)
- Branche : fix/constat-suivi-et-vues-csv02 (worktree depuis fix/constat-suivi-et-vues)
- Dépend de : CSV-01 (contrat ci-dessous, développé en parallèle)
- Périmètre d'écriture : web/src/components/constats/, web/src/components/intervention-requests/,
  web/src/components/preventive/PreventivePlanDetail.jsx (badge seulement),
  web/src/components/shared/ (nouveau badge), leurs tests, docs/site (pages du constat).

## Contexte

Demande de l'utilisateur du 2026-11-23 : la vue constat et la vue demande ne sont pas
explicites ; le rejet doit se voir, avec les couleurs standard. Cause du badge bleu : la
couleur des statuts de demande est un hexadécimal (request_status_ref.color, #ef4444 pour
rejetee) passé au `color` d'un Badge Radix, qui attend un nom et retombe sur l'accent bleu.
Même défaut dans PreventivePlanDetail.jsx:67. La fiche de la demande le fait bien
(InterventionRequestDetail.jsx `StatusBadge`, style backgroundColor + '22').

## Contrat attendu de CSV-01 (ajouts)

Constat : `request_status_label`, `request_status_color` (hex), `request_intervention_id`,
`request_intervention_code`, `request_reject_reason` (texte ou null), `source_intervention_code`,
et `question_label` dans chaque réponse. Demande : `source_intervention_code`. Supprimer une
demande issue d'un constat : refus 4xx avec message.

## Travail

1. Un badge de statut de demande partagé (couleur hex du référentiel, comme `StatusBadge`),
   utilisé par la carte de constat, PreventivePlanDetail et la fiche de la demande.
2. Carte de constat (onglet « Constats ») :
   - en tête : machine, puis la demande : code cliquable (entityCodeUrl) + badge de statut ;
   - une ligne d'état en clair selon le statut : nouvelle/en attente « En attente du
     référent » ; acceptée « Acceptée → <code intervention> » (lien) ; rejetée : encadré rouge
     (Callout color red) « Rejetée : <motif> » ; rattachée : « Rattachée à <code> » (lien) ;
   - les réponses groupées par question : `question_label` puis les choix de cette question,
     une ligne par question, dans l'ordre reçu ;
   - type préconisé (`suggested_type_inter`) en badge ; auteur et date en bas.
3. Fiche de la demande issue d'un constat (RequestConstatBlock) : « Constat de
   <source_intervention_code> » en lien, réponses groupées par question comme la carte (même
   composant), type préconisé ; le bloc de rattachement inchangé. Le texte brut de la
   description reste en base (notifications), l'écran montre le bloc structuré à la place pour
   ces demandes.
4. Bouton « Supprimer » masqué pour une demande issue d'un constat (`source_intervention_id`)
   ; le refus serveur s'affiche tel quel s'il arrive quand même.
5. Textes sobres (CLAUDE.md 8.7). Guide (docs/site) : pages du constat et des demandes, si ce
   qu'elles décrivent change.

## Critères d'acceptation

- [x] badge « Rejetée » rouge partout où un statut de demande s'affiche dans le périmètre
- [x] état en clair des quatre cas, réponses groupées par question (tests vitest de la carte)
- [x] fiche de la demande : lien vers l'intervention d'origine par son code, bloc structuré
- [x] Supprimer absent pour une demande issue d'un constat
- [x] scripts/check.sh vert (lint, tests et build web compris)

## Compte rendu final

Fait : badge partagé `RequestStatusBadge` (carte de constat, PreventivePlanDetail, fiche de la demande) ;
carte de constat (demande cliquable, état en clair, réponses par question, type préconisé) ;
RequestConstatBlock structuré (un seul appel au constat, partagé avec le rattachement) ; description
brute masquée et Supprimer retiré pour une demande issue d'un constat ; type `intervention_request`
dans entityCodeUrl ; guide mis à jour. Tests node:test (groupAnswers, requestState, URL). check.sh vert,
build web ok. Non vérifié : rendu visuel et contrat CSV-01 réel (champs absents : replis en place).
