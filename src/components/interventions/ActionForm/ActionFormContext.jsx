/**
 * @fileoverview Sous-composants de contexte pour ActionForm
 * @module components/interventions/ActionForm/ActionFormContext
 *
 * ContextSection — section équipement + intervention : sélecteur ou badge verrouillé
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { MapPin, Wrench } from 'lucide-react';
import EquipementSearch from '@/components/planning/EquipementSearch';
import InterventionSelector from '@/components/planning/InterventionSelector';
import LockedBadge from '@/components/ui/LockedBadge';

/* ── Section contexte : sélecteurs ou badges verrouillés ──────────────────── */

/**
 * ContextSection — sélecteurs équipement + intervention.
 *
 * onCreationFlowChange(active: boolean) est appelé quand le flow de création
 * d'intervention (qui contient son propre <form>) devient actif ou inactif,
 * afin que le parent puisse le sortir du <form> de l'ActionForm.
 */
export function ContextSection({ interventionId, pickedEquipement, onEquipementChange, pickedIntervention, onInterventionChange, onCreationFlowChange, creationFlowActive }) {
  const equipementLabel = pickedEquipement
    ? `${pickedEquipement.code ? pickedEquipement.code + ' — ' : ''}${pickedEquipement.name ?? ''}`
    : '';

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
          ? <LockedBadge icon={MapPin} label="Via l'intervention" />
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
          ? <LockedBadge icon={Wrench} label="Intervention fixée" />
          : !creationFlowActive && (
            <InterventionSelector
              equipementId={pickedEquipement?.id ?? null}
              equipementLabel={equipementLabel}
              value={pickedIntervention}
              onChange={onInterventionChange}
              onInterventionCreated={onInterventionChange}
              onCreationFlowChange={onCreationFlowChange}
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
  onCreationFlowChange: PropTypes.func,
  creationFlowActive: PropTypes.bool,
};
