/**
 * Mock API Adapter
 * 
 * Fully implements the ApiAdapter interface without any HTTP or backend dependencies.
 * This adapter allows the app to build and run without a real backend connection.
 * 
 * Purpose:
 * - Verify architecture is backend-agnostic (if this compiles, architecture is sound)
 * - Enable offline development and testing
 * - Provide fast, deterministic responses for UI development
 * - Zero external dependencies (no axios, no network calls)
 * 
 * Rules:
 * - Returns minimal valid DTOs (empty arrays, basic objects)
 * - NO imports from HTTP libraries or backend-specific code
 * - Fully typed according to ApiAdapter interface
 * - Can be used with VITE_BACKEND_PROVIDER=mock
 * 
 * @module lib/api/adapters/mock
 */

import type { ApiAdapter } from '../ApiAdapter';

/**
 * Mock Authentication namespace
 */
const auth = {
  async login(email: string, password: string) {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  },
  
  async logout() {
    // No-op
  },
  
  async getCurrentUser() {
    return {
      id: 'mock-user-id',
      email: 'mock@example.com',
      firstName: 'Mock',
      lastName: 'User',
      role: {
        id: 'mock-role-id',
        name: 'Admin',
      },
    };
  },
  
  async refreshToken() {
    return {
      accessToken: 'mock-refreshed-token',
      refreshToken: 'mock-refresh-token',
    };
  },
};

/**
 * Mock Interventions namespace
 */
const interventions = {
  async fetchInterventions() {
    return [];
  },
  
  async fetchIntervention(id: string) {
    return {
      id,
      code: 'INT-001',
      title: 'Mock Intervention',
      status: 'open' as const,
      type: 'CUR' as const,
    };
  },
  
  async createIntervention(payload: any) {
    return {
      id: 'new-intervention-id',
      code: payload.code || 'INT-NEW',
      title: payload.title || 'New Intervention',
      status: 'open' as const,
      type: payload.type || 'CUR' as const,
    };
  },
  
  async updateIntervention(id: string, updates: any) {
    return {
      id,
      code: 'INT-001',
      title: updates.title || 'Updated Intervention',
      status: updates.status || 'open' as const,
      type: 'CUR' as const,
    };
  },
  
  async addAction(action: any) {
    return {
      id: 'new-action-id',
      description: action.description || '',
      createdAt: new Date().toISOString(),
    };
  },
  
  async addPart(part: any) {
    return {
      id: 'new-part-id',
      quantity: part.quantity || 1,
    };
  },
};

/**
 * Mock Intervention Status References namespace
 */
const interventionStatusRefs = {
  async fetchStatusRefs() {
    return [
      { id: '1', value: 'open' },
      { id: '2', value: 'in_progress' },
      { id: '3', value: 'closed' },
    ];
  },
};

/**
 * Mock Intervention Status Logs namespace
 */
const interventionStatusLogs = {
  async fetchInterventionStatusLog(interventionId: string) {
    return [];
  },
};

/**
 * Mock Actions namespace
 */
const actions = {
  async fetchActions(interventionId?: string) {
    return [];
  },
  
  async createAction(payload: any) {
    return {
      id: 'new-action-id',
      description: payload.description || '',
      createdAt: new Date().toISOString(),
    };
  },
  
  async updateAction(id: string, updates: any) {
    return {
      id,
      description: updates.description || '',
      createdAt: new Date().toISOString(),
    };
  },
  
  async deleteAction(id: string) {
    // No-op
  },
};

/**
 * Mock Action Subcategories namespace
 */
const actionSubcategories = {
  async fetchSubcategories() {
    return [];
  },
};

/**
 * Mock Machines namespace
 */
const machines = {
  async fetchMachines() {
    return [];
  },
  
  async fetchMachine(id: string) {
    return {
      id,
      name: 'Mock Machine',
    };
  },
  
  async fetchMachinesWithInterventions() {
    return [];
  },
  
  async updateMachine(id: string, updates: any) {
    return {
      id,
      name: updates.name || 'Mock Machine',
    };
  },
};

/**
 * Mock Stock namespace
 */
const stock = {
  async fetchStockItems() {
    return [];
  },
  
  async createStockItem(item: any) {
    return {
      id: 'new-stock-item-id',
      name: item.name || 'Mock Item',
    };
  },
  
  async updateStockItem(id: string, updates: any) {
    return {
      id,
      name: updates.name || 'Mock Item',
    };
  },
  
  async deleteStockItem(id: string) {
    // No-op
  },
  
  async fetchStockItemStandardSpecs(stockItemId: string) {
    return [];
  },
  
  async createStockItemStandardSpec(spec: any) {
    return {
      id: 'new-spec-id',
      stockItemId: spec.stockItemId || '',
      title: spec.title || '',
      text: spec.text || '',
    };
  },
  
  async updateStockItemStandardSpec(id: string, updates: any) {
    return {
      id,
      stockItemId: updates.stockItemId || '',
      title: updates.title || '',
      text: updates.text || '',
    };
  },
  
  async deleteStockItemStandardSpec(id: string) {
    // No-op
  },
  
  async fetchStockFamilies() {
    return [];
  },
  
  async fetchStockSubFamilies(familyCode: string) {
    return [];
  },
  
  async createPurchaseRequest(payload: any) {
    return {
      id: 'new-pr-id',
      status: 'open' as const,
      quantity: payload.quantity || 1,
    };
  },
  
  async fetchPurchaseRequests() {
    return [];
  },
};

