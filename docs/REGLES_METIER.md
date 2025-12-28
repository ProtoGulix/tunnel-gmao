## Gestion des demandes d'intervention et des sous-tâches

> **Note importante** : Ce document définit le **modèle métier cible** de Tunnel GMAO.  
> Certaines règles décrites ici **ne sont pas encore implémentées techniquement**, mais elles
> font partie intégrante des règles métier et doivent guider toute évolution
> du modèle de données et du code.

---

### Demande d’intervention (Request)

#### Rôle métier

La demande d’intervention est le **point d’entrée unique** d’un besoin de maintenance.
Elle sert à :

- signaler un problème ou un besoin
- qualifier la demande
- décider de sa prise en charge

#### Règles métier

- Une demande peut exister **sans intervention**
- Une demande **ne contient jamais** :
  - de temps passé
  - d’actions
  - de pièces
- Une demande peut être :
  - acceptée
  - rejetée
  - clôturée sans intervention
- Une demande acceptée peut générer **une seule et unique intervention**

#### Statuts cibles (MVP)

> **À définir selon la mise en œuvre concrète**  
> Exemples possibles : `nouvelle`, `en_qualification`, `acceptée`, `rejetée`, `clôturée`

---

### Intervention

#### Rôle métier

L’intervention représente **l’exécution réelle du travail de maintenance**.

#### Règles métier

- Une intervention est **toujours issue d’une demande**
- Une intervention **ne peut jamais exister sans demande**
- Une demande ne peut être liée qu’à **une seule intervention**
- Toute action terrain est rattachée à une intervention

#### Règles fortes

- Il est interdit de créer une intervention sans demande associée
- La demande source d’une intervention ne peut pas être modifiée
- La clôture d’une intervention entraîne la clôture de la demande associée

---

### Sous-tâches (Subtasks)

#### Rôle métier

Les sous-tâches servent **exclusivement à organiser le travail** lors :

- d’interventions longues
- de projets
- de mises en service

#### Règles métier

- Une sous-tâche est toujours rattachée à une intervention
- Une sous-tâche n’a **aucune valeur de traçabilité terrain**
- Une sous-tâche ne contient :
  - ni temps passé
  - ni pièces
  - ni complexité
- Les statistiques et indicateurs **ne tiennent jamais compte des sous-tâches**

#### Statuts cibles

> **À définir selon la mise en œuvre concrète**  
> Exemples possibles : `en_cours`, `attente_pieces`, `attente_prod`, `terminée`, `annulée`

---

### Actions (rappel fondamental)

- L’action est la **seule unité de travail réel**
- Le temps, la complexité et les pièces sont portés **uniquement par les actions**
- Les actions sont toujours rattachées à une intervention
- Les actions ne sont jamais rattachées directement à une demande

---

### Règle métier synthèse (non négociable)

| Règle                         | Description                                                    | Implémentation           |
| ----------------------------- | -------------------------------------------------------------- | ------------------------ |
| **Demande autonome**          | Une demande peut exister sans intervention                     | ✅ Validation métier     |
| **Intervention dépendante**   | Une intervention ne peut pas exister sans demande              | ⚠️ À implémenter         |
| **Sous-tâche = organisation** | Une sous-tâche est un outil d'organisation, pas de traçabilité | 📋 Cible                 |
| **Action = preuve**           | Une action est la seule preuve de travail réel                 | ✅ Architecture actuelle |
| **Temps dans l'action**       | Le temps et la complexité vivent uniquement dans les actions   | ✅ Implémenté            |

### Impact sur l'architecture technique

Ces règles métier se traduisent dans le code par :

1. **Modèle de données**

   - Table `intervention_requests` (demandes) indépendante de `interventions`
   - Clé étrangère obligatoire : `interventions.request_id → intervention_requests.id`
   - Table `subtasks` liée à `interventions.id` (optionnel, organisation seulement)
   - Table `actions` liée à `interventions.id` (obligatoire, traçabilité)

2. **Validation backend**

   - Création intervention : `request_id` obligatoire et non modifiable
   - Création action : `intervention_id` obligatoire
   - Temps/complexité : uniquement dans actions, jamais dans interventions/sous-tâches

3. **Interface utilisateur**

   - Workflow : Demande → (Qualification) → Intervention → Actions
   - Statistiques calculées uniquement sur actions (ignorer sous-tâches)
   - Sous-tâches affichées comme checklist, pas comme données analytiques

4. **API contracts (DTOs)**
   - `InterventionRequest` : DTO séparé, peut exister seul
   - `Intervention` : toujours inclure `request: { id, title }` (relation obligatoire)
   - `Action` : DTO avec `timeSpent`, `complexityScore` (seule source de vérité)
   - `Subtask` : DTO simple sans champs analytiques (titre, statut, ordre)

> 📖 Voir [tech/API_CONTRACTS.md](tech/API_CONTRACTS.md) pour les contrats détaillés
