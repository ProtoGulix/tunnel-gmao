// ===== IMPORTS =====
// 1. React Core
import PropTypes from "prop-types";

// 2. UI Libraries (Radix)
import { Box, Flex, Text, Badge, Tabs } from "@radix-ui/themes";

// 3. Icons
import { Zap, CircleCheck } from "lucide-react";

// 4. Custom Components
import { AnalysisHeader, AdviceCallout } from "@/components/common/AnalysisComponents";
import EmptyState from "@/components/common/EmptyState";
import AnomalyTypeA from "./anomalies/AnomalyTypeA";
import AnomalyTypeB from "./anomalies/AnomalyTypeB";
import AnomalyTypeC from "./anomalies/AnomalyTypeC";
import AnomalyTypeD from "./anomalies/AnomalyTypeD";
import AnomalyTypeE from "./anomalies/AnomalyTypeE";
import AnomalyTypeF from "./anomalies/AnomalyTypeF";

// 5. Config
import { ANOMALY_TABS } from "@/config/actionPageConfig";

// ===== COMPONENT =====
/**
 * Panneau de détection et affichage des anomalies
 * 
 * Affiche les 6 types d'anomalies détectées dans les actions d'interventions.
 * Chaque type est présenté dans un onglet dédié avec sa description et ses occurrences.
 * 
 * Types d'anomalies:
 * - Type A (Répétitives): Même catégorie répétée sur même machine
 * - Type B (Fragmentées): Actions courtes répétées trop souvent
 * - Type C (Trop longues): Actions simples qui prennent trop de temps
 * - Type D (Classification): Mots-clés suspects dans la description
 * - Type E (Back-to-Back): Technicien revient rapidement sur même intervention
 * - Type F (Faible valeur): Catégories à faible valeur avec charge élevée
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.anomalies - Objet contenant les anomalies par type (camelCase keys)
 * @param {Array} props.anomalies.tooRepetitive - Anomalies répétitives
 * @param {Array} props.anomalies.tooFragmented - Anomalies fragmentées
 * @param {Array} props.anomalies.tooLongForCategory - Anomalies trop longues
 * @param {Array} props.anomalies.badClassification - Anomalies de classification
 * @param {Array} props.anomalies.backToBack - Anomalies back-to-back
 * @param {Array} props.anomalies.lowValueHighLoad - Anomalies faible valeur/charge élevée
 * 
 * @returns {JSX.Element} Panneau d'anomalies avec onglets
 * 
 * @example
 * <AnomaliesPanel anomalies={detectedAnomalies} />
 */
export default function AnomaliesPanel({ anomalies }) {
  // ----- Render Helpers -----
  /**
   * Composants d'anomalies par type
   * Mapping explicite pour éviter d'inclure Component dans ANOMALY_TABS (config pur)
   */
  const ANOMALY_COMPONENTS = {
    tooRepetitive: AnomalyTypeA,
    tooFragmented: AnomalyTypeB,
    tooLongForCategory: AnomalyTypeC,
    badClassification: AnomalyTypeD,
    backToBack: AnomalyTypeE,
    lowValueHighLoad: AnomalyTypeF,
  };
  
  // ==================== RENDER: EMPTY STATE ====================
  if (!anomalies) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="Aucune anomalie détectée"
        description="Toutes les actions sont conformes aux bonnes pratiques."
      />
    );
  }

  // ----- Computed Values -----
  const totalAnomalies = Object.values(anomalies).reduce((sum, arr) => {
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);
  
  // ==================== RENDER: EMPTY STATE (NO ANOMALIES) ====================
  if (totalAnomalies === 0) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="Aucune anomalie détectée"
        description="Toutes les actions sont conformes aux bonnes pratiques."
      />
    );
  }

  // ==================== RENDER: MAIN VIEW ====================
  return (
    <Box p="0">
      {/* En-tête */}
      <AnalysisHeader
        icon={Zap}
        title="Anomalies détectées"
        description={`${totalAnomalies} anomalie${totalAnomalies > 1 ? 's' : ''} détectée${totalAnomalies > 1 ? 's' : ''}. Analyse détaillée par type d'anomalie pour améliorer la qualité des données.`}
      />

      {/* Onglets par type d'anomalie */}
      <Tabs.Root defaultValue="repetitive">
        <Tabs.List>
          {ANOMALY_TABS.map(tab => {
            const tabAnomalies = anomalies[tab.key] || [];
            const anomalyCount = Array.isArray(tabAnomalies) ? tabAnomalies.length : 0;
            
            return (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                <Flex align="center" gap="1">
                  <Text>{tab.label}</Text>
                  {anomalyCount > 0 && (
                    <Badge color={tab.color} size="1">
                      {anomalyCount}
                    </Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>

        {/* Contenu des onglets */}
        {ANOMALY_TABS.map(tab => {
          const tabAnomalies = anomalies[tab.key] || [];
          const anomalyCount = Array.isArray(tabAnomalies) ? tabAnomalies.length : 0;
          const TabComponent = ANOMALY_COMPONENTS[tab.key];

          return (
            <Tabs.Content key={tab.value} value={tab.value}>
              <Box pt="3">
                <AdviceCallout
                  type="warnings"
                  title={`Type ${tab.typeLabel} : ${tab.label}`}
                  items={[tab.description]}
                  customConfig={{ color: tab.color, icon: '⚠️' }}
                />
                
                {anomalyCount === 0 ? (
                  <Text color="gray" size="2">Aucune anomalie de ce type</Text>
                ) : (
                  <Flex direction="column" gap="3" mt="3">
                    {tabAnomalies.map((item, index) => (
                      <TabComponent key={index} item={item} index={index} />
                    ))}
                  </Flex>
                )}
              </Box>
            </Tabs.Content>
          );
        })}
      </Tabs.Root>

      {/* Conseils généraux sur les anomalies */}
      <AdviceCallout
        type="recommendations"
        title="Recommandations pour réduire les anomalies"
        items={[
          "Vérifier régulièrement les actions sans intervention associée",
          "Harmoniser les catégories d'actions redondantes",
          "Mettre à jour les temps estimés basé sur l'historique réel",
          "Former les utilisateurs aux bonnes pratiques de saisie"
        ]}
      />
    </Box>
  );
}

// ============================================================================
// PROP TYPES
// ============================================================================

AnomaliesPanel.propTypes = {
  anomalies: PropTypes.shape({
    tooRepetitive: PropTypes.arrayOf(PropTypes.object),
    tooFragmented: PropTypes.arrayOf(PropTypes.object),
    tooLongForCategory: PropTypes.arrayOf(PropTypes.object),
    badClassification: PropTypes.arrayOf(PropTypes.object),
    backToBack: PropTypes.arrayOf(PropTypes.object),
    lowValueHighLoad: PropTypes.arrayOf(PropTypes.object),
  }),
};

AnomaliesPanel.displayName = 'AnomaliesPanel';