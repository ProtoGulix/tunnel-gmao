/**
 * @fileoverview Section « État et évolution » d'un équipement : chiffres clés, graphiques, accès aux interventions
 * @module components/equipements/EquipementDashboardSection
 */

import { lazy, Suspense, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Select, Text } from '@radix-ui/themes';
import { List } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import { Section } from '@/components/equipements/EquipementDetailSections';
import EquipementInterventionsDialog from '@/components/equipements/EquipementInterventionsDialog';
import { KpiStrip, MonthlyTable } from '@/components/equipements/EquipementDashboardFigures';
import { useEquipementDashboard } from '@/hooks/equipements/useEquipementDashboard';
import { PERIOD_OPTIONS, periodStartDate, monthFilters, periodFilters } from '@/hooks/equipements/dashboardFilters';
import { formatMonthLong } from '@/hooks/equipements/dashboardFormat';

// Recharts n'est téléchargé qu'à l'affichage de la section (ADR 0020)
const Charts = lazy(() => import('@/components/equipements/EquipementDashboardCharts'));

function isEmpty(kpis) {
  return kpis.interventions_reported === 0 && kpis.interventions_open_now === 0 && kpis.actions_count === 0;
}

function DashboardBody({ data, onOpen }) {
  const selectType = (t) => onOpen(periodFilters(data.period, t.code), `Type : ${t.label}`);
  const selectMonth = (month) => month && onOpen(monthFilters(month, data.period), `Mois : ${formatMonthLong(month)}`);
  if (isEmpty(data.kpis)) return <Text size="2" color="gray">Aucune intervention sur cette période.</Text>;
  return (
    <>
      <KpiStrip kpis={data.kpis} />
      <Suspense fallback={<LoadingState fullscreen={false} message="Chargement des graphiques…" />}>
        <Charts data={data} onSelectType={selectType} onSelectMonth={selectMonth} />
      </Suspense>
      <MonthlyTable monthly={data.monthly} onSelectMonth={selectMonth} />
    </>
  );
}
DashboardBody.propTypes = { data: PropTypes.object.isRequired, onOpen: PropTypes.func.isRequired };

function DashboardState({ data, loading, error, onRetry, onOpen }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!data) return <LoadingState fullscreen={false} message="Chargement…" />;
  return (
    <Box style={{ opacity: loading ? 0.6 : 1 }}>
      <DashboardBody data={data} onOpen={onOpen} />
    </Box>
  );
}
DashboardState.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
};

function AllInterventionsButton({ onClick }) {
  return (
    <Button size="1" variant="soft" color="gray" onClick={onClick}>
      <List size={13} /> Voir les interventions
    </Button>
  );
}
AllInterventionsButton.propTypes = { onClick: PropTypes.func.isRequired };

/**
 * @param {Object} eq - équipement affiché
 * @param {boolean} includeDescendants - case partagée avec la section Activité
 */
export default function DashboardSection({ eq, includeDescendants }) {
  const [period, setPeriod] = useState('12');
  const [dialog, setDialog] = useState(null); // { filters, title }
  const startDate = useMemo(() => periodStartDate(period, eq.date_mise_service), [period, eq.date_mise_service]);
  const { data, loading, error, reload } = useEquipementDashboard(String(eq.id), { startDate, includeDescendants });
  const open = (filters, title) => setDialog({ filters, title });

  return (
    <Section title="État et évolution">
      <Flex align="center" gap="2" mb="3" wrap="wrap">
        <Select.Root value={period} onValueChange={setPeriod} size="1">
          <Select.Trigger aria-label="Période" />
          <Select.Content>
            {PERIOD_OPTIONS.map((o) => (
              <Select.Item key={o.value} value={o.value} disabled={o.value === 'since' && !eq.date_mise_service}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        {data && <AllInterventionsButton onClick={() => open(periodFilters(data.period), 'Toute la période')} />}
      </Flex>
      <DashboardState data={data} loading={loading} error={error} onRetry={reload} onOpen={open} />
      <EquipementInterventionsDialog
        filters={dialog?.filters ?? null}
        title={dialog?.title}
        equipementId={String(eq.id)}
        includeDescendants={includeDescendants}
        onClose={() => setDialog(null)}
      />
    </Section>
  );
}
DashboardSection.propTypes = {
  eq: PropTypes.object.isRequired,
  includeDescendants: PropTypes.bool.isRequired,
};
