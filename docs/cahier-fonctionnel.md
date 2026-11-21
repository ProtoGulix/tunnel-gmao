# Cahier fonctionnel de Tunnel GMAO

- Version du code décrite : **v5.11.0** (tag du 2026-11-21 ; develop identique pour backend/,
  web/, mobile/ et deploy/ à la date de rédaction)
- Rédigé le 2026-11-21 (fiches CAH-01 et CAH-02), à relire à chaque version publiée
- Statut : **validé par l'utilisateur le 2026-11-21**

> « Ne vous contentez pas de gérer votre maintenance. Faites-la progresser. »

Ce document est la référence de ce que Tunnel fait réellement et de ce qu'il veut devenir.
Le site vitrine et la documentation utilisateur ne présentent comme existant que ce qui est
marqué **livré** ici. Trois niveaux, jamais mélangés :

| Niveau | Sens | Preuve exigée |
| --- | --- | --- |
| **Livré** | présent dans le code publié | table et migration, route, écran, ADR ; version |
| **En cours** | chantier ouvert dans docs/ETAT.md | ligne de chantier, fiche de tâche |
| **À concevoir / vision** | intention, aucun code | aucune ; ne jamais présenter comme existant |

Conventions de preuve. « 5.0.0 » signifie présent dès la première version publiée du dépôt
unique (le modèle vient des versions 1 à 4, hors de ce dépôt) : la table figure dans le
schéma de départ (`backend/db/schema.sql`, migration `0001_schema_initial`). Une version
plus récente vient du CHANGELOG ou de l'ADR cité. Un point non contrôlé est marqué
NON VÉRIFIÉ. Les routes sont relatives à `/api` ; la table `machine` est exposée par l'API
sous le nom `equipement`.

---

## 1. Architecture métier actuelle

### 1.1 La chaîne du travail réel

    demande d'intervention ──▶ intervention ──▶ tâches ──▶ actions ──▶ demandes d'achat ──▶ commandes fournisseurs
           (DI)                    │              ▲            │
                                   │   plans préventifs        └─ temps, nature, complexité
                                   │   et leurs gammes
                                   └─ journal des statuts, audit des décisions

L'action est l'unité de travail réel : temps, nature du travail, complexité et pièces sont
portés par l'action, pas par l'intervention.

#### Demande d'intervention — livré (5.0.0 ; création atomique 5.11.0)

- Table `intervention_request` : code `DI-AAAA-NNNN`, équipement, demandeur, description,
  statut, origine (`signalee` ou `directe`), type suggéré, échéance. Statuts dans
  `request_status_ref` : nouvelle, en attente, acceptée, rejetée, clôturée ; journal
  `request_status_log`.
- Routes `api/intervention_requests/routes.py` : liste, détail, création, `POST /{id}/transition`,
  suppression, `POST /repair`. Accepter exige un type et un technicien et crée l'intervention ;
  rejeter exige un motif d'audit ; clôturer est refusé tant que l'intervention est ouverte.
- Une demande porte au plus une intervention (contrainte d'unicité). Une intervention vient
  toujours d'une demande (ADR 0019, règle tenue par l'API ; des interventions anciennes
  sans demande subsistent).
- Création en un seul geste de la demande, de l'intervention et de ses tâches, en une
  transaction, la demande « directe » ne notifiant personne (ADR 0025, 5.11.0).
- Qui crée : TECH, RESP, ADMIN (`backend/db/default_permissions.py`).
- Écrans : web `pages/intervention-requests/`, mobile `pages/intervention-requests/`.

#### Intervention — livré (5.0.0 ; types en base, clôture et réouverture 5.11.0)

- Table `intervention` : code, titre, équipement, type, priorité, statut, technicien
  déclaré, plan d'origine, indicateur de fiche imprimée.
- Types en base, table `intervention_type` (8 types, couleur et description), migration
  0020, ADR 0026 (5.11.0) ; types permis par classe d'équipement, table
  `equipement_class_intervention_type`, migration 0023, ADR 0031 (5.11.0). Une classe sans
  réglage accepte tous les types.
- Priorités : faible, normal, important, urgent. Liste fixée dans le code
  (`api/constants.py`), pas en base.
