<!--
═══════════════════════════════════════════════════════════════════════════════
📄 API_CONTRACTS.md - Contrats d'interface Frontend ↔ Backend
═══════════════════════════════════════════════════════════════════════════════

Documentation de référence définissant les contrats stables entre le front-end et le
backend pour garantir l'interchangeabilité des backends sans impact sur les composants.

Contenu:
- Contrats DTO (formes des données, validation, enums)
- Architecture Facade + Adapter Pattern (isolation backend)
- Stratégie de migration backend (swap sans casser le front)
- Règles d'implémentation adapter (normalizers, mappers, cache)
- Patterns anti-dette technique (pureté DTO, centralisation)
- Checklist validation (tests, grep checks, migration)

Architecture:
- Facade: src/lib/api/facade.js (API stable pour composants)
- Provider: src/lib/api/adapters/provider.js (sélection backend via VITE_BACKEND_PROVIDER)
- Adapters: src/lib/api/adapters/<provider>/*.adapter.js (mapping backend ↔ domain)
- Client: src/lib/api/client.js (HTTP, cache, interceptors)
- Errors: src/lib/api/errors.js (types d'erreurs typés et normalisés)

✅ IMPLÉMENTÉ:
- Contrats domain DTO complets (Auth, Interventions, Machines, Stock, Suppliers)
- Adapter Directus production avec pattern normalisé (normalizers, mappers, cache)
- Facade exposant API backend-agnostic pour composants
- Système d'erreurs typées unifié (AuthenticationError, ValidationError, etc.)
- Cache avec invalidation par tags logiques (ex: ['interventions', id])
- Pattern normalizers centralisés (ex: normalizeStatus() unique pour tous mappers)
- Pattern payload mappers factorisés (ex: mapInterventionDomainToBackend() réutilisé create/update)
- DTO purs sans fuite backend (pas de _raw, pas de champs backend)
- Support relations imbriquées (machine.zone.name, intervention.technician.firstName)
- Validation runtime sur writes critiques (supplier_ref obligatoire, normalisation champs optionnels)
- Documentation migration strategy complète avec checklist
- Tests pattern pour adapters (normalizers, mappers, CRUD flows)
- Grep checks anti-dette technique (pas d'imports backend hors adapters)

📋 TODO:
- [ ] Implémenter second backend (FastAPI ou mock) pour valider interchangeabilité réelle
- [ ] Ajouter pagination normalisée pour listes volumétriques (Stock, Interventions)
- [ ] Documenter contrats filtrage/sorting/search (high-level filters → backend specifics)
- [ ] Créer adapter mock pour tests unitaires composants (pas de vraie API)
- [ ] Ajouter validation TypeScript stricte sur DTOs (zod ou joi)
- [ ] Implémenter versioning DTOs pour évolutions non-breaking (v1, v2)
- [ ] Créer script validation automatique (check DTOs pureté, normalizers centralisés)
- [ ] Ajouter métriques adapter (temps réponse, taux erreur par endpoint)
- [ ] Documenter strategy cache avancée (TTL, invalidation granulaire, background refresh)
- [ ] Créer tests intégration end-to-end (swap backend, run app, verify no errors)
- [ ] Ajouter exemples composants utilisant facade (bonnes pratiques import/usage)
- [ ] Implémenter retry policy pour NetworkError (backoff exponentiel)
- [ ] Documenter conventions nommage relations imbriquées (machine.zone vs machineZone)
- [ ] Créer guide migration backend existant → facade (refacto composants legacy)
- [ ] Ajouter support WebSockets/SSE via facade (événements temps réel backend-agnostic)
- [ ] Implémenter optimistic updates pattern (UI update avant API success)
- [ ] Documenter strategy rollback si migration backend échoue (plan B)
- [ ] Ajouter contrats batch operations (bulk create/update/delete)
- [ ] Créer dashboard monitoring adapters (santé backend, cache hit rate)
- [ ] Implémenter rate limiting adapter-side (protection backend overload)

@module docs/tech/API_CONTRACTS
@see src/lib/api/facade.js - Point d'entrée API pour composants
@see src/lib/api/adapters/provider.js - Sélection backend
@see src/lib/api/adapters/directus/ - Implémentation Directus production
-->

# API Contracts (Frontend ↔ Backend)

This document freezes the front-end contracts so a backend change doesn’t break the UI. It defines DTO shapes, validation rules, and a migration strategy via an adapter layer.

## Principles

- **Stable Facade:** Front imports from `src/lib/api/facade` only.
- **Adapter Pattern:** A provider selects the backend implementation via `VITE_BACKEND_PROVIDER`.
- **Typed Errors:** Unified error types from `errors.js` with user-friendly messages.
- **DTO Consistency:** Inputs/outputs documented and validated at boundaries.
- **Non-breaking evolution:** New fields are additive; avoid breaking field removals/renames.

## Adapter & Facade

- Facade: [src/lib/api/facade.js](../src/lib/api/facade.js)
- Provider: [src/lib/api/adapters/provider.js](../src/lib/api/adapters/provider.js)
- Directus adapter: [src/lib/api/adapters/directus.js](../src/lib/api/adapters/directus.js)

Usage example:

```js
import { auth, machines } from 'src/lib/api/facade';
const user = await auth.getCurrentUser();
const list = await machines.fetchMachines();
```

To switch backend:

- Set `VITE_BACKEND_PROVIDER` to the desired provider.
- Implement a new adapter `<provider>.js` exposing the same namespaces and function signatures.

## DTOs Overview (Domain Contracts)

This section defines backend-agnostic DTOs exposed by the facade. Adapters map backend responses to these contracts. No field names here reveal a specific backend.

### Auth

- `login(email, password)` → `AuthTokens`
  - `AuthTokens`: `{ accessToken: string, refreshToken?: string }`
- `getCurrentUser()` → `AuthUser`
  - `AuthUser`: `{ id: string, email: string, firstName: string, lastName: string, role?: { id: string, name: string } }`

### Interventions

- `fetchInterventions()` → `Intervention[]`
- `fetchIntervention(id)` → `Intervention`
- `createIntervention(payload)` → `Intervention`
- `addAction(action)` / `createAction(action)` → `InterventionAction`
- `addPart(part)` → `InterventionPart`
- `fetchInterventionStatusLog(id)` → `InterventionStatusLog[]`

Domain shapes:

- `Intervention`: `{ id: string, code: string, title: string, status: 'open' | 'in_progress' | 'closed', type: 'CUR' | 'PRE' | 'PRO', priority?: 'faible' | 'normale' | 'important' | 'urgent', reportedDate?: string, machine?: { id: string, code: string, name: string } }`
- `InterventionAction`: `{ id: string, description: string, timeSpent?: number, complexityScore?: number, createdAt: string, technician?: { id: string, firstName: string, lastName: string }, subcategory?: { id: string, code?: string, name?: string }, intervention?: { id: string, code?: string, title?: string } }`
- `InterventionPart`: `{ id: string, quantity: number, note?: string, stockItem?: { id: string, ref?: string, name?: string } }`
- `InterventionStatusLog`: `{ id: string, date: string, from?: { id: string, value?: string }, to?: { id: string, value?: string }, technician?: { id: string, firstName: string, lastName: string } }`

### Machines

- `fetchMachines()` / `fetchMachine(id)` → `Machine[]` / `Machine`
- `fetchMachinesWithInterventions()` → `MachineWithStats[]`

Domain shapes:

- `Machine`: `{ id: string, code?: string, name: string, location?: string, zone?: { id: string, name?: string }, workshop?: { id: string, name?: string }, parent?: { id: string, code?: string, name?: string }, tree?: { id: string, code?: string, name?: string } }`
- `MachineWithStats`: `Machine & { openInterventionsCount: number, interventionsByType: Record<string, number>, status: 'ok' | 'maintenance' | 'warning' | 'critical', statusColor: 'green' | 'blue' | 'orange' | 'red', interventions: Intervention[] }`

### Manufacturer Items

- `findManufacturerItem({ name, ref })` → `ManufacturerItem | null`
- `createManufacturerItem({ name, ref, designation })` → `ManufacturerItem`
- `getOrCreateManufacturerItem(...)` → `ManufacturerItem | null`

Domain shape:

- `ManufacturerItem`: `{ id: string, manufacturerName?: string, manufacturerRef?: string, designation?: string }`

### Stock

- `fetchStockItems()` → `StockItem[]`
- `createStockItem(item)` → `StockItem`
- `updateStockItem(id, updates)` → `StockItem`
- `deleteStockItem(id)` → `void | true`
- `fetchStockItemStandardSpecs(stockItemId)` → `StockItemStandardSpec[]`
- `createStockItemStandardSpec(spec)` / `updateStockItemStandardSpec(id, updates)` / `deleteStockItemStandardSpec(id)`
- `fetchStockFamilies()` / `fetchStockSubFamilies(familyCode)` → `StockFamily[]` / `StockSubFamily[]`

Domain shapes:

- `StockItem`: `{ id: string, name: string, familyCode?: string, subFamilyCode?: string, spec?: string, dimension?: string, ref?: string, quantity?: number, unit?: string, location?: string, manufacturerItem?: ManufacturerItem }`
- `StockItemStandardSpec`: `{ id: string, stockItemId: string, title: string, text: string, isDefault?: boolean, createdAt?: string, updatedAt?: string }`
- `StockFamily`: `{ code: string, label: string }`
- `StockSubFamily`: `{ id: string, familyCode: string, code: string, label: string }`

### Stock ↔ Suppliers Links

- `fetchStockItemSuppliers(stockItemId)` → `StockItemSupplierLink[]`
- `createStockItemSupplier(link)` → `StockItemSupplierLink`
- `updateStockItemSupplier(id, updates)` → `StockItemSupplierLink`
- `setPreferredSupplier(stockItemId, linkId)` → `true`
- `deleteStockItemSupplier(id)` → `true`

Domain shape:

- `StockItemSupplierLink`: `{ id: string, stockItemId: string, supplier: { id: string, name?: string }, supplierRef: string, isPreferred?: boolean, unitPrice?: number, deliveryTimeDays?: number, manufacturerItem?: ManufacturerItem }`

### Suppliers & Orders

- `fetchSuppliers()` → `Supplier[]`
- `createSupplier(supplier)` / `updateSupplier(id, updates)` / `deleteSupplier(id)`
- `fetchSupplierOrders(status?)` → `SupplierOrder[]`
- `fetchSupplierOrder(id)` → `SupplierOrder`
- `fetchSupplierOrderLines(supplierOrderId)` → `SupplierOrderLine[]`
- `dispatchPurchaseRequests()` → `DispatchResult`

Domain shapes:

- `Supplier`: `{ id: string, name: string, contactName?: string, email?: string, phone?: string, isActive?: boolean, itemCount?: number }`
- `SupplierOrder`: `{ id: string, orderNumber?: string, supplier: { id: string, name?: string, email?: string, contactName?: string }, status: 'open' | 'confirmed' | 'received' | 'cancelled', totalAmount?: number, createdAt?: string, orderedAt?: string, receivedAt?: string }`
- `SupplierOrderLine`: `{ id: string, supplierOrderId: string, stockItem: StockItem & { standardSpecs?: StockItemStandardSpec[] }, supplierRefSnapshot?: string, quantity: number, unitPrice?: number, totalPrice?: number, createdAt?: string, purchaseRequests?: Array<{ id: string, requestedBy?: string, itemLabel?: string, intervention?: { id: string, code?: string } , quantity: number }> }`
- `DispatchResult`: `{ dispatched: string[], toQualify: string[], errors: Array<{ id: string, error: string }> }`

## Validation & Errors

- All calls use `apiCall()` and `handleAPIError()` to enforce typed errors (`AuthenticationError`, `PermissionError`, `NotFoundError`, `ValidationError`, `NetworkError`).
- Input validation at critical writes:
  - `createPurchaseRequest()` defaults `status` to `open`.
  - `createStockItemSupplier()` enforces `supplier_ref` non-empty string and normalizes optional fields.

## Status Conventions (Domain)

- Purchase Requests: `'open' | 'in_progress' | 'closed' | 'cancelled'` (lowercase).
- Supplier Orders: `'open' | 'confirmed' | 'received' | 'cancelled'` (lowercase domain). Adapters map any backend casing or values to these domain enums.

## Migration Strategy (Backend Swap)

1. **Freeze contracts:** Treat functions and DTOs exposed via the facade as stable APIs.
2. **Implement new adapter:** Create `src/lib/api/adapters/<provider>.js` mirroring namespaces and signatures.
3. **Centralize normalizers:** Create utility functions for multi-format fields (e.g., `normalizeStatus()`). Each normalizer should be ONE function, used in ALL response mappers.
4. **Factorize payload mappers:** For each domain entity, create ONE `map<Entity>DomainToBackend()` function reused in both create and update operations.
5. **Use logical cache tags:** Structure `invalidateCache()` calls with tags like `['interventions', id]` instead of endpoint paths.
6. **Ensure pure DTOs:** No `_raw`, no backend identifiers. Every field returned must exist in API_CONTRACTS.md.
7. **Validate inputs/outputs:** Add lightweight runtime checks in the adapter for critical DTOs (check all required fields exist).
8. **Test the adapter:**
   - Unit tests for each normalizer (e.g., test `normalizeStatus()` with Directus format, FastAPI format, null, string).
   - Integration tests for key flows (auth, interventions create/update, stock reads).
   - Mock adapter test to verify signature compatibility.
9. **Gradual adoption:** Components import from the facade; no changes needed when provider switches.

### Proven Implementation Pattern (From Interventions Adapter)

```js
// Step 1: Utility Functions (Normalizers + Payload Mappers)
const normalizeStatus = (raw) => {
  /* handle all backend formats */
};
const mapInterventionDomainToBackend = (payload) => {
  /* reusable */
};

