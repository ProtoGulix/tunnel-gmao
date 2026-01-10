/**
 * @fileoverview Hook pour récupérer et gérer les données d'état du service
 *
 * Fournit les métriques de charge, fragmentation et pilotage du service
 * pour la page ServiceStatus.
 *
 * Calcule les données depuis les actions via l'API :
 * - Récupère toutes les actions sur la période
 * - Classifie chaque action en PROD/DEP/PILOT/FRAG
 * - Agrège les temps par type
 * - Calcule le % d'actions courtes
 *
 * @module hooks/useServiceData
 * @requires config/serviceTimeClassification
 */

import { useState, useEffect } from 'react';
import { actions } from '@/lib/api/facade';
import {
  aggregateTimeByType,
  calculateShortActionsPercent,
  classifyActionTime,
} from '@/config/serviceTimeClassification';

/**
 * Capacité théorique ETP du service (à configurer)
 * TODO: Externaliser dans une configuration ou table meta
 */
const SERVICE_ETP_CAPACITY = 160; // heures par mois (1 ETP = 160h/mois)

/**
 * Calcule les causes de fragmentation par sous-catégorie
 *
 * @param {Array} allActions - Toutes les actions
 * @returns {Array} Top 10 des causes de FRAG
 * @returns {Object[]} .items - Chaque élément contient:
 * @returns {number} .subcategoryId - ID de la sous-catégorie
 * @returns {string} .subcategoryName - Nom de la sous-catégorie
 * @returns {number} .totalHours - Temps cumulé FRAG en heures
 * @returns {number} .actionCount - Nombre d'actions
 * @returns {number} .percent - % du temps FRAG total
 *
 * @example
 * const causes = calculateFragmentationCauses(actionsData);
 * // [
 * //   { subcategoryId: 5, subcategoryName: "Support", totalHours: 15.5, actionCount: 23, percent: 42 },
 * //   ...
 * // ]
 */
const calculateFragmentationCauses = (actionsData) => {
  // Filtrer uniquement les actions FRAG
  const fragActions = actionsData.filter((action) => action.timeType === 'FRAG');

  if (!fragActions.length) {
    return {
      total: 0,
      items: [],
    };
  }

  // Grouper par subcategory
  const groupedBySubcategory = {};

  fragActions.forEach((action) => {
    const subcategoryId = action.subcategory?.id;
    const subcategoryName = action.subcategory?.name || 'Sans catégorie';

    if (!groupedBySubcategory[subcategoryId]) {
      groupedBySubcategory[subcategoryId] = {
        subcategoryId,
        subcategoryName,
        totalHours: 0,
        actionCount: 0,
      };
    }

    const timeSpent = Number(action.timeSpent) || 0;
    groupedBySubcategory[subcategoryId].totalHours += timeSpent;
    groupedBySubcategory[subcategoryId].actionCount += 1;
  });

  // Convertir en tableau et trier par temps décroissant
  const causes = Object.values(groupedBySubcategory)
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 10); // Top 10

  // Calculer le total FRAG
  const totalFragHours = causes.reduce((sum, cause) => sum + cause.totalHours, 0);

  // Ajouter le pourcentage pour chaque cause
  const causesWithPercent = causes.map((cause) => ({
    ...cause,
    percent: totalFragHours > 0 ? Math.round((cause.totalHours / totalFragHours) * 100) : 0,
  }));

  return {
    total: totalFragHours,
    items: causesWithPercent,
  };
};

/**
 * Détermine l'équipement mère à partir d'une machine
 * Un équipement de premier niveau (site) est un équipement mère non rattaché (is_mere = true ET equipement_mere = null)
 *
 * @param {Object} machine - Objet machine avec is_mere et equipement_mere
 * @returns {Object|null} Équipement de premier niveau {id, name, code} ou null si non rattachée
 */
const getParentEquipment = (machine) => {
  if (!machine || !machine.id) {
    return null;
  }

  // Si la machine a un équipement mère, remonter à celui-ci
  if (machine.equipement_mere?.id) {
    return {
      id: machine.equipement_mere.id,
      name:
        machine.equipement_mere.name ||
        `Équipement ${machine.equipement_mere.code || machine.equipement_mere.id}`,
      code: machine.equipement_mere.code,
    };
  }

  // Si la machine est elle-même un équipement mère non rattaché (premier niveau)
  if (machine.is_mere) {
    return {
      id: machine.id,
      name: machine.name || `Équipement ${machine.code || machine.id}`,
      code: machine.code,
    };
  }

  // Machine non rattachée à un équipement de premier niveau
  return null;
};

/**
 * Calcule la consommation de capacité par équipement mère (site)
 *
 * @param {Array} actionsData - Toutes les actions avec timeType
 * @returns {Object} Consommation par équipement mère
 * @returns {number} .totalServiceHours - Temps total service
 * @returns {number} .totalFragHours - Temps FRAG total service
 * @returns {Array} .items - Chaque équipement mère avec ses métriques
 * @returns {number} .items[].equipmentId - ID équipement mère
 * @returns {string} .items[].equipmentName - Nom équipement mère
 * @returns {number} .items[].totalHours - Temps total sur cet équipement
 * @returns {number} .items[].fragHours - Temps FRAG sur cet équipement
 * @returns {number} .items[].percentTotal - % du temps service total
 * @returns {number} .items[].percentFrag - % du FRAG service total
 */
