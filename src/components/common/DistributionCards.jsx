/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 DistributionCards.jsx - Composant réutilisable pour distributions
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant générique affichant des distributions de données (priorité, type, statut, zone, etc.)
 * avec visualisation flexible (Grid ou Flex), tooltips, tendances et interactivité.
 * 
 * Fonctionnalités:
 * - Cards responsive avec icônes Lucide, couleurs Radix, compteurs
 * - Tri automatique par count décroissant (valeurs importantes en premier)
 * - Click handler optionnel par item (filtrage, drill-down)
 * - Comparaison période précédente avec flèches tendance (▲▼ TrendingUp/Down)
 * - Layout flexible: Grid (colonnes configurables) ou Flex (wrap automatique)
 * - Tooltips informatifs sur hover (count, pourcentage, tendance)
 * - Badge "dominant" optionnel sur valeur max
 * - Custom header extras (boutons, filtres)
 * - Custom footer per card (progress bars, détails)
 * - Empty state styled avec message personnalisé
 * 
 * Configuration:
 * - config: { [key]: { color, icon, label, dominant } } pour mapper data → visuel
 * - layout: 'flex' (défaut) ou 'grid'
 * - columns: responsive columns pour Grid (ex: { initial: '2', md: '4' })
 * 
 * ✅ IMPLÉMENTÉ:
 * - Tri automatique par count desc (useMemo)
 * - Calcul total et pourcentages (count / total * 100)
 * - Comparaison période avec TrendingUp/Down icons + tooltip delta
 * - Layout Grid responsive ou Flex wrap
 * - Click handler avec hover effects (scale, shadow)
 * - Badge dominant (★ jaune) sur item max
 * - Header extras slot (boutons, toggles)
 * - Footer slot per card (progress, métadonnées)
 * - Empty state avec message personnalisé
 * - PropTypes complets pour validation runtime
 * - Protection données nulles (data || {})
 * 
 * 🎯 USAGES:
 * - PriorityDistribution: Répartition par priorité (urgent, high, medium, low)
 * - InterventionTypeDistribution: Types interventions (COR, PRE, AME, etc.)
 * - Potentiel: StatusDistribution, ZoneDistribution, TechnicianDistribution...
 * 
 * 📋 TODO:
 * - [ ] Animation entrée cards (stagger effect avec framer-motion)
 * - [ ] Export PNG graphique (html2canvas ou Chart.js camembert)
 * - [ ] Tri personnalisé (sortBy: 'count' | 'label' | 'percentage' | callback)
 * - [ ] Mode compact (inline badges + counts sur 1 ligne)
 * - [ ] Filtres multiples (sélection plusieurs items simultanément)
 * - [ ] Accessibilité: role="button" sur cards cliquables
 * - [ ] Accessibilité: aria-label descriptifs sur cards
 * - [ ] Tests unitaires (Jest + RTL pour layout, sorting, trends)
 * - [ ] Storybook stories (exemples flex/grid, trends, empty)
 * - [ ] Performance: TrendIcon component mémoïsé (useCallback)
 * - [ ] Keyboard navigation (focus visible, Enter/Space handler)
 * - [ ] Tooltip delays configurables (openDelay/closeDelay props)
 * 
 * @module components/common/DistributionCards
 * @requires react - useMemo, useCallback
 * @requires @radix-ui/themes - Card, Box, Heading, Flex, Badge, Text, Tooltip, Grid
 * @requires lucide-react - Info, TrendingUp, TrendingDown, Minus
 * @see PriorityDistribution - Usage avec priorités interventions
 * @see InterventionTypeDistribution - Usage avec types interventions
 */

