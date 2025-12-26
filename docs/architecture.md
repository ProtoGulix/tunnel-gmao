# Architecture - Tunnel GMAO

Documentation technique de l'architecture de Tunnel GMAO.

## Vue d'ensemble

Tunnel GMAO est une application web monolithique construite avec une architecture simple et maintenable :

- **Backend** : Node.js avec Express
- **Frontend** : HTML, CSS, JavaScript vanilla
- **Base de données** : SQLite (développement) ou PostgreSQL (production)
- **Déploiement** : Docker ou installation directe

## Philosophie de conception

### Simplicité avant tout

- Pas de framework frontend lourd
- Pas d'ORM complexe
- Pas de micro-services
- Code lisible et maintenable

### On-premise uniquement

- Aucune dépendance cloud
- Toutes les données restent locales
- Configuration simple
- Installation autonome

### Orienté terrain

- Interface sobre et efficace
- Temps de chargement rapides
- Fonctionne sur matériel modeste
- Navigation intuitive

## Architecture Backend

### Structure des fichiers

```
src/
├── server.js           # Point d'entrée de l'application
├── db/
│   ├── connection.js   # Gestion de la connexion DB
│   └── migrate.js      # Migrations de base de données
└── routes/
    ├── machines.js     # Routes API machines
    ├── requests.js     # Routes API demandes
    ├── interventions.js # Routes API interventions
    └── purchases.js    # Routes API achats
```

### Serveur Express

Le serveur Express (`src/server.js`) :
- Configure les middlewares (CORS, body-parser)
- Enregistre les routes API
- Sert les fichiers statiques
- Gère les erreurs

```javascript
// Structure simplifiée
const express = require('express');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes API
app.use('/api/machines', machinesRouter);
app.use('/api/interventions', interventionsRouter);
// etc.

// Serveur frontend
app.get('*', (req, res) => {
  res.sendFile('public/index.html');
});
```

### Base de données

#### Schema

**machines** : Parc machines
- id, name, reference, location, status
- installation_date, notes
- created_at, updated_at

**requests** : Demandes d'intervention
- id, machine_id, title, description
- priority, status, requested_by
- created_at, updated_at

**interventions** : Interventions de maintenance
- id, request_id, machine_id
- title, description, intervention_type
- status, assigned_to, scheduled_date
- start_time, end_time, duration_minutes
- notes, created_at, updated_at

**purchases** : Achats et demandes d'achat
- id, intervention_id, machine_id
- item_name, description, quantity
- unit_price, total_price, supplier
- status, ordered_date, received_date
- notes, created_at, updated_at

**action_types** : Types d'actions (pour analyse)
- id, name, description, color

#### Connexion

Le module `db/connection.js` gère :
- Initialisation de la connexion
- Pool de connexions
- Requêtes paramétrées (protection SQL injection)
- Fermeture propre

#### Migrations

Le script `db/migrate.js` :
- Crée les tables si elles n'existent pas
- Initialise les données de référence
- Gère la structure de la base

## Architecture Frontend

### Structure des fichiers

```
public/
├── index.html    # Structure HTML
├── styles.css    # Styles CSS
└── app.js        # Logique JavaScript
```

### Single Page Application (SPA)

L'interface est une SPA simple :
- Un seul fichier HTML
- Navigation par onglets
- Chargement dynamique des données
- Aucune dépendance framework

### Organisation du code JavaScript

```javascript
// Structure app.js
- Configuration et initialisation
- Gestion des onglets
- Fonctions du tableau de bord
- Fonctions machines
- Fonctions demandes
- Fonctions interventions
- Fonctions achats
- Utilitaires (modal, formatage dates)
```

### Communication API

Toutes les communications utilisent l'API REST :

```javascript
// Exemple : Charger les machines
async function loadMachines() {
  const machines = await fetch('/api/machines')
    .then(r => r.json());
  // Afficher les machines
}
```

## API REST

### Endpoints

#### Machines
- `GET /api/machines` - Liste toutes les machines
- `GET /api/machines/:id` - Détails d'une machine
- `POST /api/machines` - Créer une machine
- `PUT /api/machines/:id` - Modifier une machine
- `DELETE /api/machines/:id` - Supprimer une machine

