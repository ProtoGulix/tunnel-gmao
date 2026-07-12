/**
 * @fileoverview Détail d'un panier fournisseur (panel inline)
 *
 * En mode négociation (detail.edit_lines === true, calculé par le backend) :
 * sélection de lignes, édition prix/quantité, délai de livraison.
 *
 * @module components/purchase/SupplierOrderDetail
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Separator, Text } from '@radix-ui/themes';
import { Building2, Clock, Save } from 'lucide-react';
import { useState } from 'react';
import { exportSupplierOrderEmail } from '@/api/supplierOrders';
import LoadingState from '@/components/ui/LoadingState';
import StatusCallout from '@/components/ui/StatusCallout';
import { useSupplierOrderStatuses } from '@/hooks/purchase/useSupplierOrders';
import { useSupplierOrderDetail } from '@/hooks/purchase/useSupplierOrderDetail';
import SupplierOrderHeader from '@/components/purchase/SupplierOrderHeader';
import SupplierOrderLines from '@/components/purchase/SupplierOrderLines';

const AGE_COLOR = { gray: 'gray', orange: 'orange', red: 'red' };

function DetailRow({ label, children }) {
  return (
    <Flex align="start" gap="3" py="1">
      <Text size="2" color="gray" style={{ minWidth: 160, flexShrink: 0 }}>{label}</Text>
      <Box style={{ flex: 1 }}>{children}</Box>
    </Flex>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function DeliveryDateField({ value, onChange, dirty, onSave, saving }) {
  return (
    <Flex align="center" gap="2">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 'var(--font-size-2)',
          padding: '2px 6px',
          borderRadius: 'var(--radius-2)',
          border: '1px solid var(--gray-6)',
          background: 'var(--color-background)',
          color: 'var(--gray-12)',
        }}
      />
      {dirty && (
        <Button size="1" variant="soft" color="blue" loading={saving} onClick={onSave}>
          <Save size={11} /> Enregistrer
        </Button>
      )}
    </Flex>
  );
}

DeliveryDateField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  dirty: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default function SupplierOrderDetail({ orderId, onDelete, onExportCsv, onStatusChange }) {
  const [emailError, setEmailError] = useState(null);

  const handleExportEmail = async (id) => {
    setEmailError(null);
    try {
      const result = await exportSupplierOrderEmail(id);
      if (!result.supplier_email) {
        setEmailError('Aucun email fournisseur configuré pour cette commande.');
        return;
      }

      // Reconstruire le mailto à partir des champs texte brut (seul format fiable pour Outlook).
      // On n'utilise pas mailto_url fourni par le backend car il peut dépasser la limite de
      // longueur tolérée par certains clients mail (Outlook coupe à ~2 000 caractères).
      const subject = encodeURIComponent(result.subject || '');
      const body = encodeURIComponent(result.body_text || '');
      const mailtoUrl = `mailto:${result.supplier_email}?subject=${subject}&body=${body}`;

      // <a>.click() est la seule méthode qui déclenche fiablement le client mail
      // (window.location.href et window.open sont bloqués ou ignorés par certains navigateurs).
      const a = document.createElement('a');
      a.href = mailtoUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('[SupplierOrderDetail] Erreur export email:', err);
      setEmailError('Erreur lors de la génération de l\'email.');
    }
  };
  const { map: statuses } = useSupplierOrderStatuses();
  const {
    detail, transitions, loading, statusUpdating, statusError,
    lineDrafts, savingLines, lineErrors,
    deliveryDate, setDeliveryDate, savingDelivery,
    handleStatusChange, handleLineChange, handleDeliverySave,
  } = useSupplierOrderDetail(orderId, onStatusChange);

  if (loading) return <LoadingState fullscreen={false} message="Chargement..." />;
  if (!detail) return null;

  const statusInfo = statuses[detail.status] ?? { label: detail.status, color: 'gray' };
  const currentDelivery = detail.expected_delivery_date ? detail.expected_delivery_date.slice(0, 10) : '';

  return (
    <Box p="4">
      <Flex direction="column" gap="3">

        {statusError && <StatusCallout type="error">{statusError}</StatusCallout>}
        {emailError && <StatusCallout type="error">{emailError}</StatusCallout>}

        <SupplierOrderHeader
          detail={detail}
          statusInfo={statusInfo}
          transitions={transitions}
          statuses={statuses}
          statusUpdating={statusUpdating}
          onStatusChange={handleStatusChange}
          onExportCsv={onExportCsv}
          onExportEmail={handleExportEmail}
          onDelete={onDelete}
        />

        <Separator size="4" />

        <Flex gap="4" wrap="wrap">
          {detail.supplier && (detail.supplier.contact_name || detail.supplier.email) && (
            <Box style={{ flex: '1 1 240px' }}>
              <Flex align="center" gap="2" mb="2">
                <Building2 size={14} color="var(--gray-9)" />
                <Text size="2" weight="bold" color="gray">Contact</Text>
              </Flex>
              <Flex direction="column" gap="1">
                {detail.supplier.contact_name && <Text size="2">{detail.supplier.contact_name}</Text>}
                {detail.supplier.email && <Text size="1" color="gray">{detail.supplier.email}</Text>}
              </Flex>
            </Box>
          )}

          <Box style={{ flex: '1 1 240px' }}>
            {detail.total_amount != null && (
              <DetailRow label="Montant total">
                <Text size="2" weight="bold">{Number(detail.total_amount).toFixed(2)} €</Text>
              </DetailRow>
            )}
            {detail.ordered_at && (
              <DetailRow label="Commandé le">
                <Text size="2">{new Date(detail.ordered_at).toLocaleDateString('fr-FR')}</Text>
              </DetailRow>
            )}
            <DetailRow label="Livraison prévue">
              {detail.edit_lines
                ? <DeliveryDateField value={deliveryDate} onChange={setDeliveryDate} dirty={deliveryDate !== currentDelivery} onSave={handleDeliverySave} saving={savingDelivery} />
                : <Text size="2">{detail.expected_delivery_date ? new Date(detail.expected_delivery_date).toLocaleDateString('fr-FR') : '—'}</Text>
              }
            </DetailRow>
            <DetailRow label="Créée le">
              <Flex align="center" gap="2">
                <Text size="2" color="gray">
                  {detail.created_at ? new Date(detail.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </Text>
                {detail.is_blocking && (
                  <Badge color={AGE_COLOR[detail.age_color] || 'gray'} variant="soft" size="1">
                    <Clock size={10} /> {detail.age_days}j
                  </Badge>
                )}
              </Flex>
            </DetailRow>
          </Box>
        </Flex>

        {detail.lines?.length > 0 && (
          <>
            <Separator size="4" />
            <SupplierOrderLines
              lines={detail.lines}
              isNegotiating={!!detail.edit_lines}
              lineDrafts={lineDrafts}
              savingLines={savingLines}
              lineErrors={lineErrors}
              onChangeDraft={handleLineChange}
            />
          </>
        )}

      </Flex>
    </Box>
  );
}

SupplierOrderDetail.propTypes = {
  orderId: PropTypes.string,
  onDelete: PropTypes.func,
  onExportCsv: PropTypes.func,
  onStatusChange: PropTypes.func,
  onExportEmail: PropTypes.func,
};
