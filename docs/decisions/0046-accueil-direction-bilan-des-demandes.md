# 0046. Accueil direction : bilan des demandes avant la liste

- Statut : remplacé par 0047 (2026-11-28)
- Date : 2026-11-27
- Affine : ADR 0044 (vue direction), chantier ACD (file « à traiter » en liste et détail)

## Contexte

L'accueil « Direction technique » est devenu une file en liste et détail (ACD-01 à ACD-05).
Sur les données réelles (58 demandes à qualifier, la plus ancienne à 259 jours), c'est une
longue liste du backlog : on ne voit ni si le stock monte, ni où il s'entasse, ni depuis
quand. L'utilisateur veut un bilan pour décider (demande du 2026-11-27, maquette choisie).

## Décision

1. En tête de l'accueil, trois blocs sur les demandes à qualifier : le flux (entrées et
   sorties par semaine, stock en fin de semaine, tendance), l'âge du stock par tranches,
   où il s'entasse (par site, puis par équipement).
2. Sous le bilan, une tuile chiffrée par sujet déjà livré : urgentes, en attente, sans
   action, préventif.
3. La liste n'apparaît qu'après un clic sur un bloc, une tranche, un site ou une tuile :
   liste filtrée à gauche, détail à droite (composants du chantier ACD).
4. Chiffres donnés par une lecture `GET /stats/demandes` : seuils de tranches et séries
   calculés par l'API (comme ADR 0032 à 0035), filtre de site, ouverte à tous les
   connectés par la règle de lecture par défaut (ADR 0007), sans migration.
5. Une demande sort du stock à sa première transition vers acceptée ou rejetée (journal
   des statuts de demande) ; supprimée, elle n'est plus comptée.

## Alternatives écartées

- Liste seule regroupée par section (ACD-05) : livrée, illisible au volume réel.
- Tuiles chiffrées seules : plus simple, mais ne dit pas si le stock monte ni où il
  s'entasse (maquette écartée par l'utilisateur).
- Calcul dans le front à partir des listes : pas de flux historique fiable sans le journal
  des statuts, et des règles métier dans le front (CLAUDE.md section 4).

## Conséquences

- Une route de lecture de plus dans le catalogue (droits par défaut au démarrage de l'API).
- Le flux dépend de la complétude de `request_status_log` ; un écart avec l'état courant
  est signalé dans les tests.
