# 0024. Contraintes de la production pour toute installation

- Statut : accepté (2026-11-19)
- Date : 2026-11-19
- Affine : ADR 0002 (installation automatique de la base), spike 0003 (bascule depuis la 3.57)

## Contexte

Le schéma de départ (backend/db/schema.sql, migration 0001) a été tiré d'une base de dev
qui avait perdu une grande partie de ses contraintes. Relevé du 2026-11-19 en lecture seule
sur la base de dev, remplacée le 2026-11-16 par un dump de production : 72 clés étrangères,
15 contraintes CHECK et 66 index de la production n'existent ni dans schema.sql ni dans les
migrations (inventaire : docs/taches/CONT-01-inventaire-production.txt, comparaison par
nom). Une installation neuve, et la base jetable des tests d'intégration, tournent donc
sans ces garde-fous : des données que la production refuserait passent, et les tests ne le
voient pas. Le principe a été validé par l'utilisateur le 2026-11-15 (chantier B, après la
bascule) et la migration accordée le 2026-11-19.

## Décision

1. Une migration (0018) ajoute à toute base les contraintes et index de l'inventaire qui
   lui manquent, avec le nom et la définition de la production. Chaque ajout est
   conditionnel : rien n'est fait si un objet de même nom existe déjà. Sur la production
   et sur une base issue de la production, la migration ne change donc rien.
2. Un objet dont une définition équivalente existe déjà sous un autre nom dans une
   installation neuve n'est pas ajouté en double : la comparaison se fait par définition,
   sur une base neuve construite par les tests, avant d'écrire la migration.
3. Les contraintes sont posées validées (pas de NOT VALID) : une base neuve n'a pas de
   données. Une base de contributeur dont les données violeraient une contrainte fait
   échouer la migration avec le nom de la contrainte ; c'est voulu (donnée à corriger, pas
   à masquer).
4. Les tests d'intégration tournent dès lors sur le même jeu de contraintes que la
   production.

## Alternatives écartées

- Régénérer schema.sql depuis la production : la migration 0001 changerait après coup pour
  les bases déjà installées, et le dump porterait aussi des objets morts de la 3.57 (tables
  héritées, droits) ; une migration ajoutée est vérifiable et réversible.
- Poser les contraintes en NOT VALID puis valider plus tard : utile sur une grosse base
  peuplée, sans objet ici (base neuve vide, production déjà conforme), et cela laisserait
  des données non conformes passer inaperçues.
- Ne rien faire et compter sur la production : les installations neuves (public de
  Tunnel) et les tests resteraient sans garde-fou, contre la priorité 1 de CLAUDE.md.

## Conséquences

- Les tests d'intégration peuvent révéler des fixtures qui violaient ces contraintes ; elles
  se corrigent (jamais en affaiblissant une assertion).
- Le downgrade retire seulement les objets que la migration a créés : il ne peut pas savoir
  lesquels existaient avant ; il retire donc ceux de l'inventaire, ce qui sur une base issue
  de la production retirerait des contraintes d'origine. Le downgrade est réservé aux bases
  neuves et le dit.
- Toute nouvelle contrainte s'ajoute désormais par migration, jamais seulement en base.
