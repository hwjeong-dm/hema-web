import React from 'react';

export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #E5E8EB',
        borderTopColor: '#2C74DB',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
