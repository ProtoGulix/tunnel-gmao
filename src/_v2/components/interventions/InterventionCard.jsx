/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎴 InterventionCard.jsx - Carte intervention compacte cliquable
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant carte d'intervention affichant les informations essentielles avec navigation.
 * 
 * Fonctionnalités:
 * - Carte cliquable Link vers détail intervention (/intervention/:id)
 * - Badge priorité coloré (PRIORITY_CONFIG)
 * - Affichage code, titre, machine, date
 * - Hover effects (translateY, boxShadow)
 * - Layout responsive Flex
 * - Protection données nulles (optional chaining)
 * 
 * ✅ IMPLÉMENTÉ:
 * - Link React Router vers /intervention/:id
 * - Card Radix size="1" avec padding "2"
 * - Badge priorité avec couleur dynamique (urgent, high, medium, low)
 * - Icônes Lucide Factory et Calendar (remplace emojis)
 * - Status badge optionnel (showStatus prop avec STATUS_CONFIG)
 * - Affichage machine code et date formatée
 * - Separator entre header et footer
 * - Hover effects avec onMouseEnter/onMouseLeave
 * - PropTypes complets pour validation runtime
 * - useMemo pour styles optimisés
 * - aria-label pour accessibilité
 * - Mode détaillé unifié (showActions + actions array)
 * - Affichage actions avec temps passé et total
 * - Support machine string ou object (machine_id.code)
 * 
 * 🎯 USAGES:
 * - AnomalyHelpers.InterventionsSection: Affichage avec actions et temps (mode détaillé)
 * 
 * ✅ UNIFICATION COMPLÈTE:
 * - Version unique remplaçant InterventionCard dans AnomalyHelpers.jsx
 * - Props showActions active le mode détaillé avec liste actions
 * - Compatible avec les deux structures de données (machine string ou object)
 * 
 * 📋 TODO:
 * - [x] Unifier avec InterventionCard dans AnomalyHelpers.jsx (FAIT)
 * - [x] Icônes Lucide au lieu d'emoji (🏭 → Factory, 📅 → Calendar)
 * - [x] Status badge optionnel (ouvert, fermé, attente)
 * - [ ] Technicien assigné (avatar + nom)
 * - [ ] Badge count actions (ex: "5 actions")
 * - [ ] Tooltip détails sur hover (description complète)
 * - [ ] Animation fade-in au mount (framer-motion)
 */

import { stripHtml } from "@/lib/utils/htmlUtils";

import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Card, Box, Flex, Text, Badge, Separator } from "@radix-ui/themes";
import { Factory, Calendar } from "lucide-react";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/config/interventionTypes";

/**
 * Carte intervention compacte avec navigation
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.intervention - Données intervention
 * @param {string|number} props.intervention.id - ID intervention pour navigation
 * @param {string} [props.intervention.code] - Code intervention (ex: "INT-001")
 * @param {string} [props.intervention.title] - Titre intervention
 * @param {string} [props.intervention.priority] - Priorité (urgent, high, medium, low)
 * @param {Object|string} [props.intervention.machine_id] - Machine concernée (object) ou machine (string)
 * @param {string} [props.intervention.machine_id.code] - Code machine (si object)
 * @param {string} [props.intervention.machine] - Nom machine (si string, mode détaillé)
 * @param {string} [props.intervention.reported_date] - Date signalement (ISO string)
 * @param {Object} [props.intervention.status_actual] - Statut actuel intervention
 * @param {string} [props.intervention.status_actual.id] - ID statut (ouvert, ferme, etc.)
 * @param {Array} [props.intervention.actions] - Actions liées (mode détaillé)
 * @param {boolean} [props.showActions=false] - Afficher mode détaillé avec actions et temps
 * @param {boolean} [props.showStatus=false] - Afficher badge statut (ouvert, fermé, attente)
 * @param {string} [props.actionTimeColor='gray'] - Couleur badge temps (mode détaillé)
 * @returns {JSX.Element} Card Link cliquable vers détail intervention
 * 
 * @example
 * // Usage mode compact (priorité/machine)
 * <InterventionCard
 *   intervention={{
 *     id: 123,
 *     code: 'INT-001',
 *     title: 'Réparation moteur',
 *     priority: 'urgent',
 *     machine_id: { code: 'M-045' },
 *     reported_date: '2025-12-26T10:00:00Z'
 *   }}
 * />
 * 
 * @example
 * // Usage mode détaillé (actions/temps)
 * <InterventionCard
 *   intervention={{
 *     id: 123,
 *     code: 'INT-001',
 *     title: 'Réparation moteur',
 *     machine: 'Presse hydraulique',
 *     actions: [
 *       { id: 1, description: 'Diagnostic', time_spent: '2.5' },
 *       { id: 2, description: 'Réparation', time_spent: '4.0' }
 *     ]
 *   }}
 *   showActions={true}
 *   actionTimeColor="blue"
 * />
 */
