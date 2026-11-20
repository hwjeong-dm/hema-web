import React from 'react';

interface IconProps { size?: number }

function IconBg({ size = 48, children }: { size?: number; children: React.ReactNode }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#F2F4F6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

export function IconVPA({ size = 48 }: IconProps) {
  return (
    <IconBg size={size}>
      <svg width={size * 0.7} height={size * 0.5} viewBox="0 0 36 18" fill="none">
        <text x="18" y="14" textAnchor="middle" fontFamily="sans-serif" fontSize="16" fontWeight="700" fill="#2C74DB">A-B</text>
      </svg>
    </IconBg>
  );
}

export function IconMST({ size = 48 }: IconProps) {
  return (
    <IconBg size={size}>
      <svg width={size * 0.88} height={size * 0.88} viewBox="0 0 48 48" fill="none">
        <circle cx="17" cy="17" r="5.25" fill="#51AAE3"/>
        <rect x="26.1" y="12.1" width="9.8" height="9.8" fill="#FFCD71"/>
        <circle cx="17" cy="31" r="5.25" fill="#6BAD9B"/>
        <path d="M31.665,26.972L31.074,27.562L30.484,26.972C29.321,25.809 27.435,25.809 26.272,26.972C25.109,28.135 25.109,30.021 26.272,31.183L26.863,31.774L31.074,35.985L35.286,31.774L35.876,31.183C37.039,30.02 37.039,28.135 35.876,26.972C34.713,25.809 32.828,25.809 31.665,26.972Z" fill="#FF7364"/>
      </svg>
    </IconBg>
  );
}

export function IconSPS({ size = 48 }: IconProps) {
  return (
    <IconBg size={size}>
      <svg width={size * 0.6} height={size * 0.35} viewBox="0 0 36 21" fill="none">
        <circle cx="8" cy="10.5" r="8" fill="#2C74DB"/>
        <circle cx="28" cy="10.5" r="8" fill="#D0583C"/>
      </svg>
    </IconBg>
  );
}

export function IconFER({ size = 48 }: IconProps) {
  return (
    <IconBg size={size}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="#2C74DB" strokeWidth="2"/>
        <circle cx="9.5" cy="11" r="2" fill="#2C74DB"/>
        <circle cx="18.5" cy="11" r="2" fill="#2C74DB"/>
        <path d="M8 17.5C9.5 20 18.5 20 20 17.5" stroke="#2C74DB" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </IconBg>
  );
}

export function IconComplete({ size = 48 }: IconProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#03B26C',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M4 12L10 18L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export function IconInProgress({ size = 48 }: IconProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid #114390',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', flexShrink: 0,
    }}/>
  );
}