- Statuts en base (`intervention_status_ref`) : ouvert, attente pièces, attente production,
  fermé. Pas de statut « annulé ».
- Journal des statuts : table `intervention_status_log`, auteur réel `changed_by` depuis la
  migration 0022 (ADR 0029, 5.11.0).
- Clôture par une seule porte, `PUT /interventions/{id}` : tâches obligatoires vérifiées,
  motif d'audit selon les règles, la demande liée se clôt avec (ADR 0027, 5.11.0).
- Réouverture avec motif obligatoire (« clôturée par erreur », « travail à reprendre »,
  autre), la demande repasse « acceptée » (ADR 0028, migration 0021, 5.11.0).
- Fiche imprimable en PDF et QR code de l'intervention (`GET /exports/interventions/{id}/pdf`,
  `/qrcode`) ; export de masse des fiches fermées en ZIP ou PDF unique, plafond 100, ADMIN
  et RESP, marquage des fiches imprimées (5.4.0 à 5.10.0, fiches EXPM-01 à 03, IMPR-01 à 03).
- Écrans : web liste et panneau de détail (`InterventionsListPage.jsx`,
  `InterventionDetailPanel.jsx`, ADR 0013) ; mobile liste et détail.

#### Tâches — livré (5.0.0 ; clôture en coordination 5.3.x)

- Table `intervention_task` : libellé, origine (`plan`, `resp`, `tech`), statut (à faire,
  ignorée, faite), facultative ou obligatoire, affecté (garant de la finalisation), échéance,
  ordre, auteur de la clôture (`closed_by`). Lien action ↔ tâche par
  `intervention_action_task` (clés étrangères, migration 0017, 5.11.0).
- Origine manuelle (responsable ou technicien) ou préventive : une tâche par étape de la
  gamme du plan (1.2).
- Clôture en coordination (ADR 0016) : RESP ou ADMIN peut déclarer une tâche faite sans
  action, avec un motif choisi (« oubli de saisie », « traitée ailleurs », « plus
  nécessaire », « doublon »). Ignorer une étape obligatoire est réservé à RESP et ADMIN.
- Une tâche ne se supprime que si elle est « à faire » ; l'API donne les indicateurs
  `is_locked` et `can_delete` et les fronts ne recopient pas la règle (ADR 0030, 5.11.0).
- Écrans : web onglet Tâches (ADR 0015) et page Coordination ; mobile dans la fiche
  d'intervention, « Mes tâches » sur l'accueil.

#### Actions — livré (5.0.0)

- Table `intervention_action` :
  - temps passé en heures, par pas de 0,25 h, minimum 0,25 h (`validators.py`) ; heures de
    début et de fin facultatives ;
  - nature du travail : sous-catégorie (`action_subcategory`) rattachée à une catégorie
    (`action_category`, 6 catégories de départ : Dépannage, Fabrication / Modification,
    Préventif / Vérification, Support / Coordination, Bâtiment / Travaux / Aménagement,
    Documentation / Schéma) ;
  - complexité : score entier de 1 à 10 **saisi par le technicien** (pas calculé) ; au delà
    de 5, un facteur de complexité est obligatoire (`complexity_factor`, 13 facteurs de
    départ) ;
  - technicien déclaré, donnée libre ; l'auteur réel vient du jeton (ADR 0005).
- Référentiels administrables par RESP et ADMIN (`/admin/action-categories`,
  `/admin/action-subcategories`, `/admin/complexity-factors`).
- Une action ne se supprime pas si l'intervention est fermée ou si une demande d'achat liée
  est déjà répartie (ADR 0030).
- Écrans : web formulaire d'action ; mobile `AddActionPage.jsx`, saisie terrain.

#### Demandes d'achat et commandes — livré (5.0.0)

- Table `purchase_request` (article, quantité, urgence, article du catalogue éventuel),
  liée aux actions par `intervention_action_purchase_request` ; une demande peut aussi être
  autonome (réapprovisionnement). Statut dérivé (à qualifier, sans référence fournisseur, à
  répartir, ouverte, en consultation, chiffrée, commandée, partielle, reçue, refusée).
- Répartition vers les commandes fournisseurs : `supplier_order`, `supplier_order_line`
  (quantités commandée et reçue, devis), statuts ouverte, envoyée, accusée, reçue, close,
  annulée ; export de la commande par courriel ; import de demandes.
