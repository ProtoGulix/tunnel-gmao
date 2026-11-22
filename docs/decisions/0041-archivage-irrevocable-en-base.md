# 0041. L'archivage d'une intervention est irrévocable, garanti par la base

- Statut : accepté (2026-11-22)
- Date : 2026-11-22
- Affine : ADR 0040 (archivée = fiche imprimée), ADR 0028 (réouverture avec motif), ADR 0039 (règle portée par la base)

## Contexte

ADR 0040 : une intervention archivée est une intervention dont la fiche est marquée imprimée
(`intervention.printed_fiche`). Aucun écran ne retire ce marquage, mais le PUT d'une
intervention et toute écriture directe en base le peuvent. Une intervention archivée fermée
peut aussi être rouverte (ADR 0028) : elle redeviendrait ouverte tout en restant cachée des
listes, qui excluent les archivées.

## Décision

Décisions de l'utilisateur du 2026-11-22.

1. L'archivage est irrévocable : `printed_fiche` ne repasse jamais de vrai à faux.
2. Une intervention archivée et fermée ne peut pas être rouverte. Pour reprendre le travail, on
   crée une nouvelle intervention.
3. Les deux règles sont portées par la base : un déclencheur `BEFORE UPDATE` sur `intervention`
   refuse la modification (RAISE EXCEPTION). Elles valent pour toute écriture faite avec le rôle
   de l'application (API, scripts, requête manuelle) ; seul le rôle propriétaire, utilisé par les
   migrations, peut désactiver le déclencheur.
4. L'API renvoie ces refus en 400 avec un message lisible (liste blanche des messages de la base,
   `user_facing_db_message`). Les fronts n'offrent pas la réouverture d'une intervention archivée
   et disent que l'archivage est irrévocable ; la base reste seule juge.

## Alternatives écartées

- Contrôle dans l'API seulement (validator du PUT) : une écriture hors de l'API, un futur chemin
  de code ou un script pourrait défaire l'archive ; l'utilisateur veut le blocage en base.
- Réouverture autorisée avec une intervention rendue visible malgré l'archive : il faudrait
  changer le filtre des listes et le sens d'« archivée », pour un cas que la création d'une
  nouvelle intervention couvre.

## Conséquences

- Migration 0026 (déclencheur), jouée au démarrage de l'API, en dev avec l'accord de
  l'utilisateur puis en production à sa mise à jour.
- Les interventions déjà archivées en base sont immédiatement figées.
