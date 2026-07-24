/**
 * @fileoverview Détail d'une demande d'intervention avec historique et transitions de statut
 * @module components/intervention-requests/InterventionRequestDetail
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { AlertDialog, Badge, Box, Button, Callout, Flex, Separator, Spinner, Text } from '@radix-ui/themes';
import { AlertCircle, Ban, Bot, Clock, Trash2, User, Wrench, Zap, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { TYPE_INTER_LABELS } from '@/config/interventionTypes';
import { useInterventionRequestDetail } from '@/hooks/intervention-requests/useInterventionRequestDetail';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

/**
 * Transitions autorisées par statut (source : doc API /intervention-requests/{id}/transition).
 * Seul le rejet est piloté manuellement — l'acceptation résulte uniquement de la création
 * d'une intervention liée (voir InterventionCreateModal), jamais d'un clic direct ici.
 */
const TRANSITIONS = {
  nouvelle:   [{ to: 'rejetee', label: 'Rejeter', color: 'red', requiresNotes: true }],
  en_attente: [{ to: 'rejetee', label: 'Rejeter', color: 'red', requiresNotes: true }],
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
      {equipement?.code && (
        equipement.id ? (
          <Link to={`/equipements/${equipement.id}`} style={{ textDecoration: 'none' }}>
            <Badge color="gray" variant="soft" size="1" style={{ cursor: 'pointer' }}>
              {equipement.code}
            </Badge>
          </Link>
        ) : (
          <Badge color="gray" variant="soft" size="1">{equipement.code}</Badge>
        )
      )}
      <Text size="2" color="gray">{equipement?.name ?? '—'}</Text>
    </Flex>
  );
}
EquipementLabel.propTypes = { equipement: PropTypes.object };

