/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔧 AnomalyHelpers.jsx - Helpers réutilisables pour affichage anomalies
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Module utilitaire regroupant composants et fonctions pour affichage anomalies actions.
 * 
 * Fonctionnalités:
 * - Groupement actions par intervention (Map)
 * - Headers anomalies avec badges severity
 * - Items actions avec temps passé et technicien
 * - Section interventions concernées (utilise InterventionCard unifié)
 * - Containers bordure colorée selon severity
 * - Détails actions uniques (Type C, D)
 * 
 * ✅ IMPLÉMENTÉ:
 * - groupActionsByIntervention: Map interventions avec actions agrégées
 * - AnomalyHeader: En-tête flex avec badges array
 * - ActionItem: Box action avec temps, technicien, description SafeHtml
 * - InterventionsSection: Liste InterventionCard en mode showActions
 * - AnomalyContainer: Box bordure colorée (red/orange) selon severity
 * - SingleActionDetail: Détail action unique avec warning message
 * - PropTypes complets pour validation runtime
 * - JSDoc @function avec @param et @returns
 * 
 * 🎯 USAGES:
 * - AnomalyTypeA: groupActionsByIntervention, InterventionsSection, AnomalyContainer, AnomalyHeader
 * - AnomalyTypeB: groupActionsByIntervention, InterventionsSection, AnomalyContainer, AnomalyHeader
 * - AnomalyTypeC: AnomalyContainer, AnomalyHeader, SingleActionDetail
 * - AnomalyTypeD: AnomalyContainer, AnomalyHeader
 * - AnomalyTypeE: AnomalyContainer, AnomalyHeader
 * - AnomalyTypeF: groupActionsByIntervention, InterventionsSection, AnomalyContainer, AnomalyHeader
 * 
 * 📋 TODO:
 * - [ ] Supprimer param severity inutilisé dans AnomalyHeader
 * - [ ] Animation fade-in AnomalyContainer (framer-motion)
 * - [ ] Export CSV actions groupées (groupActionsByIntervention)
 * - [ ] ActionItem: Support édition inline (inline edit mode)
 * - [ ] SingleActionDetail: Photos/attachments action
 * - [ ] Tests unitaires (Jest + RTL: grouping, rendering)
 * - [ ] Storybook stories (variants: severity, avec/sans actions)
 * - [ ] Performance: useMemo pour calculs groupActionsByIntervention
 * - [ ] Accessibility: ARIA labels sur containers interactive
 * - [ ] Dark mode support (couleurs bordures severity)
 * 
 * @module components/actions/anomalies/AnomalyHelpers
 * @requires @radix-ui/themes - Box, Flex, Text, Badge
 * @requires utils/actionUtils - formatActionDate
 * @requires common/SafeHtml - Affichage HTML sécurisé
 * @requires interventions/InterventionCard - Card unified mode détaillé
 * @see AnomalyTypeA, AnomalyTypeB, AnomalyTypeC, AnomalyTypeD, AnomalyTypeE, AnomalyTypeF
 */

import PropTypes from "prop-types";
import { Box, Flex, Text, Badge } from "@radix-ui/themes";
import { formatActionDate } from "@/lib/utils/actionUtils";
import { parseHtmlSafe } from "@/lib/utils/htmlUtils";
import InterventionCard from "@/components/interventions/InterventionCard";

// DTO-friendly accessors with legacy fallback
const getActionCreatedAt = (action) => action?.createdAt ?? action?.created_at ?? null;
const getActionTechnicianFirstName = (technician) => technician?.firstName ?? technician?.first_name ?? "—";
const getActionTechnicianLastName = (technician) => technician?.lastName ?? technician?.last_name ?? "—";
const getActionTimeSpent = (action) => Number(action?.timeSpent ?? action?.time_spent ?? 0);
const getActionDescription = (action) => action?.description ?? "";
const getItemTechnicianName = (item) => item?.tech ?? item?.technician ?? item?.technician_name ?? "—";
const getItemDate = (item) => item?.date ?? item?.created_at ?? null;
const getItemDescription = (item) => item?.description ?? "";

