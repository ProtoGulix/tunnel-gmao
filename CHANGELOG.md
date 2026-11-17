# Changelog

Source unique des nouveautés de Tunnel : ce fichier alimente aussi l'écran
« Nouveautés » de l'application. Format : `## [X.Y.Z] — AAAA-MM-JJ`, sections `###` ;
une section `### [interne] ...` n'est pas affichée aux utilisateurs. Les historiques
des versions 1 à 4 restent dans backend/CHANGELOG.md, web/CHANGELOG.md et
mobile/CHANGELOG.md.

## Non publié

### Modifié
- Liste des interventions : un sélecteur sous la recherche affiche un seul groupe à la
  fois (À faire, Bloqué, Projets, À archiver) ou tous, avec leur nombre.
- Liste des interventions plus lisible : le titre passe en premier, l'équipement est
  mis en valeur juste dessous avec la date de signalement à droite, comme dans la
  liste des demandes d'intervention, le statut n'est plus répété quand le groupe le
  dit déjà, et le retard n'est plus affiché sur les interventions fermées ou annulées.
- En-tête d'une intervention plus lisible : l'équipement est mis en valeur, le code
  est plus lisible, le titre est plus grand et le type est écrit en clair.

## [5.6.1] — 2026-11-17

### Corrigé
- Action : le formulaire « Éditer » s'ouvre de nouveau avec les valeurs de l'action (il
  s'ouvrait vide, et l'enregistrer pouvait écraser la description, la date ou le type) ;
  la carte d'une action ne se vide plus après son enregistrement.
- Intervention : l'en-tête du panneau ne se vide plus après un changement de statut ou
  de priorité (le titre, l'équipement et la demande liée disparaissaient, et le type
  s'affichait à tort en « Curatif » jusqu'au rechargement).

## [5.6.0] — 2026-11-17

### Ajouté
- Indicateurs d'organisation de l'équipe côté serveur (`GET /stats/organisation`, ADR
  0021) : interruptions des chantiers par les urgences, part d'urgences, répartition des
  heures, dispersion des journées, préventif en attente et pièces en attente. Chiffres
  d'équipe uniquement, aucun détail par technicien. Le droit de lecture est créé au
  démarrage du conteneur API.
- Page « Organisation » du front web (menu Production, droit `stats:get_organisation`) :
  tuiles d'état du préventif et des pièces, graphiques mensuels des interruptions, des
  urgences, des heures par type et de la dispersion, avec la définition de chaque
  indicateur. Période de 6, 12 ou 24 mois.

### [interne]
- scripts/test-integration.sh supprime le volume de sa base jetable à la fin : chaque
  lancement laissait un volume Docker orphelin (289 accumulés, 15 Go, disque plein).

## [5.5.0] — 2026-11-16

### Ajouté
- Tableau de bord d'un équipement côté serveur : indicateurs (interventions, temps
  passé, complexité, délai de fermeture), évolution mensuelle, répartition par type,
  catégorie d'action et facteur de complexité, avec ou sans les équipements
  descendants. Le droit de lecture est créé au démarrage du conteneur API.
- Liste des interventions : nouveaux filtres par type d'intervention et par période de
  déclaration (`type_inter`, `reported_from`, `reported_to`).
- Fiche équipement : nouvelle section « État et évolution » (chiffres clés, histogramme
  mensuel par type, heures passées par mois, répartition par type, catégorie d'action et
  facteur de complexité). Un clic sur un mois ou un type ouvre la liste des
  interventions concernées. La case « Inclure les sous-équipements » commande
  désormais cette section et l'activité.

### Modifié
- Fiche équipement plus compacte : propriétés sur deux colonnes et liste des
  sous-équipements en grille.

## [5.4.0] — 2026-11-16

### Ajouté
- Export de masse des fiches des interventions fermées sur une période, en archive ZIP
  (un PDF par fiche) ou en un seul PDF à imprimer, avec filtre par équipement. Limité à
  100 fiches par export, réservé aux administrateurs et responsables.
  Mise à jour : le nouveau droit est créé par le bootstrap, rejoué au démarrage du
  conteneur API (docker compose up -d --build).

## [5.3.1] — 2026-11-15

### Corrigé
- Derrière un proxy d'authentification (Cloudflare Access), le bandeau « serveur
  injoignable » du front web ne reste plus affiché alors que le serveur répond.

