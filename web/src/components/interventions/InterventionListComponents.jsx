/**
 * Composants réutilisables pour la liste des interventions
 * 
 * Composants visuels purs qui reçoivent uniquement des props.
 * Aucun hook métier, aucun appel API.
 */

import PropTypes from 'prop-types';
import { Box, Card, Flex, Text, Badge, Button, Heading } from '@radix-ui/themes';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/config/interventionTypes';

/**
 * Badge d'âge avec code couleur
 */
export function AgeBadge({ days, priority }) {
  // Seuils d'affichage
  const isUrgent = priority?.toLowerCase() === 'urgent';
  const shouldShow = (isUrgent && days > 7) || days > 30;

  if (!shouldShow) return null;

  // Code couleur
  let color = 'gray';
  if (days >= 30) color = 'red';
  else if (days >= 7) color = 'amber';

  return (
    <Badge color={color} variant="soft">
      {days}j
    </Badge>
  );
}

AgeBadge.propTypes = {
  days: PropTypes.number.isRequired,
  priority: PropTypes.string,
};

/**
 * Ligne d'intervention dans un bloc
 */
export function InterventionRow({ intervention, onClick, age }) {
  const priorityConfig = PRIORITY_CONFIG[intervention.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
  const statusConfig = STATUS_CONFIG[intervention.status?.toLowerCase()] || STATUS_CONFIG.ouvert;

  const rowStyle = {
    opacity: intervention.printedFiche ? 0.5 : 1,
    backgroundColor: intervention.printedFiche ? 'var(--gray-2)' : 'transparent',
    borderLeft: `4px solid var(--${priorityConfig.color}-9)`,
    padding: 'var(--space-3)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const handleRowClick = () => {
    if (onClick) onClick(intervention);
  };

  return (
    <Box
      style={rowStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--gray-3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = intervention.printedFiche
          ? 'var(--gray-2)'
          : 'transparent';
      }}
      onClick={handleRowClick}
    >
      <Flex justify="between" align="center" gap="3">
        {/* Code intervention */}
        <Box style={{ minWidth: '180px' }}>
          <Text size="2" weight="medium">
            {intervention.code}
          </Text>
        </Box>

        {/* Titre */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="2" style={{ display: 'block' }}>
            {intervention.title || 'Sans titre'}
          </Text>
          {intervention.machine && (
            <Text size="1" color="gray">
              {intervention.machine.code} - {intervention.machine.name}
            </Text>
          )}
        </Box>

        {/* Info */}
        <Flex gap="2" align="center" style={{ minWidth: '140px' }}>
          <Badge color={priorityConfig.color} variant="soft">
            {intervention.priority || 'normal'}
          </Badge>
          <Badge color={statusConfig.color} variant="soft">
            {statusConfig.label}
          </Badge>
        </Flex>

        {/* Âge */}
        <Box style={{ minWidth: '80px', textAlign: 'right' }}>
          <AgeBadge days={age} priority={intervention.priority} />
        </Box>

        {/* Action */}
        <Box style={{ minWidth: '100px', textAlign: 'center' }}>
          <Button size="1" variant="soft">
            <ExternalLink size={14} />
            Ouvrir
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}

InterventionRow.propTypes = {
  intervention: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    title: PropTypes.string,
    priority: PropTypes.string,
    status: PropTypes.string,
    printedFiche: PropTypes.bool,
    machine: PropTypes.shape({
      code: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
  onClick: PropTypes.func,
  age: PropTypes.number.isRequired,
};

/**
 * Bloc d'interventions avec titre et contenu collapsible
 */
export function InterventionBlock({ title, badge, interventions, onInterventionClick, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const calculateAge = (reportedDate) => {
    if (!reportedDate) return 0;
    const now = new Date();
    const reported = new Date(reportedDate);
    const diffTime = Math.abs(now - reported);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card>
      <Flex
        justify="between"
        align="center"
        mb={collapsed ? '0' : '3'}
        style={{ cursor: 'pointer' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <Flex align="center" gap="3">
          <Heading size="4">{title}</Heading>
          {badge}
        </Flex>
        {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </Flex>

      {!collapsed && (
        <Box>
          {interventions.length === 0 ? (
            <Text size="2" color="gray">
              Aucune intervention
            </Text>
          ) : (
            <Flex direction="column" gap="2">
              {interventions.map((intervention) => (
                <InterventionRow
                  key={intervention.id}
                  intervention={intervention}
                  onClick={onInterventionClick}
                  age={calculateAge(intervention.reportedDate)}
                />
              ))}
            </Flex>
          )}
        </Box>
      )}
    </Card>
  );
}

InterventionBlock.propTypes = {
  title: PropTypes.string.isRequired,
  badge: PropTypes.node.isRequired,
  interventions: PropTypes.array.isRequired,
  onInterventionClick: PropTypes.func,
  defaultCollapsed: PropTypes.bool,
};
