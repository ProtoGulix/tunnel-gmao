# 0005. Gestion des utilisateurs réservée à ADMIN, identité déclarée libre mais tracée

- Statut : accepté
- Date : 2026-10-06
- Affine : CLAUDE.md section 6.2, audit 2026-10-06 (constats 2 et E)

## Contexte

L'audit a montré qu'un RESP pouvait devenir ADMIN (changement de son propre
rôle, création d'un ADMIN, réinitialisation du mot de passe d'un ADMIN), et que
plusieurs champs désignant une personne viennent du corps de la requête
(requested_by_id, approver_id, tech_id, technician_id). Le front web propose
volontairement de choisir le demandeur et l'approbateur : déclarer « au nom de »
quelqu'un est un usage terrain réel (saisie pour un collègue, approbation orale).

## Décision

1. Toute écriture sur les utilisateurs (création, modification, rôle,
   activation, réinitialisation de mot de passe, suppression) est réservée à
   ADMIN. RESP garde la lecture (liste et détail).
2. Les champs qui désignent une personne restent déclaratifs et libres pour
   tous les rôles. Ce sont des données métier, pas une preuve d'identité.
3. L'auteur réel de chaque mutation est toujours tracé depuis le jeton
   (request.state.user_id) dans audit_log.changed_by. Toute route en écriture
   sur une entité métier doit être couverte, y compris le journal des statuts
   d'intervention, qui ne l'était pas.
4. CLAUDE.md section 6.2 est précisée en ce sens : l'auteur vient du jeton ; un
   champ « au nom de » est permis s'il est tracé.

## Alternatives écartées

- Laisser RESP gérer TECH et ACHETEUR : règle plus fine mais plus de cas à
  tester ; l'utilisateur préfère réserver la gestion à ADMIN.
- Forcer les champs depuis le jeton : casse l'usage terrain de la saisie pour
  un tiers et demande de retirer des sélecteurs du front web.
- Restreindre la déclaration selon le rôle : écarté par l'utilisateur au profit
  de la traçabilité.

## Conséquences

- Les écrans de gestion des utilisateurs du front web doivent masquer les
  actions d'écriture pour RESP (à faire côté tunnel-gmao).
- Une valeur déclarée peut être fausse ; la vérité est dans audit_log, qu'un
  écran d'historique doit rendre lisible.
