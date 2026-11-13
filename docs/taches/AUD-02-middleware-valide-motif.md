# AUD-02. Middleware : motif validé avant la mutation

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : fix/audit-integrite
- Dépend de : AUD-01, ADR 0017 point 1 et 3
- Périmètre d'écriture : `backend/api/audits/middleware.py`, `backend/api/audits/repo.py`
  (lecture du motif), `backend/api/errors/handlers.py` (422 sur model_validator), tests
  AUD-01 (retirer xfail seulement). Exclus : backend/db, alembic, fronts.

## Critères d'acceptation

- [x] avant la route : motif hors entité, OTHER sans texte, motif system d'un utilisateur
      → 400 au format d'erreur habituel, mutation non exécutée
- [x] échec d'écriture d'audit après la route : log ERROR avec entité, id, motif
- [x] 422 avec message sur une ValueError de model_validator (ctx converti en texte)
- [x] tests AUD-01 correspondants passent sans xfail ; aucune autre assertion modifiée
- [x] scripts/check.sh et scripts/test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) : `_reason_refusal` dans le middleware refuse avant la route
(400) un motif inconnu ou inactif, de catégorie system, hors entité (NULL = toutes) ou
OTHER sans texte ; échec d'écriture après la route journalisé en ERROR (entité, id,
motif) ; handler 422 : `ctx` converti en texte. Effet révélé : les helpers de test
prenaient le premier motif actif (PURCHASE_RECEIVED, system), corrigés par AUD-05.
Contrôle de l'agent principal : 4 tests AUD-02 passent sans xfail (marqueurs retirés par
l'agent principal). Clients web et mobile : seuls des ROUTINE en dur, toujours valides.
