/**
 * @fileoverview Sections de la file « à traiter » : chaque sujet fournit sa ligne.
 * @module components/home/QueueSections
 */
import PropTypes from 'prop-types';
import QueueSection from '@/components/home/QueueSection';
import QualifyRequestRow from '@/components/home/QualifyRequestRow';
import QueueInterventionRow from '@/components/home/QueueInterventionRow';
import QueuePreventiveRow from '@/components/home/QueuePreventiveRow';
import { rowKey } from '@/hooks/home/requestQueue';

const ROWS = {
  request: (row, props) => <QualifyRequestRow request={row} {...props} />,
  intervention: (row, props) => <QueueInterventionRow intervention={row} {...props} />,
  preventive: (row, props) => <QueuePreventiveRow row={row} {...props} />,
};

export default function QueueSections({ sections, selectedKey, onSelect }) {
  return sections.map((section) => (
    <QueueSection key={section.id} title={section.title} count={section.items.length}>
      {section.items.map((row) => {
        const key = rowKey(section.kind, row);
        return ROWS[section.kind](row, {
          key,
          isSelected: key === selectedKey,
          onSelect: () => onSelect(key),
        });
      })}
    </QueueSection>
  ));
}

QueueSections.propTypes = {
  sections: PropTypes.array.isRequired,
  selectedKey: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