/**
 * Regroupe les actions par intervention
 * 
 * @function
 * @param {Array<Object>} actions - Actions à regrouper
 * @param {Object} actions[].intervention_id - Référence intervention
 * @param {string|number} actions[].intervention_id.id - ID intervention
 * @param {string} actions[].intervention_id.code - Code intervention
 * @param {string} actions[].intervention_id.title - Titre intervention
 * @param {Object} [actions[].intervention_id.machine_id] - Machine concernée
 * @param {string} [actions[].intervention_id.machine_id.name] - Nom machine
 * @returns {Array<Object>} Interventions avec actions agrégées { id, code, title, machine, actions[] }
 * 
 * @example
 * const actions = [
 *   { intervention_id: { id: 1, code: 'INT-001', title: 'Réparation' }, ... },
 *   { intervention_id: { id: 1, code: 'INT-001', title: 'Réparation' }, ... }
 * ];
 * const grouped = groupActionsByIntervention(actions);
 * // [{ id: 1, code: 'INT-001', title: 'Réparation', machine: 'M-045', actions: [2 items] }]
 */
export function groupActionsByIntervention(actions) {
  const interventionMap = new Map();
  
  actions.forEach(action => {
    const intervId = action.intervention?.id;
    if (!intervId) return;
    
    if (!interventionMap.has(intervId)) {
      interventionMap.set(intervId, {
        id: intervId,
        code: action.intervention.code,
        title: action.intervention.title,
        machine: action.intervention.machine?.name,
        actions: []
      });
    }
    
    interventionMap.get(intervId).actions.push(action);
  });
  
  return Array.from(interventionMap.values());
}

/**
 * En-tête d'anomalie avec catégorie et badges
 * 
 * @function
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre principal anomalie
 * @param {string} [props.subtitle] - Sous-titre descriptif
 * @param {Array<{label: string, color: string, size?: string}>} props.badges - Badges à afficher
 * @param {React.ReactNode} [props.children] - Contenu additionnel sous subtitle
 * @returns {JSX.Element} Flex header avec titre et badges
 * 
 * @example
 * <AnomalyHeader
 *   title="Intervention sans action"
 *   subtitle="3 interventions concernées"
 *   badges={[
 *     { label: '3', color: 'red', size: '2' },
 *     { label: 'Critique', color: 'orange' }
 *   ]}
 * />
 */
export function AnomalyHeader({ title, subtitle, badges, children }) {
  return (
    <Flex justify="between" align="start" mb="2">
      <Box style={{ flex: 1 }}>
        <Text weight="bold" size="3">{title}</Text>
        {subtitle && (
          <Text size="1" color="gray" style={{ display: 'block' }}>
            {subtitle}
          </Text>
        )}
        {children}
      </Box>
      <Flex direction="column" align="end" gap="1">
        {badges.map((badge, idx) => (
          <Badge key={idx} color={badge.color} size={badge.size || "2"}>
            {badge.label}
          </Badge>
        ))}
      </Flex>
    </Flex>
  );
}

AnomalyHeader.displayName = "AnomalyHeader";

AnomalyHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  badges: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      size: PropTypes.string
    })
  ).isRequired,
  children: PropTypes.node
};

/**
 * Affichage d'une action simple avec temps et technicien
 * 
 * @function
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.action - Action à afficher
 * @param {string} props.action.createdAt - Date création (ISO string)
 * @param {Object} [props.action.technician] - Technicien
 * @param {string} [props.action.technician.firstName] - Prénom technicien
 * @param {string} [props.action.technician.lastName] - Nom technicien
 * @param {string|number} [props.action.timeSpent] - Temps passé (heures)
 * @param {string} [props.action.description] - Description HTML
 * @param {string} [props.timeColor='gray'] - Couleur badge temps
 * @returns {JSX.Element} Box action avec meta et description
 * 
 * @example
 * <ActionItem
 *   action={{
 *     created_at: '2025-12-26T10:00:00Z',
 *     tech: { first_name: 'Jean', last_name: 'Dupont' },
 *     time_spent: '2.5',
 *     description: '<p>Diagnostic effectué</p>'
 *   }}
 *   timeColor="blue"
 * />
 */
