import { useState } from 'react';
import { Flex, Text, Spinner, Callout, Button, Badge } from '@radix-ui/themes';
import { AlertCircle, ClipboardList, Clock, Package, CheckCircle2, MinusCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { BriefingCounters } from '@/components/briefing/BriefingCounters';
import { BriefingSection } from '@/components/briefing/BriefingSection';
import { BriefingItem } from '@/components/briefing/BriefingItem';
import { useBriefingData } from '@/hooks/useBriefingData';
import { fetchIntervention } from '@/api/interventions';
import { useEffect } from 'react';
import { formatTime, formatDuration } from '@/components/planning/planningUtils';
import { STATUS_CONFIG } from '@/config/interventionTypes';

/* ── Panneau détail ─────────────────────────────────────────────────────── */

const TASK_STATUS = {
  done:        { Icon: CheckCircle2, color: 'var(--green-9)', label: 'Fait' },
  in_progress: { Icon: CheckCircle2, color: 'var(--blue-9)',  label: 'En cours' },
  skipped:     { Icon: MinusCircle,  color: 'var(--orange-9)', label: 'Ignorée' },
  todo:        { Icon: CheckCircle2, color: 'var(--gray-6)',  label: 'À faire' },
};

function ActionCard({ action }) {
  const subcatColor = action.subcategory?.category?.color ?? '#6b7280';
  const subcatCode = action.subcategory?.code ?? action.subcategory?.label ?? '—';
  const techName = action.technician
    ? `${action.technician.firstName} ${action.technician.lastName}`
    : '—';
  const startFmt = action.actionStart ? formatTime(action.actionStart) : null;
  const endFmt = action.actionEnd ? formatTime(action.actionEnd) : null;
  const durationMin = action.timeSpent ? action.timeSpent * 60 : 0;

  const dateLabel = action.createdAt
    ? new Date(action.createdAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  return (
    <div style={{
      background: `${subcatColor}0e`,
      borderLeft: `4px solid ${subcatColor}`,
      borderRadius: 6,
      marginBottom: 8,
      overflow: 'hidden',
      border: '1px solid var(--gray-4)',
    }}>
      {/* En-tête */}
      <Flex align="center" gap="2" style={{ padding: '7px 10px 5px', borderBottom: '1px solid var(--gray-4)' }}>
        <Badge size="1" style={{ background: `${subcatColor}26`, color: subcatColor, border: 'none', flexShrink: 0 }}>
          {subcatCode}
        </Badge>
        <Text size="2" weight="medium" style={{ flex: 1, color: 'var(--gray-11)' }}>
          {techName}
        </Text>
        {dateLabel && (
          <Text size="1" color="gray" style={{ flexShrink: 0 }}>{dateLabel}</Text>
        )}
        <Text size="2" color="gray" style={{ flexShrink: 0 }}>
          {startFmt ? `${startFmt}–${endFmt ?? '?'} · ` : ''}<strong>{formatDuration(durationMin)}</strong>
        </Text>
      </Flex>

      {/* Corps */}
      <div style={{ padding: '5px 10px 8px' }}>
        {action.description && (
          <Text size="2" style={{ display: 'block', color: 'var(--gray-11)', fontStyle: 'italic', lineHeight: 1.4 }}>
            {action.description}
          </Text>
        )}

        {/* Tâches */}
        {action.tasks?.length > 0 && (
          <Flex direction="column" gap="1" mt={action.description ? '2' : '0'}
            style={{ borderTop: action.description ? `1px solid ${subcatColor}20` : 'none', paddingTop: action.description ? 6 : 0 }}>
            {action.tasks.map((t) => {
              const tCfg = TASK_STATUS[t.status] ?? TASK_STATUS.todo;
              return (
                <Flex key={t.id} align="center" gap="2">
                  <tCfg.Icon size={12} color={tCfg.color} style={{ flexShrink: 0 }} />
                  <Text size="2" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </Text>
                  {t.assigned_to?.initials && (
                    <Text size="1" color="gray" style={{ flexShrink: 0 }}>{t.assigned_to.initials}</Text>
                  )}
                </Flex>
              );
            })}
          </Flex>
        )}

        {/* Demandes d'achat */}
        {action.purchaseRequests?.length > 0 && (
          <Flex direction="column" gap="1" mt="2" style={{ borderTop: '1px solid var(--orange-4)', paddingTop: 6 }}>
            {action.purchaseRequests.map((pr) => (
              <Flex key={pr.id} align="center" gap="2">
                <Package size={12} color="var(--orange-9)" style={{ flexShrink: 0 }} />
                <Text size="2" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pr.item_label}
                </Text>
              </Flex>
            ))}
          </Flex>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ situation }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!situation) return;
    setDetail(null);
    setLoading(true);
    fetchIntervention(situation.id)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [situation?.id]);

  if (!situation) {
    return (
      <Flex align="center" justify="center" direction="column" gap="3"
        style={{ height: '100%', minHeight: 300, color: 'var(--gray-8)' }}>
        <ClipboardList size={32} strokeWidth={1.5} />
        <Text size="2" color="gray">Sélectionne une intervention</Text>
      </Flex>
    );
  }

  const statusCfg = STATUS_CONFIG[situation.status_actual] ?? null;
  const totalTime = detail?.action?.reduce((s, a) => s + (a.timeSpent ?? 0), 0) ?? situation.stats?.totalTime ?? 0;
  const actionCount = detail?.action?.length ?? situation.stats?.actionCount ?? 0;

  return (
    <Flex direction="column" style={{ height: '100%' }}>
      {/* En-tête intervention */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-4)', flexShrink: 0 }}>
        <Flex align="center" gap="2" mb="1">
          <Link to={`/intervention/${situation.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Badge variant="outline" color="gray" size="2"
              style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
              {situation.code}
            </Badge>
          </Link>
          {statusCfg && (
            <Badge size="1" color={statusCfg.color} variant="soft">{statusCfg.label}</Badge>
          )}
          <Link to={`/intervention/${situation.id}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <Button size="1" variant="ghost" color="gray"><ExternalLink size={12} /></Button>
          </Link>
        </Flex>
        <Text size="2" style={{ fontStyle: 'italic', color: 'var(--gray-11)', display: 'block' }}>
          {situation.title}
        </Text>
        {situation.machine && (
          <Text size="1" color="gray" style={{ display: 'block', marginTop: 2 }}>
            {situation.machine.code} — {situation.machine.name}
          </Text>
        )}

        {/* Compteurs résumé */}
        <Flex align="center" gap="3" mt="2">
          <Flex align="center" gap="1">
            <Clock size={12} color="var(--gray-9)" />
            <Text size="1" color="gray">
              <strong>{actionCount}</strong> action{actionCount !== 1 ? 's' : ''} · <strong>{totalTime}h</strong>
            </Text>
          </Flex>
          {(situation.stats?.purchaseCount ?? 0) > 0 && (
            <Flex align="center" gap="1">
              <Package size={12} color="var(--orange-9)" />
              <Text size="1" style={{ color: 'var(--orange-11)' }}>
                <strong>{situation.stats.purchaseCount}</strong> DA en attente
              </Text>
            </Flex>
          )}
        </Flex>
      </div>

      {/* Liste des actions */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
        {loading && (
          <Flex justify="center" pt="4"><Spinner size="2" /></Flex>
        )}
        {!loading && detail?.action?.length === 0 && (
          <Text size="2" color="gray" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontStyle: 'italic' }}>
            Aucune action enregistrée
          </Text>
        )}
        {!loading && detail?.action?.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </Flex>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function BriefingPage() {
  const { sections, counters, loading, error, retry } = useBriefingData();
  const [selectedSituation, setSelectedSituation] = useState(null);

  const visibleSections = sections.filter((s) => s.items.length > 0);
  const allEmpty = !loading && !error && visibleSections.length === 0;

  return (
    <>
      <PageHeader title="Briefing" subtitle="Situations actives et décisions en attente" icon={ClipboardList} />

      <div style={{ display: 'flex', alignItems: 'flex-start', height: 'calc(100vh - 64px)' }}>

        {/* ── Colonne gauche — liste ───────────────────────────────────── */}
        <div style={{ width: '42%', borderRight: '1px solid var(--gray-5)', height: '100%', overflowY: 'auto', padding: '10px 14px' }}>

          <BriefingCounters counters={counters} loading={loading} />

          {error && (
            <Callout.Root color="red" style={{ marginBottom: 14 }}>
              <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
              <Button size="1" variant="soft" color="red" onClick={retry} style={{ marginLeft: 'auto' }}>
                Réessayer
              </Button>
            </Callout.Root>
          )}

          {loading && (
            <Flex justify="center" pt="4"><Spinner size="2" /></Flex>
          )}

          {allEmpty && (
            <Flex align="center" justify="center" style={{ minHeight: 200 }}>
              <Text size="3" style={{ color: 'var(--green-11)', textAlign: 'center' }}>
                Tout est sous contrôle — aucune situation active
              </Text>
            </Flex>
          )}

          {!loading && visibleSections.map((section, idx) => (
            <BriefingSection key={section.id} label={section.label} isFirst={idx === 0}>
              {section.items.map((situation) => (
                <div
                  key={situation.id}
                  onClick={() => setSelectedSituation(situation)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 6,
                    outline: selectedSituation?.id === situation.id ? '2px solid var(--blue-8)' : 'none',
                    outlineOffset: 1,
                  }}
                >
                  <BriefingItem situation={situation} sectionId={section.id} />
                </div>
              ))}
            </BriefingSection>
          ))}
        </div>

        {/* ── Colonne droite — détail ──────────────────────────────────── */}
        <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
          <DetailPanel situation={selectedSituation} />
        </div>
      </div>
    </>
  );
}
