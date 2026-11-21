# 0035. Onglet « Audit » du Bilan allégé, tendances par l'API

- Statut : accepté (2026-11-21, accord de l'utilisateur)
- Date : 2026-11-21
- Prolonge : ADR 0034 (onglet « État » allégé), ADR 0032 (synthèse de l'audit) ; modifie la
  règle « définition écrite à côté de chaque indicateur » de l'ADR 0032 point 4

## Contexte

L'utilisateur a validé l'onglet « État » allégé (ADR 0034) et accepté le 2026-11-21 la
piste d'appliquer le même traitement à l'onglet « Audit », qui garde l'ancienne
présentation : texte d'explication en tête, six chiffres avec leur paragraphe de
définition, cinq grands graphiques mensuels, deux tableaux.

## Décision

1. **Même présentation que l'onglet « État »** : six cartes (libellé, ⓘ avec la définition
   inchangée, valeur, détail court, mini-courbe lissée, tendance grise) réutilisant les
   composants de l'ADR 0034. Le texte sur le garant et les exécutants passe dans une ⓘ ;
   la mention « données incomplètes » devient une ligne courte avec ⓘ.
2. **Pas de badge de statut** : ces chiffres d'équipe n'ont pas de seuil et l'ADR 0032
   exige un ton neutre (le partage des tâches n'est pas une faute).
3. **Les cinq grands graphiques sont retirés** ; le tableau « Valeurs par mois » et le
   tableau des décisions par type et motif sont repliés.
4. **Tendances par l'API** : `GET /stats/audit-synthese` renvoie `trends:
   {without_guarantor_share, done_without_guarantor_action_share, spotted_in_field_share,
   shared_tasks_share, system_share, decisions_total}`, chacun `"up"`, `"down"`,
   `"stable"` ou `null`, calculé comme à l'ADR 0034 point 10 (trends.py) : « stable » sous
   2 points pour une part, sous 2 décisions pour `decisions_total`. Les mois marqués
   `incomplete_data` comptent comme les autres : la ⓘ « données incomplètes » le rappelle.
5. Aucune migration ; changement d'API par ajout de champ seulement.

## Alternatives écartées

- Badges sur les parts (par exemple tâches sans garant) : il faudrait inventer des seuils
  et porter un jugement que l'ADR 0032 écarte.
- Exclure les mois incomplets du calcul de tendance : avec la période par défaut de trois
  mois, presque aucune tendance ne serait calculée avant février 2027.