#### Demandes
- `GET /api/requests` - Liste toutes les demandes
- `GET /api/requests/:id` - Détails d'une demande
- `POST /api/requests` - Créer une demande
- `PUT /api/requests/:id` - Modifier une demande
- `DELETE /api/requests/:id` - Supprimer une demande

#### Interventions
- `GET /api/interventions` - Liste toutes les interventions
- `GET /api/interventions/:id` - Détails d'une intervention
- `GET /api/interventions/delayed` - Interventions en retard
- `GET /api/interventions/stats/by-type` - Statistiques par type
- `POST /api/interventions` - Créer une intervention
- `PUT /api/interventions/:id` - Modifier une intervention
- `DELETE /api/interventions/:id` - Supprimer une intervention

#### Achats
- `GET /api/purchases` - Liste tous les achats
- `GET /api/purchases/:id` - Détails d'un achat
- `POST /api/purchases` - Créer un achat
- `PUT /api/purchases/:id` - Modifier un achat
- `DELETE /api/purchases/:id` - Supprimer un achat

### Format des réponses

Toutes les réponses sont en JSON :

```json
// Succès
{
  "data": [...],
  "message": "Success"
}

// Erreur
{
  "error": "Error message",
  "details": "..."
}
```

## Sécurité

### Protection SQL Injection

Toutes les requêtes utilisent des paramètres bindés :

```javascript
// ✅ Bon
await query('SELECT * FROM machines WHERE id = ?', [id]);

// ❌ Mauvais
await query(`SELECT * FROM machines WHERE id = ${id}`);
```

### CORS

Le serveur accepte les requêtes cross-origin pour faciliter le développement, mais devrait être restreint en production.

### Variables d'environnement

Les informations sensibles sont stockées dans `.env` :
- Secrets de session
- Identifiants de base de données
- Clés API tierces

## Déploiement

### Docker

Le Dockerfile :
- Utilise Node.js 18 Alpine (image légère)
- Installe uniquement les dépendances de production
- Expose le port 3000
- Inclut un healthcheck

### Systemd

Le service systemd :
- Lance l'application au démarrage
- Redémarre en cas d'erreur
- Logs via journalctl

### Reverse Proxy

Nginx sert de reverse proxy :
- Gère les certificats SSL
- Gère le cache statique
- Protège le serveur Node.js

## Performance

### Optimisations

1. **Base de données**
   - Index sur les colonnes fréquemment requêtées
   - Requêtes optimisées avec JOIN
   - Limitation du nombre de résultats

2. **Frontend**
   - CSS minimal, pas de framework lourd
   - JavaScript vanilla, pas de build
   - Chargement à la demande

3. **Serveur**
   - Fichiers statiques servis par nginx
   - Gzip activé
   - Cache HTTP approprié

## Évolutivité

### Limitations actuelles

- SQLite : adapté jusqu'à ~100 000 enregistrements
- Single-thread : adapté jusqu'à ~100 utilisateurs simultanés
- Pas de clustering

### Migration vers PostgreSQL

Pour des volumes plus importants :

1. Modifier `.env` :
```
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tunnel_gmao
DB_USER=tunnel
DB_PASSWORD=...
```

2. Adapter `src/db/connection.js` pour PostgreSQL

3. Migrer les données

## Maintenance

### Logs

Logs disponibles via :
- `journalctl -u tunnel-gmao` (systemd)
- `docker logs tunnel-gmao` (Docker)

### Sauvegarde

SQLite :
```bash
sqlite3 data/tunnel-gmao.db ".backup backup.db"
```

PostgreSQL :
```bash
pg_dump tunnel_gmao > backup.sql
```

### Mise à jour

```bash
git pull
npm ci --only=production
npm run db:migrate
systemctl restart tunnel-gmao
```

## Extensions futures possibles

- Authentification et gestion des utilisateurs
- Notifications par email
- Export PDF des rapports
- API pour intégration avec d'autres systèmes
- Application mobile
- Gestion des pièces détachées (stock)
- Planning visuel (type Gantt)

**Note** : Toute extension doit rester fidèle à la philosophie du projet : simplicité, sobriété, orientation terrain.
