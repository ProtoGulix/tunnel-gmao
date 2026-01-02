/**
 * @fileoverview Composants génériques réutilisables pour onglets (Timeline, History, Stats, PDF)
 * 
 * @module components/common/GenericTabComponents
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires ./LoadingState
 * @requires ./EmptyState
 */
import { Box, Flex, Text } from "@radix-ui/themes";
import PropTypes from "prop-types";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";

/** Couleur par défaut de la timeline */
const DEFAULT_STATUS_COLOR = "var(--blue-6)";

/** Titre par défaut du PDF viewer */
const DEFAULT_PDF_TITLE = "Document PDF";

/**
 * Construit le style de la ligne verticale de timeline
 * @param {string} statusColor - Couleur de statut
 * @param {number} dayIdx - Index du jour
 * @param {number} totalDays - Nombre total de jours
 * @returns {Object} Style CSS
 */
const buildTimelineLineStyle = (statusColor, dayIdx, totalDays) => ({
  position: "absolute",
  left: "max(80px, min(120px, 15%))",
  top: "0",
  bottom: dayIdx === totalDays - 1 ? "0" : "-20px",
  width: "2px",
  backgroundColor: statusColor,
  zIndex: 0,
});

/**
 * Construit le style du point de la timeline
 * @param {string} statusColor - Couleur de statut
 * @returns {Object} Style CSS
 */
const buildTimelineDotStyle = (statusColor) => ({
  position: "absolute",
  left: "calc(max(80px, min(120px, 15%)) - 7px)",
  top: "12px",
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  backgroundColor: statusColor,
  border: "3px solid white",
  boxShadow: `0 0 0 2px ${statusColor}`,
  zIndex: 1,
});

/**
 * Section de date de la timeline
 * @param {Object} props
 * @param {string} props.date - Date à afficher
 * @returns {JSX.Element} Box avec date formatée
 */
function TimelineDate({ date }) {
  return (
    <Box
      style={{
        width: "max(80px, min(120px, 15%))",
        flexShrink: 0,
        textAlign: "right",
        paddingTop: "0.5rem",
        paddingRight: "1.5rem",
      }}
    >
      <Text size={{ initial: "1", sm: "2" }} weight="bold" style={{ color: "var(--blue-11)" }}>
        {date}
      </Text>
    </Box>
  );
}

TimelineDate.propTypes = {
  date: PropTypes.string.isRequired,
};

/**
 * Point marqueur de la timeline
 * @param {Object} props
 * @param {string} props.statusColor - Couleur du point
 * @returns {JSX.Element} Box avec point circulaire
 */
function TimelineDot({ statusColor }) {
  return <Box style={buildTimelineDotStyle(statusColor)} className="timeline-dot" />;
}

TimelineDot.propTypes = {
  statusColor: PropTypes.string.isRequired,
};

/**
 * Container des items d'un jour
 * @param {Object} props
 * @param {Array} props.items - Items à rendre
 * @param {Function} props.renderItem - Fonction de rendu d'item
 * @returns {JSX.Element} Box avec items rendus
 */
function TimelineItems({ items, renderItem }) {
  return (
    <Box style={{ flex: 1, minWidth: 0, width: "100%", paddingLeft: "1rem" }}>
      {items.map((item, idx) => (
        <Box key={`${item.type}-${idx}`}>{renderItem(item)}</Box>
      ))}
    </Box>
  );
}

TimelineItems.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
};

/**
 * Séparateur de temps entre jours dans la timeline
 * @component
 * @param {Object} props
 * @param {string} props.statusColor - Couleur de la ligne
 * @param {string} props.timeDiff - Texte de différence temporelle
 * @returns {JSX.Element} Box avec ligne pointillée et texte
 */
