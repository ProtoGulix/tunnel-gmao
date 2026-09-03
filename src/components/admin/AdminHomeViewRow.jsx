/**
 * @fileoverview Ligne "Vue d'accueil" de la matrice rôles & permissions —
 * un Select compact par colonne de rôle, même position que les permissions.
 * @module components/admin/AdminHomeViewRow
 */

import { Fragment, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Table, Spinner, Select } from '@radix-ui/themes';
import { LayoutDashboard } from 'lucide-react';

// Libellés courts pour l'affichage compact dans les colonnes de la matrice —
// le Select.Content garde le libellé complet (descriptif) de home_view_ref.
const HOME_VIEW_SHORT_LABELS = {
  technicien: 'Technicien',
  acheteur: 'Acheteur',
  direction_technique: 'Direction technique',
};

export default function AdminHomeViewRow({
  roles, colSpan, homeViews, homeViewByRoleId, onHomeViewChange, defaultHomeViewCode,
}) {
  const [savingRoleId, setSavingRoleId] = useState(null);

  const handleChange = useCallback(async (roleId, viewCode) => {
    setSavingRoleId(roleId);
    try {
      await onHomeViewChange(roleId, viewCode);
    } finally {
      setSavingRoleId(null);
    }
  }, [onHomeViewChange]);

  return (
    <Fragment>
      <Table.Row style={{ background: 'var(--gray-3)' }}>
        <Table.Cell colSpan={colSpan} style={{ padding: '6px 12px' }}>
          <Flex align="center" gap="2">
            <LayoutDashboard size={13} color="var(--gray-11)" />
            <Text size="1" weight="bold" color="gray"
              style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Accueil
            </Text>
          </Flex>
        </Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>
          <Text size="2" weight="medium" as="div">Vue d&rsquo;accueil</Text>
          <Text size="1" color="gray" as="div">
            Sans configuration, un rôle garde la vue technicien actuelle.
          </Text>
        </Table.Cell>
        {roles.map((role) => {
          const currentView = homeViewByRoleId?.[role.id] ?? defaultHomeViewCode;
          return (
            <Table.Cell key={role.id} style={{ textAlign: 'center', verticalAlign: 'middle', maxWidth: 90 }}>
              {savingRoleId === role.id ? (
                <Spinner size="1" />
              ) : (
                <Select.Root
                  size="1"
                  value={currentView}
                  onValueChange={(v) => handleChange(role.id, v)}
                >
                  <Select.Trigger variant="ghost" style={{ maxWidth: '100%' }}>
                    <Text
                      size="1"
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 80 }}
                    >
                      {HOME_VIEW_SHORT_LABELS[currentView] ?? currentView}
                    </Text>
                  </Select.Trigger>
                  <Select.Content>
                    {homeViews.map((v) => (
                      <Select.Item key={v.code} value={v.code}>{v.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            </Table.Cell>
          );
        })}
      </Table.Row>
    </Fragment>
  );
}

AdminHomeViewRow.propTypes = {
  roles: PropTypes.array.isRequired,
  colSpan: PropTypes.number.isRequired,
  homeViews: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  homeViewByRoleId: PropTypes.object,
  onHomeViewChange: PropTypes.func.isRequired,
  defaultHomeViewCode: PropTypes.string.isRequired,
};
