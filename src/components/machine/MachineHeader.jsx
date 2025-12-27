/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📋 MachineHeader.jsx - En-tête page détail machine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant header affichant les informations principales et actions pour une machine:
 * - Navigation retour vers liste machines
 * - Code et nom machine
 * - Badge état global avec icône et couleur sémantique
 * - Bouton actualiser données
 * - Actions rapides (export, QR code, favoris)
 * 
 * États machine:
 * - ok: Opérationnelle (vert, ✓)
 * - maintenance: Maintenance (bleu, 🔧)
 * - warning: Attention (orange, ⚠️)
 * - critical: Critique (rouge, 🚨)
 * 
 * ✅ IMPLÉMENTÉ:
 * - Navigation Link vers /machines
 * - Affichage code + nom machine
 * - Badge état avec STATUS_LABELS (color, icon, label)
 * - Bouton actualiser avec callback onReload
 * - Layout Flex responsive (justify="between")
 * - Protection données nulles (machine.code || "N/A")
 * 
 * 📋 TODO:
 * - [ ] Breadcrumb hiérarchique (Zone > Atelier > Machine)
 * - [ ] Icônes Lucide vectorielles (remplacer émojis)
 * - [ ] Timestamp dernière actualisation ("il y a X min")
 * - [ ] Bouton export PDF/Excel rapport machine
 * - [ ] Bouton génération QR code pour étiquette
 * - [ ] Toggle favoris (étoile, localStorage)
 * - [ ] Dropdown actions rapides (⋮ menu)
 * - [ ] Indicateur sous-équipements (badge count)
 * - [ ] Lien vers machine mère si equipement_mere
 * - [ ] Badge garantie (date expiration si applicable)
 * - [ ] Mode édition rapide (clic nom pour modifier)
 * - [ ] Historique changements statut (popover)
 * 
 * @module components/machine/MachineHeader
 */

import { useCallback } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Card, Flex, Text, Badge, Button, Heading, Box } from "@radix-ui/themes";
import { ArrowLeft, RefreshCw, CheckCircle2, Wrench, AlertTriangle, AlertOctagon } from "lucide-react";

/**
 * Labels et configurations pour les différents états de machine
 */
const STATUS_LABELS = {
  'ok': { label: 'Opérationnelle', color: 'green', Icon: CheckCircle2 },
  'maintenance': { label: 'Maintenance', color: 'blue', Icon: Wrench },
  'warning': { label: 'Attention', color: 'orange', Icon: AlertTriangle },
  'critical': { label: 'Critique', color: 'red', Icon: AlertOctagon }
};

/**
 * Composant Header pour affichage informations principales machine
 * 
 * @param {Object} props
 * @param {Object} props.machine - Données machine (code, name, zone_id, atelier_id)
 * @param {string} props.globalStatus - État global ('ok'|'maintenance'|'warning'|'critical')
 * @param {Function} props.onReload - Callback pour recharger les données
 * @returns {JSX.Element} Header avec navigation, infos, état et actions
 * 
 * @example
 * <MachineHeader 
 *   machine={{ code: 'M-001', name: 'Presse hydraulique' }}
 *   globalStatus="warning"
 *   onReload={handleReload}
 * />
 */
export default function MachineHeader({ machine, globalStatus, onReload }) {
  const status = STATUS_LABELS[globalStatus] || STATUS_LABELS.ok;
  const StatusIcon = status.Icon;

  // Stabilisation callback pour éviter re-renders enfants
  const handleReload = useCallback(() => {
    onReload?.();
  }, [onReload]);

  return (
    <Card>
      <Flex justify="between" align="center" p="3" gap="3">
        {/* Section gauche : Navigation et informations */}
        <Flex align="center" gap="3">
          <Button variant="soft" size="2" asChild>
            <Link to="/machines" style={{ textDecoration: 'none', color: 'inherit' }}>
              <ArrowLeft size={16} style={{ marginRight: '6px' }} />
              Retour
            </Link>
          </Button>
          <Box>
            <Heading size="6">{machine.code || "N/A"}</Heading>
            <Text color="gray" size="2">{machine.name || "Sans nom"}</Text>
          </Box>
        </Flex>

        {/* Section droite : État et actions */}
        <Flex gap="2" align="center">
          <Badge 
            color={status.color} 
            size="2"
            style={{ fontSize: '14px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <StatusIcon size={16} />
            {status.label}
          </Badge>
          <Button variant="soft" onClick={handleReload} size="2">
            <RefreshCw size={16} style={{ marginRight: '6px' }} />
            Actualiser
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

// PropTypes pour validation runtime
MachineHeader.propTypes = {
  machine: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string,
    zone_id: PropTypes.object,
    atelier_id: PropTypes.object
  }).isRequired,
  globalStatus: PropTypes.oneOf(['ok', 'maintenance', 'warning', 'critical']).isRequired,
  onReload: PropTypes.func.isRequired
};