// Step 2: Response Mappers (Only Domain DTOs)
const mapInterventionToDomain = (item) => {
  /* No _raw */
};

// Step 3: API Methods (Reuse mappers, use logical cache tags)
export const adapter = {
  interventions: {
    createIntervention: async (payload) => {
      const backend = mapInterventionDomainToBackend(payload);
      const response = await api.post('/items/intervention', backend);
      invalidateCache(['interventions']); // Logical tag
      return mapInterventionToDomain(response.data);
    },
    updateIntervention: async (id, updates) => {
      const backend = mapInterventionDomainToBackend(updates); // Reuse
      const response = await api.patch(`/items/intervention/${id}`, backend);
      invalidateCache(['interventions', id]); // Granular tag
      return mapInterventionToDomain(response.data);
    },
  },
};
```

**Benefits:**

- Normalizers: 1 function per multi-format field → easy to extend for new backends.
- Payload mappers: 1 function per entity → guarantees create/update consistency.
- Cache tags: Logical structure → ready for multi-backend volumetry.
- DTOs: Pure domain → no surprises when backend changes.
- Tests: Each piece is independently testable.

## Adapter Implementation Patterns

### Critical Rules for Adapter Code

All adapters MUST follow these patterns to ensure backend interchangeability and maintainability.

#### 1. Pure DTOs (No Backend Leakage)

**FORBIDDEN:** Never expose backend-specific fields in returned DTOs.

```js
// ❌ WRONG - _raw leaks Directus
return {
  id: item.id,
  _raw: item, // Violates API_CONTRACTS
};

