# Changements hors travail normal sans motif d'audit (CLAUDE.md section 2.4)

Relevé pendant le chantier CLO (2026-11-13), hors de son périmètre :
- Occurrence préventive ignorée (PATCH /preventive-occurrences/{id}/skip) : raison
  saisie à part (skip_reason), sans motif d'audit.
- Mobile : `createTask`, `deleteTask` et les modifications routinières de tâche
  envoient ROUTINE en dur, alors que le middleware l'injecte déjà ; à retirer.
- web/src/components/preventive/GammeProgressBlock.jsx n'est importé nulle part (code
  mort, aligné quand même par CLO-04) : à supprimer.
