import { useState } from 'react';
import { Flex, Text, Spinner, Callout, Button, Badge } from '@radix-ui/themes';
import { AlertCircle, ClipboardList, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import InterventionRequestDetail from '@/components/intervention-requests/InterventionRequestDetail';
import PageHeader from '@/components/layout/PageHeader';
import { BriefingCounters } from '@/components/briefing/BriefingCounters';
import { BriefingSection } from '@/components/briefing/BriefingSection';
import { BriefingItem } from '@/components/briefing/BriefingItem';
import { useBriefingData } from '@/hooks/useBriefingData';
import { InterventionCard } from '@/components/briefing/InterventionCard';

/* ── Request item (tuile DI) ────────────────────────────────────────────── */

const REQUEST_STATUT_COLOR = {
  nouvelle:   'var(--gray-9)',
  en_attente: 'var(--amber-9)',
};

function RequestItem({ request }) {
  const barColor = REQUEST_STATUT_COLOR[request.statut] ?? 'var(--gray-9)';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const created = new Date(request.created_at);
  const daysWaiting = Math.floor((today - created) / 86400000);

  return (
    <div style={{
      display: 'flex',
      background: 'var(--color-panel-solid)',
      border: '1px solid var(--gray-4)',
      borderLeft: `3px solid ${barColor}`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <Flex direction="column" style={{ flex: 1, padding: '10px 12px' }} gap="1">
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="1" weight="medium" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-12)' }}>
            {request.code}
          </Text>
          <Badge size="1" variant="soft"
            style={{ backgroundColor: request.statut_color + '22', color: request.statut_color }}>
            {request.statut_label}
          </Badge>
          {request.equipement?.code && (
            <Badge size="1" variant="outline" color="gray">{request.equipement.code}</Badge>
          )}
        </Flex>
        <Text size="2" weight="medium"
          style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {request.description}
        </Text>
        <Text size="1" color="gray">
          {request.demandeur_nom}
          {request.service?.label ? ` · ${request.service.label}` : ''}
          {request.equipement?.name ? ` · ${request.equipement.name}` : ''}
        </Text>
      </Flex>
      <Flex direction="column" align="center" justify="center" gap="1"
        style={{ marginLeft: 8, paddingRight: 12, flexShrink: 0 }}>
        <Inbox size={13} color="var(--gray-8)" />
        <Text size="1" weight="medium"
          style={{ color: daysWaiting > 7 ? 'var(--red-11)' : daysWaiting > 3 ? 'var(--orange-11)' : 'var(--gray-11)', lineHeight: 1 }}>
          {daysWaiting === 0 ? 'auj.' : `${daysWaiting}j`}
        </Text>
      </Flex>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function BriefingPage({ equipementId, leftHeader } = {}) {
  const { sections, counters, loading, error, retry } = useBriefingData({ equipementId });
  const [selected, setSelected] = useState(null); // { type: 'situation'|'request', item }

  const visibleSections = sections.filter((s) => s.items.length > 0);
  const allEmpty = !loading && !error && visibleSections.length === 0;

  const handleSelect = (item, sectionType) => {
    setSelected({ type: sectionType === 'requests' ? 'request' : 'situation', item });
  };

  return (
    <>
      {!equipementId && (
        <PageHeader title="Briefing" subtitle="Situations actives et décisions en attente" icon={ClipboardList} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', height: equipementId ? '100%' : 'calc(100vh - 64px)' }}>

        {/* ── Left — list ──────────────────────────────────────────────── */}
        <div style={{ width: '42%', borderRight: '1px solid var(--gray-5)', height: '100%', overflowY: 'auto', padding: '10px 14px' }}>
          {leftHeader}
          {!equipementId && <BriefingCounters counters={counters} loading={loading} />}

          {error && (
            <Callout.Root color="red" style={{ marginBottom: 14 }}>
              <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
              <Button size="1" variant="soft" color="red" onClick={retry} style={{ marginLeft: 'auto' }}>
                Réessayer
              </Button>
            </Callout.Root>
          )}

          {loading && <Flex justify="center" pt="4"><Spinner size="2" /></Flex>}

          {allEmpty && (
            <Flex align="center" justify="center" style={{ minHeight: 200 }}>
              <Text size="3" style={{ color: 'var(--green-11)', textAlign: 'center' }}>
                Tout est sous contrôle — aucune situation active
              </Text>
            </Flex>
          )}

          {!loading && visibleSections.map((section, idx) => (
            <BriefingSection key={section.id} label={section.label} isFirst={idx === 0}>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item, section.type)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 6,
                    outline: selected?.item?.id === item.id ? '2px solid var(--blue-8)' : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {section.type === 'requests'
                    ? <RequestItem request={item} />
                    : <BriefingItem situation={item} sectionId={section.id} />
                  }
                </div>
              ))}
            </BriefingSection>
          ))}
        </div>

        {/* ── Right — detail ───────────────────────────────────────────── */}
        <div style={{ flex: 1, height: '100%', minWidth: 0, overflowY: 'auto' }}>
          {selected?.type === 'request' ? (
            <div style={{ padding: '12px 16px' }}>
              <InterventionRequestDetail
                requestId={selected.item.id}
                onTransitionDone={retry}
              />
            </div>
          ) : (
            <InterventionCard
              situation={selected?.type === 'situation' ? selected.item : null}
              onRefresh={retry}
            />
          )}
        </div>
      </div>
    </>
  );
}
