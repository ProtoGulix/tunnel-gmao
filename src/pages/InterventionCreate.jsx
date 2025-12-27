import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Spinner
} from "@radix-ui/themes";
import { interventions } from "@/lib/api/facade";
import { useApiMutation } from "@/hooks/useApiCall";
import { useAuth } from "@/auth/AuthContext";
import MachineSearchSelect from "@/components/machine/MachineSearchSelect";
import ErrorDisplay from "@/components/ErrorDisplay";

/**
 * PAGE : NOUVELLE INTERVENTION
 * Formulaire simple de création
 */
export default function InterventionCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    type_inter: "CUR",
    priority: "normal",
    machine_id: null,
  });

  const [localError, setLocalError] = useState(null);

  // Mutation pour créer l'intervention
  const { mutate: createNewIntervention, loading } = useApiMutation(
    interventions.createIntervention,
    {
      onSuccess: (newIntervention) => {
        // Redirection vers le détail
        navigate(`/intervention/${newIntervention.id}`);
      },
      onError: (error) => {
        setLocalError(error.message || "Erreur lors de la création");
      }
    }
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!formData.title.trim()) {
      setLocalError("Le titre est obligatoire");
      return;
    }

    if (!formData.machine_id) {
      setLocalError("Veuillez sélectionner une machine");
      return;
    }

    // Payload
    const payload = {
      title: formData.title,
      type_inter: formData.type_inter,
      priority: formData.priority,
      machine_id: formData.machine_id,
      status: "open",
      assigned_to: user?.id || null,
      reported_by: user ? `${user.first_name} ${user.last_name}` : null,
      reported_date: new Date().toISOString(),
    };

    await createNewIntervention(payload);
  };

  const handleCancel = () => {
    navigate("/interventions");
  };

  return (
    <Container size="2" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <Card>
        <Heading size="7" mb="4">Nouvelle intervention</Heading>

        {localError && (
          <Box mb="4">
            <ErrorDisplay error={localError} />
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {/* Titre */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Titre <Text color="red">*</Text>
              </Text>
              <TextField.Root
                placeholder="Titre de l'intervention"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </Box>

            {/* Machine */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Machine <Text color="red">*</Text>
              </Text>
              <MachineSearchSelect
                value={formData.machine_id}
                onChange={(machineId) => handleChange("machine_id", machineId)}
              />
            </Box>

            {/* Type */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Type
              </Text>
              <Select.Root 
                value={formData.type_inter} 
                onValueChange={(value) => handleChange("type_inter", value)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="CUR">Curatif</Select.Item>
                  <Select.Item value="PRE">Préventif</Select.Item>
                  <Select.Item value="PRO">Projet</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Priorité */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Priorité
              </Text>
              <Select.Root 
                value={formData.priority} 
                onValueChange={(value) => handleChange("priority", value)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="urgent">Urgent</Select.Item>
                  <Select.Item value="important">Important</Select.Item>
                  <Select.Item value="normal">Normal</Select.Item>
                  <Select.Item value="faible">Faible</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Boutons */}
            <Flex gap="3" justify="end" mt="4">
              <Button 
                type="button" 
                variant="soft" 
                onClick={handleCancel}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? <Spinner size="2" /> : "Créer"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
