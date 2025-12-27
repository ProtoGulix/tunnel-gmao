/**
 * ApiAdapter TypeScript Interface
 *
 * Strictly represents the public API exposed by src/lib/api/facade.js.
 * Defines the contract that all backend adapters must implement.
 *
 * Rules:
 * - One namespace per domain
 * - No backend-specific fields (pure domain DTOs)
 * - client exposes { api, BASE_URL, clearAllCache }
 * - errors exposes unified error helpers
 * - This is a TYPE-ONLY interface - no implementation logic
 *
 * @see src/lib/api/facade.js - Runtime implementation
 * @see docs/tech/API_CONTRACTS.md - Complete DTO definitions
 */

// ==============================
// DOMAIN DTOs
// ==============================

/**
 * Authentication DTOs
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: {
    id: string;
    name: string;
  };
}

/**
 * Machine DTOs
 */
export interface Machine {
  id: string;
  code?: string;
  name: string;
  location?: string;
  zone?: {
    id: string;
    name?: string;
  };
  workshop?: {
    id: string;
    name?: string;
  };
  parent?: {
    id: string;
    code?: string;
    name?: string;
  };
  tree?: {
    id: string;
    code?: string;
    name?: string;
  };
}

export interface MachineWithStats extends Machine {
  openInterventionsCount: number;
  interventionsByType: Record<string, number>;
  status: 'ok' | 'maintenance' | 'warning' | 'critical';
  statusColor: 'green' | 'blue' | 'orange' | 'red';
  interventions: Intervention[];
}

/**
 * Intervention DTOs
 */
export type InterventionStatus = 'open' | 'in_progress' | 'closed';
export type InterventionType = 'CUR' | 'PRE' | 'PRO';
export type InterventionPriority = 'faible' | 'normale' | 'important' | 'urgent';

