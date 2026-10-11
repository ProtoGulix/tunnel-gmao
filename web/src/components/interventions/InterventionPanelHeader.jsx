/**
 * En-tête compact du détail d'intervention en mode panneau (master-detail, ADR 0013).
 *
 * Trois lignes : machine et menu « ⋯ », titre, puis propriétés (statut, priorité,
 * demande liée, temps). Le code intervention reste discret : la liste de gauche
 * l'affiche déjà. Aucune logique métier ici, les mutations viennent de la page.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { STATE_COLORS, PRIORITY_COLORS } from '@/config/interventionTypes';
import {
  DeleteInterventionDialog,
  MoreActionsMenu,
  PropertySelect,
  RequestLink,
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
  margin: '6px 0 8px',
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
  isDeletable,
  onDelete,
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-5)', background: 'var(--gray-1)', flexShrink: 0 }}>
      {/* Ligne 1 : machine, code intervention discret, menu */}
      <Flex align="center" gap="2">
        {intervention.machine?.code && (
          <Badge variant="solid" color="gray" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
            {intervention.machine.code}
          </Badge>
        )}
        <Text size="2" color="gray" truncate style={{ minWidth: 0 }}>{intervention.machine?.name ?? ''}</Text>
        <Text size="1" color="gray" style={{ fontFamily: 'monospace', marginLeft: 'auto', flexShrink: 0 }} title="Code intervention">
          {intervention.code}
        </Text>
        {hasMenu && (
          <MoreActionsMenu
            code={intervention.code}
            onRequestPointage={onRequestPointage}
            onCopyCode={handleCopyCode}
            canDelete={canDelete}
            isDeletable={isDeletable}
            onAskDelete={() => setDeleteOpen(true)}
          />
        )}
      </Flex>

      {/* Ligne 2 : titre, coupé à deux lignes */}
      <Text as="div" size="4" weight="bold" title={intervention.title} style={TITLE_CLAMP_STYLE}>
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
        {request && <RequestLink request={request} onOpen={onOpenRequest} />}
        <WorkSummary stats={intervention.stats} />
      </Flex>

      {canDelete && (
        <DeleteInterventionDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          code={intervention.code}
          onConfirm={onDelete}
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
  isDeletable: PropTypes.bool,
  onDelete: PropTypes.func,
};
