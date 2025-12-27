export const Card = ({ children, style, ...props }) => {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '24px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, style, ...props }) => {
  return (
    <div
      style={{
        marginBottom: '16px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, style, ...props }) => {
  return (
    <h2
      style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1e293b',
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </h2>
  );
};

export const CardContent = ({ children, style, ...props }) => {
  return (
    <div style={style} {...props}>
      {children}
    </div>
  );
};