// ✅ CORRECT - Pure domain DTO
return {
  id: item.id,
  code: item.code,
  status: item.status_actual?.value || 'open',
  // No _raw, no backend identifiers
};
```

#### 2. Centralize Normalizers for Multi-Format Fields

Fields that appear in different formats across backends MUST use dedicated normalization functions.

```js
// ✅ CORRECT - Status normalization (all backends)
const normalizeStatus = (raw) => {
  if (!raw) return 'open';
  if (typeof raw === 'string') return raw;
  if (raw.value) return raw.value;  // Directus: { value: 'open' }
  return 'open';  // Fallback
};

// Usage in all response mappers
status: normalizeStatus(item.status_actual),
```

**Why:** When adding a second backend, you change ONE function, not N mapper locations.

#### 3. Factorize Payload Mappers (Single Source of Truth)

Never duplicate domain-to-backend mapping logic.

```js
// ✅ CORRECT - One mapper for Intervention create/update
const mapInterventionDomainToBackend = (payload) => {
  const backend = {};
  if (payload.code !== undefined) backend.code = payload.code;
  if (payload.title !== undefined) backend.title = payload.title;
  if (payload.status !== undefined) backend.status_actual = payload.status;
  if (payload.type !== undefined) backend.type_inter = payload.type;
  if (payload.priority !== undefined) backend.priority = payload.priority;
  if (payload.reportedDate !== undefined) backend.reported_date = payload.reportedDate;
  if (payload.machine?.id !== undefined) backend.machine_id = payload.machine.id;
  return backend;
};

