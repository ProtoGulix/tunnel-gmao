# Motif au passage en attente production

Aucun écran n'écrit de note quand une intervention passe en `attente_prod` (vérifié le
2026-11-28 : mobile `InterventionDetailPage.jsx` n'envoie pas `notes`, le web n'écrit pas
le journal) ; les notes du journal sont des textes de la base. La carte « À voir avec la
production » (ADR 0047) affiche donc « Aucun motif saisi ». Piste : motif choisi par la
fenêtre d'audit commune (audit_rule), jamais un texte maison. Hors périmètre du chantier ADT.
