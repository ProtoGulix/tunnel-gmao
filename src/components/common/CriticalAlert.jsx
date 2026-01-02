/**
 * @fileoverview Composant d'alerte critique pour signaler des situations nécessitant attention immédiate
 *
 * @module components/common/CriticalAlert
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import { Callout, Text, Flex, Button } from "@radix-ui/themes";
import { AlertCircle } from "lucide-react";

/** Couleurs Radix UI par niveau de sévérité */
const SEVERITY_COLORS = {
  warning: "orange",
  error: "red",
  critical: "red"
};

/**
 * Détermine la couleur selon le niveau de sévérité
 * @param {string} severity - Niveau de sévérité
 * @returns {string} Nom de couleur Radix UI
 */
function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity] || "red";
}

/**
 * Affiche le compteur d'éléments urgents
 * @param {Object} props
 * @param {number} [props.urgencyCount] - Nombre d'éléments urgents
 * @returns {JSX.Element|null} Compteur ou null si aucun
 */
function UrgencyCount({ urgencyCount }) {
  if (!urgencyCount) return null;
  return (
    <Text as="span" weight="bold" style={{ marginLeft: "4px" }}>
      ({urgencyCount} {urgencyCount === 1 ? "élément" : "éléments"})
    </Text>
  );
}

/**
 * Bouton d'action optionnel
 * @param {Object} props
 * @param {string} [props.action] - Libellé du bouton
 * @param {Function} [props.onActionClick] - Callback au clic
 * @returns {JSX.Element|null} Bouton ou null si aucune action
 */
function ActionButton({ action, onActionClick }) {
  if (!action || !onActionClick) return null;
  return (
    <Button
      size="2"
      variant="soft"
      onClick={onActionClick}
      style={{ marginTop: "4px", alignSelf: "flex-start" }}
    >
      {action}
    </Button>
  );
}

/**
 * Alerte critique pour contextes nécessitant attention immédiate
 * 
 * Affiche un callout Radix UI coloré avec message personnalisable,
 * compteur d'urgence optionnel et bouton d'action.
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.show - Afficher ou masquer l'alerte
 * @param {string} [props.title="⚠️ Attention requise"] - Titre de l'alerte
 * @param {string} [props.message] - Message descriptif
 * @param {('warning'|'error'|'critical')} [props.severity='error'] - Niveau de sévérité
 * @param {number} [props.urgencyCount] - Nombre d'éléments urgents à afficher
 * @param {React.ReactNode} [props.icon] - Icône personnalisée (défaut: AlertCircle)
 * @param {string} [props.action] - Libellé du bouton d'action
 * @param {Function} [props.onActionClick] - Callback du bouton d'action
 * @returns {JSX.Element|null} Callout d'alerte ou null si show=false
 * 
 * @example
 * // Alerte simple
 * <CriticalAlert
 *   show={hasErrors}
 *   title="Erreur de validation"
 *   message="Certains champs sont invalides"
 *   severity="error"
 * />
 * 
 * @example
 * // Avec compteur et action
 * <CriticalAlert
 *   show={anomalies.length > 0}
 *   title="Anomalies détectées"
 *   message="Des anomalies nécessitent votre attention"
 *   severity="warning"
 *   urgencyCount={anomalies.length}
 *   action="Voir les détails"
 *   onActionClick={() => navigate('/anomalies')}
 * />
 * 
 * @example
 * // Critique avec icône personnalisée
 * <CriticalAlert
 *   show={serverDown}
 *   title="Serveur indisponible"
 *   message="Impossible de contacter le serveur"
 *   severity="critical"
 *   icon={<ServerCrash />}
 * />
 */
export default function CriticalAlert(props) {
  const {
    show,
    title = "⚠️ Attention requise",
    message,
    severity = "error",
    urgencyCount,
    icon,
    action,
    onActionClick
  } = props;

  if (!show) return null;
  const color = getSeverityColor(severity);
  
  return (
    <Callout.Root color={color} role="alert" aria-live="assertive">
      <Callout.Icon>
        {icon || <AlertCircle size={20} />}
      </Callout.Icon>
      <Callout.Text>
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2" wrap="wrap">
            <Text weight="bold" size="3">
              {title}
            </Text>
            <UrgencyCount urgencyCount={urgencyCount} />
          </Flex>
          
          {message && (
            <Text size="2">
              {message}
            </Text>
          )}

          <ActionButton action={action} onActionClick={onActionClick} />
        </Flex>
      </Callout.Text>
    </Callout.Root>
  );
}

CriticalAlert.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  severity: PropTypes.oneOf(['warning', 'error', 'critical']),
  urgencyCount: PropTypes.number,
  icon: PropTypes.node,
  action: PropTypes.string,
  onActionClick: PropTypes.func,
};

UrgencyCount.propTypes = {
  urgencyCount: PropTypes.number
};

ActionButton.propTypes = {
  action: PropTypes.string,
  onActionClick: PropTypes.func
};
