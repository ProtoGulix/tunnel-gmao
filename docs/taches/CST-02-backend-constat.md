# CST-02. API : saisie du constat, clôture, demande issue du constat

- Statut : faite
- Agent : backend-dev (sonnet)
- Branche : feat/constat-intervention-cst02 (worktree depuis feat/constat-intervention)
- Dépend de : CST-01, ADR 0043
- Périmètre d'écriture : backend/api/ (nouveau domaine constats, interventions, intervention_requests,
  admin pour constat_required, droits), backend/tests/, docs/endpoints/, CHANGELOG.md.
  Exclus : migrations, fronts. Aucune écriture sur la base de dev.

## Contexte

ADR 0043, contrat commun dans CST-01. Porte de clôture : `_check_closable`
(interventions/repo.py). DI : intervention_requests/repo.py, `suggested_type_inter`.

## Critères d'acceptation

- [x] GET des questions et choix actifs (pour les fronts) ; POST d'un constat sur une
      intervention ; GET des constats d'une intervention (versions courantes) ; correction par
      nouvelle version avec motif d'audit `constat_corrected`
- [x] validators testés : choix unique respecté, sous-question exigée si et seulement si son
      parent est coché, LEVER, SIGNAL et PART obligatoires, choix inconnu ou inactif refusé,
      machine existante
- [x] droits : écriture TECH, RESP, ADMIN ; ACHETEUR et MCP refusés (tests) ; correction par
      l'auteur ou RESP/ADMIN, seulement si la DI est « nouvelle » (tests)
- [x] constat accepté après la clôture ; intervention archivée : constat refusé (tests)
- [x] clôture refusée sans constat courant si le type exige un constat, par tous les chemins
      de la porte unique (test) ; types sans exigence inchangés
- [x] chaque constat crée une DI sur la machine visée, `source_intervention_id` renseigné,
      type préconisé = premier levier coché portant un type, sinon vide (tests) ; auteur réel
      dans created_by ; texte de la DI construit depuis les choix, sans saisie libre ;
      DI signalée, notifiée comme toute DI (pas de mécanique à part)
- [x] une correction recalcule le type préconisé de la DI tant qu'elle est « nouvelle »
- [x] rattachement (RESP, ADMIN) : liste des idées d'amélioration ouvertes de la machine
      (type préconisé PRO) ; rattacher pose linked_request_id et rejette la DI du constat avec
      REJECT_DUPLICATE par le mécanisme existant (tests)
- [x] `constat_required` lisible et modifiable dans le référentiel admin des types
- [x] erreurs sans message brut ; SQL paramétré ; docs/endpoints à jour
- [x] scripts/check.sh et scripts/test-integration.sh verts ; CHANGELOG à jour

## Compte rendu final

Nouveau domaine `api/constats/` (routes, schemas, repo, validators) ; routes (tag `constats`) :
`GET /constats/questions`, `GET|POST /interventions/{id}/constats`, `GET /constats/by-request/{request_id}`,
`POST /constats/{id}/corrections` (201, motif `CONSTAT_CORRECTION`), `GET /constats/{id}/improvement-ideas`,
`POST /constats/{id}/link` (RESP, ADMIN). Détail et codes : docs/api/endpoints/constats.md.

Décisions d'implémentation :
- Porte de clôture : `_check_closable` reçoit le type après mise à jour ; le constat n'est exigé qu'au
  passage à « ferme » (une intervention déjà fermée reste modifiable). Aussi posé à la création déjà
  fermée (`insert_intervention`), seul autre chemin vers « ferme ».
- Rattachement : la transition de rejet existante a sa propre transaction ; le lien est posé d'abord
  et validé après le rejet. Écart de contrat (hors critères) : `GET /interventions/types` expose
  `constat_required` ; `source_intervention_id` est exposé sur les demandes.
- Un type préconisé désactivé depuis est ignoré (DI sans type) plutôt que de bloquer la saisie.
- Droits par défaut : TECH écrit la saisie et la correction (chemins exacts), RESP tout le module.
  Compteurs de la matrice : 272 / 236 / 132 / 166 / 119 (ADMIN, RESP, TECH, ACHETEUR, MCP).
- Tests de clôture existants (CUR) : fixture `cur_sans_constat` (conftest d'intégration), sans
  assertion modifiée ; compteurs de matrice et clés de `GET /interventions/types` mis à jour.

Effet de bord à connaître : tant que les fronts (CST-03, CST-04) n'envoient pas de constat, la
clôture d'une intervention CUR depuis web ou mobile est refusée (400). Les deux branches se fusionnent ensemble.
