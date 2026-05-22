import React from 'react';
import { Flex, Text, Badge, Button } from '@radix-ui/themes';
import { Bot, Clock, ClipboardList, ExternalLink, Package, Target, User, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATE_COLORS } from '@/config/interventionTypes';
import { formatDueDate } from '@/hooks/useInterventionUrgency';
import type { BriefingSituation, InterventionDetail } from '@/types/briefing';

export const STATUS_ORDER = ['ouvert', 'attente_pieces', 'attente_prod', 'ferme'] as const;

const TILE_STYLE: React.CSSProperties = {
  display: 'flex', flexDirection: 'column',
  border: '1px solid var(--gray-4)', borderRadius: 8, overflow: 'hidden',
  background: 'var(--color-panel-solid)',
};

function TileHeader({ children }: { children: React.ReactNode }) {
  return (
    <Flex align="center" gap="2" wrap="wrap" style={{ padding: '6px 10px', borderBottom: '1px solid var(--gray-4)', background: 'var(--gray-2)', minWidth: 0 }}>
      {children}
    </Flex>
  );
}

function TileFooter({ children }: { children: React.ReactNode }) {
  return (
    <Flex align="center" gap="2" style={{ padding: '4px 10px', borderTop: '1px solid var(--gray-4)', background: 'var(--gray-2)', minWidth: 0 }}>
      {children}
    </Flex>
  );
}

// ── Bloc Demande (DI) ─────────────────────────────────────────────────────

export function DiBlock({ req }: { req: NonNullable<InterventionDetail['request']> }) {
  return (
    <div style={TILE_STYLE}>
      <TileHeader>
        <Badge size="2" variant="outline" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0 }}>{req.code}</Badge>
        {req.statutLabel && (
          <Badge size="2" variant="soft" style={{ background: (req.statutColor ?? '#9ca3af') + '22', color: req.statutColor ?? 'var(--gray-10)', flexShrink: 0 }}>
            {req.statutLabel}
          </Badge>
        )}
      </TileHeader>
      <div style={{ padding: '10px 12px', flex: 1 }}>
        {req.description && (
          <Text size="2" weight="medium" style={{ color: 'var(--gray-12)', fontStyle: 'italic', display: 'block' }}>
            &laquo;&nbsp;{req.description}&nbsp;&raquo;
          </Text>
        )}
      </div>
      <TileFooter>
        {req.isSystem
          ? <Bot size={13} color="var(--gray-8)" style={{ flexShrink: 0 }} />
          : <User size={13} color="var(--gray-8)" style={{ flexShrink: 0 }} />
        }
        {req.demandeurNom && <Text size="1" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.demandeurNom}</Text>}
        {req.demandeurService && <Badge size="1" variant="outline" color="gray" style={{ flexShrink: 0 }}>{req.demandeurService}</Badge>}
        <div style={{ flex: 1 }} />
        {req.createdAt && (
          <Text size="1" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
            {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </Text>
        )}
      </TileFooter>
    </div>
  );
}

// ── Bloc Intervention ─────────────────────────────────────────────────────

interface IvBlockProps {
  situation: BriefingSituation;
  typeLabel: string;
  statusCfg: { color: string; label: string } | undefined;
  priorityCfg: { color: string; label: string } | undefined;
  actionCount: number;
  totalTime: number;
  purchaseCount: number;
  openFmt: string | null;
  closeFmt: string | null;
  daysOpen: number;
}