export function TimelineSeparator({ statusColor, timeDiff }) {
  return (
    <Box mt="2" mb="2" style={{ position: "relative", minHeight: "40px", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
      <Box style={{ position: "absolute", left: "calc(max(80px, min(120px, 15%)) - 4px)", top: "0", bottom: "0", width: "10px", backgroundColor: "white", zIndex: 0 }} className="timeline-line" />
      <Box
        style={{
          position: "absolute",
          left: "max(80px, min(120px, 15%))",
          top: "0",
          bottom: "0",
          width: "2px",
          backgroundImage: `linear-gradient(to bottom, ${statusColor} 50%, transparent 50%)`,
          backgroundSize: "2px 8px",
          backgroundRepeat: "repeat-y",
          zIndex: 1,
        }}
        className="timeline-line"
      />
      <Flex align="center" style={{ position: "relative", marginLeft: "calc(max(80px, min(120px, 15%)) + 1.5rem)", zIndex: 2 }}>
        <Text size="1" color="gray" style={{ fontStyle: "italic", opacity: 0.7 }}>
          {timeDiff}
        </Text>
      </Flex>
    </Box>
  );
}

TimelineSeparator.propTypes = {
  statusColor: PropTypes.string.isRequired,
  timeDiff: PropTypes.string.isRequired,
};

/**
 * Timeline verticale générique avec dates, lignes et items
 * @component
 * @param {Object} props
 * @param {Array<{date: string, items: Array}>} props.items - Groupes de jours avec items
 * @param {Function} props.renderItem - Fonction pour rendre chaque item
 * @param {Function} [props.getStatusColor] - Fonction pour obtenir couleur de statut
 * @param {Function} [props.getTimeDiff] - Fonction pour calculer différence temporelle
 * @param {*} [props.statusLog] - Log de statuts pour coloration
 * @returns {JSX.Element} Box avec timeline complète
 */
export function Timeline({ items, renderItem, getStatusColor, getTimeDiff, statusLog }) {
  return (
    <Box style={{ position: "relative" }}>
      {items.map((dayGroup, dayIdx) => {
        const timeDiff = dayIdx === 0 ? null : getTimeDiff?.(items[dayIdx - 1].date, dayGroup.date);
        const statusColor = getStatusColor?.(dayGroup, statusLog) || DEFAULT_STATUS_COLOR;

        return (
          <Box key={dayGroup.date} style={{ position: "relative" }}>
            <Box style={buildTimelineLineStyle(statusColor, dayIdx, items.length)} className="timeline-line" />
            {timeDiff && <TimelineSeparator statusColor={statusColor} timeDiff={timeDiff} />}
            <Box mb="5" style={{ position: "relative" }}>
              <Flex gap="3" align="start" style={{ position: "relative" }} direction={{ initial: "column", sm: "row" }}>
                <TimelineDate date={dayGroup.date} />
                <TimelineDot statusColor={statusColor} />
                <TimelineItems items={dayGroup.items} renderItem={renderItem} />
              </Flex>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

Timeline.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string.isRequired, items: PropTypes.array.isRequired })).isRequired,
  renderItem: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func,
  getTimeDiff: PropTypes.func,
  statusLog: PropTypes.any,
};

/**
 * Historique générique avec chargement et état vide
 * @component
 * @param {Object} props
 * @param {Array} props.items - Items d'historique
 * @param {Function} props.renderItem - Fonction de rendu d'item
 * @param {boolean} [props.loading=false] - État de chargement
 * @returns {JSX.Element} Box avec historique ou états de chargement/vide
 */
export function History({ items, renderItem, loading = false }) {
  if (loading) {
    return <LoadingState message="Chargement de l'historique..." fullscreen={false} size="2" />;
  }

  if (items.length === 0) {
    return (
      <Box mt="4">
        <EmptyState icon={null} title="Aucun historique" description="Pas encore d'événements." />
      </Box>
    );
  }

  return (
    <Box mt="4">
      {items.map((item, idx) => (
        <Box key={idx}>{renderItem(item)}</Box>
      ))}
    </Box>
  );
}

History.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

/**
 * Card de statistique individuelle
 * @param {Object} props
 * @param {Object} props.stat - Données de la stat
 * @param {number} props.idx - Index pour key
 * @returns {JSX.Element} Box avec stat formatée
 */
function StatCard({ stat, idx }) {
  const IconComponent = stat.icon;

  return (
    <Box
      key={idx}
      style={{
        backgroundColor: stat.bgColor || "var(--gray-2)",
        border: stat.border || "1px solid var(--gray-6)",
        borderRadius: "6px",
        padding: "1rem",
      }}
    >
      <Flex align="center" gap="4">
        {IconComponent && <Box>{typeof IconComponent === "function" ? <IconComponent size={24} /> : IconComponent}</Box>}
        <Box>
          {stat.label && (
            <Text size="1" color="gray">
              {stat.label}
            </Text>
          )}
          <Text size={stat.size || "6"} weight="bold" style={{ color: stat.textColor }}>
            {stat.value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

StatCard.propTypes = {
  stat: PropTypes.shape({
    icon: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    size: PropTypes.string,
    textColor: PropTypes.string,
    bgColor: PropTypes.string,
    border: PropTypes.string,
  }).isRequired,
  idx: PropTypes.number.isRequired,
};

/**
 * Grille de statistiques avec icônes et valeurs
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.stats - Statistiques à afficher
 * @returns {JSX.Element} Flex avec cards de stats
 */
export function StatsGrid({ stats }) {
  return (
    <Flex direction="column" gap="4">
      {stats.map((stat, idx) => (
        <StatCard key={idx} stat={stat} idx={idx} />
      ))}
    </Flex>
  );
}

StatsGrid.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      size: PropTypes.string,
      textColor: PropTypes.string,
      bgColor: PropTypes.string,
      border: PropTypes.string,
    }),
  ).isRequired,
};

/**
 * Viewer PDF avec iframe et états de chargement
 * @component
 * @param {Object} props
 * @param {string} [props.url] - URL du PDF à afficher
 * @param {boolean} [props.loading=false] - État de chargement
 * @param {string} [props.title="Document PDF"] - Titre de l'iframe
 * @returns {JSX.Element} Box avec iframe PDF ou états de chargement/vide
 */
export function PdfViewer({ url, loading = false, title = DEFAULT_PDF_TITLE }) {
  const containerStyle = {
    border: "1px solid var(--gray-6)",
    borderRadius: "6px",
    overflow: "hidden",
    height: "80vh",
    backgroundColor: "var(--gray-1)",
  };

  if (loading && !url) {
    return (
      <Box style={containerStyle}>
        <LoadingState message="Chargement du document..." fullscreen={false} size="2" />
      </Box>
    );
  }

  if (!url) {
    return (
      <Box style={containerStyle}>
        <Box p="5">
          <EmptyState icon={null} title="Document non chargé" description="Cliquez sur le bouton pour charger le document." />
        </Box>
      </Box>
    );
  }

  return (
    <Box style={containerStyle}>
      <iframe src={url} style={{ width: "100%", height: "100%", border: "none" }} title={title} />
    </Box>
  );
}

PdfViewer.propTypes = {
  url: PropTypes.string,
  loading: PropTypes.bool,
  title: PropTypes.string,
};
