import React from 'react';
import logoImg from '../assets/logo.jpg';

export default function KitsuLogo({ size = 36, className = '', glow = true }) {
  return (
    <div
      className={`kitsulogo-box ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: '#020216',
        border: '1.5px solid rgba(0, 231, 255, 0.45)',
        boxShadow: glow
          ? '0 0 14px rgba(0, 231, 255, 0.4), inset 0 0 6px rgba(0, 82, 255, 0.25)'
          : 'none',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <img
        src={logoImg}
        alt="KitsuMix Kitsune Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
}
