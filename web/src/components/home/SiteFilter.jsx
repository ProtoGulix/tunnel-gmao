/**
 * @fileoverview Filtre de site de l'accueil direction ; masqué sans option.
 * @module components/home/SiteFilter
 */
import PropTypes from 'prop-types';
import { Flex, Select } from '@radix-ui/themes';

export default function SiteFilter({ options, value, onChange }) {
  if (options.length === 0) return null;
  return (
    <Flex justify="end" style={{ flex: 1 }}>
      <Select.Root value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)}>
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="__all__">Tous les sites</Select.Item>
          {options.map((o) => (
            <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

SiteFilter.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