/**
 * Mock Suppliers namespace
 */
const suppliers = {
  async fetchSuppliers() {
    return [];
  },
  
  async fetchSupplier(id: string) {
    return {
      id,
      name: 'Mock Supplier',
    };
  },
  
  async createSupplier(supplier: any) {
    return {
      id: 'new-supplier-id',
      name: supplier.name || 'New Supplier',
    };
  },
  
  async updateSupplier(id: string, updates: any) {
    return {
      id,
      name: updates.name || 'Mock Supplier',
    };
  },
  
  async deleteSupplier(id: string) {
    // No-op
  },

  async dispatchPurchaseRequests() {
    return {
      dispatched: [],
      toQualify: [],
      errors: [],
    };
  },
};

/**
 * Mock Stock-Supplier Links namespace
 */
const stockSuppliers = {
  async fetchStockItemSuppliers(stockItemId: string) {
    return [];
  },
  
  async createStockItemSupplier(link: any) {
    return {
      id: 'new-link-id',
      stockItemId: link.stockItemId || '',
      supplier: { id: 'supplier-id' },
      supplierRef: link.supplierRef || '',
    };
  },
  
  async updateStockItemSupplier(id: string, updates: any) {
    return {
      id,
      stockItemId: updates.stockItemId || '',
      supplier: { id: 'supplier-id' },
      supplierRef: updates.supplierRef || '',
    };
  },
  
  async deleteStockItemSupplier(id: string): Promise<void> {
    // No-op
  },
};

/**
 * Mock Stock Specs namespace
 */
const stockSpecs = {
  async fetchStockSpecs() {
    return [];
  },
  
  async fetchStockSpecsForItem(stockItemId: string) {
    return [];
  },
  
  async createStockSpec(spec: any) {
    return {
      id: 'new-spec-id',
      stockItemId: spec.stockItemId || '',
      title: spec.title || '',
      text: spec.text || '',
    };
  },
  
  async updateStockSpec(id: string, updates: any) {
    return {
      id,
      stockItemId: updates.stockItemId || '',
      title: updates.title || '',
      text: updates.text || '',
    };
  },
  
  async deleteStockSpec(id: string): Promise<void> {
    // Mock: ne fait rien 
  },
};

/**
 * Mock Manufacturer Items namespace
 */
const manufacturerItems = {
  async findManufacturerItem(params: any) {
    return null;
  },
  
  async createManufacturerItem(item: any) {
    return {
      id: 'new-manufacturer-item-id',
      manufacturerName: item.name,
      manufacturerRef: item.ref,
      designation: item.designation,
    };
  },
  
  async getOrCreateManufacturerItem(params: any) {
    return {
      id: 'manufacturer-item-id',
      manufacturerName: params.name,
      manufacturerRef: params.ref,
      designation: params.designation,
    };
  },
};

/**
 * Mock Client namespace (no real HTTP client)
 */
const client = {
  api: null, // No axios instance
  BASE_URL: 'mock://localhost',
  clearAllCache() {
    // No-op
  },
};

/**
 * Mock Errors namespace
 */
class MockAPIError extends Error {
  statusCode: number;
  details: any;
  timestamp: Date;
  
  constructor(message = 'Mock API Error', statusCode = 500, details = null) {
    super(message);
    this.name = 'MockAPIError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
  }
  
  toDTO() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

const errors = {
  APIError: MockAPIError as any,
  AuthenticationError: MockAPIError as any,
  PermissionError: MockAPIError as any,
  NotFoundError: MockAPIError as any,
  ValidationError: MockAPIError as any,
  NetworkError: MockAPIError as any,
  
  handleAPIError(error: any, context?: string) {
    return new MockAPIError(error?.message || 'Unknown error', 500);
  },
  
  toErrorDTO(error: any) {
    return {
      name: error?.name || 'Error',
      message: error?.message || 'An error occurred',
      statusCode: error?.statusCode || 0,
      details: error?.details || null,
      timestamp: new Date().toISOString(),
    };
  },
  
  getUserFriendlyMessage(error: any) {
    return error?.message || 'An unexpected error occurred.';
  },
  
  async apiCall<T>(fn: () => Promise<T>, context?: string): Promise<T> {
    return fn();
  },
  
  isTypedError(error: any) {
    return error instanceof MockAPIError;
  },
};

/**
 * Mock adapter implementation
 * 
 * This fully implements the ApiAdapter interface without any backend dependencies.
 * If this compiles and type-checks, the architecture is properly backend-agnostic.
 */
export const adapter: ApiAdapter = {
  auth,
  interventions,
  interventionStatusRefs,
  interventionStatusLogs,
  actions,
  actionSubcategories,
  machines,
  stock,
  suppliers,
  stockSuppliers,
  stockSpecs,
  manufacturerItems,
  client,
  errors,
};
