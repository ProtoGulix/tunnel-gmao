/**
 * @fileoverview Page de création d'interventions
 * Formulaire pour ajouter une nouvelle intervention avec machine, type, priorité
 * 
 * @module pages/InterventionCreate
 * @requires react
 * @requires react-router-dom
 * @requires hooks/useApiCall
 * @requires hooks/useInterventionCreate (personnalisé)
 */

// ===== IMPORTS =====
// 1. React Core
import { useCallback } from "react";

// 2. React Router
import { useNavigate } from "react-router-dom";

// 3. UI Libraries (Radix)
import { 
  Box, 
  Container, 
  Flex, 
  Heading,
  Text, 
  TextField, 
  Button, 
  Card, 
  Select,
  Badge,
  Spinner
} from "@radix-ui/themes";

// 4. Icons
import { Plus } from 'lucide-react';

// 5. Custom Components
import SearchableSelect from "@/components/common/SearchableSelect";
import SelectionSummary from "@/components/common/SelectionSummary";
import PageHeader from "@/components/layout/PageHeader";
import { usePageHeaderProps } from "@/hooks/usePageConfig";

// 6. Custom Hooks
import { useAuth } from "@/auth/AuthContext";
import { useInterventionCreate } from "@/hooks/useInterventionCreate";

// 7. Config
import { INTERVENTION_TYPES } from "@/config/interventionTypes";
import PropTypes from "prop-types";

// ===== CONSTANTS =====
/** Priorités disponibles pour les interventions */
const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'normale', label: 'Normal' },
  { value: 'faible', label: 'Faible' },
];

// Note: date par défaut gérée dans useInterventionCreate

// ===== COMPONENT =====
/**
 * Page de création d'intervention
 * 
 * Formulaire standalone conforme aux conventions §7.3 :
 * - Couleurs standardisées (blue-2 / blue-6)
 * - En-tête avec icône Plus
 * - Bloc d'erreurs séparé en rouge
 * - Boutons alignés à droite (Annuler / Enregistrer)
 * - Hook personnalisé useInterventionCreate pour logique métier
 * 
 * @component
 * @returns {JSX.Element} Page avec formulaire de création
 * 
 * @example
 * <Route path="/intervention/new" element={<InterventionCreate />} />
 */
export default function InterventionCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const headerProps = usePageHeaderProps('interventions-new');
  // Override title for clearer intent
  const pageHeader = {
    ...headerProps,
    title: headerProps?.title || 'Nouvelle intervention',
    subtitle: headerProps?.subtitle || "Créer une intervention curative ou autre",
  };

  const {
    formData,
    setFormData,
    machinesList,
    error,
    loading,
    searchTermMachine,
    setSearchTermMachine,
    handleSubmit,
  } = useInterventionCreate({ user, navigate });

  const handleCancel = useCallback(() => {
    navigate("/interventions");
  }, [navigate]);

  return (
    <Container size="2" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <PageHeader {...pageHeader} />
      <InterventionCreateForm
        formData={formData}
        setFormData={setFormData}
        machinesList={machinesList}
        error={error}
        loading={loading}
        setSearchTermMachine={setSearchTermMachine}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Container>
  );
}

/**
 * Formulaire de création d'intervention (sous-composant)
 * 
 * @component
 * @param {Object} props - Props du formulaire
 * @param {Object} props.formData - État du formulaire
 * @param {Function} props.setFormData - Setter pour formData
 * @param {Array} props.machinesList - Liste des machines disponibles
 * @param {string} [props.error] - Message d'erreur
 * @param {boolean} props.loading - État de chargement
 * @param {string} props.searchTermMachine - Terme recherche machines
 * @param {Function} props.setSearchTermMachine - Setter recherche
 * @param {Function} props.onSubmit - Callback submit
 * @param {Function} props.onCancel - Callback annulation
 * @returns {JSX.Element} Formulaire Card
 */
