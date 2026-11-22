TRAITÉ (2026-11-22) : `get_active_status_ids`, sans appelant, supprimée ; le repli de
intervention_requests/repo.py ne garde que `ferme`. Cas voisin des achats :
compteur-achats-ouverts-equipement.md.

# Codes de statut inexistants dans intervention_status/repo.py

Constat du cadrage ARCH-01 (2026-11-22). Gravité : dette.

backend/api/intervention_status/repo.py:45 cite les codes `closed`, `cancelled`, `archived`,
absents de `intervention_status_ref` (codes réels : ouvert, attente_pieces, attente_prod,
ferme ; ADR 0039 point 5). Vérifier l'usage de ce bloc, puis le retirer ou le corriger, avec
un test.
