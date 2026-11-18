# Occurrences préventives actives en double

Constat du 2026-11-18 (base de dev, copie de production du 2026-11-16, lecture seule) :
6 couples plan × machine ont plusieurs occurrences actives (`pending`, `generated` ou
`in_progress`) à la fois, alors que la génération refuse d'en créer une seconde
(`_generate_for_machine`, garde « occurrence active »). Origine probable : occurrences
créées avant cette garde. NON VÉRIFIÉ.

Effets : l'échéancier (PREV-01) retient la plus ancienne ; la notification de retard
(PREV-04) partirait pour chacune. À trancher avec l'utilisateur : clore ou ignorer les
doublons (changement hors travail normal : motif d'audit, CLAUDE.md section 2.4), par
une migration de données ou à la main.
