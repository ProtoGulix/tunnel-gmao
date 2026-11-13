# Motifs de clôture sur les bases déjà installées

ADR 0016 : les quatre motifs TASK_*, les decision_types (TASK_* et OTHER) et la
désactivation de LEGACY_STATUS_CHANGE ne sont posés que par la seed (base neuve) et, à
la main, dans la base de dev le 2026-11-13. Toute autre instance déjà installée (dont la
production si elle est distincte) ne les a pas : seul OTHER y serait proposé, et
« Changement historique » y resterait visible. Rattrapage : une migration de données
idempotente sur le modèle de 0004_audit_equipements (accord de l'utilisateur requis), ou
le même SQL passé à la main.
