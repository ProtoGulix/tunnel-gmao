# Changelog

Source unique des nouveautés de Tunnel : ce fichier alimente aussi l'écran
« Nouveautés » de l'application. Format : `## [X.Y.Z] — AAAA-MM-JJ`, sections `###` ;
une section `### [interne] ...` n'est pas affichée aux utilisateurs. Les historiques
des versions 1 à 4 restent dans backend/CHANGELOG.md, web/CHANGELOG.md et
mobile/CHANGELOG.md.

## Non publié

### Ajouté
- Installation : `deploy/sauvegarder.sh` sauvegarde la base depuis n'importe quel
  répertoire, contrôle l'archive et n'en laisse aucune si la sauvegarde échoue (la commande
  `pg_dump | gzip` du README laissait un fichier vide qui avait l'air bon).
- Installation : `deploy/repeter-mise-a-jour.sh` répète une mise à jour sur une copie de la
  sauvegarde, dans une base jetable : il joue migrations et données de départ comme au
  démarrage de l'API, affiche le résultat et le décompte des priorités, sans toucher à la
  production. La mise à jour documentée devient : git pull, sauvegarde, répétition, puis
  `docker compose up -d --build` si la répétition est verte.

### Modifié
- Priorité des interventions : la priorité « normale » s'écrit partout `normal` (elle
  s'écrivait aussi `normale`). La migration 0025, jouée au démarrage de l'API, convertit
  les interventions existantes, avec une ligne d'audit système par intervention (motif
  PRIORITY_NORMALIZED), et pose une contrainte sur les quatre valeurs permises (faible,
  normal, important, urgent). L'API refuse toute autre valeur par une erreur 400 lisible
  (ADR 0039).
- Libellés identiques sur tous les écrans, web et mobile : statut d'intervention « Ouvert »,
  « Fermé », « Attente production » ; tâche et étape de gamme « À faire », « Terminée »,
  « Annulée » ; le bouton qui annule une tâche s'appelle « Annuler ».

### Corrigé
- Tri des interventions par priorité : les interventions en priorité normale ne sont plus
  rangées après les priorités faibles ; le filtre par priorité normale et la fiche PDF les
  reconnaissent.