// Reuse in both create and update
createIntervention: async (payload) => {
  const backendPayload = mapInterventionDomainToBackend(payload);
  const response = await api.post('/items/intervention', backendPayload);
  return mapInterventionToDomain(response.data.data);
};

updateIntervention: async (id, updates) => {
  const backendUpdates = mapInterventionDomainToBackend(updates);
  const response = await api.patch(`/items/intervention/${id}`, backendUpdates);
  return mapInterventionToDomain(response.data.data);
};
```

**Why:** Prevents divergence bugs between create/update operations.

#### 4. Cache Invalidation with Logical Tags

Use structured tags instead of generic endpoint paths for cache invalidation.

```js
// ❌ WRONG - Generic, not granular
invalidateCache('/items/intervention');
invalidateCache('/items/intervention_action');

// ✅ CORRECT - Logical tags for granular control
invalidateCache(['interventions']); // All interventions
invalidateCache(['interventions', interventionId]); // Specific intervention
invalidateCache(['actions']); // All actions
invalidateCache(['actions', interventionId]); // Actions of one intervention
```

**Pattern applied to all write operations:**

```js
createIntervention: async (payload) => {
  const response = await api.post('/items/intervention', mapInterventionDomainToBackend(payload));
  invalidateCache(['interventions']); // Invalidate the list
  return mapInterventionToDomain(response.data.data);
};

