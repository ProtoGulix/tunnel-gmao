# Périmètre fonctionnel de Tunnel GMAO

## Fonctionnalités incluses

### Gestion des machines
- Enregistrer les machines présentes dans l'atelier
- Associer une localisation, un type, un état
- Lier des documents techniques (notices, plans, etc.)

### Demandes d'intervention
- Créer une demande depuis le terrain (web, mobile)
- Décrire le problème, indiquer l'urgence
- Assigner à une personne ou une équipe

### Interventions et actions
- Enregistrer les actions menées sur une machine
- Suivre le temps passé par type d'action (réglage, dépannage, préventif, etc.)
- Associer des pièces utilisées, des observations techniques

### Demandes d'achat et achats
- Demander un achat de pièce ou consommable
- Suivre le statut (demandé, commandé, reçu)
- Lier un achat à une intervention ou une machine

### Suivi des retards
- Voir les demandes d'intervention non traitées
- Identifier les achats en attente
- Relancer si nécessaire

### Analyse basique du temps
- Visualiser le temps passé par type d'action
- Comparer les machines ou les périodes
- Exporter les données pour analyse externe (CSV, etc.)

## Fonctionnalités refusées

### Pas de SaaS
Tunnel GMAO ne sera jamais proposé en mode service hébergé multi-tenant.

Chaque installation est indépendante, sur les infrastructures choisies par l'utilisateur.

### Pas d'ERP
Tunnel GMAO ne gère pas :
- La comptabilité
- La paie
- Les commandes clients
- Les stocks complets (uniquement pièces détachées liées aux interventions)
- La production (ordre de fabrication, gammes, etc.)

### Pas de KPI complexes
Tunnel GMAO ne calcule pas :
- MTBF (Mean Time Between Failures)
- MTTR (Mean Time To Repair)
- TRS (Taux de Rendement Synthétique)
- OEE (Overall Equipment Effectiveness)

Si ces indicateurs sont nécessaires, ils peuvent être calculés en dehors de Tunnel GMAO à partir des données exportées.

### Pas d'automatisations lourdes
Tunnel GMAO ne propose pas :
- Génération automatique de préventif basée sur des modèles prédictifs
- Intégration automatique avec l'ERP, le MES ou la supervision
- Workflows d'approbation complexes avec délégations en cascade

### Pas de reporting avancé
Tunnel GMAO ne remplace pas un outil de Business Intelligence.

Les rapports fournis sont simples : listes, totaux, moyennes, exports CSV.

Si des analyses plus poussées sont nécessaires, elles doivent se faire avec un outil externe alimenté par les exports de Tunnel GMAO.

### Pas de multi-tenant
Chaque installation de Tunnel GMAO sert une seule entreprise.

Il n'y a pas de gestion de clients, de comptes séparés, d'espaces isolés.

Si plusieurs entreprises veulent utiliser Tunnel GMAO, elles doivent chacune installer leur propre instance.

## Évolutions futures

Le périmètre ci-dessus est volontairement limité.

De nouvelles fonctionnalités pourront être ajoutées si elles respectent la philosophie du projet :
- Utilité directe pour le terrain
- Simplicité de mise en œuvre
- Pas de dépendance externe supplémentaire

Toute proposition d'évolution doit être justifiée par un besoin terrain concret, documenté, reproductible.

Les contributions sont bienvenues si elles s'inscrivent dans cette logique.