const calculateSiteConsumption = (actionsData) => {
  // Grouper par équipement mère
  const groupedByEquipment = {};

  actionsData.forEach((action) => {
    const machine = action.intervention?.machine;
    const parentEquipment = getParentEquipment(machine);

    if (!parentEquipment) {
      return; // Ignorer si pas d'équipement mère
    }

    const { id: equipmentId, name: equipmentName, code: equipmentCode } = parentEquipment;

    if (!groupedByEquipment[equipmentId]) {
      groupedByEquipment[equipmentId] = {
        equipmentId,
        equipmentName,
        equipmentCode,
        totalHours: 0,
        fragHours: 0,
      };
    }

    const timeSpent = Number(action.timeSpent) || 0;
    groupedByEquipment[equipmentId].totalHours += timeSpent;

    if (action.timeType === 'FRAG') {
      groupedByEquipment[equipmentId].fragHours += timeSpent;
    }
  });

  // Calculer totaux service
  const totalServiceHours = actionsData.reduce(
    (sum, action) => sum + (Number(action.timeSpent) || 0),
    0
  );
  const totalFragHours = actionsData
    .filter((action) => action.timeType === 'FRAG')
    .reduce((sum, action) => sum + (Number(action.timeSpent) || 0), 0);

  // Convertir en tableau et ajouter les pourcentages
  const sites = Object.values(groupedByEquipment).map((site) => ({
    ...site,
    percentTotal: totalServiceHours > 0 ? (site.totalHours / totalServiceHours) * 100 : 0,
    percentFrag: totalFragHours > 0 ? (site.fragHours / totalFragHours) * 100 : 0,
  }));

  // Trier par temps FRAG décroissant
  sites.sort((a, b) => b.fragHours - a.fragHours);

  return {
    totalServiceHours,
    totalFragHours,
    items: sites,
  };
};

const fetchServiceTimeBreakdown = async (startDate, endDate) => {
  // Récupérer toutes les actions sur la période via l'API
  const allActions = await actions.fetchActions();

  // Filtrer par date - priorité au createdAt de l'action
  const actionsData = allActions.filter((action) => {
    // Essayer différentes sources de date (création action en priorité)
    const actionDate =
      action.createdAt ||
      action.created_at ||
      action.intervention?.date ||
      action.intervention?.createdAt;

    if (!actionDate) {
      console.warn('⚠️ Action sans date:', action.id);
      return false; // Exclure les actions sans date
    }

    const date = new Date(actionDate);
    return date >= startDate && date <= endDate;
  });

  // Ajouter timeType à chaque action
  const actionsWithTimeType = actionsData.map((action) => ({
    ...action,
    timeType: classifyActionTime(action),
  }));

  // Agrégation des temps par type (PROD, DEP, PILOT, FRAG)
  const timeBreakdown = aggregateTimeByType(actionsWithTimeType);

  // Calcul du % d'actions courtes
  const shortActionsPercent = calculateShortActionsPercent(actionsWithTimeType);

  // Calcul de la charge (% du temps total vs capacité théorique)
  // Capacité proratisée sur la période sélectionnée (base 30 jours pour 1 mois)
  const totalHours = timeBreakdown.total;
  const msPerDay = 1000 * 60 * 60 * 24;
  const periodDays = Math.max(1, Math.ceil((endDate - startDate) / msPerDay));
  const capacityHours = SERVICE_ETP_CAPACITY * (periodDays / 30);
  const chargePercent = capacityHours > 0 ? (totalHours / capacityHours) * 100 : 0;

  return {
    chargePercent,
    timeBreakdown: {
      PROD: timeBreakdown.PROD,
      DEP: timeBreakdown.DEP,
      PILOT: timeBreakdown.PILOT,
      FRAG: timeBreakdown.FRAG,
    },
    shortActionsPercent,
    totalHours,
    fragmentation: calculateFragmentationCauses(actionsWithTimeType),
    siteConsumption: calculateSiteConsumption(actionsWithTimeType),
  };
};

/**
 * Hook pour récupérer les données d'état du service
 *
 * Gère automatiquement le chargement, les erreurs et le refresh
 * des données pour une période donnée.
 *
 * @param {Date} startDate - Date de début de la période
 * @param {Date} endDate - Date de fin de la période
 * @returns {Object} Résultat du hook
 * @returns {Object|null} .data - Données du service ou null
 * @returns {boolean} .loading - État de chargement
 * @returns {Error|null} .error - Erreur éventuelle
 *
 * @example
 * const { data, loading, error } = useServiceData(startDate, endDate);
 *
 * if (loading) return <LoadingState />;
 * if (error) return <ErrorDisplay error={error} />;
 *
 * const { chargePercent, timeBreakdown } = data;
 */
export function useServiceData(startDate, endDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchServiceTimeBreakdown(startDate, endDate);

        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        console.error('❌ useServiceData - Error:', err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  return { data, loading, error };
}
