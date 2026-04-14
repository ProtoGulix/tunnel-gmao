/**
 * @fileoverview Sous-composants de contexte pour ActionForm
 * @module components/interventions/ActionForm/ActionFormContext
 *
 * ContextSection — section équipement + intervention :
 *   - sélecteur EquipementSearch ou badge verrouillé
 *   - onglets "Interventions / Demandes" avec badges de quantité
 *   - badge de sélection avec bouton clear
 */

import PropTypes from 'prop-types';
import { Badge, Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { ClipboardList, MapPin, Wrench } from 'lucide-react';
import EquipementSearch from '@/components/planning/EquipementSearch';
import InterventionSelector from '@/components/planning/InterventionSelector';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import LockedBadge from '@/components/ui/LockedBadge';

/* ── Section contexte : sélecteurs ou badges verrouillés ──────────────────── */

/**
 * ContextSection — sélecteurs équipement + intervention.
 *
 * onCreationFlowChange(active, initialRequest?) est appelé quand le flow de
 * création (hors du <form>) doit s'afficher. initialRequest est pré-rempli
 * quand l'utilisateur a sélectionné une demande dans l'onglet "Demandes".
 */
export function ContextSection({
  interventionId,
  pickedEquipement,
  onEquipementChange,
  pickedIntervention,
  onInterventionChange,
  onCreationFlowChange,
  creationFlowActive,
}) {
  const equipementLabel = pickedEquipement
    ? `${pickedEquipement.code ? pickedEquipement.code + ' — ' : ''}${pickedEquipement.name ?? ''}`
    : '';

  const openCount = pickedEquipement?.health?.open_interventions_count ?? 0;
  const requestCount = pickedEquipement?.health?.new_requests_count ?? 0;

  return (
    <Flex direction="column" gap="3">
      {/* Équipement */}
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

      {/* Intervention */}
      <Box>
        <Flex align="center" gap="1" mb="1">
          <Wrench size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">
            Intervention {!interventionId && <Text as="span" color="red">*</Text>}
          </Text>
        </Flex>

        {/* Verrouillée par le parent */}
        {interventionId && <LockedBadge icon={Wrench} label="Intervention fixée" />}

        {/* Pas d'équipement → hint */}
        {!interventionId && !pickedEquipement && (
          <Text size="2" color="gray" style={{ padding: '6px 0', display: 'block' }}>
            Sélectionnez d&apos;abord un équipement
          </Text>
        )}

        {/* Équipement choisi + pas de flow actif → onglets */}
        {!interventionId && pickedEquipement && !creationFlowActive && (
          <Tabs.Root defaultValue="interventions">
            <Tabs.List>
              <Tabs.Trigger value="interventions">
                <Flex align="center" gap="1">
                  <Wrench size={12} />
                  Interventions
                  {openCount > 0 && (
                    <Badge color="blue" variant="soft" size="1">{openCount}</Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value="requests">
                <Flex align="center" gap="1">
                  <ClipboardList size={12} />
                  Demandes
                  {requestCount > 0 && (
                    <Badge color="orange" variant="soft" size="1">{requestCount}</Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
            </Tabs.List>

            <Box pt="2">
              <Tabs.Content value="interventions">
                <InterventionSelector
                  equipementId={pickedEquipement.id}
                  equipementLabel={equipementLabel}
                  value={pickedIntervention}
                  onChange={onInterventionChange}
                  onInterventionCreated={onInterventionChange}
                  onCreationFlowChange={onCreationFlowChange}
                />
              </Tabs.Content>
              <Tabs.Content value="requests">
                <InterventionRequestSelector
                  selectedId={null}
                  onSelect={(req) => req && onCreationFlowChange?.(true, req)}
                  machineId={pickedEquipement.id}
                  machineName={pickedEquipement.name}
                />
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        )}
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
