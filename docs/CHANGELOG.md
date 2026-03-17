# Changelog — Tunnel GMAO

Toutes les modifications notables du projet sont documentées dans ce fichier.

---

## 3.24.0 - 2026-03-17

Stabilité : **STABLE** ✅

### Équipements — nouvelles demandes d'intervention visibles dans la recherche

Le composant `EquipementSearch` affiche désormais un badge **orange** indiquant le nombre de nouvelles demandes d'intervention (`health.new_requests_count`) retourné par l'API. Le badge apparaît dans la liste déroulante de recherche et dans le bandeau de sélection, entre le compteur d'interventions ouvertes et l'état de santé global.

### Planning — gestion des horaires et ajustements API

**Horaires d'action** : les bornes `action_start` / `action_end` sont désormais correctement transmises et affichées dans `ActionItemCard` et `ActionFormFields`. La saisie horaire dans le formulaire est renforcée avec la validation de cohérence début/fin.

**Ajustements API** :
- `actions.js` et `interventions.js` : mise à jour des payloads pour inclure les champs horaires.
- `planning.js` : meilleure lisibilité dans `fetchOpenInterventionsByEquipement` (paramètres nommés).
- `stock.js` : correction mineure de paramètre.
- `PurchaseRequestForm` / `FormActions` : harmonisation des actions de formulaire d'achat.

### Docker — exposition frontend sur toutes les interfaces

Le service frontend dans `docker-compose.yml` expose désormais le port sur `0.0.0.0` pour être accessible depuis le réseau local (utile en développement sur machine distante ou VM).

---

## 3.23.0 - 2026-03-16

Stabilité : **STABLE** ✅

### Planning — page dédiée et gestion complète des actions

Nouvelle page `/planning` accessible depuis le menu principal, offrant une vue semaine interactive pour l'ensemble des actions planifiées.

**API** : enrichissement de `planning.js` avec `createActionDirect`, récupération des bornes horaires (`action_start` / `action_end`) et gestion des paramètres de filtrage technicien.

**Composants** :
- `PlanningView` — page principale avec vue semaine, formulaire d'ajout d'action en ligne et filtrage par technicien.
- `EquipementSearch` — champ de recherche serveur d'équipement utilisé dans le formulaire d'action.
- `InterventionSelector` — sélecteur d'intervention par recherche textuelle, avec aperçu de la fiche sélectionnée.
- `TimeRangePicker` — saisie des horaires début / fin d'une action (validation cohérence, affichage durée calculée).
- `ActionForm` — refactorisation complète : champs horaires intégrés dans `ActionFormFields`, validation étendue des plages horaires.

**Technicien par défaut** : à l'ouverture de la vue planning (page dédiée et onglet intervention), le technicien connecté est automatiquement pré-sélectionné s'il figure dans la liste des utilisateurs actifs. La sélection reste modifiable.

### Équipements — tableau unifié avec pagination serveur

Refontede la liste des équipements en un composant `EquipementTable` réutilisable, partagé entre la page principale et l'onglet sous-équipements d'une fiche équipement.

**Pagination et recherche côté serveur** : l'API `fetchEquipements` supporte désormais les paramètres `page`, `page_size`, `search` et `class_id`. Le hook `useEquipements` gère l'état de pagination et déclenche un rechargement à chaque changement de filtre.

**Relation parent-enfant** : le tableau affiche les sous-équipements d'un équipement parent via le même composant `EquipementTable`, ce qui supprime le hook `useEquipementChildren` devenu redondant.

**Filtrage par classe** : sélecteur de classe d'équipement dans la barre de filtre de la page équipements, avec remise à zéro automatique de la pagination lors d'un changement.

---

## 3.22.0 - 2026-03-12

Stabilité : **STABLE** ✅

### Demandes d'intervention — nouveau module complet

Création d'un module complet de gestion des demandes d'intervention, avec cycle de vie à cinq statuts (`nouvelle → en_attente → acceptée → rejetée → clôturée`).

**API** : nouveau module `intervention-requests.js` avec les opérations CRUD, la gestion des transitions de statut et le filtrage serveur par `statut` / `exclude_statuses`.

**Composants** :
- `InterventionRequestsTab` — tableau paginé filtrable par statut avec compteurs.
- `InterventionRequestDetail` — fiche détail : équipement, demandeur, service, description, historique des transitions.
- `InterventionRequestForm` — formulaire de création de demande lié à un équipement.
- `InterventionRequestSelector` — sélecteur de demandes ouvertes (statuts `nouvelle` et `en_attente` uniquement) utilisé lors de la création d'une intervention.
- `InterventionRequestCard` — bandeau horizontal compact affiché sur la fiche intervention, indiquant la demande liée avec statut coloré.
- `StatutTabs` — navigation par statut avec comptage par catégorie.

**Hooks** : `useInterventionRequests` (liste paginée) et `useInterventionRequestDetail` (détail + transitions).

**Page et routes** : `InterventionRequestsPage` accessible depuis le menu principal ; route `/intervention-requests/:id` pour le détail d'une demande.

### Création d'intervention — flux en deux étapes

La page de création adopte un layout deux colonnes avec un flux guidé :

- **Étape 1 (gauche)** — sélectionner une demande existante ou en créer une nouvelle directement dans le sélecteur. Un overlay bloque le passage à l'étape 2 tant qu'aucune demande n'est choisie.
- **Étape 2 (droite)** — renseigner les champs de l'intervention. Le titre, l'équipement et le signalant sont pré-remplis automatiquement depuis la demande sélectionnée et grisés pour éviter la désynchronisation.

Le formulaire est extrait dans un composant dédié `InterventionCreateForm`.

### Suppression d'intervention

Un bouton de suppression est disponible sur la fiche intervention, conditionné à l'absence d'actions et de demandes d'achat associées (`isDeletable`). Une boîte de dialogue de confirmation (`AlertDialog`) est affichée avant l'opération.

### Demande liée sur la fiche intervention

La demande d'intervention associée (`request` object) est affichée directement sur la fiche intervention sous forme de bandeau horizontal avant les onglets. En l'absence de demande liée, un état vide compact est affiché avec l'icône `Link2Off`.

### EmptyState — variante compact

Nouvelle prop `compact` sur le composant `EmptyState` : affichage horizontal dans un bandeau avec bordure gauche (`4px solid`), fond atténué (`var(--gray-1)`) et typographie réduite (`size-2`/`size-1`). Utilisé dans `ActionsTab` et `InterventionRequestCard`.

### Gestion des fournisseurs — nettoyage et URL produit

Suppression des composants obsolètes : `AddSupplierForm`, `EditSupplierForm`, `ManufacturersTable`, `SuppliersTable`, `SupplierItemLinkForm`, `PartTemplatesList`, `StockFamiliesTable`. Les fonctionnalités correspondantes sont intégrées dans les composants actifs. Ajout du champ **URL produit** dans la fiche fournisseur (`SupplierDetail`).

### Demandes d'achat — urgence normalisée

Les options d'urgence dans `PurchaseRequestForm` et `PurchaseRequestEditForm` sont standardisées pour correspondre exactement au référentiel backend.

---

## 3.21.0 - 2026-03-10

Stabilité : **STABLE** ✅

### Composant générique ItemForm

Un nouveau composant `ItemForm` centralise la mécanique de recherche, sélection et création d'un élément dans un formulaire. Il remplace les implémentations ad hoc précédentes et garantit une expérience homogène dans toute l'application.

**Onglets Rechercher / Créer :** l'interface propose deux onglets. La recherche est deboncée et affiche des états visuels centrés (icône + texte bold) : inactif, trop court, chargement, aucun résultat. L'onglet de création est optionnel et peut être désactivé.

**Étape de confirmation :** après avoir sélectionné ou créé un élément, une étape intermédiaire affiche une prévisualisation avec deux boutons (Utiliser / Annuler). Le flux est identique qu'on vienne de la recherche ou de la création.

**Validation unifiée (registerSubmit) :** le formulaire de création enregistre une fonction asynchrone via `registerSubmit`. `ItemForm` appelle cette fonction au clic sur le bouton, affiche le spinner et les erreurs réseau dans un Callout, sans que le formulaire enfant ait à gérer ses propres boutons.

### ManufacturerForm — refactorisation

Le formulaire de sélection/création de fabricant est désormais un wrapper fin sur `ItemForm`. Il ne conserve que la logique métier (champs nom + référence, appel API) ; toute la mécanique de recherche, confirmation et validation est déléguée.

### Demandes d'achat — nouveau formulaire de sélection d'article

Le `PurchaseRequestForm` utilise maintenant `ItemForm` pour la sélection de l'article (onglet création désactivé). La recherche est serveur (debounce via `AsyncSearchSelect`). Quand l'utilisateur tape un texte sans sélectionner de référence en stock, un bandeau **Demande spéciale** en amber s'affiche automatiquement sous le champ — aucun bouton supplémentaire requis. La soumission envoie `stock_item_id: null` et `item_label` égal au texte saisi.

### AsyncSearchSelect — états vides redessinés

Les cinq états de la zone de résultats (inactif, saisie trop courte, chargement, résultats, aucun résultat) affichent maintenant une icône centrée (22 px) avec un texte en bold, dans une zone de hauteur fixe (144 px). L'icône de chargement (Loader2) est correctement alignée avec la loupe grâce à un conteneur de positionnement séparé de l'animation.

---

## 3.20.0 - 2026-03-09

Stabilité : **STABLE** ✅

### Demandes d'achat — colonne Demandeur et badge d'intervention

**Colonne Demandeur :** le nom du demandeur s'affiche maintenant correctement dans la liste des demandes d'achat.

**Badge d'intervention :** le code intervention est affiché sous forme de badge coloré, dont la couleur correspond au type d'intervention (corrective, préventive, etc.). Le type est déduit automatiquement à partir du code.

### Paniers fournisseurs — envoi d'une demande de prix par email

Un bouton **Demande de prix** est disponible sur chaque panier fournisseur. Il génère automatiquement un email pré-rempli (objet, corps en texte brut) à partir du contenu du panier, et ouvre le client mail de l'utilisateur.

Le corps de l'email est au format texte simple, compatible avec Outlook et tous les clients Microsoft.

Si le fournisseur n'a pas d'adresse email renseignée dans sa fiche, un message d'erreur s'affiche directement dans le panneau, indiquant que l'email n'est pas configuré.

---

## 3.19.1 - 2026-03-09

Stabilité : **STABLE** ✅

### Correctifs — Demandes d'achat

**Onglet Achats dans les interventions :** les demandes d'achat liées à une intervention sont maintenant accessibles directement depuis la fiche intervention, dans un nouvel onglet "Achats". Il est possible de consulter le détail d'une demande en cliquant dessus, ou d'en créer une nouvelle sans quitter la page.

**Demandes d'achat dans les actions :** les demandes créées depuis une action s'affichent de nouveau correctement dans la liste. Le nom de l'article, la quantité, l'urgence et le statut sont visibles sur chaque ligne.

**Numéro de panier sur une demande :** quand une demande est incluse dans un panier fournisseur et qu'une ligne a été sélectionnée, le numéro du panier s'affiche à nouveau sur le bandeau de la demande.

**Fiche détail d'une demande — paniers fournisseurs :** quand une demande n'est dans aucun panier, un message indique clairement qu'elle est en attente de dispatch, au lieu d'afficher une section vide.

