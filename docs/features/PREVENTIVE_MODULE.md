<!-- ═══════════════════════════════════════════════════════════════════════════════
📘 PREVENTIVE_MODULE.md - Module de Préconisation Préventive
═══════════════════════════════════════════════════════════════════════════════

Document opérationnel : architecture, déploiement, utilisation du module de
détection automatique de préconisations préventives via PostgreSQL + Directus.

📦 Version: 1.0
👤 Auteur: Tunnel GMAO
📅 Créé: 2026-01-05

⚠️ PRÉREQUIS LECTURE :
Lire impérativement AVANT implémentation :
- [ARCHITECTURE_LOCKED.md](../ARCHITECTURE_LOCKED.md) - Contraintes système
- [docs/tech/API_CONTRACTS.md](../tech/API_CONTRACTS.md) - Contrats DTO

═══════════════════════════════════════════════════════════════════════════════
-->

# 📘 Module de Préconisation Préventive (MVP)

## 📋 Table des Matières

1. [Vision](#vision)
2. [Architecture](#architecture)
3. [Schéma BDD](#schéma-bdd)
4. [Moteur de Détection](#moteur-de-détection)
5. [API Directus](#api-directus)
6. [Frontend (Consommateur)](#frontend-consommateur)
7. [Déploiement](#déploiement)
8. [Futur : Demande d'Intervention Préventive](#futur--demande-dintervention-préventive)
9. [FAQ](#faq)

---

## 🎯 Vision

### Le Problème

Après chaque dépannage, le technicien devrait envisager l'ajout d'une maintenance préventive (contrôle courroies, nettoyage filtres, etc.). Actuellement, c'est mental et oublié.

### La Solution MVP

1. **Détection automatique** : analyse la description de l'action → détecte les mots-clés → crée une **préconisation gelée**
2. **Validation humaine** : superviseur revoit les précos → ACCEPTE (→ créera DI) ou REJETTE
3. **Aucune création d'intervention** : MVP = validation uniquement, futur module DI_PREV fera les demandes

### Contrainte Architecturale

**Zéro calcul frontend.** PostgreSQL fait 100% du travail. Directus expose. Frontend consomme.

---

## 🏗️ Architecture

### Flux Métier

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Création d'une Action                          │
│              (intervention_action INSERT)                           │
└────────────────────┬────────────────────────────────────────────────┘
                     │ AFTER INSERT
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              TRIGGER trg_detect_preventive                          │
│           (execute detect_preventive_suggestions)                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Analyse description
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│          Boucle: Rules actives → Match mots-clés                    │
│                ↓ Insert preventive_suggestion (status=NEW)          │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Expose via API Directus
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Frontend / Superviseur                                 │
│     Consulte: GET /items/preventive_suggestion?filter[status=NEW]   │
│         Accepte: PATCH status=ACCEPTED, handled_at=now()            │
└────────────────────┬────────────────────────────────────────────────┘
                     │ [FUTUR] UPDATE status=ACCEPTED
                     │         → trigger create_preventive_intervention()
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│            Demande d'Intervention Préventive (DI_PREV)              │
│           (créée automatiquement, type=PREV, lien suggestion)       │
└─────────────────────────────────────────────────────────────────────┘
```

### Couches Système

| Couche         | Responsabilité                               | Technologie          |
| -------------- | -------------------------------------------- | -------------------- |
| **Database**   | Détection, stockage, validation              | PostgreSQL + Trigger |
| **Backend**    | Exposition API                               | Directus REST API    |
| **Frontend**   | Affichage, validation utilisateur, PATCH     | React + facade       |
| **Futur (DI)** | Création automatique demandes d'intervention | PostgreSQL Trigger   |

---

## 🗄️ Schéma BDD

### Fichiers SQL (ordre strict)

```
db/schema/
├── 06_preventive_rule.sql        ← Règles statiques (mots-clés)
├── 07_preventive_suggestion.sql  ← Préconisations détectées (trace)
├── 08_detect_preventive_function.sql ← Fonction d'analyse
└── 09_trigger_detect_preventive.sql  ← Déclanché à INSERT intervention_action
```

### Table: `preventive_rule`

Référentiel des règles de détection (statique, ~10 lignes).

```sql
CREATE TABLE preventive_rule (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,           -- 'courroie', 'lame', ...
  preventive_code TEXT NOT NULL,          -- 'PREV_COURROIE', ...
  preventive_label TEXT NOT NULL,         -- "Contrôle tension & alignement..."
  weight INT DEFAULT 1,                   -- Importance (1=faible, 2=moyen)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);
```

**Données initiales** (MTV - basées sur historique réel) :

| keyword   | preventive_code | preventive_label                        | weight |
| --------- | --------------- | --------------------------------------- | ------ |
| courroie  | PREV_COURROIE   | Contrôle tension & alignement courroies | 2      |
| lame      | PREV_LAME       | Contrôle usure / réglage lames          | 2      |
| couteau   | PREV_LAME       | Contrôle usure couteaux                 | 2      |
| roulement | PREV_ROULEMENT  | Contrôle bruit / jeu roulements         | 2      |
| capteur   | PREV_CAPTEUR    | Nettoyage / réglage capteurs            | 2      |
| filtre    | PREV_FILTRE     | Nettoyage filtre / crépine              | 2      |
| cable     | PREV_CABLE      | Contrôle cheminement câbles             | 1      |
| vis       | PREV_SERRAGE    | Contrôle serrage visserie               | 1      |
| axe       | PREV_SERRAGE    | Contrôle axes / goupilles               | 1      |
| pompe     | PREV_POMPE      | Contrôle pompe / amorçage               | 2      |

### Table: `preventive_suggestion`

Trace factuelle des préconisations détectées (volumétrique, audit trail complet).

```sql
CREATE TABLE preventive_suggestion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_action_id UUID NOT NULL UNIQUE,   -- Ce qui l'a créée (immuable)
  machine_id UUID NOT NULL,                       -- Dénormalisation pour requêtes
  preventive_code TEXT NOT NULL,                  -- Copie de preventive_rule
  preventive_label TEXT NOT NULL,
  score INT NOT NULL,                             -- Poids au moment détection

  -- Cycle de vie métier (signature)
  status TEXT NOT NULL DEFAULT 'NEW',
  -- NEW      → détecté, en attente validation
  -- REVIEWED → superviseur a regardé (futur UI)
  -- ACCEPTED → pris en compte, créera DI_PREV
  -- REJECTED → refusé

  detected_at TIMESTAMP DEFAULT now(),
  handled_at TIMESTAMP,                           -- Quand statut changé
  handled_by UUID,                                -- Qui l'a validé

  UNIQUE (machine_id, preventive_code),           -- Une machine = une préco par type
  CONSTRAINT fk_action FOREIGN KEY (intervention_action_id) REFERENCES intervention_action(id),
  CONSTRAINT fk_machine FOREIGN KEY (machine_id) REFERENCES machine(id)
);
```

---

## ⚙️ Moteur de Détection

### Fonction: `detect_preventive_suggestions()`

**Appelée par le trigger** `trg_detect_preventive` à chaque `INSERT intervention_action`.

#### Logique

```
1. Vérifier description valide (NOT NULL, length > 10)
   ├─ Si non → RETURN (pas d'analyse)
   │
2. Récupérer code de action_subcategory
   ├─ Vérifier qu'il matchs 'DEP_%' (dépannage seulement)
   ├─ Si non → RETURN (préventif, pas dépannage)
   │
3. Récupérer machine_id de l'intervention
   ├─ Si NULL → RETURN (action orpheline)
   │
4. BOUCLE: preventive_rule WHERE active=TRUE
   ├─ Si description LIKE '%keyword%' (case-insensitive)
   │  ├─ INSERT preventive_suggestion (status=NEW)
   │  └─ ON CONFLICT (machine_id, preventive_code) DO NOTHING
   │
5. RETURN new (inchangé)
```

#### Implémentation PostgreSQL

```plpgsql
CREATE OR REPLACE FUNCTION detect_preventive_suggestions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rule RECORD;
  v_machine_id UUID;
  v_description_lower TEXT;
  v_action_subcategory_code TEXT;
BEGIN
  -- Sécurité : description valide
  IF new.description IS NULL OR length(trim(new.description)) < 10 THEN
    RETURN new;
  END IF;

  -- Filtre métier : uniquement dépannage
  SELECT sc.code
  INTO v_action_subcategory_code
  FROM action_subcategory sc
  WHERE sc.id = new.action_subcategory_id;

  IF v_action_subcategory_code IS NULL OR NOT v_action_subcategory_code LIKE 'DEP_%' THEN
    RETURN new;
  END IF;

  -- Récupérer machine
  SELECT i.machine_id
  INTO v_machine_id
  FROM intervention i
  WHERE i.id = new.intervention_id;

  IF v_machine_id IS NULL THEN
    RETURN new;
  END IF;

  -- Boucle de détection
  FOR v_rule IN
    SELECT keyword, preventive_code, preventive_label, weight
    FROM preventive_rule
    WHERE active = TRUE
    ORDER BY weight DESC
  LOOP
    IF lower(new.description) LIKE '%' || v_rule.keyword || '%' THEN
      INSERT INTO preventive_suggestion (
        intervention_action_id, machine_id, preventive_code,
        preventive_label, score
      )
      VALUES (new.id, v_machine_id, v_rule.preventive_code,
              v_rule.preventive_label, v_rule.weight)
      ON CONFLICT (machine_id, preventive_code) DO NOTHING;
    END IF;
  END LOOP;

  RETURN new;
END;
$$;
```

### Trigger: `trg_detect_preventive`

```sql
CREATE TRIGGER trg_detect_preventive
AFTER INSERT ON intervention_action
FOR EACH ROW
EXECUTE FUNCTION detect_preventive_suggestions();
```

**Timing:** `AFTER INSERT` (événement terminé, pas de side-effect sur l'action).

---

## 🌐 API Directus

### Collection: `preventive_suggestion`

À déclarer dans Directus (Settings → Data Model).

#### Fields

| Field                    | Type     | Notes                                        |
| ------------------------ | -------- | -------------------------------------------- |
| `id`                     | UUID     | Primary, auto, read-only                     |
| `intervention_action_id` | UUID     | Relation to `intervention_action`, read-only |
| `machine_id`             | UUID     | Relation to `machine`, read-only             |
| `preventive_code`        | Text     | Copié de la rule, read-only                  |
| `preventive_label`       | Text     | Copié de la rule, read-only                  |
| `score`                  | Integer  | Poids de la détection, read-only             |
| `status`                 | Dropdown | NEW \| REVIEWED \| ACCEPTED \| REJECTED      |
| `detected_at`            | Datetime | Auto, read-only                              |
| `handled_at`             | Datetime | Nullable, set on validation                  |
| `handled_by`             | UUID     | Relation to `directus_users`, nullable       |

#### Permissions (Recommandées)

| Rôle            | Read         | Create | Update                         | Delete |
| --------------- | ------------ | ------ | ------------------------------ | ------ |
| **Technician**  | own machines | —      | —                              | —      |
| **Team Leader** | all          | —      | status, handled_at, handled_by | —      |
| **Admin**       | all          | —      | all                            | —      |

**⚠️ DELETE jamais autorisé** (trace immuable).

#### Requêtes API Courantes

**Lister les précos NEW d'une machine :**

```http
GET /items/preventive_suggestion
?filter[machine_id][_eq]=<machine_uuid>
&filter[status][_eq]=NEW
&sort=-detected_at
```

**Accepter une préco :**

```http
PATCH /items/preventive_suggestion/<suggestion_uuid>
Content-Type: application/json

{
  "status": "ACCEPTED",
  "handled_at": "2026-01-05T14:32:00Z",
  "handled_by": "<current_user_uuid>"
}
```

**Rejeter une préco :**

```http
PATCH /items/preventive_suggestion/<suggestion_uuid>
Content-Type: application/json

{
  "status": "REJECTED",
  "handled_at": "2026-01-05T14:32:00Z",
  "handled_by": "<current_user_uuid>"
}
```

---

## 💻 Frontend (Consommateur)

### 1. Adapter Facade (Backend-Agnostic)

À implémenter dans `src/lib/api/adapters/<provider>/` (ex: `directus/`).

```javascript
// src/lib/api/adapters/directus/preventive.adapter.js

export const preventiveAdapter = {
  // Lister précos d'une machine avec statut
  fetchPreventiveSuggestions: async (machineId, status = 'NEW') => {
    const response = await apiClient.get('/items/preventive_suggestion', {
      params: {
        'filter[machine_id][_eq]': machineId,
        'filter[status][_eq]': status,
        sort: '-detected_at',
      },
    });
    return response.data.data || [];
  },

  // Valider une préco (ACCEPT)
  acceptPreventiveSuggestion: async (suggestionId, userId) => {
    const response = await apiClient.patch(`/items/preventive_suggestion/${suggestionId}`, {
      status: 'ACCEPTED',
      handled_at: new Date().toISOString(),
      handled_by: userId,
    });
    invalidateCache(['preventive_suggestions', suggestionId]);
    return response.data.data;
  },

  // Rejeter une préco (REJECT)
  rejectPreventiveSuggestion: async (suggestionId, userId) => {
    const response = await apiClient.patch(`/items/preventive_suggestion/${suggestionId}`, {
      status: 'REJECTED',
      handled_at: new Date().toISOString(),
      handled_by: userId,
    });
    invalidateCache(['preventive_suggestions', suggestionId]);
    return response.data.data;
  },
};
```

### 2. Hook Custom (Consommation)

```javascript
// src/hooks/usePreventiveSuggestions.js

import { useApiCall } from '@/hooks/useApiCall';
import { preventiveAdapter } from '@/lib/api/adapters/directus/preventive.adapter';

export function usePreventiveSuggestions(machineId, status = 'NEW') {
  const { data, loading, error, execute } = useApiCall(
    () => preventiveAdapter.fetchPreventiveSuggestions(machineId, status),
    { autoExecute: !!machineId }
  );

  return { suggestions: data, loading, error, refresh: execute };
}
```

### 3. Composant: Affichage

```jsx
// src/components/preventive/PreventiveSuggestionsPanel.jsx

import { usePreventiveSuggestions } from '@/hooks/usePreventiveSuggestions';
import { useAuth } from '@/auth/AuthContext';
import { preventiveAdapter } from '@/lib/api/adapters/directus/preventive.adapter';

export default function PreventiveSuggestionsPanel({ machineId }) {
  const { user } = useAuth();
  const { suggestions, loading, refresh } = usePreventiveSuggestions(machineId);
  const [processing, setProcessing] = useState(null);

  const handleAccept = async (suggestionId) => {
    setProcessing(suggestionId);
    try {
      await preventiveAdapter.acceptPreventiveSuggestion(suggestionId, user.id);
      refresh(); // Refresh la liste
    } catch (err) {
      console.error('Erreur acceptation :', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (suggestionId) => {
    setProcessing(suggestionId);
    try {
      await preventiveAdapter.rejectPreventiveSuggestion(suggestionId, user.id);
      refresh();
    } catch (err) {
      console.error('Erreur rejet :', err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!suggestions.length) return <Text>Aucune préconisation</Text>;

  return (
    <Box>
      <Heading>Préconisations Préventives</Heading>
      {suggestions.map((s) => (
        <Card key={s.id} color="blue">
          <Text weight="bold">{s.preventive_label}</Text>
          <Text size="sm">Détectée : {new Date(s.detected_at).toLocaleDateString()}</Text>
          <Flex gap="2" mt="3">
            <Button onClick={() => handleAccept(s.id)} disabled={processing === s.id} color="green">
              Accepter
            </Button>
            <Button onClick={() => handleReject(s.id)} disabled={processing === s.id} color="gray">
              Rejeter
            </Button>
          </Flex>
        </Card>
      ))}
    </Box>
  );
}
```

---

## 🚀 Déploiement

### Étape 1 : Exécuter les scripts SQL

Ordre strict (dépendances) :

```bash
# 1. Créer règles
psql $DATABASE_URL -f db/schema/06_preventive_rule.sql

# 2. Créer table suggestions
psql $DATABASE_URL -f db/schema/07_preventive_suggestion.sql

# 3. Créer fonction
psql $DATABASE_URL -f db/schema/08_detect_preventive_function.sql

# 4. Créer trigger
psql $DATABASE_URL -f db/schema/09_trigger_detect_preventive.sql
```

### Étape 2 : Configurer Directus

1. **Créer collection** `preventive_suggestion` (Settings → Data Model)

   - Importer les champs listés ci-dessus
   - Ajouter relations (`intervention_action_id`, `machine_id`, `handled_by`)

2. **Définir permissions**

   - Rôles : Technician, Team Leader, Admin
   - Politique : voir table permissions ci-dessus

3. **Vérifier** que l'API expose `/items/preventive_suggestion`

### Étape 3 : Implémenter le Frontend

1. Créer l'adapter façade (`preventive.adapter.js`)
2. Créer le hook (`usePreventiveSuggestions.js`)
3. Intégrer le composant dans les pages (ex: MachineDetail, InterventionsList)

### Étape 4 : Tester

**Test manuel PostgreSQL :**

```sql
-- 1. Insérer une action de dépannage
INSERT INTO intervention_action (
  id, intervention_id, description, action_subcategory_id, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM intervention LIMIT 1),
  'Remplacement de la courroie principale et contrôle tension',
  (SELECT id FROM action_subcategory WHERE code LIKE 'DEP_%' LIMIT 1),
  CURRENT_TIMESTAMP;

-- 2. Vérifier que preventive_suggestion a été créée
SELECT * FROM preventive_suggestion ORDER BY detected_at DESC LIMIT 1;

-- 3. Vérifier status = 'NEW'
-- 4. Vérifier preventive_code = 'PREV_COURROIE'
```

**Test API Directus :**

```bash
curl -X GET \
  "http://localhost:8055/items/preventive_suggestion?filter[status][_eq]=NEW" \
  -H "Authorization: Bearer <your_token>"
```

---

## 🔮 Futur : Demande d'Intervention Préventive

### Phase 2 (DI_PREV)

Quand le module Demande d'Intervention existera :

```sql
-- Nouveau trigger : ACCEPTED → crée DI
CREATE TRIGGER trg_accept_preventive_create_di
AFTER UPDATE ON preventive_suggestion
FOR EACH ROW
WHEN (OLD.status = 'NEW' AND NEW.status = 'ACCEPTED')
EXECUTE FUNCTION create_preventive_intervention_request();

-- Nouvelle fonction
CREATE OR REPLACE FUNCTION create_preventive_intervention_request()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO intervention_request (
    machine_id,
    type,        -- 'PREV'
    title,       -- NEW.preventive_label
    status,      -- 'open'
    related_preventive_suggestion_id  -- NEW.id
  )
  VALUES (
    NEW.machine_id,
    'PREV',
    NEW.preventive_label,
    'open',
    NEW.id
  );

  RETURN NEW;
END;
$$;
```

**Résultat :**

- Supervisor accepte une préco
- Trigger crée automatiquement une DI
- DI devient une demande formal, pourra être plannifiée

---

## ❓ FAQ

### Q1 : Pourquoi pas de suppression de précos ?

**R :** Trace audit. On doit savoir que la préco a été rejetée (REJECTED status) pour éviter de la recréer.

### Q2 : Pourquoi PostgreSQL et pas le frontend ?

**R :** Architecture verrouillée (voir ARCHITECTURE_LOCKED.md). Zéro logique métier frontend. PostgreSQL = source unique de vérité.

### Q3 : Comment ajouter une nouvelle règle ?

**R :** Simple INSERT dans `preventive_rule`, trigger utilise les règles actives automatiquement.

```sql
INSERT INTO preventive_rule (keyword, preventive_code, preventive_label, weight)
VALUES ('moteur', 'PREV_MOTEUR', 'Contrôle moteur électrique', 2);
```

### Q4 : Quoi si une règle donne trop de faux positifs ?

**R :** Désactiver (update active = false) sans perdre l'historique.

```sql
UPDATE preventive_rule SET active = FALSE WHERE keyword = 'vis';
```

Les prochaines actions ne détecteront plus 'vis', mais l'historique reste.

### Q5 : Performance ? Le trigger ralentit les INSERTs ?

**R :** +5-10ms par insertion (acceptable). La boucle sur preventive_rule est petite (~10 lignes) et indexée.

### Q6 : Et si une machine reçoit la même préco 2 fois ?

**R :** UNIQUE constraint sur `(machine_id, preventive_code)` l'empêche. ON CONFLICT DO NOTHING ignore la deuxième.

### Q7 : Comment tester sans Directus ?

**R :** Adapter mock expose les mêmes endpoints. Voir [ARCHITECTURE_LOCKED.md](../ARCHITECTURE_LOCKED.md).

---

## 📚 Documentation Connexe

- [ARCHITECTURE_LOCKED.md](../ARCHITECTURE_LOCKED.md) - Verrous système
- [docs/tech/API_CONTRACTS.md](../tech/API_CONTRACTS.md) - Contrats DTO
- [docs/tech/CONVENTIONS.md](../tech/CONVENTIONS.md) - Conventions code
- [db/schema/](../schema/) - Tous les scripts SQL

---

**✅ MVP Prêt au Déploiement.**  
**🔮 Phase 2 (DI_PREV) Réservée mais Architecture Préparée.**
