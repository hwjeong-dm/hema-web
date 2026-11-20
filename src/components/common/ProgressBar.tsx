import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
}

export default function ProgressBar({ value, max, label, color = 'var(--color-primary)' }: ProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
          {label}
        </div>
      )}
      <div style={{
        height: 10, background: '#E0E5EC', borderRadius: 999, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color,
          borderRadius: 999,
          transition: 'width 0.01s linear',
        }} />
      </div>
    </div>
  );
}