---

## 3.19.0 - 2026-03-08

Stabilité : **STABLE** ✅

### Paniers fournisseurs — négociation des lignes

Quand un panier est en cours de négociation (statuts **Devis envoyé** ou **En négociation**), les lignes sont maintenant éditables directement depuis le détail du panier.

**Sélection des lignes :** chaque ligne dispose d'une case à cocher pour l'inclure ou l'exclure de la commande ferme. La ligne sélectionnée se met en évidence. La sélection d'une ligne désélectionne automatiquement les lignes concurrentes chez d'autres fournisseurs (règle d'exclusivité gérée par le serveur).

**Édition du prix et de la quantité :** les champs sont directement modifiables dans le tableau. Le bouton d'enregistrement n'apparaît que si la ligne a été modifiée. Le total est recalculé par le serveur après chaque sauvegarde.

**Délai de livraison :** le champ de date devient éditable en mode négociation, avec un bouton de confirmation qui s'affiche uniquement si la date a changé.

**Consultations multi-fournisseurs :** les lignes issues d'un appel d'offres sans fournisseur préféré affichent un badge **"À sélectionner"**. Un compteur en tête de tableau indique le nombre de consultations non résolues. Le passage en livraison reste bloqué tant que chaque article n'a pas de ligne sélectionnée.

**Transitions de statut :** le menu "Passer à" n'affiche plus que les transitions autorisées depuis le statut actuel. Les erreurs métier (transition invalide, consultations non résolues) sont affichées directement dans le panneau.

---

## 3.18.0 - 2026-03-07

Stabilité : **STABLE** ✅

### Demandes d'achat — nouvelle section dans le module achats

L'onglet "Demandes d'achat" est désormais disponible dans le module achats. Il liste toutes les DA avec des filtres par statut (dynamiques, issus du serveur) et par urgence. Un bouton de dispatch permet d'envoyer en une action toutes les demandes prêtes.

La fiche détail s'ouvre en ligne au clic sur une ligne. Elle s'organise en trois colonnes de même hauteur : informations de la DA, intervention liée (code coloré par priorité, lien direct), pièce catalogue (référence cliquable vers le stock filtré). Un empty state s'affiche si l'une est absente.

### Paniers fournisseurs — visibles depuis la fiche DA

Les paniers dans lesquels figure la demande sont affichés en tableau directement dans la fiche : numéro de panier, fournisseur, statut de la commande, référence fabricant, quantité, prix, délai, réception et état de la ligne.

Correction : le panneau détail ne s'affichait pas au clic — résolu.

---

## 3.17.0 - 2026-03-07

Stabilité : **STABLE** ✅

### Filtres familles et sous-familles — listes déroulantes dans la barre de recherche

Les filtres familles et sous-familles de la liste des pièces sont maintenant des listes déroulantes compactes, intégrées directement dans la barre d'outils à côté du champ de recherche. Le format affiché est `CODE — Libellé`, sans le compteur.

Lo filtre sous-famille est désactivé automatiquement si aucune famille n'est sélectionnée. Lorsqu'un filtre est actif, il se colore en bleu (famille) ou indigo (sous-famille) pour signaler qu'il modifie l'affichage. Le champ de recherche adopte lui aussi une teinte bleue dès qu'un texte est saisi.

### Retours d'erreur — messages du serveur affichés dans les formulaires

Tous les formulaires affichent désormais les messages d'erreur tels qu'ils sont formulés par le serveur, en français, directement dans le formulaire concerné. Un doublon, un conflit de référence, un champ invalide — chaque cas est maintenant communiqué clairement à l'utilisateur, sans message générique.

Cette amélioration couvre les formulaires de pièces, de familles, de sous-familles, de fournisseurs et de fabricants.

---

## 3.16.0 - 2026-03-07

Stabilité : **STABLE** ✅

### Fiche fournisseur — ajout, modification, suppression depuis la fiche pièce

La fiche détail d'une pièce permet désormais de gérer directement ses références fournisseurs, sans quitter la page.

**Ajouter un fournisseur :**

Un bouton « Ajouter » ouvre un formulaire inline sous le tableau des fournisseurs. On choisit le fournisseur parmi la liste du référentiel, on saisit sa référence (obligatoire), et on complète si besoin le prix unitaire, la quantité minimum de commande, le délai en jours, et si ce fournisseur doit être marqué comme préféré. L'enregistrement est confirmé visuellement sur le bouton lui-même.

**Modifier une référence existante :**

Chaque ligne du tableau dispose d'un bouton de modification. Un formulaire pré-rempli apparaît sous le tableau avec un fond bleu pour le distinguer du formulaire d'ajout. Les champs modifiables sont la référence, le prix, la quantité minimum, le délai et le statut préféré — le fournisseur lui-même ne peut pas être changé une fois la liaison créée.

**Supprimer et changer le préféré :**

Le bouton rouge de suppression retire la liaison. La suppression est bloquée si le fournisseur est le préféré et qu'il en existe d'autres — il faut d'abord en désigner un autre via l'étoile. L'étoile n'apparaît sur une ligne que si ce fournisseur n'est pas encore le préféré.

**Retours en cas d'erreur :**

Si le serveur refuse une action (doublon, validation incorrecte), un message apparaît directement dans le formulaire concerné, juste au-dessus des boutons. Les erreurs réseau et pannes serveur s'affichent dans un bandeau discret ancré en haut de la page, qui reste visible jusqu'à ce que l'utilisateur le ferme.

**Fin de page :**

Un pied de page apparaît en bas de chaque écran de l'application pour indiquer que l'on est arrivé au bout du contenu.

---

## 3.15.0 - 2026-03-06

Stabilité : **STABLE** ✅

### Formulaire de pièce — saisie guidée, contrôlée et sécurisée

Le formulaire de création et de modification d'une pièce a été entièrement repensé pour guider la saisie de bout en bout.

**Famille et sous-famille depuis le catalogue :**

Les deux champs ne sont plus des zones de texte libres. Ils se présentent sous forme de listes déroulantes alimentées par le serveur, et sont liés l'un à l'autre — changer la famille vide et recharge automatiquement les sous-familles disponibles.

**Champs de caractéristiques adaptés au template :**

Dès qu'une sous-famille est sélectionnée, si elle dispose d'un template, les champs de caractéristiques techniques apparaissent dynamiquement. Chaque champ respecte son type : un champ numérique n'accepte que des nombres, un champ à valeurs fixées se présente sous forme de liste fermée, un champ texte reste libre. Les champs obligatoires sont identifiés. Pour les pièces sans template, la saisie manuelle de la spécification et de la dimension est conservée.

**La référence se construit en temps réel :**

La référence de la pièce est calculée automatiquement à mesure que les champs sont renseignés et s'affiche en lecture seule en haut du formulaire. Elle n'est pas modifiable manuellement — c'est le serveur qui la finalise à l'enregistrement.

**Édition contrôlée :**

En modification, la famille, la sous-famille et les caractéristiques techniques sont verrouillées et s'affichent en lecture seule — seuls le nom, la quantité, l'unité, la spécification et l'emplacement restent modifiables, conformément aux règles du serveur.

---

## 3.14.0 - 2026-03-06

Stabilité : **STABLE** ✅

### Fiche détail d'une pièce — données complètes et affichage intégré

En cliquant sur une pièce dans le catalogue, l'interface charge désormais l'intégralité de sa fiche depuis le serveur et la déploie directement sous la ligne sélectionnée — sans quitter la liste.

**Une fiche riche et hiérarchisée :**

Deux vignettes mettent en avant la **quantité en stock** et le **fournisseur préféré**. En dessous, les informations de classification (famille, sous-famille, template) et les caractéristiques techniques (spécification, dimension, emplacement) s'affichent côte à côte, uniquement si elles sont renseignées.

**Le tableau des fournisseurs :**

Tous les fournisseurs référencés pour cette pièce sont listés dans un tableau : référence fournisseur, référence fabricant avec le nom du fabricant, prix unitaire, quantité minimum de commande et délai de livraison. Le fournisseur préféré est signalé par une étoile.

**Code couleur cohérent sur toutes les références :**

Les badges de référence suivent maintenant une convention stable — bleu pour les références internes au catalogue, indigo pour les références fournisseurs, violet pour les références fabricants — appliquée de façon uniforme dans tout le module stock.

---

## 3.13.0 - 2026-03-06

Stabilité : **STABLE** ✅

### Catalogue des pièces stock — refonte visuelle et ergonomique

L'onglet **Pièces référencées** a été entièrement restructuré pour faciliter la lecture et la navigation dans le catalogue.

**Un vrai tableau à colonnes structurées :**

La liste affiche désormais quatre colonnes distinctes : la référence avec son nom dessous, la famille, la quantité en stock et le fournisseur préféré. La ligne sélectionnée se détache clairement avec un fond coloré et un trait sur le bord gauche.

**Un panneau de détail mieux hiérarchisé :**

La quantité en stock et le fournisseur préféré sont mis en avant dans deux vignettes bien visibles en haut du panneau. Les caractéristiques secondaires (spécification, dimension, emplacement) apparaissent en dessous, uniquement si elles sont renseignées.

**Des filtres famille et sous-famille plus lisibles :**

Les listes déroulantes ont été remplacées par des boutons en ligne — la famille active et la sous-famille active s’affichent en bleu plein, les autres en gris. Les filtres occupent toute la largeur de la page, sans être compressés par le champ de recherche. La ligne de sous-famille est toujours visible : elle affiche au minimum le bouton "Toutes", et les sous-familles de la famille active quand une est sélectionnée.

**En-tête simplifié :**

Le bouton "Rafraîchir" a été supprimé. Le bouton **Ajouter** le remplace directement à droite du champ de recherche.

---

## 3.12.0 - 2026-03-06

Stabilité : **STABLE** ✅

### Gestion des familles et sous-familles

L'onglet **Familles et sous-familles** permet maintenant de créer et modifier des familles et sous-familles directement dans l'interface, sans passer par la base de données.

**Créer une famille :**

- Cliquez sur "Ajouter" dans le tableau des familles
- Renseignez le code et le libellé, puis enregistrez

**Modifier une famille :**

- Sélectionnez une famille dans le tableau
- Cliquez sur "Modifier la famille" dans le panneau de droite

**Créer une sous-famille :**

- Depuis le panneau de détail d'une famille, cliquez sur "Ajouter"
- Choisissez un code, un libellé et une trame de référence si besoin

**Modifier une sous-famille :**

- Cliquez sur "Editer" sur la ligne concernée dans le tableau

### Réduction des appels réseau

La page Stock était trop bavarde : elle interrogeait le serveur plusieurs fois au chargement, même pour des données dont elle n'avait pas besoin. Ce comportement est corrigé — chaque onglet ne charge ses données que lorsqu'il est ouvert.

### Correctif sur les actions d'intervention

La modification d'une action d'intervention échouait avec une erreur serveur. C'est corrigé.

### Composants concernés

- Onglet Familles et sous-familles (Stock)
- Page Stock — chargement des onglets
- Détail d'intervention — modification d'action

---

## 3.11.0 - 2026-03-02

Stabilité : **en consolidation**

### Ergonomie du module Stock

**Affichage restructuré sur les onglets Familles et Trames de référence :**

