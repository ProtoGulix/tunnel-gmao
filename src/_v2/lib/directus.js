/**
 * FICHIER DE COMPATIBILITÉ - NE PAS UTILISER POUR NOUVEAU CODE
 * 
 * Ce fichier maintient la compatibilité avec l'ancien code.
 * Pour nouveau code, importer depuis: import { ... } from './api'
 * 
 * Structure modulaire:
 * - api/client.js     → Client axios et cache
 * - api/errors.js     → Gestion centralisée des erreurs
 * - api/auth.js       → Services d'authentification
 * - api/interventions.js → Services interventions
 * - api/machines.js   → Services machines
 * - api/stock.js      → Services stock et demandes d'achat
 * - api/suppliers.js  → Services fournisseurs et commandes
 * - api/stock-suppliers.js → Liens stock ↔ fournisseurs
 * - api/index.js      → Point d'entrée centralisé
 */

// Réexporter tout depuis la nouvelle structure
export * from './api';
