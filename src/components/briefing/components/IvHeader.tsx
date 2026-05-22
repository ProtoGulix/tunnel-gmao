import { Flex, Text, Badge } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { ExternalLink, Link2 } from 'lucide-react';
import { STATE_COLORS } from '@/config/interventionTypes';
import AuditReasonDialog from '@/components/ui/AuditReasonDialog';
import type { BriefingSituation, InterventionDetail } from '@/types/briefing';
import { IvBlock, DiBlock, DueBanner, StatusBar } from './IvHeaderBlocks';

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
  pendingStatus: string | null;
  onClosePending: () => void;
  onConfirmStatus: (reason: { reason_code: string; reason_text?: string | null }) => void;
  statusSaving: boolean;
}

export function MachineTitle({ machine }: { machine: BriefingSituation['machine'] }) {
  if (!machine) return null;
  return (
    <Flex align="center" gap="2" style={{ padding: '6px 14px', borderBottom: '1px solid var(--gray-4)', background: 'var(--gray-2)' }}>
      <Badge size="2" variant="solid" color="gray" style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.04em', flexShrink: 0 }}>
        {machine.code}
      </Badge>
      {machine.name && (
        <Text size="2" style={{ color: 'var(--gray-11)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {machine.name}
        </Text>
      )}
      {machine.id && (
        <Link to={`/equipements/${machine.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'var(--gray-10)', flexShrink: 0, fontSize: 12 }}>
          <ExternalLink size={12} />
          Fiche équipement
        </Link>
      )}
    </Flex>
  );
}

export function IvHeader({
  situation, detail, currentStatus, statusCfg, priorityCfg, typeLabel,
  actionCount, totalTime, purchaseCount,
  criticalTask, urgency, openFmt, closeFmt, daysOpen, onSelectStatus,
  pendingStatus, onClosePending, onConfirmStatus, statusSaving,
}: IvHeaderProps) {
  const pendingCfg = pendingStatus ? STATE_COLORS[pendingStatus as keyof typeof STATE_COLORS] : null;
  const req = detail?.request ?? null;

  return (
    <>
      <AuditReasonDialog
        open={!!pendingStatus} entityType="intervention" reasons={undefined}
        title="Changer le statut"
        description={pendingCfg ? `Passer vers ${pendingCfg.label}` : undefined}
        saving={statusSaving} onCancel={onClosePending} onConfirm={onConfirmStatus}
      />
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--gray-4)' }}>
        {/* Titre équipement */}
        <MachineTitle machine={situation.machine} />
        {/* Deux blocs côte à côte */}
        <div style={{ position: 'relative', padding: '10px 14px', borderBottom: '1px solid var(--gray-4)' }}>
          {req && (
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', zIndex: 1, pointerEvents: 'none' }}>
              <Link2 size={22} style={{ color: 'var(--green-9)' }} />
            </div>
          )}
          {req && (
            <Flex gap="2" style={{ marginBottom: 6 }}>
              <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'center', color: 'var(--gray-11)' }}>Demande</Text>
              <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'center', color: 'var(--gray-11)' }}>Intervention</Text>
            </Flex>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: req ? '1fr 1fr' : '1fr', gap: 48 }}>
            {req && <DiBlock req={req} />}
            <IvBlock
              situation={situation} typeLabel={typeLabel}
              statusCfg={statusCfg} priorityCfg={priorityCfg}
              actionCount={actionCount} totalTime={totalTime} purchaseCount={purchaseCount}
              openFmt={openFmt} closeFmt={closeFmt} daysOpen={daysOpen}
            />
          </div>
        </div>
        <DueBanner situation={situation} urgency={urgency} criticalTask={criticalTask} />
        <StatusBar currentStatus={currentStatus} onSelectStatus={onSelectStatus} />
      </div>
    </>
  );
}
