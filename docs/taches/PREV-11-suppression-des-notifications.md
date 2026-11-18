# PREV-11. Suppression des notifications (masquage)

- Statut : faite (2026-11-18), migration 0016 jouée en dev avec l'accord de l'utilisateur, essai à l'écran validé
- Agents : backend-dev (sonnet) pour PREV-11a, frontend-dev (sonnet) pour PREV-11b
- Branche : fix/notifications-et-retards, worktrees de sous-branches
  fix/notifications-et-retards-prev11a et fix/notifications-et-retards-prev11b
- Dépend de : PREV-04 (déduplication par palier), PREV-06, PREV-07 (cloches)

## Contexte

Demande de l'utilisateur du 2026-11-18 : pouvoir supprimer une notification. Choix de
l'utilisateur : **masquer** (la ligne reste en base, marquée supprimée), pas d'effacement.
Raison : la tâche quotidienne n'émet un palier que si aucune notification de même (type,
entité, palier) n'existe (`NotificationRepository.notify_active_users_once`) ; effacer la
ligne ferait revenir la même relance au passage suivant. Actions voulues, web et mobile :
une par une, « supprimer les lues », « tout supprimer ». Accord de l'utilisateur pour la
migration et les nouvelles routes (2026-11-18).

## Contrat d'API (fixé, commun aux deux sous-tâches)

- Colonne `notification.dismissed_at timestamptz NULL` (migration 0016).
- `DELETE /notifications/{notification_id}` : masque une notification de l'utilisateur
  courant. 200 `{"dismissed": 1}`. 404 si elle n'existe pas, n'est pas la sienne ou est
  déjà masquée.
- `DELETE /notifications?only_read=true` : masque les notifications lues de l'utilisateur
  courant ; `only_read=false` (défaut) : masque toutes les siennes. 200
  `{"dismissed": N}`.
- `GET /notifications`, son total et `GET /notifications/unread-count` ignorent les
  notifications masquées.
- La déduplication des paliers compte les notifications masquées (une relance masquée ne
  revient pas ; le palier suivant arrive normalement).

## PREV-11a. Backend et migration

Périmètre : backend/alembic/versions/0016_*.py, backend/api/notifications/,
backend/api/auth/permissions.py (liste des routes de l'utilisateur courant), fichier de
schéma de départ s'il en existe un à tenir à jour, tests backend (unitaires et
intégration), docs/endpoints (notifications), CHANGELOG.md (« Non publié »), cette fiche.
Exclu : web, mobile, api/jobs.

- [x] Migration 0016 réversible (ajout, retrait de la colonne), sans réécriture de données
- [x] Les trois comportements du contrat, limités à l'utilisateur courant (l'id vient du
      jeton) ; aucun moyen de masquer la notification d'un autre (test)
- [x] Liste, total et compteur des non lues excluent les masquées (test)
- [x] Une notification de palier masquée par tous ses destinataires n'est pas réémise par
      `notify_active_users_once` (test d'intégration)
- [x] Routes déclarées dans la liste des routes ouvertes à tout utilisateur authentifié ;
      clé MCP refusée (lecture seule)
- [x] check.sh et test-integration.sh verts ; doc d'endpoint et CHANGELOG à jour

Compte rendu PREV-11a : migration 0016 (dismissed_at, réversible), routes DELETE
/notifications/{id} et DELETE /notifications?only_read, liste, total et compteur filtrés ;
déduplication inchangée (elle compte déjà les masquées, test à l'appui). Routes ajoutées aux
routes personnelles et à api/audits/exclusions.py (exigé par test_audit_coverage). Matrice
attendue ADMIN 259 et RESP 223 (+2 routes seedées). Clé MCP : 401 (route personnelle sans
utilisateur). schema.sql (révision 0001) non modifié ; pas de doc d'endpoint notifications.

## PREV-11b. Web et mobile

Périmètre : web/src/api/notifications.js, web/src/hooks/shared/useNotificationCenter.js,
web/src/components/layout/Notification*, mobile/src/api/notifications.js,
mobile/src/hooks/notifications/, mobile/src/pages/notifications/,
mobile/src/components/notifications/, tests front éventuels, cette fiche.
Exclu : backend.

- [x] Web (cloche) et mobile (écran Notifications) : suppression d'une notification sur
      chaque ligne, sans ouvrir l'élément visé ; boutons « Supprimer les lues » et « Tout
      supprimer », ce dernier avec une confirmation
- [x] Après suppression, liste et compteur à jour sans rechargement de la page
- [x] Conventions web et mobile respectées (cible tactile suffisante sur mobile)
- [x] Build web et mobile et check.sh verts (lint web : erreurs préexistantes, aucune nouvelle ; pas de script lint mobile)
- [x] Essai à l'écran par l'utilisateur avant fusion (validé le 2026-11-18)

## Compte rendu final

### PREV-11b (front)

Web : croix par ligne (stopPropagation), « Supprimer les lues », « Tout supprimer » avec
AlertDialog Radix. Mobile : croix 44 px à côté de la ligne, deux boutons en barre basse,
window.confirm pour « Tout supprimer ». Après masquage : retrait local, puis rechargement
de la première page et du compteur (pas de décalage de pagination). Non vérifié : essai à
l'écran, branchement réel sur le backend PREV-11a.
