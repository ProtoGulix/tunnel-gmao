# Tunnel GMAO

**Tunnel GMAO** est une GMAO (Gestion de Maintenance Assistée par Ordinateur) open-source, sobre et orientée terrain, destinée aux PME industrielles.

## 🎯 Objectifs

Tunnel GMAO vise à fournir un outil de gestion de maintenance simple, efficace et adapté aux besoins des petites et moyennes entreprises industrielles, sans les complexités inutiles des solutions ERP lourdes.

## 📋 Fonctionnalités

- **Gestion des machines** : Inventaire et suivi du parc machines
- **Demandes d'intervention** : Création et gestion des demandes de maintenance
- **Interventions** : Suivi des interventions de maintenance préventive et corrective
- **Achats et demandes d'achat** : Gestion simple des achats liés à la maintenance
- **Suivi des retards** : Vue simple des retards sur les interventions
- **Analyse du temps** : Analyse basique du temps passé par type d'action

## 🔑 Philosophie

- **Open-source** : Licence AGPLv3
- **Sobre** : Interface simple et efficace, sans fioritures
- **Orientée terrain** : Conçue pour les besoins réels des techniciens et responsables maintenance
- **Installation on-premise uniquement** : Pas de SaaS, pas d'ERP déguisé
- **Logiciel libre** : Utilisable tel quel, sans frais
- **Services optionnels** : Les prestations d'analyse, d'intégration et de support sont commerciales et optionnelles

## 🚀 Installation

### Prérequis

- Node.js 18 ou supérieur
- PostgreSQL 14 ou supérieur (ou SQLite pour développement)
- Docker (optionnel, recommandé pour production)

### Installation en développement

```bash
# Cloner le dépôt
git clone https://github.com/ProtoGulix/tunnel-gmao.git
cd tunnel-gmao

# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos paramètres

# Initialiser la base de données
npm run db:migrate

# Lancer l'application
npm run dev
```

### Installation avec Docker

```bash
# Cloner le dépôt
git clone https://github.com/ProtoGulix/tunnel-gmao.git
cd tunnel-gmao

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Lancer avec Docker Compose
docker-compose up -d
```

L'application sera accessible sur http://localhost:3000

## 📖 Documentation

- [Guide d'utilisation](docs/user-guide.md)
- [Installation détaillée](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Contribution](CONTRIBUTING.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus d'informations.

## 📄 Licence

Ce projet est sous licence [GNU Affero General Public License v3.0](LICENSE).

Cela signifie que vous êtes libre de :
- Utiliser le logiciel à des fins commerciales
- Modifier le logiciel
- Distribuer le logiciel
- Utiliser et modifier le code source privé

Sous les conditions suivantes :
- Divulgation du code source pour les versions modifiées distribuées
- Préservation de la licence et des notices de copyright
- Communication des modifications effectuées
- Mise à disposition du code source pour les utilisateurs du service réseau

## 💼 Services Commerciaux

Bien que le logiciel soit libre et gratuit, des services professionnels sont disponibles :

- **Analyse de besoins** : Audit et recommandations pour votre organisation
- **Intégration** : Mise en place et configuration adaptée à votre infrastructure
- **Formation** : Formation de vos équipes à l'utilisation et l'administration
- **Support** : Assistance technique et maintenance
- **Développement sur mesure** : Évolutions spécifiques à vos besoins

Pour plus d'informations sur ces services, contactez-nous.

## 🔒 Sécurité

Pour signaler une vulnérabilité de sécurité, veuillez nous contacter directement plutôt que d'ouvrir une issue publique.

## 📞 Contact

- GitHub Issues : https://github.com/ProtoGulix/tunnel-gmao/issues
- Email : contact@tunnel-gmao.fr (à configurer)

## 🌟 Statut du Projet

Ce projet est en cours de développement actif. Les contributions et les retours sont les bienvenus !

---

**Note** : Tunnel GMAO est un logiciel de gestion de maintenance, pas un ERP. Il se concentre sur les besoins spécifiques de la maintenance industrielle sans chercher à couvrir tous les aspects de la gestion d'entreprise.