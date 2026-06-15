/**
 * @fileoverview Layout master-detail générique — liste à gauche, détail à droite
 * @module components/ui/MasterDetailLayout
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, MousePointerClick, Search, X } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';

function MasterPanel({
  icon: Icon, title, count,
  search, onSearchChange,
  children, loading,
  pagination,
  headerExtra,
}) {
  const hasPagination = pagination && pagination.totalPages > 1;

  return (
    <Box style={{
      border: '1px solid var(--gray-5)',
      borderRadius: 'var(--radius-3)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <Box style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-5)', background: 'var(--gray-2)', flexShrink: 0 }}>
        {(Icon || title) && (
          <Flex align="center" gap="2" mb="2">
            {Icon && <Icon size={14} color="var(--gray-11)" />}
            {title && <Text size="2" weight="bold" color="gray">{title}</Text>}
          </Flex>
        )}

        {onSearchChange && (
          <Flex align="center" gap="2">
            <Box style={{ flex: 1 }}>
              <TextField.Root
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher…"
                size="2"
              >
                <TextField.Slot><Search size={13} color="var(--gray-9)" /></TextField.Slot>
                {search && (
                  <TextField.Slot side="right" style={{ cursor: 'pointer' }} onClick={() => onSearchChange('')}>
                    <X size={13} color="var(--gray-9)" />
                  </TextField.Slot>
                )}
              </TextField.Root>
            </Box>
            {count > 0 && (
              <Text size="1" color="gray" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                {count} ligne{count > 1 ? 's' : ''}
              </Text>
            )}
          </Flex>
        )}

        {headerExtra && <Flex align="center" gap="2" style={{ paddingTop: 10 }}>{headerExtra}</Flex>}
      </Box>

      {/* Liste */}
      <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <LoadingState fullscreen={false} message="Chargement…" />
        ) : children}
      </Box>

      {/* Footer pagination */}
      {hasPagination && (
        <Box style={{ padding: '8px 12px', borderTop: '1px solid var(--gray-5)', background: 'var(--gray-2)', flexShrink: 0 }}>
          <Flex align="center" justify="between">
            <Text size="1" color="gray">
              Page {pagination.currentPage} / {pagination.totalPages}
              {count > 0 && <> · {count}</>}
            </Text>
            <Flex gap="1">
              <Button size="1" variant="soft" color="gray"
                disabled={pagination.currentPage <= 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              >
                <ChevronLeft size={12} />
              </Button>
              <Button size="1" variant="soft" color="gray"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              >
                <ChevronRight size={12} />
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
}

MasterPanel.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  count: PropTypes.number,
  search: PropTypes.string,
  onSearchChange: PropTypes.func,
  children: PropTypes.node,
  loading: PropTypes.bool,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    onPageChange: PropTypes.func,
  }),
  headerExtra: PropTypes.node,
};

function DetailPanel({ children, loading, emptyLabel, freeMode }) {
  const borderStyle = freeMode
    ? { borderLeft: '1px solid var(--gray-5)' }
    : { border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-3)' };

  if (loading) {
    return (
      <Box style={{ ...borderStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <LoadingState fullscreen={false} message="Chargement…" />
      </Box>
    );
  }

  if (!children) {
    return (
      <Box style={{
        ...borderStyle,
        ...(freeMode ? {} : { borderStyle: 'dashed' }),
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}>
        <MousePointerClick size={32} color="var(--gray-7)" />
        <Text size="2" color="gray">{emptyLabel ?? 'Sélectionnez un élément pour voir son détail'}</Text>
      </Box>
    );
  }

  return (
    <Box style={{
      ...borderStyle,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: freeMode ? 0 : '14px 16px' }}>
        {children}
      </Box>
    </Box>
  );
}

DetailPanel.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool,
  emptyLabel: PropTypes.string,
};

/**
 * Panneau gauche libre — utilisé quand le contenu est entièrement custom
 * (pas de header/search/pagination intégré). Le contenu scroll librement.
 */
function FreeMasterPanel({ children }) {
  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}
FreeMasterPanel.propTypes = { children: PropTypes.node };

export default function MasterDetailLayout({
  masterProps,
  leftPanel,
  detailChildren,
  detailLoading,
  emptyLabel,
  ratio,
  fullHeight,
  freeDetail,
}) {
  const gridRatio = ratio ?? (leftPanel ? '42% 1fr' : '1fr 1.3fr');
  const gap = leftPanel ? 0 : '12px';
  const height = fullHeight !== false ? '100%' : undefined;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridRatio, gap, alignItems: 'stretch', height }}>
      {leftPanel
        ? <FreeMasterPanel>{leftPanel}</FreeMasterPanel>
        : <MasterPanel {...masterProps} />
      }
      <DetailPanel loading={detailLoading} emptyLabel={emptyLabel} freeMode={!!(leftPanel || freeDetail)}>
        {detailChildren}
      </DetailPanel>
    </div>
  );
}

MasterDetailLayout.propTypes = {
  masterProps: PropTypes.shape({
    icon: PropTypes.elementType,
    title: PropTypes.string,
    count: PropTypes.number,
    search: PropTypes.string,
    onSearchChange: PropTypes.func,
    children: PropTypes.node,
    loading: PropTypes.bool,
    pagination: PropTypes.object,
    headerExtra: PropTypes.node,
  }),
  leftPanel: PropTypes.node,
  detailChildren: PropTypes.node,
  detailLoading: PropTypes.bool,
  emptyLabel: PropTypes.string,
  ratio: PropTypes.string,
  fullHeight: PropTypes.bool,
  freeDetail: PropTypes.bool,
};
