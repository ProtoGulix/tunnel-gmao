/**
 * @fileoverview Colonnes « types d'intervention permis » du tableau des classes (ADR 0031)
 * @module components/admin/classTypeColumns
 */

import { Badge, Spinner, Switch, Tooltip } from '@radix-ui/themes';

/** Une colonne par type actif : pastille de couleur et code (libellé en infobulle), une case par classe */
export function typeColumns({ activeTypes, canSetTypes, toggling, onToggle }) {
  return activeTypes.map((t) => ({
    key: `type-${t.id}`,
    header: (
      <Tooltip content={t.title}>
        <Badge color={t.color ?? 'gray'} variant="solid" size="1">{t.id}</Badge>
      </Tooltip>
    ),
    align: 'center',
    width: 64,
    render: (i) => {
      const checked = (i.allowed_intervention_types ?? []).includes(t.id);
      if (!canSetTypes) return <Switch size="1" checked={checked} disabled aria-label={t.title} />;
      if (toggling === `${i.id}:${t.id}`) return <Spinner size="1" />;
      return (
        <Switch
          size="1"
          checked={checked}
          disabled={toggling !== null}
          aria-label={`${t.title} pour ${i.label}`}
          onCheckedChange={(on) => onToggle(i, t.id, on)}
        />
      );
    },
  }));
}
