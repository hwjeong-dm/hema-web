import React from 'react';

interface ModalProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
}

export default function Modal({ title, message, icon, confirmLabel = '확인', onConfirm, cancelLabel, onCancel }: ModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '32px 36px',
        maxWidth: 440, width: '90%',
        textAlign: 'left',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {icon && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            {icon}
          </div>
        )}
        <div style={{ fontSize: 'var(--fs-title)', fontWeight: 700, marginBottom: 16, color: '#191F28' }}>
          {title}
        </div>
        <div style={{
          fontSize: 'var(--fs-label)', lineHeight: 1.75, color: '#6B7684',
          whiteSpace: 'pre-line', marginBottom: 28,
        }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 12,
                background: '#F2F4F6', color: '#6B7684',
                fontSize: 'var(--fs-base)', fontWeight: 600,
              }}
            >{cancelLabel || '취소'}</button>
          )}
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 12,
              background: '#2C74DB', color: '#fff',
              fontSize: 'var(--fs-base)', fontWeight: 700,
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
