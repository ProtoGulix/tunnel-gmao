# Page de synthèse de l'audit

Demande de l'utilisateur du 2026-11-20 : à faire en fin de chantier, après les autres
sujets en cours (« garde la page pour la fin »). Données fiables depuis l'ADR 0029
(auteur des journaux, événements des cascades, `closed_by` toujours rempli).

Sens des rôles dans le service (utilisateur, 2026-11-20) : la personne affectée à une
tâche en est le garant (responsable de sa finalisation) ; les exécutants sont les auteurs
des actions ; celui qui clôt est `closed_by`. Plusieurs exécutants et un tiers qui clôt
sont un fonctionnement normal, pas une anomalie.

Indicateurs proposés, d'équipe et sans classement individuel (esprit de la page
« Organisation », ADR 0021) :

1. Tâches dont le garant n'a fait aucune action et qu'un autre a closes.
2. Tâches sans garant.
3. Travail repéré sur le terrain : tâches créées, affectées et closes par la même personne.
4. Décisions hors travail normal par motif (clôtures, réouvertures, ignorées) et leur
   évolution.

À trancher avant tout code (CLAUDE.md 11.8) : qui voit la page, période par défaut,
indicateurs retenus. ADR et plan à proposer à l'utilisateur.
