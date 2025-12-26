# Tunnel GMAO

Tunnel GMAO est un logiciel open-source de gestion de maintenance assistée par ordinateur (GMAO), sobre et orienté terrain, destiné aux PME industrielles.

## Qu'est-ce que Tunnel GMAO ?

Tunnel GMAO aide les équipes de maintenance à structurer leur travail quotidien : enregistrer les machines, gérer les demandes d'intervention, suivre les actions réalisées, commander les pièces nécessaires.

L'objectif est de fournir un outil simple et robuste qui fait ce qu'il doit faire, sans complexité inutile.

Tunnel GMAO n'est pas un ERP, pas un outil d'analyse avancée, pas une solution miracle. C'est un support pour organiser la maintenance de façon pragmatique.

## Pour qui ?

Tunnel GMAO s'adresse aux **PME industrielles** qui ont besoin de structurer leur maintenance sans investir dans un logiciel lourd et coûteux.

Profils typiques :
- Ateliers de production avec 10 à 100 machines
- Équipes de maintenance de 1 à 10 personnes
- Entreprises qui veulent passer d'un système papier/Excel à un outil numérique simple
- Structures qui privilégient la maîtrise de leurs données et de leurs outils

Tunnel GMAO convient aussi aux prestataires et consultants en maintenance qui souhaitent déployer une solution open-source chez leurs clients.

## Périmètre fonctionnel

### Inclus dans Tunnel GMAO

- **Gestion des machines** : enregistrer les équipements, leur localisation, leur documentation technique
- **Demandes d'intervention** : créer et suivre les demandes depuis le terrain
- **Interventions et actions** : enregistrer les actions réalisées, le temps passé par type d'action
- **Demandes d'achat et achats** : suivre les besoins en pièces détachées et consommables
- **Suivi simple des retards** : identifier les demandes non traitées, les achats en attente
- **Analyse basique du temps** : visualiser le temps passé par type d'action, comparer les machines

### Exclu explicitement

- **Pas de KPI complexes** : pas de calcul automatique de MTBF, MTTR, TRS, OEE
- **Pas d'ERP** : pas de gestion de comptabilité, paie, commandes clients, production
- **Pas de SaaS** : pas de service hébergé multi-tenant
- **Pas d'automatisations lourdes** : pas de génération automatique de préventif prédictif, pas d'intégrations complexes avec d'autres systèmes
- **Pas de reporting avancé** : les rapports sont simples (listes, totaux, exports CSV)

Pour plus de détails, consultez [docs/scope.md](docs/scope.md).

## Modèle d'installation

Tunnel GMAO s'installe **uniquement en local** (on-premise), sur les infrastructures choisies par l'entreprise.

Aucune version SaaS ne sera proposée. Chaque installation est indépendante et dédiée à une seule entreprise.

Stack technique :
- Base de données PostgreSQL
- Déploiement via Docker / Docker Compose
- Interface web accessible depuis navigateur ou mobile

L'entreprise reste maîtresse de ses données et de son installation.

Pour plus de détails, consultez [docs/installation.md](docs/installation.md).

## Licence open-source

Tunnel GMAO est distribué sous licence **AGPL-3.0-only**.

Le code source est ouvert et libre d'utilisation. Toute modification doit être redistribuée sous la même licence.

Les données appartiennent à l'entreprise qui les génère. Le logiciel ne collecte rien, ne transmet rien à l'extérieur.

Voir le fichier [LICENSE](LICENSE) pour le texte complet de la licence.

## Usage commercial et prestations

**Tunnel GMAO est un logiciel open-source.**

Le logiciel fonctionne sans contrat commercial. Vous pouvez l'installer, l'utiliser, le modifier librement, tant que vous respectez les termes de la licence AGPL-3.0.

**La valeur commerciale porte sur l'analyse, l'intégration et le support, pas sur la licence logicielle.**

Les prestations suivantes sont séparées et optionnelles :
- Analyse des besoins et accompagnement organisationnel
- Installation et configuration assistée
- Formation des équipes
- Support technique et maintenance
- Adaptation et développements spécifiques

Ces prestations peuvent être assurées par des prestataires indépendants ou par l'entreprise elle-même.

## Documentation

- [Philosophy](docs/philosophy.md) : la logique "terrain first", le refus de la complexité inutile
- [Scope](docs/scope.md) : liste précise des fonctionnalités incluses et refusées
- [Installation](docs/installation.md) : principe d'installation locale, stack technique

## État du projet

Actuellement, seule la structure de base et la documentation fondatrice sont en place.

Le code applicatif sera développé progressivement, en respectant les principes énoncés dans la documentation.

Les contributions sont bienvenues, à condition de respecter la philosophie du projet (voir [docs/philosophy.md](docs/philosophy.md)).

## Contact et contributions

Le projet est hébergé sur GitHub : [ProtoGulix/tunnel-gmao](https://github.com/ProtoGulix/tunnel-gmao)

Pour toute question, suggestion ou contribution, ouvrez une issue sur le dépôt GitHub.