- Web : l'écran Coordination affiche aussi les interventions en attente de pièces ou de
  production (il filtrait sur un statut qui n'existe pas).
- Mobile : la recherche d'interventions et le choix de l'intervention d'une action trouvent
  aussi les interventions en attente de pièces ou de production.

### [interne] Documentation
- Guide utilisateur : page « Le stock et les pièces » dans « Comprendre Tunnel » (catalogue,
  références fabricant et fournisseur, lien avec les achats, limites) avec son schéma ;
  capture du Bilan du service sur la page d'accueil.
- Guide utilisateur : section « Comprendre Tunnel » (chaîne du travail, codes, cycles de vie,
  actions, préventif, achats et paniers, audit) avec dix schémas SVG ; lien vers frezille.fr.
- README refait : en-tête avec liens et badges, aperçu en captures, fonctionnalités en
  listes courtes (d'après les affirmations livrées du cahier fonctionnel), démarrage rapide,
  liens vers frezille.fr, la démonstration et le guide utilisateur.

## [5.12.1] — 2026-11-21

### Corrigé
- Guide utilisateur : publié sous tunnel.frezille.fr/docs/ (il était déposé à la racine du
  domaine, sans styles ni images) ; la racine renvoie vers le guide.

## [5.12.0] — 2026-11-21

### Ajouté
- Base : migration 0024, quatre motifs de rejet d'une demande (hors périmètre, doublon, déjà
  traité, incomplète) et type de décision `request_rejected`, que REJ-02 appliquera au rejet
  (ADR 0038, REJ-01).
- API : mode démonstration `DEMO_MODE=true` (ADR 0036) : les écritures sur les comptes,
  les droits, les clés d'API, les vues d'accueil par rôle et les règles de sécurité
  répondent 403 `DEMO_MODE_LOCKED` ; les lectures et le travail métier restent permis ;
  aucun courriel n'est envoyé (DEMO-04).
- Démonstration : chargeur de la base fictive (`deploy/demo/load_demo.py`, dates recalées sur
  le jour du chargement, journaux et audit attribués aux auteurs fictifs), script de
  réinitialisation nocturne `reset-demo.sh` (projet Compose isolé `tunnel-demo`) et procédure
  `deploy/demo/README.md` (DEMO-06, ADR 0036).

### Modifié
- API : rejeter une demande exige un motif choisi parmi les motifs de rejet (`request_rejected`),
  quelle que soit la règle d'audit routinière ; sans motif, 400 « reason_code obligatoire »
  avec ces seuls motifs, que la fenêtre commune du web affiche déjà ; un motif hors rejet est
  refusé. Acceptation et mise en attente restent sans motif (ADR 0038, REJ-02).

### Corrigé
- Mobile : le bouton « Annuler » du formulaire de demande de l'onglet « Demandes » ferme
  de nouveau le formulaire.
- Web : dans les demandes d'achat d'une intervention, « à qualifier » suit le statut calculé
  par l'API ; une demande liée à une pièce n'y apparaît plus à qualifier (DAP-01).
- Export PDF de la fiche d'intervention : une demande d'achat liée à une pièce affiche sa référence, sa désignation, sa référence fabricant et son fournisseur préférés (l'ancien article reste lu en repli) (DAP-01).
- Administration : le rôle MCP, réservé aux clés d'API, ne peut plus être attribué à un
  compte de personne.
- Administration : le mot de passe fixé à la création d'un compte suit la règle commune
  (8 caractères, une majuscule, un chiffre) ; le message de réinitialisation ne promet
  plus un mot de passe valable pour une seule connexion.
- Web : la création d'un compte et le changement de rôle lisent les rôles depuis l'API (ACHETEUR proposé, le rôle OPE inexistant n'est plus listé).
- Bilan du service, onglet Qualité : une demande d'achat liée à une pièce n'est plus
  signalée « sans article » ; seules les demandes sans pièce ni article le sont.
- Données de départ : accepter ou mettre en attente une demande d'intervention n'exige plus
  de motif d'audit sur une nouvelle installation (règle `request.status_to` routinière,
  comme en production) (DEMO-07).
- Web : le filtre de site de l'accueil direction technique lit les sites depuis les équipements racines (filtre réel, masqué s'il y a moins de deux sites) ; sur l'accueil acheteur, le filtre de site, sans effet, est retiré (DEMO-01).
- Démonstration : le chargeur crée les articles comme pièces (`part`, références fabricant et fournisseur, `part_id` sur demandes et lignes de commande) et `reset-demo.sh` redémarre l'API après le chargement, pour que l'écran Stock et les notifications ne soient plus vides (DEMO-08).

### [interne] Documentation
- Guide utilisateur publié automatiquement sur GitHub Pages à chaque version sur `main`.
- Guide utilisateur publié sous `tunnel.frezille.fr/docs/` (amendement de l'ADR 0037).
- Guide utilisateur (docs/site, ADR 0037) : pages par rôle (technicien, responsable,
  acheteur, administrateur, installation), barre latérale par section, captures prises par
  script sur une démonstration jetable ; cahier fonctionnel précisé (quantités des pièces
  non suivies, rejet d'une demande sans motif aujourd'hui) (GUIDE-03).
- Guide utilisateur : squelette VitePress en français dans `docs/site/` (accueil, plan par rôle,
  feuille de route), construction en CI quand `docs/site` change, publication GitHub Pages
  manuelle (GUIDE-01, ADR 0037).
- Guide utilisateur : `npm run docs:screenshots` (dans `docs/site/`) prend 16 captures WebP sur
  une démonstration jetable `tunnel-demo-guide` supprimée ensuite (GUIDE-02, ADR 0037).
- Cahier fonctionnel (`docs/cahier-fonctionnel.md`) : ce que Tunnel fait réellement en
  5.11.0, preuve à l'appui, séparé de ce qui est à concevoir (constats) et de la vision ;
  résumé des affirmations publiables pour le site vitrine.

## [5.11.0] — 2026-11-21

### Ajouté
- API : `GET /stats/audit-synthese` renvoie `trends` (hausse, baisse, stable ou null sur la
  période) pour les cinq parts et `decisions_total` ; stable sous 2 points ou 2 décisions
  (BIL-07, ADR 0035).
- API : `GET /stats/service-status` renvoie ses seuils (`thresholds`, définis une seule fois,
  valeurs inchangées : charge 75 / 100 %, fragmentation 5 / 15 %, pilotage 20 / 10 %) et des
  textes de statut d'un mot (Normale / Élevée / Au plafond, Maîtrisée / Notable / Élevée,
  Présent / Limité / Absent) ; `GET /stats/organisation` renvoie `trends` (hausse, baisse,
  stable ou null sur la période) et `preventive_hours_share` par mois (BIL-03, ADR 0034).
- API : `GET /stats/service-status` renvoie `monthly` (heures, capacité proratisée, charge,
  fragmentation et pilotage par mois, classés comme les totaux) et `trends` ;
  `GET /stats/organisation` ajoute `waiting_parts_count` par mois (reconstitué depuis le
  journal des statuts) et sa tendance (BIL-05, ADR 0034 point 12).

- Web : les huit chiffres clés de l'onglet « État » du Bilan portent une mini-courbe et une
  flèche de tendance grise (charge, fragmentation, pilotage et attente de pièces s'ajoutent
  aux quatre déjà équipés) ; rien ne s'affiche si l'API ne fournit pas la série (BIL-06,
  ADR 0034 point 12).

- Web : l'onglet « Audit » du Bilan prend la présentation de l'onglet « État » : six cartes
  sans badge (définition derrière l'icône d'aide, mini-courbe par mois, tendance grise
  donnée par l'API quand elle la fournit), les cinq graphiques mensuels sont retirés, les
  tableaux « Valeurs par mois » et des décisions sont repliés (BIL-08, ADR 0035).
- Web, Bilan du service : le choix de la période passe dans l'en-tête de la page, au modèle de
  l'accueil (boutons 3, 6, 12 et 24 mois, séparateur, plage de dates « 1 septembre –
  21 novembre 2026 ») ; il est masqué sur l'onglet Qualité. Le libellé de semaine de l'accueil
  et du planning répète désormais l'année au début quand la semaine change d'année.
- Web : page « Synthèse de l'audit » (menu Production, à côté d'Organisation, droit
  `stats:get_audit_synthese`) : tâches sans garant, faites sans action du garant, repérées sur le
  terrain, partagées, décisions hors travail normal par type et motif, part automatique ; 3 mois
  par défaut, définitions en clair, mois avant le 2026-11-20 signalés « données incomplètes »
  (SYN-02, ADR 0032).