updateIntervention: async (id, updates) => {
  const response = await api.patch(
    `/items/intervention/${id}`,
    mapInterventionDomainToBackend(updates)
  );
  invalidateCache(['interventions', id]); // Invalidate specific item + list
  return mapInterventionToDomain(response.data.data);
};

createAction: async (payload) => {
  const response = await api.post('/items/intervention_action', mapActionPayloadToBackend(payload));
  invalidateCache(['interventions', payload.intervention?.id]); // Invalidate parent
  invalidateCache(['actions']); // Invalidate global actions
  return mapActionToDomain(response.data.data);
};
```

**Why:** Prepares cache strategy for multi-backend scale. Even if current implementation ignores tags, contract is set for future.

### Example Adapter Skeleton (Production Pattern)

```js
// src/lib/api/adapters/mybackend.js

// ============================================================================
// Utility Functions (Centralized Normalizers)
// ============================================================================

const normalizeStatus = (raw) => {
  if (!raw) return 'open';
  if (typeof raw === 'string') return raw;
  if (raw.value) return raw.value;
  return 'open';
};

const mapInterventionDomainToBackend = (payload) => {
  const backend = {};
  if (payload.code !== undefined) backend.code = payload.code;
  if (payload.title !== undefined) backend.title = payload.title;
  if (payload.status !== undefined) backend.status_actual = payload.status;
  if (payload.type !== undefined) backend.type_inter = payload.type;
  if (payload.priority !== undefined) backend.priority = payload.priority;
  if (payload.reportedDate !== undefined) backend.reported_date = payload.reportedDate;
  if (payload.machine?.id !== undefined) backend.machine_id = payload.machine.id;
  return backend;
};

// ============================================================================
// Response Mappers (Backend → Domain DTOs)
// ============================================================================

const mapInterventionToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    code: item.code,
    title: item.title,
    status: normalizeStatus(item.status_actual), // Use centralized normalizer
    type: item.type_inter || 'CUR',
    priority: item.priority || 'normal',
    reportedDate: item.reported_date,
    machine: item.machine_id
      ? {
          id: item.machine_id.id,
          code: item.machine_id.code,
          name: item.machine_id.name,
        }
      : undefined,
    // NO _raw, NO backend fields
  };
};

