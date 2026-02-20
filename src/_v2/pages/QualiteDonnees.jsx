/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 QualiteDonnees.jsx - Contrôle qualité des données
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Détecte les problèmes de complétude et cohérence des données métier.
 * Identifie 13 règles de validation sur 4 entités principales.
 *
 * Objectif : Assurer l'intégrité des données et faciliter leur correction
 *
 * Structure :
 * - En-tête : Titre + filtres (sévérité, entité)
 * - Vue synthèse : KPIs (total problèmes, par sévérité, par entité)
 * - Liste des problèmes : Groupés par entité avec détails et liens
 *
 * @module pages/QualiteDonnees
 * @requires hooks/useApiCall - Chargement API avec états
 */

import { useState, useEffect, useRef } from 'react';
import { Container, Card, Flex, Text, Badge, Heading, Box, Grid, Select } from '@radix-ui/themes';
import { AlertTriangle, CheckCircle2, XCircle, Database } from 'lucide-react';

// Custom Components
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';

// Custom Hooks
import { useApiCall } from '@/hooks/useApiCall';

// API
import { fetchQualiteDonneesRaw } from '@/lib/api/adapters/tunnel/stats/datasource';

/**
 * Map des labels d'entités
 */
const ENTITE_LABELS = {
  intervention_action: 'Actions d\'intervention',
  intervention: 'Interventions',
  stock_item: 'Articles de stock',
  purchase_request: 'Demandes d\'achat',
};

/**
 * Map des labels de sévérité
 */
const SEVERITE_CONFIG = {
  high: { label: 'Critique', color: 'red', icon: XCircle },
  medium: { label: 'Moyenne', color: 'orange', icon: AlertTriangle },
};

/**
 * Carte KPI pour synthèse
 */
function KPICard({ icon: Icon, label, value, color = 'gray', subtitle }) {
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

/**
 * Carte de problème individuel
 */
function ProblemeCard({ probleme }) {
  const config = SEVERITE_CONFIG[probleme.severite];
  const Icon = config.icon;

  return (
    <Card style={{ borderLeft: `4px solid var(--${config.color}-9)` }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Flex align="center" gap="2">
              <Icon size={16} color={`var(--${config.color}-11)`} />
              <Text size="3" weight="bold">
                {probleme.description}
              </Text>
            </Flex>
            <Text size="1" color="gray">
              Code: {probleme.code}
            </Text>
          </Flex>
          <Badge color={config.color} size="2">
            {config.label}
          </Badge>
        </Flex>
        
        <Flex gap="4">
          <Box>
            <Text size="1" color="gray">
              Occurrences
            </Text>
            <Text size="5" weight="bold">
              {probleme.count}
            </Text>
          </Box>
          {probleme.examples && probleme.examples.length > 0 && (
            <Box style={{ flex: 1 }}>
              <Text size="1" color="gray">
                Exemples d'IDs
              </Text>
              <Text size="2" style={{ fontFamily: 'monospace' }}>
                {probleme.examples.slice(0, 3).join(', ')}
                {probleme.examples.length > 3 && '...'}
              </Text>
            </Box>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

/**
 * Section d'entité avec ses problèmes
 */
function EntiteSection({ entite, problemes }) {
  if (!problemes || problemes.length === 0) return null;

  const totalProblemes = problemes.reduce((sum, p) => sum + p.count, 0);

  return (
    <Box mb="6">
      <Flex align="center" gap="2" mb="3">
        <Database size={20} />
        <Heading size="5">{ENTITE_LABELS[entite]}</Heading>
        <Badge color="gray" size="2">
          {problemes.length} règle{problemes.length > 1 ? 's' : ''} • {totalProblemes} problème{totalProblemes > 1 ? 's' : ''}
        </Badge>
      </Flex>
      <Flex direction="column" gap="3">
        {problemes.map((probleme, idx) => (
          <ProblemeCard key={idx} probleme={probleme} />
        ))}
      </Flex>
    </Box>
  );
}

/**
 * Page principale
 */
export default function QualiteDonnees() {
  // État filtres
  const [severiteFilter, setSeveriteFilter] = useState('all');
  const [entiteFilter, setEntiteFilter] = useState('all');
  
  // Ref pour éviter double chargement
  const initialLoadRef = useRef(false);

  // Chargement données
  const { data, loading, error, execute } = useApiCall(
    () => fetchQualiteDonneesRaw({
      severite: severiteFilter !== 'all' ? severiteFilter : undefined,
      entite: entiteFilter !== 'all' ? entiteFilter : undefined,
    }),
    { autoExecute: false }
  );

  // Charger au mount
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharger quand filtres changent
  useEffect(() => {
    if (!initialLoadRef.current) return;
    execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severiteFilter, entiteFilter]);

  // États
  if (loading) return <LoadingState />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data) return null;

  // Calcul des statistiques
  const totalProblemes = data.total || 0;
  const problemesBySeverite = data.by_severite || {};
  const problemesByEntite = data.by_entite || {};

  const highCount = problemesBySeverite.high || 0;
  const mediumCount = problemesBySeverite.medium || 0;

  // Grouper problèmes par entité
  const groupedProblemes = {};
  if (data.problemes) {
    data.problemes.forEach((probleme) => {
      if (!groupedProblemes[probleme.entite]) {
        groupedProblemes[probleme.entite] = [];
      }
      groupedProblemes[probleme.entite].push(probleme);
    });
  }

  return (
    <Container size="4">
      <PageHeader
        title="Qualité des données"
        subtitle="Contrôle de complétude et cohérence"
      />

      {/* Filtres */}
      <Card mb="4">
        <Flex gap="3" align="center">
          <Text size="2" weight="bold">
            Filtres :
          </Text>
          <Select.Root value={severiteFilter} onValueChange={setSeveriteFilter}>
            <Select.Trigger placeholder="Toutes sévérités" />
            <Select.Content>
              <Select.Item value="all">Toutes sévérités</Select.Item>
              <Select.Item value="high">Critique</Select.Item>
              <Select.Item value="medium">Moyenne</Select.Item>
            </Select.Content>
          </Select.Root>

          <Select.Root value={entiteFilter} onValueChange={setEntiteFilter}>
            <Select.Trigger placeholder="Toutes entités" />
            <Select.Content>
              <Select.Item value="all">Toutes entités</Select.Item>
              {Object.entries(ENTITE_LABELS).map(([key, label]) => (
                <Select.Item key={key} value={key}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </Card>

      {/* Synthèse KPIs */}
      <Grid columns={{ initial: '1', md: '3' }} gap="4" mb="6">
        <KPICard
          icon={Database}
          label="Total problèmes"
          value={totalProblemes}
          color={totalProblemes > 0 ? 'orange' : 'green'}
          subtitle={`${Object.keys(problemesByEntite).length} entités concernées`}
        />
        <KPICard
          icon={XCircle}
          label="Critiques"
          value={highCount}
          color="red"
          subtitle="Bloquer la saisie"
        />
        <KPICard
          icon={AlertTriangle}
          label="Moyennes"
          value={mediumCount}
          color="orange"
          subtitle="À corriger"
        />
      </Grid>

      {/* Message si pas de problèmes */}
      {totalProblemes === 0 && (
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
      )}

      {/* Liste des problèmes par entité */}
      {Object.keys(groupedProblemes).length > 0 && (
        <Box>
          {Object.entries(groupedProblemes).map(([entite, problemes]) => (
            <EntiteSection key={entite} entite={entite} problemes={problemes} />
          ))}
        </Box>
      )}
    </Container>
  );
}
