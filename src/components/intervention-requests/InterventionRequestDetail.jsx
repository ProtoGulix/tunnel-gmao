/**
 * @fileoverview Détail d'une demande d'intervention avec historique et transitions de statut
 * @module components/intervention-requests/InterventionRequestDetail
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, Callout, Flex, Select, Separator, Spinner, Text, TextArea, TextField } from '@radix-ui/themes';
import { AlertCircle, Bot, Clock, User, Wrench, Zap, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { INTERVENTION_TYPES, TYPE_INTER_LABELS } from '@/config/interventionTypes';
import { useInterventionRequestDetail } from '@/hooks/intervention-requests/useInterventionRequestDetail';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

/** Transitions autorisées par statut (source : doc API /intervention-requests/{id}/transition) */
const TRANSITIONS = {
  nouvelle:   [{ to: 'en_attente', label: 'Mettre en attente', color: 'amber' }, { to: 'acceptee', label: 'Accepter', color: 'green', requiresAcceptanceForm: true }, { to: 'rejetee', label: 'Rejeter', color: 'red', requiresNotes: true }],
  en_attente: [{ to: 'acceptee', label: 'Accepter', color: 'green', requiresAcceptanceForm: true }, { to: 'rejetee', label: 'Rejeter', color: 'red', requiresNotes: true }],
  acceptee:   [{ to: 'cloturee', label: 'Clôturer', color: 'blue' }],
};

const PRIORITY_OPTIONS = [
  { value: 'urgent',    label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'normale',   label: 'Normal' },
  { value: 'faible',    label: 'Faible' },
];

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

