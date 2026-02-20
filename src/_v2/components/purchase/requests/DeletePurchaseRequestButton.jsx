import { Button } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Bouton de suppression de demande d'achat avec pattern double-clic
 * 
 * Utilisation:
 * - Premier clic: affiche "Confirmer ?"
 * - Deuxième clic: exécute la suppression
 * - Timeout 3s: réinitialise l'état
 * 
 * @component
 * @param {string} requestId - ID de la demande à supprimer
 * @param {boolean} isConfirming - Indique si le bouton est en mode confirmation
 * @param {Function} onClick - Callback au clic (gère l'état de confirmation)
 * @param {boolean} disabled - Désactiver le bouton
 * @param {string} size - Taille du bouton (1, 2, etc.)
 * @returns {JSX.Element} Bouton avec états visuels
 */
export default function DeletePurchaseRequestButton({
  requestId,
  isConfirming,
  onClick,
  disabled = false,
  size = "1"
}) {
  return (
    <Button
      size={size}
      color={isConfirming ? "red" : "red"}
      variant={isConfirming ? "solid" : "soft"}
      onClick={() => onClick(requestId)}
      aria-label={isConfirming ? "Cliquer à nouveau pour confirmer" : "Supprimer cette demande"}
      title={isConfirming ? "Cliquer à nouveau pour confirmer la suppression" : "Cliquer deux fois pour supprimer"}
      disabled={disabled}
    >
      {isConfirming ? "Confirmer ?" : <Trash2 size={14} />}
    </Button>
  );
}

DeletePurchaseRequestButton.propTypes = {
  requestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isConfirming: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  size: PropTypes.string,
};
