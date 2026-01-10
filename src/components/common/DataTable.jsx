/**
 * @fileoverview Tableau générique réutilisable (header, vide, loading, expansion)
 *
 * Conçu pour couvrir des usages variés (commandes fournisseurs, refs fabricants,
 * demandes d'achat...) avec un jeu de colonnes déclaratif et des options
 * d'en-tête, d'état vide et de lignes expandables.
 *
 * Notes d'implémentation:
 * - Pour préserver une structure HTML valide, les enfants de <Table.Body>/<tbody>
 *   doivent être uniquement des <Table.Row>/<tr>. Si vous utilisez `rowRenderer`,
 *   veillez à retourner des éléments <Table.Row> (ou des fragments contenant
 *   uniquement des <Table.Row>) et évitez tout wrapper <div>/<Box>.
 */

import PropTypes from "prop-types";
import React from "react";
import { Table, Flex, Card, Text, Box } from "@radix-ui/themes";
import TableHeader from "./TableHeader";

const defaultGetRowKey = (row, index) => row?.id ?? row?.key ?? index;

function renderCell(row, column) {
  if (typeof column.render === "function") {
    return column.render(row);
  }
  if (typeof column.accessor === "function") {
    return column.accessor(row);
  }
  if (column.accessor && typeof column.accessor === "string") {
    return row?.[column.accessor];
  }
  return null;
}

export default function DataTable({
  headerProps,
  columns,
  data = [],
  size = "2",
  variant = "surface",
  stickyHeader = true,
  loading = false,
  emptyState,
  getRowKey = defaultGetRowKey,
  onRowClick,
  rowHover = true,
  rowStyles,
  renderExpandedRow,
  isRowExpanded,
  onToggleExpand,
  rowRenderer,
}) {
  const colCount = columns.length;

  const renderHeader = () =>
    headerProps ? (
      <Box mb="3">
        <TableHeader {...headerProps} />
      </Box>
    ) : null;

  if (!loading && data.length === 0 && emptyState) {
    const Icon = emptyState.icon;
    return (
      <>
        {renderHeader()}
        <Card>
          <Flex direction="column" align="center" justify="center" gap="3" p="5">
            {Icon && <Icon size={40} color="var(--gray-9)" />}
            <Text weight="bold" size="4">{emptyState.title}</Text>
            {emptyState.description && (
              <Text color="gray" size="2" style={{ textAlign: "center" }}>
                {emptyState.description}
              </Text>
            )}
            {emptyState.action}
          </Flex>
        </Card>
      </>
    );
  }

  const headerStyle = stickyHeader
    ? { position: "sticky", top: 0, background: "var(--gray-1)", zIndex: 1 }
    : undefined;

  return (
    <>
      {renderHeader()}
      <Table.Root variant={variant} size={size}>
        <Table.Header style={headerStyle}>
          <Table.Row>
            {columns.map((col) => (
              <Table.ColumnHeaderCell key={col.key || col.header} style={{ width: col.width }}>
                {col.header}
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <Table.Row key={`skeleton-${idx}`}>
                  <Table.Cell colSpan={colCount}>
                    <Box height="20px" style={{ background: "var(--gray-3)", borderRadius: 6 }} />
                  </Table.Cell>
                </Table.Row>
              ))
            : rowRenderer
            ? data.map((row, index) => {
                const rowKey = getRowKey(row, index);
                return (
                  <React.Fragment key={rowKey}>
                    {rowRenderer(row, index)}
                  </React.Fragment>
                );
              })
            : data.map((row, index) => {
                const rowKey = getRowKey(row, index);
                const expanded = typeof isRowExpanded === "function" ? isRowExpanded(row) : false;
                const clickProps = onRowClick
                  ? { onClick: () => onRowClick(row), style: { cursor: "pointer", ...(rowStyles?.(row) || {}) } }
                  : { style: rowStyles?.(row) };

                return (
                  <React.Fragment key={rowKey}>
                    <Table.Row
                      {...clickProps}
                      data-expanded={expanded}
                      style={{
                        ...(rowHover ? { transition: "background 0.15s" } : {}),
                        ...clickProps.style,
                      }}
                    >
                      {columns.map((col) => (
                        <Table.Cell key={`${rowKey}-${col.key || col.header}`} align={col.align}>
                          {renderCell(row, col)}
                        </Table.Cell>
                      ))}
                    </Table.Row>

                    {expanded && typeof renderExpandedRow === "function" && (
                      <Table.Row key={`${rowKey}-expanded`}>
                        <Table.Cell colSpan={colCount}>
                          {renderExpandedRow(row, {
                            onToggle: onToggleExpand ? () => onToggleExpand(row) : undefined,
                          })}
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </React.Fragment>
                );
              })}
        </Table.Body>
      </Table.Root>
    </>
  );
}

DataTable.propTypes = {
  headerProps: PropTypes.object,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      header: PropTypes.node.isRequired,
      accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      render: PropTypes.func,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      align: PropTypes.oneOf(["start", "center", "end"]),
    })
  ).isRequired,
  data: PropTypes.array,
  size: PropTypes.oneOf(["1", "2", "3"]),
  variant: PropTypes.string,
  stickyHeader: PropTypes.bool,
  loading: PropTypes.bool,
  emptyState: PropTypes.shape({
    icon: PropTypes.elementType,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    action: PropTypes.node,
  }),
  getRowKey: PropTypes.func,
  onRowClick: PropTypes.func,
  rowHover: PropTypes.bool,
  rowStyles: PropTypes.func,
  renderExpandedRow: PropTypes.func,
  isRowExpanded: PropTypes.func,
  onToggleExpand: PropTypes.func,
  rowRenderer: PropTypes.func,
};
