# AUD-01. Tests qui échouent : audit perdu, 500 sur model_validator, audit des tâches en double

- Statut : faite (2026-11-13)
- Agent : test-writer
- Branche : fix/audit-integrite
- Dépend de : ADR 0017
- Périmètre d'écriture : nouveaux fichiers `backend/tests/integration/test_audit_integrite_integration.py`
  et `backend/tests/test_erreurs_validation.py`. Aucun code de production.

## Contexte

Trois défauts relevés pendant CLO (docs/backlog/audit-erreurs-avalees.md,
erreur-500-model-validator.md, audit-taches-double-ecriture.md). Chaque test doit
échouer sur le code actuel et décrire le comportement voulu (ADR 0017).

## Critères d'acceptation

- [x] intégration, sur une entité autre que task (intervention ou demande) : mutation
      avec OTHER sans texte → attendu 400, entité inchangée, aucune ligne d'audit
- [x] même chose avec un motif actif d'une autre entité (ex. SUPPLIER_DELAY, entité
      purchase_request) → attendu 400
- [x] même chose avec un motif de catégorie system envoyé par un utilisateur → attendu 400
- [x] intégration : fn_audit_log_decision appelée avec un motif inconnu lève une erreur
      (au lieu de renvoyer NULL)
- [x] unitaire : une ValueError levée dans un model_validator d'une route renvoie 422
      avec le message, pas 500
- [x] intégration : une clôture de tâche (PATCH done avec motif) écrit exactement une
      ligne d'audit status_changed
- [x] chaque test échoue aujourd'hui (sortie rapportée) ; les tests existants passent
- [x] marquer ces tests `xfail(strict=True)` avec la référence de la tâche qui les
      corrigera, pour que check.sh reste vert jusqu'au correctif

## Compte rendu final

test-writer (2026-11-13) : 6 tests xfail(strict=True), échec constaté pour chacun.
1. PUT intervention, OTHER sans texte : 200, titre modifié, 0 ligne d'audit (AUD-02).
2. Motif SUPPLIER_DELAY (purchase_request) : 200, 1 ligne d'audit (AUD-02).
3. Motif system PURCHASE_RECEIVED par un utilisateur : 200, 1 ligne (AUD-02).
4. fn_audit_log_decision, motif inconnu : renvoie NULL, ne lève rien (AUD-03).
5. Clôture de tâche : 2 lignes status_changed au lieu d'une (AUD-04).
6. ValueError de model_validator : 500 au lieu de 422 (AUD-02).
Contrôle de l'agent principal : --runxfail relancé, 6 échecs confirmés ; check.sh vert,
test-integration.sh 97 passed et 5 xfailed. NON VÉRIFIÉ : autres entités
qu'intervention, motif à entity_types NULL.