- API : `GET /stats/audit-synthese?months=N` (défaut 3), synthèse de l'audit et du partage des
  tâches par mois (tâches sans garant, faites sans action du garant, repérées sur le terrain,
  partagées, décisions hors travail normal par type et motif, part des modifications
  automatiques), chiffres d'équipe sans aucune donnée de personne ; droit
  `stats:get_audit_synthese` ouvert par défaut, à rejouer en production par le bootstrap
  (SYN-01, ADR 0032).
- Mobile : le sélecteur de type d'intervention (création et acceptation d'une demande) ne propose
  que les types permis pour l'équipement ; un type devenu non permis est vidé, un type suggéré non
  permis n'est pas verrouillé (TPE-04, ADR 0031).
- Web : le sélecteur de type d'une nouvelle intervention ne propose que les types permis pour
  l'équipement choisi (rechargé au changement d'équipement, type devenu non permis vidé, type
  imposé par une demande préventive conservé), et l'administration des classes d'équipement
  permet de régler les types permis en matrice dans la liste des classes : une colonne par type
  (pastille de couleur), une case par classe enregistrée à chaque clic ; aucune case cochée :
  tous permis (TPE-03, TPE-05, ADR 0031).
- Types d'intervention permis par classe d'équipement appliqués par l'API (TPE-02, ADR 0031) :
  refus en 400 (types permis listés) à la création d'une intervention et quand son type ou son
  équipement change ; `GET /interventions/types?machine_id=` ne renvoie que les types permis ;
  un type suggéré non permis par une demande n'est plus imposé à l'acceptation ;
  `GET` et `PUT /equipement-class/{id}/intervention-types` lisent et remplacent la liste (même
  droit que la modification d'une classe, audit `intervention_types_changed`), et les classes
  portent `allowed_intervention_types`. Sans liste, tout reste permis. Exemption : le type PRE reste toujours permis pour une
  intervention issue d'un plan préventif (génération automatique, acceptation d'une demande
  préventive), pour ne pas bloquer la génération quotidienne ; un PRE manuel sans plan reste soumis
  à la règle.
- Types d'intervention par classe d'équipement (TPE-01, ADR 0031) : migration 0023, table
  `equipement_class_intervention_type` (vide, aucune donnée créée ni modifiée). Retour arrière :
  suppression de la table.
- Règles données par l'API (REG-01, ADR 0030) : `is_locked` sur chaque intervention,
  `can_delete` sur chaque action et chaque tâche, `capabilities` (`skip_obligatory_step`,
  `close_task_without_action`) sur `GET /auth/me`, calculés par les fonctions qui servent déjà
  au refus. La suppression d'une tâche est désormais refusée (400) si elle n'est pas « à
  faire », en plus des cas existants (action liée, intervention fermée).
- Fronts : verrouillage et droits lus dans l'API (REG-02, ADR 0030). Web et mobile utilisent
  `is_locked` (interventions) et `can_delete` (actions et tâches), et le web lit
  `capabilities` de `/auth/me` pour « Ignorer » une étape obligatoire et « Terminé/Annuler »
  sans action ; plus de statut « cancelled » ni de liste de rôles ou de statuts de demande
  d'achat recopiés. Champ absent : action masquée.
