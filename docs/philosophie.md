# Philosophie de Tunnel GMAO

> **Vision** : Un outil qui enregistre la réalité terrain sans imposer de méthode.  
> Pour comprendre les concepts métier structurants, voir [REGLES_METIER.md](REGLES_METIER.md).

---

## Terrain first

Tunnel GMAO est conçu pour les personnes qui maintiennent les machines au quotidien, pas pour les tableaux de bord de direction.

L'outil sert à enregistrer ce qui se passe, suivre les demandes, planifier les interventions, commander ce qui manque. Point.

Les décisions importantes (prioriser, arbitrer, analyser) restent entre les mains des utilisateurs. Le logiciel ne prétend pas les remplacer par des algorithmes ou des KPI sophistiqués.

**Concrètement, cela signifie :**

- Interface simple et directe, pas de menu à rallonge
- Temps de chargement rapides, même sur vieux matériel
- Fonctionnement sur tablette et mobile (responsive)
- Pas de connexion internet nécessaire en production
- Formulaires courts avec seulement les infos essentielles

## Refus de la complexité inutile

Une GMAO ne doit pas devenir un projet informatique à plein temps.

Tunnel GMAO refuse délibérément :

- Les fonctionnalités qui nécessitent un paramétrage complexe
- Les workflows rigides qui enferment plus qu'ils n'aident
- Les analyses automatiques qui donnent l'illusion de comprendre sans réellement aider
- Les intégrations multiples qui fragilisent l'ensemble

Chaque fonctionnalité incluse doit avoir une utilité directe et immédiate pour le travail quotidien.

## L'outil au service de la méthode

Tunnel GMAO n'impose pas de méthode de maintenance.

Il s'adapte à la façon dont l'entreprise travaille déjà, sans forcer un changement organisationnel majeur.

Si une méthode de maintenance structurée n'existe pas encore, Tunnel GMAO fournit une base simple pour commencer, mais ne remplace pas l'accompagnement humain.

L'outil enregistre. La méthode guide. L'humain décide.

## Propriété des données

Les données appartiennent à l'entreprise qui les génère.

Aucune collecte externe, aucune dépendance à un fournisseur SaaS, aucune contrainte de connexion permanente.

L'installation se fait sur les serveurs de l'entreprise ou chez un prestataire de confiance, selon son choix.

## Sobriété logicielle

Tunnel GMAO vise la stabilité et la durabilité, pas l'innovation permanente.

Le code reste simple, la stack technique limitée, les dépendances réduites au minimum.

Cela facilite la maintenance long terme, réduit les risques de sécurité, et permet à l'entreprise de garder le contrôle du logiciel.

**Choix techniques guidés par la sobriété :**

- Stack JavaScript/Node.js unifiée (moins de langages à maîtriser)
- React stable (pas de framework expérimental)
- PostgreSQL (base de données éprouvée depuis 30 ans)
- Docker pour simplifier le déploiement (pas de dépendances système complexes)
- Pas de microservices (monolithe modulaire plus simple à maintenir)
- Architecture simple : API REST + application web responsive

Ces choix privilégient la **maintenabilité** sur la **mode technologique**.

## Modèle économique honnête

Tunnel GMAO est open-source sous licence AGPL-3.0-only.

Le logiciel est gratuit. Le code est ouvert. L'utilisation est libre.

La valeur commerciale porte sur l'accompagnement humain : analyser les besoins, installer correctement, former les équipes, adapter l'organisation.

Le logiciel seul ne crée pas de valeur. C'est son usage, encadré par une méthode claire, qui améliore la maintenance.
