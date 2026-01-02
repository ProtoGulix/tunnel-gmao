/**
 * @fileoverview Composant réutilisable pour afficher des distributions de données
 * avec visualisation flexible, tendances et interactivité.
 * 
 * @module components/common/DistributionCards
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 * 
 * @example
 * // Distribution de priorités avec layout flex
 * <DistributionCards
 *   title="Répartition par priorité"
 *   data={{ urgent: 5, high: 12, medium: 8, low: 3 }}
 *   config={{
 *     urgent: { color: 'red', icon: AlertOctagon, label: 'Urgent' },
 *     high: { color: 'orange', icon: AlertTriangle, label: 'Élevée' }
 *   }}
 * />
 * 
 * @example
 * // Distribution avec grid, trends et click handler
 * <DistributionCards
 *   title="Types d'interventions"
 *   data={{ COR: 15, PRE: 8, AME: 3 }}
 *   previousData={{ COR: 12, PRE: 10, AME: 2 }}
 *   onItemClick={(type) => filterByType(type)}
 *   layout="grid"
 *   columns={{ initial: '2', md: '3' }}
 * />
 */
import { useMemo } from "react";
import PropTypes from "prop-types";
import { Card, Box, Heading, Flex, Badge, Text, Tooltip, Grid } from "@radix-ui/themes";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";

/** Configuration par défaut des colonnes Grid responsive */
const DEFAULT_COLUMNS = { initial: "2", md: "4" };

/**
 * Calcule le total des valeurs d'un dataset
 * @param {Object.<string, number>} dataset - Objet avec valeurs numériques
 * @returns {number} Somme de toutes les valeurs
 */
const computeTotal = (dataset) => Object.values(dataset ?? {}).reduce((sum, value) => sum + value, 0);

/**
 * Trie les entrées d'un dataset par valeur décroissante
 * @param {Object.<string, number>} dataset - Objet à trier
 * @returns {Array<[string, number]>} Tableau d'entrées [clé, valeur] triées
 */
const sortEntries = (dataset) => Object.entries(dataset ?? {}).sort((a, b) => b[1] - a[1]);

/**
 * Vérifie si le dataset est vide ou a un total nul
 * @param {Array} entries - Entrées du dataset
 * @param {number} total - Total calculé
 * @returns {boolean} True si vide
 */
const isEmpty = (entries, total) => entries.length === 0 || total === 0;

/**
 * Normalise une clé en lowercase si c'est une string
 * @param {string|*} key - Clé à normaliser
 * @returns {string|*} Clé normalisée
 */
const normalizeKey = (key) => (typeof key === "string" ? key.toLowerCase() : key);

/**
 * Extrait et normalise les métadonnées de configuration pour un item
 * @param {Object} config - Configuration globale des items
 * @param {string} itemKey - Clé de l'item
 * @returns {Object} Métadonnées normalisées (Icon, label, color, dominant, raw)
 */
const getCardMeta = (config, itemKey) => {
  const cfg = config[normalizeKey(itemKey)] || {};
  return {
    Icon: cfg.icon || Info,
    label: cfg.label || itemKey,
    color: cfg.color || "gray",
    dominant: Boolean(cfg.dominant),
    raw: cfg,
  };
};

/**
 * Construit le texte du tooltip avec count et pourcentage
 * @param {number} count - Nombre d'interventions
 * @param {string} percentage - Pourcentage formaté
 * @returns {string} Texte du tooltip
 */
const buildTooltip = (count, percentage) => `${count} intervention${count > 1 ? "s" : ""} (${percentage}% du total)`;

/**
 * Construit le style CSS d'une card selon le layout et l'état
 * @param {string} layout - Type de layout ('grid' ou 'flex')
 * @param {number} count - Nombre d'items
 * @param {boolean} isClickable - Si la card est cliquable
 * @param {boolean} dominant - Si la card est dominante
 * @returns {Object} Objet de style CSS
 */
const buildCardStyle = (layout, count, isClickable, dominant) => {
  const base = {
    cursor: isClickable ? "pointer" : "default",
    border: dominant ? "2px solid var(--accent-9)" : undefined,
  };

  if (layout === "grid") {
    return { ...base, background: count > 0 ? "var(--gray-2)" : "transparent" };
  }

  return { ...base, flex: "1 1 150px", minWidth: "150px" };
};

/**
 * Affiche l'indicateur de tendance (hausse/baisse) par rapport à la période précédente
 * @component
 * @param {Object} props
 * @param {string} props.itemKey - Clé de l'item
 * @param {number} props.count - Valeur actuelle
 * @param {Object.<string, number>} [props.previousData] - Données période précédente
 * @returns {JSX.Element|null} Icône de tendance avec tooltip ou null
 */