- Transitions de demande lues dans l'API (CASC-04, ADR 0029) : le web et le mobile ne recopient
  plus le graphe des statuts ; un bouton n'apparaît que si sa cible figure dans
  `allowed_transitions` (sans ce champ, aucun bouton). « Créer l'intervention » du mobile suit la
  même liste.
- Auteur des journaux de statut (CASC-01, ADR 0029) : la transaction de requête transmet
  l'utilisateur de la requête aux triggers (`app.user_id`, local à la transaction), qui le
  consignent dans `request_status_log.changed_by` et dans la nouvelle colonne
  `intervention_status_log.changed_by`. Migration 0022 : aucune ligne passée modifiée ; les
  écritures hors requête (tâche planifiée) restent sans auteur.
  CASC-05 : la ligne « ouvert » de l'intervention (trigger `trg_init_status_log`), les
  clôtures de /repair et `POST /intervention-status-log` portent aussi l'auteur ; le
  `technician_id` reste déclaratif.
- Audit des cascades (CASC-03, ADR 0029) : chaque écriture en cascade dépose un événement
  du système (`is_system`, `SYSTEM_CASCADE`, auteur = utilisateur de la requête) sur l'entité
  modifiée : occurrence préventive passée « in_progress » ou « completed » (y compris par le
  trigger de fermeture), tâches rattachées, affectées ou datées à l'acceptation, corrections
  des routes `/repair` des demandes et des occurrences, lignes de commande créées ou cumulées
  au regroupement des demandes d'achat, sous-équipements rattachés. `closed_by` est rempli
  quand une action clôt une tâche (faite ou ignorée), et la ligne « ouvert » du journal
  d'une intervention porte l'auteur de la création. Aucune migration.
- Types d'intervention en base : les 8 types (et ceux que l'administration ajoute) vivent
  dans la table `intervention_type`, avec une description courte affichée sous chaque type
  dans le sélecteur. À la création d'une intervention, sur le web comme sur le mobile, le
  type est vide et obligatoire (plus de « Curatif » prérempli) ; le type suggéré par une
  demande le préremplit toujours. L'API (`GET /interventions/types`, `?include_inactive=true`
  pour l'historique), les validations, les filtres, les exports et la santé des équipements
  lisent la base. Un type inconnu ou désactivé est refusé pour une nouvelle valeur. Le
  libellé, la couleur, la description et l'état actif se modifient en Administration, le
  code non ; un type utilisé ne se supprime pas, il se désactive. Migration 0020 : colonne
  `description` et clés étrangères sur `intervention.type_inter` et
  `intervention_request.suggested_type_inter`. ADR 0026.
  Changement d'API : un type inconnu à la création d'une intervention répond désormais
  400 (au lieu de 409). Le type suggéré par une demande reste accepté pour son
  intervention même s'il a été désactivé depuis.
- Création d'une intervention : le type et la priorité se choisissent dans des listes
  qui montrent, pour chaque choix, une pastille de couleur, le libellé et une description
  courte ; la description du choix fait s'affiche sous le champ. Un type imposé par une
  demande système s'affiche dans le même sélecteur, grisé et cadenassé (web et mobile).
- Interventions : `POST /interventions` peut créer, dans une seule transaction, la demande
  d'origine (`request`, à la place de `request_id`) et les tâches (`tasks`). Un échec
  n'écrit plus rien, donc plus de demande orpheline ni de doublon. La demande créée ainsi
  est « directe » : aucune notification, aucun mail « à traiter ». Le droit de créer une
  demande, et celui de créer une tâche, sont exigés en plus. Accepter une demande garde
  maintenant le titre et le technicien (`tech_id`) reçus. ADR 0025.
- Mobile : quand une action clôt la dernière tâche ouverte, le mobile propose de clore
  l'intervention (avec la fenêtre de motif si les règles d'audit en exigent un) ; refuser
  ne change rien.

