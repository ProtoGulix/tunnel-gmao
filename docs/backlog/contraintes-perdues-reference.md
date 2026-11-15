# Contraintes d'intégrité perdues par le schéma de référence

Constat du spike 0003 (2026-11-15) : `backend/db/schema.sql`, tiré de la base de dev,
n'a que 19 clés étrangères, 3 contraintes CHECK et 20 index, contre 92, 18 et 82 dans
la production 3.57.0. Toute installation neuve, et la base de dev, tournent donc
presque sans clés étrangères (priorité 1 de CLAUDE.md).

Piste, validée dans son principe par l'utilisateur le 2026-11-15 (chantier B, après
la bascule) : ADR, puis migration 0013 qui ajoute les contraintes et index manquants
en ignorant ceux qui existent déjà sous le même nom, après recherche des données
orphelines dans la base de dev. Traiter aussi les doublons créés par 0003 sur
`machine` dans une base issue de la production.