- La colonne de gauche conserve sa largeur fixe en toutes circonstances — plus de décalage visuel selon la sélection
- Un message d'orientation s'affiche dans le panneau droit quand rien n'est sélectionné, plutôt qu'un espace vide
- Une flèche indique visuellement quelle ligne est actuellement ouverte dans le détail

**Renommage Modèles → Trames de référence :**

- La terminologie reflète mieux l'usage : une trame de référence est un gabarit qui structure les caractéristiques d'une pièce, pas un modèle au sens générique
- Le changement est appliqué sur tous les libellés, boutons et messages de l'interface

### Composants / Modules concernés

- Onglet Trames de référence (Stock)
- Onglet Familles et sous-familles (Stock)

### Points de vigilance

- Le terme "modèle" a disparu de l'interface Stock — toute référence externe doit utiliser "trame de référence"

---

## 3.10.0 - 2026-03-01

Stabilité : **STABLE** ✅

### 📚 Gestion des Modèles de Pièces

Nouveau module permettant de définir et gérer des gabarits réutilisables pour cataloguer les pièces de manière structurée.

**Création de modèles** :

- Définition des caractéristiques techniques désires (dimensions, matériaux, type...)
- Champs de type nombre, texte libre ou liste de valeurs predefinies
- Pattern de référence automatique généré depuis les caractéristiques
- Versionnement : évoluer un modèle sans casser les pièces existantes

**Navigation dans les modèles** :

- Vue liste avec version et nombre de champs au premier coup d'oeil
- Détail complet des champs et valeurs autorisées en un clic
- Suppression sécurisée avec confirmation explicite

**Lien avec les familles** :

- Association directe d’un modèle à une sous-famille depuis l’éditeur
- Sélection visuelle depuis la liste des modèles disponibles (plus d’UUID à copier-coller)
- Indique clairement si une sous-famille a un modèle ou non

### 🔁 Onglet dédié dans la page Stock

La page Stock possède maintenant un troisième onglet **Modèles** accessible directement, sans naviguer ailleurs.

### 🎯 Cas d’usage

- **Responsable stock** : Crée un modèle « Roulement à billes » avec diamètres int/ext et largeur
- **Technicien** : Saisit une nouvelle pièce en remplissant des champs guidés, la référence se génère toute seule
- **Gestionnaire** : Fait évoluer un modèle sans perdre les pièces déjà en stock

---

## 3.9.0 - 2026-03-01

Stabilité : **STABLE** ✅

### 📦 Module Stock Optimisé

Le module Stock est maintenant plus rapide et plus complet, avec une expérience utilisateur améliorée.

**Gestion des pièces plus efficace** :

- Affichage du fournisseur préféré pour chaque pièce
- Compteurs dynamiques des pièces avec et sans template
- Filtres famille/sous-famille avec visibilité des quantités
- Recherche rapide avec debounce intégré

**Gestion des familles simplifiée** :

- Recherche serveur dans les sous-familles (sans rechargement)
- Statistiques d'édition visibles (nombre de modèles utilisés)
- Édition rapide des sous-familles en 1 clic
- Interface deux colonnes pour navigation optimale

**Performance améliorée** :

- Une seule requête API pour charger toutes les données
- Compteurs calculés serveur (pas de ralentissement client)
- Réduction drastique des appels réseau
- Chargement plus rapide des listes longues

### 🔧 Optimisations Techniques

- Facettes serveur pour les compteurs de famille/sous-famille
- Modèles de fournisseurs intégrés dans la réponse API
- Gestion optimale des requêtes en attente
- Stabilité améliorée en environnement de développement

### 🎯 Cas d'usage

- **Préparateur** : Trouve rapidement le fournisseur principal en consultant le stock
- **Responsable stock** : Voit les statistiques de modèles utilisés par famille
- **Gestionnaire** : Édite les modèles de pièces sans quitter la vue d'ensemble

---

## 3.8.0 - 2026-02-26

Stabilité : **STABLE** ✅

### ✨ Améliorations de Fiabilité

Renforcement de la stabilité globale de l'application avec des correctifs et optimisations importants.

**Gestion des erreurs améliorée** :

- Messages d'erreur clairs et lisibles (pas de code technique)
- Affichage approprié des erreurs de connexion et d'authentification
- Gestion robuste des cas limites dans les hooks de données

**Performance optimisée** :

- Récupération des données plus efficace
- Réduction des appels API inutiles
- Chargement progressif des onglets équipement

**Stabilité V2 améliorée** :

- Corrections dans le composant Pagination (V2)
- Validation des props cohérente avec la v3
- Préparation pour la migration future vers V3

### 🔧 Correctifs

- Gestion correcte des types d'interventions (ancien format string + nouveau format objet)
- Filtrage et statistiques d'interventions corrigés
- Affichage des erreurs réseau approprié
- Synchronisation des états entre composants

---

## 3.7.0 - 2026-02-25

Stabilité : **STABLE** ✅

### 📊 Détail Équipement Amélioré

Accès détaillé à toutes les informations d'un équipement avec navigation simplifiée par onglets.

**Détail complet** :

- Informations générales (code, nom, classe, fabricant, numéro de série, date de mise en service)
- Santé de l'équipement en temps réel avec raison du statut
- Parent dans la hiérarchie avec lien de navigation

**Onglets intuitifs** :

- **Informations** : Données et paramètres de l'équipement
- **Interventions** : Toutes les interventions liées avec pagination
- **Éléments enfants** : Arborescence avec recherche et pagination
- **Statistiques** : Graphiques d'activité (nombre d'interventions par état/priorité)

**Navigation améliorée** :

- Chargement rapide des onglets (chargement à la demande)
- Pagination claire pour les listes longues
- Recherche dans les éléments enfants
- Rafraîchissement manuel avec bouton visible

### 🎯 Types d'Interventions Détaillés

Les types d'interventions sont maintenant affichés avec plus de détails :

- Code et label pour chaque type
- Amélioration de la lisibilité dans les listes
- Filtrage et statistiques plus précises

### 🔧 Améliorations Techniques

- Gestion des erreurs d'authentification plus claire
- Affichage des messages d'erreur lisibles (pas d'objets techniques)
- Support de la pagination jusqu'à 100 éléments par page
- Réduction de la charge serveur avec onglets paresseux

---

## 3.6.0 - 2026-02-24

Stabilité : **STABLE** ✅

### 🏭 Nouveau : Page Gestion des Équipements

Accès complet au parc équipements avec état de santé en temps réel.

**Liste des équipements** :

- Vue d'ensemble de tous les équipements avec indicateurs de santé (OK, Maintenance, Alerte, Critique)
- Recherche rapide par code ou nom
- Affichage de la classe d'équipement et de la hiérarchie parent/enfants
- Statistiques dans l'en-tête : total, nombre critique, alertes, maintenance

**Gestion des classes d'équipement** :

- CRUD complet des classes (SCIE, PONT, EXTRUDEUSE, etc.)
- Code unique et description pour chaque classe
- Dialog de création/modification intégrée

**Performance optimisée** :

- Cache interne des équipements pour navigation rapide
- Onglets synchronisés avec l'URL
- Design V2 entièrement conservé

### 🗂️ Restructuration du Menu

Le menu est maintenant mieux organisé par sections métier :

**Navigation** :

- Accueil

**Maintenance** :

- Interventions
- Équipements
- Préventif

**Stock** :

- Pièces
- Approvisionnements

**Production** :

- Charge technique
- Anomalies de saisie
- Qualité des données

Chaque section affiche ses pages dans l'ordre configuré, pour une navigation plus intuitive.

### 🔧 Architecture V3 Consolidée

- Système d'**auto-discovery** pour les pages : créer une page = créer son `.config.js`
- **Hooks partagés** pour les fonctionnalités communes (navigation onglets, notifications)
- Migration progressive des pages de la V2 → V3 (Équipements complètement migrée)
- API layer optimisée avec endpoints FastAPI

---

## 3.5.1 - 2026-02-24

Stabilité : **STABLE** ✅

### 🔧 Corrections et Améliorations

**Formulaire d'ajout d'actions amélioré** :

- Les catégories d'actions sont maintenant **regroupées visuellement** pour faciliter la sélection
- Chaque catégorie affiche sa couleur distinctive dans le menu déroulant
- Navigation plus intuitive parmi les sous-catégories

**Résolution des problèmes d'enregistrement** :

- Correction des erreurs empêchant la création de nouvelles actions
- Les informations du technicien sont maintenant correctement enregistrées
- Les facteurs de complexité s'affichent et se sauvegardent sans erreur
- Temps d'intervention calculé avec précision (quarts d'heure)

**Optimisations techniques** :