export function ActionItem({ action, timeColor = "gray" }) {
  return (
    <Box 
      p="1"
      style={{ 
        background: 'var(--gray-1)',
        borderRadius: '3px',
        fontSize: '11px'
      }}
    >
      <Flex justify="between" align="center">
        <Text size="1" color="gray">
          {formatActionDate(getActionCreatedAt(action))} • {getActionTechnicianFirstName(action.technician)} {getActionTechnicianLastName(action.technician)}
        </Text>
        <Text size="1" weight="bold" color={timeColor}>
          {getActionTimeSpent(action).toFixed(2)}h
        </Text>
      </Flex>
      {getActionDescription(action) && (
        <Box 
          mt="1"
          style={{
            fontSize: '11px',
            color: 'var(--gray-11)',
            fontStyle: 'italic',
            lineHeight: '1.3',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {parseHtmlSafe(getActionDescription(action), 100)}
        </Box>
      )}
    </Box>
  );
}

ActionItem.displayName = "ActionItem";

ActionItem.propTypes = {
  action: PropTypes.shape({
    createdAt: PropTypes.string,
    created_at: PropTypes.string,
    technician: PropTypes.shape({
      firstName: PropTypes.string,
      first_name: PropTypes.string,
      lastName: PropTypes.string,
      last_name: PropTypes.string
    }),
    timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string
  }),
  timeColor: PropTypes.string
};

/**
 * Section avec liste d'interventions concernées
 * Utilise le composant unifié InterventionCard en mode détaillé
 * 
 * @function
 * @param {Object} props - Propriétés du composant
 * @param {Array<Object>} props.interventions - Interventions à afficher
 * @param {string|number} props.interventions[].id - ID intervention
 * @param {string} props.interventions[].code - Code intervention
 * @param {string} [props.interventions[].title] - Titre intervention
 * @param {string} [props.interventions[].machine] - Nom machine
 * @param {Array} props.interventions[].actions - Actions liées
 * @param {string} [props.actionTimeColor='gray'] - Couleur badge temps
 * @returns {JSX.Element} Box avec liste InterventionCard
 * 
 * @example
 * <InterventionsSection
 *   interventions={[
 *     {
 *       id: 1,
 *       code: 'INT-001',
 *       title: 'Réparation',
 *       machine: 'Presse hydraulique',
 *       actions: [{ time_spent: '2.5', description: '...' }]
 *     }
 *   ]}
 *   actionTimeColor="blue"
 * />
 */
export function InterventionsSection({ interventions, actionTimeColor = "gray" }) {
  return (
    <Box>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
        Interventions concernées :
      </Text>
      <Flex direction="column" gap="2">
        {interventions.map((interv, idx) => (
          <InterventionCard 
            key={idx} 
            intervention={interv} 
            showActions={true}
            actionTimeColor={actionTimeColor}
          />
        ))}
      </Flex>
    </Box>
  );
}

InterventionsSection.displayName = "InterventionsSection";

InterventionsSection.propTypes = {
  interventions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      code: PropTypes.string.isRequired,
      title: PropTypes.string,
      machine: PropTypes.string,
      actions: PropTypes.array.isRequired,
    })
  ).isRequired,
  actionTimeColor: PropTypes.string,
};

/**
 * Container avec bordure colorée selon sévérité
 * Affiche une box avec bordure colorée et fond transparent
 * 
 * @function
 * @param {Object} props - Propriétés du composant
 * @param {string} [props.severity] - Niveau de sévérité ('high'|autre)
 * @param {React.ReactNode} props.children - Contenu du container
 * @returns {JSX.Element} Box avec style selon sévérité
 * 
 * @example
 * <AnomalyContainer severity="high">
 *   <Text>Contenu de l'anomalie critique</Text>
 * </AnomalyContainer>
 */