import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Card, Box, Heading, Flex, Badge, Text, Tooltip, Grid } from "@radix-ui/themes";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
/**
 * Affiche une distribution de données sous forme de cards interactives
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la distribution (ex: "Répartition par priorité")
 * @param {Object.<string, number>} props.data - Données à afficher { key: count }
 * @param {Object.<string, {color: string, icon: Function, label: string, dominant: boolean}>} [props.config={}] - Configuration visuelle par clé
 * @param {Object.<string, number>} [props.previousData=null] - Données période précédente pour comparaison
 * @param {Function} [props.onItemClick=null] - Callback au clic sur item (key) => void
 * @param {string} [props.emptyMessage="Aucune donnée disponible"] - Message si data vide
 * @param {React.ReactNode} [props.headerExtras=null] - Éléments header personnalisés (boutons, filtres)
 * @param {Function} [props.renderFooter=null] - Render function footer par card (key, count, percentage, config) => ReactNode
 * @param {'flex'|'grid'} [props.layout='flex'] - Type de layout (flex wrap ou grid responsive)
 * @param {Object|string} [props.columns={ initial: '2', md: '4' }] - Colonnes Grid responsive
 * @returns {JSX.Element} Card conteneur avec Grid ou Flex de cards items
 * 
 * @example
 * // Usage basique avec layout flex
 * <DistributionCards
 *   title="Répartition par priorité"
 *   data={{ urgent: 5, high: 12, medium: 8, low: 3 }}
 *   config={{
 *     urgent: { color: 'red', icon: AlertOctagon, label: 'Urgent' },
 *     high: { color: 'orange', icon: AlertTriangle, label: 'Élevée' },
 *     medium: { color: 'blue', icon: AlertCircle, label: 'Moyenne' },
 *     low: { color: 'gray', icon: Info, label: 'Basse' }
 *   }}
 * />
 * 
 * @example
 * // Usage avancé avec Grid, trends et click handler
 * <DistributionCards
 *   title="Types d'interventions"
 *   data={{ COR: 15, PRE: 8, AME: 3 }}
 *   previousData={{ COR: 12, PRE: 10, AME: 2 }}
 *   config={{
 *     COR: { color: 'red', label: 'Correctives', dominant: true },
 *     PRE: { color: 'blue', label: 'Préventives' },
 *     AME: { color: 'green', label: 'Améliorations' }
 *   }}
 *   onItemClick={(type) => console.log('Filtrer:', type)}
 *   layout="grid"
 *   columns={{ initial: '2', md: '3' }}
 * />
 */export default function DistributionCards({
  title,
  data,
  config = {},
  previousData = null,
  onItemClick = null,
  emptyMessage = "Aucune donnée disponible",
  headerExtras = null,
  renderFooter = null,
  layout = "flex",
  columns = { initial: '2', md: '4' },
}) {
  const total = useMemo(() => Object.values(data || {}).reduce((s, n) => s + n, 0), [data]);
  const sortedEntries = useMemo(() => Object.entries(data || {}).sort((a, b) => b[1] - a[1]), [data]);

  // TrendIcon mémoïsé pour éviter recréation à chaque render
  const TrendIcon = useCallback(({ itemKey, count }) => {
    if (!previousData) return null;
    const previousCount = previousData[itemKey] || 0;
    const diff = count - previousCount;
    if (diff === 0) return <Minus size={12} color="var(--gray-9)" />;
    const Icon = diff > 0 ? TrendingUp : TrendingDown;
    const color = diff > 0 ? "var(--red-9)" : "var(--green-9)";
    return (
      <Tooltip content={`${diff > 0 ? "+" : ""}${diff} vs période précédente`}>
        <Icon size={12} color={color} />
      </Tooltip>
    );
  }, [previousData]);
  TrendIcon.propTypes = { itemKey: PropTypes.string.isRequired, count: PropTypes.number.isRequired };

  if (sortedEntries.length === 0 || total === 0) {
    return (
      <Card>
        <Box p="3">
          <Heading size="4" mb="3">{title}</Heading>
          <Text size="2" color="gray" style={{ fontStyle: "italic" }}>{emptyMessage}</Text>
        </Box>
      </Card>
    );
  }

  const renderCard = (key, count, variant) => {
    const cfg = config[key?.toLowerCase?.() || key] || {};
    const Icon = cfg.icon || Info;
    const label = cfg.label || key;
    const percentageNum = total > 0 ? (count / total) * 100 : 0;
    const percentage = percentageNum.toFixed(1);
    const isClickable = !!onItemClick && count > 0;
    const tooltipContent = `${count} intervention${count > 1 ? "s" : ""} (${percentage}% du total)`;
    const cardStyle = variant === 'grid'
      ? { background: count > 0 ? 'var(--gray-2)' : 'transparent', cursor: isClickable ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s", border: cfg.dominant ? '2px solid var(--accent-9)' : undefined }
      : { flex: "1 1 150px", minWidth: "150px", cursor: isClickable ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s" };

    return (
      <Tooltip key={key} content={tooltipContent}>
        <Card
          style={cardStyle}
          onClick={() => isClickable && onItemClick(key)}
          onMouseEnter={(e) => { if (isClickable) { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; } }}
          onMouseLeave={(e) => { if (isClickable) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = ""; } }}
          role={isClickable ? "button" : undefined}
          aria-label={isClickable ? `Filtrer par ${label}: ${count} intervention${count > 1 ? 's' : ''}` : undefined}
          tabIndex={isClickable ? 0 : undefined}
        >
          <Box p="2">
            <Flex align="center" justify="between" mb="1">
              <Flex align="center" gap="1">
                <Icon size={18} color={`var(--${cfg.color || "gray"}-9)`} />
                <Badge color={cfg.color || "gray"} size="2">{label}</Badge>
                {cfg.dominant && (<Badge color="yellow" size="1">★</Badge>)}
              </Flex>
              <Flex align="center" gap="2">
                <TrendIcon itemKey={key} count={count} />
                <Heading size="4">{count}</Heading>
              </Flex>
            </Flex>
            <Text size="1" color="gray">{percentage}% du total</Text>
            {typeof renderFooter === 'function' && (<Box mt="1">{renderFooter(key, count, percentageNum, cfg)}</Box>)}
          </Box>
        </Card>
      </Tooltip>
    );
  };

  return (
    <Card>
      <Box p="3">
        <Flex justify="between" align="center" mb="3">
          <Heading size="4">{title}</Heading>
          <Flex align="center" gap="2">{headerExtras}<Badge color="gray" size="2">Total: {total}</Badge></Flex>
        </Flex>
        {layout === 'grid' ? (
          <Grid columns={columns} gap="2">{sortedEntries.map(([k, c]) => renderCard(k, c, 'grid'))}</Grid>
        ) : (
          <Flex gap="2" wrap="wrap">{sortedEntries.map(([k, c]) => renderCard(k, c, 'flex'))}</Flex>
        )}
      </Box>
    </Card>
  );
}

DistributionCards.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.objectOf(PropTypes.number).isRequired,
  config: PropTypes.objectOf(PropTypes.shape({ color: PropTypes.string, icon: PropTypes.func, label: PropTypes.string, dominant: PropTypes.bool })),
  previousData: PropTypes.objectOf(PropTypes.number),
  onItemClick: PropTypes.func,
  emptyMessage: PropTypes.string,
  headerExtras: PropTypes.node,
  renderFooter: PropTypes.func,
  layout: PropTypes.oneOf(['flex','grid']),
  columns: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};