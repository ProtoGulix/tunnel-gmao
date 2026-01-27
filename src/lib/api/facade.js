import { getApiAdapter } from './adapters/provider';
import { exportAdapter } from './adapters/export.adapter';

/**
 * Stable API Facade
 *
 * Central entry point for all API operations. Provides a stable contract
 * independent of the backend implementation. Internally delegates to the
 * appropriate adapter based on VITE_BACKEND_PROVIDER configuration.
 *
 * @module lib/api/facade
 *
 * Architecture:
 * - Facade (this module): Stable public API
 * - Provider: Selects implementation based on env var
 * - Adapters: Backend-specific implementations (under src/lib/api/adapters/<provider>/)
 * - DTOs: Domain models defined in docs/tech/API_CONTRACTS.md
 *
 * Usage:
 * ```javascript
 * import { auth, machines, stock } from 'src/lib/api/facade';
 *
 * // Authentication
 * const user = await auth.getCurrentUser();
 *
 * // Machines
 * const machines = await machines.fetchMachines();
 * const detail = await machines.fetchMachine('machine-id');
 *
 * // Stock Management
 * const items = await stock.fetchStockItems();
 * const specs = await stock.fetchStockItemStandardSpecs('item-id');
 * ```
 *
 * Switching backends:
 * Set VITE_BACKEND_PROVIDER env var to implement a new adapter with the same interface.
 *
 * @see docs/tech/API_CONTRACTS.md - Complete DTO definitions and contracts
 * @see src/lib/api/adapters/provider.js - Provider implementation
 * @see src/lib/api/adapters/provider.js - Provider implementation
 */

// ==============================
// INFRASTRUCTURE
// ==============================

/**
 * Provider: Selects backend implementation based on environment variable.
 * Returns an adapter implementing the stable contract (backend adapter or equivalent).
 *
 * Export service: Independent adapter for file/data export operations.
 * Not affected by backend provider changes.
 */

// ==============================
// FACADE INITIALIZATION
// ==============================

/**
 * Complete API object containing all namespaces.
 * This is the raw result from the provider (adapter implementation).
 *
 * @type {Object}
 * @property {Object} auth - Authentication namespace
 * @property {Object} interventions - Interventions namespace
 * @property {Object} interventionStatusRefs - Status references namespace
 * @property {Object} actions - Actions namespace
 * @property {Object} actionSubcategories - Action subcategories namespace
 * @property {Object} machines - Machines namespace
 * @property {Object} stock - Stock management namespace
 * @property {Object} suppliers - Suppliers namespace
 * @property {Object} stockSuppliers - Stock-supplier links namespace
 * @property {Object} stockSpecs - Stock specs namespace
 * @property {Object} manufacturerItems - Manufacturer items namespace
 * @property {Object} client - Raw HTTP client and config
 * @property {Object} errors - Unified error types
 */
export const API = getApiAdapter();

// ==============================
// NAMESPACE EXPORTS (Destructured for concise imports)
// ==============================

/**
 * **Authentication**
 *
 * Functions:
 * - `login(email, password)` → `AuthTokens`
 * - `logout()` → `void`
 * - `getCurrentUser()` → `AuthUser`
 * - `refreshToken()` → `AuthTokens`
 *
 * @type {Object}
 *
 * @example
 * import { auth } from 'src/lib/api/facade';
 * const user = await auth.getCurrentUser();
 */
export const { auth } = API;

/**
 * **Interventions (Maintenance Orders)**
 *
 * Functions:
 * - `fetchInterventions(machineId?)` → `Intervention[]` (optional machine filter)
 * - `fetchIntervention(id)` → `Intervention`
 * - `createIntervention(payload)` → `Intervention`
 * - `updateIntervention(id, updates)` → `Intervention`
 * - `addAction(action)` → `InterventionAction`
 * - `addPart(part)` → `InterventionPart`
 *
 * @type {Object}
 *
 * @example
 * import { interventions } from 'src/lib/api/facade';
 * // Toutes les interventions
 * const list = await interventions.fetchInterventions();
 * // Interventions d'une machine spécifique
 * const machineInterventions = await interventions.fetchInterventions('machine-123');
 * // Détail d'une intervention
 * const detail = await interventions.fetchIntervention('int-123');
 */
export const { interventions } = API;

/**
 * **Intervention Status References**
 *
 * Static reference data for intervention statuses (open, in_progress, closed, etc.)
 *
 * Functions:
 * - `fetchStatusRefs()` → `StatusRef[]`
 *
 * @type {Object}
 */
