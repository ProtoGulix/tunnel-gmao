/**
 * @fileoverview « Côté maintenance » : interventions sans action et préventifs en retard,
 * avec lien vers leur liste. Comptes seulement, aucun chiffre par personne.
 * @module components/home/MaintenanceSide
 */
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Card, Flex, Text } from '@radix-ui/themes';
import { IDLE_LIMIT } from '@/hooks/home/useMaintenanceSide';

export default function MaintenanceSide({ data }) {
  if (!data) return null;
  const idle = data.idle >= IDLE_LIMIT ? `${IDLE_LIMIT} ou plus` : data.idle;
  return (
    <Card asChild>
      <section aria-label="Côté maintenance">
        <Flex wrap="wrap" align="center" gap="2" columnGap="4">
          <Text size="2" weight="bold">Côté maintenance</Text>
          <Link to="/interventions">{idle} sans action</Link>
          <Link to="/preventive">{data.overdue} préventif{data.overdue > 1 ? 's' : ''} en retard</Link>
        </Flex>
      </section>
    </Card>
  );
}

MaintenanceSide.propTypes = { data: PropTypes.shape({ idle: PropTypes.number, overdue: PropTypes.number }) };
