/**
 * Domain Normalizers - Centralized Backend-Agnostic Normalization
 * 
 * This module exports all domain normalizers used across adapters.
 * Each normalizer is the SINGLE SOURCE OF TRUTH for its domain concept.
 * 
 * Rules for normalizers:
 * - Accept unknown input (handle any backend format)
 * - Return domain types only (no backend leaks)
 * - NO backend-specific logic inside normalizers
 * - Reusable by ALL adapters
 * 
 * @module lib/api/normalizers
 */

export {
  normalizeInterventionStatus,
  normalizePurchaseRequestStatus,
  normalizeSupplierOrderStatus,
  type InterventionStatus,
  type PurchaseRequestStatus,
  type SupplierOrderStatus,
} from './normalizeStatus';