- Rôle ACHETEUR : écritures sur demandes, commandes, fournisseurs et catalogue ; TECH crée
  seulement des demandes.
- Écrans : web pages Demandes d'achat, Fournisseurs, accueil acheteur ; mobile
  `AddPurchasePage.jsx`.

### 1.2 Préventif — livré (5.0.0 ; automatisé 5.9.0)

- **Plans** (`preventive_plan`) : rattachés à une **classe** d'équipement et valables pour
  toutes ses machines ; déclenchement par périodicité en jours ou par seuil d'heures ;
  acceptation automatique possible ; désactivation douce et réactivation (5.3.0). ADMIN et
  RESP écrivent, TECH lit.
- **Gammes** : les étapes du plan (`preventive_plan_gamme_step`, facultatives ou non). Ce
  n'est pas une entité autonome réutilisable entre plans. Chaque étape devient une tâche à
  chaque occurrence.
- **Occurrences** (`preventive_occurrence`) : générée, en cours, terminée, ignorée.
  - Échéancier glissant : échéance = clôture de la demande de la dernière occurrence
    terminée + périodicité (`GET /preventive-occurrences/schedule`, ADR 0023, 5.9.0).
  - Génération une semaine avant l'échéance, avec une demande créée par le système.
  - Ignorer une occurrence exige un motif choisi (migration 0019, 5.11.0).
  - Une occurrence rouverte suit son intervention (amendement de l'ADR 0028, 5.11.0).
  - Lancement en avance depuis la fiche équipement, l'échéance théorique restant connue pour
    mesurer l'avance (PREV-14, 5.10.0, web seulement).
- **Tâche quotidienne** dans l'API (boucle du cycle de vie de l'application, verrou
  PostgreSQL pour un seul processus) : génération, retards, interventions sans action.
  Active par défaut dans Compose (`SCHEDULED_JOBS_ENABLED`, `deploy/docker-compose.yml`),
  inactive par défaut hors Compose. Ses écritures sont auditées comme événements du système
  (motif SYSTEM_SCHEDULE, ADR 0023, 5.9.0).
- **Notifications** (`notification`) : préventif en retard et intervention sans action
  depuis 7 jours, adressées à tous les utilisateurs actifs, relancées chaque semaine ;
  nouvelle demande à traiter ; cloche web et mobile ; masquage (5.9.0). Courriel seulement
  pour une nouvelle demande, et seulement si l'envoi est configuré (`MAIL_ENABLED`).
- **Suivi sur la fiche équipement** (web) : à jour ou en retard, prochaine échéance,
  interventions préventives passées, courbe d'avance ou de retard
  (`EquipementPreventifChart.jsx`), santé en « Attention » si un préventif est en retard
  (5.10.0). Mobile : écran Préventif en lecture.
- Limite : un plan « par heures » n'a pas de relevé de compteur réel. `machine_hours` cumule
  le temps passé en intervention, pas les heures de fonctionnement ; l'échéancier affiche
  « non calculé ». Relevé de compteur : à concevoir ([backlog](backlog/releve-compteur-heures.md)).

### 1.3 Équipements — livré (5.0.0 ; hiérarchie 5.2.0)

- Table `machine` (API `equipement`) : classe, statut, parent.
- Hiérarchie : jusqu'à 4 niveaux, cycles et auto-rattachement refusés, une mère avec des
  filles ne se supprime pas (ADR 0011, migration 0003, 5.2.0). La santé d'une mère reflète
  sa fille la plus dégradée.
- Fiche équipement (web, panneau maître-détail) : fiche éditable sur place (ADR 0012),
  sous-équipements, préventif (1.2), « État et évolution » (chiffres clés, graphiques
  mensuels, répartition par type, catégorie d'action et facteur de complexité ; ADR 0020,
  5.5.0), activité (demandes ouvertes, interventions), pastille de santé.
- Classes d'équipement et statuts d'équipement administrables.
- QR codes : générés pour une **intervention** seulement ; le mobile sait scanner. Aucun
  QR d'équipement n'est généré par l'application.

### 1.4 Pilotage du service — livré

