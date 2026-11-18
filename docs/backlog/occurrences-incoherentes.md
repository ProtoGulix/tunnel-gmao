# Occurrences préventives incohérentes à corriger à la main

Constat du 2026-11-18 (base de dev, copie de production du 2026-11-16, lecture seule).
Décision de l'utilisateur : correction à la main plus tard, pas de migration.

- 1 occurrence `generated` dont la demande est rejetée : BRO_GRAISSAGE sur BRO003,
  DI-2026-0065, prévue le 2026-04-13. PREV-08 traite les rejets à venir, pas celui-ci.
- 3 occurrences `in_progress` dont la demande est clôturée et l'intervention fermée :
  EXT_VIDANGE sur L006 et L001 (2026-04-15), BRO_GRAISSAGE sur BRO351 (2026-04-13).
  Le trigger `fn_sync_status_log_to_intervention` aurait dû les passer `completed`.
  Cause probable : défaut de synchronisation d'avant avril 2026 (corrigé). NON VÉRIFIÉ.

BRO003 est au statut « Rebut » et porte aussi une seconde occurrence `generated`
(2026-04-23) : depuis PREV-08, elle n'apparaît plus dans l'échéancier (machines hors
service exclues), mais ses deux occurrences restent actives en base.

Les quatre apparaissaient à tort en retard dans l'échéancier et bloquent la génération du
couple. Voir aussi occurrences-actives-en-double.md. Toute correction est un changement
hors travail normal : motif d'audit (CLAUDE.md section 2.4).