function TrendIndicator({ itemKey, count, previousData }) {
  if (!previousData) return null;

  const previousCount = previousData[itemKey] || 0;
  const diff = count - previousCount;

  if (diff === 0) {
    return <Minus size={12} color="var(--gray-9)" />;
  }

  const isIncrease = diff > 0;
  const Icon = isIncrease ? TrendingUp : TrendingDown;
  const color = isIncrease ? "var(--red-9)" : "var(--green-9)";
  const label = `${isIncrease ? "+" : ""}${diff} vs période précédente`;

  return (
    <Tooltip content={label}>
      <Icon size={12} color={color} />
    </Tooltip>
  );
}

TrendIndicator.propTypes = { itemKey: PropTypes.string.isRequired, count: PropTypes.number.isRequired, previousData: PropTypes.objectOf(PropTypes.number) };

/**
 * Affiche l'état vide quand aucune donnée n'est disponible
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre de la distribution
 * @param {string} props.message - Message à afficher
 * @returns {JSX.Element} Card avec message d'état vide
 */
function EmptyState({ title, message }) {
  return (
    <Card>
      <Box p="3">
        <Heading size="4" mb="3">{title}</Heading>
        <Text size="2" color="gray" style={{ fontStyle: "italic" }}>{message}</Text>
      </Box>
    </Card>
  );
}

EmptyState.propTypes = { title: PropTypes.string.isRequired, message: PropTypes.string.isRequired };

/**
 * Affiche le header de la distribution avec titre, total et éléments extras
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre de la distribution
 * @param {number} props.total - Total des valeurs
 * @param {React.ReactNode} [props.extras] - Éléments additionnels (boutons, filtres)
 * @returns {JSX.Element} Flex row avec titre et badge total
 */
function DistributionHeader({ title, total, extras }) {
  return (
    <Flex justify="between" align="center" mb="3">
      <Heading size="4">{title}</Heading>
      <Flex align="center" gap="2">
        {extras}
        <Badge color="gray" size="2">Total: {total}</Badge>
      </Flex>
    </Flex>
  );
}

DistributionHeader.propTypes = { title: PropTypes.string.isRequired, total: PropTypes.number.isRequired, extras: PropTypes.node };

/**
 * Card individuelle affichant un item de la distribution
 * @component
 * @param {Object} props
 * @param {string} props.itemKey - Clé unique de l'item
 * @param {number} props.count - Nombre d'occurrences
 * @param {number} props.total - Total global pour calculer le pourcentage
 * @param {Object} props.config - Configuration visuelle (colors, icons, labels)
 * @param {Function} [props.onItemClick] - Callback au clic sur la card
 * @param {Function} [props.renderFooter] - Fonction de rendu du footer custom
 * @param {string} props.layout - Type de layout ('flex' ou 'grid')
 * @param {Object.<string, number>} [props.previousData] - Données période précédente
 * @returns {JSX.Element} Card avec tooltip, badges, trend indicator et count
 */
function DistributionCard({ itemKey, count, total, config, onItemClick, renderFooter, layout, previousData }) {
  const meta = getCardMeta(config, itemKey);
  const percentageNum = total > 0 ? (count / total) * 100 : 0;
  const percentage = percentageNum.toFixed(1);
  const isClickable = Boolean(onItemClick) && count > 0;

  return (
    <Tooltip content={buildTooltip(count, percentage)} key={itemKey}>
      <Card
        style={buildCardStyle(layout, count, isClickable, meta.dominant)}
        onClick={isClickable ? () => onItemClick(itemKey) : undefined}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
      >
        <Box p="2">
          <Flex align="center" justify="between" mb="1">
            <Flex align="center" gap="1">
              <meta.Icon size={18} color={`var(--${meta.color}-9)`} />
              <Badge color={meta.color} size="2">{meta.label}</Badge>
              {meta.dominant && <Badge color="yellow" size="1">★</Badge>}
            </Flex>
            <Flex align="center" gap="2">
              <TrendIndicator itemKey={itemKey} count={count} previousData={previousData} />
              <Heading size="4">{count}</Heading>
            </Flex>
          </Flex>
          <Text size="1" color="gray">{percentage}% du total</Text>
          {typeof renderFooter === "function" && (
            <Box mt="1">{renderFooter(itemKey, count, percentageNum, meta.raw)}</Box>
          )}
        </Box>
      </Card>
    </Tooltip>
  );
}

DistributionCard.propTypes = { itemKey: PropTypes.string.isRequired, count: PropTypes.number.isRequired, total: PropTypes.number.isRequired, config: PropTypes.object.isRequired, onItemClick: PropTypes.func, renderFooter: PropTypes.func, layout: PropTypes.oneOf(["flex", "grid"]).isRequired, previousData: PropTypes.objectOf(PropTypes.number) };

