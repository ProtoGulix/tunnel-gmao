import PropTypes from 'prop-types';
import { Badge, Box, Flex, Select, Text } from '@radix-ui/themes';
import { Lock } from 'lucide-react';

/**
 * Sélecteur dont chaque option porte une pastille colorée, un libellé et une description
 * courte. L'option choisie affiche sa pastille et son libellé, sa description dessous.
 * Largeur fixe : la description passe à la ligne au lieu d'élargir le formulaire.
 * `locked` : même sélecteur, grisé et cadenassé (valeur imposée), `lockedHint` en infobulle.
 */

function Marker({ option }) {
  if (option.badge) {
    return (
      <Badge color={option.color} variant="solid" size="1" style={{ minWidth: 40, justifyContent: 'center', flexShrink: 0 }}>
        {option.badge}
      </Badge>
    );
  }
  return (
    <Box style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: `var(--${option.color}-9)` }} />
  );
}
Marker.propTypes = { option: PropTypes.object.isRequired };

export default function DescribedSelect({
  value, options, onChange, width, placeholder = 'Choisir…', locked = false, lockedHint,
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <Flex direction="column" gap="1" style={{ width }}>
      <Select.Root value={value || ''} onValueChange={onChange} disabled={locked}>
        <Select.Trigger placeholder={placeholder} style={{ width: '100%' }} title={locked ? lockedHint : undefined}>
          {selected ? (
            <Flex as="span" align="center" gap="2">
              <Marker option={selected} />
              {selected.label}
              {locked && <Lock size={12} aria-label="Verrouillé" style={{ marginLeft: 'auto' }} />}
            </Flex>
          ) : undefined}
        </Select.Trigger>
        <Select.Content position="popper" style={{ width }}>
          {options.map((o) => (
            // Hauteur libre : Radix fixe une ligne par item, la description chevaucherait le suivant
            <Select.Item key={o.value} value={o.value} style={{ height: 'auto', paddingTop: 6, paddingBottom: 6 }}>
              <Flex align="center" gap="3" style={{ whiteSpace: 'normal' }}>
                <Marker option={o} />
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">{o.label}</Text>
                  {/* Couleur héritée : reste lisible sur l'item surligné */}
                  {o.description && <Text size="1" style={{ opacity: 0.75, lineHeight: 1.3 }}>{o.description}</Text>}
                </Flex>
              </Flex>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      {selected?.description && (
        <Text size="1" color="gray" style={{ lineHeight: 1.3 }}>{selected.description}</Text>
      )}
    </Flex>
  );
}
DescribedSelect.propTypes = {
  value: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
    badge: PropTypes.string,
    description: PropTypes.string,
  })).isRequired,
  onChange: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  placeholder: PropTypes.string,
  locked: PropTypes.bool,
  lockedHint: PropTypes.string,
};
