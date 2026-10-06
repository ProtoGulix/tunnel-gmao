# 0003. Outillage qualité du backend : ruff, pytest, commande de vérification unique

- Statut : accepté (accord de l'utilisateur le 2026-10-06)
- Date : 2026-10-06

## Contexte

Le backend n'a aucun test, aucun linter ni formateur configuré. Les correctifs de
sécurité de l'étape 2 doivent être prouvés par des tests qui échouent avant et
passent après. Pantin bloque chaque commit sur une commande unique de vérification.

## Décision proposée

1. Dépendances de développement séparées (requirements-dev.txt) : ruff (format et
   lint), pytest, httpx est déjà présent pour le client de test FastAPI.
2. Une commande unique, scripts/check.sh : ruff format --check, ruff check, pytest.
   Elle tourne dans le hook pre-commit et en CI.
3. Les tests ne touchent jamais la base de dev : base PostgreSQL jetable créée par
   la fixture de session, ou dépendances injectées.
4. Un hook Claude PostToolUse formate le fichier Python édité avec ruff.
5. Typage strict (mypy ou pyright) reporté : trop de bruit sur le code existant.

## Alternatives écartées

- black + flake8 + isort : trois outils là où ruff en remplace trois.
- Pas d'outillage : impossible de prouver les correctifs ni de tenir le zéro entropie.

## Conséquences

- Le premier passage de ruff format touchera de nombreux fichiers : à faire dans un
  commit dédié, sans autre changement.
- Versions à vérifier dans la documentation avant de les figer (NON VÉRIFIÉ).
