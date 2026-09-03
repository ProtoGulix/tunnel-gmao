import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import RequestFormShell from '@/components/intervention-requests/RequestFormShell';
import RequestFormFields from '@/components/intervention-requests/RequestFormFields';
import { fetchServices } from '@/api/services';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { useAuth } from '@/auth/useAuth';

const INITIAL_FORM = {
  machineId: '',
  machineName: '',
  demandeurNom: '',
  serviceId: '',
  description: '',
  type: 'standard',
};

function validate(form) {
  if (!form.machineId) return 'Veuillez sélectionner un équipement';
  if (!form.demandeurNom.trim()) return 'Le nom du demandeur est obligatoire';
  if (!form.description.trim()) return 'La description est obligatoire';
  return null;
}

function buildSubmitPayload(form, allowTypeSelection) {
  return {
    machineId: form.machineId,
    demandeurNom: form.demandeurNom.trim(),
    serviceId: form.serviceId || null,
    description: form.description.trim(),
    type: allowTypeSelection ? form.type : 'standard',
  };
}

function buildInitialForm(userFullName, machineId, machineName, initialType) {
  const base = { ...INITIAL_FORM, demandeurNom: userFullName, type: initialType };
  if (!machineId) return base;
  return { ...base, machineId, machineName: machineName ?? '' };
}

function submitLabelFor(type) {
  return type === 'amelioration' ? 'Proposer l\'idée' : 'Créer la demande';
}

export default function InterventionRequestForm({ onSubmit, onCancel, saving = false, machineId = null, machineName = null, bare = false, allowTypeSelection = true, initialType = 'standard' }) {
  const { user } = useAuth();
  const userFullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const [form, setForm] = useState(() => buildInitialForm(userFullName, machineId, machineName, initialType));
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchServices().then(setServices).catch(() => {});
  }, []);

  const set = useCallback((field, value) => setForm((prev) => ({ ...prev, [field]: value })), []);

  const handleMachineSelect = (eq) => {
    set('machineId', eq.id);
    set('machineName', [eq.code, eq.name].filter(Boolean).join(' — '));
  };

  const handleMachineClear = () => {
    set('machineId', '');
    set('machineName', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const validationError = validate(form);
    if (validationError) { setError(validationError); return; }
    try {
      await onSubmit(buildSubmitPayload(form, allowTypeSelection));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la création de la demande'));
    }
  };

  return (
    <RequestFormShell bare={bare} error={error}>
      <form onSubmit={handleSubmit}>
        <RequestFormFields
          form={form}
          set={set}
          services={services}
          machineLocked={!!machineId}
          onMachineSelect={handleMachineSelect}
          onMachineClear={handleMachineClear}
          allowTypeSelection={allowTypeSelection}
          saving={saving}
          onCancel={onCancel}
          submitLabel={submitLabelFor(form.type)}
        />
      </form>
    </RequestFormShell>
  );
}

InterventionRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  machineId: PropTypes.string,
  machineName: PropTypes.string,
  bare: PropTypes.bool,
  allowTypeSelection: PropTypes.bool,
  initialType: PropTypes.oneOf(['standard', 'amelioration']),
};
