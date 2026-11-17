# Supprimer interventionCellRenderers.jsx, devenu inutilisé

web/src/components/interventions/interventionCellRenderers.jsx (rendus de cellules et
styles de lignes d'une ancienne table d'interventions) n'est importé nulle part
(grep du 2026-11-17, tâche LIST-01). La liste maître utilise InterventionListItem.jsx.
À supprimer après une dernière recherche d'usage dynamique.
