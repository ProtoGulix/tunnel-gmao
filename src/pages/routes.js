/**
 * Configuration des routes de l'application
 * Associe les chemins de menuConfig aux composants React
 */

import PublicHome from './PublicHome';
import PurchaseRequestForm from './public/PurchaseRequestForm';
import InterventionRequestForm from './public/InterventionRequestForm';
import Login from './Login';
import InterventionsList from './InterventionsList';
import InterventionDetail from './InterventionDetail';
import InterventionCreate from './InterventionCreate';
import MachineList from './MachineList';
import MachineDetail from './MachineDetail';
import ActionsPage from './ActionsPage';
import StockManagement from './StockManagement';

/**
 * Map des composants par ID de page
 * Utilisé pour associer dynamiquement les routes de menuConfig aux composants
 */
export const ROUTE_COMPONENTS = {
  home: PublicHome,
  login: Login,
  'intervention-request': InterventionRequestForm,
  'purchase-request': PurchaseRequestForm,
  interventions: InterventionsList,
  'interventions-new': InterventionCreate,
  'intervention-detail': InterventionDetail,
  actions: ActionsPage,
  machines: MachineList,
  'machine-detail': MachineDetail,
  stock: StockManagement,
};

/**
 * Récupère le composant associé à un ID de page
 * @param {string} pageId - ID de la page depuis menuConfig
 * @returns {React.Component|null} Composant React ou null si non trouvé
 */
export function getRouteComponent(pageId) {
  return ROUTE_COMPONENTS[pageId] || null;
}
