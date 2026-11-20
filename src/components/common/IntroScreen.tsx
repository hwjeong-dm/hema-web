import React from 'react';

interface IntroScreenProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onBack?: () => void;
}

export default function IntroScreen({ title, message, confirmLabel = '확인', onConfirm, onBack }: IntroScreenProps) {
  const back = onBack ?? onConfirm;
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F4F6' }}>
      <div style={{ height: 56, flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button onClick={back} style={{ padding: 10, position: 'absolute', left: 0 }}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: '#191F28' }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <p style={{
          fontSize: 'var(--fs-label)', lineHeight: 1.75, color: '#4E5968',
          whiteSpace: 'pre-line', margin: 0, textAlign: 'left',
        }}>
          {message}
        </p>
      </div>
      <div style={{ padding: '16px 20px 32px', flexShrink: 0 }}>
        <button
          onClick={onConfirm}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 12,
            background: '#2C74DB', color: '#fff',
            fontSize: 'var(--fs-base)', fontWeight: 700,
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
