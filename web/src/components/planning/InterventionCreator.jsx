/**
 * Création d'intervention autonome : le même parcours que l'accueil (choix de l'équipement,
 * demandes ouvertes de l'équipement à gauche, formulaire à droite), sans saisie de tâches.
 * Le comportement du formulaire est celui de InterventionCreationPanel.
 * @module components/planning/InterventionCreator
 */
import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import EquipementSearch from '@/components/planning/EquipementSearch';
import { InterventionCreatorLeft } from '@/components/planning/InterventionSelector';
import InterventionCreationPanel from '@/components/planning/InterventionCreationPanel';

export default function InterventionCreator({ onCreated, onCancel }) {
  const [equipement, setEquipement] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleEquipementChange = useCallback((eq) => {
    setEquipement(eq);
    setSelectedRequest(null);
  }, []);

  const ctx = equipement
    ? {
        equipementId: equipement.id,
        equipementLabel: `${equipement.code ?? ''} — ${equipement.name ?? ''}`.trim(),
        selectedRequest,
        onCreated,
        onCancel,
        onRequestSelected: setSelectedRequest,
      }
    : null;

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: '45fr 55fr', gap: 'var(--space-5)', alignItems: 'start' }}>
      <Flex direction="column" gap="3">
        <EquipementSearch value={equipement} onChange={handleEquipementChange} placeholder="Rechercher un équipement…" />
        {equipement && (
          <InterventionCreatorLeft
            equipementId={equipement.id}
            selectedRequest={selectedRequest}
            onRequestSelected={setSelectedRequest}
          />
        )}
      </Flex>
      <Box>
        {ctx ? (
          <InterventionCreationPanel key={ctx.equipementId} ivCreationCtx={ctx} />
        ) : (
          <Flex align="center" justify="center" direction="column" gap="2"
            style={{ minHeight: 160, border: '1px dashed var(--gray-5)', borderRadius: 'var(--radius-2)', background: 'var(--gray-1)', padding: '1.5rem' }}
          >
            <Wrench size={20} color="var(--gray-7)" />
            <Text size="2" color="gray" align="center">Sélectionnez un équipement pour créer l&apos;intervention</Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
}

InterventionCreator.propTypes = {
  onCreated: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};