- **Accueil par rôle** (5.0.0) : vues technicien, acheteur et direction technique
  (`home_view_ref`, `role_home_view`, `HomeRouter.jsx`), affectées par rôle par ADMIN ;
  pas de choix par utilisateur.
- **Coordination** (web) : planning de la semaine, charge, équipements, demandes.
- **Bilan du service** (`/bilan`, ADR 0033 à 0035, 5.11.0), période commune de 3 à 24 mois :
  - « État » : charge, fragmentation, temps de pilotage, part d'urgences, chantiers coupés
    par une urgence, interventions par journée de technicien, part du préventif dans les
    heures, attente de pièces, avec seuils et tendances donnés par l'API. Reprend les
    indicateurs de l'ancienne page Organisation (ADR 0021, 5.6.0), qui n'existe plus seule.
  - « Audit » : synthèse des décisions (tâches sans garant, faites sans action du garant,
    repérées sur le terrain, partagées, décisions hors travail normal, modifications du
    système ; ADR 0032).
  - « Qualité » : complétude et cohérence des données.
  - Aucun chiffre individuel par technicien, par choix (ADR 0021, 0032).

### 1.5 Interface mobile — livré (5.0.0)

Servie sous `/m`, pour le terrain : accueil et « Mes tâches », interventions et demandes,
création d'intervention, saisie d'action et de demande d'achat, clôture et réouverture avec
motif, catalogue (lecture), équipements, préventif à faire, notifications, scan de QR code.
**Pas de saisie hors ligne** : seule l'interface est mise en cache. Changement de mot de
passe absent du mobile (présent sur le web).

### 1.6 Pièces — livré (5.0.0) : un catalogue, pas une gestion de stock

Formulation exacte : **le stock de Tunnel est un catalogue de pièces (familles et
sous-familles, quantité, emplacement, références fabricant et fournisseurs), sans
mouvements d'entrée ni de sortie.**

- Tables `part` (famille, sous-famille, unité, emplacement en texte libre, quantité entière
  `qty_in_stock`), `part_manufacturer_ref` (fabricant et référence, préférée ou non),
  `part_supplier_ref` (fournisseur, référence, prix, minimum de commande, délai, préférée),
  rattachée à une référence fabricant ; familles `stock_family` et `stock_sub_family` ;
  fournisseurs `supplier`. Routes `api/parts/routes.py` ; écran web Stock, onglet « Pièces
  référencées » (`PartsTab.jsx`).
- Les demandes d'achat et les lignes de commande pointent vers la pièce (`part_id`) :
  c'est ainsi que la production travaille (vérifié en lecture seule le 2026-11-21 : toutes
  les demandes d'achat liées à un article le sont par `part_id`).
- La quantité est une valeur posée à la main (`PATCH /parts/{id}`), tracée par l'audit.
  Aucune action ne la décrémente, aucune réception de commande ne l'incrémente ; ni seuil
  minimal, ni alerte, ni inventaire (vérifié : aucune table ni route de mouvement dans
  `backend/`).
- Ancien modèle encore présent : `stock_item` et ses tables (`stock_item_supplier`,
  `manufacturer_item`, routes `/stock-items`) existent toujours mais ne portent plus les
  achats ; ne pas les présenter comme le catalogue. Gabarits de pièces : code présent mais
  abandonné, à retirer ([backlog](backlog/gabarits-de-pieces-a-retirer.md)).
- Correction du 2026-11-21 (DEMO-08) : la première version de cette section décrivait
  `stock_item` comme le catalogue ; erreur relevée par le parcours de la démonstration.

### 1.7 Rôles et sécurité — livré (5.1.0)

- Rôles ADMIN, RESP, TECH, ACHETEUR, MCP ; matrice de permissions en base
  (`tunnel_endpoint`, `tunnel_permission`), appliquée à chaque route par un middleware
  (ADR 0007, 5.1.0). La clé d'API MCP est en lecture seule.
- Comptes gérés par ADMIN seul (ADR 0005) ; mot de passe d'au moins 8 caractères avec une
  majuscule et un chiffre (`api/users/schemas.py`), changeable par l'utilisateur
  (`POST /users/me/password`, web).