// Dialog de suppression — réservé aux erreurs de saisie / doublons
function DeleteRequestDialog({ code, deleting, deleteError, onConfirm }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button size="1" variant="soft" color="crimson" title="Supprimer (erreur de saisie, doublon)">
          <Trash2 size={13} />Supprimer
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Supprimer la demande</AlertDialog.Title>
        <AlertDialog.Description>
          Confirmer la suppression définitive de <strong>{code}</strong> ? À réserver aux erreurs de saisie ou doublons — cette action est irréversible.
        </AlertDialog.Description>
        {deleteError && (
          <Callout.Root color="red" size="1" mt="2">
            <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
            <Callout.Text>{deleteError}</Callout.Text>
          </Callout.Root>
        )}
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Annuler</Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action onClick={(e) => { e.preventDefault(); onConfirm(); }}>
            <Button color="red" disabled={deleting}>
              {deleting && <Spinner size="1" />}Supprimer
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
DeleteRequestDialog.propTypes = {
  code: PropTypes.string,
  deleting: PropTypes.bool,
  deleteError: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
};

// Zone d'actions en en-tête — Rejeter (transition) et Supprimer (doublon) côte à côte
function RequestHeaderActions({ statut, code, transitioning, transitionError, onTransition, canDelete, deleting, deleteError, onDelete }) {
  const canReject = (TRANSITIONS[statut] ?? []).length > 0;

  // Pas de modal custom : le motif de rejet EST la raison d'audit (reason_text). Le backend
  // n'est plus silencieux pour cette entité (voir _SILENT_FIELDS_BY_ENTITY["request"]), donc
  // l'audit guard global (Layout.jsx) affiche son propre popup de raison, la collecte, et
  // rejoue cette même requête — un seul flux, un seul endroit où saisir le motif.
  const handleRejectClick = async () => {
    try {
      await onTransition('rejetee', {});
    } catch { /* transitionError affiché via le callout ci-dessous, ou popup annulé */ }
  };

  return (
    <Flex direction="column" align="end" gap="1">
      <Flex align="center" gap="2">
        {canReject && (
          <Button size="1" variant="soft" color="orange" disabled={transitioning} onClick={handleRejectClick}>
            {transitioning ? <Spinner size="1" /> : <Ban size={13} />}Rejeter
          </Button>
        )}
        {canDelete && (
          <DeleteRequestDialog code={code} deleting={deleting} deleteError={deleteError} onConfirm={onDelete} />
        )}
      </Flex>
      {transitionError && (
        <Callout.Root color="red" size="1">
          <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
          <Callout.Text>{transitionError}</Callout.Text>
        </Callout.Root>
      )}
    </Flex>
  );
}
RequestHeaderActions.propTypes = {
  statut: PropTypes.string.isRequired,
  code: PropTypes.string,
  transitioning: PropTypes.bool,
  transitionError: PropTypes.string,
  onTransition: PropTypes.func.isRequired,
  canDelete: PropTypes.bool,
  deleting: PropTypes.bool,
  deleteError: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
};

// Bloc Qui (demandeur) / Quoi (description) côte à côte
function RequestWhoWhat({ detail }) {
  return (
    <Flex gap="4" mb="3" wrap="wrap">
      <Box style={{ flex: '1 1 200px', minWidth: 180 }}>
        <Flex gap="2" align="center" mb="1">
          <User size={14} color="var(--gray-9)" />
          <Text size="2" weight="medium">{detail.demandeur_nom}</Text>
        </Flex>
        {(detail.service?.label || detail.demandeur_service) && (
          <Text size="2" color="gray" style={{ paddingLeft: 22, display: 'block' }}>
            {detail.service?.label ?? detail.demandeur_service}
          </Text>
        )}
        {detail.is_system && (
          <Flex gap="2" align="center" mt="1" style={{ paddingLeft: 22 }}>
            <Bot size={13} color="var(--gray-9)" />
            <Text size="1" color="gray">Générée automatiquement — moteur préventif</Text>
          </Flex>
        )}
      </Box>

      <Box style={{ flex: '2 1 280px', minWidth: 220 }}>
        <Box p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-4)' }}>
          <Text size="2">{detail.description}</Text>
        </Box>
        {detail.suggested_type_inter && (
          <Flex gap="2" align="center" mt="2">
            <Text size="1" color="gray">Type suggéré</Text>
            <Badge color="blue" variant="soft" size="1">
              {TYPE_INTER_LABELS[detail.suggested_type_inter] ?? detail.suggested_type_inter}
            </Badge>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
RequestWhoWhat.propTypes = { detail: PropTypes.object.isRequired };

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {string} props.requestId - UUID de la demande à afficher
 * @param {Function} [props.onTransitionDone] - Appelé après une transition réussie
 * @param {Function} [props.onDeleted] - Appelé après une suppression réussie
 */
export default function InterventionRequestDetail({ requestId, onTransitionDone, onDeleted }) {
  const { detail, loading, error, transitioning, transitionError, doTransition, deleting, deleteError, doDelete } =
    useInterventionRequestDetail(requestId);

  const handleTransition = async (statusTo, extraData = {}) => {
    await doTransition(statusTo, extraData);
    onTransitionDone?.();
  };

  const handleDelete = async () => {
    await doDelete();
    onDeleted?.();
  };

  if (loading) return <LoadingState message="Chargement de la demande..." />;
  if (error) return <ErrorState error={error} />;
  if (!detail) return null;

  const canDelete = !detail.intervention_id;

  return (
    <Box p="3">
      <Flex justify="between" align="start" mb="3">
        <Flex align="center" gap="2">
          <Text size="3" weight="bold">{detail.code}</Text>
          <StatusBadge label={detail.statut_label} color={detail.statut_color} />
          <EquipementLabel equipement={detail.equipement} />
        </Flex>
        <Flex align="center" gap="3" wrap="wrap" justify="end">
          <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>{formatDate(detail.created_at)}</Text>
          <RequestHeaderActions
            statut={detail.statut}
            code={detail.code}
            transitioning={transitioning}
            transitionError={transitionError}
            onTransition={handleTransition}
            canDelete={canDelete}
            deleting={deleting}
            deleteError={deleteError}
            onDelete={handleDelete}
          />
        </Flex>
      </Flex>

      <Separator size="4" mb="3" />

      <RequestWhoWhat detail={detail} />

      <Separator size="4" mb="3" />

      <Box mb="1">
        {detail.intervention_id && (
          <InterventionProgress iv={detail.intervention ?? null} interventionId={detail.intervention_id} />
        )}

        {detail.status_log?.length > 0 && (
          <>
            <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Historique</Text>
            <Flex direction="column">
              {[...detail.status_log].reverse().map((entry, idx) => (
                <StatusLogEntry key={entry.id} entry={entry} isFirst={idx === 0} />
              ))}
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
}

InterventionRequestDetail.propTypes = {
  requestId: PropTypes.string.isRequired,
  onTransitionDone: PropTypes.func,
  onDeleted: PropTypes.func,
};
