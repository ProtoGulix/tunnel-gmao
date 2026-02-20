/**
 * Equipement Classes Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/equipementClasses/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapEquipementClassToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || '',
    label: raw.label || '',
    description: raw.description || null,
  };
};
