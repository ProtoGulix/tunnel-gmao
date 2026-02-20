export const Alert = ({ children, variant = 'info', style, ...props }) => {
  const variants = {
    info: {
      backgroundColor: '#e7f3ff',
      borderColor: '#007bff',
      color: '#004085',
    },
    success: {
      backgroundColor: '#d4edda',
      borderColor: '#28a745',
      color: '#155724',
    },
    warning: {
      backgroundColor: '#fff3cd',
      borderColor: '#ffc107',
      color: '#856404',
    },
    danger: {
      backgroundColor: '#f8d7da',
      borderColor: '#dc3545',
      color: '#721c24',
    },
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '6px',
        border: `1px solid ${variants[variant].borderColor}`,
        marginBottom: '16px',
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};