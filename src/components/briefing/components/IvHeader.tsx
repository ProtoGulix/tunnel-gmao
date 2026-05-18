import { Flex, Text, Badge, Button } from '@radix-ui/themes';
import { Clock, ExternalLink, Package, ClipboardList, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATE_COLORS } from '@/config/interventionTypes';
import { formatDueDate } from '@/hooks/useInterventionUrgency';
import AuditReasonDialog from '@/components/ui/AuditReasonDialog';
import { ProgressBar } from './ProgressBar';
import type { BriefingSituation, InterventionDetail } from '@/types/briefing';

const STATUS_ORDER = ['ouvert', 'attente_pieces', 'attente_prod', 'ferme'] as const;

interface IvHeaderProps {
  situation: BriefingSituation;
  detail: InterventionDetail | null;
  currentStatus: string;
  statusCfg: { color: string; label: string } | undefined;
  priorityCfg: { color: string; label: string } | undefined;
  typeLabel: string;
  actionCount: number;
  totalTime: number;
  purchaseCount: number;
  completionPct: number;
  hasTasks: boolean;
  criticalTask: { label?: string } | null | undefined;
  urgency: { level: string; color: string };
  openFmt: string | null;
  closeFmt: string | null;
  daysOpen: number;
  onSelectStatus: (s: string) => void;
  pendingStatus: string | null;
  onClosePending: () => void;
  onConfirmStatus: (reason: { reason_code: string; reason_text?: string | null }) => void;
  statusSaving: boolean;
}

