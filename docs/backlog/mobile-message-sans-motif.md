# Mobile : message brut quand aucun motif n'est proposé

Constat de l'essai du chantier REM (2026-11-22). Gravité : ergonomie.

Si l'API exige un motif mais n'en propose aucun (motifs désactivés, migration non jouée), la
feuille de motif ne s'ouvre pas et le mobile affiche « reason_code obligatoire pour cette
mutation ». Remplacer par un message court (« Aucun motif disponible ») dans la gestion
commune des erreurs d'audit du mobile.
