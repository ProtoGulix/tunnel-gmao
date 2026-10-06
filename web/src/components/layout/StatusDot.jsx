/**
 * @fileoverview Point d'état serveur (latence/santé) avec tooltip, footer sidebar.
 *
 * @module components/layout/StatusDot
 */

import PropTypes from 'prop-types';

/**
 * @component
 */
export default function StatusDot({ serverStatus, statusColorMap }) {
  const latencyLabel = serverStatus.latencyMs !== null
    ? `${Math.round(serverStatus.latencyMs)} ms`
    : 'N/A';
  const lastCheckedLabel = serverStatus.lastChecked
    ? new Date(serverStatus.lastChecked).toLocaleString()
    : 'N/A';
  const statusColor = statusColorMap[serverStatus.health] || statusColorMap.unknown;
  const statusHaloColor = statusColor.startsWith('rgba')
    ? statusColor.replace(/0\.\d+\)$/, '0.08)')
    : statusColor;
  const statusTooltip = `Latence: ${latencyLabel} | API: ${serverStatus.online ? 'OK' : 'KO'} | Dernier check: ${lastCheckedLabel}`;

  return (
    <span
      title={statusTooltip}
      aria-label={statusTooltip}
      style={{
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        background: statusColor,
        boxShadow: `0 0 0 4px ${statusHaloColor}`,
        opacity: 0.7
      }}
    />
  );
}

StatusDot.propTypes = {
  serverStatus: PropTypes.shape({
    online: PropTypes.bool.isRequired,
    health: PropTypes.string.isRequired,
    latencyMs: PropTypes.number,
    lastChecked: PropTypes.string,
  }).isRequired,
  statusColorMap: PropTypes.objectOf(PropTypes.string).isRequired,
};
