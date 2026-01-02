/**
 * ActionFormComplexity - Sous-composant
 * Score de complexité + Facteurs conditionnels (si > 5)
 * Props structurées : { formState, handlers, metadata, validation }
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Select, Button, Badge } from '@radix-ui/themes';
import { BarChart3 } from 'lucide-react';

function ActionFormComplexity({
  formState,
  handlers,
  metadata,
  validation
}) {
  const { complexity, complexityFactors } = formState;
  const { handleComplexityChange, handleComplexityFactorToggle } = handlers;
  const { complexityFactors: availableFactors = [] } = metadata;
  const { shouldShowComplexityFactors } = validation;

  return (
    <Box>
      {/* Facteurs de complexité (si complexity > 5) */}
      {shouldShowComplexityFactors && (
        <Box mb="4">
          <Flex align="center" gap="2" mb="2">
            <BarChart3 size={16} color="var(--orange-9)" />
            <Text size="2" weight="bold">Facteurs de complexité</Text>
            <Badge color="orange" size="1">Obligatoire pour complexité &gt; 5</Badge>
          </Flex>
          <Flex gap="2" wrap="wrap">
            {availableFactors.map((factor) => {
              const factorId = String(factor.id);
              const isSelected = complexityFactors.includes(factorId);
              return (
                <Button
                  key={factorId}
                  type="button"
                  size="2"
                  variant={isSelected ? 'solid' : 'soft'}
                  color={isSelected ? 'orange' : 'gray'}
                  onClick={() => handleComplexityFactorToggle(factorId)}
                >
                  {factor.label}
                </Button>
              );
            })}
          </Flex>
          <Text size="1" color="gray" mt="2">
            Sélectionne les facteurs qui ont rendu cette action complexe
          </Text>
        </Box>
      )}

      {/* Score de complexité */}
      <Box>
        <Flex align="center" gap="2" mb="2">
          <BarChart3 size={16} color="var(--gray-9)" />
          <Text size="2" weight="bold">Complexité</Text>
        </Flex>
        <Select.Root value={complexity} onValueChange={handleComplexityChange}>
          <Select.Trigger
            placeholder="..."
            style={{ backgroundColor: 'white', width: '100%' }}
          />
          <Select.Content>
            <Select.Item value="1">1 - Très simple</Select.Item>
            <Select.Item value="2">2 - Simple</Select.Item>
            <Select.Item value="3">3 - Facile</Select.Item>
            <Select.Item value="4">4 - Moyen-</Select.Item>
            <Select.Item value="5">5 - Moyen</Select.Item>
            <Select.Item value="6">6 - Moyen+</Select.Item>
            <Select.Item value="7">7 - Difficile</Select.Item>
            <Select.Item value="8">8 - Complexe</Select.Item>
            <Select.Item value="9">9 - Très complexe</Select.Item>
            <Select.Item value="10">10 - Expert</Select.Item>
          </Select.Content>
        </Select.Root>
        <Text size="1" color="gray" mt="1">
          Évalue la difficulté de l&apos;intervention
        </Text>
      </Box>
    </Box>
  );
}

ActionFormComplexity.displayName = 'ActionFormComplexity';

ActionFormComplexity.propTypes = {
  formState: PropTypes.shape({
    complexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    complexityFactors: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ).isRequired
  }).isRequired,
  handlers: PropTypes.shape({
    handleComplexityChange: PropTypes.func.isRequired,
    handleComplexityFactorToggle: PropTypes.func.isRequired
  }).isRequired,
  metadata: PropTypes.shape({
    complexityFactors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string
      })
    )
  }).isRequired,
  validation: PropTypes.shape({
    shouldShowComplexityFactors: PropTypes.bool.isRequired
  }).isRequired
};

export default ActionFormComplexity;
