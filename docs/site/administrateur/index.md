# Administrateur

L'administrateur gère les comptes, les droits et les listes de choix de Tunnel. Tout se
fait dans l'écran **Administration** du front web, qui regroupe cinq onglets :

| Onglet | Ce que vous y faites | Page |
| --- | --- | --- |
| Utilisateurs | Créer un compte, changer un rôle, désactiver, réinitialiser un mot de passe | [Utilisateurs](./utilisateurs) |
| Rôles & Permissions | Régler les droits de chaque rôle, choisir la vue d'accueil | [Rôles et permissions](./roles-permissions) |
| Référentiel | Types d'intervention, catégories d'action, statuts, classes d'équipement | [Référentiels](./referentiels) |
| Sécurité | Journal de sécurité, IP bloquées, domaines de courriel, clés d'API | [Sécurité](./securite) |
| Audit | Journal des décisions, règles d'audit, raisons d'audit | [Audit](./audit) |

Les onglets **Rôles & Permissions** et **Sécurité** n'apparaissent que si le compte a le
droit correspondant. Par défaut, seul l'administrateur les voit.

## Les rôles de Tunnel

| Rôle | Pour qui |
| --- | --- |
| ADMIN | L'administrateur : tous les droits. |
| RESP | Le responsable maintenance. |
| TECH | Le technicien. |
| ACHETEUR | L'acheteur. |
| MCP | Une clé d'API pour une application externe. Ce n'est pas une personne. |

Les droits exacts de chaque rôle sont dans [Rôles et permissions](./roles-permissions).

## Avant de commencer

- Les comptes sont créés et modifiés par un administrateur uniquement. Il n'y a pas
  d'inscription libre.
- Le premier administrateur est créé à l'installation : voir [Installation](../installation/).
- Plusieurs actions de cet écran demandent un motif, choisi dans une liste. Voir
  [Audit](./audit).
