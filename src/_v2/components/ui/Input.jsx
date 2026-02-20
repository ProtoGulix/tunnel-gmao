import React from 'react';
import * as Label from '@radix-ui/react-label';

export const Input = React.forwardRef(({ 
  label, 
  error,
  fullWidth = true,
  ...props 
}, ref) => {
  const id = props.id || props.name;

  return (
    <div style={{ marginBottom: '20px', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <Label.Root 
          htmlFor={id}
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: error ? '#dc3545' : '#334155',
            fontSize: '14px',
          }}
        >
          {label}
        </Label.Root>
      )}
      <input
        ref={ref}
        id={id}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '6px',
          border: `1px solid ${error ? '#dc3545' : '#e2e8f0'}`,
          fontSize: '16px',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? '#dc3545' : '#007bff';
          e.target.style.boxShadow = `0 0 0 3px ${error ? 'rgba(220, 53, 69, 0.1)' : 'rgba(0, 123, 255, 0.1)'}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#dc3545' : '#e2e8f0';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <span style={{
          display: 'block',
          marginTop: '4px',
          fontSize: '14px',
          color: '#dc3545',
        }}>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';