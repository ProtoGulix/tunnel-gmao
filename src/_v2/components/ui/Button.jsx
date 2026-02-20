import React from 'react';

export const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  ...props 
}, ref) => {
  const baseStyles = {
    fontWeight: '600',
    borderRadius: '6px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? '#cbd5e1' : '#007bff',
      color: 'white',
      ':hover': !disabled && { backgroundColor: '#0056b3' },
    },
    secondary: {
      backgroundColor: disabled ? '#e2e8f0' : '#6c757d',
      color: 'white',
      ':hover': !disabled && { backgroundColor: '#5a6268' },
    },
    success: {
      backgroundColor: disabled ? '#cbd5e1' : '#28a745',
      color: 'white',
      ':hover': !disabled && { backgroundColor: '#218838' },
    },
    warning: {
      backgroundColor: disabled ? '#cbd5e1' : '#ffc107',
      color: '#212529',
      ':hover': !disabled && { backgroundColor: '#e0a800' },
    },
    danger: {
      backgroundColor: disabled ? '#cbd5e1' : '#dc3545',
      color: 'white',
      ':hover': !disabled && { backgroundColor: '#c82333' },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? '#94a3b8' : '#007bff',
      ':hover': !disabled && { backgroundColor: '#f1f5f9' },
    },
  };

  const sizes = {
    small: { padding: '6px 12px', fontSize: '14px' },
    medium: { padding: '10px 20px', fontSize: '16px' },
    large: { padding: '14px 28px', fontSize: '18px' },
  };

  const style = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <button ref={ref} style={style} disabled={disabled} {...props}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';