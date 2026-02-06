# Règles Métier de Tunnel GMAO

> **Ce document explique comment fonctionne Tunnel GMAO** : les concepts de base,
> les règles de gestion et les flux de travail. Il est rédigé pour être compris
> par tous, techniques et non-techniques.

---

## 🔧 La Maintenance : Interventions et Actions

### Qu'est-ce qu'une Intervention ?

Une **intervention** est le cœur de la maintenance dans Tunnel GMAO.

**En termes simples** : C'est le dossier qui regroupe tout le travail de maintenance fait sur une machine.

#### Ce qu'il faut savoir

- **Chaque intervention concerne une seule machine** (on ne peut pas créer une intervention sans dire sur quelle machine on travaille)
- **Chaque intervention a un code unique** qui se génère automatiquement
  - Format : `NOM-MACHINE-TYPE-DATE-INITIALES`
  - Exemple : `CONV01-CUR-20241228-JD` signifie : intervention curative sur CONV01 le 28/12/2024 par JD
  - Le format est immuable et ne peut pas être modifié
- **Types d'interventions courants** :
  - `CUR` : Maintenance curative (réparation en cas de panne ou besoin identifié)
- **Une intervention suit un parcours** avec différentes étapes :
  - `Ouvert` : L'intervention est créée mais pas commencée
  - `En cours` : Le travail est en cours
  - `Fermé` : Le travail est terminé
  - ⚠️ Note : Le statut "Annulé" est prévu mais pas encore implémenté dans le système

#### Règles importantes

- On ne peut pas modifier manuellement le code d'une intervention (il est généré automatiquement)
- Les dates de début et de fin indiquent quand le travail a été réalisé
- Chaque changement d'étape est enregistré automatiquement dans l'historique

---

### Qu'est-ce qu'une Action ?

L'**action** est **l'élément le plus important** de Tunnel GMAO.

**En termes simples** : C'est la preuve du travail réellement effectué sur le terrain. C'est là qu'on note ce qu'on a fait, combien de temps ça a pris, et si c'était difficile.

#### Ce qu'il faut savoir

