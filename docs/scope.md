# Périmètre fonctionnel de Tunnel GMAO

> **Note** : Ce document détaille les fonctionnalités. Pour comprendre les concepts métier (demandes, interventions, actions), lire d'abord [REGLES_METIER.md](REGLES_METIER.md).

---

## Fonctionnalités incluses

### 1. Gestion des machines (Équipements)

- Enregistrer les machines présentes dans l'atelier (nom, type, numéro de série)
- Associer une localisation physique (atelier, zone, emplacement)
- Indiquer l'état opérationnel (en service, hors service, en maintenance)
- Lier des documents techniques (notices, plans PDF, photos)
- Historique des interventions sur chaque machine

### 2. Demandes d'intervention

- Créer une demande depuis le terrain (interface web responsive)
- Décrire le problème observé (texte libre + photos optionnelles)
- Indiquer le niveau d'urgence (bas, moyen, élevé, critique)
- Assigner à une personne ou une équipe de maintenance
- Suivre le statut (nouvelle, en cours, terminée, annulée)
- Notifications simples par email (optionnel)

### 3. Interventions et actions

> **Important** : Lire [REGLES_METIER.md](REGLES_METIER.md) pour comprendre la distinction fondamentale entre demandes, interventions, actions et sous-tâches.

- Enregistrer les **actions** menées sur une machine (rattachées à une intervention)
- Suivre le **temps passé** par type d'action (diagnostic, réglage, dépannage, préventif, nettoyage)
- Associer des **pièces utilisées** lors de l'intervention
- Ajouter des observations techniques (texte libre)
- Indiquer si l'intervention est clôturée ou nécessite un suivi
- **Sous-tâches** (optionnel) : organiser les projets longs sans valeur de traçabilité (temps/complexité uniquement dans les actions)

### 4. Demandes d'achat et stock

- Créer une demande d'achat de pièce détachée ou consommable
- Indiquer la référence, la quantité, le fournisseur suggéré
- Suivre le statut (demandé, validé, commandé, reçu, installé)
- Lier un achat à une intervention ou une machine
- Stock basique : voir les pièces disponibles, alertes si seuil minimum atteint

### 5. Suivi des retards et tableaux de bord

- Vue d'ensemble : demandes en attente, interventions en cours
- Identifier les demandes d'intervention non traitées depuis X jours
- Identifier les achats bloqués ou en attente de réception
- Relancer manuellement si nécessaire (pas d'automatisation)
- Filtres simples : par machine, par technicien, par période

### 6. Analyse basique du temps

- Visualiser le temps passé par type d'action (graphiques simples)
- Comparer les machines entre elles (temps d'intervention moyen)
- Comparer les périodes (ce mois vs mois dernier)
- Export des données brutes en CSV pour analyse externe (Excel, BI)
- Pas de calcul automatique de KPI complexes (MTBF, MTTR, TRS)

## Fonctionnalités refusées

### ❌ Pas de SaaS multi-tenant

Tunnel GMAO ne sera jamais proposé en mode service hébergé multi-tenant.

Chaque installation est indépendante, sur les infrastructures choisies par l'utilisateur.

**Raison** : garantir la propriété des données et l'indépendance de l'entreprise.

### ❌ Pas d'ERP

Tunnel GMAO ne gère pas :

- La comptabilité générale
- La paie et les RH
- Les commandes clients et la facturation
- Les stocks généraux (uniquement pièces détachées maintenance)
- La production (ordres de fabrication, gammes opératoires, MES)
- Les achats généraux (seulement achats liés à la maintenance)

**Raison** : rester focalisé sur la maintenance, pas remplacer un ERP complet.

### ❌ Pas de KPI complexes automatiques

Tunnel GMAO ne calcule pas automatiquement :

- MTBF (Mean Time Between Failures)
- MTTR (Mean Time To Repair)
- TRS (Taux de Rendement Synthétique)
- OEE (Overall Equipment Effectiveness)
- Taux de disponibilité prédictif
- Coûts de maintenance par machine (complexe à calculer correctement)

**Raison** : ces indicateurs nécessitent des hypothèses métier et des contextes spécifiques. Les données brutes peuvent être exportées pour calcul externe.

### ❌ Pas d'automatisations lourdes

Tunnel GMAO ne propose pas :

- Génération automatique de préventif basée sur machine learning
- Intégration temps réel avec l'ERP, le MES ou la supervision
- Workflows d'approbation complexes avec délégations en cascade
- Envoi automatique de bons de commande aux fournisseurs
- Génération automatique de rapports hebdomadaires (peut se faire manuellement)

**Raison** : éviter la complexité de configuration et les dépendances externes fragiles.

### ❌ Pas de reporting avancé

Tunnel GMAO ne remplace pas un outil de Business Intelligence.

Les rapports fournis sont simples : listes filtrées, totaux, moyennes, graphiques basiques.

Si des analyses plus poussées sont nécessaires (tableaux croisés dynamiques, prévisions, dataviz complexe), elles doivent se faire avec un outil externe (Excel, Power BI, Tableau, etc.) alimenté par les exports CSV de Tunnel GMAO.

**Raison** : ne pas réinventer les outils BI existants et rester simple.

### ❌ Pas de multi-tenant

Chaque installation de Tunnel GMAO sert **une seule entreprise**.

Il n'y a pas de gestion de clients, de comptes séparés, d'espaces isolés.

Si plusieurs entreprises (ou sites distincts) veulent utiliser Tunnel GMAO, elles doivent chacune installer leur propre instance.

**Raison** : simplicité de déploiement et de sécurité.

### ❌ Pas de gestion des utilisateurs externes

Tunnel GMAO ne permet pas :

- De donner des accès à des sous-traitants externes avec portail dédié
- De créer des profils clients pour suivi de SAV
- De gérer des accès temporaires avec droits limités par projet

**Raison** : complexité de gestion des permissions. Si nécessaire, créer des comptes utilisateurs normaux.

## Évolutions futures

Le périmètre ci-dessus est volontairement limité.

De nouvelles fonctionnalités pourront être ajoutées si elles respectent la philosophie du projet :

- Utilité directe pour le terrain
- Simplicité de mise en œuvre
- Pas de dépendance externe supplémentaire

Toute proposition d'évolution doit être justifiée par un besoin terrain concret, documenté, reproductible.

Les contributions sont bienvenues si elles s'inscrivent dans cette logique.
