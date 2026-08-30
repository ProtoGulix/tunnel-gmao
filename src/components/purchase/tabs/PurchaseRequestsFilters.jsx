/**
 * Filtres de la liste des demandes d'achat (statut, urgence).
 * @module components/purchase/tabs/PurchaseRequestsFilters
 */
import { Flex, Select } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import { PURCHASE_URGENCY_LIST } from '@/config/purchaseConfig';

export function PrFilters({ status, setStatus, statuses, urgency, setUrgency }) {
  return (
    <Flex gap="2" align="center">
      <Select.Root
        value={status || '__all__'}
        onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}
      >
        <Select.Trigger
          placeholder="Tous les statuts"
          aria-label="Filtrer par statut"
          variant={status ? 'soft' : 'surface'}
          color={status ? 'blue' : undefined}
        />
        <Select.Content>
          <Select.Item value="__all__">Tous les statuts</Select.Item>
          {statuses.map((s) => (
            <Select.Item key={s.code} value={s.code}>
              {s.label}{s.count != null ? ` (${s.count})` : ''}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        value={urgency || '__all__'}
        onValueChange={(v) => setUrgency(v === '__all__' ? '' : v)}
      >
        <Select.Trigger
          placeholder="Toutes urgences"
          aria-label="Filtrer par urgence"
          variant={urgency ? 'soft' : 'surface'}
          color={urgency ? 'orange' : undefined}
        />
        <Select.Content>
          <Select.Item value="__all__">Toutes urgences</Select.Item>
          {PURCHASE_URGENCY_LIST.map((u) => (
            <Select.Item key={u.value} value={u.value}>{u.label}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

PrFilters.propTypes = {
  status: PropTypes.string,
  setStatus: PropTypes.func.isRequired,
  statuses: PropTypes.array.isRequired,
  urgency: PropTypes.string,
  setUrgency: PropTypes.func.isRequired,
};
