import PropTypes from 'prop-types';
import { Flex, Badge, Text, IconButton } from '@radix-ui/themes';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

function getColors(variant) {
  if (variant === 'special') {
    return {
      bg: 'var(--orange-3)',
      border: '1px solid var(--orange-7)',
      iconColor: 'var(--orange-9)',
      badgeColor: 'orange'
    };
  }
  return {
    bg: 'var(--green-3)',
    border: '1px solid var(--green-7)',
    iconColor: 'var(--green-9)',
    badgeColor: 'blue'
  };
}

export default function SelectionSummary({
  variant = 'stock',
  badgeText,
  mainText,
  rightText,
  onClear
}) {
  const colors = getColors(variant);
  const Icon = variant === 'special' ? AlertCircle : CheckCircle;

  return (
    <Flex
      mt="2"
      align="center"
      justify="between"
      gap="2"
      style={{ background: colors.bg, border: colors.border, borderRadius: 6, padding: '8px 12px' }}
    >
      <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
        <Icon size={16} color={colors.iconColor} />
        {badgeText ? (
          <Badge color={colors.badgeColor} variant="soft" size="1">{badgeText}</Badge>
        ) : null}
        <Text size="2" weight="bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {mainText}
        </Text>
        {rightText ? (
          <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>
            {rightText}
          </Text>
        ) : null}
      </Flex>
      {onClear ? (
        <IconButton size="1" variant="ghost" color="gray" type="button" onClick={onClear}>
          <X size={14} />
        </IconButton>
      ) : null}
    </Flex>
  );
}

SelectionSummary.propTypes = {
  variant: PropTypes.oneOf(['stock', 'special']),
  badgeText: PropTypes.string,
  mainText: PropTypes.string.isRequired,
  rightText: PropTypes.string,
  onClear: PropTypes.func
};
