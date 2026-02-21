/**
 * Composants pour la page Qualité des Données
 */

import PropTypes from 'prop-types';
import { Card, Flex, Text, Badge, Box, Heading, Grid } from '@radix-ui/themes';
import { Database, CheckCircle2 } from 'lucide-react';
import { ENTITY_LABELS, SEVERITY_CONFIG, RULE_DESCRIPTIONS } from './config';

/**
 * Carte KPI synthétique
 */
export function KPICard({ icon: Icon, label, value, color = 'gray', subtitle }) {
  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <Icon size={20} color={`var(--${color}-11)`} />
          <Text size="2" weight="bold" style={{ color: `var(--${color}-11)` }}>
            {label}
          </Text>
        </Flex>
        <Text size="7" weight="bold" style={{ color: `var(--${color}-11)` }}>
          {value}
        </Text>
        {subtitle && (
          <Text size="1" color="gray">
            {subtitle}
          </Text>
        )}
      </Flex>
    </Card>
  );
}

KPICard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
  subtitle: PropTypes.string,
};

/**
 * Grille de KPIs pour la synthèse
 */
export function SynthesisCards({ total, highCount, mediumCount, entityCount }) {
  return (
    <Grid columns={{ initial: '1', md: '3' }} gap="4" mb="6">
      <KPICard
        icon={Database}
        label="Total problèmes"
        value={total}
        color={total > 0 ? 'orange' : 'green'}
        subtitle={`${entityCount} entité${entityCount > 1 ? 's' : ''} concernée${entityCount > 1 ? 's' : ''}`}
      />
      <KPICard
        icon={SEVERITY_CONFIG.high.icon}
        label="Critiques"
        value={highCount}
        color="red"
        subtitle="Bloquer la saisie"
      />
      <KPICard
        icon={SEVERITY_CONFIG.medium.icon}
        label="Moyennes"
        value={mediumCount}
        color="orange"
        subtitle="À corriger"
      />
    </Grid>
  );
}

SynthesisCards.propTypes = {
  total: PropTypes.number.isRequired,
  highCount: PropTypes.number.isRequired,
  mediumCount: PropTypes.number.isRequired,
  entityCount: PropTypes.number.isRequired,
};

/**
 * Message quand aucun problème détecté
 */
export function NoProblemsMessage() {
  return (
    <Card>
      <Flex align="center" gap="3" p="4">
        <CheckCircle2 size={32} color="var(--green-11)" />
        <Box>
          <Text size="4" weight="bold" style={{ color: 'var(--green-11)' }}>
            Aucun problème détecté
          </Text>
          <Text size="2" color="gray">
            Toutes les données respectent les règles de qualité
          </Text>
        </Box>
      </Flex>
    </Card>
  );
}

/**
 * Carte de problème individuel
 */
export function ProblemCard({ problem }) {
  const config = SEVERITY_CONFIG[problem.severity];
  const Icon = config.icon;
  const description = RULE_DESCRIPTIONS[problem.code] || problem.code;

  return (
    <Card style={{ borderLeft: `4px solid var(--${config.color}-9)` }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Flex align="center" gap="2">
              <Icon size={16} color={`var(--${config.color}-11)`} />
              <Text size="3" weight="bold">
                {description}
              </Text>
            </Flex>
            <Text size="2" color="gray">
              {problem.message}
            </Text>
            <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
              {problem.code}
            </Text>
          </Flex>
          <Badge color={config.color} size="2">
            {config.label}
          </Badge>
        </Flex>
        
        {problem.context && (
          <Box>
            <Text size="1" color="gray">
              Contexte
            </Text>
            <Flex direction="column" gap="1" mt="1">
              {problem.context.interventionCode && (
                <Text size="2" style={{ fontFamily: 'monospace' }}>
                  Intervention: {problem.context.interventionCode}
                </Text>
              )}
              {problem.context.stockItemRef && (
                <Text size="2" style={{ fontFamily: 'monospace' }}>
                  Article: {problem.context.stockItemRef} - {problem.context.stockItemName}
                </Text>
              )}
              {problem.context.createdAt && (
                <Text size="2" color="gray">
                  Créé le: {new Date(problem.context.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </Flex>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

ProblemCard.propTypes = {
  problem: PropTypes.shape({
    code: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    entity: PropTypes.string.isRequired,
    entityId: PropTypes.string,
    message: PropTypes.string.isRequired,
    context: PropTypes.shape({
      interventionId: PropTypes.string,
      interventionCode: PropTypes.string,
      createdAt: PropTypes.string,
      stockItemRef: PropTypes.string,
      stockItemName: PropTypes.string,
      purchaseRequestId: PropTypes.string,
    }),
  }).isRequired,
};

/**
 * Section d'entité avec ses problèmes
 */
export function EntitySection({ entity, problems }) {
  if (!problems || problems.length === 0) return null;

  return (
    <Box mb="6">
      <Flex align="center" gap="2" mb="3">
        <Database size={20} />
        <Heading size="5">{ENTITY_LABELS[entity] || entity}</Heading>
        <Badge color="gray" size="2">
          {problems.length} problème{problems.length > 1 ? 's' : ''}
        </Badge>
      </Flex>
      <Flex direction="column" gap="3">
        {problems.map((problem, idx) => (
          <ProblemCard key={`${problem.code}-${idx}`} problem={problem} />
        ))}
      </Flex>
    </Box>
  );
}

EntitySection.propTypes = {
  entity: PropTypes.string.isRequired,
  problems: PropTypes.array.isRequired,
};