### [interne] Bascule depuis la production 3.57.0
- deploy/basculer-production.sh : bascule automatique de la production (paramètres dans
  deploy/bascule.conf, modèle bascule.conf.example). Sauvegarde, archive des
  configurations des anciens conteneurs, reprise des clés (JWT, SMTP), coupure par arrêt,
  migration, démarrage, contrôles, rapport ; retour arrière automatique après la coupure
  et option `--retour-arriere`. Refus avant la coupure d'une clé JWT de moins de 32
  caractères (l'API v5 ne démarrerait pas). Essayé sur une fausse production, réussite
  et échec provoqué.
- migrate-from-v4.sh accepte une source à la révision 029 (`002_create_missing_tables` et
  `029_home_view`) en plus de la 030 : deploy/rattrapage-029.sql est appliqué à la base
  cible (jamais à la source) après la restauration. Il ne supprime ni index ni donnée,
  et aucune contrainte hormis les 3 clés de `machine` (point suivant).
- Le contrôle de schéma avant le stamp devient « la cible contient au moins le schéma de
  référence », par le catalogue PostgreSQL ; les contraintes et index en plus de
  l'ancienne base sont comptés sans bloquer. deploy/MIGRATION-v4.md à jour.
- Le rattrapage retire les 3 clés étrangères de `machine` déjà présentes dans la
  3.57.0 : la migration 0003 les recrée en ON DELETE RESTRICT (elle échouait sur deux
  noms identiques).
- Migration 0013 : les quatre motifs de clôture de tâche (TASK_*, ADR 0016) et la
  désactivation de LEGACY_STATUS_CHANGE, jusque-là posés par la seule seed, sont rattrapés
  sur les bases déjà installées. Idempotente, sans écraser un motif existant.

## [5.3.0] — 2026-11-15

### [interne] Mise à jour d'une base existante
- Le bootstrap joue les migrations 0006 à 0012 (audit centralisé, motifs, règles d'audit)
  et ouvre les droits par défaut des nouvelles routes ; au démarrage, l'API retire du
  catalogue des droits les endpoints disparus (POST /audit/log et quatre routes de
  référentiel). Motifs de clôture : docs/backlog/motifs-cloture-bases-existantes.md.

### Administration (suites avant version)
- Une règle de domaine de courriel est refusée (message clair, rien n'est enregistré) si,
  une fois posée, modifiée ou supprimée, elle empêcherait votre propre compte de vous
  connecter.
- La liste des adresses IP bloquées affiche le nom de la personne qui a posé le blocage
  (champ `created_by_name`) au lieu de son identifiant.
- Les quatre routes de référentiel qui répondaient en erreur (activation des catégories
  et sous-catégories d'action, modification et activation des facteurs de complexité)
  sont retirées.

### [interne] Suites avant version
- check.sh contrôle les noms non définis des deux fronts (eslint limité à no-undef et
  react/jsx-no-undef) : un composant utilisé sans import fait échouer la vérification.
- Documentation d'audit : les docstrings des routes et les pages docs/api/endpoints
  (interventions, demandes, tâches, actions, demandes d'achat) ne disent plus « reason_code
  obligatoire » pour les mutations routinières (`ROUTINE` injecté) ; la section commune
  d'audit-log.md explique la règle (motif exigé selon la règle d'audit).
- Le catalogue des endpoints retire, à chaque démarrage, les endpoints disparus du code et
  leurs lignes de droits (le nombre retiré est écrit dans les logs).

### Accueil
- Les codes d'intervention et de demande d'achat portent une petite icône de lien :
  un clic ouvre l'intervention (dans la liste des interventions) ou la demande d'achat.
  C'est valable dans les tâches à exécuter, le planning (y compris les demandes d'achat
  liées à une action) et la vue direction technique, sans recharger l'application.

### Interventions
- Les responsables et administrateurs ont sur chaque tâche à faire ou en cours deux
  boutons « Terminé » et « Annuler », toujours visibles (onglet Tâches et page
  Coordination). Chacun demande un motif d'audit avant d'enregistrer, dans la même
  fenêtre que les autres décisions ; quatre motifs sont ajoutés : « Réalisée sans
  action saisie », « Traitée dans une autre intervention », « Plus nécessaire »,
  « Doublon ». Chaque bouton ne propose que les motifs qui le concernent, réglables dans
  l'administration. Le texte libre n'est demandé que pour « Autre raison ».
  Le motif « Changement historique », réservé aux journaux repris de l'ancienne
  version, n'est plus proposé dans les fenêtres de motif. Ignorer une tâche
  passe aussi par cette fenêtre, sur le web comme sur le mobile, au lieu d'une saisie de
  raison à part. Le bouton Supprimer
  n'est proposé que pour une tâche à faire sans action.
- L'en-tête du détail, dans le panneau de droite, est plus compact (ADR 0013). Statut
  et priorité deviennent des propriétés discrètes qu'on change d'un clic. La demande
  liée tient sur une ligne et ouvre l'onglet Demande. Le titre est plus grand et coupé
  à deux lignes (complet au survol).
- « Demander le pointage », « Copier le code » et « Supprimer » passent dans le menu
  « ⋯ ». Si la suppression est impossible, l'entrée reste grisée avec la raison.
- Le lien vers la page complète est retiré du panneau.
- Dans les actions d'une intervention, le code d'une demande d'achat liée est un lien
  qui ouvre la demande dans la page Achats.
- La page complète d'une intervention disparaît : le détail s'ouvre toujours dans la
  page Interventions (ADR 0014). Les anciennes adresses, dont les QR codes des fiches
  déjà imprimées, ouvrent l'intervention dans cette page. Les liens du préventif, des
  demandes, des demandes d'achat, de l'accueil et des notifications y mènent aussi.
- L'onglet Tâches d'une intervention reprend la présentation de la page Coordination :
  une ligne par tâche avec une barre de couleur selon l'état, l'état, le libellé, la
  personne affectée et l'échéance, modifiables d'un clic. Les boutons Ignorer et
  Supprimer apparaissent au survol. Une tâche se crée avec la ligne « Ajouter une
  tâche… ». L'onglet est en lecture seule sur une intervention fermée ou sans droit de
  modification. Les états s'appellent partout À faire, En cours, Terminé et Ignoré.

### Coordination
- Le statut d'une tâche n'est plus cliquable : le clic « À faire » / « En cours » ne
  fonctionnait pas. Une tâche passe « En cours » ou « Terminé » par une action.
- Quand une modification échoue (affectation, échéance, ignorer, supprimer), le
  message de l'application s'affiche au lieu de ne rien dire.

### Droits
- Ignorer une étape obligatoire d'une gamme est réservé aux responsables et aux
  administrateurs, y compris depuis la page Coordination. Un technicien peut toujours
  ignorer une étape optionnelle ou une tâche hors gamme.

### Préventif
- Un plan désactivé porte un badge « Inactif » dans les listes et dans son détail, et
  propose « Réactiver » à la place de « Désactiver ». La réactivation se fait sans motif
  et reste tracée dans l'historique d'audit avec son auteur (nouvelle route
  `POST /preventive-plans/{id}/reactivate`, ouverte aux administrateurs et responsables).
- Le filtre « Tous statuts » des occurrences ne fait plus planter l'écran.
- Les occurrences en cours et clôturées affichent leur statut en français et en
  couleur (« En cours », « Clôturée ») au lieu du code brut.

### Équipements
- Le champ Emplacement n'affiche plus « 0 » : cette valeur héritée de l'ancienne
  version est vidée.

### Traçabilité
- Chaque création de demande d'intervention est désormais inscrite dans l'historique
  d'audit, au nom de la personne connectée. Jusqu'ici aucune ne l'était.
- Une modification envoyée avec un motif qui ne la concerne pas, avec un motif réservé
  aux traitements automatiques, ou avec « Autre raison » sans texte est refusée au lieu
  d'être enregistrée sans trace fiable.
- Si l'inscription dans l'historique échoue, la modification d'une demande, d'une
  action ou d'une tâche est annulée au lieu de passer sans trace.
- Une tâche modifiée n'apparaît plus deux fois dans l'historique d'audit.

### Traçabilité (ADR 0018, étape 1)
- L'import CSV des demandes d'achat refonctionne : le fichier envoyé n'est plus altéré.
- Une modification est enregistrée en une seule fois avec sa trace d'audit, ou pas du
  tout : plus jamais de succès affiché pour une écriture perdue.
- La création d'une intervention est inscrite dans l'historique d'audit.
- Supprimer une intervention demande un motif, inscrit dans l'historique avec l'état
  supprimé.
- L'export CSV d'une commande et la transition d'une demande n'ajoutent plus de fausses
  lignes « modifié » dans l'historique.
- Un appel non connecté reçoit « non authentifié », un rôle sans le droit « interdit »,
  avant toute demande de motif.

### [interne] Audit centralisé (ADR 0018, étape 1)
- Transaction par requête portée par un middleware ASGI (api/transaction.py) ; droits
  vérifiés par un middleware avant la transaction ; auth hors transaction.
- Déclaration d'audit par route (api/audits/declaration.py) et test de couverture ;
  inventaire généré docs/taches/AUDC-routes.md.
- Événements d'audit pour les repos (api/audits/events.py).
- Exclusions temporaires : génération préventive et import CSV gardent leur succès
  partiel jusqu'à l'étape 2.

### Administration
- La liste des IP bloquées affiche de nouveau l'adresse IP (la colonne restait vide).
- Le formulaire de classe d'équipement ne perd plus le curseur à chaque lettre tapée.
- Supprimer un utilisateur, une clé d'API, une IP bloquée, une règle de domaine email,
  une classe d'équipement ou une vue d'accueil de rôle demande désormais un motif, choisi
  dans la même fenêtre que les autres suppressions. Fermer la fenêtre annule la
  suppression sans message d'erreur. Créer ou modifier ces éléments reste sans motif.

### Traçabilité (ADR 0018, étape 3)
- Plans préventifs, pièces, références fabricant et fournisseur des pièces et références
  fabricant (`manufacturer-items`) passent sous l'audit centralisé : création, modification
  champ par champ, suppression avec motif explicite, auteur pris du jeton.
- Le remplacement des étapes d'un plan préventif est tracé (`steps_changed`, avant/après).
- Une référence « préférée » qui en remplace une autre trace aussi la référence qui perd le
  statut ; supprimer une référence fabricant trace les références fournisseur qu'elle emporte.
- Une erreur de base lors de la modification ou de la suppression d'une référence fabricant
  n'est plus renvoyée brute au client.
- Articles de stock, sous-familles, liens article-fournisseur, fournisseurs et lignes de
  commande fournisseur passent sous l'audit centralisé (création, modification champ par
  champ, suppression avec motif explicite, auteur pris du jeton). Sélectionner une ligne de
  commande trace les lignes qu'elle désélectionne ; changer le fournisseur préféré d'un article
  trace le lien qui perd le statut ; les liens d'une ligne aux demandes d'achat sont tracés
  (`purchase_requests_changed`).
- Familles de stock : création et modification tracées sous un identifiant déterministe calculé
  depuis leur code, le code figurant aussi dans les valeurs (migration 0011, règle routinière
  de `stock_family`).
- Web : supprimer un plan préventif (désactivation), une pièce, une référence fabricant ou
  fournisseur d'une pièce, un fabricant, un article de stock ou un lien article-fournisseur
  demande un motif de suppression dans la fenêtre de motif commune ; fermer la fenêtre
  n'affiche aucune erreur et ne supprime rien.

### Traçabilité (ADR 0018 et 0019, étape 2)
- La fenêtre de motif propose de nouveau les motifs de suppression : la liste des motifs
  renvoie les décisions auxquelles chacun s'applique.
- Mobile : l'application ne code plus aucun motif d'audit (le serveur applique seul la règle
  routinière) ; la suppression d'une tâche exige un motif choisi dans la feuille de motifs.
- Mobile : créer une intervention depuis la saisie d'action exige de choisir d'abord la demande
  d'intervention (le bouton générique sans demande disparaît).
- Web : supprimer une intervention ouvre la fenêtre de motif (motifs de suppression seulement)
  et, si une demande est liée, oblige à choisir de la rouvrir ou de la supprimer aussi ; ce
  second choix est grisé avec explication pour une demande issue du préventif, et la
  suppression est grisée pour une intervention fermée.
- Web : supprimer une demande, une action, une tâche, une demande d'achat (y compris par lot,
  un seul motif pour le lot) ou une commande fournisseur demande un motif de suppression
  choisi dans la liste ; plus aucun motif n'est envoyé à la place de l'utilisateur à la
  création ou à la fermeture d'une intervention.
- Web : l'écran « Nouvelle intervention » crée une demande directe quand aucune demande n'est
  choisie ; les autres écrans de création exigent une demande.
- Web : un import CSV de demandes d'achat refusé affiche la liste des lignes en erreur avec
  leur raison, au lieu d'un message général.
- Une intervention fermée ne peut plus être supprimée.
- Une intervention vient toujours d'une demande : créer une intervention sans demande est
  refusé.
- Supprimer une intervention liée à une demande oblige à choisir l'issue de la demande :
  la rouvrir (retour à « nouvelle ») ou la supprimer avec l'intervention. Les deux
  suppressions, ou la réouverture, sont inscrites dans l'historique d'audit avec le motif ;
  si une des deux écritures échoue, rien n'est supprimé.
- Une demande liée à une occurrence préventive ne peut plus être supprimée avec son
  intervention (refus explicite) ; la rouvrir remet l'occurrence préventive à « générée »,
  ce qui est inscrit dans l'historique d'audit au nom du système.
- L'intervention créée en acceptant une demande est inscrite dans l'historique d'audit
  (création, au nom de la personne connectée).
- Accepter une demande par changement de statut ne répond plus par une erreur interne.
- La création d'une demande, sa suppression, sa réparation et la fermeture automatique de
  la demande à la fermeture de son intervention sont inscrites dans l'historique d'audit
  (la fermeture automatique et la réparation au nom du système, avec l'utilisateur qui les
  a déclenchées).
- Fermer une intervention est tout ou rien avec la clôture de sa demande : une panne
  pendant la clôture annule la fermeture au lieu de la laisser à moitié faite.
- Tâches, actions et changements de statut d'intervention : une seule ligne d'historique par
  changement, au nom de l'utilisateur connecté. Supprimer une action exige toujours un
  motif. Les tâches qu'une action ferme ou démarre sont tracées au nom du système (motif
  « cascade »), avec l'utilisateur qui a saisi l'action.

