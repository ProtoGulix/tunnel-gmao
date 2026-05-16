import PropTypes from 'prop-types';
import { Flex, Badge } from '@radix-ui/themes';

const CHIP_CONFIG = [
  { key: 'requests_new',      label: 'nouvelle(s)',        color: 'gray'   },
  { key: 'requests_waiting',  label: 'en attente',         color: 'amber'  },
  { key: 'requests_accepted', label: 'acceptée(s)',        color: 'blue'   },
  { key: 'critical',          label: 'critique(s)',        color: 'red'    },
  { key: 'blocked_piece',     label: 'pièce(s) bloquée(s)', color: 'orange' },
  { key: 'decision',          label: 'décision(s)',        color: 'indigo' },
  { key: 'in_progress',       label: 'en cours',           color: 'gray'   },
  { key: 'preventive',        label: 'préventif',          color: 'green'  },
];

export function BriefingCounters({ counters, loading }) {
  const chips = CHIP_CONFIG.filter(({ key }) => loading || (counters[key] ?? 0) > 0);

  if (!loading && chips.length === 0) return null;

  return (
    <Flex gap="2" wrap="wrap" style={{ marginBottom: 14 }}>
      {chips.map(({ key, label, color }) => (
        <Badge key={key} color={color} variant="soft" size="2" radius="full">
          {loading ? '—' : counters[key]} {label}
        </Badge>
      ))}
    </Flex>
  );
}

BriefingCounters.propTypes = {
  counters: PropTypes.shape({
    requests:          PropTypes.number,
    requests_new:      PropTypes.number,
    requests_waiting:  PropTypes.number,
    requests_accepted: PropTypes.number,
    critical:          PropTypes.number,
    blocked_piece:     PropTypes.number,
    decision:          PropTypes.number,
    in_progress:       PropTypes.number,
    preventive:        PropTypes.number,
  }).isRequired,
  loading: PropTypes.bool,
};

BriefingCounters.defaultProps = {
  loading: false,
};
