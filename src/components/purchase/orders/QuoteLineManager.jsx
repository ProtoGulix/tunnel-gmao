/**
 * @fileoverview Gestionnaire de devis et sélection fournisseur pour une ligne de panier
 *
 * Composant pour saisir les devis fournisseurs et sélectionner UN fournisseur
 * par référence (is_selected = true).
 *
 * RÈGLES MÉTIER:
 * - Une seule ligne par référence/article peut avoir is_selected = true
 * - Un fournisseur peut ne jamais répondre (quote_received = false)
 * - La sélection n'est possible que si au moins un fournisseur a répondu
 * - Les non-réponses ne bloquent jamais le processus
 *
 * @module components/purchase/orders/QuoteLineManager
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Flex,
  Text,
  Button,
  Box,
  Badge,
} from '@radix-ui/themes';
import { Edit3, Check, AlertCircle } from 'lucide-react';
import QuoteLineForm from './QuoteLineForm';

/**
 * Gestionnaire de devis et sélection pour une ligne de panier
 *
 * @param {Object} props
 * @param {Object} props.line - Ligne de panier (supplier_order_line)
 * @param {Function} props.onUpdate - Callback(lineId, updates) pour mettre à jour la ligne
 * @param {boolean} props.isLocked - Vrai si le panier est verrouillé
 * @param {Array} props.allLinesForItem - Toutes les lignes pour cet article
 * @returns {JSX.Element}
 */
export default function QuoteLineManager({
  line,
  onUpdate,
  isLocked = false,
  allLinesForItem = [],
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    quoteReceived: line.quoteReceived ?? false,
    quotePrice: line.quotePrice ?? '',
    leadTimeDays: line.leadTimeDays ?? '',
    manufacturer: line.manufacturer ?? '',
    manufacturerRef: line.manufacturerRef ?? '',
  });

  // Vérifier si au moins un fournisseur a répondu
  const hasAnyResponse = allLinesForItem.some((l) => l.quoteReceived);
  const isCurrentlySelected = line.isSelected ?? false;

  const handleEditStart = () => {
    setFormData({
      quoteReceived: line.quoteReceived ?? false,
      quotePrice: line.quotePrice ?? '',
      leadTimeDays: line.leadTimeDays ?? '',
      manufacturer: line.manufacturer ?? '',
      manufacturerRef: line.manufacturerRef ?? '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const updates = {};
    if (formData.quoteReceived !== (line.quoteReceived ?? false)) {
      updates.quoteReceived = formData.quoteReceived;
      if (formData.quoteReceived) {
        updates.quoteReceivedAt = new Date().toISOString();
      }
    }
    if (formData.quotePrice !== (line.quotePrice ?? '')) {
      updates.quotePrice = formData.quotePrice ? parseFloat(formData.quotePrice) : null;
    }
    if (formData.leadTimeDays !== (line.leadTimeDays ?? '')) {
      updates.leadTimeDays = formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null;
    }
    if (formData.manufacturer !== (line.manufacturer ?? '')) {
      updates.manufacturer = formData.manufacturer || null;
    }
    if (formData.manufacturerRef !== (line.manufacturerRef ?? '')) {
      updates.manufacturerRef = formData.manufacturerRef || null;
    }
    if (Object.keys(updates).length > 0) {
      onUpdate(line.id, updates);
    }
    setIsEditing(false);
  };

  const handleToggleSelection = () => {
    if (isCurrentlySelected) {
      onUpdate(line.id, { isSelected: false });
    } else {
      allLinesForItem.forEach((l) => {
        if (l.id !== line.id && l.isSelected) {
          onUpdate(l.id, { isSelected: false });
        }
      });
      onUpdate(line.id, { isSelected: true });
    }
  };

  if (!isEditing) {
    return (
      <Box>
        <Flex direction="column" gap="2">
          <Flex align="center" justify="between" gap="2">
            <Flex align="center" gap="2">
              {line.quoteReceived ? (
                <Badge color="green" variant="soft" size="2">
                  <Check size={12} /> Devis reçu
                </Badge>
              ) : (
                <Badge color="gray" variant="soft" size="2">
                  <AlertCircle size={12} /> En attente
                </Badge>
              )}
            </Flex>
            <Flex gap="2" align="center">
              {!isLocked && (
                <Button
                  size="1"
                  variant="soft"
                  color="blue"
                  onClick={handleEditStart}
                >
                  <Edit3 size={14} />
                  Saisir devis
                </Button>
              )}
            </Flex>
          </Flex>

          {line.quoteReceived && (
            <Flex direction="column" gap="1" style={{ fontSize: '0.85rem' }}>
              {line.quotePrice && (
                <Text color="gray">
                  Prix: <Text weight="bold">{line.quotePrice} €</Text>
                </Text>
              )}
              {line.leadTimeDays && (
                <Text color="gray">
                  Délai: <Text weight="bold">{line.leadTimeDays} j</Text>
                </Text>
              )}
              {line.manufacturer && (
                <Text color="gray">
                  Fabricant: <Text weight="bold">{line.manufacturer}</Text>
                </Text>
              )}
            </Flex>
          )}

          {hasAnyResponse && !isLocked && (
            <Box style={{ borderTop: '1px solid var(--gray-4)', paddingTop: '0.75rem' }}>
              <Button
                onClick={handleToggleSelection}
                size="1"
                color={isCurrentlySelected ? 'green' : 'gray'}
                variant={isCurrentlySelected ? 'solid' : 'outline'}
                style={{ width: '100%' }}
              >
                {isCurrentlySelected ? '✓ Sélectionné' : 'Sélectionner ce fournisseur'}
              </Button>
            </Box>
          )}

          {!hasAnyResponse && (
            <Text size="1" color="orange" style={{ fontStyle: 'italic' }}>
              En attente de devis fournisseurs...
            </Text>
          )}
        </Flex>
      </Box>
    );
  }

  return (
    <QuoteLineForm
      formData={formData}
      setFormData={setFormData}
      isLocked={isLocked}
      onSave={handleSave}
      onCancel={() => setIsEditing(false)}
    />
  );
}

QuoteLineManager.propTypes = {
  line: PropTypes.shape({
    id: PropTypes.string.isRequired,
    quoteReceived: PropTypes.bool,
    isSelected: PropTypes.bool,
    quotePrice: PropTypes.number,
    leadTimeDays: PropTypes.number,
    manufacturer: PropTypes.string,
    manufacturerRef: PropTypes.string,
    quoteReceivedAt: PropTypes.string,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  isLocked: PropTypes.bool,
  allLinesForItem: PropTypes.arrayOf(PropTypes.object),
};