// Formulaire d'acceptation — collecte type_inter, tech_initials, priority, reported_date
function AcceptanceForm({ request, onConfirm, onCancel, transitioning, transitionError }) {
  const isSystemLocked = !!(request?.is_system && request?.suggested_type_inter);
  const [typeInter, setTypeInter] = useState(request?.suggested_type_inter || 'CUR');
  const [techInitials, setTechInitials] = useState('');
  const [priority, setPriority] = useState('normale');
  const [reportedDate, setReportedDate] = useState('');
  const effectiveTypeInter = isSystemLocked ? request.suggested_type_inter : typeInter;
  const canSubmit = effectiveTypeInter && techInitials.trim();
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="medium">Acceptation de la demande</Text>
      <Box>
        <Text as="label" size="2" weight="medium">
          Type d&apos;intervention{!isSystemLocked && <Text as="span" color="red"> *</Text>}
        </Text>
        {isSystemLocked ? (
          <Flex align="center" gap="2" mt="1">
            <Badge color="blue" variant="soft">
              {TYPE_INTER_LABELS[request.suggested_type_inter] ?? request.suggested_type_inter}
            </Badge>
            <Text size="1" color="gray">imposé par la demande système, non modifiable</Text>
          </Flex>
        ) : (
          <>
            <Select.Root value={typeInter} onValueChange={setTypeInter}>
              <Select.Trigger style={{ width: '100%', marginTop: '0.25rem' }} />
              <Select.Content>
                {INTERVENTION_TYPES.map((t) => (
                  <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            {request?.suggested_type_inter && (
              <Text size="1" color="gray" style={{ display: 'block', marginTop: '0.25rem' }}>
                Type suggéré à la création — modifiable
              </Text>
            )}
          </>
        )}
      </Box>
      <Box>
        <Text as="label" size="2" weight="medium">Initiales technicien <Text as="span" color="red">*</Text></Text>
        <TextField.Root
          placeholder="Ex : QC"
          value={techInitials}
          onChange={(e) => setTechInitials(e.target.value)}
          maxLength={5}
          style={{ marginTop: '0.25rem' }}
        />
      </Box>
      <Box>
        <Text as="label" size="2" weight="medium">Priorité</Text>
        <Select.Root value={priority} onValueChange={setPriority}>
          <Select.Trigger style={{ width: '100%', marginTop: '0.25rem' }} />
          <Select.Content>
            {PRIORITY_OPTIONS.map((p) => (
              <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>
      <Box>
        <Text as="label" size="2" weight="medium">Date de signalement</Text>
        <TextField.Root
          type="date"
          value={reportedDate}
          onChange={(e) => setReportedDate(e.target.value)}
          style={{ marginTop: '0.25rem' }}
        />
      </Box>
      {transitionError && (
        <Callout.Root color="red" size="1">
          <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
          <Callout.Text>{transitionError}</Callout.Text>
        </Callout.Root>
      )}
      <Flex gap="2" mt="1">
        <Button size="2" color="green" disabled={transitioning || !canSubmit}
          onClick={() => onConfirm({ typeInter: effectiveTypeInter, techInitials, priority, reportedDate: reportedDate || null })}>
          {transitioning && <Spinner size="1" />}Accepter
        </Button>
        <Button size="2" variant="ghost" color="gray" onClick={onCancel}>Annuler</Button>
      </Flex>
    </Flex>
  );
}
AcceptanceForm.propTypes = { request: PropTypes.object, onConfirm: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired, transitioning: PropTypes.bool, transitionError: PropTypes.string };

// Zone de transition de statut — encapsule son propre état interim
function TransitionZone({ statut, request, transitioning, transitionError, onTransition }) {
  const [showRejection, setShowRejection] = useState(false);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const available = TRANSITIONS[statut] ?? [];
  if (available.length === 0) return null;

  const handleClick = (t) => {
    if (t.requiresNotes) { setShowRejection(true); }
    else if (t.requiresAcceptanceForm) { setShowAcceptance(true); }
    else { onTransition(t.to, {}); }
  };

  if (showRejection) {
    return <RejectionForm onConfirm={(n) => { setShowRejection(false); onTransition('rejetee', { notes: n }); }} onCancel={() => setShowRejection(false)} transitioning={transitioning} />;
  }

  if (showAcceptance) {
    return (
      <AcceptanceForm
        request={request}
        transitionError={transitionError}
        onConfirm={async (d) => {
          try {
            await onTransition('acceptee', d);
            setShowAcceptance(false);
          } catch { /* transitionError affiché inline */ }
        }}
        onCancel={() => setShowAcceptance(false)}
        transitioning={transitioning}
      />
    );
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
TransitionZone.propTypes = { statut: PropTypes.string.isRequired, request: PropTypes.object, transitioning: PropTypes.bool, transitionError: PropTypes.string, onTransition: PropTypes.func.isRequired };

const PRIORITY_LABEL = { urgent: 'Urgent', important: 'Important', normale: 'Normal', faible: 'Faible' };
const PRIORITY_COLOR = { urgent: 'var(--red-11)', important: 'var(--orange-11)', normale: 'var(--gray-11)', faible: 'var(--gray-9)' };

function InterventionProgress({ iv, interventionId }) {
  if (!iv && !interventionId) return null;

  return (
    <Box mb="3" p="3" style={{ backgroundColor: 'var(--blue-2)', borderRadius: 'var(--radius-2)', border: '1px solid var(--blue-5)' }}>
      <Flex justify="between" align="start" mb="2">
        <Flex align="center" gap="2">
          <Wrench size={14} color="var(--blue-9)" />
          <Text size="2" weight="bold" style={{ color: 'var(--blue-11)' }}>Intervention liée</Text>
        </Flex>
        {interventionId && (
          <Button size="1" variant="ghost" color="blue" asChild>
            <Link to={`/intervention/${interventionId}`} style={{ textDecoration: 'none' }}>
              Ouvrir <ArrowUpRight size={12} />
            </Link>
          </Button>
        )}
      </Flex>

      {iv ? (
        <>
          {/* Code + type + priorité + statut */}
          <Flex align="center" gap="2" wrap="wrap" mb="2">
            <Text size="2" weight="bold" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--blue-11)' }}>
              {iv.code}
            </Text>
            {iv.type_inter && (
              <Badge size="1" variant="soft" color="blue">
                {TYPE_INTER_LABELS[iv.type_inter] ?? iv.type_inter}
              </Badge>
            )}
            {iv.status_label && (
              <Badge size="1" variant="soft"
                style={{ backgroundColor: (iv.status_color || '#888') + '22', color: iv.status_color || '#888' }}>
                {iv.status_label}
              </Badge>
            )}
            {iv.priority && iv.priority !== 'normale' && (
              <Text size="1" weight="medium" style={{ color: PRIORITY_COLOR[iv.priority] }}>
                {PRIORITY_LABEL[iv.priority] ?? iv.priority}
              </Text>
            )}
          </Flex>

          {/* Tech + date */}
          <Flex gap="3" align="center" mb="2" wrap="wrap">
            {iv.tech_initials && (
              <Flex align="center" gap="1">
                <User size={11} color="var(--gray-9)" />
                <Text size="1" color="gray">Tech : {iv.tech_initials}</Text>
              </Flex>
            )}
            {iv.reported_date && (
              <Flex align="center" gap="1">
                <Clock size={11} color="var(--gray-9)" />
                <Text size="1" color="gray">Signalé le {new Date(iv.reported_date).toLocaleDateString('fr-FR')}</Text>
              </Flex>
            )}
          </Flex>

          {/* Stats */}
          {iv.stats && (
            <Flex gap="4" align="center" style={{ borderTop: '1px solid var(--blue-4)', paddingTop: 8 }}>
              <Flex align="center" gap="1">
                <Zap size={12} color="var(--gray-9)" />
                <Text size="1" color="gray" weight="medium">{iv.stats.action_count ?? 0}</Text>
                <Text size="1" color="gray">action{(iv.stats.action_count ?? 0) > 1 ? 's' : ''}</Text>
              </Flex>
              <Flex align="center" gap="1">
                <Clock size={12} color="var(--gray-9)" />
                <Text size="1" color="gray" weight="medium">{iv.stats.total_time ?? 0}h</Text>
                <Text size="1" color="gray">passées</Text>
              </Flex>
              {(iv.stats.purchase_count ?? 0) > 0 && (
                <Flex align="center" gap="1">
                  <ShoppingCart size={12} color="var(--gray-9)" />
                  <Text size="1" color="gray" weight="medium">{iv.stats.purchase_count}</Text>
                  <Text size="1" color="gray">commande{iv.stats.purchase_count > 1 ? 's' : ''}</Text>
                </Flex>
              )}
            </Flex>
          )}
        </>
      ) : (
        <Text size="1" color="gray">Identifiant : {interventionId}</Text>
      )}
    </Box>
  );
}

InterventionProgress.propTypes = {
  iv: PropTypes.shape({
    code: PropTypes.string,
    type_inter: PropTypes.string,
    priority: PropTypes.string,
    status_label: PropTypes.string,
    status_color: PropTypes.string,
    tech_initials: PropTypes.string,
    reported_date: PropTypes.string,
    stats: PropTypes.shape({
      action_count: PropTypes.number,
      total_time: PropTypes.number,
      purchase_count: PropTypes.number,
    }),
  }),
  interventionId: PropTypes.string,
};

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

  const handleTransition = async (statusTo, extraData = {}) => {
    await doTransition(statusTo, extraData);
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

      <Box mb="2">
        <Flex gap="2" align="center" mb="1">
          <User size={14} color="var(--gray-9)" />
          <Text size="2" weight="medium">{detail.demandeur_nom}</Text>
          {(detail.service?.label || detail.demandeur_service) && (
            <Text size="2" color="gray">— {detail.service?.label ?? detail.demandeur_service}</Text>
          )}
        </Flex>
        {detail.is_system && (
          <Flex gap="2" align="center" mb="1" style={{ paddingLeft: 22 }}>
            <Bot size={13} color="var(--gray-9)" />
            <Text size="1" color="gray">Générée automatiquement — moteur préventif</Text>
          </Flex>
        )}
        {detail.suggested_type_inter && (
          <Flex gap="2" align="center" style={{ paddingLeft: 22 }}>
            <Text size="1" color="gray" style={{ minWidth: 80 }}>Type suggéré</Text>
            <Badge color="blue" variant="soft" size="1">
              {TYPE_INTER_LABELS[detail.suggested_type_inter] ?? detail.suggested_type_inter}
            </Badge>
          </Flex>
        )}
      </Box>

      <Box mb="3" p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-4)' }}>
        <Text size="2">{detail.description}</Text>
      </Box>

      {detail.intervention_id && (
        <InterventionProgress iv={detail.intervention ?? null} interventionId={detail.intervention_id} />
      )}

      <Box mb="3">
        <TransitionZone
          statut={detail.statut}
          request={detail}
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
