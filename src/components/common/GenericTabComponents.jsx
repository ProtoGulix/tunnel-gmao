import { Box, Flex, Text } from "@radix-ui/themes";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";

/**
 * Composant Timeline générique et réutilisable
 * Utilisable pour : interventions, stock manager, etc.
 */
export const Timeline = ({ 
  items, 
  renderItem, 
  getStatusColor, 
  getTimeDiff, 
  statusLog 
}) => (
  <Box style={{ position: 'relative' }}>
    {items.map((dayGroup, dayIdx) => {
      const timeDiff = dayIdx === 0 ? null : getTimeDiff?.(items[dayIdx - 1].date, dayGroup.date);
      const statusColor = getStatusColor?.(dayGroup, statusLog) || 'var(--blue-6)';

      return (
        <Box key={dayGroup.date} style={{ position: 'relative' }}>
          {/* Ligne verticale */}
          <Box 
            style={{
              position: 'absolute',
              left: 'max(80px, min(120px, 15%))',
              top: '0',
              bottom: dayIdx === items.length - 1 ? '0' : '-20px',
              width: '2px',
              backgroundColor: statusColor,
              zIndex: 0
            }}
            className="timeline-line"
          />

          {/* Séparateur temps */}
          {timeDiff && (
            <TimelineSeparator statusColor={statusColor} timeDiff={timeDiff} />
          )}

          {/* Contenu du jour */}
          <Box mb="5" style={{ position: 'relative' }}>
            <Flex 
              gap="3" 
              align="start" 
              style={{ position: 'relative' }}
              direction={{ initial: 'column', sm: 'row' }}
            >
              {/* Date */}
              <Box 
                style={{ 
                  width: 'max(80px, min(120px, 15%))',
                  flexShrink: 0,
                  textAlign: 'right',
                  paddingTop: '0.5rem',
                  paddingRight: '1.5rem'
                }}
              >
                <Text 
                  size={{ initial: '1', sm: '2' }} 
                  weight="bold" 
                  style={{ color: 'var(--blue-11)' }}
                >
                  {dayGroup.date}
                </Text>
              </Box>

              {/* Dot */}
              <Box 
                style={{
                  position: 'absolute',
                  left: 'calc(max(80px, min(120px, 15%)) - 7px)',
                  top: '12px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  border: '3px solid white',
                  boxShadow: `0 0 0 2px ${statusColor}`,
                  zIndex: 1
                }}
                className="timeline-dot"
              />

              {/* Items */}
              <Box style={{ flex: 1, minWidth: 0, width: '100%', paddingLeft: '1rem' }}>
                {dayGroup.items.map((item, idx) => (
                  <Box key={`${item.type}-${idx}`}>
                    {renderItem(item)}
                  </Box>
                ))}
              </Box>
            </Flex>
          </Box>
        </Box>
      );
    })}
  </Box>
);

/**
 * Séparateur de temps générique
 */
export const TimelineSeparator = ({ statusColor, timeDiff }) => (
  <Box 
    mt="2"
    mb="2"
    style={{ 
      position: 'relative',
      minHeight: '40px',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem'
    }}
  >
    <Box 
      style={{
        position: 'absolute',
        left: 'calc(max(80px, min(120px, 15%)) - 4px)',
        top: '0',
        bottom: '0',
        width: '10px',
        backgroundColor: 'white',
        zIndex: 0
      }}
      className="timeline-line"
    />
    
    <Box 
      style={{
        position: 'absolute',
        left: 'max(80px, min(120px, 15%))',
        top: '0',
        bottom: '0',
        width: '2px',
        backgroundImage: `linear-gradient(to bottom, ${statusColor} 50%, transparent 50%)`,
        backgroundSize: '2px 8px',
        backgroundRepeat: 'repeat-y',
        zIndex: 1
      }}
      className="timeline-line"
    />
    
    <Flex 
      align="center"
      style={{ 
        position: 'relative',
        marginLeft: 'calc(max(80px, min(120px, 15%)) + 1.5rem)',
        zIndex: 2
      }}
    >
      <Text size="1" color="gray" style={{ fontStyle: 'italic', opacity: 0.7 }}>
        {timeDiff}
      </Text>
    </Flex>
  </Box>
);

/**
 * Composant History générique et réutilisable
 * Utilisable pour : interventions, stock manager, etc.
 */
export const History = ({ 
  items, 
  renderItem, 
  loading
}) => {
  return (
    <>
      {loading ? (
        <LoadingState message="Chargement de l'historique..." fullscreen={false} size="2" />
      ) : items.length > 0 ? (
        <Box mt="4">
          {items.map((item, idx) => (
            <Box key={idx}>
              {renderItem(item)}
            </Box>
          ))}
        </Box>
      ) : (
        <Box mt="4">
          <EmptyState
            icon={null}
            title="Aucun historique"
            description="Pas encore d'événements."
          />
        </Box>
      )}
    </>
  );
};

/**
 * Composant Stats générique et réutilisable
 * Affiche des cartes de statistiques
 */
export const StatsGrid = ({ stats }) => {
  return (
    <Flex direction="column" gap="4">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <Box
            key={idx}
            style={{
              backgroundColor: stat.bgColor || 'var(--gray-2)',
              border: stat.border || '1px solid var(--gray-6)',
              borderRadius: '6px',
              padding: '1rem'
            }}
          >
            <Flex align="center" gap="4">
              {IconComponent && (
                <Box>
                  {typeof IconComponent === 'function' ? <IconComponent size={24} /> : IconComponent}
                </Box>
              )}
              <Box>
                {stat.label && <Text size="1" color="gray">{stat.label}</Text>}
                <Text size={stat.size || "6"} weight="bold" style={{ color: stat.textColor }}>
                  {stat.value}
                </Text>
              </Box>
            </Flex>
          </Box>
        );
      })}
    </Flex>
  );
};

/**
 * Composant PDF Viewer générique et réutilisable
 */
export const PdfViewer = ({ 
  url, 
  loading, 
  title = "Document PDF" 
}) => {
  return (
    <Box style={{ 
      border: '1px solid var(--gray-6)', 
      borderRadius: '6px', 
      overflow: 'hidden', 
      height: '80vh', 
      backgroundColor: 'var(--gray-1)' 
    }}>
      {loading && !url ? (
        <LoadingState message="Chargement du document..." fullscreen={false} size="2" />
      ) : url ? (
        <iframe 
          src={url} 
          style={{ width: '100%', height: '100%', border: 'none' }} 
          title={title}
        />
      ) : (
        <Box p="5">
          <EmptyState
            icon={null}
            title="Document non chargé"
            description="Cliquez sur le bouton pour charger le document."
          />
        </Box>
      )}
    </Box>
  );
};
