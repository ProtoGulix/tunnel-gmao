# 0017. Audit : motif validé avant la mutation, erreurs visibles

- Statut : accepté ; point 3 remplacé par l'ADR 0018
- Date : 2026-11-13
- Affine : CLAUDE.md section 2 point 4 (traçabilité fiable), ADR 0016

## Contexte

AuditMiddleware écrit l'audit après la route, une fois la mutation validée en base, sur
une autre connexion. Avant la route, il ne vérifie qu'une chose : le motif existe et
est actif. `fn_audit_log_decision` vérifie en plus que OTHER a un texte, qu'une mutation
manuelle a un auteur et qu'une mutation système porte un motif système ; mais son bloc
`EXCEPTION WHEN OTHERS` change toute erreur en avertissement, et `_write_audit_log`
avale encore l'exception. Aucun des deux ne vérifie que le motif s'applique à l'entité.

Conséquence constatée (CLO-03) : une mutation avec OTHER sans texte, ou avec un motif
d'une autre entité, est acceptée et ne laisse aucune trace d'audit. Une trace qui peut
manquer sans bruit ne vaut rien.

## Décision

1. Le middleware valide le motif avant la route, pour toute mutation qui en porte un,
   et répond 400 sans exécuter la mutation si : le motif est inconnu ou inactif (déjà
   fait), il ne s'applique pas à l'entité (`entity_types` ne la contient pas ; NULL
   reste « toutes entités », LEGACY_STATUS_CHANGE étant désactivé), c'est OTHER sans
   texte, ou c'est un motif de catégorie system pour une mutation d'utilisateur.
2. `fn_audit_log_decision` ne masque plus ses erreurs : le bloc `EXCEPTION WHEN OTHERS`
   est retiré par une migration. Une écriture d'audit qui échoue lève une erreur.
3. Les appelants gardent la mutation déjà validée mais journalisent l'échec en ERROR
   avec l'entité, l'identifiant et le motif (middleware), ou l'annulent dans leur
   transaction (écritures d'audit faites par un repo dans la même transaction).
4. Chaque règle a un test d'intégration qui échoue avant le correctif : mutation
   refusée, entité inchangée, aucune ligne d'audit orpheline.

## Alternatives écartées

- Écrire l'audit dans la même transaction que la mutation pour toutes les routes :
  seule garantie complète, mais demande de reprendre chaque repo ; trop large pour ce
  correctif. Le risque restant (échec d'écriture après validation, panne de base) est
  connu et journalisé.
- Retirer seulement le bloc d'exception en base : sans contrôle avant la route, la
  mutation passe quand même et l'erreur finit dans le `try/except` du middleware.
- Refuser `entity_types` NULL : changerait le sens des motifs génériques existants.

## Conséquences

- Des requêtes aujourd'hui acceptées sans trace deviennent des 400 : un client qui
  envoie un motif d'une autre entité ou OTHER sans texte doit être corrigé. Les fronts
  passent par la fenêtre de motif, qui respecte déjà ces règles.
- La migration change une fonction en base : elle passe par alembic, avec le rôle
  propriétaire, sur la base de dev puis la production.
