/**
 * Sélecteur de plage horaire avec créneaux au quart d'heure (06:00–20:00).
 * Affiche la durée calculée en lecture seule.
 * @module components/planning/TimeRangePicker
 */
import PropTypes from 'prop-types';
import { Flex, Select, Text } from '@radix-ui/themes';

/** Génère les créneaux de 06:00 à 20:00 au quart d'heure */
function generateSlots() {
  const slots = [];
  for (let h = 6; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function formatDuration(start, end) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null || e <= s) return null;
  const diff = e - s;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 && m > 0 ? `${h}h${String(m).padStart(2, '0')}` : h > 0 ? `${h}h00` : `${m}min`;
}

export default function TimeRangePicker({ value, onChange, disabled }) {
  const { start, end } = value ?? {};
  const startMin = toMinutes(start);
  const duration = formatDuration(start, end);

  const endSlots = ALL_SLOTS.filter((s) => startMin === null || toMinutes(s) > startMin);

  const handleStart = (v) => onChange({ start: v, end: (end && toMinutes(end) > toMinutes(v)) ? end : null });
  const handleEnd = (v) => onChange({ start, end: v });

  return (
    <Flex align="center" gap="2" wrap="wrap">
      <Flex align="center" gap="1">
        <Text size="1" color="gray">De</Text>
        <Select.Root value={start ?? ''} onValueChange={handleStart} disabled={disabled}>
          <Select.Trigger placeholder="--:--" />
          <Select.Content position="popper" sideOffset={4} style={{ maxHeight: 220 }}>
            {ALL_SLOTS.map((s) => (
              <Select.Item key={s} value={s}>{s}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>

      <Flex align="center" gap="1">
        <Text size="1" color="gray">à</Text>
        <Select.Root value={end ?? ''} onValueChange={handleEnd} disabled={disabled || !start}>
          <Select.Trigger placeholder="--:--" />
          <Select.Content position="popper" sideOffset={4} style={{ maxHeight: 220 }}>
            {endSlots.map((s) => (
              <Select.Item key={s} value={s}>{s}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>

      {duration && (
        <Text size="2" color="blue" weight="medium">= {duration}</Text>
      )}
    </Flex>
  );
}

TimeRangePicker.propTypes = {
  value: PropTypes.shape({ start: PropTypes.string, end: PropTypes.string }),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
