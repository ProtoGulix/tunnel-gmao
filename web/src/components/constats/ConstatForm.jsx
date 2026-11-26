/**
 * Formulaire de constat : questions et choix lus de l'API, sélection seulement.
 * Contrôlé : `choices` (codes cochés) et `machine` ({ id, name }) viennent du parent.
 */
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import LoadingState from '@/components/ui/LoadingState';
import EquipmentPickerField from '@/components/intervention-requests/EquipmentPickerField';
import { visibleQuestions, toggleChoice } from './constatRules';

function Choice({ question, choice, checked, onToggle }) {
  return (
    <Button
      type="button"
      size="2"
      variant={checked ? 'solid' : 'soft'}
      color={checked ? 'blue' : 'gray'}
      role={question.is_multiple ? 'checkbox' : 'radio'}
      aria-checked={checked}
      onClick={onToggle}
    >
      {choice.label}
    </Button>
  );
}

Choice.propTypes = {
  question: PropTypes.object.isRequired,
  choice: PropTypes.object.isRequired,
  checked: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};

export default function ConstatForm({ questions, choices, machine, onChoicesChange, onMachineChange }) {
  if (!questions) return <LoadingState />;
  return (
    <Flex direction="column" gap="4">
      {visibleQuestions(questions, choices).map((q) => (
        <Box key={q.code} role={q.is_multiple ? 'group' : 'radiogroup'} aria-label={q.label}>
          <Text as="div" size="2" weight="bold" mb="2">{q.label}</Text>
          <Flex gap="2" wrap="wrap">
            {q.choices.map((c) => (
              <Choice
                key={c.code}
                question={q}
                choice={c}
                checked={choices.includes(c.code)}
                onToggle={() => onChoicesChange(toggleChoice(questions, choices, q, c.code))}
              />
            ))}
          </Flex>
        </Box>
      ))}
      <EquipmentPickerField
        machineId={machine?.id}
        machineName={machine?.name}
        onSelect={(eq) => onMachineChange({ id: String(eq.id), name: eq.name || eq.code })}
        onClear={() => onMachineChange(null)}
      />
    </Flex>
  );
}

ConstatForm.propTypes = {
  questions: PropTypes.array,
  choices: PropTypes.arrayOf(PropTypes.string).isRequired,
  machine: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
  onChoicesChange: PropTypes.func.isRequired,
  onMachineChange: PropTypes.func.isRequired,
};
