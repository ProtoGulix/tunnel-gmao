# PREV-12. Finitions des notifications avant la version

- Statut : faite (2026-11-18), essai à l'écran validé
- Agents : agent principal (backend), frontend-dev (sonnet) pour le mobile
- Branche : fix/notifications-finitions (depuis develop), worktree d'une sous-branche
  fix/notifications-finitions-mobile
- Dépend de : PREV-07, PREV-11 (fusionnées dans develop)

## Contexte

Décision de l'utilisateur du 2026-11-18 : avant de publier la version, corriger les
remarques de la relecture de PREV-11 et ajouter au mobile la cloche sur tous les écrans
et « charger plus » au-delà de 50 notifications.

Remarques de la relecture : (4) marquer lue une notification masquée réussissait,
corrigé (404) ; (5) forme de réponse des DELETE sans enveloppe `single` : laissée telle
quelle, car `PATCH /notifications/read-all` renvoie déjà `{"updated": n}` sans enveloppe
et changer la forme obligerait à modifier les deux fronts sans gain.

## Critères d'acceptation

Backend (agent principal) :

- [x] `PATCH /notifications/{id}/read` sur une notification masquée : 404, rien n'est
      modifié (test d'intégration)

Mobile (frontend-dev). Périmètre : mobile/src/ (en-tête commun ou mise en page des
écrans, components/notifications/, hooks/notifications/, pages/notifications/,
api/notifications.js), cette fiche. Exclu : backend, web.

- [x] La cloche et son compteur sont visibles sur tous les écrans principaux du mobile
      (ceux de la barre du bas et leurs écrans de détail), pas seulement l'accueil ; un
      seul relevé du compteur toutes les 30 s pour toute l'application (pas un par
      écran), arrêté hors connexion (écran de connexion)
- [x] Écran Notifications : « Charger plus » quand il reste des notifications au-delà de
      la page chargée (d'après `pagination.total`), sans doublon ni manque ; le
      masquage (une, les lues, toutes) reste correct après un « charger plus »
- [x] Conventions de docs/guides/conventions-mobile.md, cibles tactiles de 44 px
- [x] Build mobile vert, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur avant fusion (validé le 2026-11-18, après deux retours : cloche à côté de la loupe, boutons de l'écran Notifications)

## Compte rendu final

Mobile : la cloche est dans une bande fine de AppShell (au-dessus de chaque écran,
absente sur /notifications et sur la connexion, hors AppShell). Un
NotificationCountProvider unique relève le compteur toutes les 30 s, monté seulement
connecté. « Charger plus » par skip dédupliqué par id ; après un masquage, rechargement
d'autant de notifications que déjà chargées ; le compteur est relevé après marquage ou
masquage. Build mobile et check.sh verts. Reste : essai à l'écran.

Retour de l'utilisateur à l'essai (2026-11-18) : la bande de 44 px au-dessus des écrans
prend de la place pour rien, cloche voulue à côté de la loupe. Corrigé par l'agent
principal : cloche dans `PageHeader` (prop `showBell`, absente de l'écran Notifications),
cloche de l'accueil remise dans son en-tête, bande retirée d'AppShell (le fournisseur unique
du compteur y reste). Écrans sans `PageHeader` (détail d'intervention, ajout d'action ou
d'achat, QR code, planning en plein écran) : pas de cloche, retour par la barre du bas.
Incident : le renommage de useNotificationCount.js en .jsx a cassé le serveur Vite de dev
(ancien nom en cache), réparé en redémarrant le conteneur tunnel-mobile-vite-1.
