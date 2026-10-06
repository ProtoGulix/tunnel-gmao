import { Flex, Text, Button, Callout, Spinner } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import { useBriefingData } from '@/hooks/useBriefingData';
import { BriefingCounters } from '@/components/briefing/BriefingCounters';
import { BriefingSection } from '@/components/briefing/BriefingSection';
import { BriefingItem } from '@/components/briefing/BriefingItem';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatBriefingDate() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

// ── Skeletons de chargement ──────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div
      style={{
        border: '1px solid var(--gray-4)',
        borderLeft: '3px solid var(--gray-4)',
        borderRadius: 6,
        padding: '10px 12px',
        background: 'var(--color-panel-solid)',
      }}
    >
      <Flex justify="between" align="start">
        <Flex direction="column" gap="2" style={{ flex: 1 }}>
          <div
            className="animate-pulse"
            style={{ width: '35%', height: 12, borderRadius: 4, background: 'var(--gray-4)' }}
          />
          <div
            className="animate-pulse"
            style={{ width: '70%', height: 14, borderRadius: 4, background: 'var(--gray-4)' }}
          />
          <div
            className="animate-pulse"
            style={{ width: '50%', height: 11, borderRadius: 4, background: 'var(--gray-3)' }}
          />
        </Flex>
        <div
          className="animate-pulse"
          style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gray-4)', marginLeft: 12 }}
        />
      </Flex>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function HomeBriefing() {
  const { sections, counters, loading, error, retry } = useBriefingData();

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const visibleSections = sections.filter((s) => s.items.length > 0);
  const allEmpty = !loading && !error && visibleSections.length === 0;

  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '0 24px 48px',
      }}
    >
      {/* En-tête */}
      <Flex
        justify="between"
        align="center"
        style={{
          paddingTop: 20,
          paddingBottom: 12,
          borderBottom: '1px solid var(--gray-4)',
          marginBottom: 14,
        }}
      >
        <Text size="3" weight="medium" style={{ color: 'var(--gray-12)', fontSize: 15 }}>
          Briefing — {formatBriefingDate()}
        </Text>
        {!loading && !error && (
          <Text size="1" color="gray">
            {totalItems} situation{totalItems !== 1 ? 's' : ''}
            {counters.decision > 0 ? ` · ${counters.decision} décision${counters.decision !== 1 ? 's' : ''} requise${counters.decision !== 1 ? 's' : ''}` : ''}
          </Text>
        )}
        {loading && <Spinner size="1" />}
      </Flex>

      {/* Bandeau d'erreur */}
      {error && (
        <Callout.Root color="red" style={{ marginBottom: 14 }}>
          <Callout.Icon>
            <AlertCircle size={16} />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
          <Button size="1" variant="soft" color="red" onClick={retry} style={{ marginLeft: 'auto' }}>
            Réessayer
          </Button>
        </Callout.Root>
      )}

      {/* Compteurs chips */}
      <BriefingCounters counters={counters} loading={loading} />

      {/* Skeletons */}
      {loading && (
        <Flex direction="column" gap="1">
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <SkeletonItem key={i} />
          ))}
        </Flex>
      )}

      {/* Message tout vide */}
      {allEmpty && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          style={{ minHeight: 200 }}
        >
          <Text size="3" style={{ color: 'var(--green-11)', textAlign: 'center' }}>
            Tout est sous contrôle — aucune situation active
          </Text>
        </Flex>
      )}

      {/* Sections */}
      {!loading && visibleSections.map((section, idx) => (
        <BriefingSection
          key={section.id}
          label={section.label}
          isFirst={idx === 0}
        >
          {section.items.map((situation) => (
            <BriefingItem
              key={situation.id}
              situation={situation}
              sectionId={section.id}
            />
          ))}
        </BriefingSection>
      ))}
    </div>
  );
}
