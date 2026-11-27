# ACD-02. Web : file « à traiter » et demandes à qualifier

- Statut : faite (2026-11-27)
- Agent : frontend-dev
- Branche : feat/accueil-direction-acd02
- Dépend de : ACD-01 (champ `constat_id`)
- Périmètre d'écriture : web/src/pages/home/, web/src/hooks/home/, web/src/components/home/, web/src/api/intervention-requests.js si besoin, CHANGELOG.md, cette fiche. Exclu : backend, mobile, autres pages (réutiliser les composants existants sans les modifier ; si une modification est nécessaire, la signaler).

## Contexte

L'accueil direction (`TechnicalDirectionHomeView.jsx`) n'affiche que des compteurs. Il
devient une file « à traiter » : une section par sujet, chaque ligne avec son action, une
section vide disparaît. Cette tâche pose la structure et la première section. Accepter une
demande crée l'intervention (`POST /intervention-requests/{id}/transition`, `status_to:
acceptee`, type et technicien obligatoires) ; rejeter exige un motif, demandé par la fenêtre
d'audit commune (intercepteur, `AuditGuardDialog` monté dans Layout) : aucun motif en dur,
aucune saisie maison.

## Critères d'acceptation

- [x] section « Demandes à qualifier » : demandes `nouvelle` et `en_attente`, les plus anciennes d'abord, âge en jours, équipement, demandeur, badge « Constat » si `constat_id`
- [x] par ligne : Accepter (fenêtre courte : type, technicien, priorité facultative), Rejeter (appel direct, motif via la fenêtre d'audit), ouvrir la demande ; boutons montrés seulement si la transition est dans `allowed_transitions`
- [x] filtre de site conservé et appliqué ; bouton « Demande d'inter » conservé ; compteurs par statut réduits ou retirés (pas de doublon avec la file)
- [x] section vide masquée ; message unique si toute la file est vide
- [x] tests des règles pures (tri, visibilité des boutons) ; ESLint sans erreur nouvelle ; build Vite vert ; scripts/check.sh vert
- [x] textes sobres (CLAUDE.md 8.7) ; CHANGELOG à jour

## Compte rendu final


Fait : file à sections (`buildQueueSections` dans `hooks/home/requestQueue.js`, section vide écartée ; ACD-03 ajoute ses sections dans cette fonction et leurs lignes en enfants de `QueueSection`). Accepter via `AcceptRequestDialog` (types permis par équipement, techniciens actifs avec initiales, priorité facultative) ; Rejeter sans motif, la fenêtre d'audit le demande. Compteurs et `StandardRequestsSummary` retirés, lien « Toutes les demandes » ajouté.
Tests : `npm test` 120 verts, ESLint sans erreur sur les fichiers touchés, build Vite vert.
Non vérifié : parcours dans un navigateur (acceptation, rejet avec fenêtre de motif) ; la liste ne charge que 100 demandes.

Contrôle de l'agent principal : diff conforme au périmètre ; corrigé en 2de2be1 : la vue
chargeait 100 demandes de tous statuts (une demande ancienne pouvait manquer), elle charge
désormais `nouvelle,en_attente` seulement ; libellés de priorité repris de PRIORITY_CONFIG.
check.sh et build verts. NON VÉRIFIÉ : parcours à l'écran (prévu en ACD-04).
