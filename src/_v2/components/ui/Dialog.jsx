import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          position: 'fixed',
          inset: 0,
          animation: 'fadeIn 150ms ease-out',
          zIndex: 50,
        }}
      />
      <DialogPrimitive.Content
        ref={ref}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '500px',
          maxHeight: '85vh',
          padding: '24px',
          animation: 'slideIn 150ms ease-out',
          zIndex: 51,
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ children, ...props }) => (
  <div style={{ marginBottom: '16px' }} {...props}>
    {children}
  </div>
);

export const DialogTitle = React.forwardRef(({ children, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    style={{
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0,
    }}
    {...props}
  >
    {children}
  </DialogPrimitive.Title>
));

DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef(({ children, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    style={{
      fontSize: '14px',
      color: '#64748b',
      marginTop: '8px',
    }}
    {...props}
  >
    {children}
  </DialogPrimitive.Description>
));

DialogDescription.displayName = 'DialogDescription';

export const DialogClose = DialogPrimitive.Close;