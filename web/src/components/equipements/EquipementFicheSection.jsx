/**
 * @fileoverview Section « Fiche » de l'équipement : propriétés modifiables sur place (ADR 0012)
 * @module components/equipements/EquipementFicheSection
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Box, Flex, Text } from '@radix-ui/themes';
import { CornerLeftUp } from 'lucide-react';
import EditableProperty from '@/components/equipements/EditableProperty';
import ParentPicker from '@/components/equipements/ParentPicker';
import { Section, formatDate, equipementUrl } from '@/components/equipements/EquipementDetailSections';

const optionList = (items, labelOf) => items.map((i) => ({ value: String(i.id), label: labelOf(i) }));

/**
 * @param {Object} eq
 * @param {boolean} [editable] - droit de modifier (ADR 0012)
 * @param {Function} [onSave] - async (champ, valeur) ; rejette en cas d'erreur
 * @param {Array} [classes] - classes d'équipement (liste du select)
 * @param {Array} [statuts] - statuts du cycle de vie (liste du select)
 */
const TEXT_FIELDS = [
  ['N° machine', 'no_machine'],
  ['Emplacement', 'affectation'],
  ['Fabricant', 'fabricant'],
  ['N° série', 'numero_serie'],
];

function ParentPath({ eq }) {
  const ancestors = eq.ancestors ?? [];
  const parent = ancestors[ancestors.length - 1];
  if (!parent) return null;
  const path = ancestors.slice(0, -1).map((a) => a.code || a.name);
  path.push(parent.code ? `${parent.code} – ${parent.name}` : parent.name);
  const stop = (e) => e.stopPropagation();
  return (
    <Flex align="center" gap="2" style={{ minWidth: 0 }}>
      <Text size="2" weight="medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {path.join(' › ')}
      </Text>
      {/* Lien de navigation : ne doit pas ouvrir l'édition du rattachement */}
      <Link
        to={equipementUrl(parent.id)}
        replace
        onClick={stop}
        onKeyDown={stop}
        aria-label={`Aller à ${parent.code || parent.name}`}
        title="Aller au parent"
        style={{ display: 'inline-flex', color: 'var(--gray-10)' }}
      >
        <CornerLeftUp size={14} />
      </Link>
    </Flex>
  );
}
ParentPath.propTypes = { eq: PropTypes.object.isRequired };

function ParentProperty({ eq, editable, onSave }) {
  const parent = eq.parent;
  return (
    <EditableProperty
      label="Rattachement"
      type="custom"
      value={parent ? String(parent.id) : null}
      display={parent ? <ParentPath eq={eq} /> : undefined}
      editable={editable}
      onSave={(v) => onSave('parent_id', v)}
      renderEditor={({ onCommit, onCancel }) => (
        <ParentPicker equipementId={String(eq.id)} onCommit={onCommit} onCancel={onCancel} />
      )}
    />
  );
}
ParentProperty.propTypes = { eq: PropTypes.object.isRequired, editable: PropTypes.bool, onSave: PropTypes.func };

function SelectProperty({ label, field, current, display, options, editable, onSave, convert, required = false }) {
  return (
    <EditableProperty
      label={label}
      type="select"
      value={current == null ? null : String(current)}
      display={display}
      options={options}
      editable={editable}
      required={required}
      onSave={(v) => onSave(field, v == null ? null : convert(v))}
    />
  );
}
SelectProperty.propTypes = {
  label: PropTypes.string.isRequired, field: PropTypes.string.isRequired, current: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  display: PropTypes.string, options: PropTypes.array.isRequired, editable: PropTypes.bool, onSave: PropTypes.func, convert: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

/**
 * @param {Object} eq
 * @param {boolean} [editable] - droit de modifier (ADR 0012)
 * @param {Function} [onSave] - async (champ, valeur) ; rejette en cas d'erreur
 * @param {Array} [classes] - classes d'équipement (liste du select)
 * @param {Array} [statuts] - statuts du cycle de vie (liste du select)
 */
export default function FicheSection({ eq, editable = false, onSave, classes = [], statuts = [] }) {
  const prop = (label, field, extra) => (
    <EditableProperty key={field} label={label} value={eq[field]} editable={editable} onSave={(v) => onSave(field, v)} {...extra} />
  );
  const cls = eq.equipement_class;
  return (
    <Section title="Fiche">
      <Box>
        <SelectProperty
          label="Classe" field="equipement_class_id" current={cls?.id} display={cls ? (cls.label ?? cls.code) : undefined}
          options={optionList(classes, (c) => `${c.code} — ${c.label}`)} editable={editable} onSave={onSave} convert={String}
        />
        <SelectProperty
          label="Statut" field="statut_id" current={eq.statut?.id} display={eq.statut?.label}
          options={optionList(statuts, (s) => s.label)} editable={editable} onSave={onSave} convert={Number} required
        />
        <ParentProperty eq={eq} editable={editable} onSave={onSave} />
        {TEXT_FIELDS.map(([label, field]) => prop(label, field))}
        {prop('Mise en service', 'date_mise_service', { type: 'date', display: formatDate(eq.date_mise_service) ?? undefined })}
        {prop('Nœud de regroupement', 'is_mere', { type: 'checkbox', value: eq.is_mere === true })}
        {prop('Notes', 'notes', { type: 'textarea' })}
      </Box>
    </Section>
  );
}
FicheSection.propTypes = {
  eq: PropTypes.object.isRequired,
  editable: PropTypes.bool,
  onSave: PropTypes.func,
  classes: PropTypes.array,
  statuts: PropTypes.array,
};

