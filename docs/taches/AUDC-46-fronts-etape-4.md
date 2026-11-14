# AUDC-46. Fronts de l'étape 4

- Statut : faite
- Agent : frontend-dev
- Branche : refactor/audit-etape-4
- Dépend de : AUDC-44, AUDC-45
- Périmètre d'écriture : `web/src/` (et `mobile/src/` si un écran du périmètre y existe) ;
  CHANGELOG. Exclus : backend.

## Contexte

Les suppressions de l'étape 4 exigent un motif (400 avec liste de motifs sinon) :
utilisateurs, clés d'API, IP bloquées, règles de domaine, classes d'équipement,
affectations de vue d'accueil. Mécanisme commun : `web/src/lib/api/auditGuard`,
`auditEntity.js` (préfixes), `isAuditCancelled` (fenêtre fermée : rien ne se passe,
aucune erreur affichée), comme AUDC-27a et AUDC-35. Créations et modifications : aucune
fenêtre de motif.

## Critères d'acceptation

- [x] chaque suppression du périmètre ouvre la fenêtre de motif ; fermée, rien ne se passe
- [x] auditGuard / auditEntity reconnaissent les entités de l'étape 4 (test)
- [x] check.sh vert ; CHANGELOG

## Compte rendu final

Web : `auditEntity.js` reconnaît user (admin/users), api_key, ip_block, email_domain_rule,
equipement_class, role_home_view (home-view/admin) ; test dans auditGuard.test.js.
`isAuditCancelled` géré (retour silencieux, fenêtre de confirmation fermée par le composant
enfant) dans AdminSecurityTab (IP, domaine, clé d'API), AdminReferentielTab (classe
d'équipement, via `wrap`) et AdminRolesTab (vue d'accueil, retour arrière de l'état déjà fait
par le hook). CHANGELOG : section Administration.

Appels trouvés : deleteIpBlock, deleteEmailDomainRule, deleteApiKey, deleteEquipementClass
(web/src/api/adminReferentiel.js ; doublon inutilisé dans equipementClasses.js),
deleteHomeViewAssignment. Manquant : aucun appel front de DELETE /admin/users/{id} (ni web
ni mobile) ; aucun appel mobile du périmètre ; aucun appel front de POST /audit/log.

eslint : erreurs `_or` (no-restricted-syntax) sur les chaînes `supplier_order` d'auditEntity.js
et auditGuard.test.js, et un emoji ligne 66 du test : antérieures, non introduites ici.
NON VÉRIFIÉ : rien essayé à l'écran.

Contrôle de l'agent principal (2026-11-14) : erreurs eslint de auditEntity.js (2) et
auditGuard.test.js (3) identiques sur develop (préexistantes, backlog point 15) ; check.sh
vert. Aucun écran web ne supprime un utilisateur (désactivation seulement) : question à
l'utilisateur. Essai à l'écran à faire.
