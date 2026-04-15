import { Box, Flex, Text, Badge } from '@radix-ui/themes';
import PropTypes from 'prop-types';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EquipementInfoTab({ equipement }) {
  if (!equipement) return <Text color="gray">Aucune donnée</Text>;

  return (
    <Box py="4">
      <Flex direction="column" gap="4">
        <Box>
          <Text weight="medium" size="2" mb="3">
            Informations générales
          </Text>
          <Flex direction="column" gap="2">
            {equipement.no_machine && (
              <Flex justify="between">
                <Text size="2" color="gray">N° Machine</Text>
                <Text size="2" weight="medium">{equipement.no_machine}</Text>
              </Flex>
            )}
            {equipement.affectation && (
              <Flex justify="between">
                <Text size="2" color="gray">Affectation</Text>
                <Text size="2" weight="medium">{equipement.affectation}</Text>
              </Flex>
            )}
            {equipement.fabricant && (
              <Flex justify="between">
                <Text size="2" color="gray">Fabricant</Text>
                <Text size="2" weight="medium">{equipement.fabricant}</Text>
              </Flex>
            )}
            {equipement.numero_serie && (
              <Flex justify="between">
                <Text size="2" color="gray">N° Série</Text>
                <Text size="2" weight="medium">{equipement.numero_serie}</Text>
              </Flex>
            )}
            {equipement.date_mise_service && (
              <Flex justify="between">
                <Text size="2" color="gray">Mise en service</Text>
                <Text size="2" weight="medium">{equipement.date_mise_service}</Text>
              </Flex>
            )}
            <Flex justify="between">
              <Text size="2" color="gray">Équipement mère</Text>
              <Text size="2" weight="medium">{equipement.is_mere ? 'Oui' : 'Non'}</Text>
            </Flex>
            {equipement.statut && (
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Statut</Text>
                <Badge
                  size="1"
                  variant="soft"
                  style={{
                    backgroundColor: equipement.statut.couleur ? `${equipement.statut.couleur}22` : 'var(--gray-3)',
                    color: equipement.statut.couleur || 'var(--gray-11)',
                    border: `1px solid ${equipement.statut.couleur || 'var(--gray-6)'}44`,
                  }}
                >
                  {equipement.statut.label}
                </Badge>
              </Flex>
            )}
          </Flex>
        </Box>

        {equipement.notes && (
          <Box>
            <Text weight="medium" size="2" mb="2">Notes</Text>
            <Text size="2" color="gray">{equipement.notes}</Text>
          </Box>
        )}

        {equipement.open_requests?.length > 0 && (
          <Box>
            <Text weight="medium" size="2" mb="3">Demandes d&apos;intervention ouvertes</Text>
            <Flex direction="column" gap="2">
              {equipement.open_requests.map((req) => (
                <Flex
                  key={req.id}
                  align="center"
                  justify="between"
                  wrap="wrap"
                  gap="2"
                  style={{
                    background: 'var(--gray-2)',
                    border: '1px solid var(--gray-4)',
                    borderLeft: `3px solid ${req.statut_color || 'var(--gray-6)'}`,
                    borderRadius: 'var(--radius-2)',
                    padding: 'var(--space-3)',
                  }}
                >
                  <Flex align="center" gap="2" wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
                    {req.code && (
                      <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)', flexShrink: 0 }}>
                        {req.code}
                      </Text>
                    )}
                    {req.statut_label && (
                      <Badge
                        size="1"
                        variant="soft"
                        style={{
                          backgroundColor: req.statut_color ? `${req.statut_color}22` : 'var(--gray-3)',
                          color: req.statut_color || 'var(--gray-11)',
                          flexShrink: 0,
                        }}
                      >
                        {req.statut_label}
                      </Badge>
                    )}
                    {req.description && (
                      <Text size="2" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.description}
                      </Text>
                    )}
                  </Flex>
                  {req.created_at && (
                    <Text size="1" color="gray" style={{ flexShrink: 0 }}>{formatDate(req.created_at)}</Text>
                  )}
                </Flex>
              ))}
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );
}

EquipementInfoTab.propTypes = {
  equipement: PropTypes.object,
};
