/**
 * @fileoverview Cellules d'édition inline (catégorie/priorité/sous_statut) pour
 * les idées d'amélioration — réutilisées par la vue direction technique.
 * Basé sur Radix Select (déjà en place dans le projet, cf. OrderLineRowEditable.jsx),
 * pas de nouvelle dépendance de tableau/formulaire.
 * @module components/home/AmeliorationInlineEditCell
 */

import PropTypes from 'prop-types';
import { Select, Badge } from '@radix-ui/themes';

/**
 * Select inline générique : affiche un badge coloré, devient un Select Radix
 * au clic, sauvegarde au changement.
 */
export function InlineRefSelect({ value, options, placeholder, onChange, disabled }) {
  const current = options.find((o) => o.code === value);

  return (
    <Select.Root
      value={value || '__none__'}
      onValueChange={(v) => onChange(v === '__none__' ? null : v)}
      disabled={disabled}
    >
      <Select.Trigger variant="ghost" placeholder={placeholder}>
        {current ? (
          <Badge color={current.color?.startsWith('#') ? undefined : current.color} variant="soft" size="1">
            {current.label}
          </Badge>
        ) : (
          placeholder
        )}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="__none__">—</Select.Item>
        {options.map((o) => (
          <Select.Item key={o.code} value={o.code}>{o.label}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

InlineRefSelect.propTypes = {
  value: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
  })).isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const PRIORITE_OPTIONS = [
  { code: 'basse', label: 'Basse', color: 'gray' },
  { code: 'moyenne', label: 'Moyenne', color: 'amber' },
  { code: 'haute', label: 'Haute', color: 'red' },
];

export function PrioriteSelect({ value, onChange, disabled }) {
  return (
    <InlineRefSelect
      value={value}
      options={PRIORITE_OPTIONS}
      placeholder="Priorité"
      onChange={onChange}
      disabled={disabled}
    />
  );
}

PrioriteSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