export const { interventionStatusRefs } = API;

/**
 * **Actions (Intervention Subtasks)**
 *
 * Actions taken during an intervention (repair steps, diagnostics, etc.)
 *
 * Functions:
 * - `fetchActions(interventionId)` → `InterventionAction[]`
 * - `createAction(payload)` → `InterventionAction`
 * - `updateAction(id, updates)` → `InterventionAction`
 * - `deleteAction(id)` → `void`
 *
 * @type {Object}
 */
export const { actions } = API;

/**
 * **Service Stats**
 *
 * Functions:
 * - `fetchServiceStatus({ startDate, endDate })` → `ServiceStatusMetrics`
 *
 * @type {Object}
 */
export const { stats } = API;

/**
 * **Action Subcategories**
 *
 * Categorization for action types within interventions.
 *
 * Functions:
 * - `fetchSubcategories()` → `ActionSubcategory[]`
 *
 * @type {Object}
 */
export const { actionSubcategories } = API;

/**
 * **Anomaly Configuration**
 *
 * Dynamic configuration for anomaly detection in actions.
 * Loaded from backend, cached for performance.
 *
 * Functions:
 * - `fetchAnomalyConfiguration()` → `AnomalyConfig`
 * - `fetchCategoryMeta()` → `CategoryMeta[]`
 * - `fetchClassificationProbes()` → `ClassificationProbe[]`
 * - `fetchThresholds()` → `Threshold[]`
 * - `invalidateCache()` → `void`
 *
 * @type {Object}
 *
 * @example
 * import { anomalyConfig } from 'src/lib/api/facade';
 * const config = await anomalyConfig.fetchAnomalyConfiguration();
 */
export const { anomalyConfig } = API;

/**
 * **Machines (Equipment)**
 *
 * Functions:
 * - `fetchMachines()` → `Machine[]`
 * - `fetchMachine(id)` → `Machine`
 * - `fetchMachinesWithInterventions()` → `MachineWithStats[]`
 * - `updateMachine(id, updates)` → `Machine`
 *
 * @type {Object}
 *
 * @example
 * import { machines } from 'src/lib/api/facade';
 * const machineList = await machines.fetchMachines();
 * const detail = await machines.fetchMachine('mach-456');
 */
export const { machines } = API;

/**
 * **Preventive Maintenance Suggestions**
 *
 * Functions:
 * - `fetchAllPreventiveSuggestions(status)` → `PreventiveSuggestion[]`
 * - `fetchPreventiveSuggestions(machineId, status)` → `PreventiveSuggestion[]`
 * - `acceptPreventiveSuggestion(suggestionId, userId)` → `PreventiveSuggestion`
 * - `rejectPreventiveSuggestion(suggestionId, userId)` → `PreventiveSuggestion`
 * - `reviewPreventiveSuggestion(suggestionId)` → `PreventiveSuggestion`
 *
 * @type {Object}
 *
 * @example
 * import { preventive } from 'src/lib/api/facade';
 * const allSuggestions = await preventive.fetchAllPreventiveSuggestions();
 * const machineSuggestions = await preventive.fetchPreventiveSuggestions('machine-123');
 * await preventive.acceptPreventiveSuggestion('suggestion-id', userId);
 */
export const { preventive } = API;

/**
 * **Stock Management**
 *
 * Core stock operations: items, specs, purchasing.
 *
 * Functions:
 * - `fetchStockItems()` → `StockItem[]`
 * - `createStockItem(item)` → `StockItem`
 * - `updateStockItem(id, updates)` → `StockItem`
 * - `deleteStockItem(id)` → `void`
 * - `fetchStockItemStandardSpecs(stockItemId)` → `StockItemStandardSpec[]`
 * - `createStockItemStandardSpec(spec)` → `StockItemStandardSpec`
 * - `updateStockItemStandardSpec(id, updates)` → `StockItemStandardSpec`
 * - `deleteStockItemStandardSpec(id)` → `void`
 * - `fetchStockFamilies()` → `StockFamily[]`
 * - `fetchStockSubFamilies(familyCode)` → `StockSubFamily[]`
 * - `createPurchaseRequest(payload)` → `PurchaseRequest`
 * - `fetchPurchaseRequests()` → `PurchaseRequest[]`
 *
 * @type {Object}
 *
 * @example
 * import { stock } from 'src/lib/api/facade';
 * const items = await stock.fetchStockItems();
 * const specs = await stock.fetchStockItemStandardSpecs('item-id');
 * const pr = await stock.createPurchaseRequest({ ...payload });
 */
