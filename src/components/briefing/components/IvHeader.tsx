import React from 'react';
import { Flex, Text, Badge, Select } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { STATE_COLORS, PRIORITY_COLORS } from '@/config/interventionTypes';
import type { BriefingSituation, InterventionDetail } from '@/types/briefing';
import { IvBlock, DiBlock, DiEmptyBlock, DueBanner, ChainIcon } from './IvHeaderBlocks';

const STATUS_ORDER = ['ouvert', 'attente_pieces', 'attente_prod', 'ferme'] as const;
const PRIORITY_ORDER = ['urgent', 'important', 'normal', 'faible'] as const;

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
  criticalTask: { label?: string } | null | undefined;
  urgency: { level: string; color: string };
  openFmt: string | null;
  closeFmt: string | null;
  daysOpen: number;
  onSelectStatus: (s: string) => void;
  statusSaving: boolean;
  currentPriority: string;
  onSelectPriority: (p: string) => void;
}

export function MachineTitle({ machine }: { machine: BriefingSituation['machine'] }) {
  if (!machine) return null;
  return (
    <Flex align="center" gap="3" style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-4)', background: 'var(--gray-3)' }}>
      <Badge size="3" variant="solid" color="gray" style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.06em', flexShrink: 0 }}>
        {machine.code}
      </Badge>
      {machine.name && (
        <Text size="4" weight="medium" style={{ color: 'var(--gray-12)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {machine.name}
        </Text>
      )}
      {machine.id && (
        <Link to={`/equipements/${machine.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'var(--gray-10)', flexShrink: 0, fontSize: 13 }}>
          <ExternalLink size={13} />
          Fiche équipement
        </Link>
      )}
    </Flex>
  );
}

const triggerStyle = (color: string): React.CSSProperties => ({
  background: color + '22', border: `1px solid ${color}44`, color, fontWeight: 600,
});

function IvSelectors({ currentStatus, onSelectStatus, statusSaving, currentPriority, onSelectPriority }: {
  currentStatus: string; onSelectStatus: (s: string) => void; statusSaving: boolean;
  currentPriority: string; onSelectPriority: (p: string) => void;
}) {
  const normalizedPriority = currentPriority === 'normale' ? 'normal' : currentPriority;
  const statusColor   = STATE_COLORS[currentStatus as keyof typeof STATE_COLORS]?.activeBg ?? 'var(--gray-9)';
  const priorityColor = PRIORITY_COLORS[normalizedPriority as keyof typeof PRIORITY_COLORS]?.activeBg ?? 'var(--gray-9)';

  return (
    <div style={{ padding: '8px 0 12px' }}>
      <Text size="1" color="gray" style={{ display: 'block', marginBottom: 6 }}>Mise à jour</Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '6px 8px' }}>
        <Text size="2" color="gray" style={{ textAlign: 'right' }}>État</Text>
        <Select.Root value={currentStatus} onValueChange={onSelectStatus} size="2" disabled={statusSaving}>
          <Select.Trigger style={triggerStyle(statusColor)} />
          <Select.Content>
            {STATUS_ORDER.map((s) => (
              <Select.Item key={s} value={s}>{STATE_COLORS[s].label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Text size="2" color="gray" style={{ textAlign: 'right' }}>Priorité</Text>
        <Select.Root value={normalizedPriority} onValueChange={onSelectPriority} size="2">
          <Select.Trigger style={triggerStyle(priorityColor)} />
          <Select.Content>
            {PRIORITY_ORDER.map((p) => (
              <Select.Item key={p} value={p}>{PRIORITY_COLORS[p].label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  );
}

export function IvHeader({
  situation, detail, currentStatus, statusCfg, priorityCfg, typeLabel,
  actionCount, totalTime, purchaseCount, criticalTask, urgency,
  openFmt, closeFmt, daysOpen, onSelectStatus, statusSaving,
  currentPriority, onSelectPriority,
}: IvHeaderProps) {
  const req = detail?.request ?? null;

  return (
    <div style={{ flexShrink: 0, borderBottom: '1px solid var(--gray-4)' }}>
      <MachineTitle machine={situation.machine} />
      <div style={{ position: 'relative', padding: '10px 14px 0' }}>
        <ChainIcon linked={!!req} />
        <Flex gap="2" style={{ marginBottom: 6 }}>
          <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'center', color: 'var(--gray-11)' }}>Demande</Text>
          <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'center', color: 'var(--gray-11)' }}>Intervention</Text>
        </Flex>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          {req ? <DiBlock req={req} /> : <DiEmptyBlock />}
          <IvBlock
            situation={situation} typeLabel={typeLabel}
            statusCfg={statusCfg} priorityCfg={priorityCfg}
            actionCount={actionCount} totalTime={totalTime} purchaseCount={purchaseCount}
            openFmt={openFmt} closeFmt={closeFmt} daysOpen={daysOpen}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div />
          <IvSelectors
            currentStatus={currentStatus} onSelectStatus={onSelectStatus} statusSaving={statusSaving}
            currentPriority={currentPriority} onSelectPriority={onSelectPriority}
          />
        </div>
      </div>
      <DueBanner situation={situation} urgency={urgency} criticalTask={criticalTask} />
    </div>
  );
}
