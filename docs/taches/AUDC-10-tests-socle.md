# AUDC-10. Tests qui échouent : socle de l'audit centralisé

- Statut : faite (2026-11-13)
- Agent : test-writer
- Branche : refactor/audit-centralise
- Dépend de : ADR 0018
- Périmètre d'écriture : nouveaux fichiers `backend/tests/integration/test_audc_socle_integration.py`
  et, si besoin, `backend/tests/test_audc_socle.py`. Aucun code de production, aucun
  test existant modifié.

## Critères d'acceptation

Chaque test décrit le comportement voulu par l'ADR 0018, échoue aujourd'hui (échec
rapporté), et porte `xfail(strict=True, reason="AUDC-1x : ...")` avec la tâche qui le
corrigera (AUDC-11 transaction et ordre, AUDC-13 middleware d'audit).

- [x] appel non authentifié d'une mutation sans motif → 401 (et non 400 « motif ») ;
      appel d'un rôle sans le droit → 403 (AUDC-11)
- [x] DELETE d'une entité métier sans motif → demande de motif standard ; avec motif →
      ligne `deleted` avec l'état avant (AUDC-13)
- [x] POST /interventions → une ligne `created` avec l'identifiant créé et l'auteur du
      jeton (AUDC-13)
- [x] POST de sous-ressource (transition de demande ou export de commande) → aucune
      ligne pour une colonne non modifiée (AUDC-13)
- [x] import CSV des demandes d'achat (multipart) → n'est pas cassé par le middleware
      (constater d'abord l'état actuel ; si l'import fonctionne déjà, test normal) (AUDC-13)
- [x] échec d'écriture de l'audit → mutation annulée, rien en base (AUDC-11/13)
- [x] rollback() d'un repo dans une requête dont la route répond 2xx → toute la
      requête annulée et réponse d'erreur (AUDC-11)
- [x] check.sh et test-integration.sh verts (xfail attendus)

## Compte rendu final

test-writer (2026-11-13) : backend/tests/integration/test_audc_socle_integration.py,
10 tests ; 9 en xfail strict, échec constaté (et confirmé par l'agent principal avec
--runxfail) : 400 au lieu de 401 et de 403 ; DELETE sans motif accepté, intervention
supprimée sans trace ; création sans ligne created ; export de commande : 4 lignes de
bruit ; transition : 8 colonnes tracées sans changement ; import CSV cassé (400 « There
was an error parsing the body », défaut visible aujourd'hui) ; échec d'audit : mutation
gardée ; rollback avalé : écriture gardée. Conforme déjà : DELETE avec motif écrit
`deleted` avec l'état avant. Moyens : trigger d'échec sur audit_log posé puis retiré
dans la base de test ; route de test montée par add_api_route le temps du test.
Incident : un `pkill -f` de nettoyage a tué le shell de l'agent ; stack de dev
vérifiée intacte par l'agent principal.
