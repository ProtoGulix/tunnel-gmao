# IMPR-03. Historique d'un équipement : montrer les interventions archivées

- Statut : faite (2026-11-17)
- Agent : principal
- Branche : fix/historique-equipement-archivees (depuis develop, ADR 0008)
- Dépend de : IMPR-01, IMPR-02
- Périmètre d'écriture : backend/api/interventions/routes.py (paramètre de lecture),
  backend/tests/test_equipement_dashboard.py, docs/api/endpoints/interventions.md,
  web/src/api/interventions.js, web/src/components/equipements/EquipementActivity.jsx et
  EquipementInterventionsDialog.jsx, web/src/hooks/equipements/useEquipementActivity.js,
  retrait du bloc « Archivées » (InterventionsTabContent.jsx, useInterventionsList.js),
  CHANGELOG, fiches, ETAT ; ni schéma, ni écriture en base

## Contexte

Signalé par l'utilisateur le 2026-11-17 après l'essai d'IMPR-02 : les fiches marquées
imprimées disparaissent de l'historique d'un équipement. Cause, antérieure au chantier :
`GET /interventions` filtre `printed=false` par défaut (fiche imprimée = archivée), et
`printed` ne peut pas valoir « toutes » dans une query string ; la doc de l'endpoint
disait à tort « omis : toutes ». Rien n'est effacé (209 archivées dans la base de dev,
dont des fiches de BRO002 imprimées avant le 2026-11-17). Même cause : le bloc
« Archivées » d'IMPR-02 restait toujours vide. Décisions de l'utilisateur du 2026-11-17 :
paramètre non cassant `include_printed=true`, utilisé par l'historique de l'équipement ;
bloc « Archivées » retiré.

## Critères d'acceptation

- [x] `GET /interventions?include_printed=true` lève le filtre d'archivage, prioritaire
      sur `printed` ; défaut inchangé (test_route_interventions_sans_nouveaux_parametres_inchangee)
- [x] Doc de l'endpoint corrigée (`printed` : défaut false ; `include_printed`)
- [x] Section « Activité » et liste « Voir les interventions » d'un équipement : archivées
      comprises, badge « Archivée »
- [x] Bloc « Archivées » retiré de la page Interventions (4 groupes comme avant)
- [x] Essai à l'écran par l'utilisateur (BRO002, CHOUFFE)
- [x] scripts/check.sh vert ; eslint sans nouvelle erreur ; CHANGELOG à jour

## Compte rendu final

Fait par l'agent principal : paramètre `include_printed` (défaut inchangé, test dans
test_equipement_dashboard.py), doc de l'endpoint corrigée, historique d'un équipement avec
les archivées et badge « Archivée », bloc « Archivées » d'IMPR-02 retiré. Signalés à
l'écran pendant l'essai et corrigés sur la même branche : statut « — » et date absente
dans l'historique (le bloc lisait les champs bruts au lieu des champs convertis par
mapInterventionResponse, défaut antérieur au chantier) ; « Voir les interventions » liste
désormais toutes les interventions de l'équipement, sans période (choix de l'utilisateur :
un projet signalé avant la période y a encore des actions comptées). Cas CHOUFFE (date de
signalement vide) traité par IMPR-04 et IMPR-05.
Contrôles : check.sh vert, test-integration.sh 356, reviewer APPROUVÉ (deux passages ; le
dernier commit cfbab2e, deux lignes de front, relu par l'agent principal), essai à l'écran
validé le 2026-11-17. Erreurs eslint préexistantes laissées : EquipementActivity.jsx
(ListBlock), useInterventionsList.js (segmentation).
