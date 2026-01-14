/**
 * Architecture de suppression de Demande d'Achat (DA) - Refactorisation
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * COMPOSANTS & HOOKS
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * 1. useDeletePurchaseRequest (Hook)
 *    Location: src/hooks/useDeletePurchaseRequest.js
 *    Purpose: Logique partagée de suppression avec pattern de sécurité double-clic
 *    
 *    Usage:
 *    const { 
 *      deleteConfirmId,      // ID en attente de confirmation (null si pas en mode confirm)
 *      deleteLoading,        // Flag de chargement pendant suppression
 *      handleDeleteButtonClick // Handler du clic sur le bouton
 *    } = useDeletePurchaseRequest(onSuccess);
 *    
 *    onSuccess: Callback appelé après suppression réussie (ex: refresh de la liste)
 * 
 * 2. DeletePurchaseRequestButton (Composant)
 *    Location: src/components/purchase/requests/DeletePurchaseRequestButton.jsx
 *    Purpose: Bouton avec états visuels (icône trash → "Confirmer ?")
 *    
 *    Props:
 *    - requestId (string|number): ID de la DA
 *    - isConfirming (boolean): Si true, affiche "Confirmer ?" au lieu de l'icône
 *    - onClick (function): Callback au clic
 *    - disabled (boolean): État désactivé
 *    - size (string): Taille du bouton Radix (défaut: "1")
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * PATTERN DE SÉCURITÉ DOUBLE-CLIC
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * 1er clic:  deleteConfirmId === requestId → bouton vire au "Confirmer ?" + solid red
 * 2e clic:   deleteConfirmId === requestId → exécute la suppression
 * Timeout:   3 secondes → réinitialise l'état si pas confirmé
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * INTÉGRATIONS ACTUELLES
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * A) PurchaseRequestsTable.jsx (Composant principal)
 *    - Utilise le hook useDeletePurchaseRequest
 *    - Affiche DeletePurchaseRequestButton en fonction du statut
 *    - Gère le callback onSuccess pour refresh des données
 *    
 *    Statuts où le bouton est visible:
 *    - "to_qualify": À qualifier
 *    - "sent": Devis envoyé
 *    - Autres: Défaut avec "Détails"
 * 
 * B) StockManagement.jsx (Page maître)
 *    - Instancie le hook useDeletePurchaseRequest au niveau page
 *    - Peut passer les props au composant si nécessaire (mais actuellement gérés en local)
 *    
 * ═══════════════════════════════════════════════════════════════════════════════════
 * EXEMPLE D'UTILISATION DANS UN NOUVEAU COMPOSANT
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * import { useDeletePurchaseRequest } from '@/hooks/useDeletePurchaseRequest';
 * import DeletePurchaseRequestButton from '@/components/purchase/requests/DeletePurchaseRequestButton';
 * 
 * export default function MonComposant() {
 *   const { deleteConfirmId, deleteLoading, handleDeleteButtonClick } = 
 *     useDeletePurchaseRequest(async () => {
 *       // Callback appelé après suppression
 *       await refreshData();
 *     });
 * 
 *   return (
 *     <div>
 *       <DeletePurchaseRequestButton
 *         requestId={request.id}
 *         isConfirming={deleteConfirmId === request.id}
 *         onClick={handleDeleteButtonClick}
 *         disabled={deleteLoading}
 *       />
 *     </div>
 *   );
 * }
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * DÉTAILS TECHNIQUES
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * API utilisée:
 * - stock.deletePurchaseRequest(requestId): Appel à la facade API
 * 
 * Gestion erreurs:
 * - En cas d'erreur, le hook throw l'exception (à gérer au niveau parent si nécessaire)
 * - Les erreurs sont loggées en console
 * 
 * Performance:
 * - Pas de re-renders inutiles (useCallback memoization)
 * - Hook complètement autonome et réutilisable
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * MIGRATION & REFACTORISATION
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Ce refactoring centralise la logique de suppression:
 * 
 * AVANT:  Chaque composant gérait son propre state (deleteConfirmId, deleteLoading)
 *         et sa propre fonction handleDeleteRequest
 * 
 * APRÈS:  Logique mutalisée dans useDeletePurchaseRequest
 *         Composants utilisent DeletePurchaseRequestButton pour UI uniforme
 * 
 * Bénéfices:
 * ✅ Code plus maintenable (UX de suppression centralisée)
 * ✅ Cohérence UI/UX sur toute l'app
 * ✅ Facile à réutiliser dans d'autres contextes
 * ✅ Tests simplifiés (mock du hook)
 * 
 */
