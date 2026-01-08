// ===== IMPORTS =====
// 1. React Core
import { useState, useCallback, useEffect } from "react";

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
import SearchableSelect from "@/components/common/SearchableSelect";
import ErrorDisplay from "@/components/ErrorDisplay";

// 5. Custom Hooks
import { useApiMutation } from "@/hooks/useApiCall";
import { useAuth } from "@/auth/AuthContext";

// 6. API
import { interventions, machines } from "@/lib/api/facade";
import { INTERVENTION_TYPES } from "@/config/interventionTypes";

// Normalize default datetime-local value (local time, no timezone drift)
const getDefaultDateTimeLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

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
  const { user } = useAuth();

  // ----- State -----
  const [machinesList, setMachinesList] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    type_inter: "CUR",
    priority: "normale",
    machine_id: null,
    reportedBy_id: null,
    createdAt: getDefaultDateTimeLocal(),
  });

  const [localError, setLocalError] = useState(null);

  // ----- Load machines -----
  useEffect(() => {
    machines.fetchMachines()
      .then(setMachinesList)
      .catch((err) => {
        console.error("Erreur chargement machines:", err);
        setLocalError("Erreur lors du chargement des machines");
      });
  }, []);

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

    if (!formData.createdAt || Number.isNaN(Date.parse(formData.createdAt))) {
      setLocalError("Please provide a valid creation date");
      return;
    }

    // Payload - using domain DTO structure (API_CONTRACTS.md compliant)
    const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');
    const payload = {
      title: formData.title,
      type: formData.type_inter,
      priority: formData.priority,
      machine: { id: formData.machine_id },
      status: "open",
      createdAt: new Date(formData.createdAt).toISOString(),
      reportedDate: new Date().toISOString(),
      reportedBy: formData.reportedBy_id ? { id: formData.reportedBy_id } : undefined,
      techInitials: initials ? initials.toUpperCase() : undefined,
    };

    await createNewIntervention(payload);
  }, [formData, createNewIntervention, user]);

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

            {/* Creation Date */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Creation Date <Text color="red">*</Text>
              </Text>
              <TextField.Root
                type="datetime-local"
                value={formData.createdAt}
                onChange={(e) => handleChange("createdAt", e.target.value)}
                required
              />
            </Box>

            {/* Machine */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Machine <Text color="red">*</Text>
              </Text>
              <SearchableSelect
                items={machinesList}
                label=""
                value={formData.machine_id}
                onChange={(machine) => handleChange("machine_id", machine ? machine.id : null)}
                getDisplayText={(m) => `${m.code || ""} - ${m.name || ""}`}
                getSearchableFields={(m) => [m.code, m.name, m.location]}
                renderItem={(m) => (
                  <Box>
                    <Text size="2" weight="bold">{m.name}</Text>
                    {m.code && <Text size="1" color="gray">{m.code}</Text>}
                    {m.location && <Text size="1" color="gray">📍 {m.location}</Text>}
                  </Box>
                )}
                renderSelected={(m) => (
                  <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: '140px' }}>
                    <Box style={{ fontSize: '24px' }}>✓</Box>
                    <Text size="2" weight="bold" color="green" style={{ textAlign: 'center', wordBreak: 'break-word' }}>
                      {m.name}
                    </Text>
                    {m.code && <Text size="1" color="gray">{m.code}</Text>}
                  </Flex>
                )}
                required
                placeholder="Rechercher par code, nom ou emplacement..."
              />
            </Box>

            {/* Reporter (Optional) */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Reported By (Optional)
              </Text>
              <TextField.Root
                placeholder="User ID or name"
                value={formData.reportedBy_id || ""}
                onChange={(e) => handleChange("reportedBy_id", e.target.value || null)}
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
                  {INTERVENTION_TYPES.map((type) => (
                    <Select.Item key={type.id} value={type.id}>
                      {type.title}
                    </Select.Item>
                  ))}
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
