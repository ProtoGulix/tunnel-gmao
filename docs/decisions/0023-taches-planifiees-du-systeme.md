# 0023. Tâches planifiées du système dans le processus de l'API

- Statut : accepté (2026-11-18)
- Date : 2026-11-18
- Affine : ADR 0018 (audit centralisé dans le middleware), ADR 0021 (génération du
  préventif manuelle)

## Contexte

La génération du préventif est manuelle (bouton « Générer », `POST
/preventive-occurrences/generate`). ADR 0021 a rendu visible l'oubli de ce clic sans
l'empêcher ; la base de dev (copie de production du 2026-11-16) montre 29 occurrences
générées et non traitées dont l'échéance est passée. Décisions de l'utilisateur du
2026-11-18 : génération automatique et glissante (référence : date de clôture de la
demande), prévenance globale d'une semaine, notification à tous des préventifs qui
passent en retard, alarme « sans action depuis 7 jours » sur les interventions ouvertes
avec relance hebdomadaire, retards du préventif relancés de la même façon,
notification par élément à chaque palier hebdomadaire. Amendement du 2026-11-18
(décision de l'utilisateur, qui revient sur « pas d'envoi massif du stock ») : le dernier
palier atteint est notifié s'il ne l'a pas déjà été, donc tout le stock en retard sort au
premier passage, puis chaque élément revient à son palier suivant. Le réglage de fenêtre de
rattrapage (`REMINDER_CATCHUP_DAYS`) est supprimé.

Il faut donc un traitement qui tourne chaque jour sans requête ni utilisateur. Deux
contraintes du code actuel :

1. L'API tourne avec plusieurs processus (`UVICORN_WORKERS`, 2 par défaut) : un
   traitement lancé par chaque processus tournerait plusieurs fois.
2. L'audit ne s'écrit que dans une requête qui modifie (`record_audit_event` lève une
   erreur hors de l'unité d'audit posée par le middleware, ADR 0018). La base accepte
   déjà un auteur vide pour une mutation du système (`is_system = true`, migration 0006).

## Décision

1. **Planification dans l'API.** Le `lifespan` de l'API lance une boucle asyncio qui
   exécute la tâche quotidienne au démarrage puis chaque jour à une heure fixe (réglage
   global, défaut 5 h, heure du serveur). Chaque processus lance la boucle ; un passage
   commence par `pg_try_advisory_lock` sur une clé constante : le processus qui ne
   l'obtient pas ne fait rien. Le travail se fait dans un thread (`run_in_threadpool`),
   la boucle n'est jamais bloquée.
2. **Exécuteur système.** Un module `api/jobs/` fournit un exécuteur qui ouvre sa propre
   connexion, la rend visible de `get_connection()`, pose une unité d'audit, exécute
   l'étape, écrit les événements d'audit avec `is_system = true`, `changed_by` vide et le
   motif `SYSTEM_SCHEDULE`, puis valide tout ou annule tout. Il réutilise l'écriture des
   événements du middleware, sans la dupliquer. Les repos existants s'exécutent donc à
   l'identique dans une requête ou dans une tâche planifiée.
3. **Une transaction par étape** : génération du préventif, notifications de retard,
   alarme « sans action ». L'échec d'une étape est journalisé et n'empêche pas les
   suivantes ; il reste visible par la tuile « Génération du préventif » de la page
   Organisation (ADR 0021), qui lit la date de la dernière génération.
4. **Motif dédié** `SYSTEM_SCHEDULE` (catégorie system), ajouté aux données de
   référence par migration : `SYSTEM_CASCADE` décrit une conséquence d'une décision
   d'utilisateur, pas une génération planifiée.
5. **Idempotence.** Un second passage le même jour ne crée rien : la génération l'est
   déjà (unicité plan, machine, date et garde de l'occurrence active) ; une notification
   n'est émise que si la même (type, entité, palier) n'existe pas déjà, le palier étant
   la date d'échéance ou la date de franchissement du seuil, rangée dans `data`.
6. Le bouton « Générer » reste : il appelle le même code, dans une requête.
7. Les notifications ne sont pas des décisions métier : elles ne passent pas par
   `audit_log`, comme celles émises aujourd'hui par trigger (`di_a_traiter`).

## Alternatives écartées

- **APScheduler** : dépendance nouvelle pour une boucle de quelques lignes ; le problème
  des processus multiples reste entier.
- **Cron du serveur ou quatrième service Compose qui appelle une route** : configuration
  hors de l'application, à refaire à chaque installation ; une PME sans informaticien ne
  saurait pas la diagnostiquer. Une route appelée par cron exigerait en plus une identité
  machine en écriture, contraire à la clé MCP en lecture seule.
- **pg_cron** : extension qui demande des droits superuser à l'installation et place la
  logique métier en SQL, hors des repos testés.
- **Calcul à la volée sans tâche** (générer à la première consultation) : une écriture
  déclenchée par une lecture, imprévisible et attribuée à l'utilisateur qui consulte.

## Conséquences

- Nouveau module `api/jobs/`, nouveaux réglages dans `api/settings.py` (heure du
  passage, prévenance de 7 jours, seuil « sans action » de 7 jours), avec des valeurs
  par défaut : aucune modification de Docker ni du `.env` n'est obligatoire.
- Une migration de données ajoute le motif `SYSTEM_SCHEDULE`.
- Les tests couvrent l'exécuteur hors requête (audit écrit, annulation complète en cas
  d'erreur) et le verrou (un seul passage avec deux exécutions concurrentes) ; ces tests
  vont dans test-integration.sh, ils exigent la vraie base.
- « Aujourd'hui » reste `date.today()` du conteneur ; le fuseau du serveur décide du jour
  (sujet ouvert dans docs/backlog/coherence-decimal-et-timezone.md).
- Remplace le point d'ADR 0021 selon lequel « la génération du préventif reste
  manuelle » : la définition « Génération du préventif » de la page Organisation
  (web/src/components/organisation/definitions.js) est réécrite en conséquence.
- Toute future tâche planifiée (mail hebdomadaire, docs/backlog/mail-hebdo-preventif.md)
  s'ajoute comme une étape de cette boucle.
