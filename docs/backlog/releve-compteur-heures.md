# Relevé des heures de fonctionnement des machines

Constat du 2026-11-18 : les plans préventifs « par heures » comparent
`machine_hours.hours_total`, que le trigger `trg_machine_hours_update` alimente avec le
temps passé en intervention. Ce sont des heures de travail sur la machine, pas des
heures de fonctionnement : un plan « toutes les 500 h » ne se déclenche pas au bon
moment. L'échéancier (PREV-01) les affiche « non calculé ».

Décision de l'utilisateur du 2026-11-18 : à corriger par un relevé manuel des compteurs,
saisi par pointage sur le mobile ou le web. Chantier à part, à cadrer : table des
relevés (date, valeur, auteur), contrôle de cohérence (valeur croissante), sort de
`machine_hours`, migration, écrans de saisie.