function InterventionCreateForm({
  formData,
  setFormData,
  machinesList,
  error,
  loading,
  setSearchTermMachine,
  onSubmit,
  onCancel,
}) {
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, [setFormData]);

  const selectedMachine = machinesList.find(m => m.id === formData.machine_id);

  return (
    <Card
      style={{
        padding: '1.5rem',
        backgroundColor: 'var(--blue-2)',
        border: '1px solid var(--blue-6)',
      }}
    >
      <Flex direction="column" gap="3">
        {/* EN-TÊTE */}
        <Flex align="center" gap="3">
          <Plus size={20} color="var(--blue-9)" />
          <Heading size="4" weight="bold">
            Nouvelle intervention
          </Heading>
        </Flex>

        {/* BLOC ERREURS */}
        {error && (
          <Box
            style={{
              backgroundColor: 'var(--red-3)',
              border: '1px solid var(--red-7)',
              borderRadius: '4px',
              padding: '0.75rem',
            }}
          >
            <Text size="2" color="red" weight="medium">
              {error}
            </Text>
          </Box>
        )}

        {/* FORMULAIRE */}
        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="3">
            {/* Titre */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Titre <Text color="red">*</Text>
              </Text>
              <TextField.Root
                placeholder="Titre de l'intervention"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                style={{ borderColor: 'var(--gray-7)' }}
              />
            </Box>

            {/* Date de création */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Date de création <Text color="red">*</Text>
              </Text>
              <TextField.Root
                type="datetime-local"
                value={formData.createdAt}
                onChange={(e) => handleChange("createdAt", e.target.value)}
                required
                style={{ borderColor: 'var(--gray-7)' }}
              />
            </Box>

            {/* Machine */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Machine <Text color="red">*</Text>
              </Text>
              <Box style={{ position: 'relative', zIndex: 5 }}>
                <SearchableSelect
                  items={machinesList}
                  label=""
                  value={formData.machine_id}
                  onChange={(machine) => handleChange("machine_id", machine ? machine.id : null)}
                  getDisplayText={(m) => `${m.code || ""} - ${m.name || ""}`}
                  getSearchableFields={(m) => [m.code, m.name, m.location]}
                  allowSpecialRequest={false}
                  onSearchChange={(value) => setSearchTermMachine(value)}
                  renderItem={(m) => (
                    <Flex align='center' justify='between' gap='2'>
                      <Flex align='center' gap='2'>
                        <Badge color='blue' variant='soft' size='1'>{m.code}</Badge>
                        <Text size='2' weight='bold'>{m.name}</Text>
                      </Flex>
                      {m.equipement_mere && (
                        <Text size='1' color='gray'>{m.equipement_mere}</Text>
                      )}
                    </Flex>
                  )}
                  required
                  placeholder="Rechercher par code, nom ou emplacement..."
                />
              </Box>

              {selectedMachine && (
                <SelectionSummary
                  variant="stock"
                  badgeText={selectedMachine.code || ''}
                  mainText={selectedMachine.name || ''}
                  rightText={selectedMachine.equipement_mere || ''}
                  onClear={() => {
                    setSearchTermMachine(`${selectedMachine.code || ''} - ${selectedMachine.name || ''}`);
                    handleChange('machine_id', null);
                  }}
                />
              )}
            </Box>

            {/* Signalé par (optionnel) */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Signalé par (optionnel)
              </Text>
              <TextField.Root
                placeholder="ID utilisateur ou nom"
                value={formData.reportedBy_id || ""}
                onChange={(e) => handleChange("reportedBy_id", e.target.value || null)}
                style={{ borderColor: 'var(--gray-7)' }}
              />
            </Box>

            {/* Type */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Type
              </Text>
              <Select.Root 
                value={formData.type_inter} 
                onValueChange={(value) => handleChange("type_inter", value)}
              >
                <Select.Trigger style={{ borderColor: 'var(--gray-7)' }} />
                <Select.Content>
                  {INTERVENTION_TYPES.map((type) => (
                    <Select.Item key={type.id} value={type.id}>
                      {type.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Priorité */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Priorité
              </Text>
              <Select.Root 
                value={formData.priority} 
                onValueChange={(value) => handleChange("priority", value)}
              >
                <Select.Trigger style={{ borderColor: 'var(--gray-7)' }} />
                <Select.Content>
                  {PRIORITY_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* BOUTONS */}
            <Flex gap="3" justify="end" style={{ marginTop: '0.5rem' }}>
              <Button 
                type="button" 
                variant="soft" 
                color="gray"
                size="2"
                onClick={onCancel}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                size="2"
                disabled={loading}
                style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
              >
                {loading ? <Spinner size="2" /> : "Enregistrer"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

InterventionCreateForm.propTypes = {
  formData: PropTypes.shape({
    title: PropTypes.string,
    type_inter: PropTypes.string,
    priority: PropTypes.string,
    machine_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reportedBy_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  machinesList: PropTypes.array.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool,
  setSearchTermMachine: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
