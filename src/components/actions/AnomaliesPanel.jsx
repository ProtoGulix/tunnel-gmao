import { Box, Flex, Text, Badge, Tabs } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { Repeat2, Clock, Timer, Search, RotateCw, Zap, CircleCheck } from "lucide-react";
import { AnalysisHeader, AdviceCallout } from "@/components/common/AnalysisComponents";
import EmptyState from "@/components/common/EmptyState";
import AnomalyTypeA from "./anomalies/AnomalyTypeA";
import AnomalyTypeB from "./anomalies/AnomalyTypeB";
import AnomalyTypeC from "./anomalies/AnomalyTypeC";
import AnomalyTypeD from "./anomalies/AnomalyTypeD";
import AnomalyTypeE from "./anomalies/AnomalyTypeE";
import AnomalyTypeF from "./anomalies/AnomalyTypeF";

/**
 * Configuration des onglets d'anomalies
 */
const ANOMALY_TABS = [
  { 
    value: "repetitive", 
    label: "Répétitives", 
    key: "tooRepetitive", 
    color: "red",
    icon: Repeat2,
    typeLabel: "A",
    description: "Même catégorie sur même machine plus de 3 fois par mois. Envisager une maintenance préventive.",
    Component: AnomalyTypeA
  },
  { 
    value: "fragmented", 
    label: "Fragmentées", 
    key: "tooFragmented", 
    color: "orange",
    icon: Clock,
    typeLabel: "B",
    description: "Actions de moins d'1h répétées plus de 5 fois. Travail mal organisé ou tâches à regrouper.",
    Component: AnomalyTypeB
  },
  { 
    value: "long", 
    label: "Trop longues", 
    key: "tooLongForCategory", 
    color: "orange",
    icon: Timer,
    typeLabel: "C",
    description: "Actions de plus de 4h sur catégories normalement simples. Vérifier la classification ou le découpage.",
    Component: AnomalyTypeC
  },
  { 
    value: "classification", 
    label: "Classification", 
    key: "badClassification", 
    color: "purple",
    icon: Search,
    typeLabel: "D",
    description: "Description contient des mots-clés suspects pour la catégorie. Revoir la classification.",
    Component: AnomalyTypeD
  },
  { 
    value: "backtoback", 
    label: "Back-to-Back", 
    key: "backToBack", 
    color: "blue",
    icon: RotateCw,
    typeLabel: "E",
    description: "Même technicien revient sur même intervention sous 24h. Travail mal découpé ou problème non résolu.",
    Component: AnomalyTypeE
  },
  { 
    value: "lowvalue", 
    label: "Faible valeur", 
    key: "lowValueHighLoad", 
    color: "red",
    icon: Zap,
    typeLabel: "F",
    description: "Catégories à faible valeur ajoutée avec plus de 30h cumulées. Problème structurel à adresser.",
    Component: AnomalyTypeF
  }
];

/**
 * Panneau de détection d'anomalies
 * Affiche les 6 types d'anomalies détectées
 */
export default function AnomaliesPanel({ anomalies }) {
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

  // ==================== COMPUTED VALUES ====================
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
          // eslint-disable-next-line no-unused-vars
          const TabIcon = tab.icon; // Reserved for potential icon rendering in future versions

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
                <tab.Component key={index} item={item} index={index} />
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