- La génération des occurrences préventives est tout ou rien : les cas prévisibles
  (occurrence déjà générée, conflit de date, machine sans compteur) sont rapportés sans
  erreur, une panne annule toute la génération au lieu d'être listée. Chaque occurrence,
  demande et intervention créée porte sa ligne d'historique au nom du système (motif
  « cascade ») et de l'utilisateur qui a lancé la génération. Ignorer une occurrence est
  tracé avec son motif. L'acceptation automatique d'un plan crée maintenant vraiment
  l'intervention (type « PRE », titre = libellé du plan) ; elle échouait en silence.

- L'import CSV des demandes d'achat est tout ou rien : toutes les lignes sont vérifiées avant
  d'écrire ; si une seule est invalide, rien n'est créé et la réponse (422) donne le rapport
  complet, toutes les lignes en erreur comprises (une quantité hors limites est maintenant
  détectée à la vérification). Chaque demande importée porte sa ligne d'historique au nom de
  l'utilisateur connecté. La répartition des demandes d'achat vérifie d'abord chaque demande :
  celles qui ne sont pas répartissables sont signalées sans rien écrire, les autres sont
  réparties ; une panne annule toute la répartition. Les commandes créées par la répartition
  sont tracées au nom du système (motif « cascade »). Créer, modifier et supprimer une demande
  d'achat, une commande fournisseur ou un équipement est tracé une seule fois ; la suppression
  exige un motif choisi.

