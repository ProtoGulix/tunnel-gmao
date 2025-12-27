import { isValidElement } from "react";
import PropTypes from "prop-types";
import { Card, Box, Flex, Heading, Text, Callout, Badge, Tooltip } from "@radix-ui/themes";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔬 AnalysisComponents.jsx - Composants réutilisables pour sections d'analyse
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Collection de composants utilitaires pour affichage de données analytiques.
 * Utilisé principalement dans les pages d'analyse d'actions et de charge.
 * 
 * ✅ Implémenté :
 * - AnalysisHeader : En-tête de section avec icône et description
 * - AdviceCallout : Callout avec liste (indicateurs, recommandations, warnings)
 * - InfoSection : Affichage de paires clé/valeur formatées
 * - PropTypes complets pour toutes les fonctions
 * - JSDoc exhaustif avec exemples
 * - Support icônes Lucide React ou emoji
 * - Config personnalisable pour AdviceCallout (color, icon)
 * 
 * ⚠️ IMPORTANT : EmptyState doublon supprimé
 * - L'export EmptyState a été retiré de ce fichier
 * - Utiliser désormais : import EmptyState from "../common/EmptyState"
 * - EmptyState.jsx supporte les actions (array de boutons React)
 * - Tous les usages ont été migrés vers le composant standalone
 * 
 * 📋 TODO : Refactoring nécessaire
 * - [✅] Supprimer EmptyState de ce fichier (doublon avec EmptyState.jsx)
 * - [✅] Migrer imports dans : ActionsList, AnomaliesPanel, LoadAnalysisTable, TopInterventionsTable
 * - [✅] Vérifier compatibilité : actions prop supporté dans EmptyState.jsx
 * - [✅] Tests de non-régression après migration
 * - [ ] Mode compact pour AnalysisHeader (sans Card wrapper)
 * - [✅] AdviceCallout : support custom icons (Lucide React, pas seulement emoji)
 * - [✅] InfoSection : support tooltip sur hover des labels
 * - [✅] InfoSection : support formatage valeurs (currency, percentage, duration)
 * - [✅] AnalysisHeader : support badge de compteur (ex: "12 anomalies")
 * - [✅] AdviceCallout : support rich text dans items (via React nodes)
 * - [ ] Export PDF/CSV pour sections d'analyse
 * 
 * @module components/common/AnalysisComponents
 * @requires @radix-ui/themes
 * @see EmptyState.jsx - Composant EmptyState standalone (à utiliser à la place du doublon)
 */

/**
 * En-tête réutilisable pour sections d'analyse
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {React.ComponentType|string} props.icon - Icône Lucide React (composant) ou emoji (string)
 * @param {string} props.title - Titre de la section
 * @param {string|React.ReactNode} props.description - Description ou contenu détaillé
 * @param {number} [props.count] - Compteur à afficher dans un badge (optionnel)
 * @param {string} [props.countColor='blue'] - Couleur du badge compteur
 * 
 * @returns {JSX.Element} Card avec icône, titre et description
 * 
 * @example
 * // Avec icône Lucide React
 * import { TrendingUp } from "lucide-react";
 * <AnalysisHeader 
 *   icon={TrendingUp} 
 *   title="Analyse de charge" 
 *   description="Distribution des interventions par technicien"
 * />
 * 
 * @example
 * // Avec compteur
 * <AnalysisHeader 
 *   icon="⚠️" 
 *   title="Anomalies détectées" 
 *   description="Interventions nécessitant votre attention"
 *   count={12}
 *   countColor="red"
 * />
 */
export function AnalysisHeader({ icon: Icon, title, description, count, countColor = 'blue' }) {
  return (
    <Card p="3" mb="4">
      <Flex align="center" gap="2" mb="2">
        {typeof Icon === 'string' ? (
          <Text size="5">{Icon}</Text>
        ) : (
          <Icon size={24} style={{ minWidth: '24px' }} />
        )}
        <Heading size="5">{title}</Heading>
        {count !== undefined && (
          <Badge color={countColor} size="2" variant="solid">
            {count}
          </Badge>
        )}
      </Flex>
      <Text size="2" color="gray">
        {description}
      </Text>
    </Card>
  );
}

AnalysisHeader.propTypes = {
  /** Icône Lucide React (composant) ou emoji (string) */
  icon: PropTypes.oneOfType([
    PropTypes.elementType,
    PropTypes.string
  ]).isRequired,
  /** Titre de la section */
  title: PropTypes.string.isRequired,
  /** Description ou contenu détaillé */
  description: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ]).isRequired,
  /** Compteur à afficher dans un badge */
  count: PropTypes.number,
  /** Couleur du badge compteur */
  countColor: PropTypes.string
};