export function IvBlock({ situation, typeLabel, statusCfg, priorityCfg, actionCount, totalTime, purchaseCount, openFmt, closeFmt, daysOpen }: IvBlockProps) {
  return (
    <div style={TILE_STYLE}>
      <TileHeader>
        <Link to={`/intervention/${situation.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Badge size="2" variant="outline" color="gray" style={{ fontFamily: 'monospace' }}>{situation.code}</Badge>
        </Link>
        {typeLabel   && <Badge size="2" color="gray" variant="soft">{typeLabel}</Badge>}
        {statusCfg   && <Badge size="2" color={statusCfg.color as never} variant="soft">{statusCfg.label}</Badge>}
        {priorityCfg && <Badge size="2" color={priorityCfg.color as never} variant="soft">{priorityCfg.label}</Badge>}
        <div style={{ flex: 1 }} />
        <Link to={`/intervention/${situation.id}`} style={{ flexShrink: 0 }}>
          <Button size="1" variant="ghost" color="gray"><ExternalLink size={13} /></Button>
        </Link>
      </TileHeader>
      <div style={{ padding: '10px 12px', flex: 1 }}>
        <Text size="2" weight="medium" style={{ color: 'var(--gray-12)', fontStyle: 'italic', display: 'block' }}>
          &laquo;&nbsp;{situation.title}&nbsp;&raquo;
        </Text>
        <Flex align="center" gap="3" mt="2" style={{ flexWrap: 'wrap' }}>
          <Flex align="center" gap="1">
            <Clock size={13} color="var(--gray-9)" />
            <Text size="2" color="gray"><strong>{actionCount}</strong> action{actionCount !== 1 ? 's' : ''} · <strong>{totalTime}h</strong></Text>
          </Flex>
          {purchaseCount > 0 && (
            <Flex align="center" gap="1">
              <Package size={13} color="var(--orange-9)" />
              <Text size="2" style={{ color: 'var(--orange-11)' }}><strong>{purchaseCount}</strong> DA en attente</Text>
            </Flex>
          )}
        </Flex>
      </div>
      <TileFooter>
        {situation.techInitials && <Badge size="1" variant="soft" color="gray" style={{ fontFamily: 'monospace' }}>{situation.techInitials}</Badge>}
        <div style={{ flex: 1 }} />
        {openFmt && (
          <Flex align="center" gap="1">
            <Clock size={10} color="var(--gray-8)" />
            <Text size="1" color="gray">{closeFmt ? `${daysOpen}j · fermé ${closeFmt}` : `${daysOpen}j`}</Text>
          </Flex>
        )}
      </TileFooter>
    </div>
  );
}

// ── Blocs vides ───────────────────────────────────────────────────────────

export function IvEmptyBlock() {
  return (
    <div style={{ ...TILE_STYLE, alignItems: 'center', justifyContent: 'center', padding: '24px 12px', gap: 8, color: 'var(--gray-7)' }}>
      <Wrench size={22} strokeWidth={1.5} style={{ color: 'var(--gray-6)' }} />
      <Text size="2" color="gray" align="center">Pas encore d&apos;intervention</Text>
    </div>
  );
}

export function DiEmptyBlock() {
  return (
    <div style={{ ...TILE_STYLE, alignItems: 'center', justifyContent: 'center', padding: '24px 12px', gap: 8 }}>
      <ClipboardList size={22} strokeWidth={1.5} style={{ color: 'var(--gray-6)' }} />
      <Text size="2" color="gray" align="center">Aucune demande liée</Text>
    </div>
  );
}

// ── Bannière date due ─────────────────────────────────────────────────────

export function DueBanner({ situation, urgency, criticalTask }: { situation: BriefingSituation; urgency: { level: string; color: string }; criticalTask: { label?: string } | null | undefined }) {
  if (!situation.next_due_date) return null;
  const bg = urgency.level === 'overdue' ? 'var(--red-2)' : urgency.level === 'urgent' ? 'var(--orange-2)' : 'var(--blue-2)';
  return (
    <Flex align="center" gap="2" style={{ margin: '8px 14px 0', padding: '6px 10px', background: bg, borderRadius: 6, borderLeft: `3px solid ${urgency.color}` }}>
      <Target size={13} style={{ color: urgency.color, flexShrink: 0 }} />
      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
        {criticalTask?.label && (
          <Text size="2" weight="bold" style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{criticalTask.label}</Text>
        )}
        <Text size="2" weight="medium" style={{ color: urgency.color }}>
          Due : {formatDueDate(situation.next_due_date)}{urgency.level === 'overdue' && ' — EN RETARD'}
        </Text>
      </Flex>
    </Flex>
  );
}

// ── Barre de statut ───────────────────────────────────────────────────────

export function StatusBar({ currentStatus, onSelectStatus }: { currentStatus: string; onSelectStatus: (s: string) => void }) {
  return (
    <Flex gap="1" style={{ padding: '8px 14px 12px', flexWrap: 'wrap' }}>
      {STATUS_ORDER.map((s) => {
        const scfg = STATE_COLORS[s];
        const isActive = currentStatus === s;
        return (
          <button key={s} type="button" disabled={isActive} onClick={() => { if (!isActive) onSelectStatus(s); }} style={{
            flex: 1, padding: '5px 8px', fontSize: 13,
            fontWeight: isActive ? 700 : 500, borderRadius: 6,
            border: isActive ? 'none' : '1px solid var(--gray-5)',
            cursor: isActive ? 'default' : 'pointer',
            background: isActive ? scfg.activeBg : scfg.inactiveBg,
            color: isActive ? scfg.textActive : scfg.textInactive,
            transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
          }}>
            {scfg.label}
          </button>
        );
      })}
    </Flex>
  );
}
