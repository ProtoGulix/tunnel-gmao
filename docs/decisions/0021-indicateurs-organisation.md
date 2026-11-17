# 0021. Indicateurs d'organisation de l'équipe, vus par tous

- Statut : accepté
- Date : 2026-11-16
- Affine : CLAUDE.md section 2 (traçabilité, terrain first)

## Contexte

Une analyse de la base de production (16 novembre 2026, lecture seule) montre que les
chantiers de projet et de préventif sont très souvent coupés par des urgences, qu'un
tiers des interventions sont déclarées urgentes et que le préventif généré n'est plus
traité depuis mai 2026. L'équipe n'a pas de responsable qui arbitre les priorités.
L'utilisateur veut que ces constats restent mesurés après son départ, et visibles par
toute l'équipe.

La page « État du service » existante répartit les heures selon le type de temps des
catégories d'action (dont « FRAG ») : elle ne mesure ni les interruptions, ni la part
d'urgences, ni le circuit du préventif.

## Décision

1. Une page « Organisation » du front web, ouverte à tous les rôles, alimentée par
   `GET /stats/organisation` (lecture seule, aucune migration). Droit
   `stats:get_organisation`, ouvert par défaut aux rôles qui lisent.
2. Uniquement des chiffres d'équipe : la réponse ne contient aucun identifiant, nom ou
   initiale de technicien, ni aucun classement par personne. Cette page sert à
   objectiver le fonctionnement de l'équipe, pas à surveiller une personne.
3. Définitions, écrites aussi sur la page à côté de chaque indicateur :
   - Date d'une action : `created_at::date` (jour du travail, saisi par le
     technicien), à défaut le `reported_date` de l'intervention.
   - Chantier : un couple (technicien, intervention de type PRO ou PRE) avec des actions
     sur au moins deux jours distincts. Il est rattaché au mois de son premier jour.
   - Chantier coupé par une urgence : le même technicien a une action, un jour
     strictement compris entre le premier et le dernier jour du chantier, sur une
     intervention CUR de priorité `urgent`.
   - Part d'urgences : interventions de priorité `urgent` parmi celles signalées dans le
     mois (`reported_date`).
   - Dispersion : pour chaque journée d'un technicien (couple technicien, date d'action),
     le nombre d'interventions distinctes ; moyenne du mois et part des journées à 3 ou
     plus. Seuls les agrégats sortent.
   - Répartition des heures : somme de `time_spent` par type d'intervention (CUR, PRE,
     PRO, autres) et par mois de la date d'action.
   - Préventif en attente (état actuel, hors période) : occurrences au statut
     `generated` et demandes liées encore au statut `nouvelle`, avec l'âge de la plus
     ancienne ; date de la dernière occurrence générée.
   - Attente de pièces (état actuel) : interventions au statut `attente_pieces`, âge
     médian et maximal depuis le `reported_date`.
4. Période par défaut : les 12 derniers mois calendaires, mois courant inclus, comme le
   tableau de bord d'un équipement.

## Alternatives écartées

- Un onglet de la page « État du service » : moins visible, et cette page mesure autre
  chose (le type de temps des actions) avec ses propres seuils.
- Des indicateurs par technicien : plus précis, mais une page vue par tous deviendrait un
  classement des personnes, contraire au but recherché.
- Un rapport mensuel envoyé par courriel : il demande un planificateur, absent de l'API,
  donc un changement de configuration du serveur.

## Conséquences

- Les définitions sont des choix : les modifier demande un nouvel ADR, pour que les
  courbes restent comparables dans le temps.
- Les changements de priorité se décident à l'oral et ne sont pas tracés : la page en
  mesure les effets, pas les décisions.
- La génération du préventif reste manuelle ; l'indicateur « dernière génération » rend
  visible un oubli, sans l'empêcher.
