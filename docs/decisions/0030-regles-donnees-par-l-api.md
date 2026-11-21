# 0030. Les fronts lisent les règles dans l'API

- Statut : accepté (2026-11-20, décisions de l'utilisateur)
- Date : 2026-11-20
- Prolonge : ADR 0029 point 2 (transitions de demande données par l'API), CLAUDE.md 4

## Contexte

Inventaire du 2026-11-20 (docs/backlog/regles-metier-recopiees-dans-les-fronts.md) : le
backend vérifie toutes les règles, mais les fronts en recopient plusieurs pour décider de
l'affichage, et certaines copies dérivent :

1. Le web traite un statut « cancelled » comme une intervention fermée (6 endroits) : ce
   statut n'existe pas pour les interventions.
2. La suppression d'une action est masquée selon une copie de
   `NON_DISPATCHED_PR_STATUSES`.
3. Ignorer une étape obligatoire et clore une tâche sans action sont réservés à RESP et
   ADMIN : le web recopie la liste des rôles (`ELEVATED_ROLES`, `canSkipTask`).
4. Le web n'autorise la suppression d'une tâche que si elle est « à faire » et sans
   action ; le backend vérifie seulement l'absence d'action.

La limite de 5 caractères des initiales est posée par la base (`tunnel_user.initial`
varchar(5)) : rien à faire.

## Décision

1. **L'API donne des indicateurs**, calculés par une seule fonction du backend, la même
   qui sert à refuser :
   - intervention : `is_locked` (fermée) ;
   - action : `can_delete` (aucune demande d'achat déjà répartie, intervention non
     verrouillée) ;
   - tâche : `can_delete` (règle du point 2).
2. **Suppression d'une tâche** (décision de l'utilisateur) : seulement « à faire » et sans
   action, intervention non verrouillée. Le backend refuse les autres cas (400).
3. **Droits de l'utilisateur sur les tâches** : `GET /auth/me` renvoie les capacités
   `skip_obligatory_step` et `close_task_without_action`, calculées depuis les listes du
   validator des tâches. Les fronts ne recopient plus de liste de rôles pour ces règles.
4. Les fronts suppriment leurs copies (dont « cancelled ») et lisent ces champs ; un champ
   absent (ancienne API) donne l'action masquée, jamais permise.
5. Hors périmètre : l'accès aux pages par rôle (`RequireRole` de /admin), qui relève du
   chantier des droits (CLAUDE.md section 4) ; les listes de statuts terminaux qui ne
   servent qu'à filtrer ou à trier.

## Alternatives écartées

- Capacités par tâche (`can_skip`, `can_close` sur chaque tâche) : la règle dépend du seul
  rôle, une capacité de l'utilisateur suffit et évite de grossir chaque liste.
- Ménage seul (retirer « cancelled » et le code mort) : les autres copies continueraient
  de dériver.
- Garder la suppression d'une tâche sans action quel que soit son statut : écart avec le
  web, et une tâche faite garde sa valeur de trace.

## Conséquences

- Changement d'API (champs ajoutés, refus de suppression d'une tâche non « à faire »)
  accepté par l'utilisateur le 2026-11-20. Pas de migration.