export interface Intervention {
  id: string;
  code: string;
  title: string;
  status: InterventionStatus;
  type: InterventionType;
  priority?: InterventionPriority;
  reportedDate?: string;
  machine?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface InterventionAction {
  id: string;
  description: string;
  timeSpent?: number;
  complexityScore?: number;
  createdAt: string;
  technician?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subcategory?: {
    id: string;
    code?: string;
    name?: string;
  };
  intervention?: {
    id: string;
    code?: string;
    title?: string;
  };
}

export interface InterventionPart {
  id: string;
  quantity: number;
  note?: string;
  stockItem?: {
    id: string;
    ref?: string;
    name?: string;
  };
}

export interface StatusRef {
  id: string;
  value: string;
}

export interface InterventionStatusLog {
  id: string;
  date: string;
  from?: {
    id: string;
    value?: string;
  };
  to?: {
    id: string;
    value?: string;
  };
  technician?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Action Subcategory DTOs
 */
export interface ActionSubcategory {
  id: string;
  code?: string;
  name?: string;
}

/**
 * Manufacturer Item DTOs
 */
export interface ManufacturerItem {
  id: string;
  manufacturerName?: string;
  manufacturerRef?: string;
  designation?: string;
}

/**
 * Stock DTOs
 */
export interface StockItem {
  id: string;
  name: string;
  familyCode?: string;
  subFamilyCode?: string;
  spec?: string;
  dimension?: string;
  ref?: string;
  quantity?: number;
  unit?: string;
  location?: string;
  manufacturerItem?: ManufacturerItem;
}

export interface StockItemStandardSpec {
  id: string;
  stockItemId: string;
  title: string;
  text: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockFamily {
  code: string;
  label: string;
}

export interface StockSubFamily {
  id: string;
  familyCode: string;
  code: string;
  label: string;
}

/**
 * Supplier DTOs
 */
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  itemCount?: number;
}

/**
 * Stock-Supplier Link DTOs
 */
export interface StockItemSupplierLink {
  id: string;
  stockItemId: string;
  supplier: {
    id: string;
    name?: string;
  };
  supplierRef: string;
  isPreferred?: boolean;
  unitPrice?: number;
  deliveryTimeDays?: number;
  manufacturerItem?: ManufacturerItem;
}

/**
 * Purchase Request DTOs
 */
export type PurchaseRequestStatus = 'open' | 'in_progress' | 'closed' | 'cancelled';

export interface PurchaseRequest {
  id: string;
  status: PurchaseRequestStatus;
  requestedBy?: string;
  itemLabel?: string;
  quantity: number;
  intervention?: {
    id: string;
    code?: string;
  };
}

/**
 * Supplier Order DTOs
 */
export type SupplierOrderStatus = 'open' | 'confirmed' | 'received' | 'cancelled';

export interface SupplierOrder {
  id: string;
  orderNumber?: string;
  supplier: {
    id: string;
    name?: string;
    email?: string;
    contactName?: string;
  };
  status: SupplierOrderStatus;
  totalAmount?: number;
  createdAt?: string;
  orderedAt?: string;
  receivedAt?: string;
}

export interface SupplierOrderLine {
  id: string;
  supplierOrderId: string;
  stockItem: StockItem & {
    standardSpecs?: StockItemStandardSpec[];
  };
  supplierRefSnapshot?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  createdAt?: string;
  purchaseRequests?: Array<{
    id: string;
    requestedBy?: string;
    itemLabel?: string;
    intervention?: {
      id: string;
      code?: string;
    };
    quantity: number;
  }>;
}

export interface DispatchResult {
  dispatched: string[];
  toQualify: string[];
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// ==============================
// ERROR TYPES
// ==============================

export interface ErrorDTO {
  name: string;
  message: string;
  statusCode: number;
  details: any;
  timestamp: string;
}

export interface APIErrorClass {
  new (message?: string, statusCode?: number, details?: any): Error & {
    name: string;
    statusCode: number;
    details: any;
    timestamp: Date;
    toDTO(): ErrorDTO;
  };
}

// ==============================
// NAMESPACE INTERFACES
// ==============================

/**
 * Authentication namespace
 */
export interface AuthNamespace {
  login(email: string, password: string): Promise<AuthTokens>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser>;
  refreshToken(): Promise<AuthTokens>;
}

/**
 * Interventions namespace
 */
export interface InterventionsNamespace {
  fetchInterventions(): Promise<Intervention[]>;
  fetchIntervention(id: string): Promise<Intervention>;
  createIntervention(payload: Partial<Intervention>): Promise<Intervention>;
  updateIntervention(id: string, updates: Partial<Intervention>): Promise<Intervention>;
  addAction(action: Partial<InterventionAction>): Promise<InterventionAction>;
  addPart(part: Partial<InterventionPart>): Promise<InterventionPart>;
}

/**
 * Intervention Status References namespace
 */
export interface InterventionStatusRefsNamespace {
  fetchStatusRefs(): Promise<StatusRef[]>;
}

/**
 * Intervention Status Logs namespace
 */
export interface InterventionStatusLogsNamespace {
  fetchInterventionStatusLog(interventionId: string): Promise<InterventionStatusLog[]>;
}

/**
 * Actions namespace
 */
export interface ActionsNamespace {
  fetchActions(interventionId?: string): Promise<InterventionAction[]>;
  createAction(payload: Partial<InterventionAction>): Promise<InterventionAction>;
  updateAction(id: string, updates: Partial<InterventionAction>): Promise<InterventionAction>;
  deleteAction(id: string): Promise<void>;
}

/**
 * Action Subcategories namespace
 */
export interface ActionSubcategoriesNamespace {
  fetchSubcategories(): Promise<ActionSubcategory[]>;
}

/**
 * Machines namespace
 */
export interface MachinesNamespace {
  fetchMachines(): Promise<Machine[]>;
  fetchMachine(id: string): Promise<Machine>;
  fetchMachinesWithInterventions(): Promise<MachineWithStats[]>;
  updateMachine(id: string, updates: Partial<Machine>): Promise<Machine>;
}

/**
 * Stock namespace
 */
export interface StockNamespace {
  fetchStockItems(): Promise<StockItem[]>;
  createStockItem(item: Partial<StockItem>): Promise<StockItem>;
  updateStockItem(id: string, updates: Partial<StockItem>): Promise<StockItem>;
  deleteStockItem(id: string): Promise<void | true>;
  fetchStockItemStandardSpecs(stockItemId: string): Promise<StockItemStandardSpec[]>;
  createStockItemStandardSpec(spec: Partial<StockItemStandardSpec>): Promise<StockItemStandardSpec>;
  updateStockItemStandardSpec(id: string, updates: Partial<StockItemStandardSpec>): Promise<StockItemStandardSpec>;
  deleteStockItemStandardSpec(id: string): Promise<void | true>;
  fetchStockFamilies(): Promise<StockFamily[]>;
  fetchStockSubFamilies(familyCode: string): Promise<StockSubFamily[]>;
  createPurchaseRequest(payload: Partial<PurchaseRequest>): Promise<PurchaseRequest>;
  fetchPurchaseRequests(): Promise<PurchaseRequest[]>;
}

/**
 * Suppliers namespace
 */
export interface SuppliersNamespace {
  fetchSuppliers(): Promise<Supplier[]>;
  fetchSupplier(id: string): Promise<Supplier>;
  createSupplier(supplier: Partial<Supplier>): Promise<Supplier>;
  updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void | true>;
}

/**
 * Stock-Supplier Links namespace
 */
export interface StockSuppliersNamespace {
  fetchStockItemSuppliers(stockItemId: string): Promise<StockItemSupplierLink[]>;
  createStockItemSupplier(link: Partial<StockItemSupplierLink>): Promise<StockItemSupplierLink>;
  updateStockItemSupplier(id: string, updates: Partial<StockItemSupplierLink>): Promise<StockItemSupplierLink>;
  deleteStockItemSupplier(id: string): Promise<void | true>;
}

/**
 * Stock Specs namespace (alternative to StockItemStandardSpec in stock namespace)
 */
export interface StockSpecsNamespace {
  fetchStockSpecs(): Promise<StockItemStandardSpec[]>;
  fetchStockSpecsForItem(stockItemId: string): Promise<StockItemStandardSpec[]>;
  createStockSpec(spec: Partial<StockItemStandardSpec>): Promise<StockItemStandardSpec>;
  updateStockSpec(id: string, updates: Partial<StockItemStandardSpec>): Promise<StockItemStandardSpec>;
  deleteStockSpec(id: string): Promise<void | true>;
}

/**
 * Manufacturer Items namespace
 */
export interface ManufacturerItemsNamespace {
  findManufacturerItem(params: { name?: string; ref?: string }): Promise<ManufacturerItem | null>;
  createManufacturerItem(item: { name: string; ref: string; designation?: string }): Promise<ManufacturerItem>;
  getOrCreateManufacturerItem(params: { name: string; ref: string; designation?: string }): Promise<ManufacturerItem | null>;
}

/**
 * Client namespace - low-level HTTP client
 */
export interface ClientNamespace {
  api: any; // axios instance
  BASE_URL: string;
  clearAllCache(): void;
}

/**
 * Errors namespace - unified error handling
 */
export interface ErrorsNamespace {
  APIError: APIErrorClass;
  AuthenticationError: APIErrorClass;
  PermissionError: APIErrorClass;
  NotFoundError: APIErrorClass;
  ValidationError: APIErrorClass;
  NetworkError: APIErrorClass;
  handleAPIError(error: any, context?: string): Error;
  toErrorDTO(error: any): ErrorDTO;
  getUserFriendlyMessage(error: any): string;
  apiCall<T>(fn: () => Promise<T>, context?: string): Promise<T>;
  isTypedError(error: any): boolean;
}

// ==============================
// MAIN ADAPTER INTERFACE
// ==============================

/**
 * Complete ApiAdapter interface
 *
 * This is the contract that all backend adapters must implement.
 * The facade re-exports these namespaces for component consumption.
 */
export interface ApiAdapter {
  auth: AuthNamespace;
  interventions: InterventionsNamespace;
  interventionStatusRefs: InterventionStatusRefsNamespace;
  interventionStatusLogs: InterventionStatusLogsNamespace;
  actions: ActionsNamespace;
  actionSubcategories: ActionSubcategoriesNamespace;
  machines: MachinesNamespace;
  stock: StockNamespace;
  suppliers: SuppliersNamespace;
  stockSuppliers: StockSuppliersNamespace;
  stockSpecs: StockSpecsNamespace;
  manufacturerItems: ManufacturerItemsNamespace;
  client: ClientNamespace;
  errors: ErrorsNamespace;
}
