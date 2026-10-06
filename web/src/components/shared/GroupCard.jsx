/**
 * GroupCard — card réutilisable avec header code/titre/badge et liste de lignes.
 *
 * Utilisé dans : TasksPane (home), InterventionTasksBlock (coordination),
 *               panneau équipements (coordination).
 *
 * Structure :
 *   <GroupCard code="IV-001" title="Graissage BROYEUR" count={3}>
 *     <GroupCard.Row accentColor="var(--blue-9)">...</GroupCard.Row>
 *   </GroupCard>
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { PRIORITY_CONFIG } from '@/config/interventionTypes';

/* ── GroupCard ────────────────────────────────────────────────────────────── */

export function GroupCard({ code, title, titleItalic = true, badge, count, countLabel, headerRight, children, style, priority }) {
  const rowCount = count ?? null;
  const label = countLabel ?? (rowCount === 1 ? 'élément' : 'éléments');
  const pCfg = priority ? (PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal) : null;

  return (
    <div
      style={{
        marginBottom: 12,
        borderRadius: 8,
        border: `1px solid ${pCfg ? pCfg.border : 'var(--gray-4)'}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* ── Header ── */}
      <Flex
        align="center"
        gap="2"
        style={{
          padding: '7px 10px',
          background: pCfg ? pCfg.bg : 'var(--gray-2)',
          borderBottom: `1px solid ${pCfg ? pCfg.border : 'var(--gray-4)'}`,
        }}
      >
        {code && (
          <Badge
            variant="outline"
            color="gray"
            size="2"
            style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, flexShrink: 0 }}
          >
            {code}
          </Badge>
        )}
        {title && (
          <Text
            size="2"
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--gray-12)',
              fontStyle: titleItalic ? 'italic' : 'normal',
            }}
          >
            {title}
          </Text>
        )}
        {badge}
        {pCfg && priority && priority !== 'normal' && priority !== 'faible' && (
          <Badge color={pCfg.color} variant="solid" size="1" style={{ flexShrink: 0 }}>
            {pCfg.label}
          </Badge>
        )}
        {headerRight}
        {rowCount !== null && (
          <Text size="1" color="gray" style={{ flexShrink: 0 }}>
            {rowCount} {label}
          </Text>
        )}
      </Flex>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-panel-solid)',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

GroupCard.propTypes = {
  code: PropTypes.string,
  title: PropTypes.string,
  titleItalic: PropTypes.bool,
  badge: PropTypes.node,
  count: PropTypes.number,
  countLabel: PropTypes.string,
  headerRight: PropTypes.node,
  children: PropTypes.node,
  style: PropTypes.object,
  priority: PropTypes.string,
};

/* ── GroupCard.Row ────────────────────────────────────────────────────────── */

function GroupCardRow({ accentColor, isLast, background, children, onClick, onMouseEnter, onMouseLeave, style }) {
  return (
    <Flex
      align="center"
      gap="2"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        padding: '7px 10px',
        borderBottom: isLast ? 'none' : '1px solid var(--gray-3)',
        borderLeft: `3px solid ${accentColor ?? 'var(--gray-5)'}`,
        background: background ?? 'transparent',
        cursor: onClick ? 'pointer' : undefined,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </Flex>
  );
}

GroupCardRow.propTypes = {
  accentColor: PropTypes.string,
  isLast: PropTypes.bool,
  background: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  style: PropTypes.object,
};

GroupCard.Row = GroupCardRow;