// ============================================================================
// API Methods (Domain Interface)
// ============================================================================

export const adapter = {
  name: 'mybackend',
  client: {
    /* http client, baseURL, etc. */
  },
  errors: {
    /* error normalization */
  },

  interventions: {
    fetchIntervention: async (id) => {
      const response = await api.get(`/endpoint/intervention/${id}`);
      return mapInterventionToDomain(response.data);
    },

    createIntervention: async (payload) => {
      const backendPayload = mapInterventionDomainToBackend(payload);
      const response = await api.post('/endpoint/interventions', backendPayload);
      invalidateCache(['interventions']);
      return mapInterventionToDomain(response.data);
    },

    updateIntervention: async (id, updates) => {
      // Reuse same mapper as create
      const backendUpdates = mapInterventionDomainToBackend(updates);
      const response = await api.patch(`/endpoint/intervention/${id}`, backendUpdates);
      invalidateCache(['interventions', id]);
      return mapInterventionToDomain(response.data);
    },
  },

  // ... mirror other namespaces
};
```

## Env Configuration

- `VITE_DATA_API_URL` → base URL for the data API.
- `VITE_BACKEND_PROVIDER` → backend provider key (e.g., `directus`).

## Non-breaking Rules

- Add fields without removing or renaming existing ones.
- If a backend requires different shapes, adapt in the adapter, not in components.

## Data Access Convention (Contrat → Facade → Adapter)

This section specifies how the frontend must access data to guarantee backend interchangeability without touching components.

### Rule 0 — Strict Prohibitions (outside adapters/client)

- No direct imports of HTTP clients (`axios`, `fetch`).
- No backend URLs or path strings.
- No backend-specific tokens or storage keys.
- No backend-specific filters (`_eq`, `_and`, etc.) in components.

### Layers

- **Contract (domain):** Define stable DTOs/types used by the front. No HTTP/backends. Example: `AuthUser`, `AuthTokens`. Extend per feature: `Machine`, `Intervention`, `StockItem`, etc.
- **Facade (src/lib/api/facade):** Stable API for the front. Exposes namespaces (`auth`, `machines`, `interventions`, `stock`, `suppliers`, `client`, `errors`). Uses only domain types. Knows no backend details.
- **Adapter (src/lib/api/adapters/<provider>):** Maps backend specifics to domain contracts. Builds queries, handles filters/sorting/pagination, normalizes responses, and performs writes.

### Access Patterns

- **List:** `const list = await machines.fetchMachines();` → returns `Machine[]` (domain shape), including derived fields if documented (e.g., `statusColor`).
- **Detail:** `const interv = await interventions.fetchIntervention(id);` → returns `Intervention` (domain shape), with deep relations normalized.
- **Create:** `await stock.createPurchaseRequest(payload)` → adapter validates and maps payload into backend write, returns created domain DTO.
- **Update:** `await stock.updateStockItem(id, updates)` → adapter applies partial updates; returns updated domain DTO.
- **Delete:** `await stock.deleteStockItem(id)` → returns `void`/`true`.

### Filters, Sorting, Pagination

- Components pass high-level filters/sorts (optional, typed). Adapters translate to backend-specific query parameters.
- Defaults live in adapters (e.g., `limit:-1`, sort fields). Facade remains backend-agnostic.
- Pagination DTOs should be normalized: `{ items: T[], page: number, pageSize: number, total: number }` when applicable.

### Error Handling & Validation

- All calls go through `apiCall()`; errors are normalized to typed errors: `AuthenticationError`, `PermissionError`, `NotFoundError`, `ValidationError`, `NetworkError`.
- Adapters enforce runtime validation on critical writes (e.g., `supplier_ref` non-empty), normalize optional fields, and return domain DTOs.

### Code Examples

Read (list):

```js
import { machines } from 'src/lib/api/facade';
const list = await machines.fetchMachines();
```

Read (detail):

```js
import { interventions } from 'src/lib/api/facade';
const one = await interventions.fetchIntervention(interventionId);
```

Write (create):

```js
import { stock } from 'src/lib/api/facade';
const created = await stock.createPurchaseRequest({
  stockItemId: '...',
  quantity: 3,
  label: 'Courroie 12mm',
});
```

Write (update):

```js
import { stock } from 'src/lib/api/facade';
const updated = await stock.updateStockItem(stockItemId, {
  location: 'Aisle-3-B',
});
```

Clear cache:

```js
import { client } from 'src/lib/api/facade';
client.clearAllCache();
```

Note: `client` is a transversal utility exposed via the facade (headers, interceptors, cache helpers). It is not part of any domain; use it for cross-cutting concerns only.

### Provider Selection

- `getApiAdapter()` in `src/lib/api/adapters/provider.js` chooses the adapter based on `VITE_BACKEND_PROVIDER` (default: `directus`).
- To add a backend, implement `src/lib/api/adapters/<provider>.js` and expose the same namespaces and signatures.

### Validation Checks (Anti-debt)

- Replace backend with a mock adapter without touching the front.
- Grep checks in `src/` (excluding `adapters/` and `client.js`) should have no matches:
  - `directus`, `axios`, `BASE_URL`, backend-specific filters.
- **Adapter-level validation:**
  - No DTO returned by adapter should contain `_raw` or backend-specific fields.
  - All normalizers (e.g., `normalizeStatus()`) should be centralized and tested.
  - All payload mappers should be reused across create/update operations.
  - Cache invalidation should use logical tags, not endpoint paths.

## Golden Rule (Backend-agnostic DTOs)

- No DTO exposed by the facade should be guessable as coming from a specific backend.
- When the backend changes, DTOs do not change. Adapters absorb differences.

### Objective Test

Ask during review: “Can a developer implement a mock backend by reading this document without knowing Directus?”

- Expected answer: Yes.

## Final Rules (Lock-in)

- Adapter-only backend knowledge: Any backend identifiers, field names, enums or conventions MUST NOT appear outside `src/lib/api/adapters/*`.
- Facade is normative: The facade defines the API surface consumed by the front; backends adapt to it, not the other way around.
- DTOs are public contracts: Any non-additive change to a DTO is a breaking change and requires versioning or a migration plan.

## Best Practices for Adapter Implementation

### Structure

Every adapter MUST follow this structure:

```
┌─ Utility Functions
│  ├─ normalizeStatus() — Handle multi-format status
│  ├─ mapXxxDomainToBackend() — Reuse in create/update
│  └─ ... other normalizers
├─ Response Mappers (Backend → Domain)
│  ├─ mapXxxToDomain() — Pure domain DTOs, no _raw
│  └─ ... one per entity type
├─ Payload Mappers (Domain → Backend)
│  ├─ mapXxxPayloadToBackend() — For non-reused payloads
│  └─ ... optional (reuse DomainToBackend when possible)
└─ API Methods
   ├─ fetchXxx() — Reuse response mappers
   ├─ createXxx() — Reuse payload mappers + normalizers
   ├─ updateXxx() — Reuse same payload mapper as create
   └─ ... cache invalidation with logical tags
```

### Code Organization Example

```js
// GOOD: Organized adapter file
import { api, invalidateCache } from '../../client';
import { apiCall } from '../../errors';

// ============================================================================
// Utility Functions (Centralizers)
// ============================================================================
const normalizeStatus = (raw) => { ... };
const mapInterventionDomainToBackend = (payload) => { ... };

// ============================================================================
// Response Mappers (Backend → Domain DTOs)
// ============================================================================
const mapInterventionToDomain = (item) => { ... };
const mapActionToDomain = (item) => { ... };

// ============================================================================
// Payload Mappers (Optional, for non-reused payloads)
// ============================================================================
const mapActionPayloadToBackend = (payload) => { ... };

// ============================================================================
// API Methods (Domain Interface)
// ============================================================================
export const interventionsAdapter = {
  fetchIntervention: async (id) => { ... },
  createIntervention: async (payload) => { ... },
  updateIntervention: async (id, updates) => { ... },
  // ... etc
};
```

### Common Mistakes to Avoid

| Mistake                  | ❌ Wrong                                                        | ✅ Right                                                           |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| **DTO purity**           | `return { ...item, _raw: item }`                                | `return { id, code, status, ... }` (no backend fields)             |
| **Status normalization** | 4 mapper locations with `item.status_actual?.value \|\| ...`    | 1 function: `normalizeStatus(item.status_actual)` used everywhere  |
| **Payload mapping**      | Repeat `{ status_actual: payload.status }` in create and update | 1 mapper: `mapInterventionDomainToBackend(payload)` reused in both |
| **Cache invalidation**   | `invalidateCache('/items/intervention')` (generic path)         | `invalidateCache(['interventions', id])` (logical tags)            |
| **Backend leakage**      | Use `item.status_actual` in components                          | Use `status` (domain field) in components; mapping in adapter only |
| **Error in mapper**      | Catch and handle inside mapper                                  | Let `apiCall()` wrapper handle; mapper stays pure                  |

### Testing Strategy for Adapters

```js
// test/adapters/interventions.adapter.test.js

describe('normalizeStatus', () => {
  it('handles Directus format { value: "open" }', () => {
    expect(normalizeStatus({ value: 'open' })).toBe('open');
  });
  it('handles FastAPI string "open"', () => {
    expect(normalizeStatus('open')).toBe('open');
  });
  it('handles null/undefined', () => {
    expect(normalizeStatus(null)).toBe('open');
    expect(normalizeStatus(undefined)).toBe('open');
  });
});

describe('mapInterventionDomainToBackend', () => {
  it('maps domain fields to backend fields', () => {
    const result = mapInterventionDomainToBackend({
      code: 'INT-001',
      status: 'open',
      reportedDate: '2025-12-26',
    });
    expect(result).toEqual({
      code: 'INT-001',
      status_actual: 'open',
      reported_date: '2025-12-26',
    });
  });
  it('ignores undefined fields', () => {
    const result = mapInterventionDomainToBackend({ code: 'INT-001' });
    expect(result).toEqual({ code: 'INT-001' });
    expect(result.status_actual).toBeUndefined();
  });
});

describe('mapInterventionToDomain', () => {
  it('returns pure domain DTO with no backend fields', () => {
    const directusResponse = {
      id: '1',
      code: 'INT-001',
      status_actual: { value: 'open' },
      type_inter: 'CUR',
    };
    const result = mapInterventionToDomain(directusResponse);
    expect(result).toEqual({
      id: '1',
      code: 'INT-001',
      status: 'open', // normalized
      type: 'CUR',
      // No _raw, no status_actual
    });
    expect(result._raw).toBeUndefined();
  });
});

describe('createIntervention', () => {
  it('maps payload, posts, invalidates cache, returns DTO', async () => {
    const payload = { code: 'INT-001', status: 'open' };
    // Mock api.post to return Directus response
    jest.spyOn(api, 'post').mockResolvedValue({
      data: { id: '1', code: 'INT-001', status_actual: { value: 'open' } },
    });

    const result = await interventionsAdapter.createIntervention(payload);

    expect(api.post).toHaveBeenCalledWith(
      '/items/intervention',
      { code: 'INT-001', status_actual: 'open' } // Backend format
    );
    expect(invalidateCache).toHaveBeenCalledWith(['interventions']);
    expect(result).toEqual({
      id: '1',
      code: 'INT-001',
      status: 'open', // Domain format
      // No _raw
    });
  });
});
```

### Migration Checklist for New Backend

- [ ] Create `src/lib/api/adapters/<provider>/interventions.adapter.js`
- [ ] Define `normalizeStatus()` for status field handling
- [ ] Define `mapInterventionDomainToBackend()` reusable mapper
- [ ] Define response mappers (mapInterventionToDomain, etc.) — ensure NO `_raw` or backend fields
- [ ] Implement `fetchInterventions()` using response mapper
- [ ] Implement `createIntervention()` using payload mapper + response mapper
- [ ] Implement `updateIntervention()` reusing same payload mapper
- [ ] Use logical cache tags: `invalidateCache(['interventions', id])`
- [ ] Write unit tests for normalizers
- [ ] Write integration tests for CRUD flows
- [ ] Verify no backend identifiers in returned DTOs
- [ ] Run grep checks to confirm no backend leakage outside adapters