### Modifié
- Web : les pages État du service, Organisation, Synthèse de l'audit et Qualité des données
  sont regroupées dans une page « Bilan du service » (`/bilan`, menu Production) à trois
  onglets : « État » (bandeau de huit chiffres clés, temps et capacité, organisation du
  travail, préventif), « Audit » (synthèse de l'audit, droit `stats:get_audit_synthese`) et
  « Qualité » (qualité des données). Une période commune en mois calendaires (3, 6, 12 ou 24,
  3 par défaut) remplace les dates libres pour les deux premiers. Les anciennes adresses
  (`/service-status`, `/organisation`, `/audit-synthese`, `/quality-data`) sont retirées
  (BIL-01, ADR 0033).

- Web : l'onglet « État » du Bilan est allégé. Les définitions passent derrière une icône
  d'aide au survol (plus de paragraphe sous chaque chiffre) ; chaque chiffre clé porte un
  badge de statut (charge, fragmentation, pilotage) et une mini-courbe sur la période ; les
  nombres ont un format unique (« 115,2 % », « 807 h ») ; le temps est montré en deux barres
  (catégories de travail, types d'intervention) ; les causes de fragmentation et le temps par
  site sont repliés ; les cinq graphiques mensuels, les règles de lecture et l'alerte critique
  sont retirés (les valeurs par mois restent dans un tableau replié, avec les heures par type) ;
  le préventif tient en trois chiffres courts (BIL-02, ADR 0034).

- Web : rendu de l'onglet « État » affiné. Les badges de charge, fragmentation et pilotage
  tiennent en un mot, texte et couleur donnés par l'API, sans seuil de repli côté web (sans
  statut, pas de badge) ; les définitions affichent les seuils fournis par l'API au lieu de
  seuils recopiés ; les urgences, chantiers coupés, interventions par journée et part du
  préventif portent une tendance neutre (flèche grise et « en hausse », « stable » ou « en
  baisse ») ; les mini-courbes sont lissées ; les barres de temps écrivent libellé, heures et
  part dans chaque segment, sans légende (BIL-04, ADR 0034).
- Création d'une intervention : un seul formulaire, celui de l'accueil, partout. Le bouton
  « Nouvelle intervention » de la page Interventions ouvre une fenêtre au lieu d'une page
  (l'ancienne page bloquait sur « Le titre est obligatoire » sans demande choisie) ; la
  fenêtre de Coordination et le Briefing utilisent le même formulaire ; le mobile suit
  les mêmes règles : demande choisie ou saisie, sa description sert de titre, date de prise
  en charge, technicien pilote, type, priorité. Les tâches s'ajoutent après la création.
  Tout part en un seul envoi : une erreur ne laisse plus de demande à moitié créée. Sur le
  mobile, la création reste possible même si une intervention est déjà ouverte sur
  l'équipement ; le champ « Initiales technicien » disparaît.
- Préventif : ignorer une occurrence demande désormais un motif choisi dans la fenêtre de
  motif commune (machine arrêtée, fait hors de l'outil, plan obsolète, ou autre avec un
  texte), comme les autres décisions tracées, au lieu d'une raison libre. Le motif est
  inscrit au journal d'audit. Migration 0019 : trois motifs ajoutés, règle d'audit de
  l'occurrence rendue non routinière.

### Corrigé
- Web : la catégorie BAT (bâtiment, travaux) est rangée en production dans la description du
  temps, comme le calcul du backend (elle apparaissait sous la fragmentation).
- Préventif : rouvrir une intervention fermée repasse son occurrence préventive « en cours » ;
  elle se termine de nouveau à la prochaine clôture, qui devient la référence de l'échéance
  suivante. Changement tracé dans l'audit (REO-04, amendement de l'ADR 0028).
- Clôturer une demande ne ferme plus l'intervention liée : la transition vers « clôturée »
  est refusée tant que l'intervention est ouverte (« Clore l'intervention : elle clôturera la
  demande. »), c'est la clôture de l'intervention, avec ses contrôles, qui clôture la demande.
  Chaque demande renvoyée par l'API porte `allowed_transitions`, la liste des transitions que
  l'utilisateur peut déclencher (statut, intervention liée, permission).
- Journal des demandes : la clôture d'une demande par la fermeture de son intervention
  n'écrit plus deux lignes identiques (migration 0022, CASC-01). Les doublons passés restent.
- Clôture d'une intervention : une seule porte, la fiche de l'intervention
  (`PUT /interventions/{id}`), avec le contrôle des tâches obligatoires et le motif d'audit
  si la règle l'exige. Le journal de statut refuse désormais « fermé » (400) ; le bouton
  « Statut » du mobile ouvre la confirmation de clôture. La clôture de la demande liée par
  la mise à jour laisse maintenant sa trace du système dans l'audit (elle manquait pour les
  clôtures faites depuis le web). ADR 0027. Changement d'API.
- Réouverture d'une intervention fermée : elle exige désormais un motif (« Clôturée par
  erreur », « Travail à reprendre » ou « Autre » avec un texte), choisi dans la fenêtre de
  motif habituelle, sur le web comme sur le mobile. Elle passe par la fiche de
  l'intervention (`PUT /interventions/{id}`) ; le journal de statut refuse de sortir de
  « fermé » (400). La demande liée, clôturée, repasse « acceptée » avec une trace du
  système ; sur le web, le statut d'une intervention fermée n'est plus grisé. Migration
  0021 (motifs). ADR 0028. Changement d'API.
- Mobile : les boutons « Oui, clore l'intervention » et « Valider » de la fenêtre de motif
  étaient invisibles (couleur inexistante, texte blanc sur fond blanc).
