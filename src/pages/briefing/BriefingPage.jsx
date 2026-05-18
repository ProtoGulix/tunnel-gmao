import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Spinner, Callout, Button } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import { BriefingCounters } from '@/components/briefing/BriefingCounters';
import { BriefingSection } from '@/components/briefing/BriefingSection';
import { BriefingTile } from '@/components/briefing/BriefingTile';
import { DIRightPanel } from '@/components/briefing/DIRightPanel';
import { useBriefingData } from '@/hooks/useBriefingData';
import { InterventionCard } from '@/components/briefing/InterventionCard';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';

function SectionSeparator({ label }) {
  return (
    <div style={{ margin: '10px 0 4px', borderTop: '1px dashed var(--gray-5)', paddingTop: 10 }}>
      <Text size="1" weight="medium" style={{ color: 'var(--gray-10)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Text>
    </div>
  );
}
SectionSeparator.propTypes = { label: PropTypes.string.isRequired };

function SectionItemList({ section, selectedId, onSelect }) {
  return (
    <>
      {section.items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item, section.type)}
          style={{
            cursor: 'pointer',
            borderRadius: 6,
            outline: selectedId === item.id ? '2px solid var(--blue-8)' : 'none',
            outlineOffset: 1,
          }}
        >
          <BriefingTile item={item} sectionId={section.id} />
        </div>
      ))}
    </>
  );
}
SectionItemList.propTypes = {
  section: PropTypes.object.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

function RightPanel({ selected, onRefresh }) {
  if (selected.type === 'request' || selected.type === 'request_accepted') {
    return <DIRightPanel requestId={selected.item.id} onRefresh={onRefresh} />;
  }
  return <InterventionCard situation={selected.item} onRefresh={onRefresh} />;
}
RightPanel.propTypes = {
  selected: PropTypes.shape({
    type: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
};

/**
 * BriefingPage — panneau briefing, utilisable en standalone ou embarqué dans EquipementDetailPage.
 * Doit être placé dans un conteneur avec une hauteur définie (height: 100% ou flex: 1).
 */
export default function BriefingPage({ equipementId, leftHeader }) {
  const { sections, counters, loading, error, retry } = useBriefingData({ equipementId });
  const [selected, setSelected] = useState(null);

  const visibleSections = sections.filter((s) => s.type !== 'separator' && s.items.length > 0);
  const renderedSections = sections.filter((s) => s.type === 'separator' || s.items.length > 0);
  const allEmpty = !loading && !error && visibleSections.length === 0;

  const leftPanel = (
    <div style={{ padding: '10px 14px' }}>
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
        <Flex align="center" justify="center" style={{ padding: '40px 0' }}>
          <Text size="3" style={{ color: 'var(--green-11)', textAlign: 'center' }}>
            Tout est sous contrôle — aucune demande active
          </Text>
        </Flex>
      )}

      {!loading && renderedSections.map((section, idx) => {
        if (section.type === 'separator') {
          return <SectionSeparator key={section.id} label={section.label} />;
        }
        const isFirst = idx === 0 || renderedSections[idx - 1]?.type === 'separator';
        return (
          <BriefingSection key={section.id} label={section.label} isFirst={isFirst}>
            <SectionItemList
              section={section}
              selectedId={selected?.item?.id}
              onSelect={(item, type) => setSelected({ type, item })}
            />
          </BriefingSection>
        );
      })}
    </div>
  );

  return (
    <MasterDetailLayout
      leftPanel={leftPanel}
      detailChildren={selected ? <RightPanel selected={selected} onRefresh={retry} /> : null}
      emptyLabel="Sélectionne une demande"
    />
  );
}

BriefingPage.propTypes = {
  equipementId: PropTypes.string,
  leftHeader: PropTypes.node,
};
