/**
 * Intervention Status Refs Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/interventionStatusRefs/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapStatusRefToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || raw.value || '',
    name: raw.name || raw.label || '',
    value: raw.value || undefined,
    color: raw.color || undefined,
  };
};
