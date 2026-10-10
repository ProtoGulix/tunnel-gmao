# Changelog

Source unique des nouveautés de Tunnel : ce fichier alimente aussi l'écran
« Nouveautés » de l'application. Format : `## [X.Y.Z] — AAAA-MM-JJ`, sections `###` ;
une section `### [interne] ...` n'est pas affichée aux utilisateurs. Les historiques
des versions 1 à 4 restent dans backend/CHANGELOG.md, web/CHANGELOG.md et
mobile/CHANGELOG.md.

## Non publié

### Accueil
- Les codes d'intervention et de demande d'achat portent une petite icône de lien :
  un clic ouvre l'intervention ou la demande d'achat. C'est valable dans les tâches à
  exécuter, le planning (y compris les demandes d'achat liées à une action) et la vue
  direction technique, sans recharger l'application.

### Équipements
- Le champ Emplacement n'affiche plus « 0 » : cette valeur héritée de l'ancienne
  version est vidée.

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
