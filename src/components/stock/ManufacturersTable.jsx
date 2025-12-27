import { useEffect, useState } from "react";
import { useError } from '@/contexts/ErrorContext';
import { Card, Table, Flex, Text, Box, TextField, Button} from "@radix-ui/themes";
import { Factory, Plus } from "lucide-react";
import { fetchManufacturerItems, createManufacturerItem } from "@/lib/api/manufacturer-items";
import TableHeader from "@/components/common/TableHeader";

export default function ManufacturersTable() {
  const { showError } = useError();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    manufacturer_name: "",
    manufacturer_ref: "",
    designation: ""
  });
  const [addLoading, setAddLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchManufacturerItems();
      setItems(data);
    } catch (e) {
      console.error("Erreur chargement fabricants:", e);
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = formData.manufacturer_name?.trim();
    const ref = formData.manufacturer_ref?.trim();
    const designation = formData.designation?.trim();

    if (!name && !ref) {
      showError(new Error("Veuillez renseigner au moins le nom du fabricant ou la référence"));
      return;
    }

    try {
      setAddLoading(true);
      setError(null);
      const newItem = await createManufacturerItem({ name, ref, designation });
      if (newItem) {
        setItems([...items, newItem]);
        setFormData({
          manufacturer_name: "",
          manufacturer_ref: "",
          designation: ""
        });
      }
    } catch (e) {
      console.error("Erreur création fabricant:", e);
      setError(e?.message || "Erreur lors de la création");
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = items.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.manufacturer_name || "").toLowerCase().includes(q) ||
      (m.manufacturer_ref || "").toLowerCase().includes(q) ||
      (m.designation || "").toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      <Flex direction="column" gap="3">
        <TableHeader
          icon={Factory}
          title="Références fabricant"
          count={filtered.length}
          searchValue={search}
          onSearchChange={setSearch}
          onRefresh={load}
          loading={loading}
          searchPlaceholder="Recherche (nom, ref, désignation)"
          showRefreshButton={false}
        />

        {error && (
          <Text color="red" size="2">{error}</Text>
        )}

        <Card>
          <Flex direction="column" gap="3">
            <Text weight="bold" size="2">
              Ajouter une référence fabricant
            </Text>
            <Flex gap="2" wrap="wrap" align="end">
              <Box style={{ flex: "1", minWidth: "200px" }}>
                <Text size="2" as="label" weight="bold">
                  Fabricant *
                </Text>
                <TextField.Root
                  value={formData.manufacturer_name}
                  onChange={(e) => setFormData({ ...formData, manufacturer_name: e.target.value })}
                  placeholder="Ex: Schneider Electric"
                />
              </Box>

              <Box style={{ flex: "1", minWidth: "180px" }}>
                <Text size="2" as="label" weight="bold">
                  Référence *
                </Text>
                <TextField.Root
                  value={formData.manufacturer_ref}
                  onChange={(e) => setFormData({ ...formData, manufacturer_ref: e.target.value })}
                  placeholder="Ex: RXM2AB2BD"
                />
              </Box>

              <Box style={{ flex: "1.5", minWidth: "250px" }}>
                <Text size="2" as="label" weight="bold">
                  Désignation (optionnel)
                </Text>
                <TextField.Root
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Description du produit"
                />
              </Box>

              <Button
                size="2"
                color="blue"
                onClick={handleAdd}
                disabled={addLoading}
              >
                <Plus size={16} />
                Ajouter
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Table.Root variant="surface" size="2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Fabricant</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Désignation</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={3}>
                  <Flex align="center" justify="center" p="4">
                    <Text color="gray">Aucune référence fabricant</Text>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              filtered.map((m) => (
                <Table.Row key={m.id}>
                  <Table.Cell>
                    <Text weight="bold">{m.manufacturer_name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{m.manufacturer_ref}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" color="gray">{m.designation || "-"}</Text>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Flex>
    </Box>
  );
}
