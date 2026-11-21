**TRAITÉ (CONT-03, 2026-11-20) : ignorer une occurrence exige un motif d'audit choisi.** Les décisions du 2026-11-13 encore ouvertes (remise à faire d'une tâche avec motif `task_reopened`, motif de clôture « Oubli de clôture à la saisie ») sont suivies dans docs/ETAT.md (Prochaine action, point 2) : aucune trace dans le code au 2026-11-21.

# Changements hors travail normal sans motif d'audit (CLAUDE.md section 2.4)

Relevé pendant le chantier CLO (2026-11-13). Mise à jour du 2026-11-19 (CONT-02).

- Occurrence préventive ignorée (PATCH /preventive-occurrences/{id}/skip) : raison
  saisie à part (skip_reason), sans motif d'audit. RESTE OUVERT (CONT-03).
- TRAITÉ : mobile, plus aucun `ROUTINE` en dur dans mobile/src (vérifié par grep).
- TRAITÉ : web/src/components/preventive/GammeProgressBlock.jsx supprimé (aucun import).
