/**
 * @fileoverview Détail d'une demande d'intervention avec historique et transitions de statut
 * @module components/intervention-requests/InterventionRequestDetail
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Callout, Flex, Separator, Spinner, Text, TextArea } from '@radix-ui/themes';
import { AlertCircle, Clock, User } from 'lucide-react';
import { useInterventionRequestDetail } from '@/hooks/intervention-requests/useInterventionRequestDetail';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

/** Transitions autorisées par statut (source : doc API /intervention-requests/{id}/transition) */
const TRANSITIONS = {
  nouvelle:   [{ to: 'en_attente', label: 'Mettre en attente', color: 'amber' }, { to: 'acceptee', label: 'Accepter', color: 'green' }, { to: 'rejetee', label: 'Rejeter', color: 'red', requiresNotes: true }],
  en_attente: [{ to: 'acceptee', label: 'Accepter', color: 'green' }, { to: 'rejetee', label: 'Rejeter', color: 'red', requiresNotes: true }],
  acceptee:   [{ to: 'cloturee', label: 'Clôturer', color: 'blue' }],
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ label, color }) {
  return (
    <Badge style={{ backgroundColor: color + '22', color }} variant="soft" radius="full">
      {label}
    </Badge>
  );
}

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

function StatusLogEntry({ entry, isFirst }) {
  return (
    <Flex gap="3" align="start">
      <Flex direction="column" align="center" gap="1" style={{ minWidth: 24 }}>
        <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.status_to_color || 'var(--gray-7)', marginTop: 4 }} />
        {!isFirst && <Box style={{ width: 1, flex: 1, backgroundColor: 'var(--gray-5)', minHeight: 16 }} />}
      </Flex>
      <Flex direction="column" gap="1" pb="2" style={{ flex: 1 }}>
        <Flex gap="2" align="center">
          {entry.status_from_label && <><Text size="1" color="gray">{entry.status_from_label}</Text><Text size="1" color="gray">→</Text></>}
          <Text size="1" weight="medium" style={{ color: entry.status_to_color || 'var(--gray-12)' }}>{entry.status_to_label}</Text>
        </Flex>
        <Flex gap="2" align="center"><Clock size={10} color="var(--gray-9)" /><Text size="1" color="gray">{formatDate(entry.date)}</Text></Flex>
        {entry.notes && <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>{entry.notes}</Text>}
      </Flex>
    </Flex>
  );
}
StatusLogEntry.propTypes = {
  entry: PropTypes.shape({ status_from_label: PropTypes.string, status_to_label: PropTypes.string.isRequired, status_to_color: PropTypes.string, date: PropTypes.string.isRequired, notes: PropTypes.string }).isRequired,
  isFirst: PropTypes.bool,
};

// Formulaire de rejet (notes obligatoires)
function RejectionForm({ onConfirm, onCancel, transitioning }) {
  const [notes, setNotes] = useState('');
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="medium">Motif de rejet <Text as="span" color="red">*</Text></Text>
      <TextArea placeholder="Expliquer la raison du rejet…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      <Flex gap="2">
        <Button size="2" color="red" disabled={transitioning || !notes.trim()} onClick={() => onConfirm(notes)}>
          {transitioning && <Spinner size="1" />}Confirmer le rejet
        </Button>
        <Button size="2" variant="ghost" color="gray" onClick={onCancel}>Annuler</Button>
      </Flex>
    </Flex>
  );
}
RejectionForm.propTypes = { onConfirm: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired, transitioning: PropTypes.bool };

// Zone de transition de statut — encapsule son propre état interim
function TransitionZone({ statut, transitioning, transitionError, onTransition }) {
  const [showRejection, setShowRejection] = useState(false);
  const available = TRANSITIONS[statut] ?? [];
  if (available.length === 0) return null;

  const handleClick = (t) => {
    if (t.requiresNotes) { setShowRejection(true); } else { onTransition(t.to, ''); }
  };

  if (showRejection) {
    return <RejectionForm onConfirm={(n) => { setShowRejection(false); onTransition('rejetee', n); }} onCancel={() => setShowRejection(false)} transitioning={transitioning} />;
  }

  return (
    <Flex direction="column" gap="2">
      {transitionError && (
        <Callout.Root color="red" size="1">
          <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
          <Callout.Text>{transitionError}</Callout.Text>
        </Callout.Root>
      )}
      <Flex gap="2" wrap="wrap">
        {available.map((t) => (
          <Button key={t.to} size="2" color={t.color} variant="soft" disabled={transitioning} onClick={() => handleClick(t)}>
            {transitioning && <Spinner size="1" />}{t.label}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
TransitionZone.propTypes = { statut: PropTypes.string.isRequired, transitioning: PropTypes.bool, transitionError: PropTypes.string, onTransition: PropTypes.func.isRequired };

function EquipementLabel({ equipement }) {
  return (
    <Flex align="center" gap="2">
      {equipement?.code && <Badge color="gray" variant="soft" size="1">{equipement.code}</Badge>}
      <Text size="2" color="gray">{equipement?.name ?? '—'}</Text>
    </Flex>
  );
}
EquipementLabel.propTypes = { equipement: PropTypes.object };

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {string} props.requestId - UUID de la demande à afficher
 * @param {Function} [props.onTransitionDone] - Appelé après une transition réussie
 */
export default function InterventionRequestDetail({ requestId, onTransitionDone }) {
  const { detail, loading, error, transitioning, transitionError, doTransition } =
    useInterventionRequestDetail(requestId);

  const handleTransition = async (statusTo, notes) => {
    await doTransition(statusTo, notes);
    onTransitionDone?.();
  };

  if (loading) return <LoadingState message="Chargement de la demande..." />;
  if (error) return <ErrorState error={error} />;
  if (!detail) return null;

  return (
    <Box p="3">
      <Flex justify="between" align="start" mb="3">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Text size="3" weight="bold">{detail.code}</Text>
            <StatusBadge label={detail.statut_label} color={detail.statut_color} />
          </Flex>
          <EquipementLabel equipement={detail.equipement} />
        </Flex>
        <Text size="1" color="gray">{formatDate(detail.created_at)}</Text>
      </Flex>

      <Separator size="4" mb="3" />

      <Flex gap="2" align="center" mb="2">
        <User size={14} color="var(--gray-9)" />
        <Text size="2" weight="medium">{detail.demandeur_nom}</Text>
        {detail.demandeur_service && <Text size="2" color="gray">— {detail.demandeur_service}</Text>}
      </Flex>

      <Box mb="3" p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-4)' }}>
        <Text size="2">{detail.description}</Text>
      </Box>

      <Box mb="3">
        <TransitionZone
          statut={detail.statut}
          transitioning={transitioning}
          transitionError={transitionError}
          onTransition={handleTransition}
        />
      </Box>

      {detail.status_log?.length > 0 && (
        <>
          <Separator size="4" mb="3" />
          <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Historique</Text>
          <Flex direction="column">
            {[...detail.status_log].reverse().map((entry, idx) => (
              <StatusLogEntry key={entry.id} entry={entry} isFirst={idx === 0} />
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
}

InterventionRequestDetail.propTypes = {
  requestId: PropTypes.string.isRequired,
  onTransitionDone: PropTypes.func,
};
