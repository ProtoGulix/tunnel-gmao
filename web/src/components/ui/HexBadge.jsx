import PropTypes from 'prop-types';
import { Badge, Text } from '@radix-ui/themes';
import { hexBadgeStyle } from '@/config/purchaseConfig';

export default function HexBadge({ color, label, size = '1', fallbackColor = 'gray' }) {
  if (!label) return <Text size="1" color="gray">—</Text>;
  const style = hexBadgeStyle(color);
  return (
    <Badge size={size} {...(style ? { style } : { color: fallbackColor, variant: 'soft' })}>
      {label}
    </Badge>
  );
}

HexBadge.propTypes = {
  color: PropTypes.string,
  label: PropTypes.string,
  size: PropTypes.string,
  fallbackColor: PropTypes.string,
};