- Communication améliorée avec le serveur (nouveaux points d'accès API)
- Affichage cohérent des facteurs de complexité dans tout l'interface
- Correction des avertissements d'affichage internes

---

## 3.5.0 - 2026-02-24

Stabilité : **STABLE** ✅

### 🛒 Nouveau : Page Demande d'Achat

Accès rapide et simplifié pour créer des demandes d'achat de matériel.

**Page publique accessible sans connexion** :

- Créez une demande d'achat directement depuis le menu public
- Aucune authentification requise (comme la demande d'intervention)
- Idéal pour les équipes terrain ou les utilisateurs occasionnels

**Formulaire identique à la version précédente** :

- Interface conservée pour ne pas perturber vos habitudes
- Recherche d'article existant en stock
- Création de demande spéciale si article non référencé
- Champs : article, quantité, unité, urgence, demandeur

**Confirmation visuelle immédiate** :

- Résumé de la demande créée affiché pendant 1,5 seconde
- Badge "Demande spéciale" si hors catalogue
- Détails : libellé, quantité et unité
- Formulaire réinitialisé pour une nouvelle demande directement

**Bénéfices** :

- **Accessibilité** : Pas besoin de se connecter pour faire une demande
- **Rapidité** : Un seul écran, un seul formulaire
- **Simplicité** : Interface familière, aucune formation nécessaire
- **Flexibilité** : Référence stock ou demande libre au choix

---

## 3.4.0 - 2026-02-24

Stabilité : **STABLE** ✅

### 📊 Amélioration : Page Détail d'Intervention

Refonte complète de la page de détail d'intervention pour une meilleure productivité.

**Nouvelle organisation en 4 onglets** :

- **Actions** : Timeline visuelle des actions et changements de statut
- **Résumé** : Vue synthétique des indicateurs (temps, actions, achats)
- **Fiche PDF** : Visualisation et téléchargement du rapport d'intervention
- **Historique** : Journal chronologique complet

**Édition rapide dans la timeline** :

- Modifiez une action directement sans quitter la page
- Créez une demande d'achat depuis une action en un clic
- Visualisez immédiatement les demandes d'achat liées
- Supprimez une demande d'achat d'un simple bouton

**Identification visuelle renforcée** :

- Actions complexes (score > 5) encadrées en rouge pour alerte immédiate
- Couleurs adaptées selon le statut (ouvert, fermé, en attente)
- Affichage du technicien sur chaque changement de statut
- Badges visuels : catégorie, temps passé, complexité

**Timeline enrichie** :

- Ligne verticale colorée avec points par jour
- Regroupement automatique par date
- Recherche instantanée sur description, catégorie ou technicien
- Compteur dynamique visible sur l'onglet

**Changement de statut et priorité** :

- Dropdowns dans le header pour modifier rapidement
- Pas besoin d'ouvrir un formulaire séparé
- Changements enregistrés instantanément

**Fiche PDF intégrée** :

- Visualisation directe dans la page
- Téléchargement avec nom automatique (code intervention)
- Marquage "Fiche imprimée" persistant
- Chargement uniquement à l'ouverture de l'onglet (performance)

**Statistiques en un coup d'œil** :

- Temps total passé sur l'intervention
- Nombre d'actions réalisées
- Nombre de demandes d'achat liées
- Informations clés : code, type, priorité, signalement

**Rafraîchissement automatique** :

- Mise à jour silencieuse toutes les 30 secondes
- Travaillez en équipe sans recharger manuellement
- Visualisez les modifications des autres techniciens en temps réel

**Bénéfices** :

- **Productivité** : Tout se fait sur une seule page, pas de navigation inutile
- **Rapidité** : Édition inline, pas de formulaires lourds à ouvrir
- **Clarté** : Identification immédiate des actions critiques
- **Traçabilité** : Technicien visible sur chaque événement
- **Collaboration** : Auto-refresh pour travail en équipe fluide

---

## 3.3.0 - 2026-02-21

Stabilité : **STABLE** ✅

### 📋 Nouvelle fonctionnalité : Liste des Interventions

Nouvelle page de gestion des interventions accessible depuis le menu **Maintenance**.

**Organisation intelligente** :

- 4 blocs visuels : À faire maintenant, Bloqué, Projets/Support, À archiver
- Segmentation automatique selon le statut et la priorité
- Tri intelligent : priorité, fiches à imprimer, puis âge
- Badge d'âge visible uniquement si intervention urgente > 7 jours ou > 30 jours

**Fonctionnalités** :

- Recherche par code machine, code intervention ou mot-clé
- Affichage du code intervention, titre, machine, priorité, statut
- Blocs repliables pour meilleure lisibilité
- Bloc "À archiver" replié par défaut
- Accès direct au détail d'une intervention
- Rafraîchissement automatique toutes les 30 secondes

**Bénéfices** :

- Vision claire des interventions par urgence
- Priorisation facilitée du travail quotidien
- Identification rapide des interventions bloquées
- Séparation des projets long-terme du curatif urgent
- Diminution du temps de recherche

**Compatibilité** : Backend ≥ 1.0.0 requis

---

## 3.2.0 - 2026-02-21

Stabilité : **STABLE** ✅

### 🔍 Nouvelle fonctionnalité : Qualité des Données

Nouvelle page de contrôle qualité accessible depuis le menu **Production**.

**Détection automatique** :

- 13 règles de contrôle sur 4 entités (actions, interventions, stock, achats)
- Problèmes de complétude (champs manquants)
- Problèmes de cohérence (valeurs suspectes, incohérences temporelles)
- Classification par sévérité : Critique / Moyenne

**Interface** :

- Vue synthétique : Total problèmes, critiques, moyennes
- Filtres : Sévérité et type d'entité
- Détail par entité avec contexte (intervention, article, dates)
- Codes couleur par gravité
- Message de confirmation si aucun problème

**Bénéfices** :

- Détection précoce des erreurs de saisie
- Amélioration de la fiabilité des analyses
- Facilite la correction ciblée
- Maintien de la qualité des données dans le temps

**Compatibilité** : Backend ≥ 1.5.0 requis

---

## 3.1.0 - 2026-02-21

Stabilité : **STABLE** ✅

### 🎯 Nouvelle fonctionnalité : Service Status

Nouvelle page d'analyse accessible depuis le menu **Pilotage**.

**Indicateurs disponibles** :

- Taux de charge maintenance (capacité utilisée)
- Analyse de la fragmentation (actions courtes dispersantes)
- Capacité de pilotage (temps coordination/planification)
- Répartition du temps : Production / Dépannage / Pilotage / Fragmentation
- Top causes de fragmentation
- Consommation par site/atelier

**Interface** :

- Filtre de période personnalisable (défaut : 90 jours)
- Cartes KPI avec codes couleur (vert/orange/rouge)
- Alertes automatiques selon seuils
- Bouton de rafraîchissement

**Bénéfices** :

- Vision instantanée de la santé du service (vs calculs Excel manuels)
- Identification rapide des problèmes systémiques
- Aide à la décision basée sur données réelles
- Communication facilitée avec direction

**Compatibilité** : Backend ≥ 1.5.0 requis

---

## 3.0.1 - 2026-02-21

Stabilité : **en consolidation**

### Impact fonctionnel

Aucun changement visible pour l'utilisateur.

### Stabilisation / Dette technique

- Restructuration interne par domaine métier → réduit le risque de régression lors de l'ajout de nouvelles fonctionnalités
- Détection automatique des nouvelles pages → facilite l'extension du menu sans modification manuelle centralisée
- Documentation standardisée des processus de développement → limite les erreurs et améliore la cohérence entre fonctionnalités

### Composants / Modules concernés

- Pages : Accueil, Authentification
- Configuration du menu : système de détection automatique
- Documentation développeur : procédure de création de page standardisée
- Navigation : structure d'importation modernisée

### Points de vigilance

- Nettoyage manuel requis après migration (fichiers obsolètes à supprimer)
- Toute nouvelle page nécessite une déclaration de configuration pour apparaître dans le menu
- Les pages non configurées restent accessibles par URL mais invisibles dans la navigation

---

## 3.0.0 - 2026-02-20

Stabilité: **STABLE** ✅

### 🏗️ Refonte complète de l'architecture — Fondations solides pour l'avenir

#### **Version majeure : Restructuration technique interne**

Cette version marque une **étape importante** dans l'évolution de Tunnel GMAO. Le code de l'application a été entièrement réorganisé pour garantir que vos futures mises à jour arrivent plus vite, sans bugs, et avec moins de risques.

#### **Ce qui a changé pour vous**

**RIEN** : L'application fonctionne exactement comme avant du point de vue utilisateur.

- ✅ **Interface identique** : Tous vos écrans et fonctionnalités habituels sont là
- ✅ **Connexion améliorée** : Authentification plus sécurisée (cookies de session)
- ✅ **Aucune régression** : Pas de perte de fonctionnalité, même vitesse
- ✅ **Stabilité** : L'ancien code est conservé en sécurité si besoin

#### **Pourquoi cette refonte ?**

Imaginez une maison où les fils électriques, la plomberie et la charpente sont mélangés de partout. L'application V2 commençait à ressembler à ça : difficile d'ajouter de nouvelles fonctionnalités sans risquer de tout casser.

**La V3 c'est :**

- 🏗️ Une structure claire : chaque chose à sa place
- 🔒 Plus de sécurité : meilleures pratiques appliquées
- 🚀 Évolutions futures facilitées : nouveaux modules plus rapides à développer
- 🧪 Moins de bugs : code plus facile à tester et à vérifier

#### **Ce que ça change concrètement**

**À court terme** :

- Vous ne verrez rien de différent (c'est normal !)
- La connexion est plus sécurisée en arrière-plan
- Les futures corrections de bugs seront plus rapides à déployer

**À moyen terme** (prochaines versions) :

- Nouvelles fonctionnalités plus rapidement
- Interface plus fluide et réactive
- Moins de bugs lors des mises à jour
- Meilleure performance générale

#### **Aspects techniques pour les curieux**

- Nouvelle organisation du code (architecture V3)
- Authentification par cookie sécurisé (HttpOnly)
- Ancien code V2 conservé dans `/src/_v2/` pour référence
- Client HTTP modernisé avec gestion d'erreurs centralisée
- Documentation technique enrichie (ARCHITECTURE.md, CONVENTIONS.md)

#### **Validation de la version**

- ✅ Compilation réussie sans erreur
- ✅ Connexion testée et validée
- ✅ Toutes les fonctionnalités V2 préservées
- ✅ Documentation à jour

#### **Prochaines étapes**

Dans les versions 3.1, 3.2, etc., nous allons progressivement migrer chaque module (interventions, stock, achats...) vers cette nouvelle architecture. Vous verrez alors les bénéfices concrets : plus de fluidité, plus de fonctionnalités, moins de bugs.

**Transition en douceur** : Chaque module sera migré uniquement quand il sera prêt et testé. Pas de précipitation.

---

## 2.8.0 - 2026-02-20

Stabilité: STABLE

### Recherche et navigation ultra-rapides dans le stock

#### Ce qui a été amélioré

- **Recherche intelligente**: Quand vous tapez dans la barre de recherche, l'application attend que vous finissiez avant de chercher
  - Avant : L'application lançait 6+ recherches quand vous tapiez "ROULEMENT"
  - Après : 1 seule recherche après avoir fini de taper (gain de temps et moins de charge serveur)

- **Gestion des gros stocks**: Vous pouvez maintenant gérer plus de 100 références de pièces facilement
  - **Pagination ajoutée** : Naviguez entre les pages (25, 50, 100 ou 200 articles par page)
  - **Compteur précis** : "Affichage de 1-50 sur 156 pièces"
  - **Navigation rapide** : Passez d'une page à l'autre en un clic

- **Recherche dans l'URL** : Votre recherche apparaît maintenant dans l'adresse de la page
  - Exemple : `?search=roulement` s'affiche dans la barre d'adresse
  - Gardez vos recherches en favoris ou partagez des liens de recherche
  - Les boutons Précédent/Suivant du navigateur fonctionnent avec la recherche

- **Recherche partout** : La recherche côté serveur fonctionne maintenant dans tous les formulaires
  - Demandes d'achat : trouvez rapidement la pièce que vous cherchez
  - Détail machine : recherche optimisée parmi tous les articles
  - Plus d'informations complètes affichées pour chaque résultat

#### Ce qui a été corrigé

- **Erreur technique résolue** : Correction de l'erreur "items.filter is not a function" qui bloquait certains formulaires
- **Affichage fluide** : Les lettres ne disparaissent plus quand vous tapez dans la recherche
- **Résultats complets** : Toutes les informations des pièces s'affichent correctement (désignation, quantité, unité, etc.)

#### Résultat pour vous

- ✅ **Recherche ultra-rapide** : Réponse immédiate, moins d'appels au serveur
- ✅ **Stocks volumineux** : Gérez facilement des centaines de références
- ✅ **Navigation moderne** : Pagination claire et intuitive
- ✅ **Meilleure expérience** : Plus fluide, plus réactif, plus agréable à utiliser
- ✅ **Partage facile** : Partagez des liens de recherche avec vos collègues

---

## 2.7.4 - 2026-02-19

Stabilité: STABLE

### Module Achats de nouveau opérationnel

#### Ce qui a été corrigé

- **Connexion au serveur**: L'application communique maintenant correctement avec le serveur pour tout ce qui concerne les achats
  - Les demandes d'achat s'affichent de nouveau
  - Les commandes fournisseurs sont accessibles
  - Les statistiques d'achats se chargent correctement

#### Résultat pour vous

- ✅ **Achats fonctionnels**: Le module Achats/Approvisionnement fonctionne à nouveau normalement
- ✅ **Plus de messages d'erreur**: Les erreurs 404 (page introuvable) dans les achats ont disparu
- ✅ **Données visibles**: Vous pouvez consulter vos demandes d'achat et commandes fournisseurs

---

## 2.7.3 - 2026-02-19

Stabilité: STABLE

### L'application est maintenant 2 fois plus rapide

#### Ce qui a été amélioré

- **Chargement plus rapide**: Quand vous ouvrez une famille de pièces, tout s'affiche maintenant instantanément
  - Avant : L'application chargeait les mêmes informations plusieurs fois (2 à 4 fois)
  - Après : Chargement une seule fois, même si vous cliquez rapidement

- **Plus de ralentissements**: Quand vous ouvrez l'onglet Familles, l'application ne charge plus les templates en double
  - Avant : Les templates se chargeaient 2 fois (une fois = attente doublée)
  - Après : Chargement unique = moitié moins d'attente

- **Interface plus réactive**:
  - Animation de chargement avec message clair ("Chargement des familles...", "Chargement des sous-familles...")
  - Plus de scintillement ou de sauts d'écran
  - L'application répond tout de suite quand vous cliquez

#### Résultat pour vous

- ✅ **Gain de temps**: Ouverture des familles 2 fois plus rapide
- ✅ **Expérience fluide**: Plus d'attente ou de saccades
- ✅ **Plus agréable**: L'application ne "rame" plus comme avant
- ✅ **Moins d'erreurs**: Plus de messages bizarres dans les outils de développement

---

## 2.7.2 - 2026-02-19

Stabilité: STABLE

### Corrections importantes et améliorations de l'affichage des templates

#### Ce qui a été corrigé

- **Affichage des sous-familles**: Chaque famille affiche maintenant uniquement ses propres sous-familles (correction du bug où toutes les sous-familles apparaissaient partout)
- **Modification des templates**: Quand vous modifiez le template d'une sous-famille, seule cette famille se met à jour (et non toutes les familles)
- **Chargement optimisé**: Les informations se chargent maintenant plus rapidement et de manière plus fiable

#### Nouvelles fonctionnalités - Visualisation des templates

Quand vous consultez vos familles de pièces, vous pouvez maintenant voir tous les détails des templates :

- **Informations du template affichées directement**:
  - Nom du template avec sa version (exemple : "Roulement standard v1")
  - Modèle de référence (exemple : `{DIAM_INT}x{DIAM_EXT}x{LARG}` → génère "25x52x15")
- **Nouveau bouton "Schéma"**: Cliquez pour voir tous les champs du template
  - **Nom technique** du champ (ex: `DIAM_INT`)
  - **Description** en clair (ex: "Diamètre intérieur")
  - **Type** de donnée (nombre, texte, liste de choix)
  - **Unité** si applicable (ex: "mm")
  - **Champs obligatoires** clairement indiqués
  - **Valeurs possibles** pour les listes de choix (ex: "Inox A2, Acier zingué")

#### Exemple d'utilisation

Vous consultez la famille "Roulements" :

1. Cliquez sur la famille pour voir ses sous-familles
2. Vous voyez "Roulement à billes" lié au template "Roulement standard v1"
3. Cliquez sur "Schéma (3)" pour voir les 3 champs :
   - **DIAM_INT** : Diamètre intérieur (nombre en mm) - obligatoire
   - **DIAM_EXT** : Diamètre extérieur (nombre en mm) - obligatoire
   - **LARG** : Largeur (nombre en mm) - obligatoire

#### Améliorations techniques

- **Chargement intelligent**: Les sous-familles ne se chargent que quand vous ouvrez une famille
- **Moins d'attente**: Toutes les informations (template + schéma) se chargent en une seule fois
- **Plus fiable**: Les données sont maintenant chargées depuis le nouveau système (plus stable et plus rapide)

#### Impact utilisateur

- ✅ **Plus claire**: Vous voyez exactement quels champs sont nécessaires pour créer une pièce
- ✅ **Plus rapide**: Les informations se chargent instantanément
- ✅ **Plus fiable**: Fini le bug où toutes les sous-familles s'affichaient partout
- ✅ **Meilleure compréhension**: Le schéma des templates est maintenant visible et compréhensible

---

## 2.7.1 - 2026-02-17

Stabilité: STABLE

### Optimisations de performance et correction du mapping des templates

#### Ce qui a été corrigé

- **Édition des templates de pièces**: Les champs des templates s'affichent maintenant correctement lors de l'édition
- **Mapping API corrigé**: Les données du serveur (key, field_type) sont correctement converties vers le format frontend (field_key, type)
- **Adapter utilisé**: L'adaptateur avec mapper intégré est maintenant utilisé pour toutes les opérations sur les templates

#### Optimisations majeures

- **Lazy loading des sous-familles**: Les sous-familles ne se chargent plus toutes au démarrage mais uniquement quand vous cliquez pour les afficher
  - Réduction de **90-95% des requêtes** au chargement de l'onglet Familles
  - Affichage "Chargement..." pendant la récupération des données
  - Cache intégré: les données chargées ne sont pas rechargées

- **Rendu conditionnel des onglets**: Seul l'onglet actif est maintenant rendu dans la page Pièces
  - Réduction de **80% du nombre de composants** montés simultanément
  - Les composants des onglets non visibles ne s'exécutent plus en arrière-plan

- **Auto-refresh intelligent**: Le rafraîchissement automatique (30s) ne se déclenche que sur les onglets pertinents
  - Actif uniquement sur les onglets Pièces et Fournisseurs
  - Désactivé sur les onglets Familles, Fabricants et Templates

- **Correction des boucles infinies**: Les useEffect avec dépendances cycliques ont été corrigés
  - Les données ne se rechargent plus en boucle
  - Chargement unique au montage des composants

#### Impact utilisateur

- **Performances**: Page Pièces beaucoup plus rapide, surtout au changement d'onglet
- **Réduction de charge réseau**: Moins de requêtes HTTP inutiles (jusqu'à 95% de réduction sur l'onglet Familles)
- **Édition fonctionnelle**: Les templates de pièces peuvent maintenant être édités correctement
- **Interface plus réactive**: Navigation fluide entre les onglets sans ralentissement

#### Amélioration technique

- Implémentation du pattern lazy loading pour les données hiérarchiques
- Rendu conditionnel des composants au lieu de masquage CSS
- Élimination des re-renders inutiles via optimisation des dépendances useEffect
- Utilisation systématique des adapters avec mapping pour cohérence des données

---

## 2.7.0 - 2026-02-16

Stabilité: STABLE

### Nouvelle fonctionnalité : Caractérisation normalisée des pièces

#### Ce qui arrive

- **Templates de pièces**: Créez des modèles pour structurer vos références de pièces selon des caractéristiques techniques
- **Génération automatique de références**: Les références internes sont générées automatiquement à partir des caractéristiques que vous saisissez
- **Normalisation des références**: Toutes les pièces d'un même type suivent le même format de référence (exemple : M8x40-INOX, M10x50-ACIER)

#### Comment ça fonctionne

1. **Créez un template** (exemple : "VIS")
   - Définissez un pattern : `M{DIAM}x{LONG}-{MAT}`
   - Ajoutez les champs : DIAM (nombre), LONG (nombre), MAT (liste de valeurs)

2. **Associez-le à une sous-famille de pièces**
   - Le template s'applique à toutes les nouvelles pièces de cette sous-famille

3. **Créez vos pièces**
   - Renseignez les caractéristiques (diamètre: 8, longueur: 40, matériau: INOX)
   - La référence est générée automatiquement : "M8x40-INOX"

#### Avantages

- **Cohérence**: Toutes les références suivent le même format
- **Recherche facilitée**: Trouvez rapidement une pièce par ses caractéristiques
- **Gainé de temps**: Plus besoin d'inventer manuellement des codes de référence
- **Évolutivité**: Faites évoluer vos templates sans impacter les pièces existantes (versionnement)

#### Où trouver cette fonctionnalité

- **Onglet "Templates"** dans la page Pièces
- Créez, modifiez ou supprimez vos templates
- Visualisez les champs et le pattern de génération

#### Note importante

- Les templates sont versionnés : modifier un template crée une nouvelle version
- Les pièces existantes conservent la version de template utilisée lors de leur création
- Cette fonctionnalité nécessite la mise à jour du serveur (version 1.4.0 minimum)

---

## 2.6.1 - 2026-02-15

Stabilité: STABLE

### Corrections d'affichage sur la frise temporelle

#### Ce qui a été corrigé

- **Labels de statut visibles**: Les noms des statuts (Ouvert, Fermé, Attente pièces, etc.) s'affichent correctement dans la frise temporelle
- **Couleurs restaurées**: Les changements de statut sont à nouveau colorés selon leur type
- **Affichage simplifié**: Les heures ont été retirées pour une lecture plus claire
- **Identification des techniciens**: Le nom complet du technicien apparaît maintenant sur chaque action

#### Impact utilisateur

- Meilleure lisibilité de l'historique des interventions
- Identification immédiate de qui a réalisé chaque action
- Vue chronologique plus épurée et professionnelle

#### Mise à jour nécessaire

- Cette version nécessite la version 1.10.0 du serveur
- Contactez votre administrateur si les noms de techniciens n'apparaissent pas

---

## 2.6.0 - 2026-02-15

Stabilité: STABLE

### Amélioration des fiches PDF d'intervention

#### Ce qui a changé

- **Chargement plus rapide**: Les fiches d'intervention en preview s'affichent plus rapidement
- **Messages d'erreur améliorés**: Si une fiche ne peut pas être chargée, vous recevez un message clair indiquant le problème
- **Configuration simplifiée**: Un seul serveur gère maintenant toutes les fonctionnalités (interventions et exports)

#### Impact utilisateur

- Aucun changement visible dans votre utilisation quotidienne
- Les exports PDF fonctionnent exactement comme avant
- Connexion plus fiable lors de l'affichage des fiches

#### Mise à jour nécessaire

- Cette version nécessite une mise à jour du serveur (version 1.8.0)
- Contactez votre administrateur si les fiches PDF ne s'affichent plus correctement

---

## 2.5.0 - 2026-02-11

Stabilité: STABLE

### Nouvelle page : Qualité des données

#### Ce qui a changé

- **Contrôle de la qualité de vos données**: Nouvelle page qui vérifie automatiquement si vos données sont complètes et cohérentes
- **13 vérifications sur vos données principales**:
  - **Actions d'intervention** (7 vérifications): détecte les actions sans temps saisi, sans technicien, avec description vide, sur intervention déjà fermée, etc.
  - **Interventions** (3 vérifications): interventions fermées sans aucune action, sans type défini, ou en cours mais inactives
  - **Articles de stock** (2 vérifications): articles sans seuil minimum ou sans fournisseur
  - **Demandes d'achat** (1 vérification): demandes non liées à un article de stock
- **Filtres pratiques**: Affichez uniquement les problèmes critiques ou ceux d'une catégorie spécifique
- **Vue d'ensemble**: Nombre total de problèmes et répartition par niveau d'urgence
- **Corrections facilitées**: Chaque problème affiche combien d'éléments sont concernés avec des exemples pour les retrouver

#### Modifications importantes

- **Pages temporairement masquées**: Deux pages ne sont plus accessibles jusqu'à nouvelle version du serveur
  - "Charge technique" - en attente de mise à jour serveur
  - "Anomalies de saisie" - en attente de mise à jour serveur
  - Ces pages reviendront dans une prochaine version

#### Impact utilisateur

- Nouvelle entrée "Qualité des données" dans le menu (icône base de données)
- Vérifiez facilement si vos données sont complètes
- Corrigez les problèmes grâce aux exemples fournis
- Deux anciennes pages sont temporairement indisponibles

#### Mise à jour nécessaire

- Cette version nécessite une mise à jour du serveur (version 1.7.0)
- Contactez votre administrateur si vous ne voyez pas la nouvelle page

---

## 2.4.0 - 2026-02-09

Stabilité: STABLE

### Nouvelle page : Anomalies de saisie

#### Ce qui a changé

- **Contrôle qualité des actions**: Nouvelle page dédiée à l'analyse des anomalies dans la saisie des actions de maintenance
- **6 types d'anomalies détectées**:
  - Actions répétitives (même catégorie/machine répétée trop souvent)
  - Actions fragmentées (trop de micro-actions courtes)
  - Durées anormales (temps incohérent avec la catégorie)
  - Classifications douteuses (mots-clés incohérents)
  - Actions consécutives (même technicien avec saisies très rapprochées)
  - Charge faible valeur (temps cumulé élevé sur des tâches à faible valeur)
- **Vue synthétique**: Cartes récapitulatives par niveau de sévérité
- **Suppression de l'ancienne page Actions**: Remplacée par cette nouvelle analyse plus pertinente

#### Impact utilisateur

- Nouvelle entrée "Anomalies saisie" dans le menu
- Identifiez rapidement les problèmes de qualité de données
- Toutes les règles et seuils proviennent du serveur

#### Prérequis

- **Serveur backend v1.6.0 minimum requis** — nouvel endpoint `/stats/anomalies-saisie`

---

## 2.3.1 - 2026-02-09

Stabilité: STABLE

### Charge technique : amélioration de l'affichage

#### Ce qui a changé

- **Détail par classe simplifié**: Présentation plus légère des informations lors du dépliage
- **Style harmonisé**: Meilleure cohérence visuelle avec le reste de l'application

#### Impact utilisateur

- Interface plus sobre et lisible
- Même information, présentation plus claire

---

## 2.3.0 - 2026-02-09

Stabilité: STABLE

### Nouvelle page : Charge technique

#### Ce qui a changé

- **Nouvelle page d'analyse**: Visualisez la répartition du temps de maintenance entre dépannage et travail constructif
- **Indicateur de dépannage évitable**: Identifiez la part du temps de dépannage qui pourrait être évitée (standardisation, conception, méthodes)
- **Répartition par cause**: Tableau détaillé par facteur de complexité avec label et catégorie depuis l'API
- **Analyse par classe d'équipement**: Comparez les charges entre types de machines
  - **Détail expandable** : cliquez une ligne pour voir la ventilation du temps évitable
  - **Causes principales** : top 3 des facteurs de complexité par classe
  - **Recommandation d'action** : conseil concret fourni par le serveur
- **Guide de lecture dynamique**: Objectifs, seuils et recommandations fournis directement par le serveur

#### Impact utilisateur

- Nouvelle entrée "Charge technique" dans le menu
- Aide à la décision : où investir pour réduire le temps de dépannage
- Interface entièrement pilotée par les données serveur (pas de constantes codées en dur)

#### Prérequis

- **Serveur backend v1.5.1 minimum requis** — nouvel endpoint `/stats/charge-technique` enrichi

---

## 2.2.0 - 2026-02-08

Stabilité: STABLE

### Mise à jour de compatibilité serveur

#### Ce qui a changé

- **Adaptation au nouveau serveur**: L'application communique maintenant avec la version 1.4.0 du serveur backend
- **Facteurs de complexité**: Les informations de complexité des actions sont correctement envoyées et reçues
- **Classes d'équipements**: L'affichage des catégories d'équipements fonctionne avec la nouvelle API

#### Impact utilisateur

- Aucun changement visible dans l'interface
- L'application fonctionne normalement avec le serveur mis à jour

#### Prérequis

- **Serveur backend v1.4.0 minimum requis** — contactez votre administrateur si vous rencontrez des erreurs

---

## 2.1.14 - 2026-02-07

Stabilité: STABLE

### Interventions: chargement et stabilité

#### Ce qui a changé

- **Ouverture du détail plus fiable**: l’écran d’intervention s’affiche sans attente inutile
- **Moins d’appels en arrière-plan**: réduction des rafraîchissements non nécessaires
- **Stabilité renforcée**: meilleure tenue lors des ouvertures/retours rapides

#### Impact utilisateur

- Détail d’intervention affiché immédiatement
- Réduction des requêtes inutiles vers le backend

---

## 2.1.13 - 2026-02-07

Stabilité: STABLE

### Approvisionnement: améliorations et correctifs

#### Ce qui a changé

- **Bandeau de dispatch clarifié**: présentation plus nette des résultats et des actions
- **Onglets fournisseurs simplifiés**: affichage plus homogène et lisible
- **Demandes d'achat harmonisées**: comportement unifié entre demandes actives et archivées
- **Outil de recalcul retiré**: l’option n’est plus proposée car elle n’était pas utile au quotidien
- **Changement de statut fiabilisé**: moins d’erreurs lors des transitions

#### Impact utilisateur

- Interface plus claire
- Actions plus fiables sur les paniers

---

## 2.1.12 - 2026-02-06

Stabilité: STABLE

### Intégration API et dispatch automatique

#### Ce qui a changé

- **Dispatch automatique**: Nouvelle fonctionnalité de dispatch automatique des demandes d'achat prêtes (statut PENDING_DISPATCH) vers les paniers fournisseurs via l'API
- **Statistiques optimisées**: Les compteurs des onglets utilisent maintenant les statistiques de l'API au lieu de calculs locaux
- **Endpoint API**: Intégration du nouvel endpoint `/purchase_requests/dispatch` et `/purchase_requests/stats`
- **Fix mapper**: Correction du mapper de références fournisseurs pour accepter le format snake_case conforme à l'API
- **Statuts conformes**: Utilisation des statuts dérivés de l'API (TO_QUALIFY, NO_SUPPLIER_REF, PENDING_DISPATCH, OPEN, etc.)

#### Impact utilisateur

- Bouton de dispatch visible automatiquement quand des demandes sont prêtes
- Compteurs de badges plus précis et performants
- Création de références fournisseurs fonctionnelle
- Workflow d'approvisionnement plus fluide

---

## 2.1.11 - 2026-02-06

Stabilité: STABLE

### Optimisations de performance

#### Ce qui a changé

- **Chargement optimisé**: Les demandes d'achat ne se chargent que lorsque nécessaire (onglet Résumé)
- **Compteurs efficaces**: Le nombre de demandes s'affiche sans charger toutes les données
- **En-tête toujours visible**: L'en-tête de la page reste affiché même pendant le chargement
- **Données complètes**: Les demandes d'achat liées aux actions incluent maintenant tous les détails

#### Impact utilisateur

- Pages plus rapides à l'ouverture
- Meilleure réactivité de l'interface
- Navigation plus fluide entre les onglets

---

## 2.1.10 - 2026-02-06

Stabilité: STABLE

### Améliorations générales

#### Ce qui a changé

- **Demandes d’achat par action**: Les demandes liées sont à nouveau visibles dans la vue des actions
- **Données plus cohérentes**: Les listes utilisées dans les formulaires se chargent sans interruption

#### Impact utilisateur

- Vue action plus complète
- Expérience plus fluide

---

## 2.1.9 - 2026-02-05

Stabilité: STABLE

### Améliorations générales

#### Ce qui a changé

- **Création d’interventions**: L’application utilise la nouvelle API sans blocage
- **Listes d’actions**: Les catégories et sous-catégories se chargent correctement

#### Impact utilisateur

- Création d’intervention plus fiable
- Chargement plus fluide des listes

---

## 2.1.8 - 2026-02-04

Stabilité: STABLE

### Améliorations des demandes d'achat

#### Ce qui a changé

- **Détails visibles**: Les lignes de commande s’affichent correctement dans le détail des demandes
- **Affichage plus clair**: 3 situations distinctes (à qualifier, sans référence fournisseur, déjà dispatchée)
- **Statut fiable**: Le statut affiché correspond exactement à celui fourni par l’API

#### Impact utilisateur

- Accès immédiat aux informations utiles
- Moins de confusion sur l’état des demandes

---

## 2.1.7 - 2026-02-04

Stabilité: STABLE

### Corrections d'erreurs d'hydration

#### Ce qui a changé

- **Erreurs d'hydration corrigées**: Résolution des erreurs causées par des balises HTML imbriquées incorrectement dans les composants de la page Service Status
- **FragmentationCausesList corrigé**: Remplacement de `<Text as="p">` par `<Text as="span">` à l'intérieur du composant `Callout.Text`
- **SiteConsumptionTable corrigé**: Remplacement de `<Box as="p">` par `<Text as="span">` à l'intérieur du composant `Callout.Text`

#### Amélioration technique

- Élimination des erreurs de console liées aux balises `<p>` imbriquées dans `<p>`
- Élimination des erreurs de console liées aux balises `<div>` imbriquées dans `<p>`
- Conformité HTML améliorée et rendu côté serveur plus stable

#### Impact utilisateur

- Aucun changement visuel dans l'interface
- Page Service Status plus stable et sans erreurs de console
- Amélioration de la qualité du code

---

## 2.1.6 - 2026-02-01

Stabilité: STABLE

### Refonte complète de la documentation métier

#### Ce qui a changé

- **Documentation accessible à tous**: Le document REGLES_METIER.md a été entièrement réécrit pour être compréhensible par tous (techniques et non-techniques)
- **Système de stock clarifié**: Documentation du système crédit/dette (prise de pièce puis reconstitution via achat)
- **Workflow d'achat détaillé**: Ajout de la qualification des demandes, des références fournisseur et du cycle de vie des paniers
- **Suppression des concepts abandonnés**: Retrait du concept de sous-tâches qui n'est plus d'actualité

#### Nouveaux concepts documentés

- **Demandes d'achat qualifiées**: Processus de normalisation des nouvelles références
- **Références fournisseur et fabricant**: Liaison entre références internes et externes
- **Paniers fournisseur avec cycle de vie**: États critiques (taille, âge, urgence) et statut ASK
- **Exemples concrets**: Deux scénarios complets illustrant les workflows réels

#### Impact utilisateur

- Documentation beaucoup plus claire et accessible
- Meilleure compréhension des processus métier
- Exemples pratiques pour se former
- Alignement complet entre documentation et système réel

### Nettoyage du code inutilisé

#### Ce qui a été fait

- **Composants machine supprimés**: 8 composants non utilisés retirés du dossier components/machine
- **Hooks supprimés**: 4 hooks obsolètes retirés (useFilters, useRefresh, useMachineStats, useExportAPI)
- **Références nettoyées**: Commentaires obsolètes supprimés dans MachineDetail.jsx et ErrorNotification.jsx

#### Amélioration technique

- Réduction de la taille du code source
- Simplification de la maintenance
- Élimination de code mort

#### Impact utilisateur

- Application plus légère et plus rapide
- Aucun changement visible dans l'interface
- Base de code plus propre pour les futures évolutions

---

## 2.1.5 - 2026-01-29

Stabilité: STABLE

### Amélioration de la création d'actions

#### Ce qui a changé

- **Formulaire d'action amélioré**: L'ajout d'actions sur les interventions est plus rapide et plus fiable
- **Facteurs de complexité fonctionnels**: Vous pouvez maintenant sélectionner les facteurs de complexité sans erreur
- **Chargement optimisé**: Les données du formulaire se chargent plus rapidement

#### Amélioration technique (invisible pour vous)

- Migration vers une nouvelle architecture interne pour gérer les actions
- Résolution de problèmes de communication avec le serveur
- Correction de bugs d'affichage dans le formulaire

#### Impact utilisateur

- Le formulaire d'ajout d'action fonctionne maintenant parfaitement avec tous les champs
- Plus d'erreur lors de l'ouverture du formulaire
- Les actions sont enregistrées plus rapidement
- Tout le reste continue de fonctionner normalement

### Mise à jour de la documentation

- **Documentation métier mise à jour**: Le document REGLES_METIER.md est maintenant conforme à l'implémentation réelle
- **Ajout de détails techniques**: Nouveaux formats de données documentés pour les développeurs
- **Clarification des concepts**: Les facteurs de complexité sont maintenant documentés
- **Correction des exemples**: Tous les exemples utilisent le bon format de code d'intervention (INT-YYYYMMDD-NNN)

---

## 2.1.4 - 2026-01-28

Stabilité: STABLE

### Optimisation de l'affichage des interventions

#### Ce qui a changé

- **Liste des interventions allégée**: Les fiches déjà imprimées et archivées ne sont plus chargées automatiquement
- **Chargement plus rapide**: La page se charge beaucoup plus vite car elle ne récupère que les interventions actives
- **Performance améliorée**: Moins de données à afficher = navigation plus fluide

#### Amélioration technique (invisible pour vous)

- Ajout d'un filtre `printed=false` au niveau de l'API pour exclure les interventions archivées
- Le tri et le filtrage se font maintenant côté serveur au lieu du navigateur
- Réduction de la quantité de données transférées du serveur vers votre appareil

#### Impact utilisateur

- La page "Interventions" s'ouvre instantanément, même avec un historique volumineux
- Vous ne voyez que les interventions qui nécessitent encore votre attention
- Les interventions déjà imprimées (donc traitées et archivées) ne polluent plus l'affichage
- Navigation et recherche beaucoup plus rapides

---

## 2.1.3 - 2026-01-28

Stabilité: STABLE

### Nettoyage et consolidation du code

#### Ce qui a été fait

- **Nettoyage du code interne**: Suppression de fonctionnalités non utilisées pour alléger l'application
- **Simplification de la structure**: Retrait de composants et de hooks obsolètes qui n'étaient plus nécessaires
- **Optimisation de la taille**: L'application est maintenant plus légère et plus rapide à charger

#### Amélioration technique (invisible pour vous)

- Suppression de 8 composants machines qui n'étaient plus utilisés depuis la version 2.1.0
- Retrait de 4 hooks inutilisés (gestion d'exports, filtres, statistiques et rafraîchissement automatique)
- Mise à jour de la documentation interne pour refléter la nouvelle architecture
- Allègement du menu de navigation

#### Impact utilisateur

- Application plus rapide au démarrage
- Moins de code = moins de risques de bugs
- Aucun changement visible dans l'interface : tout fonctionne comme avant, en mieux
- Préparation pour les futures évolutions avec une base de code plus propre

---

## 2.1.2 - 2026-01-27

Stabilité: STABLE

### Corrections d'affichage et optimisations

#### Ce qui a été corrigé

- **Historique des interventions**: Les changements de statut apparaissent maintenant dans la chronologie
- **Page État du service**: Se charge correctement sans message d'erreur
- **Affichage des données**: Les informations se chargent plus rapidement

#### Amélioration technique (invisible pour vous)

- Les détails d'une intervention se chargent en une seule fois (au lieu de deux chargements successifs)
- Suppression des doublons dans la façon de récupérer les informations
- Nettoyage du code inutilisé pour alléger l'application

#### Impact utilisateur

- Navigation plus fluide : cliquer sur une intervention affiche tout immédiatement
- Page "État du service" fonctionne sans erreur
- L'historique complet des statuts est visible dès l'ouverture d'une intervention
- Pas de ralentissement lors de la consultation des statistiques

---

## 2.1.1 - 2026-01-26

Stabilité: STABLE

### Corrections et consolidation

#### Ce qui a été corrigé

- **Page équipements**: Les interventions s'affichent maintenant correctement
- **Détails équipement**: Requêtes API optimisées, pas de boucles inutiles
- **Affichage tableau**: Utilisation cohérente des composants communs (en ligne avec le reste de l'app)
- **Gestion des erreurs**: Messages d'erreur API plus clairs

#### Amélioration technique (invisible pour vous)

- Restructuration des appels API pour plus de fiabilité
- Code nettoyé et simplifié (moins de lignes, plus clair)
- Meilleure cohérence dans la façon d'appeler l'API tunnel-backend

#### Impact utilisateur

- Navigation plus fluide entre la liste et le détail des équipements
- Pas de ralentissement lors du chargement d'un équipement
- Moins de risques d'erreur lors de la consultation des interventions

---

## 2.1.0 - 2026-01-25

Stabilité: STABLE

### Nouvelle page Équipements - Parc optimisé

#### Ce que vous pouvez faire maintenant

- Consulter la liste complète des équipements avec vue d'ensemble de leur santé (ok, maintenance, alerte, critique)
- Filtrer rapidement par code ou nom d'équipement
- Cliquer sur un équipement pour voir:
  - Toutes ses interventions (passées et actuelles)
  - Son parent et ses enfants (hiérarchie complète)
  - Ses statistiques d'interventions (par statut et priorité)
- Voir instantanément si un équipement a des problèmes via le badge santé coloré

#### Améliorations de performance

- Les pages se chargent beaucoup plus rapidement (cache local des équipements)
- Pas de ralentissements lors de la navigation entre équipements
- Les statuts reflètent EXACTEMENT votre configuration serveur (zéro données hardcodées)

#### Impact métier

- Les techniciens ont une vue claire de l'état du parc
- Moins de confusion sur les statuts (une seule source de vérité)
- Accès rapide à l'historique d'un équipement sans rechargement

#### Suppression

- Ancienne page Machines (remplacée par Équipements)
- Tous les composants machines associés

---

## 2.0.0 - 2026-01-25

Stabilité: BETA (architecture backend)

### Décisions prises au backend - Fiabilité accrue

#### Ce qui a changé pour vous

- Les statuts équipements (ok/maintenance/alerte/critique) sont maintenant calculés par le serveur
- Les statistiques d'interventions sont toujours à jour (générées automatiquement)
- Les statuts d'intervention proviennent de votre configuration serveur (pas hardcodés)

#### Avantage utilisateur

- Plus de synchronisation manuelle frontend/backend
- Affichage fiable et cohérent partout dans l'app
- Moins de bugs liés à des données désynchronisées

---

## 1.11.7 - 2026-01-22

Stabilité: STABLE

### Corrections Procurement

- Export CSV fonctionne correctement
- Interface nettoyée et plus rapide

## 1.11.6 - 2026-01-21

Stabilité: STABLE

### Demandes d'achat - Affichage unifié

- Les demandes d'achat s'affichent de manière cohérente partout (Procurement et détails interventions)
- Les numéros de paniers sont visibles sur toutes les demandes
- Chargement optimisé (1 requête au lieu de 116)

## 1.11.5 - 2026-01-21

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Détection fiable des lignes jumelles (même DA chez plusieurs fournisseurs)
- Badge jumelles affiche uniquement les lignes sélectionnées en conflit
- Validation bloquante si ligne jumelle déjà commandée (CLOSED/RECEIVED/ACK/CANCELLED)

### 🧱 Stabilisation / Dette technique

- Centralisation logique de détection des jumelles via `extractTwinLinesForLine()`
- Groupement par `purchase_request.id` comme clé de détection
- Filtrage strict sur `is_selected=true` pour éviter faux positifs
- Synchronisation badge/hook de validation pour cohérence affichage

### 🧩 Composants / Modules concernés

- src/components/purchase/orders/OrderLineTable/helpers.js (extractTwinLinesForLine)
- src/hooks/useTwinLinesValidation.js
- src/components/purchase/orders/TwinLinesValidationAlert/

### ⚠️ Points de vigilance

- Nécessite vidage cache PWA pour voir changements (service worker)
- Validation stricte : impossible de sélectionner si jumelle en statut fermé

## 1.11.4 - 2026-01-20

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Les statuts de vos demandes d'achat sont toujours à jour

### 🧱 Stabilisation / Dette technique

- Dérivation automatique du statut depuis les commandes fournisseurs → suppression des incohérences
- Sécurisation des transitions de statut avec documentation lifecycle verrouillée
- Correction du calcul de statut multi-fournisseur → seules les lignes sélectionnées comptent

### 🧩 Composants / Modules concernés

- src/lib/purchasing/purchaseRequestStatusUtils.js (nouveau)
- src/lib/purchasing/orderReceptionUtils.js (nouveau)
- src/lib/purchasing/lineCalculationUtils.js (nouveau)
- src/pages/Procurement.jsx
- src/components/purchase/requests/purchaseRequestRow.helpers.jsx
- src/lib/api/adapters/directus/stock/datasource.ts
- src/lib/api/adapters/directus/stock/mapper.ts
- docs/features/SUPPLIER_ORDER_LIFECYCLE.md (nouveau)
- docs/tech/PURCHASE_REQUEST_STATUS_REFACTOR.md (nouveau)
- db/schema/migrations/20260120_add_trigger_update_purchase_on_order_received.sql (nouveau)

### ⚠️ Points de vigilance

- Le champ `purchase_request.status` en base sera progressivement déprécié au profit de la dérivation
- Handlers de changement de statut manuel (handleStatusChange) supprimés du code frontend
- La réception automatique via trigger DB nécessite PostgreSQL (testé en dev uniquement)

## 1.11.3 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Le statut des paniers commandés peut être clôturé (dropdown déverrouillée en ORDERED/RECEIVED)

### 🧱 Stabilisation / Dette technique

- Verrouillage limité aux paniers clôturés (CLOSED), maintien du lock sur les lignes

### ⚠️ Points de vigilance

- Les lignes restent non éditables en statut ORDERED/RECEIVED (logique métier conservée)

## 1.11.2 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Sélection des lignes de commande dans les paniers fournisseurs persistée correctement

### 🧱 Stabilisation / Dette technique

- Patch de sélection : fallback sur les lignes chargées localement lors du toggle

### ⚠️ Points de vigilance

- Vérifier le statut RECEIVED après sélection : au moins une ligne doit être cochée

## 1.11.1 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Correction : ajout de référence fournisseur fonctionne correctement

## 1.11.0 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Gestion des catégories et sous-catégories d'actions disponible dans l'onglet Actions
- Version du logiciel affichée dynamiquement dans le titre de la page
- Palette de couleurs étendue avec 50 nuances pour personnalisation avancée

### 🧱 Stabilisation / Dette technique

- Refactoring enrichissement client-side des sous-catégories pour résoudre erreur permissions Directus
- Extension COLOR_PALETTE avec variations de tons (primaryTone1-10, successTone1-10, etc.)
- Sélection de couleurs strictement conforme à la palette approuvée

### 🧩 Composants / Modules concernés

- src/main.jsx (import version dynamique)
- src/pages/ActionsPage.jsx (ajout onglet categories)
- src/components/actions/ActionCategoriesTable.jsx (nouveau)
- src/components/actions/CategoryRow.jsx (nouveau)
- src/components/actions/SubcategoryRow.jsx (nouveau)
- src/config/actionPageConfig.js (configuration onglet)
- src/config/colorPalette.js (50 nouvelles couleurs)
- src/lib/api/adapters/directus/actionSubcategories/adapter.ts (enrichissement client-side)
- src/lib/api/adapters/directus/actionSubcategories/datasource.ts (suppression nested fields)

### ⚠️ Points de vigilance

- API create/delete pour catégories préparées mais non activées (attente endpoints backend)
- Dropdown de sélection de couleur contient 54 options (peut nécessiter groupement UX en 1.12.0)

## 1.10.0 - 2026-01-20

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Gestion des familles et sous-familles de pièces disponible depuis l’onglet Pièces
- Tableau Fournisseurs modernisé : actions regroupées et panneau d’extension pour les références par fournisseur

### 🧱 Stabilisation / Dette technique

- Mutualisation du tableau fournisseurs sur le composant DataTable pour cohérence UI
- Ajout des opérations CRUD familles/sous-familles dans l’adapter Directus (cache invalidé)

### 🧩 Composants / Modules concernés

- src/pages/Parts.jsx
- src/components/purchase/suppliers/SuppliersTable.jsx
- src/components/purchase/suppliers/SupplierRefsBySupplierPanel.jsx
- src/components/stock/StockFamiliesTable.jsx (nouveau)
- src/components/stock/FamilyRow.jsx (nouveau)
- src/components/stock/SubfamilyRow.jsx (nouveau)
- src/lib/api/adapters/directus/stock/adapter.ts
- src/lib/api/adapters/directus/stock/datasource.ts

### ⚠️ Points de vigilance

- Suppression de SuppliersInlinePanel.jsx : vérifier les intégrations externes éventuelles
- Le panneau familles/sous-familles déclenche des confirmations navigateur (window.confirm) conservées temporairement

## 1.9.1 - 2026-01-20

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Amélioration interne : optimisation code TechnicianHome et InterventionCreate

### 🧩 Composants / Modules concernés

- src/pages/TechnicianHome.jsx
- src/hooks/useTechnicianHome.js (nouveau)
- src/components/technician/ActionCard.jsx (nouveau)
- src/pages/InterventionCreate.jsx
- src/hooks/useInterventionCreate.js

## 1.9.0 - 2026-01-19

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Nouvelle page "Pupitre Atelier" : tableau de bord pour techniciens avec indicateurs clés (urgences, interventions ouvertes, anomalies hygiènes)
- Landing page intelligente : utilisateurs authentifiés sont automatiquement redirigés vers le pupitre atelier
- Utilisateurs non-authentifiés accèdent toujours à la page d'accueil publique
- Bug fix InterventionDetail : affichage priorité/urgence corrigé (mapPriorityToConfigKey)
- Amélioration lisibilité détail intervention : header hiérarchisé (dropdowns statut/priorité déplacés dans actions)

### 🧱 Stabilisation / Dette technique

- Système de redirection au niveau du routeur (App.jsx) : logique centralisée et maintenable
- Respect des conventions : HomeRedirect() suit le pattern existant des composants
- Cohérence avec le flow d'authentification existant (Login.jsx → TechnicianHome)

### 🧩 Composants / Modules concernés

- src/pages/TechnicianHome.jsx : nouveau composant pupitre atelier
- src/App.jsx : ajout HomeRedirect(), modification du routing
- src/pages/Login.jsx : redirection défaut `/technician` (au lieu de `/interventions`)
- src/config/menuConfig.js : technician-home configuration
- src/pages/routes.js : TechnicianHome mapping
- src/pages/InterventionDetail.jsx : refactoring header + fix affichage priorité
- src/components/layout/HierarchicalHeaderLayout.jsx : amélioration responsive dropdowns
- src/config/interventionTypes.js : ajout labels PRIORITY_COLORS

### ⚠️ Points de vigilance

- La route `/` maintient le pattern de ProtectedRoute interne pour utilisateurs authentifiés
- Les utilisateurs avec redirect_after_login stocké conservent leur destination prévue

## 1.8.0 - 2026-01-19

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Le panneau de détails des demandes d'achat se charge correctement et affiche les références fournisseurs et spécifications
- Les couleurs de fond des lignes sont moins intenses pour améliorer la lisibilité
- Interface de tableau de demandes d'achat optimisée et plus réactive

### 🧱 Stabilisation / Dette technique

- Refactoring majeur du composant PurchaseRequestsTable : séparation en modules indépendants
- Réduction de la complexité cyclomatique (18 → 10) pour respecter les standards de qualité
- Extraction de helpers réutilisables (couleurs d'âge, tri, définition des colonnes)
- Création de composants enfants pour meilleure maintenabilité (PurchaseRequestRow)
- Centralisation des PropTypes et des constantes
- Amélioration de la séparation des responsabilités

### 🧩 Composants / Modules concernés

- components/purchase/requests/PurchaseRequestsTable.jsx
- components/purchase/requests/PurchaseRequestRow.jsx (nouveau)
- components/purchase/requests/purchaseRequestsTable.helpers.jsx (nouveau)
- components/purchase/requests/purchaseRequestRow.helpers.jsx (nouveau)
- components/purchase/requests/purchaseRequestsTable.propTypes.js (nouveau)

### ⚠️ Points de vigilance

- Architecture modulaire : les changements futurs doivent respecter la séparation des composants
- Les props du composant parent restent nombreuses → à surveiller pour prochaines itérations

## 1.7.2 - 2026-01-18

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Les demandes d'achat créées s'affichent immédiatement

## 1.7.0 - 2026-01-17

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Interface uniformisée : remplacement de tous les pictogrammes hétérogènes par un jeu d’icônes cohérent
- Meilleure lisibilité des statuts, alertes et badges dans toute l’application
- Amélioration de l’accessibilité (lecture écran, contraste, cohérence visuelle)
- Suppression des symboles ambigus ou dépendants du système d’exploitation

### 🧱 Stabilisation / Dette technique

- Standardisation complète du système d’icônes → élimination des comportements visuels incohérents
- Centralisation des conventions UI → réduction du risque de dérive future
- Sécurisation des composants d’alerte et de notification → comportements maîtrisés et prévisibles

### 🧩 Composants / Modules concernés

- components/actions/\*
- components/purchase/\*
- components/common/\*
- components/service/\*
- config/badgeConfig
- hooks/\*
- context/\*

### ⚠️ Points de vigilance

- Toute icône doit désormais respecter la convention définie (pas de symboles libres)
- Les composants UI deviennent dépendants du système d’icônes centralisé
- Toute nouvelle vue doit s’aligner strictement sur ces conventions

## 1.6.0 - 2026-01-16

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Les paniers fournisseurs affichent désormais des indicateurs fiables et cohérents
- Le niveau d’urgence d’un panier est automatiquement visible et priorisable
- Les informations affichées correspondent exactement à l’état réel des demandes associées
- Les paniers incomplets ou incohérents sont évités par construction

### 🧱 Stabilisation / Dette technique

- Centralisation des règles de calcul des indicateurs → réduction des incohérences d’affichage
- Automatisation des indicateurs clés → suppression de dépendances implicites côté interface
- Alignement strict entre données et affichage → fiabilité accrue des décisions utilisateur

### 🧩 Composants / Modules concernés

- components/purchase/OrderRow
- components/purchase/OrderLineTable
- components/purchase/SupplierOrdersTable
- config/stockManagementConfig
- config/colorPalette
- lib/api/\*

### ⚠️ Points de vigilance

- Les indicateurs reposent désormais sur des règles automatiques non modifiables côté interface
- Toute évolution des règles d’urgence doit être faite de manière centralisée
- Les installations existantes doivent être vérifiées pour cohérence des données

## 1.5.x - 2026-01-16

Stabilité : 🟡 en consolidation

### 🎯 Impact fonctionnel

- Le processus d’achat fournisseur est désormais complet et cohérent de bout en bout
- Les demandes d’achat sont correctement liées aux actions et aux paniers fournisseurs
- L’utilisateur est guidé et bloqué lorsque des informations obligatoires manquent
- Les paniers fournisseurs reflètent fidèlement l’état réel des demandes associées

### 🧱 Stabilisation / Dette technique

- Centralisation de la logique de dispatch et de synchronisation des statuts → suppression des incohérences
- Sécurisation des suppressions et des changements de statut → prévention des pertes de données
- Simplification du chargement des données → amélioration de la fiabilité et des performances perçues

### 🧩 Composants / Modules concernés

- components/purchase/\*
- components/actions/\*
- components/common/\*
- hooks/\*
- lib/api/\*
- config/\*

### ⚠️ Points de vigilance

- Les paniers créés avant cette version peuvent nécessiter une remise à plat
- Le processus d’achat impose désormais des règles strictes non contournables
- Toute évolution doit préserver la cohérence entre demandes, lignes et paniers

## 1.4.x - 2026-01-12

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Les demandes d’achat peuvent être créées, suivies et supprimées directement depuis les actions
- La qualification des demandes est plus claire et plus rapide
- L’utilisateur visualise immédiatement les liens entre interventions, actions et achats
- Les erreurs de saisie ou de synchronisation sont fortement réduites

### 🧱 Stabilisation / Dette technique

- Unification des règles de liaison entre actions et demandes d’achat → fiabilité accrue
- Sécurisation des suppressions et des mises à jour → prévention des incohérences
- Clarification du modèle de données côté utilisateur → compréhension facilitée

### 🧩 Composants / Modules concernés

- components/actions/\*
- components/purchase/\*
- components/interventions/\*
- lib/api/\*
- hooks/\*

### ⚠️ Points de vigilance

- Les règles de liaison action ↔ demande d’achat sont désormais structurantes
- Toute modification future doit respecter ces relations
- Vérifier les cas limites lors de suppressions multiples

## Versions antérieures (≤ 1.3.x) — Historique consolidé

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Mise en place des fondations de la GMAO : machines, interventions, actions
- Création et suivi des demandes d’achat liées aux interventions
- Visualisation structurée de l’activité maintenance (temps, catégories, statuts)
- Premiers indicateurs d’aide à la décision au niveau machine et service
- Navigation unifiée et accès cohérent aux données principales

### 🧱 Stabilisation / Dette technique

- Structuration progressive du modèle de données maintenance
- Mise en place des premières conventions UI et métier
- Sécurisation des flux principaux (création, modification, suppression)
- Nettoyage des incohérences initiales liées aux itérations rapides

### 🧩 Composants / Modules concernés

- components/interventions/\*
- components/actions/\*
- components/purchase/\*
- components/machines/\*
- components/service/\*
- hooks/\*
- lib/api/\*
- config/\*

### ⚠️ Points de vigilance

- Certaines décisions historiques limitent encore la flexibilité
- Le modèle initial a été construit par itérations rapides
- Toute refonte majeure doit tenir compte de cet héritage

---

Les versions antérieures à la 1.4.x ont été regroupées afin de préserver la lisibilité
et d’éviter toute dérive vers un journal de développement.

---
