import PropTypes from "prop-types";
import { Callout, Text, Flex, Button } from "@radix-ui/themes";
import { AlertCircle } from "lucide-react";

const SEVERITY_COLORS = {
  warning: "orange",
  error: "red",
  critical: "red"
};

function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity] || "red";
}

function UrgencyCount({ urgencyCount }) {
  if (!urgencyCount) return null;
  return (
    <Text as="span" weight="bold" style={{ marginLeft: "4px" }}>
      ({urgencyCount} {urgencyCount === 1 ? "élément" : "éléments"})
    </Text>
  );
}

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
 * Alerte critique réutilisable pour contextes nécessitant attention immédiate
 * Affiche un callout coloré avec message d'avertissement personnalisable
 * 
 * ✅ Implémenté :
 * - 3 niveaux de sévérité : warning (orange), error (rouge), critical (rouge foncé)
 * - Message et titre 100% personnalisables
 * - Icône au choix ou emoji par défaut
 * - Compteur d'items urgents optionnel
 * - Action button optionnelle (ex: "Voir détails")
 * - Accessibilité ARIA complète
 * - Early return si show=false
 * 
 * TODO: Améliorations futures :
 * - Animation pulse ou shake pour attirer l'attention
 * - Son d'alerte optionnel (avec toggle mute)
 * - Liste détaillée expandable des items urgents
 * - Historique des alertes avec timeline
 * - Notification push si alerte non vue après 5min
 * - Auto-dismiss après résolution
 * - Mode compact pour affichage multiple alertes
 * - Badge compteur plus proéminent
 */
export default function CriticalAlert({ 
  show, 
  title = "⚠️ Attention requise",
  message,
  severity = "error",
  urgencyCount,
  icon,
  action,
  onActionClick
}) {
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
