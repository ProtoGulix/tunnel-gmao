/**
 * Slot en-tête gauche pour la page équipement (mode briefing).
 * Affiche les infos équipement, le préventif et la hiérarchie.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flex, Text, Badge, Button, Separator } from '@radix-ui/themes';
import { CalendarClock, Users } from 'lucide-react';
import PropTypes from 'prop-types';
import EquipementHealthBadge from '@/components/ui/EquipementHealthBadge';
import { Dialog } from '@radix-ui/themes';
import EquipementPreventifTab from '@/components/equipements/tabs/EquipementPreventifTab';

function Row({ label, children }) {
  return (
    <Flex justify="between" align="center" gap="2">
      <Text size="1" color="gray" style={{ flexShrink: 0 }}>{label}</Text>
      <div style={{ textAlign: 'right' }}>{children}</div>
    </Flex>
  );
}
Row.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EquipementInfoHeader({ equipement, health }) {
  const [showPreventif, setShowPreventif] = useState(false);
  if (!equipement) return null;

  const pendingCount = equipement.preventive_occurrences_summary?.pending_count ?? 0;
  const hasPlans = equipement.preventive_plans != null;

  return (
    <>
      <div style={{ borderBottom: '1px solid var(--gray-5)', padding: '10px 14px 12px' }}>

        {/* Nom + code + classe + statut */}
        <Flex align="center" gap="2" style={{ marginBottom: 2, flexWrap: 'wrap' }}>
          <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)' }}>
            {equipement.code || '—'}
          </Text>
          {equipement.equipement_class && (
            <Badge variant="soft" size="1">{equipement.equipement_class.code}</Badge>
          )}
          {equipement.statut && (
            <Badge size="1" variant="soft" style={{
              backgroundColor: equipement.statut.couleur ? `${equipement.statut.couleur}22` : 'var(--gray-3)',
              color: equipement.statut.couleur || 'var(--gray-11)',
              border: `1px solid ${equipement.statut.couleur || 'var(--gray-6)'}44`,
            }}>
              {equipement.statut.label}
            </Badge>
          )}
        </Flex>

        <Text size="3" weight="medium" style={{ display: 'block', marginBottom: 6 }}>
          {equipement.name}
        </Text>

        {/* Health */}
        <Flex align="center" gap="2" style={{ marginBottom: 8 }}>
          <EquipementHealthBadge level={health?.level || 'ok'} showLabel />
          {health?.reason && <Text size="1" color="gray">{health.reason}</Text>}
        </Flex>

        <Separator size="4" style={{ marginBottom: 8 }} />

        {/* Infos */}
        <Flex direction="column" gap="2">
          {equipement.no_machine && (
            <Row label="N° machine"><Text size="2" weight="medium">{equipement.no_machine}</Text></Row>
          )}
          {equipement.affectation && (
            <Row label="Affectation"><Text size="2" weight="medium">{equipement.affectation}</Text></Row>
          )}
          {equipement.fabricant && (
            <Row label="Fabricant"><Text size="2" weight="medium">{equipement.fabricant}</Text></Row>
          )}
          {equipement.numero_serie && (
            <Row label="N° série"><Text size="2" weight="medium">{equipement.numero_serie}</Text></Row>
          )}
          {equipement.date_mise_service && (
            <Row label="Mise en service"><Text size="2" weight="medium">{formatDate(equipement.date_mise_service)}</Text></Row>
          )}
          {equipement.parent && (
            <Row label="Parent">
              <Link to={`/equipements/${equipement.parent.id}`} style={{ textDecoration: 'none' }}>
                <Text size="2" weight="medium" color="blue">
                  {[equipement.parent.code, equipement.parent.name].filter(Boolean).join(' – ')}
                </Text>
              </Link>
            </Row>
          )}
          {equipement.children_count > 0 && (
            <Row label="Enfants">
              <Flex align="center" gap="1">
                <Users size={12} color="var(--gray-9)" />
                <Text size="2" weight="medium">{equipement.children_count}</Text>
              </Flex>
            </Row>
          )}
          {equipement.notes && (
            <div style={{ marginTop: 4 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 2 }}>Notes</Text>
              <Text size="1" color="gray" style={{ whiteSpace: 'pre-wrap' }}>{equipement.notes}</Text>
            </div>
          )}
        </Flex>

        {/* Bouton préventif */}
        {hasPlans && (
          <div style={{ marginTop: 10 }}>
            <Button size="1" variant="soft" color={pendingCount > 0 ? 'orange' : 'gray'}
              onClick={() => setShowPreventif(true)} style={{ width: '100%' }}>
              <CalendarClock size={13} />
              Préventif
              {pendingCount > 0 && (
                <Badge color="orange" variant="solid" size="1" style={{ marginLeft: 4 }}>{pendingCount}</Badge>
              )}
            </Button>
          </div>
        )}
      </div>

      <Dialog.Root open={showPreventif} onOpenChange={(v) => { if (!v) setShowPreventif(false); }}>
        <Dialog.Content maxWidth="600px">
          <Dialog.Title>Maintenance préventive — {equipement.code}</Dialog.Title>
          <EquipementPreventifTab equipement={equipement} />
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

EquipementInfoHeader.propTypes = {
  equipement: PropTypes.object,
  health: PropTypes.object,
};
