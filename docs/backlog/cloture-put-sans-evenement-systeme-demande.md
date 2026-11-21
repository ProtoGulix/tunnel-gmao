**TRAITÉ (ADR 0027, 2026-11-20) : la mise à jour enveloppe l'écriture dans watch_trigger_closure ; test de cascade vert.**

# Clôture par PUT : la demande liée est close sans événement du système

Constaté le 2026-11-20 (CLO-01). Fermer une intervention par `PUT /interventions/{id}` clôt la
demande liée (le test `test_fermer_une_intervention_cloture_la_demande_liee` passe), mais
aucune ligne d'audit « événement du système » (motif SYSTEM_CASCADE) n'est écrite sur la
demande : `InterventionRepository.update` n'entoure pas l'écriture de
`InterventionRequestRepository.watch_trigger_closure`, et `on_intervention_closed` ne trouve
plus de demande « acceptee » (le trigger de la base l'a déjà clôturée) donc ne trace rien.
Le journal de statut le faisait ; depuis l'ADR 0027 il ne clôt plus, la trace manque donc
pour toute clôture.

Le test `test_la_cascade_de_fermeture_ecrit_un_evenement_du_systeme_au_nom_du_jeton`
(test_audc22_interventions_demandes_integration.py), adapté pour fermer par PUT, échoue
tant que ce n'est pas corrigé. Correction hors périmètre CLO-01 (api/interventions/,
api/intervention_requests/).
