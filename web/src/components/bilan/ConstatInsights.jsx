/**
 * @fileoverview Indicateurs des constats (ADR 0044), dans la présentation de l'onglet État :
 * bandeau de chiffres clés avec mini-courbe, puis barres empilées (onglet Constats du Bilan).
 * @module components/bilan/ConstatInsights
 */

import PropTypes from 'prop-types';
import { Box, Grid, Text } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import FigureCard from '@/components/bilan/FigureCard';
import SectionTitle from '@/components/bilan/SectionTitle';
import StackedBar from '@/components/bilan/StackedBar';
import { typeColor } from '@/components/equipements/dashboardColors';
import { formatPct } from '@/hooks/organisation/organisationFormat';
import { useConstatStats } from '@/hooks/constats/useConstatStats';
import { isEmptyInsights, keyFigures, segmentsOf, totalOf } from '@/components/bilan/constatInsightsFormat';

const formatCount = (v) => String(v ?? 0);
const ofDetail = (part) => (part.of > 0 ? `${part.count} sur ${part.of}` : 'aucune réponse');

function KeyFigures({ data }) {
  const f = keyFigures(data);
  const cards = [
    {
      label: 'Constats', value: String(f.total), detail: 'sur la période',
      definition: 'Constats saisis après intervention, version courante, datés de leur première saisie.',
      series: f.series, seriesFormat: formatCount,
    },
    {
      label: 'Signal visible avant', value: formatPct(f.visible.share), detail: ofDetail(f.visible),
      definition: "Part des constats où un signe annonçait l'arrêt, vu ou non remonté.", compact: true,
    },
    {
      label: 'Signal non remonté', value: formatPct(f.notReported.share), detail: ofDetail(f.notReported),
      definition: "Part des constats où un signe a été vu sans être signalé.", compact: true,
    },
    {
      label: 'Suggestions retenues', value: formatPct(f.retained.share),
      detail: `${ofDetail(f.retained)}, ${f.pending} en attente`,
      definition: 'Demandes issues des constats acceptées ou clôturées, sur toutes les demandes issues des constats.', compact: true,
    },
  ];
  return (
    <Grid columns={{ initial: '1', xs: '2', lg: '4' }} gap="2" mb="2">
      {cards.map((c) => <FigureCard key={c.label} {...c} />)}
    </Grid>
  );
}
KeyFigures.propTypes = { data: PropTypes.object.isRequired };

const BARS = [
  { key: 'levers', title: 'Leviers', definition: "Ce qui aurait réduit ou évité l'arrêt. Un constat peut citer plusieurs leviers.", unit: 'réponses' },
  { key: 'signals', title: 'Signal précurseur', definition: "Un signe annonçait-il l'arrêt ?", unit: 'réponses' },
  { key: 'known_since', title: 'Problème connu depuis', definition: 'Ancienneté du problème, pour les constats qui la renseignent.', unit: 'réponses' },
  { key: 'outcomes', title: 'Devenir des demandes', definition: 'Statut des demandes issues des constats ; « rattachée » : doublon d\'une idée d\'amélioration.', unit: 'demandes' },
];

function Content({ data }) {
  return (
    <Box>
      <KeyFigures data={data} />
      <SectionTitle>Où agir</SectionTitle>
      {BARS.map((b) => (
        <StackedBar
          key={b.key} title={b.title} definition={b.definition}
          segments={segmentsOf(data[b.key], typeColor)} total={totalOf(data[b.key])}
          formatValue={formatCount} totalLabel={`${totalOf(data[b.key])} ${b.unit}`}
        />
      ))}
    </Box>
  );
}
Content.propTypes = { data: PropTypes.object.isRequired };

/**
 * @param {string} startDate - AAAA-MM-JJ
 * @param {string} endDate - AAAA-MM-JJ
 */
export default function ConstatInsights({ startDate, endDate }) {
  const { data, loading, error, reload } = useConstatStats(startDate, endDate);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !data) return <LoadingState fullscreen={false} message="Chargement…" />;
  if (isEmptyInsights(data)) return <Text size="2" color="gray">Aucun constat sur la période</Text>;
  return <Content data={data} />;
}
ConstatInsights.propTypes = { startDate: PropTypes.string.isRequired, endDate: PropTypes.string.isRequired };
