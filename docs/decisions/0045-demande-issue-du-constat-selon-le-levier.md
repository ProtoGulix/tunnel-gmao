# 0045. Demande issue du constat selon le levier, référentiel administrable

- Statut : accepté (2026-11-26)
- Date : 2026-11-26
- Amende : ADR 0043 (points 1, 3 et 5)

## Contexte

L'ADR 0043 crée une demande d'intervention par constat. Relu le 2026-11-26 contre les données
de dev : environ 13 curatifs et 24 demandes par mois, 53 demandes « nouvelle » de plus de
30 jours. Une demande par curatif ajoute la moitié du volume à une file qui ne se vide pas.
Le levier est obligatoire sans réponse « rien », et formation, surveillance ou autre créent une
demande sans type que le référent ne peut que rejeter. Décisions de l'utilisateur du 2026-11-26.

## Décision

1. Chaque choix du formulaire porte deux réglages de référentiel : « génère une demande »
   (`creates_request`) et « exclusif » (`is_exclusive`). Le constat crée une demande seulement
   si au moins un choix coché la génère ; sinon il reste une donnée d'analyse, sans demande.
   Réglage initial : tâche régulière et projet génèrent une demande, les autres non.
2. Nouveau levier « Rien ne l'aurait évité », exclusif, sans demande. Un choix exclusif ne se
   combine avec aucun autre choix de sa question.
3. Le type préconisé reste celui du premier levier typé (ADR 0043 point 5).
4. Correction (nouvelle version) : si la version courante génère une demande et qu'il n'y en a
   pas, elle est créée ; une demande existante n'est jamais retirée ni rejetée par le système,
   le référent la tranche. Un constat sans demande se corrige par son auteur ou le référent
   tant que l'intervention n'est pas archivée ; avec demande, la règle de l'ADR 0043 reste
   (demande « nouvelle »).
5. Administration > Référentiel, section « Constats » (RESP et ADMIN, changements audités) :
   sur un choix, libellé, ordre, actif, génère une demande, exclusif, type préconisé ; ajout
   d'un choix à une question existante, code saisi à la création puis figé. Questions et
   sous-questions figées, libellé seul modifiable. Aucune suppression : désactivation.
6. Un réglage ne vaut que pour les constats saisis ensuite : rien n'est recalculé.

## Alternatives écartées

- Déduire la demande du type préconisé (une demande si le levier a un type) : pas de nouvelle
  colonne, mais un site ne pourrait pas faire remonter les formations sans leur inventer un type.
- Choix « Rien » combinable : réponses contradictoires (« rien » et « formation »).
- Rejet automatique d'une demande devenue inutile après correction : décision du système hors
  action, qui demanderait un motif dédié ; le référent la rejette lui-même.
- Référentiel en lecture seule : tout changement demanderait une migration.
- Questions modifiables : désactiver la question des leviers casserait le formulaire.

## Conséquences

- Migration 0029 : colonnes `constat_choice.creates_request` et `is_exclusive`, choix NOTHING,
  `constat.request_id` facultatif.
- Les indicateurs datent un constat par la première version de sa chaîne, plus par sa demande.
- Nouvelles routes d'administration : le bootstrap ouvre leurs droits au démarrage.
- Restent au backlog : une demande par intervention, notification des techniciens, plan
  préventif depuis « tâche régulière ».
