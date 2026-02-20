/**
 * @fileoverview Dialogue de visualisation détaillée d'une version de template
 * @module components/stock/TemplateVersionDetailsDialog
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import {
  Dialog,
  Button,
  Flex,
  Text,
  Table,
  Badge,
  Box,
  Card,
} from "@radix-ui/themes";
import { FileCode, X } from "lucide-react";

/**
 * Dialogue affichant les détails d'une version spécifique de template
 * @component
 */
export default function TemplateVersionDetailsDialog({ version, open, onClose }) {
  if (!version) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 900 }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <FileCode size={20} />
            {version.code} - Version {version.version}
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4">
          Détails complets de cette version du template
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* Informations générales */}
          <Card>
            <Flex direction="column" gap="3">
              <Text size="2" weight="bold">Informations générales</Text>
              
              <Flex direction="column" gap="2">
                <Flex justify="between">
                  <Text size="2" color="gray">Code:</Text>
                  <Text size="2" weight="medium">{version.code}</Text>
                </Flex>
                
                <Flex justify="between">
                  <Text size="2" color="gray">Version:</Text>
                  <Badge color="blue" variant="soft">v{version.version}</Badge>
                </Flex>
                
                <Flex justify="between">
                  <Text size="2" color="gray">Pattern:</Text>
                  <Text size="2" style={{ fontFamily: 'monospace' }}>{version.pattern}</Text>
                </Flex>
                
                {version.label && (
                  <Flex justify="between">
                    <Text size="2" color="gray">Label:</Text>
                    <Text size="2" weight="medium">{version.label}</Text>
                  </Flex>
                )}
                
                {version.created_at && (
                  <Flex justify="between">
                    <Text size="2" color="gray">Créé le:</Text>
                    <Text size="2">{new Date(version.created_at).toLocaleString('fr-FR')}</Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Card>

          {/* Champs du template */}
          <Box>
            <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
              Champs du template ({version.fields?.length || 0})
            </Text>
            
            {version.fields && version.fields.length > 0 ? (
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell width="40px">#</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Clé</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Label</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Unité</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="80px">Requis</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {version.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field, index) => (
                      <Table.Row key={`${field.field_key}-${index}`}>
                        <Table.Cell>
                          <Text size="1" color="gray">{index + 1}</Text>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <Text size="2" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {field.field_key}
                          </Text>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <Text size="2">{field.label}</Text>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <Badge color="gray" variant="soft">
                            {field.type}
                          </Badge>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <Text size="2" color="gray">
                            {field.unit || '-'}
                          </Text>
                        </Table.Cell>
                        
                        <Table.Cell>
                          {field.required ? (
                            <Badge color="red" variant="soft">Oui</Badge>
                          ) : (
                            <Badge color="gray" variant="surface">Non</Badge>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </Table.Body>
              </Table.Root>
            ) : (
              <Card>
                <Text size="2" color="gray">Aucun champ défini</Text>
              </Card>
            )}
          </Box>

          {/* Valeurs enum si présentes */}
          {version.fields?.some(f => f.type === 'enum' && f.enum_values?.length > 0) && (
            <Box>
              <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                Valeurs énumérées
              </Text>
              
              <Flex direction="column" gap="2">
                {version.fields
                  .filter(f => f.type === 'enum' && f.enum_values?.length > 0)
                  .map((field, fieldIndex) => (
                    <Card key={`${field.field_key}-${fieldIndex}`}>
                      <Flex direction="column" gap="2">
                        <Text size="2" weight="medium">{field.label} ({field.field_key}):</Text>
                        <Flex gap="1" wrap="wrap">
                          {field.enum_values.map((enumVal, idx) => (
                            <Badge key={idx} color="blue" variant="soft">
                              {typeof enumVal === 'object' ? enumVal.label || enumVal.value : enumVal}
                            </Badge>
                          ))}
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
              </Flex>
            </Box>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              <X size={16} />
              Fermer
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

TemplateVersionDetailsDialog.propTypes = {
  version: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
