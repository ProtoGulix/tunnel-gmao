import PropTypes from 'prop-types';
import AuditReasonDialog from './AuditReasonDialog';

/**
 * Pont entre useAuditGuard et AuditReasonDialog.
 *
 * Reçoit directement les auditProps du hook et les passe au dialog.
 * Titre et description sont génériques ; remplacer si besoin par un contexte métier.
 *
 * Usage :
 *   const { withAudit, auditProps } = useAuditGuard();
 *   <AuditGuardDialog {...auditProps} />
 */
export default function AuditGuardDialog({ open, entityType, saving, onConfirm, onCancel }) {
  if (!open || !entityType) return null;

  return (
    <AuditReasonDialog
      open={open}
      entityType={entityType}
      title="Raison de la modification"
      description="Cette action nécessite une raison d'audit."
      saving={saving}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

AuditGuardDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  entityType: PropTypes.string,
  saving: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
