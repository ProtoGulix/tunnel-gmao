# Administration : rôles codés en dur, acheteur impossible à créer depuis l'écran

Relevé le 2026-11-21 (rédaction du guide, GUIDE-03), vérifié par l'agent principal.

- `web/src/components/admin/AdminUserCreateModal.jsx` et `AdminUserConfirmModals.jsx`
  listent en dur `['RESP', 'TECH', 'OPE', 'ADMIN']`. En base (`seed_reference.sql`) les
  rôles sont ADMIN, RESP, TECH, MCP, ACHETEUR : `OPE` n'existe pas (« Rôle inconnu » si
  choisi), `ACHETEUR` ne peut être ni créé ni attribué depuis l'écran. Règle recopiée dans
  le front (CLAUDE.md section 4) : lire la liste des rôles depuis l'API.
- `POST /admin/users/{id}/reset-password` répond que le mot de passe temporaire est
  « valide pour une seule connexion », mais rien n'oblige à le changer (aucun indicateur
  posé par `repo.reset_password`). Message à corriger, ou changement forcé à décider.
- `AdminUserCreate.password` n'applique pas la règle de mot de passe (8 caractères, une
  majuscule, un chiffre) imposée au changement par l'utilisateur.

Correction de code, à décider par l'utilisateur. Le guide décrit l'état actuel comme limite.
