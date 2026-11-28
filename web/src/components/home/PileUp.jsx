/**
 * @fileoverview « Où ça s'entasse » : demandes à qualifier par site puis par équipement ; un clic
 * ouvre l'équipement.
 * @module components/home/PileUp
 */
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Card, Heading, Text } from '@radix-ui/themes';
import BarList from '@/components/home/BarList';
import { placeLabel } from '@/hooks/home/decisionQueue';

const toItem = (e) => ({
  key: e.id, label: placeLabel(e), count: e.count,
  note: e.oldest_days == null ? '' : `plus ancienne ${e.oldest_days} j`,
});

export default function PileUp({ sites, equipments }) {
  const navigate = useNavigate();
  const open = (id) => navigate(`/equipements?id=${id}`);
  return (
    <Card asChild>
      <section aria-labelledby="pile-up">
        <Heading as="h2" size="3" id="pile-up" mb="2">Où ça s’entasse</Heading>
        {[['Sites', sites], ['Équipements', equipments]].map(([title, list]) => list?.length > 0 && (
          <div key={title}>
            <Text as="div" size="1" color="gray" mb="1">{title}</Text>
            <BarList items={list.map(toItem)} onSelect={open} />
          </div>
        ))}
      </section>
    </Card>
  );
}

PileUp.propTypes = { sites: PropTypes.array, equipments: PropTypes.array };
