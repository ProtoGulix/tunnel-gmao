/**
 * En-tête compact du détail d'intervention en mode panneau (master-detail, ADR 0013).
 *
 * Trois lignes : machine et menu « ⋯ », titre, puis propriétés (statut, priorité,
 * demande liée, temps). Le code intervention reste discret : la liste de gauche
 * l'affiche déjà. Aucune logique métier ici, les mutations viennent de la page.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';
import { STATE_COLORS, PRIORITY_COLORS } from '@/config/interventionTypes';
import DeleteInterventionDialog from './DeleteInterventionDialog';
import {
  MachineHeading,
  MoreActionsMenu,
  PropertySelect,
  RequestLink,
  TypeBadge,
  WorkSummary,
} from './InterventionPanelHeaderParts';

const STATUS_KEYS = ['ouvert', 'attente_pieces', 'attente_prod', 'ferme'];
const PRIORITY_KEYS = ['urgent', 'important', 'normal', 'faible'];

const TITLE_CLAMP_STYLE = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  color: 'var(--gray-12)',
  lineHeight: 1.3,
  margin: '10px 0 12px',
};

export default function InterventionPanelHeader({
  intervention,
  statusKey,
  priorityKey,
  canEditProperties,
  onStatusChange,
  onPriorityChange,
  onRequestPointage,
  onOpenRequest,
  onCopyCode,
  canDelete,
  deleteBlockReason,
  onDelete,
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const request = intervention.request;
  const hasMenu = Boolean(onRequestPointage || intervention.code || canDelete);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(intervention.code);
      onCopyCode?.(true);
    } catch {
      onCopyCode?.(false);
    }
  };

  const handleConfirmDelete = async (choice) => {
    setDeleting(true);
    try {
      await onDelete(choice);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-5)', background: 'var(--gray-1)', flexShrink: 0 }}>
      {/* Ligne 1 : équipement mis en valeur (comme dans la liste), code intervention, menu */}
      <Flex align="center" gap="2">
        <MachineHeading machine={intervention.machine} />
        <Text size="2" style={{ fontFamily: 'monospace', marginLeft: 'auto', flexShrink: 0, color: 'var(--gray-11)' }} title="Code intervention">
          {intervention.code}
        </Text>
        {hasMenu && (
          <MoreActionsMenu
            code={intervention.code}
            onRequestPointage={onRequestPointage}
            onCopyCode={handleCopyCode}
            canDelete={canDelete}
            deleteBlockReason={deleteBlockReason}
            onAskDelete={() => setDeleteOpen(true)}
          />
        )}
      </Flex>

      {/* Ligne 2 : titre, coupé à deux lignes */}
      <Text as="div" size="5" weight="bold" title={intervention.title} style={TITLE_CLAMP_STYLE}>
        {intervention.title}
      </Text>

      {/* Ligne 3 : propriétés */}
      <Flex align="center" gap="2" wrap="wrap">
        <PropertySelect
          ariaLabel="Statut"
          value={statusKey}
          options={STATUS_KEYS}
          colors={STATE_COLORS}
          disabled={!canEditProperties}
          onChange={onStatusChange}
        />
        <PropertySelect
          ariaLabel="Priorité"
          value={priorityKey}
          options={PRIORITY_KEYS}
          colors={PRIORITY_COLORS}
          disabled={!canEditProperties}
          onChange={onPriorityChange}
        />
        <TypeBadge typeCode={intervention.type} />
        {request && <RequestLink request={request} onOpen={onOpenRequest} />}
        <WorkSummary stats={intervention.stats} />
      </Flex>

      {canDelete && (
        <DeleteInterventionDialog
          open={deleteOpen}
          code={intervention.code}
          request={request}
          saving={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}

InterventionPanelHeader.propTypes = {
  intervention: PropTypes.object.isRequired,
  statusKey: PropTypes.string.isRequired,
  priorityKey: PropTypes.string.isRequired,
  canEditProperties: PropTypes.bool,
  onStatusChange: PropTypes.func.isRequired,
  onPriorityChange: PropTypes.func.isRequired,
  onRequestPointage: PropTypes.func,
  onOpenRequest: PropTypes.func,
  onCopyCode: PropTypes.func,
  canDelete: PropTypes.bool,
  deleteBlockReason: PropTypes.string,
  onDelete: PropTypes.func,
};
