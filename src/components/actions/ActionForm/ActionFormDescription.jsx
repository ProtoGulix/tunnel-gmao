/**
 * ActionFormDescription - Sous-composant
 * Champ de description avec validation
 * Props structurées : { formState, handlers }
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, TextArea, Badge } from '@radix-ui/themes';
import { Folder } from 'lucide-react';

function ActionFormDescription({ formState, handlers }) {
  const { description } = formState;
  const { handleDescriptionChange } = handlers;

  return (
    <Box>
      <Flex align="center" gap="2" mb="2">
        <Folder size={16} color="var(--gray-9)" />
        <Text size="2" weight="bold">Description de l&apos;action</Text>
        <Badge color="red" size="1">Obligatoire</Badge>
      </Flex>
      <TextArea
        placeholder="Décris en détail ce qui a été fait : diagnostic, réparation, remplacement..."
        value={description}
        onChange={(e) => handleDescriptionChange(e.target.value)}
        required
        rows={4}
        style={{
          resize: 'vertical',
          backgroundColor: 'white'
        }}
      />
      <Text size="1" color="gray" mt="1">
        Sois précis : cela aide pour l&apos;analyse et les prochaines interventions
      </Text>
    </Box>
  );
}

ActionFormDescription.displayName = 'ActionFormDescription';

ActionFormDescription.propTypes = {
  formState: PropTypes.shape({
    description: PropTypes.string.isRequired
  }).isRequired,
  handlers: PropTypes.shape({
    handleDescriptionChange: PropTypes.func.isRequired
  }).isRequired
};

export default ActionFormDescription;
