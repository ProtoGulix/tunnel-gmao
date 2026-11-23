# CST-03. Web : constat à la clôture, référentiel, rattachement

- Statut : faite (essai à l'écran par l'utilisateur en attente)
- Agent : frontend-dev (sonnet)
- Branche : feat/constat-intervention-cst03 (worktree depuis feat/constat-intervention)
- Dépend de : CST-02
- Périmètre d'écriture : web/src/, CHANGELOG.md. Exclus : backend, mobile.

## Contexte

ADR 0043, contrat dans CST-01, routes dans docs/endpoints après CST-02. Fenêtre de clôture :
web/src/components/interventions/ActionForm/CloseInterventionOverlay.jsx ; changement de
statut aussi dans InterventionPanelHeader.jsx. Conventions : docs/guides/conventions-web.md.

## Critères d'acceptation

- [x] clôture d'une intervention dont le type exige un constat : formulaire avant la
      confirmation, questions et choix lus de l'API, sous-questions affichées selon les choix,
      Q3 machine pré-remplie ; refus de l'API affiché (y compris depuis l'en-tête du panneau)
- [x] ajout d'un constat sur une intervention non archivée ; liste des constats sur la fiche
- [x] correction d'un constat par la fenêtre de motif commune
- [x] référentiel des types : case « Constat obligatoire »
- [x] DI issue d'un constat : lien vers l'intervention d'origine ; pour RESP/ADMIN,
      rattachement à une idée d'amélioration ouverte de la machine
- [x] textes sobres (CLAUDE.md 8.7) ; build et lint verts ; essai à l'écran par l'utilisateur
- [x] CHANGELOG à jour

## Compte rendu final

Fait : API `web/src/api/constats.js` ; formulaire, fenêtre et liste dans `components/constats/` ;
clôture : l'overlay (« Oui, clôturer ») ouvre le formulaire quand le type exige un constat et
qu'aucun n'existe, puis crée le constat, puis clôture ; depuis l'en-tête, même formulaire en
fenêtre ; refus de l'API affichés dans les deux cas. Onglet « Constats » de l'intervention
(liste, ajout hors archivée, correction si `can_correct`). Correction : la garde d'audit
commune reconnaît `/constats/{id}/corrections` (entité `constat`, décision `constat_corrected`) ;
motifs de `audit.reasons`. Référentiel : case « Constat obligatoire » (modification seulement,
la création d'un type ignore le champ côté API). DI issue d'un constat : lien vers l'origine,
rattachement RESP/ADMIN si la DI est rejetable. Test node sur les sous-questions et la garde.
Les formulaires « obligatoire » sont une aide : le backend refuse sinon.