export default function InterventionCard({ intervention, showActions = false, showStatus = false, actionTimeColor = "gray" }) {
  const [isHovered, setIsHovered] = useState(false);
  const priorityConfig = PRIORITY_CONFIG[intervention.priority?.toLowerCase()];
  const statusConfig = STATUS_CONFIG[intervention.status_actual?.id];

  // Mode détaillé: calculer temps total actions
  const totalTime = useMemo(() => {
    if (!showActions || !intervention.actions) return 0;
    return intervention.actions.reduce((sum, a) => sum + (parseFloat(a.timeSpent) || 0), 0);
  }, [showActions, intervention.actions]);

  const avgTime = useMemo(() => {
    if (!showActions || !intervention.actions || intervention.actions.length === 0) return 0;
    return totalTime / intervention.actions.length;
  }, [showActions, totalTime, intervention.actions]);

  // Optimiser style avec useMemo
  const cardStyle = useMemo(() => ({
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
  }), [isHovered]);

  return (
    <Link 
      to={`/intervention/${intervention.id}`} 
      style={{ textDecoration: "none", display: 'block' }}
      aria-label={`Voir détails intervention ${intervention.code || 'sans code'}`}
    >
      <Card 
        size="1" 
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box p="2">
          <Flex direction="column" gap="1">
            <Flex justify="between" align="start">
              <Box style={{ flex: 1 }}>
                <Text weight="bold" size="2" color={showActions ? "blue" : undefined} style={{ display: 'block' }}>
                  {intervention.code || "N/A"}
                </Text>
                <Text 
                  size="1" 
                  color="gray" 
                  style={{ 
                    display: 'block', 
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {intervention.title || "Sans titre"}
                </Text>
                {showActions && intervention.machine && (
                  <Text size="1" color="gray" style={{ display: 'block' }}>
                    Machine: {intervention.machine}
                  </Text>
                )}
              </Box>
              
              {/* Mode compact: Badge priorité */}
              {!showActions && (
                <Badge color={priorityConfig?.color || 'gray'} size="1">
                  {priorityConfig?.icon || ''} {intervention.priority || "N/A"}
                </Badge>
              )}
              
              {/* Mode détaillé: Badges actions et temps */}
              {showActions && intervention.actions && (
                <Flex direction="column" align="end" gap="1">
                  <Badge color="gray" size="1">
                    {intervention.actions.length} action{intervention.actions.length > 1 ? 's' : ''}
                  </Badge>
                  <Badge color={actionTimeColor} size="1">
                    {totalTime.toFixed(2)}h
                  </Badge>
                </Flex>
              )}
            </Flex>

            {/* Mode compact: Separator + machine/date */}
            {!showActions && (
              <>
                <Separator size="4" style={{ margin: '4px 0' }} />
                <Flex gap="2" align="center" wrap="wrap">
                  <Flex align="center" gap="1">
                    <Factory size={14} color="var(--gray-9)" />
                    <Text size="1" color="gray">
                      {intervention.machine_id?.code || "N/A"}
                    </Text>
                  </Flex>
                  <Flex align="center" gap="1">
                    <Calendar size={14} color="var(--gray-9)" />
                    <Text size="1" color="gray">
                      {intervention.reported_date 
                        ? new Date(intervention.reported_date).toLocaleDateString('fr-FR')
                        : "N/A"}
                    </Text>
                  </Flex>
                  {showStatus && statusConfig && (
                    <Badge color={statusConfig.color} size="1" variant="soft">
                      {statusConfig.label}
                    </Badge>
                  )}
                </Flex>
              </>
            )}

            {/* Mode détaillé: Liste actions + Total */}
            {showActions && intervention.actions && intervention.actions.length > 0 && (
              <>
                <Flex direction="column" gap="1" style={{ marginTop: '8px' }}>
                  {intervention.actions.map((action, idx) => (
                    <Box 
                      key={idx}
                      p="1"
                      style={{
                        background: 'var(--gray-2)',
                        borderRadius: '3px',
                        fontSize: '11px'
                      }}
                    >
                      <Flex justify="between" align="center">
                        <Text size="1" style={{ flex: 1 }}>
                          {stripHtml(action.description) || 'Action'}
                        </Text>
                        <Badge color={actionTimeColor} size="1">
                          {parseFloat(action.timeSpent || 0).toFixed(2)}h
                        </Badge>
                      </Flex>
                    </Box>
                  ))}
                </Flex>
                <Box 
                  p="1" 
                  style={{ 
                    marginTop: '8px',
                    background: `var(--${actionTimeColor}-2)`,
                    borderRadius: '3px',
                    textAlign: 'right'
                  }}
                >
                  <Text size="1" weight="bold" color={actionTimeColor}>
                    Total: {totalTime.toFixed(2)}h • Moy: {avgTime.toFixed(2)}h/action
                  </Text>
                </Box>
              </>
            )}
          </Flex>
        </Box>
      </Card>
    </Link>
  );
}

// PropTypes pour validation runtime
InterventionCard.propTypes = {
  intervention: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    code: PropTypes.string,
    title: PropTypes.string,
    priority: PropTypes.string,
    machine_id: PropTypes.shape({
      code: PropTypes.string
    }),
    machine: PropTypes.string,
    reported_date: PropTypes.string,
    status_actual: PropTypes.shape({
      id: PropTypes.string
    }),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        description: PropTypes.string,
        time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      })
    )
  }).isRequired,
  showActions: PropTypes.bool,
  showStatus: PropTypes.bool,
  actionTimeColor: PropTypes.string
};