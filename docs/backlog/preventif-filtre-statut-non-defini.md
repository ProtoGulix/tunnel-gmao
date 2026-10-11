# Filtre de statut des occurrences préventives : constante non définie

`web/src/components/preventive/PreventiveOccurrencesTab.jsx` (filtre « Tous statuts ») parcourt `STATUS_LABELS`, qui n'est ni importé ni défini dans le fichier (ESLint `no-undef`, repéré le 2026-10-11 pendant l'ADR 0014). Le contenu d'un `Select` Radix n'est rendu qu'à l'ouverture : ouvrir ce filtre devrait lever une ReferenceError. NON VÉRIFIÉ dans l'application. Piste : utiliser `OCCURRENCE_STATUS_LABELS`, déjà importé dans le fichier.
