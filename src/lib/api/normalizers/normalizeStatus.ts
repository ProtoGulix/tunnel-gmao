/**
 * Status Normalizer - Domain Status Normalization
 * 
 * Accepts various backend formats and normalizes to domain status union types.
 * This is the SINGLE SOURCE OF TRUTH for status normalization across ALL adapters.
 * 
 * Rules:
 * - NO backend-specific logic
 * - Handles: string, { value: string }, null, undefined
 * - Returns domain-level status types only
 * - Reusable by ANY adapter implementation
 * 
 * @module lib/api/normalizers/normalizeStatus
 */

/**
 * Intervention status domain types
 */
export type InterventionStatus = 'open' | 'in_progress' | 'closed';

/**
 * Purchase request status domain types
 */
export type PurchaseRequestStatus = 'open' | 'in_progress' | 'closed' | 'cancelled';

/**
 * Supplier order status domain types
 */
export type SupplierOrderStatus = 'open' | 'confirmed' | 'received' | 'cancelled';

/**
 * Generic status object shape (for backends that wrap status in objects)
 */
interface StatusObject {
  value?: string;
  id?: string;
}

/**
 * Normalize intervention status from any backend format to domain type
 * 
 * @param input - Raw status from backend (string, object, null, undefined)
 * @param defaultValue - Default status if input is invalid
 * @returns Normalized intervention status
 * 
 * @example
 * normalizeInterventionStatus('open') // 'open'
 * normalizeInterventionStatus({ value: 'in_progress' }) // 'in_progress'
 * normalizeInterventionStatus(null, 'open') // 'open'
 * normalizeInterventionStatus('CLOSED') // 'closed' (lowercase)
 */
export const normalizeInterventionStatus = (
  input: unknown,
  defaultValue: InterventionStatus = 'open'
): InterventionStatus => {
  // Extract string value from various formats
  let statusValue: string | undefined;
  
  if (typeof input === 'string') {
    statusValue = input;
  } else if (input && typeof input === 'object' && 'value' in input) {
    statusValue = (input as StatusObject).value;
  }
  
  // Normalize to lowercase
  if (statusValue) {
    const normalized = statusValue.toLowerCase();
    
    // Validate against domain types
    if (normalized === 'open' || normalized === 'in_progress' || normalized === 'closed') {
      return normalized as InterventionStatus;
    }
  }
  
  // Fallback to default
  return defaultValue;
};

/**
 * Normalize purchase request status from any backend format to domain type
 * 
 * @param input - Raw status from backend
 * @param defaultValue - Default status if input is invalid
 * @returns Normalized purchase request status
 */
export const normalizePurchaseRequestStatus = (
  input: unknown,
  defaultValue: PurchaseRequestStatus = 'open'
): PurchaseRequestStatus => {
  let statusValue: string | undefined;
  
  if (typeof input === 'string') {
    statusValue = input;
  } else if (input && typeof input === 'object' && 'value' in input) {
    statusValue = (input as StatusObject).value;
  }
  
  if (statusValue) {
    const normalized = statusValue.toLowerCase();
    
    if (
      normalized === 'open' ||
      normalized === 'in_progress' ||
      normalized === 'closed' ||
      normalized === 'cancelled'
    ) {
      return normalized as PurchaseRequestStatus;
    }
  }
  
  return defaultValue;
};

/**
 * Normalize supplier order status from any backend format to domain type
 * 
 * @param input - Raw status from backend
 * @param defaultValue - Default status if input is invalid
 * @returns Normalized supplier order status
 */
export const normalizeSupplierOrderStatus = (
  input: unknown,
  defaultValue: SupplierOrderStatus = 'open'
): SupplierOrderStatus => {
  let statusValue: string | undefined;
  
  if (typeof input === 'string') {
    statusValue = input;
  } else if (input && typeof input === 'object' && 'value' in input) {
    statusValue = (input as StatusObject).value;
  }
  
  if (statusValue) {
    const normalized = statusValue.toLowerCase();
    
    if (
      normalized === 'open' ||
      normalized === 'confirmed' ||
      normalized === 'received' ||
      normalized === 'cancelled'
    ) {
      return normalized as SupplierOrderStatus;
    }
  }
  
  return defaultValue;
};
