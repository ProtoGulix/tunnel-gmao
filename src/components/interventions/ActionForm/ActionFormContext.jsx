/**
 * @fileoverview Sous-composants de contexte pour ActionForm
 * @module components/interventions/ActionForm/ActionFormContext
 *
 * LockedBadge  — affiche un contexte verrouillé (comme dans SupplierItemForm)
 * ContextSection — section équipement + intervention : sélecteur ou badge fixé
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { MapPin, Wrench } from 'lucide-react';
import EquipementSearch from '@/components/planning/EquipementSearch';
import InterventionSelector from '@/components/planning/InterventionSelector';

/* ── Badge contexte verrouillé ─────────────────────────────────────────────── */

export function LockedBadge({ icon: Icon, label, color = 'gray' }) {
  return (
    <Flex align="center" gap="2" style={{
      padding: '6px 10px',
      background: `var(--${color}-3)`,
      borderRadius: 'var(--radius-2)',
      border: `1px solid var(--${color}-6)`,
    }}>
      <Icon size={14} color={`var(--${color}-9)`} />
      <Text size="2" weight="medium">{label}</Text>
    </Flex>
  );
}

LockedBadge.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string,
};

/* ── Section contexte : sélecteurs ou badges verrouillés ──────────────────── */

export function ContextSection({ interventionId, pickedEquipement, onEquipementChange, pickedIntervention, onInterventionChange }) {
  return (
    <Flex direction="column" gap="3">
      <Box>
        <Flex align="center" gap="1" mb="1">
          <MapPin size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">
            Équipement {!interventionId && <Text as="span" color="red">*</Text>}
          </Text>
        </Flex>
        {interventionId
          ? <LockedBadge icon={MapPin} label="Via l'intervention" color="blue" />
          : <EquipementSearch value={pickedEquipement} onChange={onEquipementChange} />
        }
      </Box>

      <Box>
        <Flex align="center" gap="1" mb="1">
          <Wrench size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">
            Intervention {!interventionId && <Text as="span" color="red">*</Text>}
          </Text>
        </Flex>
        {interventionId
          ? <LockedBadge icon={Wrench} label="Intervention fixée" color="green" />
          : (
            <InterventionSelector
              equipementId={pickedEquipement?.id ?? null}
              value={pickedIntervention}
              onChange={onInterventionChange}
              disabled={!pickedEquipement}
            />
          )
        }
      </Box>
    </Flex>
  );
}

ContextSection.propTypes = {
  interventionId: PropTypes.string,
  pickedEquipement: PropTypes.object,
  onEquipementChange: PropTypes.func.isRequired,
  pickedIntervention: PropTypes.object,
  onInterventionChange: PropTypes.func.isRequired,
};