- Une action est toujours rattachée à une intervention
- Une action est classée par catégorie (Dépannage, Préventif, Support, etc.)
- **Une action contient obligatoirement** :
  - **Une description** : Qu'est-ce qui a été fait ? (ex: "Changement roulement côté moteur")
  - **Le temps passé** : Combien de temps ça a pris ? (en quarts d'heure : 0.25, 0.5, 0.75, 1.0, 1.25...)
  - **Un score de complexité** : Est-ce que c'était facile ou compliqué ? (note de 1 à 10)
  - **Le technicien** : Qui a fait le travail ?
  - **La date de réalisation** : Quand l'action a été effectuée (format YYYY-MM-DD)
- **Une action peut également contenir** :
  - **Des facteurs de complexité** : Annotations qualitatives qui expliquent la complexité (voir section dédiée ci-dessous)

#### Pourquoi c'est important ?

- **Les actions sont la seule source de vérité** pour les statistiques
- Toutes les analyses de temps, de coûts, d'efficacité sont basées sur les actions
- Sans actions, pas de traçabilité du travail effectué

#### Catégories d'actions

Les actions sont regroupées par type pour mieux s'y retrouver :

- **DEP** (Dépannage) : Réparations d'urgence
  - Électrique, Mécanique, Pneumatique, Hydraulique...
- **PREV** (Préventif) : Entretien planifié
  - Graissage, Contrôles, Nettoyage...
- **FAB** (Fabrication) : Modifications ou créations
  - Mécanique, Électrique, Peinture...
- **SUP** (Support) : Tâches administratives
  - Inventaire, Rangement, Documentation...
- **BAT** (Bâtiment) : Entretien des locaux
  - Nettoyage, Réparations diverses...

Chaque catégorie a une couleur pour la reconnaître facilement dans l'interface.

#### Le score de complexité, c'est quoi ?

C'est une note de 1 à 10 que donne le technicien pour signaler si le travail était :

- **Simple** (1-3) : Routine, pas de problème
- **Moyen** (4-6) : Travail normal avec quelques difficultés
- **Élevé** (7-8) : Blocages, problèmes importants
- **Critique** (9-10) : Situation d'urgence ou complexité exceptionnelle

Ce score permet d'identifier les points noirs et d'améliorer les processus.

#### Les facteurs de complexité

En plus du score numérique (1-10), le technicien peut annoter l'action avec des **facteurs de complexité** qui expliquent **pourquoi** le travail était complexe.

**Exemples de facteurs de complexité** :

- **AUT** : Autre facteur non listé
- **PCE** : Problème de pièce (manquante, inadaptée, délai)
- **ACC** : Problème d'accès (espace confiné, hauteur, démontage nécessaire)
- **DOC** : Manque de documentation technique
- **OUT** : Outillage spécialisé requis
- **ENV** : Conditions environnementales difficiles (température, bruit, poussière)

**Comment ça fonctionne ?**

- Le technicien choisit **un facteur principal** qui explique la complexité
- Ce facteur est enregistré dans le champ `complexity_anotation` de l'action
- Cela permet d'analyser les causes de complexité et de prendre des actions correctives

**Exemple** :
- Score de complexité : 8/10
- Facteur de complexité : PCE (Problème de pièce)
- Interprétation : L'action était complexe principalement à cause d'un problème de disponibilité de pièce

---

### Comment ça marche ensemble ? (Le flux complet)

#### Exemple concret : Panne sur un convoyeur

1. **On crée une intervention** : "Panne convoyeur CONV01"
   - Type : Curatif (CUR)
   - Machine : CONV01
   - Code généré automatiquement : `CONV01-CUR-20250201-MT`

2. **On démarre le travail** : Statut passe à "En cours"

3. **On note les actions réalisées** :
   - Action 1 : "Diagnostic électrique" - 0.5h (2 quarts d'heure) - Complexité : 3
   - Action 2 : "Changement contacteur défectueux" - 1.25h (5 quarts d'heure) - Complexité : 5 - Facteur : PCE
   - Action 3 : "Tests et remise en route" - 0.75h (3 quarts d'heure) - Complexité : 2

4. **On termine** : Statut passe à "Fermé"

5. **Résultat** :
   - Temps total : 2.5h (somme des actions : 0.5 + 1.25 + 0.75)
   - Complexité moyenne : 3.3
   - Traçabilité complète du travail effectué
   - Identification du problème de pièce (facteur PCE) pour amélioration future

---

### Pièces utilisées pendant une intervention

Quand on utilise des pièces du stock pendant une intervention, on l'enregistre via une demande d'achat.

**En termes simples** : On note quelle pièce on a prise et en quelle quantité, en liant cette information à l'action qui l'a utilisée.

#### Ce qu'il faut savoir

- **Les demandes d'achat sont rattachées aux actions** (pas directement aux interventions)
- L'intervention affiche une vue composite de toutes les pièces utilisées via ses actions
- On indique la quantité utilisée
- On peut ajouter des notes (pourquoi cette pièce ? problème particulier ?)
- Le stock sera reconstitué via le processus d'achat (système crédit/dette)

---

### 📋 Tableau récapitulatif

| Concept          | À quoi ça sert ?                | Qu'est-ce qu'on y met ?             |
| ---------------- | ------------------------------- | ----------------------------------- |
| **Intervention** | Le dossier de travail principal | Machine, Type, Dates, Statut                   |
| **Action**       | Prouver le travail fait         | Description, Temps, Complexité, Facteurs, Qui  |
| **Pièce**        | Tracer les consommations        | Article utilisé, Quantité                      |

### 🎯 Les règles d'or (à ne jamais oublier)

| Règle                           | Explication                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| **1 intervention = 1 machine**  | On ne peut pas créer une intervention sans spécifier la machine     |
| **Les actions = la preuve**     | Tout le travail réel doit être noté dans les actions                |
| **Le temps = dans les actions** | Le temps passé se note uniquement dans les actions, jamais ailleurs |
| **Codes automatiques**          | Les codes (interventions, stock, commandes) se génèrent tout seuls  |
| **Historique complet**          | Tous les changements de statut sont enregistrés automatiquement     |

---

## 📦 Le Stock et les Achats

### À quoi sert le stock dans Tunnel ?

Dans Tunnel GMAO, le stock a un rôle particulier : **il sert à normaliser les pièces** plutôt qu'à gérer des quantités.

**En termes simples** : Le stock est un catalogue de pièces standardisées avec leurs références uniques.

### Le système Crédit/Dette

#### Comment ça fonctionne ?

Tunnel fonctionne selon un principe de **crédit au stock** :

1. **Vous avez besoin d'une pièce** lors d'une intervention
2. **Vous prenez la pièce physiquement** dans le magasin (pas de blocage)
3. **Vous créez une demande d'achat** pour "rembourser" cette dette au stock
4. **La pièce sera commandée** pour reconstituer le stock

**Avantages de ce système** :

- ✅ Pas de blocage : on prend ce dont on a besoin immédiatement
- ✅ Pas de gestion complexe de quantités minimales
- ✅ Pas de réapprovisionnement automatique à gérer
- ✅ Le stock tourne naturellement en flux tendu

#### Exemple concret

**Situation** : Vous réparez le convoyeur CONV01 et vous avez besoin d'un roulement

1. **Vous allez au magasin** et prenez le roulement `ROUL-6204-2RS`
2. **Vous utilisez la pièce** pendant l'intervention
3. **Vous créez une demande d'achat** :
   - Article : `ROUL-6204-2RS`
   - Quantité : 1
   - Lié à : Intervention CONV01-CUR-20250201-MT
   - Raison : "Roulement utilisé lors du dépannage"
4. **Le responsable achats** verra cette demande et commandera le roulement pour refaire le stock

### Comment est organisé le catalogue stock ?

Même si on ne gère pas les quantités, le stock est organisé en hiérarchie pour normaliser les références :

Le stock est organisé en 3 niveaux, comme une hiérarchie :

**1. Les Familles** (niveau 1)

- Grandes catégories de pièces
- Exemples : VIS, ROUL (roulements), COURR (courroies), ELEC (électrique)

**2. Les Sous-familles** (niveau 2)

- Détails à l'intérieur d'une famille
- Exemples dans la famille VIS : VIS-CHC (vis à tête cylindrique hexagonale), VIS-TH (vis à tête hexagonale)

**3. Les Articles** (niveau 3)

- Les pièces concrètes du catalogue
- Chaque article a une référence unique auto-générée
- Format : `FAMILLE-SOUSFAMILLE-SPECIFICATION-DIMENSION`
- Exemple : `VIS-CHC-M8-20` signifie "Vis à tête cylindrique hexagonale M8 longueur 20mm"

### Pourquoi normaliser les pièces ?

⚠️ **Sans normalisation**, chacun note à sa façon :

- "Vis M8"
- "vis m8 20mm"
- "CHC M8x20"
- "Vis 8mm long 20"

✅ **Avec normalisation**, tout le monde utilise la même référence :

- `VIS-CHC-M8-20`

**Avantages** :

- On peut compter combien de fois on utilise cette pièce
- On peut regrouper les demandes d'achat identiques
- On peut analyser les coûts par type de pièce
- On peut identifier les pièces à standardiser ou stocker

#### Les fournisseurs

Chaque article du catalogue est lié à :

- **Une ou plusieurs références fournisseur** : Comment le fournisseur appelle cette pièce
  - Prix unitaire
  - Délai de livraison
  - Quantité minimum de commande
  - Fournisseur préféré pour cet article
- **Des références fabricant** : Comment le fabricant désigne cette pièce

**Exemple** : Pour le roulement `ROUL-6204-2RS` (référence interne) :

- Référence fournisseur ACME : "SKF-6204-2RS" à 12€, délai 5 jours
- Référence fournisseur BETA : "RLT-6204-2RS" à 11€, délai 10 jours
- Référence fabricant : "6204-2RS-C3" (norme SKF)

---

### Qu'est-ce qu'une Demande d'achat ?

Une **demande d'achat** est une requête pour commander une pièce.

**En termes simples** : "J'ai besoin de cette pièce, je crée une demande pour qu'on me la fournisse".

#### Les deux types de demandes

🔧 **Demandes liées à une action** (avec traçabilité)

- Vous utilisez un roulement pendant une intervention
- La demande est liée à l'action de l'intervention
- Traçabilité complète : quelle pièce → pour quelle réparation → sur quelle machine

📦 **Demandes spontanées** (consommables, anticipation)

- Besoin de piles AAA pour les outils
- Besoin de fournitures d'atelier
- Anticipation d'un besoin futur
- Pas de lien avec une intervention spécifique

#### La qualification des demandes

Quand vous créez une demande, deux cas de figure :

✅ **Demande avec référence connue** (pièce déjà dans le catalogue)

- Vous sélectionnez la référence interne existante
- Les références fournisseur sont déjà liées
- La demande est prête à être dispatchée

❓ **Demande spéciale** (pièce inconnue, nouvelle)

- La pièce n'existe pas encore dans le catalogue
- La demande doit être **qualifiée** :
  1. **Normalisation** : Créer la référence interne dans le bon format
  2. **Liaison fournisseur** : Lier la référence à un ou plusieurs fournisseurs
  3. **Référence fabricant** : Noter la référence constructeur si connue
- Une fois qualifiée, la demande peut être traitée normalement

**Exemple de qualification** :

- Demande initiale : "Roulement pour moteur CONV01"
- Après qualification :
  - Référence interne créée : `ROUL-6204-2RS`
  - Référence fournisseur : "SKF-6204-2RS" chez ACME à 12€
  - Référence fabricant : "6204-2RS-C3"

#### Les statuts d'une demande d'achat

Le statut d'une demande est **calculé automatiquement** en fonction de son avancement. Il n'est pas modifiable manuellement.

| Statut | Code | Couleur | Signification |
|--------|------|---------|---------------|
| **À qualifier** | `TO_QUALIFY` | 🟠 Orange | La demande n'a pas de référence article normalisée (`stock_item_id` = null) |
| **Sans fournisseur** | `NO_SUPPLIER_REF` | 🟠 Orange foncé | L'article est qualifié mais aucun fournisseur n'est lié |
| **À dispatcher** | `PENDING_DISPATCH` | 🟣 Violet | Prête à être dispatchée (article + fournisseur ok, mais pas encore dans un panier) |
| **Mutualisation** | `OPEN` | ⚫ Gris | Présente dans un panier fournisseur, en attente de devis |
| **Devis reçu** | `QUOTED` | 🟠 Orange clair | Au moins un devis a été reçu pour cette demande |
| **Commandé** | `ORDERED` | 🔵 Bleu | La ligne a été sélectionnée et commandée |
| **Partiellement reçu** | `PARTIAL` | 🟣 Violet clair | Une partie de la quantité a été réceptionnée |
| **Reçu** | `RECEIVED` | 🟢 Vert | Quantité totale réceptionnée |
| **Refusé** | `REJECTED` | 🔴 Rouge | La demande a été refusée |

#### Le cycle de vie d'une demande

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ TO_QUALIFY  │────▶│ NO_SUPPLIER_REF  │────▶│ PENDING_DISPATCH  │
│ (À qualifier)│     │ (Sans fournisseur)│     │ (À dispatcher)    │
└─────────────┘     └──────────────────┘     └─────────┬─────────┘
      │                                                 │
      │ Si article déjà qualifié avec fournisseur       │ Dispatch
      └────────────────────────────────────────────────▶│
                                                        ▼
                                                ┌───────────────┐
                                                │     OPEN      │
                                                │(Mutualisation)│
                                                └───────┬───────┘
                                                        │ Devis reçu
                                                        ▼
                                                ┌───────────────┐
                                                │    QUOTED     │
                                                │ (Devis reçu)  │
                                                └───────┬───────┘
                                                        │ Sélection
                                                        ▼
                                                ┌───────────────┐
                                                │    ORDERED    │
                                                │  (Commandé)   │
                                                └───────┬───────┘
                                                        │ Réception
                                                        ▼
                                        ┌───────────────────────────┐
                                        │  PARTIAL    │  RECEIVED   │
                                        │(Partiel)    │   (Reçu)    │
                                        └───────────────────────────┘
```

**Étapes détaillées :**

1. **Création** : Le technicien crée la demande
   - Quel article ? (référence normalisée si elle existe)
   - Combien ?
   - Est-ce urgent ?
   - Liée à une action ? (optionnel)

2. **Qualification** : Statut = `TO_QUALIFY` (si pièce inconnue)
   - Le responsable achats crée la référence interne
   - Il lie les références fournisseur
   - Il note la référence fabricant
   - → Passe à `NO_SUPPLIER_REF` puis `PENDING_DISPATCH`

3. **Dispatch** : Statut = `PENDING_DISPATCH` → `OPEN`
   - La demande est dispatchée dans un panier fournisseur
   - Chaque panier accumule des demandes pour un même fournisseur
   - Le panier a son propre cycle de vie (voir ci-dessous)

#### Le cycle de vie des paniers fournisseur

Un **panier fournisseur** est un regroupement temporaire de demandes d'achat.

**Pourquoi ce système ?**

- ✅ Éviter les demandes mono-référence (commander 1 seule pièce = inefficace)
- ✅ Limiter la fragmentation du temps (passer 100 petites commandes vs 1 grosse)
- ✅ Optimiser les coûts (frais de port, remises quantité)

**États critiques qui déclenchent la demande de prix** :

Le panier part automatiquement en demande de prix quand il atteint l'un de ces seuils :

- **Taille critique** : Montant total du panier > X€ (ex: 500€)
- **Âge** : Le panier existe depuis > Y jours (ex: 7 jours)
- **Niveau d'urgence** : Au moins une demande urgente dans le panier

**Statuts du panier** :

1. **Ouvert** : Le panier accumule des demandes
   - On peut ajouter des demandes
   - Le panier attend d'atteindre un état critique

2. **Demande de prix** : Statut = `ASK` (Ask for quote)
   - État critique atteint (taille, âge, ou urgence)
   - Le responsable achats doit manuellement envoyer les demandes de devis au fournisseur
   - ⚠️ **Le panier est verrouillé** : on ne peut plus ajouter de demandes

3. **Commandé** : Statut = `Commandé`
   - Le fournisseur a répondu, les prix sont validés
   - Le panier devient une commande fournisseur officielle

4. **Reçu** : Statut = `Reçu`
   - Les pièces sont arrivées
   - Les demandes d'achat liées passent en "Reçu"

Ou **Refus** : Statut = `Refusé`

- La demande est rejetée avec une explication

#### Exemple de cycle de vie d'un panier

**Jour 1 - Lundi matin** :

- Demande 1 ajoutée : Roulement 6204 2RS × 1 (12€)
- Panier "ACME Roulements" : 12€, statut = Ouvert

**Jour 1 - Lundi après-midi** :

- Demande 2 ajoutée : Vis M8×20 × 50 (10€)
- Panier "ACME Roulements" : 22€, statut = Ouvert

**Jour 3 - Mercredi** :

- Demande 3 ajoutée : Roulement 6305 × 2 (30€)
- Panier "ACME Roulements" : 52€, statut = Ouvert

**Jour 5 - Vendredi** :

- Demande 4 ajoutée (URGENTE) : Courroie trapézoïdale (45€)
- ⚠️ **État critique atteint** : demande urgente détectée
- Panier "ACME Roulements" : 97€, statut = **ASK** (verrouillé)
- Le responsable achats doit envoyer la demande de devis

**Jour 6 - Lundi suivant** :

- Le responsable envoie manuellement le devis au fournisseur ACME
- Le fournisseur répond avec les prix
- Validation et création de la commande `CMD-20250210-0055`
- Statut = Commandé

**Jour 12** :

- Réception des pièces
- Statut = Reçu

#### Ce qu'il faut savoir

- **Le statut est calculé automatiquement** : Il dépend de l'état de la demande (article qualifié ? fournisseur lié ? dispatchée ? commandée ? reçue ?)
- Une demande peut concerner :
  - **Un article existant** du catalogue → statut `PENDING_DISPATCH` directement
  - **Un article nouveau** → statut `TO_QUALIFY`, doit être qualifié et normalisé
- Une demande peut être :
  - **Liée à une action** : Traçabilité complète (quelle pièce pour quelle intervention)
  - **Spontanée** : Consommables, fournitures, anticipation
- Le **dispatch** (`PENDING_DISPATCH` → `OPEN`) regroupe les demandes dans des paniers fournisseur
- Le **cycle de vie des paniers** (`OPEN` → `QUOTED` → `ORDERED` → `RECEIVED`) optimise le flux d'achats
- Les **états critiques** (taille, âge, urgence) déclenchent automatiquement la demande de prix
- Un panier en statut ASK est **verrouillé** : impossible d'ajouter de nouvelles demandes
- On peut marquer une demande comme urgente
- Quantités :
  - **Quantité demandée** : Ce que le technicien demande
  - **Quantité approuvée** : Ce qui sera vraiment commandé (peut être ajusté)

---

### Qu'est-ce qu'une Commande fournisseur ?

Une **commande fournisseur** est le document officiel envoyé au fournisseur pour acheter des pièces.

**En termes simples** : C'est le bon de commande qu'on envoie au fournisseur.

#### Structure d'une commande

Une commande a deux niveaux :

**1. L'en-tête de commande** :

- Numéro de commande auto-généré : `CMD-DATE-NUMÉRO`
- Exemple : `CMD-20250201-0042` = 42ème commande du 1er février 2025
- Quel fournisseur ?
- Date de la commande
- Date de livraison prévue

**2. Les lignes de commande** :

- Chaque ligne = un article commandé
- Pour chaque ligne :
  - Quel article ?
  - Combien ?
  - Quel prix unitaire ?
  - Total ligne (calculé automatiquement : prix × quantité)

#### Le lien avec les demandes d'achat

Quand on transforme des demandes d'achat en commande, le système garde la traçabilité :

- On sait quelle ligne de commande correspond à quelle demande d'achat
- On peut remonter de la pièce reçue jusqu'à l'intervention qui l'a demandée

#### Les statuts d'une commande

- **Brouillon** : En cours de création, pas encore envoyée
- **Envoyé** : Commande validée et envoyée au fournisseur
- **Reçu** : Les pièces sont arrivées
- **Annulé** : La commande a été annulée

#### Dates importantes

- **Date de commande** : Quand on a passé la commande
- **Date de livraison prévue** : Quand le fournisseur dit qu'il livrera
- **Date de livraison réelle** : Quand on a vraiment reçu les pièces

---

### 🔄 Le flux complet d'approvisionnement

#### Exemple 1 : Pièce connue liée à une action

**Étape 1 : Intervention et consommation**

- Vous intervenez sur le convoyeur CONV01 pour une panne
- Vous diagnostiquez : le roulement 6204 2RS est HS
- Vous allez au magasin et **prenez physiquement 1 roulement** `ROUL-6204-2RS`
- Vous réparez la machine

**Étape 2 : Création de la demande**

- Pendant ou après l'intervention, vous créez une demande d'achat :
  - Article : `ROUL-6204-2RS` (référence interne connue)
  - Quantité : 1
  - Urgent : Oui
  - Liée à : L'action "Changement roulement" de l'intervention CONV01-CUR-20250201-MT
- Statut : En attente (pas besoin de qualification, la référence existe)

**Étape 3 : Dispatch en panier fournisseur**

- Le responsable achats voit la demande URGENTE
- Il la dispatche dans le panier "ACME Roulements"
- D'autres demandes sont déjà dans ce panier :
  - Demande 1 (2 jours) : Roulement 6305 × 2 (30€)
  - Demande 2 (1 jour) : Vis M8x20 × 50 (10€)
  - Demande 3 (nouvelle, URGENTE) : Roulement 6204 2RS × 1 (12€)
- Panier total : 52€

**Étape 4 : Déclenchement automatique de la demande de prix**

- ⚠️ Une demande urgente est détectée dans le panier
- Le panier atteint un **état critique** (niveau d'urgence)
- Passage automatique en statut **ASK** (demande de prix)
- Le panier est maintenant **verrouillé** : impossible d'ajouter d'autres demandes

**Étape 5 : Envoi manuel de la demande de devis**

- Le responsable achats envoie manuellement la demande de devis au fournisseur ACME
- Le fournisseur répond avec les prix confirmés
- Le responsable peut ajuster les quantités :
  - Roulement 6204 2RS : 2 au lieu de 1 (pour avoir une pièce d'avance)
  - Roulement 6305 : confirmé × 2
  - Vis M8x20 : confirmé × 50

**Étape 6 : Création de la commande**

- Le panier devient une commande fournisseur officielle :
  - Fournisseur : ACME Roulements
  - Ligne 1 : Roulement 6204 2RS × 2 à 12€ = 24€
  - Ligne 2 : Roulement 6305 × 2 à 15€ = 30€
  - Ligne 3 : Vis M8x20 × 50 à 0,20€ = 10€
  - Total : 64€
- Numéro généré : `CMD-20250201-0042`
- Statut panier : Commandé

**Étape 7 : Réception**

- Les pièces arrivent le 07/02/2025
- Les 2 roulements sont remis au magasin
- La demande d'achat passe en statut "Reçu"
- Le panier passe en statut "Reçu"
- Traçabilité : On sait que 1 roulement a été utilisé pour CONV01, et 1 est en avance

---

#### Exemple 2 : Demande spontanée avec qualification

**Étape 1 : Besoin identifié (sans intervention)**

- Le technicien constate qu'il manque des piles AAA pour les testeurs
- Pas de lien avec une intervention spécifique, c'est du consommable

**Étape 2 : Création de la demande spéciale**

- Le technicien crée une demande d'achat :
  - Description : "Piles AAA alcalines par lot de 10"
  - Quantité : 3 lots (= 30 piles)
  - Urgent : Non
  - Pas liée à une action
- Statut : À qualifier (la pièce n'existe pas dans le catalogue)

**Étape 3 : Qualification et normalisation**

- Le responsable achats traite la demande
- Il crée la référence interne normalisée :
  - Référence interne : `ELEC-PILE-AAA-ALK`
  - Famille : ELEC
  - Sous-famille : PILE
  - Spécification : AAA (taille)
  - Type : ALK (alcaline)
- Il lie les références fournisseur :
  - Fournisseur A : "Duracell AAA Plus Power (lot 10)" à 8€/lot
  - Fournisseur B : "Energizer AAA Max (lot 10)" à 7,50€/lot
- Il choisit le fournisseur B (meilleur prix)
- Statut : En attente (qualifiée et prête à dispatcher)

**Étape 4 : Dispatch en panier**

- La demande est ajoutée au panier "Fournisseur B"
- Le panier accumule d'autres consommables :
  - Piles AAA × 3 lots (22,50€)
  - Marqueurs permanents × 10 (15€)
  - Gants nitrile × 50 paires (45€)
- Total panier : 82,50€
- Le panier attend d'atteindre un état critique (pas urgent, montant < 500€)

**Étape 5 : Plusieurs jours plus tard**

- Le panier "Fournisseur B" a 8 jours d'âge
- ⚠️ **État critique atteint** : âge > 7 jours
- Passage automatique en statut **ASK**
- Le panier est verrouillé

**Étape 6 : Demande de devis et commande**

- Le responsable envoie manuellement le devis au fournisseur B
- Validation et création de la commande
- Numéro : `CMD-20250215-0088`

**Étape 7 : Réception**

- Les 3 lots de piles sont mis au magasin
- La prochaine fois qu'on aura besoin de piles AAA, la référence existera déjà !
- Plus besoin de qualification !

---

## 🏭 Les Machines et Équipements

### Qu'est-ce qu'une Machine dans Tunnel ?

Une **machine** est un équipement sur lequel on fait de la maintenance.

**Exemples** : Un convoyeur, une presse, un robot, un compresseur, une ligne de production complète...

### Les informations d'une machine

Chaque machine possède :

- **Un code unique** : Ex: CONV01, PRESS02, ROBOT-A
- **Un nom** : Nom descriptif de la machine
- **Une localisation** : Où se trouve-t-elle dans l'usine ?

**Informations supplémentaires** (disponibles en base de données mais pas toutes exposées dans l'interface actuellement) :

- **Le type** : Convoyeur, Presse, Robot, Compresseur...
- **Le fabricant** : Qui l'a construite ?
- **Le numéro de série** : Pour l'identifier précisément
- **La date de mise en service** : Depuis quand elle est là ?

### Les équipements composés (hiérarchie)

Certains équipements sont constitués de plusieurs machines.

**Exemple** : Une ligne de production

- Ligne de production (équipement parent)
  - Convoyeur d'entrée (machine 1)
  - Presse (machine 2)
  - Robot de palettisation (machine 3)
  - Convoyeur de sortie (machine 4)

Dans Tunnel, on peut dire qu'une machine fait partie d'un équipement plus grand.

#### Pourquoi c'est utile ?

- Pour voir toutes les interventions d'une ligne complète
- Pour analyser la maintenance d'un ensemble d'équipements
- Pour organiser le travail par zone ou par ligne

---

## 📊 Les Statistiques et Indicateurs

### D'où viennent les statistiques ?

**Règle fondamentale** : Toutes les statistiques sont calculées à partir des **actions**.

### Exemples de statistiques calculées

#### Sur les interventions

- **Nombre d'interventions** par machine, par type, par période
- **Temps total d'intervention** = Somme du temps de toutes les actions
- **Temps moyen par type d'intervention**
- **Interventions les plus longues**
- **Taux d'interventions préventives** vs correctives

#### Sur les actions

- **Temps passé par catégorie** : Combien de temps en dépannage ? En préventif ?
- **Répartition du temps par technicien**
- **Actions les plus fréquentes**
- **Complexité moyenne** par type d'action
- **Analyse des facteurs de complexité** : Quels sont les facteurs qui ralentissent le plus les interventions ?
- **Détection d'anomalies** :
  - Actions trop longues (au-delà du temps habituel)
  - Actions répétitives sur la même machine (signe d'un problème récurrent)
  - Actions fragmentées (plusieurs petites actions au lieu d'une seule)
  - Enchaînements suspects (deux actions identiques qui se suivent)

#### Sur le stock et les achats

- **Articles les plus consommés** (via les demandes d'achat)
- **Coût total des pièces** par type, par machine
- **Délai moyen de livraison** par fournisseur
- **Taux de respect des délais**
- **Coût moyen par commande**
- **Demandes d'achat en attente** (suivi du flux)

### Les alertes automatiques

Le système peut détecter automatiquement des situations anormales :

- ⚠️ **Intervention ouverte depuis trop longtemps** (ex: > 30 jours)
- ⚠️ **Temps passé anormalement élevé** sur une action
- ⚠️ **Actions répétées** sur la même machine (problème récurrent ?)
- ⚠️ **Demande d'achat urgente en attente** depuis trop longtemps
- ⚠️ **Livraison en retard**

---

## 🎓 Glossaire des termes métier

| Terme                    | Définition simple                                              |
| ------------------------ | -------------------------------------------------------------- |
| **Intervention**         | Le dossier qui regroupe tout le travail fait sur une machine   |
| **Action**                | La description d'un travail réellement effectué avec son temps                      |
| **Machine**               | Un équipement sur lequel on fait de la maintenance                                  |
| **Stock**                 | L'ensemble des pièces disponibles dans le magasin                                   |
| **Article**               | Une pièce précise dans le stock (ex: vis M8 × 20)                                   |
| **Famille**               | Un grand type de pièces (ex: VIS, ROULEMENTS)                                       |
| **Sous-famille**          | Un sous-type dans une famille (ex: VIS-CHC)                                         |
| **Demande d'achat**       | Une requête pour commander une pièce                                                |
| **Commande fournisseur**  | Le bon de commande envoyé au fournisseur                                            |
| **Statut**                | L'état actuel d'une intervention/commande/demande                                   |
| **Score de complexité**   | Note de 1 à 10 donnée par le technicien sur la complexité du travail                |
| **Facteur de complexité** | Annotation qualitative expliquant la cause de la complexité (PCE, ACC, DOC, etc.)   |
| **Curatif**               | Maintenance effectuée suite à un besoin identifié ou une panne                      |
| **Traçabilité**           | Capacité à retrouver l'historique de ce qui s'est passé                             |

---

## ✅ Ce qu'il faut retenir (l'essentiel)

### Sur les interventions

1. **Une intervention = un dossier de travail** sur une machine précise
2. **Les actions = la preuve du travail** avec temps et difficulté
3. Tout est automatiquement enregistré et tracé

### Sur le stock et les achats

1. Le stock est organisé en **Familles → Sous-familles → Articles**
2. **Demande d'achat** : Je demande une pièce
3. **Commande fournisseur** : On commande officiellement au fournisseur
4. La traçabilité est complète : de la demande jusqu'à la réception

### Sur les statistiques

1. Les stats sont calculées à partir des **actions uniquement**
2. Le système détecte automatiquement les anomalies
3. Tout changement de statut est historisé

---

## 🔧 Détails techniques d'implémentation

Cette section détaille les formats de données et contraintes techniques du système.

### Format des interventions

**Code d'intervention** :
- Format : `NOM-MACHINE-TYPE-DATE-INITIALES`
- Exemple : `CONV01-CUR-20250201-MT`
- Généré automatiquement et non modifiable
- Format immuable : ce format ne changera jamais pour garantir la compatibilité historique

**Types d'intervention** :
- Actuellement implémenté : `CUR` (Curatif)
- Types prévus mais non implémentés : `PREV` (Préventif), `INST` (Installation)

**Statuts disponibles** :
- `Ouvert` : Intervention créée
- `En cours` : Travail démarré
- `Fermé` : Travail terminé
- ⚠️ `Annulé` : Documenté mais pas implémenté

### Format des actions

**Champs obligatoires** :
- `intervention_id` (uuid) : Intervention parente
- `description` (string) : Description du travail effectué
- `time_spent` (float) : Temps en quarts d'heure (0.25, 0.5, 0.75, 1.0, 1.25...)
- `created_at` (date) : Date de réalisation au format YYYY-MM-DD
- `action_subcategory` (int) : Sous-catégorie de l'action
- `tech` (uuid) : Identifiant du technicien

**Champs optionnels** :
- `complexity_score` (int) : Score de 1 à 10
- `complexity_anotation` (string) : Code du facteur de complexité (ex: "PCE", "ACC")

**Format de payload pour création** :
```json
{
  "intervention_id": "uuid",
  "description": "string",
  "time_spent": 1.25,
  "created_at": "2025-02-01",
  "action_subcategory": "36",
  "tech": "uuid",
  "complexity_score": 7,
  "complexity_anotation": "PCE"
}
```

### Catégories d'actions

Le système utilise des sous-catégories d'actions pour classifier le travail effectué. Les catégories principales mentionnées dans ce document (DEP, PREV, FAB, SUP, BAT) correspondent aux groupes de sous-catégories dans la base de données.

### Facteurs de complexité

**Codes disponibles** (exemples) :
- `AUT` : Autre
- `PCE` : Problème de pièce
- `ACC` : Problème d'accès
- `DOC` : Documentation manquante
- `OUT` : Outillage spécialisé
- `ENV` : Conditions environnementales

Un seul facteur peut être enregistré par action dans le champ `complexity_anotation`.

### Machines

**Champs principaux exposés** :
- `code` : Code unique de la machine
- `name` : Nom descriptif
- `location` : Localisation

**Champs en base non mappés actuellement** :
- Type de machine
- Fabricant
- Numéro de série
- Date de mise en service

**Relations** :
- Une machine peut avoir une machine parente (hiérarchie)
- Une machine peut avoir des machines enfants

### Demandes d'achat et traçabilité

**Liaison avec les actions** :
- Les demandes d'achat sont **liées aux actions** (pas directement aux interventions)
- Chaque demande d'achat référence l'action qui a nécessité la pièce
- Les interventions affichent une **vue composite** de toutes les pièces via leurs actions

**Traçabilité complète** :
```
Demande d'achat → Action → Intervention → Machine
```

Cette structure permet de savoir :
- Quelle pièce a été utilisée
- Pour quelle action spécifique
- Dans quelle intervention
- Sur quelle machine
- Par quel technicien
- À quelle date

**Cas particuliers** :
- Les demandes d'achat **spontanées** (consommables, anticipation) ne sont pas liées à une action
- Ces demandes n'ont pas de traçabilité intervention/machine

---

## 📚 Pour aller plus loin

Pour les aspects techniques (développeurs uniquement) :

- [API_CONTRACTS.md](tech/API_CONTRACTS.md) : Contrats techniques des données
- [db/schema/README.md](../db/schema/README.md) : Structure de la base de données
