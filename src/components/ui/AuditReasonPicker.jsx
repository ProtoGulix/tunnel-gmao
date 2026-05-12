import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, TextArea, Spinner } from '@radix-ui/themes';
import { fetchAuditReasons } from '@/api/auditReasons';

/**
 * Sélecteur de raison d'audit — à intégrer dans tous les formulaires mutatifs.
 *
 * Expose { reason_code, reason_text } au parent via onChange.
 * Charge les raisons en arrière-plan depuis /audit/reasons (cache session).
 */
export default function AuditReasonPicker({ entityType, value, onChange, required = true }) {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAuditReasons(entityType)
      .then((data) => { if (!cancelled) { setReasons(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError('Impossible de charger les raisons'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [entityType]);

  const handleCodeSelect = (code) => {
    onChange({ reason_code: code, reason_text: code !== 'OTHER' ? null : (value.reason_text ?? '') });
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

  return (
    <Box>
      <Text as="div" size="1" weight="bold" mb="2">
        Raison de la modification {required && <Text color="red">*</Text>}
      </Text>

      <Flex gap="2" wrap="wrap">
        {reasons.map((reason) => {
          const selected = value.reason_code === reason.code;
          return (
            <button
              key={reason.code}
              type="button"
              onClick={() => handleCodeSelect(reason.code)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: selected
                  ? `2px solid ${reason.color}`
                  : '2px solid transparent',
                background: selected
                  ? `${reason.color}22`
                  : 'var(--gray-3)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: selected ? 700 : 400,
                color: selected ? reason.color : 'var(--gray-11)',
                transition: 'all 0.12s',
                outline: 'none',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: reason.color, flexShrink: 0,
              }} />
              {reason.label}
            </button>
          );
        })}
      </Flex>

      {value.reason_code === 'OTHER' && (
        <Box mt="2">
          <Text as="div" size="1" weight="bold" mb="1">
            Préciser la raison <Text color="red">*</Text>
          </Text>
          <TextArea
            placeholder="Décrivez la raison…"
            value={value.reason_text ?? ''}
            onChange={(e) => onChange({ ...value, reason_text: e.target.value })}
            rows={2}
            size="2"
          />
        </Box>
      )}
    </Box>
  );
}

AuditReasonPicker.propTypes = {
  entityType: PropTypes.oneOf(['intervention', 'request', 'purchase_request', 'task', 'action']).isRequired,
  value: PropTypes.shape({
    reason_code: PropTypes.string,
    reason_text: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};