### Mobile
- Création d'une intervention depuis une action : le mobile envoie l'identifiant du
  technicien connecté, qu'exige l'API (la création était refusée).

### Administration et stock (suites de l'audit)
- Référentiel d'administration : un échec à la création ou à la modification d'une
  sous-catégorie d'action affiche un message (rien ne s'affichait).
- Onglet Pièces : le bouton Supprimer est retiré (le backend n'a aucune route de
  suppression de pièce, le bouton échouait).
- Référentiel d'administration : les boutons d'activation des catégories et sous-catégories
  d'action, de modification et d'activation des facteurs de complexité sont retirés (routes
  retirées côté backend, elles répondaient 500). Les facteurs sont affichés en lecture seule.
- Préventif : un échec de désactivation, de réactivation ou d'enregistrement des étapes d'un
  plan affiche maintenant un message ; la confirmation de désactivation se ferme avant la
  fenêtre de motif.
- IP bloquées : la colonne « Créé par » affiche le nom de l'auteur du blocage.
- Domaines de courriel : l'écran explique qu'une règle restreint la connexion de tous les
  comptes aux domaines autorisés, et affiche le refus quand la règle exclurait l'administrateur.
- [interne] Fonctions et hooks web sans appelant retirés (suppression de fournisseur, de ligne
  de commande, de pièce ; doublons de api/equipementClasses.js).

