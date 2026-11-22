# CPT-01. Tableau de bord équipement : achats ouverts comptés sur le statut dérivé

- Statut : faite (2026-11-22)
- Agent : backend-dev (sonnet)
- Branche : fix/compteur-achats-ouverts-cpt01 (worktree depuis fix/compteur-achats-ouverts)
- Dépend de : docs/backlog/compteur-achats-ouverts-equipement.md ; accord de l'utilisateur du 2026-11-22
- Périmètre d'écriture : backend/api/equipements/repo.py (CTE `purchase_request_machine` et `purchase_agg` seulement), backend/tests/ (nouveau test d'intégration), CHANGELOG.md. Exclus : vue `purchase_request_derived_status`, migrations, fronts, `purchase_status_agg`.

## Contexte

`open_purchase_requests_count` (equipements/repo.py, vers la ligne 1589) exclut des statuts
bruts inexistants (`closed`, `cloturee`, `cancelled`, `annulee`) : une demande reçue compte
comme ouverte, et dégrade l'état de santé de l'équipement (« N demandes d'achat en cours »).
La vue `purchase_request_derived_status` est la source unique du statut d'une demande (son
commentaire interdit de dupliquer sa logique). Close = `RECEIVED` ou `REJECTED` (filtre
virtuel DONE, purchase_requests/routes.py).

## Critères d'acceptation

- [x] le compteur joint la vue et exclut `derived_status IN ('RECEIVED', 'REJECTED')` ; aucune autre sortie de la requête ne change
- [x] test d'intégration : sur un équipement, une demande ouverte compte 1, une demande reçue (commande fournisseur close ou entièrement reçue) compte 0, une demande rejetée compte 0 ; le test échoue sans le correctif
- [x] scripts/check.sh vert ; CHANGELOG (« Non publié », Corrigé), une ligne

## Compte rendu final

Le compteur `open_purchase_requests_count` joint la vue `purchase_request_derived_status` (colonne
`derived_status` ajoutée à la CTE `purchase_request_machine`) et exclut RECEIVED et REJECTED ;
`purchase_status_agg` est inchangé. Test d'intégration
`test_sante_compte_les_demandes_d_achat_ouvertes_sur_le_statut_derive` : échoue sans le correctif
(la demande reçue déclenchait OPEN_PURCHASE_REQUESTS), passe avec.