export const { stock } = API;

/**
 * **Suppliers**
 *
 * Supplier master data.
 *
 * Functions:
 * - `fetchSuppliers()` → `Supplier[]`
 * - `fetchSupplier(id)` → `Supplier`
 * - `createSupplier(supplier)` → `Supplier`
 * - `updateSupplier(id, updates)` → `Supplier`
 * - `deleteSupplier(id)` → `void`
 *
 * @type {Object}
 */
export const { suppliers } = API;

/**
 * **Stock-Supplier Links**
 *
 * Many-to-many relationships between stock items and suppliers.
 *
 * Functions:
 * - `fetchStockItemSuppliers(stockItemId)` → `StockItemSupplierLink[]`
 * - `createStockItemSupplier(link)` → `StockItemSupplierLink`
 * - `updateStockItemSupplier(id, updates)` → `StockItemSupplierLink`
 * - `deleteStockItemSupplier(id)` → `void`
 *
 * @type {Object}
 */
export const { stockSuppliers } = API;

/**
 * **Stock Item Specifications**
 *
 * Detailed spec metadata for stock items.
 *
 * Functions:
 * - `fetchStockSpecs()` → `StockSpec[]`
 * - `fetchStockSpecsForItem(stockItemId)` → `StockSpec[]`
 * - `createStockSpec(spec)` → `StockSpec`
 * - `updateStockSpec(id, updates)` → `StockSpec`
 * - `deleteStockSpec(id)` → `void`
 *
 * @type {Object}
 */
export const { stockSpecs } = API;

/**
 * **Manufacturer Items**
 *
 * Manufacturer part numbers and designations (used during ordering).
 *
 * Functions:
 * - `findManufacturerItem({ name, ref })` → `ManufacturerItem | null`
 * - `createManufacturerItem({ name, ref, designation })` → `ManufacturerItem`
 * - `getOrCreateManufacturerItem(...)` → `ManufacturerItem | null`
 *
 * @type {Object}
 */
export const { manufacturerItems } = API;

/**
 * **Low-Level HTTP Client**
 *
 * Raw axios instance and cache utilities. Only use if a function from
 * the namespaces above doesn't exist.
 *
 * Properties:
 * - `api` (axios instance)
 * - `BASE_URL` (API base URL)
 * - `clearAllCache()` (clear in-memory cache)
 *
 * @type {Object}
 *
 * @warning Direct use of `client.api` bypasses error handling. Consider
 * creating a new function in the appropriate adapter instead.
 *
 * @example
 * import { client } from 'src/lib/api/facade';
 * const response = await client.api.get('/items/machines');
 */
export const { client } = API;

/**
 * **Error Classes**
 *
 * Unified error types for standardized error handling across the app.
 *
 * Classes:
 * - `APIError` (base class)
 * - `AuthenticationError` (401)
 * - `PermissionError` (403)
 * - `NotFoundError` (404)
 * - `ValidationError` (400/422)
 * - `NetworkError` (no server response)
 *
 * Utilities:
 * - `handleAPIError(error, context)` - Convert axios error to typed error
 * - `toErrorDTO(error)` - Serialize any error to DTO
 * - `getUserFriendlyMessage(error)` - Get UI-friendly error text
 * - `apiCall(fn, context)` - Wrapped API call with error handling
 * - `isTypedError(error)` - Check if error is typed
 *
 * @type {Object}
 *
 * @example
 * import { errors } from 'src/lib/api/facade';
 * try {
 *   await api.get('/items');
 * } catch (err) {
 *   const typed = errors.handleAPIError(err, 'fetchItems');
 *   const msg = errors.getUserFriendlyMessage(typed);
 * }
 */
export const { errors } = API;

// ==============================
// EXPORT SERVICE
// ==============================

/**
 * **Export Service**
 *
 * Independent service for exporting data (CSV, PDF, Excel).
 * Not affected by backend provider changes.
 *
 * Functions:
 * - `exportToCSV(data, filename)` → `void`
 * - `exportToPDF(data, options)` → `void`
 * - `exportToExcel(data, filename)` → `void`
 *
 * @type {Object}
 *
 * @example
 * import { exportService } from 'src/lib/api/facade';
 * await exportService.exportToCSV(machines, 'machines.csv');
 */
export const exportService = exportAdapter;