- Authentification souveraine (JWT, jetons de rafraîchissement révoqués à la déconnexion),
  installation par Docker Compose, données hébergées chez l'entreprise.
- NON VÉRIFIÉ : le critère « un test de rôle par endpoint » de la RBAC n'a pas été recontrôlé
  (docs/ETAT.md).

---

## 2. Audit

### 2.1 État actuel — livré

- **Journal des décisions** `audit_log` : entité, type de décision, valeurs avant et après,
  motif (`audit_reason_code`), texte libre si le motif est « autre », auteur réel
  (`changed_by`), événement du système ou non. Autres journaux : `permission_audit_log`,
  `security_log`, journaux de statut avec auteur (migration 0022).
- **Règles d'audit** `audit_rule` : par entité et par champ, un changement est soit
  routinier (motif par défaut, aucune saisie), soit exige un motif choisi dans la fenêtre
  commune du front (`AuditGuardDialog.jsx`, `AuditReasonPicker.jsx`). Aucun motif codé en
  dur dans les fronts (CLAUDE.md 2.4).
- **Audit centralisé** : chaque route qui écrit déclare son audit, un middleware l'écrit
  dans la même transaction que la mutation, et un test échoue si une route qui écrit n'est
  pas déclarée (`tests/test_audit_coverage.py`) (ADR 0017, 0018, 5.3.0).
- **Intégrité** : motif validé avant la mutation, erreurs d'audit jamais masquées
  (ADR 0017) ; tables de journal en ajout seul, sans modification ni suppression possible
  par l'application (`APPEND_ONLY_TABLES`, `backend/scripts/bootstrap.py`, 5.11.0).
- **Cascades** : chaque effet en chaîne (occurrence préventive, demande liée, réparation)
  laisse un événement du système attribué à l'auteur de la requête (ADR 0029, 5.11.0).
- **Synthèse** de l'audit dans le Bilan (1.4).

### 2.2 Sécurisation de l'audit — état réel

docs/ETAT.md ne compte **aucun chantier d'audit en cours** : les chantiers AUD, AUDC, CASC,
CLO, REO et SYN sont fusionnés. Restent :

- **Prévu** (ETAT.md, « à faire ensuite ») : chantier « Changements hors travail normal ».
  Une partie est déjà livrée (motif pour ignorer une occurrence, motifs de réouverture et de
  clôture), mais la ligne n'a pas été soldée.
- **Au backlog** : événements anciens au motif `LEGACY_STATUS_CHANGE` non requalifiés ;
  création de la demande par le préventif sans ligne d'audit propre (NON VÉRIFIÉ dans le
  code, [backlog](backlog/audit-hors-travail-normal-inventaire.md)).
- Écart de documentation : la fiche backlog qui dit l'occurrence ignorée « sans motif
  d'audit » est périmée, le motif est exigé depuis la 5.11.0.

---

## 3. Système de constats — à concevoir

Aucun code. Ce qui existe de plus proche : la description libre d'une action, le facteur de
complexité (structuré mais limité à la difficulté), les notes du journal de statut et les
motifs d'audit (structurés, mais pour justifier une décision, pas pour décrire une panne).

### 3.1 Intention

Un constat n'est pas un commentaire libre. Il est :

- structuré par des référentiels paramétrables, sur le modèle des catégories d'action et
  des motifs d'audit ;
- auditable : qui l'a écrit, quand, ce qui a changé ;
- rattaché à une intervention, plusieurs par intervention ;
- proposé selon le type d'intervention, obligatoire ou facultatif selon le paramétrage ;
- accessible après la clôture, pour l'analyse du responsable.

Il distingue cinq questions, qui ne se confondent pas :

| Question | Qui répond d'abord |
| --- | --- |
| Constat : qu'a-t-on observé ? | technicien |
| Cause : pourquoi ? | technicien, puis responsable |
| Évitabilité : aurait-on pu l'éviter ? | technicien, puis responsable |
| Prévention : comment éviter que cela se reproduise ? | technicien, puis responsable |
| Avis du responsable | responsable |

Les avis initiaux et les analyses successives sont conservés côte à côte : une analyse
ultérieure ne réécrit jamais l'avis du technicien.

### 3.2 Questions ouvertes

