/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📄 InteractiveTable.jsx - Composant de table interactive réutilisable
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Table générique avec :
 * - Lignes cliquables avec effet hover
 * - Configuration flexible des colonnes
 * - Support pour rendu personnalisé des cellules
 * - Bouton d'action avec icône
 * - Styles de ligne conditionnels
 * 
 * @module components/common/InteractiveTable
 */

import { Table, Button, Flex, Text, Box } from "@radix-ui/themes";
import { ArrowRight } from "@/lib/icons";

/**
 * Composant de table interactive avec lignes cliquables
 * 
 * @param {Object} props
 * @param {string} props.title - Titre de la section (avec emoji optionnel)
 * @param {Object} props.badge - Configuration du badge titre { label, color, variant }
 * @param {Array} props.columns - Configuration des colonnes [{ key, header, width, align }]
 * @param {Array} props.data - Données à afficher
 * @param {Function} props.onRowClick - Handler pour le clic sur une ligne (row) => void
 * @param {Function} props.renderCell - Fonction de rendu des cellules (row, column) => JSX
 * @param {Function} props.getRowStyle - Fonction pour obtenir les styles de ligne (row) => Object
 * @param {string} props.actionLabel - Label du bouton d'action (défaut: "Voir")
 * @param {string} props.emptyMessage - Message si aucune donnée
 * 
 * @returns {JSX.Element}
 */
export default function InteractiveTable({
  title,
  badge,
  columns = [],
  data = [],
  onRowClick,
  renderCell,
  getRowStyle,
  actionLabel = "Voir",
  emptyMessage = "Aucune donnée"
}) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box>
      {/* Titre avec badge */}
      {title && (
        <Flex align="center" gap="2" mb="3">
          <Text size="5" weight="bold">{title}</Text>
          {badge && (
            <Box as="span" style={{ fontSize: '0.875rem' }}>
              {badge}
            </Box>
          )}
        </Flex>
      )}

      {/* Table */}
      <Table.Root variant="surface" size="1">
        <Table.Header>
          <Table.Row>
            {columns.map((col) => (
              <Table.ColumnHeaderCell
                key={col.key}
                width={col.width}
                style={{ textAlign: col.align || 'left' }}
              >
                {col.header}
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((row) => {
            const rowStyle = getRowStyle ? getRowStyle(row) : {};
            
            return (
              <Table.Row
                key={row.id}
                onClick={() => onRowClick && onRowClick(row)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 58, 95, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  ...rowStyle
                }}
              >
                {columns.map((col) => {
                  // Cellule d'action avec bouton
                  if (col.key === '_action') {
                    return (
                      <Table.Cell
                        key={col.key}
                        style={{
                          textAlign: col.align || 'center',
                          verticalAlign: 'middle'
                        }}
                      >
                        <Button
                          size="2"
                          variant="soft"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick && onRowClick(row);
                          }}
                        >
                          <ArrowRight size={14} />
                          {actionLabel}
                        </Button>
                      </Table.Cell>
                    );
                  }

                  // Cellule personnalisée
                  return (
                    <Table.Cell
                      key={col.key}
                      style={{
                        textAlign: col.align || 'left',
                        verticalAlign: col.verticalAlign || 'top',
                        paddingTop: col.padding?.top || '8px',
                        paddingBottom: col.padding?.bottom || '8px'
                      }}
                    >
                      {renderCell ? renderCell(row, col) : row[col.key]}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