export function AnomalyContainer({ severity, children }) {
  const borderColor = severity === 'high' ? 'red' : 'orange';
  
  return (
    <Box 
      p="3" 
      style={{ 
        background: 'var(--gray-2)', 
        borderRadius: '4px',
        borderLeft: `3px solid var(--${borderColor}-9)`
      }}
    >
      {children}
    </Box>
  );
}

AnomalyContainer.displayName = "AnomalyContainer";

AnomalyContainer.propTypes = {
  severity: PropTypes.oneOf(['high', 'medium', 'low']),
  children: PropTypes.node.isRequired,
};

/**
 * Détail d'une action unique avec warning (Type C, D)
 * Affiche les informations complètes d'une action avec message d'avertissement
 * 
 * @function
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.item - Action à afficher
 * @param {string|number} props.item.id - ID action
 * @param {string} props.item.created_at - Date création ISO
 * @param {Object} [props.item.tech] - Technicien ayant effectué l'action
 * @param {string} props.item.tech.first_name - Prénom technicien
 * @param {string} props.item.tech.last_name - Nom technicien
 * @param {string|number} [props.item.time_spent] - Temps passé en heures
 * @param {string} [props.item.description] - Description HTML
 * @param {Object} [props.item.action] - Action imbriquée alternative
 * @param {string} [props.item.action.description] - Description HTML alternative
 * @param {string} [props.item.intervention_id] - ID intervention liée
 * @param {string} [props.item.intervention_code] - Code intervention
 * @param {string} [props.warningColor='orange'] - Couleur du callout warning
 * @param {string} [props.warningMessage] - Message d'avertissement à afficher
 * @returns {JSX.Element} Box avec détails action et warning optionnel
 * 
 * @example
 * <SingleActionDetail
 *   item={{
 *     id: 1,
 *     created_at: '2024-01-01T10:00:00',
 *     tech: { first_name: 'Jean', last_name: 'Dupont' },
 *     time_spent: '2.5',
 *     description: '<p>Réparation effectuée</p>',
 *     intervention_code: 'INT-001'
 *   }}
 *   warningColor="orange"
 *   warningMessage="Action isolée détectée"
 * />
 */
export function SingleActionDetail({ item, warningColor, warningMessage }) {
  return (
    <Box>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
        Détails de l&apos;action :
      </Text>
      <Box 
        p="2"
        style={{ 
          background: 'white',
          borderRadius: '4px',
          border: '1px solid var(--gray-4)'
        }}
      >
        <Flex direction="column" gap="1">
          <Flex justify="between" align="center">
            <Text size="1" color="gray">
              <Text weight="bold">Technicien:</Text> {getItemTechnicianName(item)}
            </Text>
            <Text size="1" color="gray">
              {formatActionDate(getItemDate(item))}
            </Text>
          </Flex>
          
          {getItemDescription(item) && (
            <Box 
              p="2" 
              mt="2"
              style={{ 
                background: 'var(--gray-1)',
                borderRadius: '3px'
              }}
            >
              <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
                Description :
              </Text>
              <Box
                style={{ 
                  fontSize: '12px',
                  color: 'var(--gray-11)',
                  fontStyle: 'italic',
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {parseHtmlSafe(getItemDescription(item))}
              </Box>
            </Box>
          )}

          <Box 
            p="1" 
            mt="2"
            style={{ 
              background: `var(--${warningColor}-2)`,
              borderRadius: '3px',
              textAlign: 'center'
            }}
          >
            <Text size="1" weight="bold" color={warningColor}>
              {warningMessage}
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

SingleActionDetail.displayName = "SingleActionDetail";

SingleActionDetail.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    date: PropTypes.string,
    tech: PropTypes.string,
    technician: PropTypes.string,
    technician_name: PropTypes.string,
    time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    action: PropTypes.shape({
      description: PropTypes.string
    }),
    intervention_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention_code: PropTypes.string
  }),
  warningColor: PropTypes.string,
  warningMessage: PropTypes.string
};