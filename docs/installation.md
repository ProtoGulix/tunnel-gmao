# Guide d'Installation - Tunnel GMAO

Ce guide détaille les différentes méthodes d'installation de Tunnel GMAO.

## Prérequis

### Installation de base
- Node.js 18 ou supérieur
- npm ou yarn
- SQLite3 (inclus avec Node.js)

### Installation avec PostgreSQL (Production recommandée)
- PostgreSQL 14 ou supérieur

### Installation avec Docker
- Docker 20.10 ou supérieur
- Docker Compose 2.0 ou supérieur

## Installation en développement

### 1. Cloner le dépôt

```bash
git clone https://github.com/ProtoGulix/tunnel-gmao.git
cd tunnel-gmao
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez le fichier `.env` selon vos besoins. Configuration par défaut :
- Port : 3000
- Base de données : SQLite (fichier `data/tunnel-gmao.db`)

### 4. Initialiser la base de données

```bash
npm run db:migrate
```

### 5. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Installation avec Docker

### Méthode 1 : Docker Compose (Recommandée)

```bash
# Cloner le dépôt
git clone https://github.com/ProtoGulix/tunnel-gmao.git
cd tunnel-gmao

# Configurer l'environnement
cp .env.example .env
nano .env  # Éditer selon vos besoins

# Lancer les conteneurs
docker-compose up -d
```

### Méthode 2 : Docker seul

```bash
# Construire l'image
docker build -t tunnel-gmao .

# Lancer le conteneur
docker run -d \
  --name tunnel-gmao \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env:/app/.env \
  tunnel-gmao
```

## Installation en production

### 1. Préparer le serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### 2. Installer l'application

```bash
# Créer un utilisateur dédié
sudo useradd -r -s /bin/bash -d /opt/tunnel-gmao tunnel-gmao

# Cloner l'application
sudo git clone https://github.com/ProtoGulix/tunnel-gmao.git /opt/tunnel-gmao
cd /opt/tunnel-gmao

# Installer les dépendances
sudo npm ci --only=production

# Configurer l'environnement
sudo cp .env.example .env
sudo nano .env  # Configurer pour la production
```

### 3. Configurer la base de données

```bash
# Créer le répertoire de données
sudo mkdir -p /opt/tunnel-gmao/data

# Initialiser la base de données
sudo -u tunnel-gmao npm run db:migrate

# Définir les permissions
sudo chown -R tunnel-gmao:tunnel-gmao /opt/tunnel-gmao
```

### 4. Configurer le service systemd

Créez le fichier `/etc/systemd/system/tunnel-gmao.service` :

```ini
[Unit]
Description=Tunnel GMAO - Maintenance Management System
After=network.target

[Service]
Type=simple
User=tunnel-gmao
WorkingDirectory=/opt/tunnel-gmao
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activez et démarrez le service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable tunnel-gmao
sudo systemctl start tunnel-gmao
sudo systemctl status tunnel-gmao
```

### 5. Configurer un reverse proxy (nginx)

Installez nginx :

```bash
sudo apt install -y nginx
```

Créez le fichier `/etc/nginx/sites-available/tunnel-gmao` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site :

```bash
sudo ln -s /etc/nginx/sites-available/tunnel-gmao /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Configurer SSL avec Let's Encrypt (Optionnel mais recommandé)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## Sauvegarde

### Sauvegarder la base de données SQLite

```bash
# Créer une sauvegarde
sqlite3 data/tunnel-gmao.db ".backup backup-$(date +%Y%m%d).db"

# Restaurer depuis une sauvegarde
sqlite3 data/tunnel-gmao.db ".restore backup-20240101.db"
```

### Script de sauvegarde automatique

Créez le fichier `/opt/tunnel-gmao/backup.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/opt/tunnel-gmao/backups"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
sqlite3 /opt/tunnel-gmao/data/tunnel-gmao.db ".backup $BACKUP_DIR/tunnel-gmao-$DATE.db"

# Garder seulement les 30 dernières sauvegardes
ls -t $BACKUP_DIR/tunnel-gmao-*.db | tail -n +31 | xargs -r rm
```

Ajoutez au crontab :

```bash
sudo crontab -e
# Ajouter : 0 2 * * * /opt/tunnel-gmao/backup.sh
```

## Mise à jour

```bash
cd /opt/tunnel-gmao
sudo systemctl stop tunnel-gmao
sudo git pull origin main
sudo npm ci --only=production
sudo npm run db:migrate
sudo systemctl start tunnel-gmao
```

## Dépannage

### L'application ne démarre pas

Vérifiez les logs :
```bash
sudo journalctl -u tunnel-gmao -f
```

### Problèmes de permissions

```bash
sudo chown -R tunnel-gmao:tunnel-gmao /opt/tunnel-gmao
```

### Port déjà utilisé

Changez le port dans le fichier `.env` ou arrêtez l'application qui utilise le port 3000.

## Support

Pour toute question ou problème, consultez :
- [Documentation](https://github.com/ProtoGulix/tunnel-gmao/tree/main/docs)
- [Issues](https://github.com/ProtoGulix/tunnel-gmao/issues)