- Mobile : la session ne coupe plus toutes les 15 minutes. Le mobile renouvelle seul son
  jeton de connexion, comme le web, pendant toute la journée de poste (8 heures par
  défaut). Les durées de session réglées dans `deploy/.env` (`ACCESS_TOKEN_EXPIRE_MINUTES`,
  `REFRESH_TOKEN_EXPIRE_HOURS`) sont désormais prises en compte.
- Accueil « Direction technique » : la partie « Idées d'amélioration », qui affichait
  « Erreur » faute de fonctionnement côté serveur, est retirée ; la vue garde les demandes
  d'intervention.
- Suppression d'une action : une tâche « en cours » qui n'a plus aucune action revient à
  « à faire » (événement d'audit système), et le lien action-tâche ne reste plus orphelin ni
  ne bloque la suppression de la tâche. Migration 0017 : clés étrangères en cascade sur
  `intervention_action_task`, après suppression des éventuels liens orphelins.
- Export courriel d'une commande fournisseur : l'export n'écrit plus quatre lignes parasites
  dans le journal d'audit (numéro, statut, fournisseur, montant) à chaque appel ; il ne
  modifie rien et ne trace plus rien. Le contenu du courriel est inchangé.
- Installation neuve : migration 0018, les 72 clés étrangères, 15 contraintes CHECK et
  65 index de la production sont ajoutés à toute base qui ne les avait pas (une base issue de
  la production n'est pas modifiée). Les saisies que la production refusait (lien vers un
  élément inexistant, tâche ignorée sans motif, quantité nulle) sont désormais refusées aussi
  sur une installation neuve.

### [interne] Sécurité
- Messages d'erreur de la base : seuls les refus métier connus (durée d'une action, bornes
  horaires, motif d'audit…) sont renvoyés tels quels ; tout autre message devient
  « Opération refusée par la base de données », le détail restant dans les logs.
- QR code d'une intervention (`GET /exports/interventions/{id}/qrcode`) : l'exception
  « route publique » du middleware d'authentification est retirée. La route, déjà fermée
  sans jeton par le routeur des exports, refusait aussi les utilisateurs connectés ; elle
  est désormais servie à tout utilisateur connecté.
- Journaux en ajout seul : la table de version d'alembic (`alembic_version_backend`) rejoint
  `audit_log`, `permission_audit_log` et `security_log` parmi les tables que le rôle de
  l'application ne peut ni modifier, ni supprimer, ni vider (REVOKE rejoué à chaque
  démarrage). Test d'intégration ajouté.

### [interne] Ménage
- Mobile : fichier de menu `config/navigation.js` supprimé ; il n'était importé nulle part
  et citait encore les anciennes pages `/service-status` et `/quality-data`.

## [5.10.0] — 2026-11-19

### Ajouté
- Fiche équipement : le bloc Préventif indique d'un coup d'œil « Préventif à jour » ou
  « N en retard ». La fenêtre Détail liste les interventions préventives (échéance, date de
  réalisation, écart en pastille) et montre une courbe de l'avance ou du retard de chaque
  plan, réalisation après réalisation.
- Préventif : bouton « Lancer en avance » sur chaque plan de la fiche équipement, pour un
  contrôle fait plus tôt que prévu (par exemple un contrôleur venu en avance). La demande est
  créée tout de suite et suit le circuit habituel ; la prochaine échéance part de sa
  clôture. Réservé aux responsables et administrateurs.
- Santé des équipements : un préventif en retard passe l'équipement en « Attention »
  (« N préventif(s) en retard »), sur le web comme sur le mobile, sauf si un problème plus
  grave est déjà signalé. Le statut de marche (En service…) ne change pas.

### Corrigé
- Export de masse des fiches : les fiches déjà imprimées (archivées) ne sortent plus ; une
  case « Inclure les fiches déjà imprimées » permet de les réimprimer. Les fiches sortent
  rangées par équipement, puis par date de fermeture ; dans le ZIP, les fichiers sont
  numérotés (001_, 002_…) pour garder cet ordre.

### [interne] Suivi du préventif
- API : `GET /preventive-occurrences/history?machine_id=` (historique avec écart en jours,
  négatif en avance) et `POST /preventive-occurrences/anticipate` (création immédiate de
  l'occurrence et de sa demande, même code que la génération ; 409 si une occurrence est
  déjà en cours, 422 si plan ou machine non éligibles).

## [5.9.1] — 2026-11-19

### Corrigé
- Notifications : après le premier envoi de tout le stock en retard, une partie des
  préventifs et des interventions revenait dès le lendemain. Une relance part désormais
  une semaine après le précédent envoi pour le même élément.

## [5.9.0] — 2026-11-18

