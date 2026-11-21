# 0033. Page « Bilan du service » : état, audit et qualité

- Statut : accepté (2026-11-21, décisions de l'utilisateur)
- Date : 2026-11-21
- Prolonge : ADR 0021 (page « Organisation »), ADR 0032 (synthèse de l'audit) ; remplace
  le point 1 de l'ADR 0032 (page dédiée) et la page autonome de l'ADR 0021

## Contexte

La section Production du menu web comptait quatre pages : État du service, Organisation,
Synthèse de l'audit et Qualité des données. Demande de l'utilisateur du 2026-11-21 : les
trois pages d'indicateurs doivent se trouver au même endroit et être en partie
synthétisées en deux onglets, « État du service » et « Qualité », parce que c'est ce
qu'elles racontent. Inventaire du 2026-11-21 : aucun calcul n'est partagé entre État du
service et Organisation, mais les sens se recouvrent (fragmentation en heures d'un côté,
en journées et chantiers de l'autre ; heures par catégorie d'action d'un côté, par type
d'intervention de l'autre). Écart relevé : le web rangeait la catégorie BAT (id 24) dans
la fragmentation, alors que le calcul du backend la compte en production.

## Décision

1. **Une page « Bilan du service »** (`/bilan`), seule entrée de la section Production,
   avec trois onglets : « État », « Audit » et « Qualité » (décision de l'utilisateur du
   2026-11-21, qui corrige un premier choix à deux onglets où « Qualité » désignait la
   synthèse de l'audit et où Qualité des données restait une page à part). Les anciennes
   adresses (`/service-status`, `/organisation`, `/audit-synthese`, `/quality-data`) sont
   retirées sans redirection (décision de l'utilisateur) : elles mènent à l'accueil.
2. **Onglet « État »** : État du service et Organisation. En tête, un bandeau
   de huit chiffres clés (charge, fragmentation, temps de pilotage, part d'urgences,
   chantiers coupés par une urgence, interventions par journée de technicien, part du
   préventif dans les heures, attente de pièces), puis le détail rangé
   par thème : temps et capacité, organisation du travail, préventif. Les cartes et
   chiffres de période des anciennes pages sont remplacés par le bandeau, sans perte
   d'indicateur.
3. **Onglet « Audit »** : la synthèse de l'audit, avec son propre bandeau (les six
   indicateurs de l'ADR 0032) puis son détail. **Onglet « Qualité »** : le contrôle de
   complétude et de cohérence des données, inchangé, sans période (état actuel).
4. **Une période commune** (décision de l'utilisateur) : un choix en mois calendaires
   (3, 6, 12 ou 24), 3 mois par défaut, qui vaut pour les onglets « État » et « Audit » ;
   il est masqué sur « Qualité ». Les dates libres de l'ancienne page État du service disparaissent.
5. **Droits inchangés** : le bloc État du service reste visible de tout utilisateur
   connecté ; les blocs Organisation suivent `stats:get_organisation` ; l'onglet Audit
   suit `stats:get_audit_synthese` et n'apparaît pas sans ce droit ; l'onglet Qualité est
   ouvert à tout utilisateur connecté, comme l'ancienne page.
6. Les définitions affichées (ADR 0021, 0032) ne changent pas. Le libellé web de BAT est
   corrigé pour suivre le backend (production).
7. Aucune migration, aucun changement d'API : seul le front web change.

## Alternatives écartées

- Regroupement sans condenser : laisse deux jeux de chiffres de tête et des mesures
  voisines côte à côte sans lecture commune (écarté par l'utilisateur).
- Version courte seule : perd le détail mensuel utile pour comprendre un chiffre.
- Une période par onglet : deux réglages pour une même lecture du service (écarté par
  l'utilisateur).
- Deux onglets, Qualité des données laissée à part : premier choix, corrigé par
  l'utilisateur (la page raconte trois choses : l'état, l'audit et la qualité).
