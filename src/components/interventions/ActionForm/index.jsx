/**
 * ActionForm - Composant principal
 * Formulaire de création d'action avec validation
 *
 * Props :
 *  - initialState, metadata, onCancel, onSubmit, style  → mode normal (inchangé)
 *  - planningMode: bool    → active les champs équipement/intervention + TimeRangePicker
 *  - defaultTechId: string → pré-remplit et verrouille le champ technicien
 *  - onSuccess(action)     → appelé après soumission réussie (optionnel)
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, Button, TextField } from '@radix-ui/themes';
import { Plus, MapPin, Wrench } from 'lucide-react';
import { useActionForm } from './useActionForm';
import ActionFormFields from './ActionFormFields';
import ActionFormDescription from './ActionFormDescription';
import ActionFormComplexity from './ActionFormComplexity';
import EquipementSearch from '@/components/planning/EquipementSearch';
import InterventionSelector from '@/components/planning/InterventionSelector';
import TimeRangePicker from '@/components/planning/TimeRangePicker';

/* ── Champs planning (équipement + intervention) ──────────────────────────── */
function PlanningContextFields({ equipement, onEquipementChange, intervention, onInterventionChange }) {
  return (
    <Flex direction="column" gap="3">
      <Box>
        <Flex align="center" gap="1" mb="1">
          <MapPin size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">Équipement <Text as="span" color="red">*</Text></Text>
        </Flex>
        <EquipementSearch value={equipement} onChange={onEquipementChange} />
      </Box>

      <Box>
        <Flex align="center" gap="1" mb="1">
          <Wrench size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">Intervention <Text as="span" color="red">*</Text></Text>
        </Flex>
        <InterventionSelector
          equipementId={equipement?.id ?? null}
          value={intervention}
          onChange={onInterventionChange}
          disabled={!equipement}
        />
      </Box>
    </Flex>
  );
}

PlanningContextFields.propTypes = {
  equipement: PropTypes.object,
  onEquipementChange: PropTypes.func.isRequired,
  intervention: PropTypes.object,
  onInterventionChange: PropTypes.func.isRequired,
};

/* ── ActionForm principal ─────────────────────────────────────────────────── */
/* eslint-disable complexity */
function ActionForm({
  initialState = {},
  metadata = {},
  onCancel,
  onSubmit,
  onSuccess,
  style,
  planningMode = false,
  defaultTechId = null,
}) {
  const form = useActionForm(initialState);

  // Planning : état local équipement/intervention/plage horaire
  const [equipement, setEquipement] = useState(null);
  const [intervention, setIntervention] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: null, end: null });

  // Erreurs planning supplémentaires
  const [planningErrors, setPlanningErrors] = useState([]);

  const validatePlanning = () => {
    const errs = [];
    if (!intervention) errs.push('Une intervention est requise');
    if (!timeRange.start || !timeRange.end) errs.push('La plage horaire est requise');
    if (!form.formState.category) errs.push('Le type d\'action est requis');
    if (!defaultTechId) errs.push('Aucun technicien sélectionné');
    setPlanningErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.handlers.handleValidate()) return;
    if (planningMode && !validatePlanning()) return;

    const subcategoryId = Number(form.formState.category);
    const complexityScore = Number(form.formState.complexity);

    const payload = planningMode
      ? {
          intervention_id: intervention.id,
          action_start: `${timeRange.start}:00`,
          action_end: `${timeRange.end}:00`,
          description: form.formState.description,
          action_subcategory: subcategoryId,
          tech: defaultTechId,
          complexity_score: complexityScore,
          ...(complexityScore > 5 && form.formState.complexityFactors.length > 0 && {
            complexity_factor: form.formState.complexityFactors[0],
          }),
        }
      : form.formState;

    const result = await onSubmit(payload);
    onSuccess?.(result);
  };

  const handleCancel = () => {
    form.handlers.handleReset();
    onCancel();
  };

  const allErrors = [...form.validation.errors, ...planningErrors];

  if (!metadata) {
    return (
      <Card style={{ backgroundColor: 'var(--red-2)', border: '1px solid var(--red-6)', ...style }}>
        <Text color="red">Erreur : métadonnées manquantes</Text>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', ...style }}>
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold">Nouvelle action</Text>
        </Flex>

        {/* Erreurs */}
        {allErrors.length > 0 && (
          <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
            <Text color="red" weight="bold" size="2">Erreurs de validation</Text>
            <Flex direction="column" gap="1" mt="1">
              {allErrors.map((err, i) => (
                <Text key={i} color="red" size="1">• {err}</Text>
              ))}
            </Flex>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {/* Champs planning (équipement + intervention) */}
            {planningMode && (
              <PlanningContextFields
                equipement={equipement}
                onEquipementChange={(eq) => { setEquipement(eq); setIntervention(null); }}
                intervention={intervention}
                onInterventionChange={setIntervention}
              />
            )}

            {/* Champs communs : Date + Type. En planning : remplace Temps par TimeRangePicker */}
            {planningMode ? (
              <Flex direction="column" gap="3">
                <Box>
                  <Text size="1" weight="bold" mb="1" style={{ display: 'block' }}>Plage horaire <Text as="span" color="red">*</Text></Text>
                  <TimeRangePicker value={timeRange} onChange={setTimeRange} />
                </Box>
                <ActionFormFields
                  formState={{ ...form.formState, time: '__hidden__' }}
                  handlers={form.handlers}
                  metadata={metadata}
                  hiddenFields={['time']}
                />
              </Flex>
            ) : (
              <ActionFormFields
                formState={form.formState}
                handlers={form.handlers}
                metadata={metadata}
              />
            )}

            <ActionFormDescription formState={form.formState} handlers={form.handlers} />
            <ActionFormComplexity
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
              validation={form.validation}
            />

            {/* Boutons */}
            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" onClick={handleCancel} size="2">
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2">
                <Plus size={16} /> Enregistrer
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

ActionForm.displayName = 'ActionForm';

ActionForm.propTypes = {
  initialState: PropTypes.shape({
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string,
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    complexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    complexityFactors: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  }),
  metadata: PropTypes.shape({
    subcategories: PropTypes.array,
    complexityFactors: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    })),
  }),
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  style: PropTypes.object,
  planningMode: PropTypes.bool,
  defaultTechId: PropTypes.string,
};

export default ActionForm;
