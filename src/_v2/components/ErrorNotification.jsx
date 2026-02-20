/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔔 ErrorNotification.jsx - Toast notification erreur global
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant toast temporaire affiché en top-right de l'écran pour feedback global
 * - Auto-hide après 5s (configuré dans ErrorContext)
 * - Animation slide-in depuis la droite
 * - Design rouge avec icon AlertCircle (Lucide React)
 * - Bouton fermeture manuel (X)
 * - Z-index 10000 pour affichage au-dessus de tout
 * 
 * Utilisé via hook useError() dans 2 endroits :
 * - PurchaseRequestForm (erreur création demande)
 * - InterventionDetail (erreurs opérations CRUD)
 * 
 * ✅ @features_implemented
 * - Early return si !error ou !isVisible
 * - Animation CSS smooth (slide-in + fade)
 * - Icon AlertCircle rouge (Lucide React)
 * - Auto-hide 5s dans ErrorContext
 * - Bouton close manuel
 * - Message user-friendly via getUserFriendlyMessage()
 * 
 * 📋 @todo
 * - [ ] Variants sévérité : success (vert), warning (orange), info (bleu)
 * - [ ] Support actions custom : bouton action en plus de close
 * - [ ] Historique : garder les 5 dernières notifications
 * - [ ] Son optionnel : beep avec toggle mute
 * - [ ] Position configurable : top-right, top-left, bottom-right, bottom-left
 * - [ ] Stack multiple : empiler plusieurs notifications
 * - [ ] Progress bar : barre auto-hide 5s visible
 * - [ ] Pause on hover : stopper auto-hide au survol
 * - [ ] Click outside : fermer au clic en dehors
 * - [ ] Keyboard Escape : fermer avec touche Escape
 * - [ ] Migrer vers Radix Toast : remplacer CSS custom par Radix primitives
 * - [ ] Dark mode : adapter couleurs pour thème sombre
 * 
 * @module components/ErrorNotification
 * @requires react
 * @requires lucide-react
 * @requires contexts/ErrorContext
 */

import { AlertCircle, X } from 'lucide-react';
import { useError } from "@/contexts/ErrorContext";
import styles from '@/styles/modules/ErrorNotification.module.css';

/**
 * Toast notification d'erreur global avec auto-hide 5s
 * Consomme ErrorContext pour afficher les erreurs temporaires
 * 
 * @component
 * @returns {JSX.Element|null} Toast notification ou null si !error/!isVisible
 * 
 * @example
 * // Dans main.jsx (monté au niveau racine)
 * <ErrorProvider>
 *   <App />
 *   <ErrorNotification />
 * </ErrorProvider>
 * 
 * @example
 * // Usage dans composant via hook
 * const { showError } = useError();
 * try {
 *   await deleteItem(id);
 * } catch (error) {
 *   showError(error); // Affiche toast 5s
 * }
 */
const ErrorNotification = () => {
  const { error, isVisible, hideError } = useError();

  if (!error || !isVisible) return null;

  return (
    <div className={`${styles.errorNotification} ${isVisible ? styles.visible : ''}`} role="alert" aria-live="assertive">
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>
          <AlertCircle color="var(--red-9)" size={24} />
        </div>
        <div className={styles.errorMessage}>
          <strong>Erreur</strong>
          <p>{error.message}</p>
        </div>
        <button 
          className={styles.errorClose}
          onClick={hideError}
          aria-label="Fermer la notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ErrorNotification;
