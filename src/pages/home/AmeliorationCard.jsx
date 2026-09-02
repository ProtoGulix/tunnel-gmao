/**
 * @fileoverview Carte kanban d'une idée d'amélioration — édition inline
 * catégorie/priorité/sous_statut via sélecteur (pas de drag & drop).
 * @module pages/home/AmeliorationCard
 */

import PropTypes from 'prop-types';
import { Avatar, Card, Flex, Text } from '@radix-ui/themes';
import { PrioriteSelect, InlineRefSelect } from '@/components/home/AmeliorationInlineEditCell';
import { InterventionLinkCell, formatDay } from '@/pages/home/requestCardShared';

export default function AmeliorationCard({ request, categories, sousStatuts, onUpdate }) {
  return (
    <Card size="1">
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="1" style={{ fontFamily: 'monospace' }} color="gray">{request.code}</Text>
          <Text size="1" color="gray">{request.equipement?.code}</Text>
        </Flex>

        <Text size="2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {request.description}
        </Text>

        <Flex gap="1" wrap="wrap">
          <InlineRefSelect
            value={request.categorie}
            options={categories}
            placeholder="Catégorie"
            onChange={(v) => onUpdate(request.id, { categorie: v })}
          />
          <PrioriteSelect
            value={request.priorite}
            onChange={(v) => onUpdate(request.id, { priorite: v })}
          />
        </Flex>

        <InlineRefSelect
          value={request.sous_statut}
          options={sousStatuts}
          placeholder="Sous-statut"
          onChange={(v) => onUpdate(request.id, { sousStatut: v })}
        />

        <Flex justify="between" align="center">
          {request.porteur ? (
            <Flex align="center" gap="1">
              <Avatar size="1" radius="full" fallback={request.porteur.initial || '?'} />
              <Text size="1">{request.porteur.first_name} {request.porteur.last_name}</Text>
            </Flex>
          ) : (
            <Text size="1" color="gray">Sans porteur</Text>
          )}
          <Text size="1" color={request.deadline ? undefined : 'gray'}>{formatDay(request.deadline)}</Text>
        </Flex>

        <InterventionLinkCell request={request} />
      </Flex>
    </Card>
  );
}

AmeliorationCard.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    description: PropTypes.string,
    categorie: PropTypes.string,
    priorite: PropTypes.string,
    sous_statut: PropTypes.string,
    deadline: PropTypes.string,
    equipement: PropTypes.shape({ code: PropTypes.string }),
    porteur: PropTypes.shape({
      initial: PropTypes.string,
      first_name: PropTypes.string,
      last_name: PropTypes.string,
    }),
  }).isRequired,
  categories: PropTypes.array.isRequired,
  sousStatuts: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired,
};