### Ajouté
- Mobile : cloche des notifications dans l'en-tête de chaque écran, à droite de la loupe
  (compteur relevé une seule fois pour l'application) et bouton « Charger plus » au-delà de 50 notifications.
- Notifications : suppression par masquage (une, les lues, toutes) côté API, sans que la
  relance masquée revienne au passage suivant de la tâche quotidienne (migration 0016).
- Mobile : bouton « Préventif » dans la barre du bas, à la place du QR Code (toujours sur
  l'accueil). Écran « Préventif à faire » (plans en retard puis de la semaine, avec lien vers
  l'intervention ou la demande) et cloche de notifications sur l'accueil (compteur des non
  lues, liste, tout marquer lu, ouverture de l'élément visé).
- Préventif : nouvel onglet « Échéancier » (page Préventif) qui range les plans en retard,
  de la semaine et à venir, avec l'équipement, l'échéance, les jours de retard et le lien
  vers la demande ou l'intervention. Les plans par heures sont signalés « non calculé ».
- Fiche d'un équipement, onglet Préventif : badge « en retard », état et prochaine échéance
  de chaque plan.
- Page Organisation : tuile « Préventifs en retard ». Le texte de la tuile de génération
  précise que la génération devient automatique quand la tâche quotidienne est activée (le
  bouton « Générer » reste disponible).
- Cloche : les notifications d'échéance préventive et d'intervention à clôturer s'affichent
  avec leur icône et ouvrent la demande, l'intervention ou l'échéancier.

### Modifié
- Notifications : au premier passage de la tâche quotidienne, tous les préventifs en
  retard et toutes les interventions sans action depuis 7 jours sont notifiés d'un coup,
  puis chacun revient une fois par semaine tant qu'il n'est pas traité.
- Préventif : les jours de retard sont affichés en pastille rouge « +N j » dans l'échéancier,
  l'onglet Préventif d'un équipement et la liste mobile « Préventif à faire ».
- Installation : la tâche quotidienne (génération du préventif, retards et interventions
  sans action notifiés) est activée par défaut, à 5 h (heure du conteneur, UTC) ; réglages
  `SCHEDULED_JOBS_ENABLED` et `SCHEDULED_JOBS_HOUR` dans deploy/.env. Une installation
  existante la reçoit active à sa mise à jour (premier passage au démarrage de l'API) ; pour
  la couper, ajouter `SCHEDULED_JOBS_ENABLED=false` dans deploy/.env avant la mise à jour.

### Corrigé
- Notifications : marquer comme lue une notification supprimée est refusé (introuvable).
- Notifications : la liste pouvait afficher une notification en double et en omettre une
  autre quand plusieurs avaient été créées au même instant (passage de la tâche
  quotidienne) ; le tri est désormais stable d'une page à l'autre.
- Web : cliquer une notification (ou un lien) vers une intervention ou une demande alors
  que la page Interventions est déjà ouverte n'ouvrait rien ; la sélection suit désormais l'URL.
- Préventif : quand la demande d'un préventif est rejetée, il ne reste plus en retard pour
  toujours : l'occurrence est ignorée, le préventif reste dû à son échéance et une nouvelle
  demande est générée au passage suivant.
- Préventif : les machines qui ne sont pas en service (arrêt, rebut, projet, construction)
  ne génèrent plus de préventif, n'apparaissent plus dans l'échéancier et ne donnent plus
  de notification de retard.

### [interne] Préventif automatisé
- Web : l'échéancier n'est appelé que si le rôle a le droit `preventive_occurrences:get_schedule`
  (sans lui, la tuile Organisation est omise et l'onglet l'indique, sans erreur affichée).
- Échéancier du préventif en lecture : `GET /preventive-occurrences/schedule` calcule
  l'échéance de chaque plan actif et machine (périodicité glissante, référence : date de
  clôture de la demande de la dernière occurrence terminée) et son état (en retard, bientôt
  due, ok, non calculé pour les plans aux heures). Prévenance : réglage `PREVENTIVE_LEAD_DAYS`
  (7 jours par défaut).
- Génération du préventif : la règle passe de périodicité fixe à glissante. La référence est la
  date de clôture de la demande de la dernière occurrence terminée (à défaut sa date
  planifiée) et l'occurrence est créée une semaine avant l'échéance, avec `scheduled_date` =
  échéance. Les échéances des plans existants se déplacent donc : une clôture tardive décale
  la suivante. La demande système reçoit l'échéance dans sa date limite (`deadline`). Plans
  aux heures inchangés.
- Motif d'audit SYSTEM_SCHEDULE (migration 0015) pour tracer les générations planifiées
  du système, sans utilisateur.
- Tâche quotidienne du système (ADR 0023), activée par défaut (`SCHEDULED_JOBS_ENABLED`, voir « Modifié ») :
  une boucle de l'API génère le préventif au démarrage puis chaque jour à `SCHEDULED_JOBS_HOUR`
  (5 h), sous verrou PostgreSQL (un seul passage malgré plusieurs processus), avec les mails
  « DI à traiter » du bouton « Générer ». Chaque étape a sa transaction et son audit
  (`is_system`, auteur vide, motif SYSTEM_SCHEDULE) ; une étape en échec est journalisée sans
  arrêter les autres.
- Retards du préventif notifiés à tous les utilisateurs actifs (`preventif_echeance`) à
  échéance + 1, + 8, + 15 jours... tant que l'occurrence n'est pas close ; le dernier palier
  atteint et non encore émis l'est au passage suivant, si bien que tout le stock en retard
  sort au premier passage. Réglage `REMINDER_INTERVAL_DAYS` (7). La fonction de paliers est
  partagée avec l'alarme « sans action ».
- Alarme « sans action » (`intervention_a_cloturer`) : toute intervention non fermée (attentes
  comprises) sans action depuis 7 jours notifie les utilisateurs actifs, puis chaque semaine
  (dernière action + 7, + 14...). Même règle que les retards du préventif : le stock
  existant sort au premier passage, puis chaque semaine. Une nouvelle
  action remet le compte à zéro.
- Audit : chaque tâche de gamme créée par la génération (bouton, tâche planifiée, acceptation
  automatique) écrit sa ligne `created`. L'écriture d'une ligne d'audit est extraite du
  middleware (`api/audits/writer.py`) sans changement de comportement ; le motif des
  événements du système est choisi par le contexte (`system_reason_code`).

## [5.8.0] — 2026-11-18

### Modifié
- Fiche d'intervention : le code et le nom de l'équipement, en tête du panneau, ouvrent
  la fiche de l'équipement.
- Export de masse des fiches fermées : après un export réussi, un bouton « Marquer ces
  fiches comme imprimées » apparaît dans la fenêtre ; chaque fiche marquée est tracée
  dans le journal d'audit.
- Une fiche marquée imprimée vaut archivée : elle quitte la liste des interventions
  (« À archiver ») dès le marquage, sans attendre le rafraîchissement automatique.

### Corrigé
- Une intervention créée sans date de signalement prend désormais la date du jour (création
  directe et acceptation d'une demande) ; effacer la date d'une intervention est refusé.
- Historique d'un équipement (section « Activité » et liste « Voir les interventions » du
  tableau de bord) : les interventions archivées (fiche imprimée) n'y apparaissaient pas,
  alors que les graphiques les comptent. Elles sont affichées, avec un badge « Archivée ».
- Historique d'un équipement : le statut de chaque intervention s'affichait « — » et la
  date de signalement manquait.
- Tableau de bord d'un équipement : « Voir les interventions » liste toutes les
  interventions de l'équipement, quelle que soit la période choisie (un projet signalé
  avant la période, mais dont les actions y sont comptées, n'y apparaissait pas).
- Interventions de la reprise d'historique sans date de signalement : elles sont
  complétées (date lue dans le code de l'intervention, sinon premier passage du journal des
  statuts) et apparaissent désormais dans les périodes du tableau de bord d'un équipement.
  Chaque correction est tracée dans le journal d'audit (motif « Complétion de données
  historiques »).

### [interne]
- API : `POST /exports/interventions/closed/mark-printed` marque comme imprimées les
  fiches d'un export de masse (ADMIN et RESP), sans toucher au statut des interventions.
- API : `GET /interventions` accepte `include_printed=true` pour renvoyer aussi les
  interventions archivées (le défaut ne change pas : actives seulement).
- Migration 0014 : motif système DATA_BACKFILL et complétion de reported_date (une ligne
  d'audit par intervention, idempotente). Le downgrade ne remet pas les dates à NULL.

## [5.7.0] — 2026-11-17

### Modifié
- Liste des interventions : un sélecteur sous la recherche affiche un seul groupe à la
  fois (À faire, Bloqué, Projets, À archiver) ou tous, avec leur nombre.
- Liste des interventions plus lisible : le titre passe en premier, l'équipement est
  mis en valeur juste dessous avec la date de signalement à droite, comme dans la
  liste des demandes d'intervention, le statut n'est plus répété quand le groupe le
  dit déjà, et le retard n'est plus affiché sur les interventions fermées ou annulées.
- En-tête d'une intervention plus lisible : l'équipement est mis en valeur, le code
  est plus lisible, le titre est plus grand et le type est écrit en clair.

### [interne]
- Client web : une seule règle de déballage des réponses du backend (ADR 0022), dans
  l'intercepteur ; les appels lisent directement `response.data`. Suppression de
  `singleBody` et des lectures tolérantes `data?.data || data`.

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
