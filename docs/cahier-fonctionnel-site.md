# Résumé du cahier fonctionnel pour le site vitrine

- Source : [cahier-fonctionnel.md](cahier-fonctionnel.md), code v5.11.0 (2026-11-21)
- Statut : **validé par l'utilisateur le 2026-11-21**
- Usage : le site (dépôt privé du site vitrine, document de positionnement) ne présente comme existant
  que les affirmations de la partie 1. Les parties 2 et 3 se publient comme intention,
  jamais au présent de l'existant. Le texte est recopié à la main dans le dépôt du site vitrine ; ce
  dépôt-ci n'y écrit pas.

## 1. Affirmations « livré » et leur preuve

Chaque ligne peut se publier telle quelle. La preuve sert à la relecture, pas au site.

| # | Affirmation publiable | Preuve (v5.11.0) |
| --- | --- | --- |
| 1 | Toute nouvelle intervention part d'une demande, avec son demandeur et son équipement. | `intervention_request`, ADR 0019, ADR 0025 |
| 2 | Une intervention se découpe en tâches, et chaque tâche en actions réellement faites. | `intervention_task`, `intervention_action`, `intervention_action_task` |
| 3 | Chaque action enregistre son temps (au quart d'heure), la nature du travail (catégorie et sous-catégorie) et sa complexité de 1 à 10, avec un facteur au-delà de 5. | `intervention_action`, `action_subcategory`, `complexity_factor`, `api/intervention_actions/validators.py` |
| 4 | Les demandes d'achat naissent des actions et suivent la commande fournisseur jusqu'à la réception. | `intervention_action_purchase_request`, `supplier_order`, `supplier_order_line` |
| 5 | Chaque changement de statut est journalisé avec son auteur. | `intervention_status_log.changed_by`, ADR 0029 |
| 6 | Une décision hors du travail normal (clôture, réouverture, tâche ignorée…) exige un motif choisi dans une liste paramétrable. | `audit_rule`, `audit_reason_code`, ADR 0016, 0027, 0028 |
| 7 | Le journal d'audit ne peut être ni modifié ni effacé par l'application. | `APPEND_ONLY_TABLES` (`backend/scripts/bootstrap.py`), ADR 0017, 0018 |
| 8 | Le préventif se planifie par classe d'équipement, avec une gamme d'étapes qui devient des tâches. | `preventive_plan`, `preventive_plan_gamme_step` |
| 9 | L'échéancier préventif est glissant : la prochaine échéance part de la dernière réalisation. | `preventive_occurrences/schedule.py`, ADR 0023 |
| 10 | Les interventions préventives sont créées automatiquement une semaine avant l'échéance. | tâche quotidienne, ADR 0023 |
| 11 | Les retards de préventif et les interventions sans action depuis 7 jours sont notifiés à l'équipe. | `notification`, ADR 0023 |
| 12 | Un préventif peut être lancé en avance ; l'avance ou le retard est mesuré. | `POST /preventive-occurrences/anticipate`, `EquipementPreventifChart.jsx` |
| 13 | Les équipements s'organisent en arborescence (jusqu'à 4 niveaux). | `machine.equipement_mere`, ADR 0011 |
| 14 | Chaque équipement a sa fiche : santé, préventif, historique et évolution sur 12 mois. | `EquipementDetailPanel.jsx`, ADR 0020 |
| 15 | Un bilan du service donne la charge, l'organisation du travail, l'audit et la qualité des données, sans aucun chiffre individuel par technicien. | page Bilan, ADR 0021, 0032 à 0035 |
| 16 | Chaque rôle a son accueil : technicien, acheteur, direction technique. | `home_view_ref`, `role_home_view` |
| 17 | Les techniciens ont une interface mobile pour saisir sur le terrain. | `mobile/`, servi sous `/m` |
| 18 | Un catalogue de pièces : familles, emplacement, références fabricant et fournisseurs, relié aux demandes d'achat. | `part`, `part_manufacturer_ref`, `part_supplier_ref`, `purchase_request.part_id` (corrigé le 2026-11-21) |
| 19 | Les droits se règlent par rôle, endpoint par endpoint. | `tunnel_permission`, ADR 0007 |
| 20 | Open source (AGPL-3.0), installé chez vous par Docker Compose ; aucune donnée ne sort de l'entreprise. | LICENSE, `deploy/docker-compose.yml`, CLAUDE.md 2.5 |

À **ne pas** écrire sur le site :
- « gestion de stock », « quantités en stock », « mouvements », « inventaire », « alerte de stock » : absents ;
- « hors ligne » pour le mobile : absent ;
- « compteur d'heures » ou « préventif à l'usage » : les plans par heures existent mais sans
  relevé réel ;
- « QR code par équipement » : seul le QR d'une intervention est généré ;
- « constats », « analyse des causes », « préventif assisté » : à concevoir.

## 2. Ce qui vient (formulation publiable)

> Tunnel structure déjà ce qui a été fait. La prochaine étape est de comprendre ce qui s'est
> passé : des constats structurés, rattachés à chaque intervention, qui distinguent ce
> qu'on a observé, pourquoi c'est arrivé, si on aurait pu l'éviter et comment éviter que
> cela se reproduise. L'avis du technicien et l'analyse du responsable y sont conservés côte
> à côte, sans jamais s'écraser.

## 3. Vision (formulation publiable)

> Ne vous contentez pas de gérer votre maintenance. Faites-la progresser.
>
> Tunnel fait passer une maintenance informelle, tenue sur Excel, Access ou papier, à une
> maintenance structurée, traçable et qui progresse. Savoir ce qui a été fait. Comprendre ce
> qui s'est passé. Apprendre de l'expérience des techniciens. Décider comment éviter que
> cela se reproduise. Améliorer continuellement.
>
> À terme, Tunnel exploitera les constats accumulés sur plusieurs mois pour faire ressortir
> les pannes qui reviennent et proposer des pistes : un préventif, une modification
> technique, un changement d'organisation, une surveillance. Tunnel propose ; l'équipe
> décide. Aucun plan préventif ne se crée sans une décision humaine, et l'efficacité de
> chaque décision se vérifie ensuite dans les données.

Les parties 2 et 3 décrivent des fonctions qui n'existent pas encore : sur le site, elles
se placent sous un titre explicite (« Feuille de route » ou « Ce qui vient »).
