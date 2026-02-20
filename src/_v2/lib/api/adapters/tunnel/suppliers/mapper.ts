/**
 * Suppliers Mapper - Tunnel Backend
 *
 * Transforms between backend DTOs and frontend domain models.
 *
 * @module lib/api/adapters/tunnel/suppliers/mapper
 */

/**
 * Maps backend supplier to frontend format
 */
export const mapSupplierToFrontend = (supplier: any) => {
  if (!supplier) return null;
  
  return {
    id: supplier.id,
    name: supplier.name,
    code: supplier.code,
    contactName: supplier.contact_name,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    isActive: supplier.is_active,
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
  };
};

/**
 * Maps frontend supplier to backend format
 */
export const mapSupplierToBackend = (supplier: any) => {
  return {
    name: supplier.name,
    code: supplier.code,
    contact_name: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    is_active: supplier.isActive,
  };
};
