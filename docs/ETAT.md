# État d'avancement

Dernière mise à jour : 2026-11-27

À relire au début de chaque session et après chaque compaction (protocole de reprise,
en tête de CLAUDE.md). Mis à jour après chaque tâche terminée.

## Versions

- **v5.15.1** (2026-11-27, PR #25, tag sur main) : guide complété (page « Le constat », 106 captures rejouables par zone et formulaire, schémas du préventif), accents de l'écran Clés API, scénario de démonstration complété (constats, plan désactivé, demande à rattacher, demande d'achat à qualifier, clé d'API inutilisable). Documentation contrôlée avant la version (CLAUDE.md 12.3). Production : sans migration ni nouvelle route.
- **v5.15.0** (2026-11-26, PR develop → main, tag sur main) : constat après intervention (ADR 0043) avec suivi de sa demande, demande créée seulement si un levier la génère et référentiel des constats administrable (ADR 0045, migrations 0028 et 0029), indicateurs dans l'onglet Constats du Bilan (ADR 0044), plusieurs tâches par action sur le mobile. Documentation contrôlée avant la version (CLAUDE.md 12.3). Production : migrations 0028 et 0029 et nouveaux droits au démarrage de l'API, sauvegarde avant (pas de retour arrière une fois des constats saisis).
- **v5.14.0** (2026-11-22, PR #23, tag sur main) : export et archivage en masse des fiches fermées, archivage irrévocable garanti par la base (ADR 0041, migration 0026), remise à faire d'une tâche avec motif (ADR 0042, migration 0027), erreurs métier qui ne remontent plus en 500, compteur d'achats ouverts corrigé. Documentation contrôlée avant la version (CLAUDE.md 12.3).
- **v5.13.1** (2026-11-22, PR #22, tag sur main) : libellés de la 5.13.0 achevés (tâche annulée, priorité « Normale », « Attente production ») ; guide aligné, page « Mise à jour et sauvegarde » réécrite avec les scripts, version de Tunnel affichée dans le guide. Documentation contrôlée avant la version (CLAUDE.md 12.3).
- **v5.13.0** (2026-11-22, PR #21, tag sur main) : priorité « normale » écrite `normal` seule, migration 0025 auditée et contrainte (ADR 0039), statuts réels et libellés uniques dans les fronts (PRIO-01 à PRIO-04) ; scripts `deploy/sauvegarder.sh` et `deploy/repeter-mise-a-jour.sh` (SAUV-01, SAUV-02). Production (en 5.10.0) : à mettre à jour par l'utilisateur avec sauvegarde puis répétition, migrations 0017 à 0025 au démarrage de l'API.
- **v5.12.1** (2026-11-21, PR #18, tag sur main) : guide publié sous /docs/ (le workflow
  déposait le site à la racine du domaine). Aucun changement de l'application.
- **v5.12.0** (2026-11-21, PR #17, tag sur main) :
  base de démonstration fictive et mode démo (ADR 0036), demo.frezille.fr en service ;
  guide utilisateur publié sur tunnel.frezille.fr/docs à la fusion dans main (ADR 0037) ;
  rejet d'une demande avec motif obligatoire (ADR 0038, migration 0024 jouée au démarrage de
  l'API) ; corrections : onglet Qualité et demandes d'achat liées aux pièces (QUAL-01,
  DAP-01), rôles de l'administration (ADM-01), données de départ (règle request.status_to),
  bouton Annuler du mobile (MOB-01). Production (en 5.10.0) : à mettre à jour par
  l'utilisateur, migrations 0017 à 0024 au démarrage.
- Version précédente : **v5.11.0** (2026-11-21, PR #16, tag sur main) : 20 fusions dans develop depuis la
  5.10.0, dont SEC-01 et TRI (sécurité, ménage), audit des cascades et auteur des journaux
  (ADR 0029), types d'intervention en base puis par classe d'équipement (ADR 0026, 0031),
  règles lues dans l'API (ADR 0030), réouvertures (ADR 0028), synthèse de l'audit et page
  « Bilan du service » à trois onglets avec seuils, séries et tendances données par l'API
  (ADR 0032 à 0035). Production en 5.10.0 (constaté par l'utilisateur le 2026-11-21), à
  mettre à jour par l'utilisateur en 5.11.0 : migrations 0017 à 0023 jouées au démarrage de
  l'API (base de dev déjà en 0023), le bootstrap ouvre les nouveaux droits (dont
  `stats:get_audit_synthese`).
- v5.10.0 (2026-11-19, PR #15, tag sur main) : suivi du préventif sur la
  fiche équipement (section Préventif, liste des interventions préventives, courbe d'avance ou
  de retard, lancement en avance, santé en « Attention » si un préventif est en retard,
  PREV-14 à PREV-16) ; export de masse sans les fiches imprimées, rangé par équipement
  (EXPM-03). Pas de migration nouvelle. Production (alors en 5.6.1, passée depuis en 5.10.0) à mettre à jour par l'utilisateur
  directement en 5.10.0 : consignes de la 5.9.0 (migrations 0014 à 0016 au démarrage, tâche
  quotidienne active par défaut, premier passage au démarrage).
- v5.9.1 (2026-11-19, PR #14, tag sur main) : correctif, une relance part un intervalle après
  le dernier envoi (PREV-13).
- v5.9.0 (2026-11-18, PR #13, tag sur main) : préventif automatisé (ADR 0023 et son amendement, PREV-01 à
  PREV-09 : échéancier glissant, génération quotidienne, retards et interventions sans action
  notifiés à tous, tout le stock au premier passage puis chaque semaine), clic des
  notifications, pastille des retards, suppression des notifications par masquage, cloche
  mobile sur chaque écran (PREV-10 à PREV-12). Migrations 0015 et 0016 à jouer en
  production (au démarrage de l'API) ; tâche quotidienne active par défaut
  (`SCHEDULED_JOBS_ENABLED=false` pour la couper). Avant la mise à jour : compter le volume
  du premier passage (lecture seule) ; après : constater le verrou (un seul passage).
- v5.8.0 (2026-11-18, PR #11 pour le code et #12 pour la préparation de version, tag sur main) :
  marquage des fiches imprimées après l'export de masse (IMPR-01, IMPR-02), historique
  d'un équipement avec les archivées et dates de signalement complétées (IMPR-03 à 05),
  lien de la fiche d'intervention vers la fiche équipement (LIEN-01). Migration 0014 à
  jouer en production (au démarrage de l'API, à la mise à jour) ; base de dev déjà en 0014.
- v5.7.0 (2026-11-17, PR #10, tag sur main) :
  liste des interventions plus lisible et en-tête du panneau (LIST-01), forme unique des
  réponses dans le client web (ENV-02, interne).
- v5.6.1 (2026-11-17, correctif, PR #9, tag sur main) :
  formulaire « Éditer » d'une action ouvert vide (risque d'écrasement) et en-tête
  d'intervention vidé après un changement de statut (ADR 0022, ENV-01). Production
  mise à jour en 5.6.1 le 2026-11-17 (confirmé par l'utilisateur).
- v5.6.0 (2026-11-17, tag sur main, PR #7 et #8) : page
  « Organisation » (ADR 0021), en production avec la 5.6.1. Avant :
  v5.5.0, tableau de bord d'un équipement (ADR 0020) ; v5.4.0, export de masse des fiches. Production : mise à jour en 5.4.0 lancée par l'utilisateur le
  2026-11-16 (NON VÉRIFIÉ : résultat non rapporté). Production basculée le 2026-11-15
  (révision 0013) ; clone dans ~/DEV/tunnel-gmao sur main, mises à jour par git pull puis
  `cd deploy && docker compose up -d --build` (le fichier Compose est dans deploy/).
  Restent à la main : domaine mobile vers /m, Grafana, clients MCP, cache des postes,
  puis suppression des anciens conteneurs et de l'archive après validation.
- Production en 5.5.0 constatée le 2026-11-16 (dépôt du serveur sur 0bef3b9, droit du
  tableau de bord présent en base). Sur le serveur, le Docker de production est celui
  du système : `sudo docker ...` (le contexte par défaut de l'utilisateur maintenance
  est Docker Desktop, vide).
- Base de dev remplacée le 2026-11-16 par un dump de production du jour, avec l'accord
  de l'utilisateur (412 interventions, révision 0013) ; sauvegarde de l'ancienne base
  supprimée ensuite à sa demande.
- develop contient depuis la 5.11.0 : rien.

## Feuille de route fondatrice

Étapes 1 à 5 de CLAUDE.md section 10 closes. L'étape 5 (RBAC, ADR 0007) est livrée en
v5.1.0 avec ses réserves triées le 2026-11-19 (docs/backlog/README.md) ; son critère de sortie
« tests rôle par endpoint verts » n'a pas été recontrôlé (NON VÉRIFIÉ).

## Chantiers

| Statut | Chantier | Branche | Référence |
| --- | --- | --- | --- |
| fait (2026-11-27) | Onglet Fiche et archivage à l'unité : PDF de nouveau affiché (CSP `object-src blob:; frame-src blob:`, bloqué depuis la 5.0.0 en production et en démonstration), CSP partielle en dev ; archivage à l'unité sous la règle de masse (décision de l'utilisateur du 2026-11-27) : `POST /interventions/{id}/mark-printed` réservé à ADMIN et RESP, intervention fermée seulement, statut relu sous verrou, même audit ; `printed_fiche` refusé au PUT et à la création (changement d'API accepté) ; bouton seulement sur une fermée ; reviewer APPROUVÉ AVEC RÉSERVES (traitées) ; 743 tests d'intégration verts ; dev : route au catalogue, droit RESP à ouvrir par l'utilisateur ; reste une intervention ouverte déjà marquée imprimée en dev (sans doute aussi en production), non traitée ; production : reconstruire le conteneur web, droits par défaut au démarrage de l'API | fusionnée dans develop | [FICHE-01](taches/FICHE-01-pdf-et-archivage-onglet-fiche.md) à [FICHE-03](taches/FICHE-03-web-archivage-unitaire.md) |
| fait (2026-11-27) | Guide : captures par zone, formulaires et fenêtres (33 → 106), contrôle de couverture dans check.sh, trois schémas du préventif, schémas de Comprendre repris dans les pages pratiques ; démonstration : plan désactivé, demande à rattacher, demande d'achat à qualifier, clé d'API inutilisable ; accents de l'écran Clés API ; section « mode démonstration » retirée du guide ; demandes de l'utilisateur | docs/captures-guide | [GUIDE-08](taches/GUIDE-08-formulaires-et-zones.md) |
| fait (2026-11-26) | Guide : captures manquantes (16 → 33 : administrateur, coordination, constat web et mobile, Bilan Constats, import CSV), constats dans le scénario de démonstration, compte administrateur du script de captures sur l'instance jetable seulement ; demande de l'utilisateur | docs/captures-guide | [GUIDE-07](taches/GUIDE-07-captures-manquantes.md) |
| fait (2026-11-26) | Constat : demande créée selon le levier (case « génère une demande » et « exclusif » par choix, levier « Rien ne l'aurait évité »), section « Constats » du référentiel en administration ; décisions de l'utilisateur du 2026-11-26 ; CDL-01 faite (migration 0029, non jouée en dev) | fusionnée dans develop | ADR 0045, [CDL-01](taches/CDL-01-migration-reglages-des-choix.md) à [CDL-05](taches/CDL-05-web-administration-referentiel.md) |
| fait | Constat : suivi et vues (état de la demande en clair, rejet visible, réponses par question, lien vers l'intervention d'origine, suppression refusée ; auteur réel dans l'historique de toute demande) ; retouches d'écran avec l'utilisateur ; reviewer APPROUVÉ (réserve : l'écran ne masque pas Supprimer sur une idée rattachée, le serveur refuse) ; fusionné dans develop le 2026-11-23 | — | [CSV-01](taches/CSV-01-backend-suivi-constat.md), [CSV-02](taches/CSV-02-web-vues-constat.md), [CSV-03](taches/CSV-03-auteur-historique-demande.md) |
| fait | Constat après intervention : ADR 0043 accepté ; CST-01 faite (migration 0028, non jouée en dev) ; CST-02 faite (API : constats, clôture, rattachement) ; CST-03 (web) et CST-04 (mobile) faites ; guide à jour ; reviewer APPROUVÉ AVEC RÉSERVES, réserves traitées (CST-05 faite, libellé Équipement, backlog du rattachement) ; 673 tests d'intégration verts ; migration 0028 et bootstrap joués en dev le 2026-11-22 avec l'accord de l'utilisateur (droits ouverts : ADMIN 7, RESP 7, TECH 6, MCP 4 en lecture) ; essais à l'écran validés (web : saisie, correction, rattachement ; mobile : clôture) ; revue finale APPROUVÉ (réserves mineures : lecture des idées d'amélioration ouverte à tous les rôles, changement de type après clôture sans constat non testé) ; fusionné dans develop le 2026-11-23 ; migration 0028 à jouer en production à sa mise à jour | — | ADR 0043, [CST-01](taches/CST-01-base-constat.md) à [CST-05](taches/CST-05-tests-reserves-revue.md) |
| fait (2026-11-22) | Santé d'un équipement : demandes d'achat reçues ou rejetées plus comptées comme ouvertes (statut dérivé) ; reviewer APPROUVÉ ; 644 tests d'intégration verts | fusionnée dans develop | [CPT-01](taches/CPT-01-compteur-achats-ouverts.md) |
| fait (2026-11-22) | Mobile : « Aucun motif disponible » au lieu du message brut quand l'API exige un motif sans en proposer ; reviewer APPROUVÉ ; pas de test (le mobile n'a pas de lanceur de tests) | fusionnée dans develop | [MSG-01](taches/MSG-01-mobile-message-sans-motif.md) |
| fait (2026-11-22) | Ménage du backlog : codes de statut d'intervention inexistants retirés ; tests de retour arrière des motifs indépendants de l'ordre (accord de l'utilisateur) ; compteur d'achats ouverts de l'équipement reporté au backlog ; 643 tests d'intégration verts | fusionnée dans develop | docs/backlog/statuts-intervention-code-mort.md, tests-integration-dependants-de-l-ordre.md |
| fait (2026-11-22) | Remettre une tâche à faire exige un motif, décision nommée « Tâche remise à faire » (décisions de l'utilisateur du 2026-11-13 et du 2026-11-22) : motifs, migration 0027 (REM-01) ; API et journal (REM-02) ; fronts (REM-03) ; guide ; reviewer APPROUVÉ (remise à faire verrouillée contre une clôture concurrente : 409) ; 643 tests d'intégration verts ; migration 0027 jouée en dev le 2026-11-22 avec l'accord de l'utilisateur (2 motifs ajoutés, OTHER ouvert à task_reopened) ; essai à l'écran validé | fusionnée dans develop | ADR 0042, [REM-01](taches/REM-01-motifs-remise-a-faire.md) à [REM-03](taches/REM-03-fronts-motif-remise-a-faire.md) |
| fait (2026-11-22) | Archivage irrévocable garanti par la base (décision de l'utilisateur du 2026-11-22) : déclencheur, migration 0026 (IRR-01) ; une intervention archivée ne se rouvre pas, fronts web et mobile (IRR-02) ; guide ; 631 tests d'intégration verts ; reviewer APPROUVÉ ; migration 0026 jouée en dev le 2026-11-22 avec l'accord de l'utilisateur (225 interventions archivées figées, aucune donnée modifiée) ; essai à l'écran validé (mention réduite à « Archivée ») | fusionnée dans develop | ADR 0041, [IRR-01](taches/IRR-01-declencheur-archivage-irrevocable.md), [IRR-02](taches/IRR-02-fronts-archivage-irrevocable.md) |
| fait (2026-11-22) | Refus de liaison d'une demande en 404, 409 ou 400 au lieu de 500 (accord de l'utilisateur du 2026-11-22), reviewer APPROUVÉ, 622 tests d'intégration verts | fusionnée dans develop | [LIA-01](taches/LIA-01-refus-de-liaison-erreurs-metier.md) |
| fait (2026-11-22) | Erreurs métier transformées en 500 : `raise_db_error` relance les HTTPException (ERR-01), 94 `raise DatabaseError` des repo passés par `raise_db_error` (ERR-02), 11 tests repo (ERR-03) ; check.sh et 622 tests d'intégration verts | fusionnée dans develop | [ERR-01](taches/ERR-01-raise-db-error-relance-les-erreurs-metier.md) à [ERR-03](taches/ERR-03-tests-erreurs-metier-pas-en-500.md) |
| fait (2026-11-22) | Guide et fronts alignés sur les libellés de la 5.13.0, premier contrôle de la règle CLAUDE.md 12.3 (documentation avant la version), version de Tunnel affichée dans le guide, reviewer APPROUVÉ | fusionnée dans develop | [GUIDE-06](taches/GUIDE-06-guide-aligne-sur-5-13.md) |
| fait (2026-11-22) | Scripts de sauvegarde et de répétition d'une mise à jour (demande de l'utilisateur du 2026-11-22, après l'échec de la commande documentée en production) : SAUV-01, SAUV-02 ; essais réels sur la stack de dev, reviewer APPROUVÉ (réserves corrigées) | fusionnée dans develop | [SAUV-01](taches/SAUV-01-script-sauvegarde.md), [SAUV-02](taches/SAUV-02-script-repetition-mise-a-jour.md) |
| fait (2026-11-22) | Priorité « normale » écrite d'une seule façon (`normal`), migration auditée et contrainte CHECK, codes de statut réels dans les fronts, libellés uniques (décisions de l'utilisateur du 2026-11-21) : PRIO-01 à PRIO-04 faites et intégrées dans la branche ; libellés complétés (« Annuler », « Annulée », « Terminée » partout) ; 621 tests d'intégration verts ; migration 0025 répétée sur une copie puis jouée en dev le 2026-11-21 avec 0024 (134 converties et auditées) ; libellés « À faire » ajoutés le 2026-11-22 ; reviewer APPROUVÉ (test de création atomique ajouté sur sa réserve), essai à l'écran validé le 2026-11-22 ; production : 0024 et 0025 à sa mise à jour | fusionnée dans develop | ADR 0039, [PRIO-01](taches/PRIO-01-migration-priorite-normal.md) à [PRIO-04](taches/PRIO-04-mobile-priorite-et-statuts.md) |
| fait (2026-11-21) | Guide : section « Comprendre Tunnel » (7 pages, 10 schémas SVG : chaîne du travail, codes, cycles de vie, actions, préventif, achats et paniers, audit), demande de l'utilisateur | fusionnée dans develop | [GUIDE-05](taches/GUIDE-05-comprendre-tunnel.md) |
| fait (2026-11-21) | Mobile : « Annuler » du formulaire de demande de l'onglet Demandes (essai à l'écran par l'utilisateur à faire) | fusionnée dans develop | [MOB-01](taches/MOB-01-annuler-formulaire-demande.md) |
| fait (2026-11-21) | Demandes d'achat liées à une pièce : « à qualifier » lu dans le statut dérivé de l'API (web), export PDF d'intervention qui joint les pièces (accord de l'utilisateur) | fusionnée dans develop | [DAP-01](taches/DAP-01-demandes-achat-liees-aux-pieces.md) |
| fait (2026-11-21) | Administration : rôles lus depuis l'API (ACHETEUR proposé, OPE retiré), MCP refusé pour une personne, règle de mot de passe à la création, message de réinitialisation exact (accords de l'utilisateur) | fusionnée dans develop | [ADM-01](taches/ADM-01-roles-depuis-l-api.md) |
| fait (2026-11-21) | Rejet d'une demande d'intervention avec un motif choisi parmi les motifs de rejet (ADR 0038, migration 0024 à jouer en production au démarrage de l'API) | fusionnée dans develop | ADR 0038, [REJ-01](taches/REJ-01-motifs-de-rejet.md), [REJ-02](taches/REJ-02-rejet-exige-un-motif.md) |
| fait (2026-11-21) | Guide utilisateur (ADR 0037 accepté : VitePress, français seul, GitHub Pages, captures par script sur la démonstration) : GUIDE-01 à GUIDE-03 | feat/guide-utilisateur | ADR 0037, [GUIDE-01](taches/GUIDE-01-squelette-vitepress.md), [GUIDE-02](taches/GUIDE-02-captures-par-script.md), [GUIDE-03](taches/GUIDE-03-pages-par-role.md) |
| fait (2026-11-21) | Onglet Qualité du Bilan : demande d'achat « sans article » testée sur les pièces (part_id) et non plus sur l'ancien stock_item (accord de l'utilisateur) | fusionnée dans develop | [QUAL-01](taches/QUAL-01-demande-sans-piece.md) |
| fait (2026-11-21) | Base de démonstration fictive et mode démo (ADR 0036 accepté ; décisions de l'utilisateur du 2026-11-21 : profil tiré de la production, un agent par rôle, mode démo dans le modèle actuel verrouillé par le .env) : DEMO-01 à DEMO-08 ; démo en ligne sur demo.frezille.fr depuis le 2026-11-21 (Compose isolé tunnel-demo, clone /home/tunnel/tunnel-demo, cron 3 h) | feat/base-demonstration | ADR 0036, [DEMO-01](taches/DEMO-01-sites-depuis-l-api.md) à [DEMO-07](taches/DEMO-07-parcours-par-role.md) |
| en cours (2026-11-21) | Cahier fonctionnel (livré, en cours, vision), puis base de démonstration et documentation utilisateur : inventaire du livré (CAH-01), cahier et résumé pour le site validés par l'utilisateur le 2026-11-21 (CAH-02, CAH-03) ; base de démonstration à planifier | cahier fusionné dans develop | [cahier](cahier-fonctionnel.md), [CAH-01](taches/CAH-01-inventaire-du-livre.md), [CAH-02](taches/CAH-02-redaction-du-cahier.md), [CAH-03](taches/CAH-03-resume-site-vitrine.md) |
| fait (2026-11-21) | Onglet « Audit » du Bilan allégé (ADR 0035, accord de l'utilisateur du 2026-11-21) : tendances de la synthèse par l'API (BIL-07), onglet web (BIL-08) | fusionnée dans develop | ADR 0035, [BIL-07](taches/BIL-07-backend-tendances-audit.md), [BIL-08](taches/BIL-08-web-onglet-audit-allege.md) |
| fait (2026-11-21) | Onglet « État » du Bilan allégé (ADR 0034, décisions de l'utilisateur du 2026-11-21 : bandeau gardé, définitions derrière ⓘ, mini-courbes ; puis seuils et badges d'un mot donnés par l'API, tendances sur la période) | fusionnée dans develop | ADR 0034, [BIL-02](taches/BIL-02-web-onglet-etat-allege.md), [BIL-03](taches/BIL-03-backend-seuils-et-tendances.md), [BIL-04](taches/BIL-04-web-badges-courbes-barres-tendances.md), [BIL-05](taches/BIL-05-backend-series-mensuelles.md), [BIL-06](taches/BIL-06-web-courbes-huit-chiffres.md) |
| fait (2026-11-21) | Bilan du service (ADR 0033, décisions de l'utilisateur du 2026-11-21 : trois onglets « État », « Audit » et « Qualité », période commune en mois, 3 par défaut) : page web regroupée (BIL-01) | fusionnée dans develop | ADR 0033, [BIL-01](taches/BIL-01-web-page-bilan-du-service.md) |
| fait (2026-11-21) | Synthèse de l'audit (ADR 0032, décisions de l'utilisateur du 2026-11-20 : toute l'équipe, 3 mois, chiffres d'équipe) : route de synthèse (SYN-01), page web (SYN-02) | fusionnée dans develop | ADR 0032, [SYN-01](taches/SYN-01-backend-synthese-audit.md), [SYN-02](taches/SYN-02-web-page-synthese-audit.md) |
| fait (2026-11-20) | Types d'intervention permis par classe d'équipement (ADR 0031, décisions de l'utilisateur du 2026-11-20) : table de liaison, migration 0023 (TPE-01) ; backend qui vérifie et filtre (TPE-02) ; web : sélecteur filtré et réglage des classes (TPE-03) ; mobile (TPE-04) ; réglage en matrice dans la liste des classes, couleur des types (TPE-05, demande de l'utilisateur à l'essai) ; préventif toujours permis pour ses propres interventions (ADR 0031 point 6) ; reviewer APPROUVÉ, 566 tests d'intégration verts, migration 0023 jouée en dev le 2026-11-20 par le bootstrap au redémarrage de l'API (table vide), essai à l'écran validé ; production : 0023 à jouer à sa mise à jour | fusionnée dans develop | ADR 0031, [TPE-01](taches/TPE-01-migration-types-par-classe.md) à [TPE-05](taches/TPE-05-web-matrice-types-par-classe.md) |
| fait (2026-11-20) | Règles lues dans l'API (ADR 0030, décisions de l'utilisateur du 2026-11-20) : indicateurs is_locked et can_delete, capacités de l'utilisateur, suppression d'une tâche seulement « à faire » (REG-01) ; fronts sans copie de règle, statut « cancelled » retiré (REG-02) ; reviewer APPROUVÉ, 539 tests d'intégration verts, essai à l'écran validé ; restent au backlog : accès aux pages par rôle, statut d'intervention imbriqué sans is_locked (fiche équipement du mobile, demandes) | fusionnée dans develop | ADR 0030, [REG-01](taches/REG-01-backend-indicateurs-et-capacites.md), [REG-02](taches/REG-02-fronts-lisent-les-indicateurs.md) |
| fait (2026-11-20) | Occurrence préventive rouverte avec son intervention (amendement de l'ADR 0028, décision de l'utilisateur) : l'occurrence repasse « en cours », événement du système, se termine à la nouvelle clôture ; reviewer APPROUVÉ (deux passes), 530 tests d'intégration verts | fusionnée dans develop | ADR 0028, [REO-04](taches/REO-04-occurrence-rouverte.md) |
| fait (2026-11-20) | Audit des cascades (ADR 0029) : la demande ne ferme plus son intervention et l'API donne les transitions permises (CASC-02) ; auteur des journaux de statut et fin des doublons, migration 0022 (CASC-01, complétée par CASC-05 : auteur sur toutes les lignes de journal écrites dans une requête) ; événement du système sur chaque cascade et closed_by toujours rempli (CASC-03) ; fronts sur les transitions de l'API (CASC-04) ; reviewer APPROUVÉ, 527 tests d'intégration verts, migration 0022 jouée en dev avec accord le 2026-11-20 (aucune ligne modifiée), essai à l'écran validé ; production : 0022 à jouer à sa mise à jour ; suites au backlog : règles métier recopiées dans les fronts | fusionnée dans develop | ADR 0029, [CASC-01](taches/CASC-01-migration-auteur-des-journaux.md) à [CASC-05](taches/CASC-05-auteur-partout-dans-les-journaux.md) |
| fait (2026-11-20) | Réouverture d'une intervention avec motif (ADR 0028) : migration 0021, motifs de réouverture, jouée en dev le 2026-11-20 (REO-01) ; motif exigé par la mise à jour, journal de statut qui refuse de sortir de « fermé », demande liée rouverte avec trace système (REO-02) ; mobile avec fenêtre de motif (REO-03) ; web : statut modifiable sur une intervention fermée ; relu APPROUVÉ, essai à l'écran validé ; production : 0021 à jouer à sa mise à jour ; suite au backlog : occurrence préventive non rouverte | fusionnée dans develop | ADR 0028, [REO-01](taches/REO-01-migration-motifs-reouverture.md) à [REO-03](taches/REO-03-mobile-reouverture.md) |
| fait (2026-11-20) | Une seule porte de clôture (ADR 0027) : le journal de statut refuse « fermé » (CLO-01) ; le bouton « Statut » du mobile clôt par la mise à jour (CLO-02) ; trace système de la clôture de la demande ajoutée à la mise à jour ; boutons de clôture et de motif du mobile rendus visibles ; relu APPROUVÉ, essai mobile validé ; suites au backlog (réouverture et annulation sans motif, 3 interventions fermées avec tâches ouvertes) | fusionnée dans develop | ADR 0027, [CLO-01](taches/CLO-01-journal-refuse-la-cloture.md), [CLO-02](taches/CLO-02-mobile-cloture-par-la-fiche.md) |
| fait (2026-11-20) | Types d'intervention en base (ADR 0026) : migration 0020 (description, 8 types, clés étrangères), jouée en dev le 2026-11-20 (TYP-01) ; backend lit la table, constantes retirées (TYP-02) ; web et mobile lisent l'API, type vide et obligatoire à la création, type et priorité avec description (sélecteur commun, cadenassé si imposé) (TYP-03, TYP-04) ; type suggéré par une demande accepté même désactivé ; relu APPROUVÉ, essai à l'écran validé ; production : 0020 à jouer à sa mise à jour ; suite au backlog : types permis selon l'équipement | fusionnée dans develop | ADR 0026, [TYP-01](taches/TYP-01-migration-types-en-base.md) à [TYP-04](taches/TYP-04-mobile-types-et-type-vide.md) |
| fait | Création atomique d'une intervention (ADR 0025) : demande, intervention et tâches en un seul appel, demande « directe » sans notification, une seule insertion d'intervention (INT-01) ; trois formulaires web sur la route (INT-02) ; mobile aligné sur la fenêtre de création du web (INT-03) ; mobile propose de clore après la dernière tâche (INT-04) ; décisions de l'utilisateur du 2026-11-20 ; INT-01 à INT-04 faites et intégrées dans la branche, reviewer APPROUVÉ ; essai à l'écran du 2026-11-20 : la référence est le formulaire de l'accueil, pas la fenêtre de Coordination (correction de l'utilisateur) : composant unique de l'accueil pour la page et la Coordination, sans tâches à la création (INT-05), mobile réaligné (INT-06) ; INT-05 et INT-06 faites et intégrées (Briefing aussi sur le composant, ancien hook et composants morts retirés ; « Nouvelle intervention » de la liste ouvre la fenêtre, page supprimée) ; reviewer APPROUVÉ (deux passes), 471 tests d'intégration verts, essai à l'écran validé, fusionné dans develop le 2026-11-20 | — | ADR 0025, [INT-01](taches/INT-01-backend-creation-atomique.md) à [INT-06](taches/INT-06-mobile-aligne-sur-l-accueil.md) |
| fait | Contraintes et traçabilité (ADR 0024) : migration 0018, contraintes et index de la production pour toute installation (72 FK, 15 CHECK, 65 index ; 4 fixtures de test corrigées) ; export courriel d'une commande sans lignes d'audit parasites, test de /repair, ménage (CONT-02) ; ignorer une occurrence avec un motif choisi, migration 0019 (CONT-03) ; 461 tests d'intégration verts ; reviewer APPROUVÉ (152 objets comparés à l'inventaire), migrations 0018 et 0019 jouées en dev avec accord le 2026-11-20 (153 objets présents, révision 0019), essai à l'écran validé, fusionné dans develop le 2026-11-20 ; production : 0017 à 0019 à jouer à sa mise à jour | — | ADR 0024, [CONT-01](taches/CONT-01-migration-contraintes-production.md) à [CONT-03](taches/CONT-03-motif-pour-ignorer-une-occurrence.md) |
| fait | Priorités du backlog trié : jeton du mobile rafraîchi et durées de session transmises par Compose (TRI-01), clés étrangères action-tâche et tâche rendue à « à faire » (TRI-02, migration 0017), table de version d'alembic en ajout seul (TRI-03), partie « Idées d'amélioration » retirée du web (TRI-04, décision de l'utilisateur) ; reviewer APPROUVÉ, migration 0017 jouée en dev avec accord (0 orphelin), essai à l'écran validé, fusionné dans develop le 2026-11-19 | — | [TRI-01](taches/TRI-01-mobile-rafraichir-le-jeton.md) à [TRI-04](taches/TRI-04-web-routes-amelioration.md) |
| fait | Export de masse : fiches déjà imprimées exclues par défaut (case pour les inclure), ordre par équipement puis fermeture, ZIP numéroté (constat en production du 2026-11-19, choix de l'utilisateur) ; reviewer APPROUVÉ, essai à l'écran validé, fusionné dans develop le 2026-11-19 | — | [EXPM-03](taches/EXPM-03-export-masse-sans-imprimees-et-ordre.md) |
| fait | Suivi du préventif sur la fiche équipement (web) : pastille à jour ou en retard, liste des interventions préventives, courbe d'avance ou de retard, lancement en avance d'un plan (décisions de l'utilisateur du 2026-11-19 : lancer en avance plutôt que déclarer antidaté, web seulement) ; PREV-14 et PREV-15 faites et intégrées dans la branche, reviewer APPROUVÉ ; à l'essai : section Préventif avant « État et évolution », santé en « Attention » si un préventif est en retard (PREV-16) ; 425 tests d'intégration verts ; essai à l'écran validé par l'utilisateur, reviewer APPROUVÉ (deux passes), fusionné dans develop le 2026-11-19 | — | [PREV-14](taches/PREV-14-backend-historique-et-lancement-en-avance.md), [PREV-15](taches/PREV-15-web-suivi-preventif-fiche-equipement.md) |
| fait | Préventif automatisé : échéancier glissant (référence = clôture de la demande), génération automatique quotidienne une semaine avant l'échéance, retards notifiés à tous, alarme « sans action depuis 7 jours » avec relance hebdo, cloche mobile ; décisions de l'utilisateur du 2026-11-18 ; ADR et fiches validés le 2026-11-18 ; PREV-01 à PREV-08 faites et intégrées dans la branche (401 tests d'intégration verts ; PREV-08 : demande rejetée = occurrence ignorée et régénérée, machines hors service exclues), essai à l'écran web et mobile validé par l'utilisateur, reviewer APPROUVÉ, fusionné dans develop le 2026-11-18 ; tâche quotidienne désactivée par défaut | — | ADR 0023, [PREV-01](taches/PREV-01-backend-echeancier.md) à [PREV-07](taches/PREV-07-mobile-preventif-et-cloche.md) |
| fait | Liste des interventions plus lisible (sélecteur de groupe, équipement en valeur), en-tête du panneau, correctif de l'en-tête vidé après un changement de statut ; essayée à l'écran, fusionnée le 2026-11-17, reviewer APPROUVÉ | — | [LIST-01](taches/LIST-01-web-liste-interventions-lisible.md) |
| fait | Lien de la fiche d'intervention vers la fiche équipement (code et nom de l'en-tête cliquables) | feat/lien-fiche-equipement | [LIEN-01](taches/LIEN-01-web-lien-fiche-equipement.md) |
| fait | Historique d'un équipement : archivées affichées (`include_printed`), statut et date corrigés, « Voir les interventions » sans période ; 56 dates de signalement vides complétées (migration 0014, audit DATA_BACKFILL, jouée en dev), date du jour par défaut à la création ; bloc « Archivées » d'IMPR-02 retiré ; fusionné le 2026-11-17, reviewer APPROUVÉ | — | [IMPR-03](taches/IMPR-03-historique-equipement-archivees.md), [IMPR-04](taches/IMPR-04-migration-dates-signalement.md), [IMPR-05](taches/IMPR-05-date-signalement-par-defaut.md) |
| fait | Fiches imprimées après l'export de masse : marquage proposé après l'export (nouvelle route POST, accord du 2026-11-17, une ligne d'audit par fiche), « À archiver » sans les fiches imprimées ; essayée à l'écran, fusionnée le 2026-11-17, reviewer APPROUVÉ | — | [IMPR-01](taches/IMPR-01-backend-marquer-fiches-imprimees.md), [IMPR-02](taches/IMPR-02-web-marquage-et-groupe-archive.md) |
| fait | Forme unique des réponses côté client web (intercepteur `{ data }`, même règle que le mobile) : ENV-01 (4 lectures cassées, publiée en 5.6.1) puis ENV-02 (intercepteur unique, lectures directes) ; essayée à l'écran, fusionnée le 2026-11-17, reviewer APPROUVÉ | — | ADR 0022, [ENV-01](taches/ENV-01-web-lectures-cassees.md), [ENV-02](taches/ENV-02-web-intercepteur-unique.md) |
| fait | Page « Organisation » : indicateurs d'équipe (chantiers coupés par une urgence, part d'urgences, préventif en attente, dispersion), vue par tous, aucun chiffre individuel ; fusionnée le 2026-11-17 après essai à l'écran, reviewer APPROUVÉ ; droit créé par le bootstrap, à rejouer en production à la mise à jour | — | ADR 0021, [ORG-01](taches/ORG-01-backend-indicateurs-organisation.md), [ORG-02](taches/ORG-02-web-page-organisation.md) |
| fait | Tableau de bord d'un équipement : section « État et évolution » du panneau web (Recharts, ADR 0020), modale des interventions, fiche et sous-équipements compactés ; fusionné le 2026-11-16 après essai à l'écran, reviewer APPROUVÉ | — | ADR 0020, spike 0004, [TDB-01](taches/TDB-01-backend-tableau-de-bord-equipement.md), [TDB-02](taches/TDB-02-web-section-etat-evolution.md), [TDB-03](taches/TDB-03-web-finition-visuelle.md) |
| fait | Bascule de la production 3.57.0 vers la 5.x (fiches BASC-01 à BASC-04, spike 0003) : répétée sur une copie, script automatique essayé, fusionnée le 2026-11-15 ; bascule réelle à faire depuis une version publiée | — | décisions de l'utilisateur du 2026-11-15 |
| fait | Export de masse des fiches fermées (EXPM-01, EXPM-02), fusionné le 2026-11-16 après essai à l'écran ; plafond 100 ; bootstrap rejoué sur la base de dev, à rejouer en production à sa mise à jour | — | [EXPM-01](taches/EXPM-01-backend-export-masse-fiches.md), [EXPM-02](taches/EXPM-02-web-bouton-export-masse.md) |
| fait | Notifications et retards : clic d'une notification qui ouvre l'élément (web), pastille « +N j » des retards (web et mobile), tout le stock en retard notifié au premier passage (amendement de l'ADR 0023), tri stable de la liste, suppression des notifications par masquage (migration 0016, jouée en dev) ; essai à l'écran validé le 2026-11-18 | fix/notifications-et-retards | [PREV-10](taches/PREV-10-clic-notification-et-retards-visibles.md), [PREV-11](taches/PREV-11-suppression-des-notifications.md) |
| fait | Finitions des notifications avant la version : marquer lue une notification masquée refusé (404) ; mobile : cloche dans l'en-tête de chaque écran (relevé unique du compteur), « Charger plus », boutons de l'écran Notifications ; essai à l'écran validé le 2026-11-18 | fix/notifications-finitions | [PREV-12](taches/PREV-12-finitions-notifications.md) |
| à cadrer | Contraintes d'intégrité perdues par le schéma de référence, [backlog](backlog/contraintes-perdues-reference.md) | à créer | spike 0003 |
| fait | Test de santé du front web derrière Cloudflare Access (SANTE-01), fusionné le 2026-11-15 ; vérification à l'écran en attente | — | décision de l'utilisateur du 2026-11-15 |
| fait | Suites de l'audit centralisé avant la version 5.3.0 (fiches SUIT-01, SUIT-02), fusionnées le 2026-11-15 après essai à l'écran | — | décisions de l'utilisateur du 2026-11-15 |
| fait | Audit centralisé dans le middleware (étapes 0 à 4), suivi dans [AUDC-plan.md](taches/AUDC-plan.md) ; étapes 0 à 4 fusionnées le 2026-11-14 | — | ADR 0018, 0019 |
| à faire ensuite | Changements hors travail normal : restent la remise à faire d'une tâche avec motif (`task_reopened`) et le motif de clôture « Oubli de clôture à la saisie » (absents du code au 2026-11-21) ; occurrence ignorée (CONT-03) et nettoyage faits | à créer | CLAUDE.md section 2.4 |
| à cadrer | Statuts d'intervention en base : libellés et couleurs en dur dans les fronts, écran Référentiel sans effet (types faits, ADR 0026), [backlog](backlog/referentiel-types-statuts-en-base.md) | à créer | aucune fiche encore |
| fait (2026-11-22) | Archivage en masse des interventions fermées (ADR 0040 : archivée = fiche imprimée) : cadrage ARCH-01 ; « Archiver sans exporter » (ARCH-02) ; route d'aperçu `GET /exports/interventions/closed/preview` (ARCH-03, accord du 2026-11-22) ; aperçu avec délai et chargement (ARCH-04) ; fenêtre en deux blocs Exporter et Archiver (ARCH-05, maquette choisie par l'utilisateur) ; guide mis à jour ; 622 tests d'intégration verts ; reviewer APPROUVÉ (deux relectures), essai à l'écran validé par l'utilisateur le 2026-11-22 | fusionnée dans develop | ADR 0040, [ARCH-01](taches/ARCH-01-cadrage-archivage-en-masse.md) à [ARCH-05](taches/ARCH-05-web-fenetre-deux-blocs.md) |

Onglet Tâches (ADR 0015) : fusionné dans develop le 2026-11-13, après validation à
l'écran par l'utilisateur, check.sh et test-integration.sh verts, reviewer APPROUVÉ.

Intégrité de l'audit (ADR 0017, fiches AUD-01 à AUD-05) : fusionnée dans develop le
2026-11-13, check.sh et test-integration.sh (107) verts, reviewer APPROUVÉ. Migration
0006 jouée sur la base de dev le 2026-11-13 avec l'accord de l'utilisateur (bootstrap,
révision 0006_audit_erreurs_visibles vérifiée). Production : à jouer à sa prochaine
mise à jour, avec les motifs de clôture (migration 0013, BASC-03).

Clôture en coordination (ADR 0016, fiches CLO-01 à CLO-06) : fusionnée dans develop le
2026-11-13, après validation à l'écran par l'utilisateur, check.sh et
test-integration.sh (97) verts, reviewer APPROUVÉ. Motifs de clôture posés dans la seed
et la base de dev ; autres bases : migration 0013 (BASC-03).

## Tâches

Aucune fiche ouverte. Closes aussi : CDL-01 à CDL-05 (ADR 0045). Closes aussi : GUIDE-06, SAUV-01, SAUV-02, PRIO-01 à PRIO-04. Closes aussi : TYP-01 à TYP-04, INT-01 à INT-06, CONT-01 à CONT-03, TRI-01, TRI-02, TRI-03, TRI-04, SEC-01, EXPM-03. Closes aussi : PREV-15, PREV-13, PREV-14, PREV-16, PREV-10, PREV-11, PREV-12. Closes aussi : ORG-01, ORG-02. Closes aussi : TDB-01 à TDB-03. Closes aussi : EXPM-01, EXPM-02. Closes aussi : BASC-01 à BASC-04, SANTE-01. Closes aussi : SUIT-01 à SUIT-03. Fiches closes : AUDC-21 à AUDC-30 (étape 2), CLO-01 à CLO-06, AUD-01 à AUD-05, AUDC-00 et AUDC-10 à AUDC-15.

## Dernière décision

2026-11-26 : le constat ne crée une demande que si un levier coché la génère (réglage par choix du référentiel), levier « Rien ne l'aurait évité » exclusif, référentiel des constats modifiable en administration (ADR 0045). Au backlog : une demande par intervention, notification des techniciens, plan préventif depuis « tâche régulière ».

2026-11-21 : backlog repris ; fiches périmées closes (création des interventions, synthèse de l'audit, hors travail normal pour l'occurrence, types en base) ; ordre validé par l'utilisateur : chantier « Coordination et priorités » (cadrage en lecture seule), puis erreurs métier en 500.

2026-11-21 : cahier fonctionnel validé (docs/cahier-fonctionnel.md) ; « en cours » ne reprend que ce que ETAT.md et les ADR montrent (pas d'extrapolation) ; le dépôt du site vitrine est privé et n'est pas nommé dans ce dépôt.

2026-11-20 : types d'intervention en base, type vide et obligatoire à la création avec une description par type, clés étrangères (ADR 0026, décisions de l'utilisateur).

2026-11-20 : création d'une intervention en une seule transaction (ADR 0025) ; fenêtre de création du web comme référence, demande créée dans le même geste sans notification, création toujours permise sur le mobile, clôture proposée après la dernière tâche (décisions de l'utilisateur).

2026-11-19 : toute installation reçoit les contraintes de la production par une migration conditionnelle par nom (ADR 0024) ; ignorer une occurrence préventive exige un motif choisi dans la fenêtre commune (décision de l'utilisateur) ; création des interventions en une transaction : chantier suivant, plan à présenter.

2026-11-19 : backlog trié point par point contre le code (anciens backlogs v1 à v4, suites des étapes 2 à 5, AUDC, bascule) ; points faits ou périmés retirés, points ouverts rangés par thème (docs/backlog/README.md). Prochaines corrections proposées : liens action-tâche orphelins, tables d'audit modifiables, jeton mobile jamais rafraîchi (déconnexions fréquentes confirmées par l'utilisateur), routes « amelioration » absentes.

2026-11-19 : backlog, lot sécurité et erreurs d'abord (choix de l'utilisateur) ; messages P0001 renvoyés au client seulement s'ils figurent dans une liste blanche (alternative écartée : code SQLSTATE dédié, qui demandait une migration des fonctions).

2026-11-19 : un préventif fait en avance s'enregistre en lançant l'occurrence tout de suite (demande créée, circuit normal, échéance théorique conservée pour mesurer l'avance), pas par une déclaration antidatée ; suivi du préventif sur la fiche équipement côté web seulement.

2026-11-19 : une relance (préventif en retard, intervention sans action) part un intervalle après le dernier envoi pour le même élément, pas au palier suivant (le stock rattrapé revenait dès le lendemain, constaté en dev). Précision de l'ADR 0023.

2026-11-18 : tout le stock en retard (préventifs, interventions sans action) est notifié au premier passage, puis chaque semaine (amendement de l'ADR 0023, l'utilisateur revient sur « le stock ressort à son prochain palier ») ; une notification se supprime par masquage (la ligne reste en base pour la déduplication), une par une, les lues ou toutes.

2026-11-18 : préventif automatisé. Périodicité glissante, référence = date de clôture de la demande liée à l'occurrence ; prévenance globale de 7 jours ; tâche quotidienne dans l'API (ADR 0023) avec motif SYSTEM_SCHEDULE ; préventifs en retard et interventions sans action depuis 7 jours (attentes comprises) notifiés à tous les utilisateurs actifs, une notification par élément puis une relance hebdomadaire, le stock ressortant à son prochain palier (amendé le même jour : tout le stock sort au premier passage, voir ci-dessus) ; cloche sur le mobile ; mail hebdo et relevé des heures au backlog.

2026-11-16 : page « Organisation » ouverte à tous les rôles, chiffres d'équipe seulement, définitions figées par l'ADR 0021.

2026-11-16 : tableau de bord d'un équipement avec Recharts (ADR 0020), 12 derniers mois par défaut, sous-équipements selon la case existante du panneau.

2026-11-16 : export de masse des fiches fermées en ZIP et en PDF unique, sur une période de fermeture (date du dernier passage à `ferme`), réservé à ADMIN et RESP, plafond 100 fiches (mesure : 0,31 s par fiche).

2026-11-15 : avant la version 5.3.0, retirer les quatre routes de référentiel cassées et leurs boutons, retirer le bouton Supprimer de l'onglet Pièces, refuser une règle de domaine de courriel qui exclurait l'admin qui la pose, retirer du catalogue des droits au démarrage les endpoints disparus du code. Types et statuts en base hors de cette version.
Avant : 2026-11-14 : étape 2 de l'audit centralisé fusionnée. Avant : une intervention vient toujours d'une demande ; la supprimer fait choisir
entre rouvrir sa demande et la supprimer en cascade ; les interventions sans demande d'avant la séparation
restent telles quelles (ADR 0019).
Avant : 2026-11-13, audit centralisé dans le middleware, une transaction par requête (ADR 0018).
Avant : 2026-11-13 : l'audit est validé avant la mutation et ses erreurs ne sont plus masquées
(ADR 0017). Avant : tout changement hors travail normal passe par les règles d'audit du système
(CLAUDE.md section 2.4) ; clôture des tâches en coordination (ADR 0016).
Avant : fusionné dans develop (05f7cd0), alignement de CLAUDE.md sur le schéma de pilotage éprouvé sur les projets
pantin et pétanque (protocole de reprise, docs/ETAT.md, docs/taches/, contrôle des
subagents, format de compte rendu imposé aux agents).

## Prochaine action

0. Guide (GUIDE-07, GUIDE-08) : fusionné dans develop le 2026-11-27 après relecture point par point par l'utilisateur sur l'aperçu ; version 5.15.1 publiée le 2026-11-27 (PR #25, tag v5.15.1). L'aperçu /docs/ suit `DOCS_SRC` (deploy/README.md). Constat produit à trier : une occurrence préventive « en attente » ne dure qu'un instant, le bouton Ignorer ne s'affiche pratiquement jamais.
0. Constat, demande selon le levier (ADR 0045) : CDL-01 à CDL-05 faites, reviewer APPROUVÉ (réserves traitées), fusionné dans develop le 2026-11-26. Migration 0029 jouée en base de dev le 2026-11-26 avec l'accord de l'utilisateur (sauvegarde préalable) ; à jouer en production à la mise à jour (démarrage de l'API). Essai à l'écran réussi le 2026-11-26 (formulaire, administration > Référentiel > Constats), droits par défaut des nouvelles routes ouverts en dev avec accord.
0. Indicateurs des constats (ADR 0044) : onglet Constats du Bilan, [DIR-01](taches/DIR-01-backend-stats-constats.md) et [DIR-02](taches/DIR-02-web-indicateurs-constats.md) faites, reviewer APPROUVÉ (réserves traitées) ; page Direction puis bloc d'accueil essayés et retirés à la demande de l'utilisateur ; onglet validé, fusionné dans develop le 2026-11-23. Sans migration ; droit `stats:get_constats` créé au démarrage de l'API.
0. Mobile, plusieurs tâches par action ([MOB-01](taches/MOB-01-plusieurs-taches-par-action.md)) : fusionné dans develop le 2026-11-23 après essai sur téléphone, reviewer APPROUVÉ. Sans migration.
0. Rattachement d'un constat atomique ([CRA-01](taches/CRA-01-rattachement-atomique.md)) : déjà garanti par la transaction de la requête, prouvé par un test ; réserve close le 2026-11-23.
0. Suivi et vues du constat (CSV-01 à CSV-03) : fusionné dans develop le 2026-11-23.
0. Constat après intervention (ADR 0043) : fusionné dans develop le 2026-11-23. En production : migration 0028 puis bootstrap à sa mise à jour.

0. Production en 5.13.1. Version 5.14.0 publiée (tag sur main) : en production, migrations 0026 et 0027 jouées au démarrage de l'API lors de la mise à jour.

0. Chantier PRIO (ADR 0039) fusionné le 2026-11-22. Erreurs métier en 500 : chantier ERR fait le 2026-11-22 (reviewer APPROUVÉ, fusionné dans develop) ; suite au backlog : docs/backlog/liaison-demande-refus-en-500.md. Production : migrations 0017 à 0025 à sa mise à jour (0025 convertit les priorités `normale`).

0. Chantier DEMO : fait (DEMO-01 à DEMO-08) ; démonstration publique en service, rechargée
   chaque nuit à 3 h depuis le clone /home/tunnel/tunnel-demo (develop, mise à jour par
   git pull puis reset-demo.sh). Guide utilisateur (ADR 0037) : GUIDE-01 à 03 et GUIDE-05 faites ; suite : captures manquantes (GUIDE-04, à ouvrir), publication sur GitHub Pages à tunnel.frezille.fr/docs (amendement de l'ADR 0037 ; DNS et réglages Pages par l'utilisateur).

0. Version 5.11.0 (décision de l'utilisateur du 2026-11-21) : publiée ; mise à jour de la
   production (en 5.10.0) par l'utilisateur (migrations 0017 à 0023 au démarrage de l'API).

0. Préventif automatisé : fusionné dans develop le 2026-11-18 (ADR 0023, PREV-01 à PREV-08). Tâche quotidienne activée par défaut dans Compose et active en dev depuis le 2026-11-18 (PREV-09). Reste à faire : à la mise en production, estimer d'abord le volume du premier passage (lecture seule ; tout le stock en retard part d'un coup) et constater le verrou (deux processus) ; migrations 0015 et 0016 jouées en dev, à jouer en production à sa mise à jour ; corrections de données à la main (docs/backlog/occurrences-incoherentes.md, occurrences-actives-en-double.md) ; suites au backlog : mail hebdomadaire, relevé des heures, code d'équipement cliquable partagé.
0. Plans préventifs (2026-11-14, branche fix/plan-preventif-inactif-affiche fusionnée) :
   badge « Inactif » et réactivation d'un plan (POST /preventive-plans/{id}/reactivate,
   routinière, ADMIN et RESP), validée à l'écran ; bootstrap rejoué sur la base de dev
   avec l'accord de l'utilisateur (2 droits ouverts).
0. Audit centralisé : étape 3 fusionnée le 2026-11-14 (essai web de l'utilisateur :
   désactivation d'un plan, suppression de références fabricant et fournisseur, motif
   exigé puis accepté ; suppressions d'articles, liens fournisseur et fabricants couvertes
   par les tests d'intégration seulement). Base de dev : migrations 0007 à 0011 jouées ;
   Suites :
   docs/backlog (tri du 2026-11-19). Étape 4 fusionnée le 2026-11-14 (essai à l'écran
   validé ; correctifs au passage : adresse IP des IP bloquées, saisie du formulaire de
   classe d'équipement). Base de dev : migrations jusqu'à 0012. Production : 0006 à 0012 à jouer à sa prochaine mise à jour.
1. Le bilan de sécurité interne (hors dépôt) est à compléter par l'utilisateur avec les
   correctifs de l'ADR 0017.
2. Chantier changements hors travail normal : CONT-03 fait ; remise à faire avec motif faite (chantier REM, ADR 0042) ; « Oubli de clôture à la saisie » abandonné (doublon de « Réalisée sans action saisie », décision du 2026-11-22). Historique, décisions de l'utilisateur du 2026-11-13 :
   remettre à faire exige un motif (task_reopened : « Clôturée par erreur », « Travail à
   reprendre », OTHER) ; nouveau motif de clôture task_done « Oubli de clôture à la
   saisie » ; occurrence préventive ignorée par motif d'audit ; nettoyage du ROUTINE en
   dur du mobile et de GammeProgressBlock ; une base de production existe (indisponible
   pour l'instant) : migration de données idempotente pour tous les motifs.
3. Archivage en masse (chantier ARCH, ADR 0040) : fusionné dans develop le 2026-11-22, à publier dans la prochaine version (sans migration). Production : la route d'aperçu reçoit ses droits (ADMIN, RESP) par le bootstrap au démarrage de l'API. Question ouverte : retirer le marquage depuis l'onglet Fiche (aucun écran ne le permet).
4. Recontrôler le critère de sortie de l'étape 5 (un test de rôle par endpoint) : à
   ouvrir comme tâche quand l'utilisateur le décide, pour lever le NON VÉRIFIÉ.

## Divers

- Branche sauvegarde-avant-publication (dernier commit du 2026-10-07) non fusionnée :
  son sort est à trancher par l'utilisateur.
