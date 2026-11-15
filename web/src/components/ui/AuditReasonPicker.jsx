import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Select, Text, TextArea, Spinner } from '@radix-ui/themes';
import { fetchAuditReasons } from '@/api/auditReasons';
import { filterReasonsByDecision } from '@/lib/api/auditReasonFilter';

/**
 * @param {Object}   props
 * @param {string}   props.entityType  - Type d'entité (pour le fetch fallback)
 * @param {Array}    [props.reasons]   - Reasons pré-chargées depuis audit.reasons du GET.
 *                                       Si fourni, le fetch /audit/reasons est ignoré.
 * @param {string}   [props.decisionType] - ne propose que les motifs de cette décision (ex : deleted)
 * @param {Object}   props.value
 * @param {Function} props.onChange
 * @param {boolean}  [props.required]
 */
export default function AuditReasonPicker({ entityType, reasons: reasonsProp, decisionType, value, onChange, required = true }) {
  const [fetchedReasons, setFetchedReasons] = useState([]);
  const [loading, setLoading] = useState(!reasonsProp);
  const [error, setError] = useState(null);

  // Si reasons est fourni depuis le cache GET, on ne fetch pas
  useEffect(() => {
    if (reasonsProp !== undefined) return;
    let cancelled = false;
    setLoading(true);
    fetchAuditReasons(entityType)
      .then((data) => { if (!cancelled) { setFetchedReasons(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Impossible de charger les raisons'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [entityType, reasonsProp]);

  const reasons = filterReasonsByDecision(reasonsProp ?? fetchedReasons, decisionType);
  const selectedReason = reasons.find((r) => r.code === value.reason_code);
  const requiresText = selectedReason?.requires_text ?? false;

  const handleCodeSelect = (code) => {
    const r = reasons.find((x) => x.code === code);
    onChange({ reason_code: code, reason_text: null, requires_text: r?.requires_text ?? false });
  };

  if (loading) {
    return (
      <Flex align="center" gap="2" style={{ padding: '0.5rem 0' }}>
        <Spinner size="1" />
        <Text size="1" color="gray">Chargement des raisons…</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: '8px 12px' }}>
        <Text size="1" color="red">{error}</Text>
      </Box>
    );
  }

  if (decisionType && reasons.length === 0) {
    return (
      <Box style={{ background: 'var(--amber-3)', border: '1px solid var(--amber-7)', borderRadius: 6, padding: '8px 12px' }}>
        <Text size="1" color="amber">Aucun motif disponible pour cette décision. Un administrateur doit en ajouter.</Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap="2">
      <Box>
        <Text as="div" size="1" weight="bold" mb="1">
          Raison {required && <Text color="red">*</Text>}
        </Text>
        <Select.Root value={value.reason_code ?? ''} onValueChange={handleCodeSelect}>
          <Select.Trigger
            placeholder="Sélectionner une raison…"
            style={{
              width: '100%',
              ...(selectedReason ? {
                borderColor: selectedReason.color,
                boxShadow: `0 0 0 1px ${selectedReason.color}44`,
              } : {}),
            }}
          />
          <Select.Content>
            {reasons.map((reason) => (
              <Select.Item key={reason.code} value={reason.code}>
                <Flex align="center" gap="2">
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: reason.color, flexShrink: 0, display: 'inline-block',
                  }} />
                  {reason.label}
                </Flex>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>

      <Box>
        <Text as="div" size="1" weight="bold" mb="1">
          Précision
          {requiresText ? <Text color="red"> *</Text> : <Text size="1" color="gray" weight="regular"> (optionnel)</Text>}
        </Text>
        <TextArea
          placeholder={requiresText ? 'Décrivez la raison…' : 'Ajouter un commentaire…'}
          value={value.reason_text ?? ''}
          onChange={(e) => onChange({ ...value, reason_text: e.target.value || null })}
          rows={2}
          size="2"
        />
      </Box>
    </Flex>
  );
}

AuditReasonPicker.propTypes = {
  entityType: PropTypes.oneOf(['intervention', 'request', 'purchase_request', 'task', 'action', 'supplier_order', 'equipement', 'preventive_occurrence']).isRequired,
  reasons: PropTypes.array,
  decisionType: PropTypes.string,
  value: PropTypes.shape({
    reason_code: PropTypes.string,
    reason_text: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};
