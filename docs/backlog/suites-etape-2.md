# Suites de l'étape 2 (réserves du reviewer, 2026-10-06)

- Traçabilité du journal des statuts non atomique : si l'écriture d'audit échoue, le statut est enregistré sans trace (seul un logger.error). À rendre transactionnel ou à documenter.
- `_write_audit_log` et `_DIFF_IGNORE` sont importés depuis api/audits/middleware.py alors qu'ils sont privés : les exposer dans un module public (api/utils/audit.py).
- Les tests de route montent un faux middleware d'authentification et de faux repos : ajouter des tests d'intégration avec le vrai JWTMiddleware et une base jetable (étape 3, installation automatique).
- Données de départ de l'étape 3 : inclure la règle audit_rule « intervention » routine (ROUTINE), sinon le changement de statut mobile répond 400.
- Nom du fichier de l'export CSV : order_number injecté tel quel dans Content-Disposition, à assainir.
- Une centaine de `except` lèvent DatabaseError sans journaliser le détail (hors raise_db_error) : centraliser la journalisation.
- Avertissements Pydantic : remplacer les `class Config` par `model_config = ConfigDict(...)`.
- Une clé d'API de rôle ADMIN aurait tous les droits sans vérification de statut : interdire les rôles autres que MCP pour les clés (chantier RBAC, étape 5).