/**
 * Callout avec liste de conseils/indicateurs
 * Réutilisable pour afficher des informations structurées
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {string} [props.type='indicators'] - Type de callout : 'indicators' | 'recommendations' | 'warnings' | 'info' | 'custom'
 * @param {string} props.title - Titre du callout
 * @param {(string|React.ReactNode)[]} props.items - Liste d'éléments (strings ou React nodes pour rich text)
 * @param {Object} [props.customConfig={}] - Config personnalisée si type='custom' : {color, icon (string emoji ou React component)}
 * 
 * @returns {JSX.Element} Callout avec liste à puces
 * 
 * @example
 * // Callout d'indicateurs (orange)
 * <AdviceCallout 
 *   type="indicators"
 *   title="Indicateurs de charge"
 *   items={[
 *     "Technicien A : 45h (surcharge)",
 *     "Technicien B : 32h (normal)"
 *   ]}
 * />
 * 
 * @example
 * // Callout de recommandations (bleu)
 * <AdviceCallout 
 *   type="recommendations"
 *   title="Recommandations"
 *   items={[
 *     "Répartir les interventions complexes",
 *     "Prévoir formation technicien junior"
 *   ]}
 * />
 * 
 * @example
 * // Callout personnalisé avec icône Lucide React
 * import { AlertTriangle } from "lucide-react";
 * <AdviceCallout 
 *   type="custom"
 *   title="Alertes critiques"
 *   items={["Machine X en panne depuis 3j"]}
 *   customConfig={{ color: "purple", icon: <AlertTriangle size={16} /> }}
 * />
 * 
 * @example
 * // Items avec rich text (React nodes)
 * <AdviceCallout 
 *   type="info"
 *   title="Informations"
 *   items={[
 *     "Texte simple",
 *     <Text key="2"><strong>Texte en gras</strong> et normal</Text>
 *   ]}
 * />
 */
export function AdviceCallout({ type = 'indicators', title, items, customConfig = {} }) {
  const config = {
    indicators: { color: 'orange', icon: '📊' },
    recommendations: { color: 'blue', icon: '💡' },
    warnings: { color: 'red', icon: '⚠️' },
    info: { color: 'gray', icon: 'ℹ️' },
    custom: customConfig
  };
  const { color, icon } = config[type] || config.indicators;

  return (
    <Callout.Root color={color} size="1">
      <Callout.Icon>{icon}</Callout.Icon>
      <Box style={{ flex: 1 }}>
        <Text weight="bold" size="2" style={{ display: 'block', marginBottom: '8px' }}>
          {title}
        </Text>
        <Box as="ul" style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
          {items.map((item, idx) => (
            <li key={idx}>
              {isValidElement(item) ? item : <Text as="span">{item}</Text>}
            </li>
          ))}
        </Box>
      </Box>
    </Callout.Root>
  );
}

AdviceCallout.propTypes = {
  /** Type de callout déterminant couleur et icône */
  type: PropTypes.oneOf(['indicators', 'recommendations', 'warnings', 'info', 'custom']),
  /** Titre du callout */
  title: PropTypes.string.isRequired,
  /** Liste d'éléments à afficher (strings ou React nodes) */
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node
    ])
  ).isRequired,
  /** Configuration personnalisée {color, icon} pour type='custom' */
  customConfig: PropTypes.shape({
    color: PropTypes.string,
    /** Icône : emoji string ou React component Lucide */
    icon: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node
    ])
  })
};

/**
 * Formate une valeur selon son type
 * @private
 * @param {string|number} value - Valeur à formater
 * @param {string} [format] - Type de format : 'currency' | 'percentage' | 'duration'
 * @returns {string} Valeur formatée
 */
const formatValue = (value, format) => {
  if (!format) return value;
  
  switch (format) {
    case 'currency':
      return typeof value === 'number' 
        ? `${value.toFixed(2)}€`
        : value;
    case 'percentage':
      return typeof value === 'number'
        ? `${value.toFixed(1)}%`
        : value;
    case 'duration':
      if (typeof value === 'number') {
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
      }
      return value;
    default:
      return value;
  }
};

/**
 * Section d'informations réutilisable
 * Affiche plusieurs paires clé/valeur de manière formatée
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Object[]} props.items - Liste d'items [{label, value, color?, format?, tooltip?}]
 * @param {string} props.items[].label - Libellé de l'information
 * @param {string|number} props.items[].value - Valeur à afficher
 * @param {string} [props.items[].color] - Couleur Radix UI pour la valeur
 * @param {string} [props.items[].format] - Format : 'currency' | 'percentage' | 'duration'
 * @param {string} [props.items[].tooltip] - Tooltip sur hover du label
 * 
 * @returns {JSX.Element} Box avec liste de paires clé/valeur
 * 
 * @example
 * // Avec formatage et tooltip
 * <InfoSection 
 *   items={[
 *     { 
 *       label: "Temps total", 
 *       value: 45.5, 
 *       format: "duration", 
 *       color: "blue",
 *       tooltip: "Temps cumulé sur la période"
 *     },
 *     { label: "Budget", value: 1250.50, format: "currency", color: "green" },
 *     { label: "Taux réussite", value: 92.3, format: "percentage" }
 *   ]}
 * />
 */
export function InfoSection({ items }) {
  return (
    <Box>
      {items.map((item, idx) => {
        const labelContent = (
          <Text size="1" color="gray" weight="medium">{item.label}</Text>
        );
        
        return (
          <Box key={idx} mb={idx < items.length - 1 ? "2" : "0"}>
            {item.tooltip ? (
              <Tooltip content={item.tooltip}>
                <Box style={{ cursor: 'help', display: 'inline-block' }}>
                  {labelContent}
                </Box>
              </Tooltip>
            ) : (
              labelContent
            )}
            <Text size="2" color={item.color}>
              {formatValue(item.value, item.format)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

InfoSection.propTypes = {
  /** Liste d'items avec paires clé/valeur */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      /** Libellé de l'information */
      label: PropTypes.string.isRequired,
      /** Valeur à afficher */
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired,
      /** Couleur Radix UI pour la valeur */
      color: PropTypes.string,
      /** Format de la valeur : 'currency' | 'percentage' | 'duration' */
      format: PropTypes.oneOf(['currency', 'percentage', 'duration']),
      /** Tooltip affiché sur hover du label */
      tooltip: PropTypes.string
    })
  ).isRequired
};
