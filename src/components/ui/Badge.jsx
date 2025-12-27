import { COLOR_PALETTE } from '../../config/colorPalette';

export const Badge = ({ children, variant = 'default', style, ...props }) => {
  const variants = {
    default: { backgroundColor: COLOR_PALETTE.textSecondary, color: 'white' },
    primary: { backgroundColor: COLOR_PALETTE.primary, color: 'white' },       // Bleu industriel
    success: { backgroundColor: COLOR_PALETTE.success, color: 'white' },       // Vert OK/clôturé
    warning: { backgroundColor: COLOR_PALETTE.warning, color: 'white' },       // Orange attente
    danger: { backgroundColor: COLOR_PALETTE.error, color: 'white' },          // Rouge bloqué
    info: { backgroundColor: COLOR_PALETTE.primary, color: 'white' },          // Bleu industriel
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: '500',
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};