### [interne] Audit centralisé (ADR 0018, étape 4, socle)
- `POST /audit/log` est supprimée (aucun appelant) : le middleware est le seul à écrire
  dans `audit_log`. `GET /audit/logs` est inchangé.
- Les colonnes `password_hash` et `key_hash` sont masquées (valeur remplacée, clé conservée)
  dans toutes les lignes d'audit : création, suppression, diffs et événements.
- Identifiants d'audit uuid5 pour les entités à clé entière ou texte (`entity_id_for`,
  `api/audits/entity_ids.py`) ; `_TABLE_MAP` complété pour les entités à clé uuid.
- Exclusions motivées de la décision 9 (notifications, changelog-seen, endpoints/sync,
  test de courriel, quatre routes cassées renvoyées au backlog).

### [interne] Audit centralisé (ADR 0018, étape 4, référentiels)
- Catégories et sous-catégories d'action, types et statuts d'intervention, motifs et règles
  d'audit (`/admin`) : création et modification tracées en routine sous l'uuid5 de leur clé
  (clé d'origine dans les valeurs). Le SQL des référentiels passe dans
  `api/admin/referentiel_repo.py` ; les erreurs de base passent par `raise_db_error`.

### [interne] Audit centralisé (ADR 0018, étape 4, utilisateurs, droits et divers)
- Utilisateurs (création, modification, rôle, activation, réinitialisation du mot de passe,
  suppression), droits, description des endpoints, clés d'API, IP bloquées, règles de domaine
  de courriel, classes d'équipement, services, vues d'accueil par rôle, et `/users/me/profile`
  et `/users/me/password` (identifiant pris du jeton) : tracés en routine, auteur = jeton.
  Aucune empreinte, mot de passe provisoire ni secret de clé dans `audit_log`.
- Changement pour l'utilisateur : la suppression d'un utilisateur, d'une clé d'API, d'une IP
  bloquée, d'une règle de domaine, d'une classe d'équipement ou d'une vue d'accueil demande
  désormais un motif (`reason_code` dans le corps, 400 sinon).
- `POST /admin/ip-blocklist`, `POST /admin/email-domain-rules` et `PUT /home-view/admin/
  assignments/{role_id}` sont des upserts : `created` pour une nouvelle ligne, sinon
  `{champ}_changed` ; une répétition à l'identique ne trace rien. La vue d'accueil est tracée
  sous l'id de la ligne `role_home_view`, pas sous `role_id`.
- `security_log` (ROLE_CHANGE, USER_DEACTIVATED) et `permission_audit_log` sont conservés.
- Le cache des droits est rechargé après la validation de la transaction (tâche de fond),
  plus avant : un échec d'écriture d'audit ne laisse plus un droit annulé dans le cache.
- Plus aucune route « à traiter » dans l'inventaire (`docs/taches/AUDC-routes.md`).

### [interne] Audit centralisé (ADR 0018, étape 3)
- `api/audits/entity_ids.py` : `stock_family_entity_id(code)`, uuid5 d'un espace de noms constant
  (à ne jamais changer). Migration `0011_audit_famille_stock` (idempotente) et seed alignés ;
  bootstrap à 0011. Plus aucune route « à traiter étape 3 » dans l'inventaire.

### [interne] Audit centralisé (ADR 0018 et 0019, étape 2)
- Migration 0007 : motif SYSTEM_CASCADE (catégorie system) pour les mutations du système
  (retour arrière : `alembic downgrade 0006_audit_erreurs_visibles`, sans effet si le
  motif est déjà référencé par l'audit).
- Tests de l'étape 2 écrits avant le code (xfail strict AUDC-22 et AUDC-23).
- Interventions et demandes (AUDC-22) : plus aucune écriture d'audit dans le repo des
  demandes, événements du système avec le motif SYSTEM_CASCADE, routes déclarées.
- Tâches, actions et journal de statut (AUDC-23) : plus d'appel à fn_audit_log_decision ni
  de motif TASK_STATUS dans ces domaines, `_AUDITED_BY_REPO` retiré du middleware ; routes
  déclarées, exclusions retirées. Nouvelle option `audit(..., events_only=True)` pour une
  route sans entité propre (journal de statut : événement `status_changed` de l'intervention).
- Suites (AUDC-22b) : `POST /intervention-requests/repair` déclaré `events_only` (contournement
  par un identifiant de chemin inexistant retiré) ; ligne `created` de l'intervention créée à
  l'acceptation, motif résolu par `resolve_reason_code("intervention", [])`.
- Préventif (AUDC-24) : `generate`, `repair` (`events_only`, motif de « request ») et `skip`
  déclarés, exclusions et exclusion temporaire de `generate` retirées, plus aucun `rollback()`
  ni SAVEPOINT dans le repo des occurrences ; événements `created` du système pour
  l'occurrence, la demande et l'intervention. `skip` déclare `preventive_occurrence` : sa règle
  d'audit manque aux données de référence (migration à écrire).
- Achats, commandes et équipements (AUDC-25) : routes déclarées (créations par identifiant
  déposé, modifications et suppressions par identifiant de chemin), `dispatch` et `import`
  en `events_only`, `import/headers` et `export/email` exclues « sans écriture » (vérifié :
  aucune écriture en base). Plus de SAVEPOINT dans `dispatch_all` ni d'absorption d'erreur
  par ligne dans l'import ; `_TEMPORARY_EXCLUSIONS` de api/transaction.py est vide.
- Fin du transitoire (AUDC-26) : `injected_reason_code`, `ReasonCodeField` et le champ
  `injected_reason_code` de l'unité d'audit sont retirés ; les schémas des interventions,
  demandes, tâches et actions ne déclarent plus `reason_code` (facultatif seulement sur
  `PATCH /intervention-tasks/{id}` pour la clôture directe, ADR 0016). La transition de
  demande lit le motif validé par le middleware (`request.state`) au lieu de « OTHER » en
  dur. Contrat inchangé pour les clients : un corps avec ou sans `reason_code` se comporte
  comme avant.

### [interne] Audit (ADR 0017)
- Migration 0006 : fn_audit_log_decision ne masque plus ses erreurs (retour arrière :
  `alembic downgrade 0005_affectation_residu`).
- Une erreur de validation levée par un modèle répond 422 avec son message, et non plus 500.
- /intervention-requests/repair utilisait un motif inexistant : l'audit de la
  réparation échouait en silence.
- POST /audit/log : un motif invalide répond désormais une erreur (400) au lieu de
  `{"id": null}`.

### [interne] Interventions (ADR 0014)
- `InterventionDetailPage` devient `components/interventions/InterventionDetailPanel`
  (mode panneau seul). Suppression de deux composants morts : `InterventionDetailView`
  et `tabs/InterventionsListTab`. Liens internes via `entityCodeUrl` (ADR 0009).

### [interne] Pilotage du projet
- CLAUDE.md suit le schéma de pilotage des projets pantin et pétanque : protocole de
  reprise, état d'avancement dans docs/ETAT.md, une fiche par tâche dans docs/taches/,
  contrôle des comptes rendus des subagents. Les agents du projet rendent un compte rendu
  au format commun ; le reviewer contrôle le périmètre de la fiche de tâche.

### [interne] Outillage
- `npm run changelog:check` vérifie de nouveau le CHANGELOG racine (format des titres,
  ordre des versions et des dates, entrées rangées sous une section). Le script hérité
  de la v4 cherchait un fichier disparu. La vérification est ajoutée à check.sh.

### [interne] Équipements (ADR 0011, fin)
- Migration 0005 : affectation = « 0 » remplacée par NULL (valeur exacte seulement).
- Suppression du code mort de l'ancienne page Équipements (tableau, onglets, hooks et
  fonctions d'API sans appelant) ; guides web alignés sur MasterDetailLayout ;
  backlog nettoyé.

## [5.2.0] — 2026-10-10

### Équipements
- Un équipement ne peut plus être rattaché à lui-même ni à l'un de ses
  sous-équipements, et l'arborescence est limitée à 4 niveaux (par exemple site, ligne,
  machine, sous-ensemble).
- Un équipement qui a des sous-équipements ne peut plus être supprimé.
- Les techniciens peuvent modifier un équipement et son rattachement.
- La santé d'une ligne ou d'un site reflète celle de ses machines.
- Nouvelle page Équipements : la liste à gauche, en arbre (sites, lignes, machines,
  replié au départ) ou à plat avec le chemin de chaque équipement, triée par santé ou
  par code ; la fiche à droite, avec ses sous-équipements et son activité (option
  « Inclure les sous-équipements »). La création se fait dans une fenêtre dédiée.
- La fiche d'un équipement se modifie sur place, champ par champ : un clic sur une
  valeur ouvre le champ, Entrée enregistre, Échap annule. Le rattachement se choisit
  par une recherche qui exclut l'équipement et ses sous-équipements.
- L'onglet Classes quitte la page Équipements : les classes se gèrent dans
  Administration → Référentiel.
- Chaque modification d'équipement apparaît dans l'historique, avec son auteur.

### [interne] Équipements (ADR 0011)
- GET /equipements : paramètre sort (health par défaut, ou code) ; la santé d'une mère y est le pire de ses descendants (health.source). Le tri par défaut change (avant : urgents, ouverts, nom).
- API de l'arbre (étape 2) : ancestors et descendants_count sur le détail, subtree_of
  et roots_only sur la liste, children_count, ancestors et parent sur chaque item,
  include_descendants sur le détail et la santé (santé d'une mère = pire descendant,
  health.source), et sur GET /interventions, /intervention-requests et
  /preventive-occurrences.
- Correction : parent_id était toujours vide dans la liste des équipements.
- Migration 0003 : clés étrangères ON DELETE RESTRICT sur machine (equipement_mere,
  equipement_class_id, statut_id) et index sur equipement_mere.
- Contrôles de l'arbre dans api/equipements/validators.py (cycle, profondeur, parent
  inexistant, children_ids, suppression), requêtes récursives bornées dans repo.py.
- Matrice par défaut : PUT et PATCH /equipements ouverts à TECH, appliqués aux seules
  permissions qu'aucun admin n'a modifiées.
- Migration 0004 : motif EQUIPMENT_UPDATE et règle d'audit routine pour l'entité
  equipement, recalage des séquences audit_reason_code et audit_rule.
- AuditMiddleware trace les équipements (une ligne par champ modifié, auteur du jeton).
- Audit : les valeurs UUID et date sont sérialisées (json.dumps default=str). Avant ce
  correctif, ces changements n'étaient pas journalisés, quelle que soit l'entité.
- Équipements : classe ou statut inexistant renvoie 400 au lieu de 500 ; verrou
  consultatif contre les rattachements concurrents.
- PUT et PATCH /equipements renvoient le détail avec include_descendants par défaut :
  pour une mère, la réponse agrège ses descendants (santé comprise). health.source
  porte aussi name.
- Filtres par équipement (interventions, préventif) : un identifiant qui n'est pas un
  UUID renvoie 400 au lieu de 500 (les demandes répondaient déjà 422).

### [interne] Développement
- Stack de dev rechargée à chaud (deploy/docker-compose.dev.yml, ADR 0010) : API en
  uvicorn --reload, fronts web et mobile servis par Vite. Sans effet sur une installation.

## [5.1.0] — 2026-10-07

### Droits par rôle
- Chaque profil (responsable, technicien, acheteur) ne peut faire que ce qui concerne
  son métier. L'administrateur ajuste les droits dans Administration → Rôles et
  permissions.
- Les boutons des actions non autorisées sont masqués.
- L'historique des modifications est réservé aux responsables.

### Sécurité
- Le journal des décisions ne peut plus être modifié ni effacé.
- Plusieurs postes d'un même réseau ne se bloquent plus mutuellement après de
  nombreuses connexions réussies.

### Corrections
- Créer une intervention avec un type invalide affiche un message clair au lieu
  d'une erreur interne.

### [interne] Technique
- Matrice tunnel_permission appliquée à chaque requête (ADR 0007) : matrice par défaut
  posée au démarrage sans écraser les choix d'un admin, cache rechargé toutes les 30 s,
  ADMIN toujours autorisé, clés d'API MCP en lecture (historique d'audit compris).
