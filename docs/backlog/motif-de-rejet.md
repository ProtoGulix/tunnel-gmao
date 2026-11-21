# Rejet d'une demande d'intervention sans motif

TRAITÉ : ADR 0038, REJ-01 (motifs) et REJ-02 (le rejet exige un motif choisi).

Relevé le 2026-11-21 (rédaction du guide, GUIDE-03), vérifié par l'agent principal.

Le web ne porte pas de fenêtre propre au rejet : il compte sur la règle d'audit pour
demander le motif (`InterventionRequestDetail.jsx`, « le motif de rejet EST la raison
d'audit »). La règle porte sur le champ `request.status_to`, commune à toutes les
transitions ; elle est routinière en production et, depuis DEMO-08, dans les données de
départ (sinon chaque acceptation demandait un motif absurde). Conséquence : un rejet passe
sans motif, ce qui contredit CLAUDE.md section 2.4 (une décision hors du travail normal a
un motif).

Piste proposée : le validator de transition exige un motif choisi (non routinier) quand le
statut cible est `rejetee`, quelle que soit la règle ; motifs de rejet dédiés en données de
référence (migration). À décider par l'utilisateur.
