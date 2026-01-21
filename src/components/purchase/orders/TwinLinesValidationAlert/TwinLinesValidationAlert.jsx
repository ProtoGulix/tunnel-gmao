/**
 * @fileoverview Composant d'alerte pour la validation des lignes jumelles
 * 
 * Affiche les erreurs et avertissements lors de la comparaison de devis
 * entre plusieurs fournisseurs pour les mêmes DA.
 * 
 * @module components/purchase/orders/TwinLinesValidationAlert
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from 'prop-types';
import { Callout, Flex, Text } from '@radix-ui/themes';
import { Info, CheckCircle2, Check } from 'lucide-react';
import ErrorSection from './ErrorSection.jsx';
import WarningSection from './WarningSection.jsx';

/**
 * Composant d'alerte pour la validation des lignes jumelles
 * 
 * Affiche un message selon l'état de validation (erreurs, avertissements, succès).
 * Propose des solutions pour débloquer les erreurs et compare les offres.
 * 
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.twinLines - Liste des lignes jumelles
 * @param {Array<string>} props.validationErrors - Erreurs de validation
 * @param {Array<string>} props.validationWarnings - Avertissements
 * @param {boolean} props.loading - État de chargement
 * @param {Object} props.currentLine - Ligne actuelle pour analyse détaillée
 * @returns {JSX.Element|null} Alerte de validation ou null si pas de jumelles
 * 
 * @example
 * <TwinLinesValidationAlert
 *   twinLines={twinLinesData}
 *   validationErrors={["Statut incorrect"]}
 *   validationWarnings={[]}
 *   loading={false}
 *   currentLine={currentLineData}
 * />
 */
export default function TwinLinesValidationAlert({ 
  twinLines, 
  validationErrors, 
  validationWarnings,
  loading,
  currentLine,
  currentOrderId,
  onToggleLineSelection,
}) {
  // Ne rien afficher si pas de jumelles
  if (!loading && twinLines.length === 0) {
    return null;
  }

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <Callout.Root color="gray" size="1" mb="3">
        <Callout.Icon>
          <Info size={16} />
        </Callout.Icon>
        <Callout.Text>
          Vérification des lignes jumelles...
        </Callout.Text>
      </Callout.Root>
    );
  }

  // Afficher les erreurs en priorité
  if (validationErrors.length > 0) {
    return (
      <ErrorSection 
        currentLine={currentLine}
        twinLines={twinLines}
        validationErrors={validationErrors}
        currentOrderId={currentOrderId}
        onToggleLineSelection={onToggleLineSelection}
      />
    );
  }

  // Afficher les avertissements
  if (validationWarnings.length > 0) {
    return (
      <WarningSection 
        currentLine={currentLine}
        twinLines={twinLines}
        validationWarnings={validationWarnings}
        currentOrderId={currentOrderId}
        onToggleLineSelection={onToggleLineSelection}
      />
    );
  }

  // Tout est OK
  return (
    <Callout.Root color="green" size="1" mb="3">
      <Callout.Icon>
        <CheckCircle2 size={16} />
      </Callout.Icon>
      <Callout.Text>
        <Flex align="center" gap="2">
          <Check size={14} />
          <Text size="2">
            Comparaison de devis validée ({twinLines.length} fournisseur(s))
          </Text>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  );
}

TwinLinesValidationAlert.propTypes = {
  twinLines: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_selected: PropTypes.bool,
    quote_received: PropTypes.bool,
    quote_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_order_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object
    ]),
  })),
  validationErrors: PropTypes.arrayOf(PropTypes.string),
  validationWarnings: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool,
  currentLine: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_selected: PropTypes.bool,
    quote_received: PropTypes.bool,
    quote_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_order_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object
    ]),
    stock_item_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object
    ]),
    stockItem: PropTypes.object,
  }),
  currentOrderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onToggleLineSelection: PropTypes.func,
};

TwinLinesValidationAlert.defaultProps = {
  twinLines: [],
  validationErrors: [],
  validationWarnings: [],
  loading: false,
  currentLine: null,
  currentOrderId: null,
  onToggleLineSelection: null,
};
