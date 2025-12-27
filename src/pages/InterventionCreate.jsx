// ===== IMPORTS =====
// 1. React Core
import { useState, useCallback } from "react";

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
  Spinner
} from "@radix-ui/themes";

// 4. Custom Components
import MachineSearchSelect from "@/components/machine/MachineSearchSelect";
import ErrorDisplay from "@/components/ErrorDisplay";

// 5. Custom Hooks
import { useApiMutation } from "@/hooks/useApiCall";
import { useAuth } from "@/auth/AuthContext";

// 6. API
import { interventions } from "@/lib/api/facade";

// ===== COMPONENT =====
/**
 * Intervention creation page with form.
 * Allows users to create a new intervention with title, machine, type, and priority.
 * Redirects to intervention detail page upon successful creation.
 *
 * @component
 * @returns {JSX.Element} Intervention creation form page
 *
 * @example
 * <Route path="/intervention/create" element={<InterventionCreate />} />
 */
export default function InterventionCreate() {
  // ----- Router Hooks -----
  const navigate = useNavigate();

  // ----- Custom Hooks -----
  // Note: user authentication handled by ProtectedRoute
  useAuth();

  // ----- State -----
  const [formData, setFormData] = useState({
    title: "",
    type_inter: "CUR",
    priority: "normale",
    machine_id: null,
  });

  const [localError, setLocalError] = useState(null);

  // ----- API Calls -----
  const { mutate: createNewIntervention, loading } = useApiMutation(
    interventions.createIntervention,
    {
      onSuccess: (newIntervention) => {
        navigate(`/intervention/${newIntervention.id}`);
      },
      onError: (error) => {
        setLocalError(error.message || "Error during creation");
      }
    }
  );

  // ----- Callbacks -----
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!formData.title.trim()) {
      setLocalError("Title is required");
      return;
    }

    if (!formData.machine_id) {
      setLocalError("Please select a machine");
      return;
    }

    // Payload - using domain DTO structure (API_CONTRACTS.md compliant)
    const payload = {
      title: formData.title,
      type: formData.type_inter,
      priority: formData.priority,
      machine: { id: formData.machine_id },
      status: "open",
      reportedDate: new Date().toISOString(),
    };

    await createNewIntervention(payload);
  }, [formData, createNewIntervention]);

  const handleCancel = useCallback(() => {
    navigate("/interventions");
  }, [navigate]);

  // ----- Main Render -----
  return (
    <Container size="2" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <Card>
        <Heading size="7" mb="4">New Intervention</Heading>

        {localError && (
          <Box mb="4">
            <ErrorDisplay error={localError} />
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {/* Title */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Title <Text color="red">*</Text>
              </Text>
              <TextField.Root
                placeholder="Intervention title"
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
                  <Select.Item value="CUR">Curative</Select.Item>
                  <Select.Item value="PRE">Preventive</Select.Item>
                  <Select.Item value="PRO">Project</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Priority */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Priority
              </Text>
              <Select.Root 
                value={formData.priority} 
                onValueChange={(value) => handleChange("priority", value)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="urgent">Urgent</Select.Item>
                  <Select.Item value="important">Important</Select.Item>
                  <Select.Item value="normale">Normal</Select.Item>
                  <Select.Item value="faible">Low</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Buttons */}
            <Flex gap="3" justify="end" mt="4">
              <Button 
                type="button" 
                variant="soft" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? <Spinner size="2" /> : "Create"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
