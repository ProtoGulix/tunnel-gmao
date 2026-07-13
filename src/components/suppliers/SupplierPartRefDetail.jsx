/**
 * @fileoverview Detail d'une reference fournisseur selectionnee (liaison piece / fabricant)
 * @module components/suppliers/SupplierPartRefDetail
 */

import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { ExternalLink, TrendingUp, Truck } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import { useSupplierPriceStats } from '@/hooks/suppliers/useSupplierPriceStats';

function PriceStatsBody({ stats }) {
  if (stats.order_count === 0) {
    return <Text size="2" color="gray">Aucune commande passée pour cette référence.</Text>;
  }
  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Text size="2" color="gray">Commandes prises en compte</Text>
        <Text size="2">{stats.order_count}</Text>
      </Flex>
      <Flex justify="between" align="center">
        <Text size="2" color="gray">Prix moyen</Text>
        <Text size="2" weight="bold">{stats.avg_price != null ? `${stats.avg_price.toFixed(2)} €` : '-'}</Text>
      </Flex>
      <Flex justify="between" align="center">
        <Text size="2" color="gray">Prix min. / max.</Text>
        <Text size="2">
          {stats.min_price != null ? `${stats.min_price} €` : '-'}
          {' / '}
          {stats.max_price != null ? `${stats.max_price} €` : '-'}
        </Text>
      </Flex>
      <Flex justify="between" align="center">
        <Text size="2" color="gray">Dernier prix obtenu</Text>
        <Text size="2">{stats.last_price != null ? `${stats.last_price} €` : '-'}</Text>
      </Flex>
      {stats.last_ordered_at && (
        <Flex justify="between" align="center">
          <Text size="2" color="gray">Dernière commande</Text>
          <Text size="2">{new Date(stats.last_ordered_at).toLocaleDateString('fr-FR')}</Text>
        </Flex>
      )}
    </Flex>
  );
}

PriceStatsBody.propTypes = { stats: PropTypes.object.isRequired };

function PriceStatsSection({ partId, supplierId }) {
  const { stats, loading, error } = useSupplierPriceStats(partId, supplierId);

  return (
    <Box style={{ border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-3)', padding: 14 }}>
      <Flex align="center" gap="2" mb="2">
        <TrendingUp size={14} color="var(--gray-11)" />
        <Text size="2" weight="bold" color="gray">Historique des prix</Text>
      </Flex>

      {loading && <LoadingState fullscreen={false} message="Chargement..." />}
      {error && <Text size="2" color="red">{error}</Text>}
      {!loading && !error && stats && <PriceStatsBody stats={stats} />}
    </Box>
  );
}

PriceStatsSection.propTypes = {
  partId: PropTypes.string.isRequired,
  supplierId: PropTypes.string.isRequired,
};

export default function SupplierPartRefDetail({ item, onManageSupplier }) {
  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="start">
        <Box>
          <Flex align="center" gap="2">
            <Text size="4" weight="bold">{item.supplier_ref}</Text>
            {item.is_preferred && <Badge color="amber" variant="soft">Préféré</Badge>}
          </Flex>
          <Flex align="center" gap="2" mt="1">
            <Text size="2" color="gray">{item.supplier_name}</Text>
            <Button size="1" variant="soft" color="gray" onClick={() => onManageSupplier(item.supplier_id)}>
              <Truck size={12} /> Gérer ce fournisseur
            </Button>
          </Flex>
        </Box>
        {item.product_url && /^https?:\/\//i.test(item.product_url) && (
          <a href={item.product_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--blue-9)' }}>
            <Text size="1">Fiche produit</Text><ExternalLink size={13} />
          </a>
        )}
      </Flex>

      <Box style={{ border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-3)', padding: 14 }}>
        <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: 10 }}>Liaison pièce</Text>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Text size="2" color="gray">Référence interne</Text>
            <Flex align="center" gap="1">
              <Badge variant="soft" color="blue" size="2">{item.internal_ref}</Badge>
              <IconButton size="1" variant="ghost" color="gray" title="Voir la pièce" asChild>
                <RouterLink to={`/stock?tab=parts&q=${encodeURIComponent(item.internal_ref)}`}>
                  <ExternalLink size={12} />
                </RouterLink>
              </IconButton>
            </Flex>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">Fabricant</Text>
            <Text size="2">{item.manufacturer_name}</Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">Référence fabricant</Text>
            <Badge variant="soft" color="gray" size="2">{item.manufacturer_ref}</Badge>
          </Flex>
          {item.label && (
            <Flex justify="between" align="center">
              <Text size="2" color="gray">Désignation</Text>
              <Text size="2">{item.label}</Text>
            </Flex>
          )}
        </Flex>
      </Box>

      <Box style={{ border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-3)', padding: 14 }}>
        <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: 10 }}>Conditions d&apos;achat</Text>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Text size="2" color="gray">Prix unitaire</Text>
            <Text size="2">{item.unit_price != null ? `${item.unit_price} €` : '-'}</Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">Quantité minimale</Text>
            <Text size="2">{item.min_order_quantity ?? '-'}</Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">Délai de livraison</Text>
            <Text size="2">{item.delivery_time_days != null ? `${item.delivery_time_days} j` : '-'}</Text>
          </Flex>
        </Flex>
      </Box>

      <PriceStatsSection partId={item.part_id} supplierId={item.supplier_id} />
    </Flex>
  );
}

SupplierPartRefDetail.propTypes = {
  item: PropTypes.object.isRequired,
  onManageSupplier: PropTypes.func.isRequired,
};
