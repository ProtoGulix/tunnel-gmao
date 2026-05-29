import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';

export function BriefingSection({ label, children, isFirst }) {
  return (
    <div style={{ marginTop: isFirst ? 0 : 14 }}>
      <Flex align="center" gap="2" style={{ marginBottom: 6 }}>
        <Text
          size="1"
          color="gray"
          weight="medium"
          style={{ whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          {label}
        </Text>
        <div style={{ flex: 1, height: 1, background: 'var(--gray-5)' }} />
      </Flex>
      <Flex direction="column" gap="4">
        {children}
      </Flex>
    </div>
  );
}

BriefingSection.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isFirst: PropTypes.bool,
};

BriefingSection.defaultProps = {
  isFirst: false,
};
