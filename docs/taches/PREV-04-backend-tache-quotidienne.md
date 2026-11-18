# PREV-04. Backend : tâche quotidienne, génération automatique et retards notifiés

- Statut : faite (2026-11-18)
- Agent : backend-dev (sonnet)
- Branche : feat/preventif-automatise, worktree d'une sous-branche
  feat/preventif-automatise-prev04
- Dépend de : ADR 0023, PREV-02, PREV-03
- Périmètre d'écriture : backend/api/jobs/ (nouveau), backend/api/app.py (lifespan),
  backend/api/audits/ (extraction de l'écriture des événements, sans changement de
  comportement), backend/api/settings.py, backend/api/notifications/repo.py,
  backend/api/preventive_occurrences/repo.py (audit des tâches de gamme), backend/tests/ (dont tests/integration), CHANGELOG.md (« Non publié »). Exclu : web,
  mobile, migrations, Docker et `.env` (valeurs par défaut seulement).

## Contexte

ADR 0023 : boucle asyncio dans le `lifespan`, verrou `pg_try_advisory_lock`, exécuteur
système qui pose sa transaction et son unité d'audit. Décisions de l'utilisateur du
2026-11-18 : tous les utilisateurs actifs sont notifiés d'un préventif qui passe en
retard ; une notification par élément, au franchissement puis en relance chaque
semaine tant que l'occurrence n'est pas close (décision complétée le même jour : le
stock, 29 occurrences en retard en base de dev, ressort ainsi à son prochain palier).

## Critères d'acceptation

- [x] Exécuteur système : transaction propre, unité d'audit, événements écrits avec
      `is_system`, auteur vide, motif `SYSTEM_SCHEDULE` ; tout ou rien. L'écriture des
      événements est partagée avec le middleware (extraite, pas copiée) ; tests du
      middleware inchangés et verts
- [x] Boucle : passage au démarrage puis chaque jour à l'heure réglée (défaut 5 h) ;
      arrêt propre à l'extinction ; une étape en échec est journalisée sans arrêter les
      autres ni la boucle
- [x] Verrou : deux exécutions concurrentes ne font qu'un passage (test d'intégration)
- [x] Étape 1, génération : appelle `generate_occurrences` dans l'exécuteur ; les mails
      `di_a_traiter` partent comme après le bouton
- [x] Étape 2, retards : pour chaque occurrence active dont l'échéance est passée,
      notification `preventif_echeance` (entité `preventive_occurrence`) à chaque
      utilisateur actif. Paliers : échéance + 1, + 8, + 15 jours… ; notification quand
      un palier tombe le jour du passage (rattrapage réglable, 1 jour par défaut) et n'a pas déjà été notifié (palier
      rangé dans `data`) ; plus rien une fois l'occurrence close. Message avec plan,
      code machine, échéance et jours de retard. Même mécanisme de paliers que PREV-05
      (une seule fonction partagée)
- [x] Tests : notifiée à J+1 ; pas de doublon au second passage ; relance à J+8 ; une
      occurrence en retard depuis 30 jours ressort à son prochain palier ; plus rien
      après la clôture
- [x] Tâches de gamme créées par la génération (manuelle ou planifiée, et à
      l'acceptation automatique) : une ligne d'audit `created` par tâche, comme
      l'occurrence et la demande (`_record_system_created`, liste blanche étendue à
      `intervention_task`) ; décision de l'utilisateur du 2026-11-18 ; test
- [x] Idempotence : un second passage le même jour ne crée ni occurrence ni
      notification (test)
- [x] Réglages dans settings.py avec défauts et tests : heure du passage, activation
      de la tâche (pour la couper sans redéploiement)
- [x] scripts/check.sh et test-integration.sh verts ; CHANGELOG à jour

## Compte rendu final

Fait : `api/jobs/` (executor, lock, scheduler, steps, milestones, repo), lifespan, réglages,
`api/audits/writer.py` (écriture d'une ligne d'audit extraite du middleware, partagée avec
l'exécuteur ; le middleware passe son `AuditRepository()` : tests inchangés),
`NotificationRepository.notify_active_users_once`, audit `created` des tâches de gamme.

Conception :
- Motif selon le contexte : `AuditUnit.system_reason` (vide en requête, SYSTEM_SCHEDULE posé
  par l'exécuteur), lu par les repos via `system_reason_code()` (défaut SYSTEM_CASCADE). Pas
  de paramètre à propager ni de motif en dur dans les repos de la génération (préventif et
  acceptation automatique). Les autres repos gardent leur constante (hors du chemin).
- Verrou : `pg_try_advisory_lock` (clé constante) sur une connexion dédiée du pool, libérée
  même sous annulation (bouclier anyio).
- Paliers : `milestones.milestone_to_notify(premier, pas, aujourd'hui, rattrapage)`, réutilisable
  par PREV-05 (premier palier = dernière activité + 7). Déduplication par (type, entité,
  palier `data.milestone`) dans une seule requête INSERT ... SELECT.
- `data` des notifications de retard : milestone, intervention_id, di_id, plan_label,
  machine_code, due_date, days_overdue (précision de l'agent principal pour le front).
- Réglages : SCHEDULED_JOBS_ENABLED (faux par défaut), SCHEDULED_JOBS_HOUR (5, validé 0-23),
  REMINDER_INTERVAL_DAYS (7), REMINDER_CATCHUP_DAYS (1).

Tests : tests/test_jobs_unit.py (22), tests/integration/test_taches_planifiees_integration.py
(12). check.sh backend : 421 passed ; test-integration.sh : 386 passed. Aucun test existant
modifié. Un premier jet du middleware faisait échouer test_status_log_audit (le test remplace
`audit_middleware.AuditRepository`) : corrigé dans le code (paramètre `repository`), pas dans le test.

Question soulevée par l'agent, tranchée par l'agent principal : avec un rattrapage de 7 jours
et un pas de 7 jours, tout le stock serait notifié d'un coup à la première activation, contre la
décision du 2026-11-18 (chaque élément ressort à son prochain palier). Rattrapage ramené à
1 jour par défaut (le palier doit tomber le jour du passage) ; un passage manqué retarde la
notification d'une semaine au plus. Test du retard de 30 jours réécrit en conséquence.
NON VÉRIFIÉ : lifespan avec la boucle activée sur le conteneur (testé seulement par la boucle
et ses étapes) ; variables d'environnement non transmises par deploy/docker-compose (non lu).

Contrôle de l'agent principal (2026-11-18) : diff conforme au périmètre, sauf
backend/api/interventions/repo.py (motif de l'acceptation automatique, nécessaire au choix
du motif par le contexte : accepté) ; aucun test existant modifié ; rattrapage ramené à
1 jour (voir plus haut). Après fusion : check.sh vert, test-integration.sh vert
(386 passed) ; API de dev rechargée, santé 200, tâche désactivée : aucune notification ni
audit SYSTEM_SCHEDULE écrits en base de dev. À l'activation : deploy/docker-compose.yml
liste ses variables une à une, SCHEDULED_JOBS_ENABLED n'y est pas (changement de Compose à
faire avec l'accord de l'utilisateur).
