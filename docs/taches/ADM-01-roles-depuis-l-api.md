# ADM-01. Administration : rôles lus depuis l'API, règle de mot de passe à la création

- Statut : faite (2026-11-21)
- Agent : frontend-dev (sonnet) pour le web ; agent principal pour le backend
- Branche : fix/roles-admin (depuis develop)
- Dépend de : backlog roles-codes-en-dur-admin (accord de l'utilisateur du 2026-11-21)
- Périmètre d'écriture : web/src/components/admin/ (formulaires d'utilisateur), web/src/api/ (lecture des rôles si absente), tests web ; backend/api/admin/ et backend/api/users/schemas.py (règle de mot de passe, message de réinitialisation), backend/tests/ ; docs/site/administrateur/utilisateurs.md, docs/backlog/roles-codes-en-dur-admin.md, CHANGELOG.md, cette fiche

## Contexte

Les formulaires de création et de changement de rôle listent en dur RESP, TECH, OPE, ADMIN :
OPE n'existe pas, ACHETEUR manque. La liste doit venir de l'API (CLAUDE.md section 4).
Le mot de passe fixé par l'administrateur n'applique pas la règle (8 caractères, une
majuscule, un chiffre) ; la réinitialisation annonce un mot de passe « valide pour une
seule connexion » que rien n'impose.

## Critères d'acceptation

- [x] la liste des rôles des deux formulaires vient de l'API (route existante en lecture pour ADMIN) ; plus aucune liste de rôles codée en dur dans web/src ; ACHETEUR proposé, OPE absent
- [x] création d'un compte : même règle de mot de passe que le changement par l'utilisateur (test)
- [x] message de réinitialisation exact (pas de promesse de connexion unique)
- [x] guide administrateur à jour ; check.sh et test-integration.sh verts ; CHANGELOG

## Compte rendu final

Web (frontend-dev, sonnet, aucune commande en échec) : rôles lus par GET /admin/roles via le
hook existant useAdminRoles, fonction pure toRoleOptions et 4 tests, libellé et code
affichés, filtre du tableau migré aussi, OPE retiré des couleurs, ACHETEUR ajouté ; 87
tests web, build vert. Backend (agent principal) : règle de mot de passe extraite
(check_password_strength) et appliquée à AdminUserCreate, test unitaire ; message de
réinitialisation corrigé. Guide administrateur mis à jour. Rôle MCP (clés d'API) refusé pour un compte de personne, décision de l'utilisateur du
2026-11-21 : validateurs de AdminUserCreate et AdminUserRolePatch, option retirée des
formulaires, tests backend et web.
NON VÉRIFIÉ : affichage à l'écran.