/**
 * Container de layout pour les cards (Grid ou Flex)
 * @component
 * @param {Object} props
 * @param {Array<[string, number]>} props.entries - Tableau d'entrées [clé, count] triées
 * @param {number} props.total - Total global
 * @param {Object} props.config - Configuration visuelle
 * @param {string} props.layout - Type de layout ('flex' ou 'grid')
 * @param {Object|string} props.columns - Configuration colonnes Grid responsive
 * @param {Function} [props.onItemClick] - Handler de clic
 * @param {Function} [props.renderFooter] - Render function footer
 * @param {Object.<string, number>} [props.previousData] - Données période précédente
 * @returns {JSX.Element} Grid ou Flex contenant les DistributionCard
 */
function CardsLayout({ entries, total, config, layout, columns, onItemClick, renderFooter, previousData }) {
  const isGrid = layout === "grid";
  const cards = entries.map(([itemKey, count]) => (
    <DistributionCard
      key={itemKey}
      itemKey={itemKey}
      count={count}
      total={total}
      config={config}
      onItemClick={onItemClick}
      renderFooter={renderFooter}
      layout={layout}
      previousData={previousData}
    />
  ));

  return isGrid
    ? <Grid columns={columns} gap="2">{cards}</Grid>
    : <Flex gap="2" wrap="wrap">{cards}</Flex>;
}

CardsLayout.propTypes = { entries: PropTypes.arrayOf(PropTypes.array).isRequired, total: PropTypes.number.isRequired, config: PropTypes.object.isRequired, layout: PropTypes.oneOf(["flex", "grid"]).isRequired, columns: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired, onItemClick: PropTypes.func, renderFooter: PropTypes.func, previousData: PropTypes.objectOf(PropTypes.number) };

/**
 * Composant principal affichant une distribution de données sous forme de cards interactives
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre de la distribution (ex: "Répartition par priorité")
 * @param {Object.<string, number>} props.data - Données à afficher { key: count }
 * @param {Object.<string, Object>} [props.config={}] - Configuration visuelle par clé
 * @param {string} [props.config[].color] - Couleur Radix (red, blue, gray, etc.)
 * @param {Function} [props.config[].icon] - Composant icône Lucide
 * @param {string} [props.config[].label] - Label affiché
 * @param {boolean} [props.config[].dominant] - Marque l'item comme dominant (★)
 * @param {Object.<string, number>} [props.previousData=null] - Données période précédente pour comparaison
 * @param {Function} [props.onItemClick=null] - Callback au clic (key) => void
 * @param {string} [props.emptyMessage="Aucune donnée disponible"] - Message si data vide
 * @param {React.ReactNode} [props.headerExtras=null] - Éléments header personnalisés
 * @param {Function} [props.renderFooter=null] - Render function footer par card
 * @param {('flex'|'grid')} [props.layout='flex'] - Type de layout
 * @param {Object|string} [props.columns={ initial: '2', md: '4' }] - Colonnes Grid responsive
 * 
 * @returns {JSX.Element} Card conteneur avec Grid ou Flex de cards items
 * 
 * @example
 * // Usage basique
 * <DistributionCards
 *   title="Priorités"
 *   data={{ urgent: 5, high: 12, medium: 8 }}
 *   config={{ urgent: { color: 'red', label: 'Urgent' } }}
 * />
 * 
 * @example
 * // Avec trends et interactivité
 * <DistributionCards
 *   title="Types"
 *   data={{ COR: 15, PRE: 8 }}
 *   previousData={{ COR: 12, PRE: 10 }}
 *   onItemClick={(key) => console.log(key)}
 *   layout="grid"
 * />
 */
export default function DistributionCards({ title, data, config = {}, previousData = null, onItemClick = null, emptyMessage = "Aucune donnée disponible", headerExtras = null, renderFooter = null, layout = "flex", columns = DEFAULT_COLUMNS }) {
  const total = useMemo(() => computeTotal(data), [data]);
  const sortedEntries = useMemo(() => sortEntries(data), [data]);

  if (isEmpty(sortedEntries, total)) {
    return <EmptyState title={title} message={emptyMessage} />;
  }

  return (
    <Card>
      <Box p="3">
        <DistributionHeader title={title} total={total} extras={headerExtras} />
        <CardsLayout entries={sortedEntries} total={total} config={config} layout={layout} columns={columns} onItemClick={onItemClick} renderFooter={renderFooter} previousData={previousData} />
      </Box>
    </Card>
  );
}

DistributionCards.propTypes = { title: PropTypes.string.isRequired, data: PropTypes.objectOf(PropTypes.number).isRequired, config: PropTypes.objectOf(PropTypes.shape({ color: PropTypes.string, icon: PropTypes.func, label: PropTypes.string, dominant: PropTypes.bool })), previousData: PropTypes.objectOf(PropTypes.number), onItemClick: PropTypes.func, emptyMessage: PropTypes.string, headerExtras: PropTypes.node, renderFooter: PropTypes.func, layout: PropTypes.oneOf(["flex", "grid"]), columns: PropTypes.oneOfType([PropTypes.object, PropTypes.string]) };
