import { Box, Flex, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';

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
          </Flex>
        </Box>

        {equipement.notes && (
          <Box>
            <Text weight="medium" size="2" mb="2">Notes</Text>
            <Text size="2" color="gray">{equipement.notes}</Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
}

EquipementInfoTab.propTypes = {
  equipement: PropTypes.object,
};
