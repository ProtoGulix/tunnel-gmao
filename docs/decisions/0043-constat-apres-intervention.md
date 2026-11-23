# 0043. Constat après intervention

- Statut : accepté (2026-11-22)
- Date : 2026-11-22
- Affine : ADR 0027 (une seule porte de clôture), ADR 0038 (rejet d'une demande avec motif),
  ADR 0041 (archivage irrévocable), CLAUDE.md 2.4

## Contexte

La GMAO enregistre ce qui a été fait, pas ce qui aurait évité l'arrêt. Le constat, saisi à la
clôture, fait remonter le retour terrain vers des actions préventives et des idées
d'amélioration. La donnée aide à décider, elle ne décide jamais : le référent arbitre.
Spécification et décisions de l'utilisateur du 2026-11-22.

## Décision

1. Un constat répond à un formulaire fixe, uniquement par sélection, sans texte libre :
   Q1 « Qu'est-ce qui aurait réduit ou évité cet arrêt ? » (plusieurs choix : tâche régulière,
   projet ou modification, formation, surveillance, autre), une sous-question par levier coché
   (fréquence, ancienneté du problème connu, domaines, paramètres), Q2 « Signal visible avant
   la panne ? », Q3 machine visée (pré-remplie avec celle de l'intervention, modifiable) et
   parties concernées.
2. Questions et choix vivent dans les données de référence (code, libellé, ordre, actif), comme
   les motifs d'audit ; aucun choix codé en dur. Le type préconisé d'un levier est une donnée
   de son choix : tâche régulière → PRE, projet ou modification → PRO, les autres sans type.
3. Une intervention accepte plusieurs constats, chacun avec son auteur réel (jeton). Un
   constat ne s'écrase jamais : une correction crée une version nouvelle qui remplace la
   précédente, avec le motif d'audit « Correction », seul motif proposé ; correction ouverte à l'auteur et au référent tant que
   la demande issue du constat est « nouvelle ».
4. Le constat est obligatoire à la clôture pour les types d'intervention qui l'exigent
   (`constat_required`, réglable dans le référentiel des types, vrai pour CUR). La règle est
   posée dans la porte unique de clôture (ADR 0027) : aucune clôture sans constat, quel que
   soit le chemin. Une intervention archivée n'accepte plus de constat (ADR 0041).
5. Chaque constat crée une demande d'intervention (DI) sur la machine visée, liée à
   l'intervention d'origine (`source_intervention_id`). On peut ajouter un constat après la
   clôture, tant que l'intervention n'est pas archivée. Son type préconisé
   (`suggested_type_inter`) est celui du levier principal : le premier coché dans l'ordre de
   l'écran qui porte un type. Sans levier typé (formation, surveillance, autre seuls), la DI
   n'a pas de type préconisé et va au tri du référent. Une DI de type préconisé PRO est une
   idée d'amélioration ; aucune entité « projet » nouvelle. La DI notifie comme toute DI
   signalée : pas de mécanique à part.
6. Le référent est RESP ou ADMIN, pour tout le parc. Il arbitre par les transitions existantes
   de la DI : il accepte en gardant ou en changeant le type, ou rejette avec motif (ADR 0038).
   À la validation, l'écran propose les idées d'amélioration ouvertes de la même machine ; s'il
   rattache le constat à l'une d'elles, le constat garde le lien et sa DI est rejetée avec le
   motif « Doublon » (REJECT_DUPLICATE).
7. Aucun indicateur individuel ni classement de techniciens. Les indicateurs (direction,
   suivi des constats) sont un chantier suivant, une fois des constats réels saisis.

## Alternatives écartées

- Texte libre ou champ « commentaire » : inexploitable en analyse, contraire à la saisie en
  moins d'une minute.
- Choix codés en constantes : un choix manquant demanderait une version ; les données de
  référence s'administrent et se migrent.
- Entité « projet » dédiée : la DI de type préconisé PRO suffit, le type existe déjà.
- Une DI par levier coché : multiplie les demandes à trier pour un seul arrêt ; les leviers
  secondaires restent dans le constat pour l'analyse.
- Référent par machine ou par classe : pas de besoin exprimé, RESP et ADMIN couvrent le parc.
- Constat modifiable en place : perd l'historique (CLAUDE.md 2.4).

## Conséquences

- Migration 0028 : tables de questions, choix, constats et réponses ; colonnes
  `intervention_type.constat_required` et `intervention_request.source_intervention_id`.
- Fenêtres de clôture web et mobile : le formulaire de constat avant la confirmation.
- Le rejet de doublon et la correction suivent le mécanisme d'audit commun.
- La durée d'arrêt n'est pas enregistrée aujourd'hui (seul le temps passé des actions l'est) :
  l'indicateur « heures d'arrêt par levier » reste à concevoir.
- Règles laissées ouvertes : typage des formations et surveillances, seuils cibles.