- Rôle applicatif sans UPDATE, DELETE ni TRUNCATE sur audit_log, permission_audit_log
  et security_log.
- Jeton de session sans la liste des permissions (208 octets) ; les fronts la lisent
  sur /auth/me. Anti-flood par IP limité aux échecs. DatabaseError journalise son
  détail.
- Branches et versions (ADR 0008), CI GitHub Actions, garde-fous .githooks.
- Ce fichier devient la source de « Nouveautés » ; versions de l'API, du front web et
  du mobile alignées sur 5.1.0.

## [5.0.0] — 2026-10-07

Première version publiée sous forme d'un seul dépôt (backend, front web, mobile).

### Ajouté
- Installation en une commande : `deploy/install.sh` puis `docker compose up -d`.
  La base est créée automatiquement (schéma, données de référence, rôle applicatif
  sans superuser, premier administrateur).
- Mobile servi sous `/m` par le même nginx que le front web et l'API (`/api`).
- Procédure et script de bascule d'une instance 4.x (`deploy/MIGRATION-v4.md`).
- Gestion des tâches côté mobile.
- Tests d'intégration sur base jetable (`scripts/test-integration.sh`).

### Sécurité
- Gestion des utilisateurs réservée aux administrateurs.
- L'auteur réel de chaque mutation est tracé depuis la session, y compris pour les
  changements de statut.
- Session refusée si la base ne peut pas vérifier l'utilisateur.
- Export CSV protégé contre l'injection de formules.
- Valeur d'API_ENV inconnue refusée au démarrage ; IP client fiable derrière un proxy.
- Déconnexion : le jeton de rafraîchissement est réellement révoqué (web et mobile).

### Corrigé
- Création d'un équipement sur une installation neuve (code et statut par défaut).
- Codes des statuts d'intervention vides : tâches, fermeture en cascade et compteurs
  du tableau de bord ne trouvaient rien.
- Plusieurs erreurs 500 dues à des imports manquants.

### [interne] Connu
- Les droits par rôle (matrice de permissions) ne sont pas encore appliqués aux
  routes métier : tout utilisateur connecté, et une clé d'API, peut écrire. Chantier
  prioritaire de la prochaine version.
