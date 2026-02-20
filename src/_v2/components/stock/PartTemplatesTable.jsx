import PropTypes from "prop-types";
import {
  Table,
  Flex,
  Box,
  Text,
  Badge,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import { Edit2, Trash2, Layers } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import { FileCode } from "lucide-react";
import TemplateVersionsDialog from "./TemplateVersionsDialog";

/**
 * Table d'affichage des templates de pièces
 * 
 * @param {Object} props
 * @param {Array} props.templates - Liste des templates (dernières versions uniquement)
 * @param {boolean} props.loading - État de chargement
 * @param {Function} props.onEdit - Callback édition (crée nouvelle version)
 * @param {Function} props.onDelete - Callback suppression
 * @param {Function} props.onViewVersion - Callback visualisation d'une version spécifique
 */
export default function PartTemplatesTable({ 
  templates = [], 
  loading = false,
  onEdit,
  onDelete,
  onViewVersion,
}) {
  if (loading) {
    return <LoadingState message="Chargement des templates..." />;
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={<FileCode size={64} />}
        title="Aucun template"
        description="Créez un template pour structurer vos pièces"
        actions={[]}
      />
    );
  }

  return (
    <Box>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Code</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Version</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Pattern</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Champs</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {templates.map((template) => (
            <Table.Row key={template.id}>
              <Table.Cell>
                <Text weight="bold" size="2">
                  {template.code}
                </Text>
              </Table.Cell>
              
              <Table.Cell>
                <Flex align="center" gap="2">
                  <Tooltip content="Version actuelle (dernière créée)">
                    <Badge color="blue" variant="soft">
                      v{template.version}
                    </Badge>
                  </Tooltip>
                  {template.hasMultipleVersions && (
                    <Tooltip content="Ce template a plusieurs versions">
                      <Badge color="gray" variant="surface" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={12} />
                        historique
                      </Badge>
                    </Tooltip>
                  )}
                </Flex>
              </Table.Cell>
              
              <Table.Cell>
                <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                  {template.pattern}
                </Text>
              </Table.Cell>
              
              <Table.Cell>
                <Badge color="blue" variant="soft">
                  {template.fields?.length || 0} champs
                </Badge>
              </Table.Cell>
              
              <Table.Cell>
                <Flex gap="2">
                  {template.hasMultipleVersions && (
                    <TemplateVersionsDialog
                      templateCode={template.code}
                      currentVersion={template.version}
                      onViewVersion={onViewVersion}
                    />
                  )}
                  
                  <Tooltip content="Créer une nouvelle version de ce template">
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      onClick={() => onEdit?.(template)}
                    >
                      <Edit2 size={14} />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip content="Supprimer cette version du template">
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      onClick={() => onDelete?.(template)}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Tooltip>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

PartTemplatesTable.propTypes = {
  templates: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onViewVersion: PropTypes.func,
};
