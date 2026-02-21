/**
 * Configuration pour le module Qualité des Données
 */

import { AlertTriangle, XCircle } from 'lucide-react';

/**
 * Labels des entités
 */
export const ENTITY_LABELS = {
  intervention_action: "Actions d'intervention",
  intervention: 'Interventions',
  stock_item: 'Articles de stock',
  purchase_request: "Demandes d'achat",
};

/**
 * Configuration des sévérités
 */
export const SEVERITY_CONFIG = {
  high: {
    label: 'Critique',
    color: 'red',
    icon: XCircle,
  },
  medium: {
    label: 'Moyenne',
    color: 'orange',
    icon: AlertTriangle,
  },
};

/**
 * Descriptions des règles de détection
 */
export const RULE_DESCRIPTIONS = {
  // Actions d'intervention
  action_time_null: 'Temps non saisi',
  action_complexity_sans_facteur: 'Complexité sans facteur',
  action_subcategory_null: 'Sous-catégorie manquante',
  action_tech_null: 'Technicien manquant',
  action_description_vide: 'Description vide',
  action_time_suspect: 'Temps > 8h suspect',
  action_sur_intervention_fermee: 'Action après fermeture',

  // Interventions
  intervention_fermee_sans_action: 'Fermée sans action',
  intervention_sans_type: 'Sans type',
  intervention_en_cours_inactive: 'En cours > 14 jours',

  // Stock
  stock_sans_seuil_min: 'Sans seuil minimum',
  stock_sans_fournisseur: 'Sans fournisseur',

  // Achats
  demande_sans_stock_item: 'Sans article stock lié',
};
