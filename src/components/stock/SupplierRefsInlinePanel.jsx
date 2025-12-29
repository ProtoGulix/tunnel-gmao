import { useMemo, useState, useRef, useEffect } from "react";
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import {
  Box,
  Flex,
  Text,
  Table,
  Select,
  TextField,
  Button,
  Badge,
  Checkbox,
  Card,
} from "@radix-ui/themes";
import { CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import ManufacturerBadge from "@/components/common/ManufacturerBadge";
import { manufacturerItems } from "@/lib/api/facade";

export default function SupplierRefsInlinePanel({
  stockItem,
  suppliers,
  refs,
  formData,
  setFormData,
  onAdd,
  onUpdatePreferred,
  onDelete,
  loading,
}) {
  const { showError } = useError();
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const refFieldRef = useRef(null); // Ref directe au champ supplier_ref pour éviter les race conditions
  const [manufacturers, setManufacturers] = useState([]);
  // Nouveau flux: recherche d'abord par référence constructeur, puis nom si nécessaire
  const [manuRefInput, setManuRefInput] = useState("");
  const [manuNameInput, setManuNameInput] = useState("");
  const [showManuRefSuggestions, setShowManuRefSuggestions] = useState(false);
  const [showManuNameSuggestions, setShowManuNameSuggestions] = useState(false);
  
  // Charger la liste des fabricants
  useEffect(() => {
    manufacturerItems.fetchManufacturerItems().then(items => setManufacturers(items || []));
  }, []);
  
  const preferredCount = useMemo(
    () => refs.filter((r) => r.isPreferred).length,
    [refs]
  );

  // Filtrer les suggestions de fabricants
  // Suggestions: priorité aux correspondances par référence, puis par nom
  const manuRefSuggestions = useMemo(() => {
    const q = manuRefInput.trim().toLowerCase();
    if (!q) return [];
    const byRef = manufacturers.filter(m => (m.manufacturer_ref || "").toLowerCase().includes(q));
    const byName = manufacturers.filter(
      m => (m.manufacturer_name || "").toLowerCase().includes(q) && !byRef.some(x => x.id === m.id)
    );
    return [...byRef, ...byName].slice(0, 8);
  }, [manufacturers, manuRefInput]);

  const manuNameSuggestions = useMemo(() => {
    const q = manuNameInput.trim().toLowerCase();
    if (!q) return [];
    // dédupliquer par nom
    const names = Array.from(
      new Set(manufacturers.map(m => m.manufacturer_name).filter(Boolean))
    );
    return names.filter(n => n.toLowerCase().includes(q)).slice(0, 6);
  }, [manufacturers, manuNameInput]);

  const handleAdd = () => {
    // Prevent double-clicks by disabling if loading
    if (loading) {
      return;
    }

    // Validation stricte CLIENT avant submission
    // Utilise à la fois l'état ET la ref du DOM pour éviter les race conditions
    const stateSupplierRef = (formData.supplier_ref || '').trim();
    const domSupplierRef = (refFieldRef.current?.value || '').trim();
    const finalSupplierRef = domSupplierRef || stateSupplierRef;
    const trimmedSupplierId = (formData.supplier_id || '').trim();

    // Validation
    if (!trimmedSupplierId) {
      showError(new Error('Veuillez sélectionner un fournisseur'));
      return;
    }
    if (!finalSupplierRef) {
      showError(new Error('Veuillez entrer la référence fournisseur'));
      return;
    }

    // Synchroniser les champs fabricant basés sur les nouvelles entrées
    const nextManuName = (manuNameInput || formData.manufacturer_name || "").trim();
    const nextManuRef = (manuRefInput || formData.manufacturer_ref || "").trim();

    // Mettre à jour formData avec les valeurs du fabricant AVANT d'appeler onAdd
    const updatedFormData = {
      ...formData,
      supplier_ref: finalSupplierRef,
      supplier_id: trimmedSupplierId,
      manufacturer_name: nextManuName,
      manufacturer_ref: nextManuRef,
    };
    
    setFormData(updatedFormData);
    
    // Appeler onAdd immédiatement avec les données à jour
    onAdd(stockItem.id);
  };

  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Flex align="center" gap="2">
            <CheckCircle size={16} color="var(--blue-9)" />
            <Text weight="bold" size="3">
              Références pour {stockItem?.name || ""}
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <Badge color="blue" variant="solid">
              {refs.length} référence{refs.length > 1 ? "s" : ""}
            </Badge>
            <Badge color="green" variant="soft">
              {preferredCount} préféré{preferredCount > 1 ? "s" : ""}
            </Badge>
          </Flex>
        </Flex>

        <Card>
          <Flex direction="column" gap="3">
            <Text weight="bold" size="2">
              Références existantes
            </Text>
            {refs.length === 0 ? (
              <Flex align="center" gap="2" color="gray" direction="column" style={{ padding: '12px' }}>
                <Flex align="center" gap="2">
                  <AlertCircle size={16} color="var(--amber-9)" />
                  <Text size="2" weight="bold" color="gray">Aucune référence fournisseur définie</Text>
                </Flex>
                <Text size="1" color="gray">Vous devez ajouter au moins une r&eacute;f&eacute;rence pour pouvoir utiliser cet article dans les demandes d&apos;achat.</Text>
              </Flex>
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Délai</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Préféré</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {refs.map((ref) => {
                    // Normalize supplier_id to primitive
                    const supplierId = typeof ref.supplier === 'object' 
                      ? ref.supplier?.id 
                      : ref.supplier;
                    
                    const supplierName =
                      ref.supplier?.name ||
                      suppliers.find((s) => String(s.id) === String(supplierId))?.name ||
                      (typeof supplierId === 'string' || typeof supplierId === 'number' ? String(supplierId) : null) ||
                      "N/A";

                    // Optional manufacturer info (progressive enhancement):
                    // Prefer structured manufacturer_item_id.* (relation), fallback to manufacturer_item.* then flat fields
                    const mObj =
                      ref.manufacturer_item_id || ref.manufacturer_item || null;
                    const manufacturerName = mObj?.manufacturer_name || ref.manufacturer_name || null;
                    const manufacturerRef = mObj?.manufacturer_ref || ref.manufacturer_ref || null;
                    const manufacturerDesignation = mObj?.designation || ref.manufacturer_designation || null;

                    return (
                      <Table.Row
                        key={ref.id}
                        style={{
                          background: ref.isPreferred ? "var(--green-2)" : undefined,
                        }}
                      >
                        <Table.Cell>
                          <Text size="2" weight={ref.is_preferred ? "bold" : "regular"}>
                            {supplierName}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" weight={ref.isPreferred ? "bold" : "regular"}>
                            {ref.supplierRef}
                          </Text>
                          <ManufacturerBadge
                            name={manufacturerName}
                            reference={manufacturerRef}
                            designation={manufacturerDesignation}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{ref.deliveryTimeDays ? `${ref.deliveryTimeDays}j` : "-"}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex align="center">
                            <Checkbox
                              checked={ref.isPreferred}
                              onCheckedChange={(checked) =>
                                onUpdatePreferred(ref.id, { is_preferred: checked })
                              }
                            />
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="1">
                            <Button
                              size="1"
                              color="green"
                              variant="soft"
                              title="Utiliser cette référence pour les futures demandes d'achat"
                              onClick={() => {
                                if (!ref.isPreferred) {
                                  onUpdatePreferred(ref.id, { is_preferred: true });
                                }
                              }}
                              disabled={ref.isPreferred}
                            >
                              {ref.isPreferred ? "✓ Utilisée" : "Utiliser"}
                            </Button>
                            <Button
                              size="1"
                              color="red"
                              variant="soft"
                              onClick={() => onDelete(ref.id)}
                            >
                              Supprimer
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            )}
          </Flex>
        </Card>

        <Card style={{ background: "white", position: "relative", overflow: "visible" }}>
          <Flex direction="column" gap="3">
            <Text weight="bold" size="2">
              Ajouter une référence
            </Text>
            <Flex gap="2" wrap="wrap" align="end">
              <Box style={{ flex: "1", minWidth: "200px" }}>
                <Text size="2" as="label" weight="bold">
                  Fournisseur *
                </Text>
                <Select.Root
                  value={String(formData.supplier_id || '')}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      supplier_id: value,
                    });
                  }}
                >
                  <Select.Trigger placeholder="Choisir..." />
                  <Select.Content>
                    {suppliers.map((supplier) => (
                      <Select.Item key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box style={{ flex: "1", minWidth: "150px" }}>
                <Text size="2" as="label" weight="bold">
                  Référence fournisseur *
                </Text>
                <TextField.Root
                  ref={refFieldRef}
                  value={formData.supplier_ref || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      supplier_ref: e.target.value,
                    });
                  }}
                  placeholder="Ex: 51775.040.020"
                  required
                />
              </Box>

              <Box style={{ flex: "0.7", minWidth: "100px" }}>
                <Text size="2" as="label" weight="bold">
                  Prix unitaire
                </Text>
                <TextField.Root
                  type="number"
                  step="0.01"
                  value={formData.unit_price || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      unit_price: e.target.value,
                    });
                  }}
                  placeholder="0.00"
                />
              </Box>

              <Box style={{ flex: "0.6", minWidth: "80px" }}>
                <Text size="2" as="label" weight="bold">
                  Délai (j)
                </Text>
                <TextField.Root
                  type="number"
                  value={formData.delivery_time_days || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      delivery_time_days: e.target.value,
                    });
                  }}
                />
              </Box>

              <Flex align="center" gap="2">
                <Checkbox
                  checked={formData.is_preferred}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      is_preferred: checked,
                    });
                  }}
                />
                <Text size="2">Préféré</Text>
              </Flex>

              {/* Collapsible Optional Fields */}
              <Box style={{ flexBasis: "100%" }}>
                <Button
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: 0 }}
                >
                  <ChevronDown size={14} style={{ transform: showOptionalFields ? 'rotate(180deg)' : 'rotate(0)' }} />
                  <Text size="1">Champs optionnels (Fabricant)</Text>
                </Button>
              </Box>

              {showOptionalFields && (
                <>
                  <Box style={{
                    flex: "1",
                    minWidth: "220px",
                    position: "relative",
                    paddingBottom: (manuNameInput && showManuNameSuggestions && manuNameSuggestions.length === 0) ? "24px" : undefined
                  }}>
                    <Text size="2" as="label" weight="bold">
                      Fabricant (optionnel)
                    </Text>
                    <TextField.Root
                      value={manuNameInput}
                      onChange={(e) => {
                        setManuNameInput(e.target.value);
                        setShowManuNameSuggestions(true);
                      }}
                      onFocus={() => setShowManuNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowManuNameSuggestions(false), 200)}
                      placeholder="Ex: Schneider Electric"
                    />
                    {showManuNameSuggestions && manuNameSuggestions.length > 0 && (
                      <Card style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 10000,
                        maxHeight: "200px",
                        overflowY: "auto",
                        marginBottom: "4px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}>
                        {manuNameSuggestions.map((name, idx) => (
                          <Box
                            key={`${name}-${idx}`}
                            p="2"
                            style={{ cursor: "pointer", borderBottom: idx < manuNameSuggestions.length - 1 ? "1px solid var(--gray-4)" : "none" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setManuNameInput(name);
                              setFormData({ ...formData, manufacturer_name: name });
                              setShowManuNameSuggestions(false);
                            }}
                          >
                            <Text size="2">{name}</Text>
                          </Box>
                        ))}
                      </Card>
                    )}
                    {manuNameInput && manuNameSuggestions.length === 0 && showManuNameSuggestions && (
                      <Text size="1" color="green" style={{ display: "block", marginTop: "4px" }}>
                        ✓ Nouveau fabricant &quot;{manuNameInput}&quot; sera créé
                      </Text>
                    )}
                  </Box>

                  <Box style={{
                    flex: "1",
                    minWidth: "220px",
                    position: "relative",
                    paddingBottom: (manuRefInput && showManuRefSuggestions && manuRefSuggestions.length === 0) ? "28px" : undefined
                  }}>
                    <Text size="2" as="label" weight="bold">
                      Réf constructeur (optionnel)
                    </Text>
                    <TextField.Root
                      value={manuRefInput}
                      onChange={(e) => {
                        setManuRefInput(e.target.value);
                        setShowManuRefSuggestions(true);
                      }}
                      onFocus={() => setShowManuRefSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowManuRefSuggestions(false), 200)}
                      placeholder="Ex: RXM2AB2BD"
                    />
                    {showManuRefSuggestions && manuRefSuggestions.length > 0 && (
                      <Card style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 10000,
                        maxHeight: "220px",
                        overflowY: "auto",
                        marginBottom: "4px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}>
                        {manuRefSuggestions.map((mfr, idx) => (
                          <Box
                            key={mfr.id || idx}
                            p="2"
                            style={{ cursor: "pointer", borderBottom: idx < manuRefSuggestions.length - 1 ? "1px solid var(--gray-4)" : "none" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setManuRefInput(mfr.manufacturer_ref || "");
                              setManuNameInput(mfr.manufacturer_name || "");
                              setFormData({
                                ...formData,
                                manufacturer_ref: mfr.manufacturer_ref || "",
                                manufacturer_name: mfr.manufacturer_name || "",
                                manufacturer_designation: mfr.designation || formData.manufacturer_designation || "",
                              });
                              setShowManuRefSuggestions(false);
                            }}
                          >
                            <Text size="2" weight="bold">{mfr.manufacturer_ref || "(sans réf)"}</Text>
                            {mfr.manufacturer_name && (
                              <Text size="1" color="gray"> — {mfr.manufacturer_name}</Text>
                            )}
                            {mfr.designation && (
                              <Text size="1" color="gray"> • {mfr.designation}</Text>
                            )}
                          </Box>
                        ))}
                      </Card>
                    )}
                    {manuRefInput && manuRefSuggestions.length === 0 && showManuRefSuggestions && (
                      <Text size="1" color="green" style={{ display: "block", marginTop: "4px" }}>
                        ✓ Nouveau mod&egrave;le constructeur &quot;{manuRefInput}&quot; &mdash; pr&eacute;cisez le fabricant ci-dessus
                      </Text>
                    )}
                  </Box>

                  <Box style={{ flex: "1", minWidth: "240px" }}>
                    <Text size="2" as="label" weight="bold">
                      Désignation (optionnel)
                    </Text>
                    <TextField.Root
                      value={formData.manufacturer_designation || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manufacturer_designation: e.target.value,
                        })
                      }
                      placeholder="Désignation constructeur (si utile)"
                    />
                  </Box>
                </>
              )}

              <Button
                size="2"
                color="blue"
                onClick={handleAdd}
                disabled={loading}
              >
                Ajouter
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}

// ===== PROP TYPES =====
SupplierRefsInlinePanel.propTypes = {
  stockItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
  }).isRequired,
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  refs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      supplier_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
      supplier_ref: PropTypes.string,
      unit_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      delivery_time_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      is_preferred: PropTypes.bool,
      manufacturer_item_id: PropTypes.object,
      manufacturer_name: PropTypes.string,
      manufacturer_ref: PropTypes.string,
      manufacturer_designation: PropTypes.string,
    })
  ),
  formData: PropTypes.shape({
    supplier_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_ref: PropTypes.string,
    unit_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    delivery_time_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_preferred: PropTypes.bool,
    manufacturer_name: PropTypes.string,
    manufacturer_ref: PropTypes.string,
    manufacturer_designation: PropTypes.string,
  }),
  setFormData: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdatePreferred: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