Modèle de données :
- un constat par intervention ou par action (l'action est l'unité de travail réel) ?
- cause, évitabilité et prévention : champs du constat, ou entrées distinctes datées et
  signées, pour garder chaque analyse ?
- référentiels : un par question (types de constat, familles de cause, types de prévention)
  ou un seul arbre ? Liés à la classe d'équipement comme les types d'intervention ?
- part du texte libre à côté du choix dans un référentiel.

Droits :
- qui crée, qui complète, qui corrige un constat (TECH, RESP), et jusqu'à quand ;
- une correction est-elle une nouvelle version ou une décision auditée avec motif ?
- l'ACHETEUR et la clé MCP lisent-ils les constats ?

Effet sur la clôture :
- un constat obligatoire bloque-t-il la clôture (comme une tâche obligatoire), ou
  signale-t-il seulement un manque dans l'onglet « Qualité » ?
- une clôture par le responsable sans constat exige-t-elle un motif d'audit ?
- l'analyse du responsable après clôture rouvre-t-elle l'intervention ? (proposition :
  non, l'analyse vit à côté de l'intervention fermée).

Reprise de l'existant :
- les interventions fermées n'ont aucun constat : rien à reprendre, ou constats déduits des
  descriptions d'actions et des facteurs de complexité (risque d'inventer ce qui n'a pas été
  observé) ?
- règle proposée à trancher : les constats ne commencent qu'à leur mise en service, sans
  reprise automatique.

---

## 4. Tunnel de décision — vision

    interventions réalisées
        → constats structurés
        → analyses des techniciens et des responsables
        → décision humaine : préventif, modification technique, organisation, surveillance
        → vérification de l'efficacité

- Sur une période suffisante (par exemple six mois), l'exploitation des constats fait
  ressortir des récurrences : même équipement ou même classe, même cause, même constat.
- Tunnel **propose** des opportunités (par exemple un préventif sur une classe), il ne
  décide pas. La création d'un plan préventif reste toujours une décision humaine, tracée
  avec son auteur.
- La vérification de l'efficacité compare, après la décision, la fréquence des constats
  visés. Les briques existantes qui y serviront : historique par équipement, Bilan du
  service, échéancier et suivi du préventif, audit des décisions.

---

## 5. Feuille de route

| Étape | Niveau | Référence |
| --- | --- | --- |
| Nettoyage du code | au backlog, pas de chantier ouvert | backlog `dette-backend`, `dette-web`, `dette-mobile`, `gabarits-de-pieces-a-retirer` |
| Sécurisation de l'audit | livrée pour l'essentiel ; reste un chantier prévu | 2.2, ETAT.md « Changements hors travail normal » |
| Constats, avis et analyse du responsable | à concevoir | section 3 ; ADR à écrire après les réponses aux questions ouvertes |
| Exploitation des constats | à concevoir | section 4 ; dépend des constats et de six mois de données |
| Opportunités d'amélioration et préventif assisté | vision | section 4 ; décision humaine obligatoire |

Autres points ouverts déjà notés : relevé de compteur d'heures, archivage en masse,
contraintes d'intégrité perdues (docs/ETAT.md et docs/backlog).

---

## 6. Écarts relevés pendant la rédaction

- `docs/philosophie.md` : écrit « pas pour les tableaux de bord de direction », alors
  qu'existent une vue d'accueil « direction technique » et le Bilan du service ; renvoie à un
  `REGLES_METIER.md` absent du dépôt. À réaligner sur le nouveau discours (tâche à part).
- `docs/backlog/audit-hors-travail-normal-inventaire.md` : occurrence ignorée décrite sans
  motif, périmé depuis la 5.11.0.
- Noms réels des deux sites de l'usine écrits en dur dans le front web
  (`web/src/pages/home/TechnicalDirectionHomeView.jsx`, `BuyerHomeView.jsx`,
  `web/src/api/intervention-requests.js`) : donnée réelle dans un dépôt public, et
  apparaîtrait sur la démonstration et les captures ([backlog](backlog/sites-codes-en-dur.md)).
- Page web `/public/purchase-request` (demande d'achat sans connexion) : la route du front
  existe, l'ouverture de l'API correspondante sans jeton n'a pas été trouvée. NON VÉRIFIÉ,
  non présentée comme livrée.
