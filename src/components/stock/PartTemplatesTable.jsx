import PropTypes from "prop-types";
import {
  Table,
  Flex,
  Box,
  Text,
  Badge,
  IconButton,
} from "@radix-ui/themes";
import { Edit2, Trash2 } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import { FileCode } from "lucide-react";

/**
 * Table d'affichage des templates de pièces
 * 
 * @param {Object} props
 * @param {Array} props.templates - Liste des templates
 * @param {boolean} props.loading - État de chargement
 * @param {Function} props.onEdit - Callback édition
 * @param {Function} props.onDelete - Callback suppression
 */
export default function PartTemplatesTable({ 
  templates = [], 
  loading = false,
  onEdit,
  onDelete,
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
                <Badge color="gray" variant="soft">
                  v{template.version}
                </Badge>
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
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="gray"
                    onClick={() => onEdit?.(template)}
                    title="Éditer (nouvelle version)"
                  >
                    <Edit2 size={14} />
                  </IconButton>
                  
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => onDelete?.(template)}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </IconButton>
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
};