export function IvHeader({
  situation, detail, currentStatus, statusCfg, priorityCfg, typeLabel,
  actionCount, totalTime, purchaseCount, completionPct, hasTasks,
  criticalTask, urgency, openFmt, closeFmt, daysOpen, onSelectStatus,
  pendingStatus, onClosePending, onConfirmStatus, statusSaving,
}: IvHeaderProps) {
  const pendingCfg = pendingStatus ? STATE_COLORS[pendingStatus as keyof typeof STATE_COLORS] : null;

  return (
    <>
      <AuditReasonDialog
        open={!!pendingStatus}
        entityType="intervention"
        title="Changer le statut"
        description={pendingCfg ? `Passer vers ${pendingCfg.label}` : undefined}
        saving={statusSaving}
        onCancel={onClosePending}
        onConfirm={onConfirmStatus}
      />

      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-4)', flexShrink: 0 }}>

        <Flex align="center" gap="2" mb="2" wrap="wrap">
          <Link to={`/intervention/${situation.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Badge variant="outline" color="gray" size="2" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
              {situation.code}
            </Badge>
          </Link>
          {statusCfg   && <Badge size="1" color={statusCfg.color   as never} variant="soft">{statusCfg.label}</Badge>}
          {priorityCfg && <Badge size="1" color={priorityCfg.color as never} variant="soft">{priorityCfg.label}</Badge>}
          <Badge size="1" color="gray" variant="soft">{typeLabel}</Badge>
          <Link to={`/intervention/${situation.id}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <Button size="1" variant="ghost" color="gray"><ExternalLink size={13} /></Button>
          </Link>
        </Flex>

        <Text size="3" weight="bold" style={{ display: 'block', color: 'var(--gray-12)', marginBottom: 2 }}>
          {situation.title}
        </Text>

        <Flex align="center" gap="3" wrap="wrap">
          {situation.machine && (
            <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
              {situation.machine.code} — {situation.machine.name}
            </Text>
          )}
          {openFmt && (
            <Text size="1" color="gray">
              Ouvert {openFmt}{closeFmt ? ` • Fermé ${closeFmt}` : ` • ${daysOpen}j`}
            </Text>
          )}
        </Flex>

        {detail?.request && (
          <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--gray-2)', borderRadius: 6, border: '1px solid var(--gray-4)' }}>
            <Flex align="center" gap="2" mb="1">
              <ClipboardList size={12} color="var(--gray-9)" style={{ flexShrink: 0 }} />
              <Text size="1" weight="bold" style={{ color: 'var(--gray-12)', fontFamily: 'monospace' }}>{detail.request.code}</Text>
              {detail.request.statutLabel && (
                <Badge size="1" variant="soft" style={{ background: (detail.request.statutColor ?? '#9ca3af') + '22', color: detail.request.statutColor ?? 'var(--gray-10)' }}>
                  {detail.request.statutLabel}
                </Badge>
              )}
              {detail.request.createdAt && (
                <Text size="1" color="gray" style={{ marginLeft: 'auto', fontFamily: 'monospace', flexShrink: 0 }}>
                  {new Date(detail.request.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </Text>
              )}
            </Flex>
            {detail.request.description && (
              <Text size="1" style={{ color: 'var(--gray-11)', display: 'block' }}>{detail.request.description}</Text>
            )}
            <Flex align="center" gap="2" mt="1" style={{ flexWrap: 'wrap' }}>
              {detail.request.demandeurNom && <Text size="1" color="gray">{detail.request.demandeurNom}</Text>}
              {detail.request.demandeurService && <Badge size="1" variant="outline" color="gray">{detail.request.demandeurService}</Badge>}
            </Flex>
          </div>
        )}

        <Flex align="center" gap="3" mt="2" style={{ flexWrap: 'wrap' }}>
          <Flex align="center" gap="1">
            <Clock size={12} color="var(--gray-9)" />
            <Text size="1" color="gray">
              <strong>{actionCount}</strong> action{actionCount !== 1 ? 's' : ''} · <strong>{totalTime}h</strong>
            </Text>
          </Flex>
          {(purchaseCount ?? 0) > 0 && (
            <Flex align="center" gap="1">
              <Package size={12} color="var(--orange-9)" />
              <Text size="1" style={{ color: 'var(--orange-11)' }}><strong>{purchaseCount}</strong> DA en attente</Text>
            </Flex>
          )}
          {situation.techInitials && (
            <Badge size="1" variant="soft" color="gray" style={{ fontFamily: 'monospace' }}>{situation.techInitials}</Badge>
          )}
        </Flex>

        <Flex gap="1" mt="3" style={{ flexWrap: 'wrap' }}>
          {STATUS_ORDER.map((s) => {
            const scfg = STATE_COLORS[s];
            const isActive = currentStatus === s;
            return (
              <button key={s} type="button" disabled={isActive}
                onClick={() => { if (!isActive) onSelectStatus(s); }}
                style={{
                  flex: 1, padding: '5px 8px', fontSize: 11,
                  fontWeight: isActive ? 700 : 500, borderRadius: 6,
                  border: isActive ? 'none' : '1px solid var(--gray-5)',
                  cursor: isActive ? 'default' : 'pointer',
                  background: isActive ? scfg.activeBg : scfg.inactiveBg,
                  color: isActive ? scfg.textActive : scfg.textInactive,
                  transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {scfg.label}
              </button>
            );
          })}
        </Flex>

        {hasTasks && (
          <div style={{ marginTop: 10 }}>
            <ProgressBar percentage={completionPct} label="Avancement" />
          </div>
        )}

        {situation.next_due_date && (
          <Flex align="center" gap="2" mt="2" style={{
            padding: '6px 10px',
            background: urgency.level === 'overdue' ? 'var(--red-2)' : urgency.level === 'urgent' ? 'var(--orange-2)' : 'var(--blue-2)',
            borderRadius: 6, borderLeft: `3px solid ${urgency.color}`,
          }}>
            <Target size={13} style={{ color: urgency.color, flexShrink: 0 }} />
            <Flex direction="column" gap="0" style={{ flex: 1, minWidth: 0 }}>
              {criticalTask?.label && (
                <Text size="1" weight="bold" style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {criticalTask.label}
                </Text>
              )}
              <Text size="1" weight="medium" style={{ color: urgency.color }}>
                Due : {formatDueDate(situation.next_due_date)}
                {urgency.level === 'overdue' && ' — EN RETARD'}
              </Text>
            </Flex>
          </Flex>
        )}
      </div>
    </>
  );
}
